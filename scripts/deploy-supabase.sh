#!/usr/bin/env bash
# ============================================================================
# ReserNova Web Booking — Supabase deployment script
# Run from a workstation with `supabase login` already done and `supabase` CLI
# installed. The script is idempotent where possible; reads secrets from
# environment variables; runs migrations in lexical order; deploys Edge
# Functions; seeds a pilot salon; prints a smoke-test checklist.
#
# Usage:
#   # 1. Dry-run: prints every command without executing
#   ./scripts/deploy-supabase.sh --dry-run --env staging
#
#   # 2. Real run: applies migrations + deploys edge functions
#   ./scripts/deploy-supabase.sh --env staging
#
# Required env vars (set in your shell, or pass via .env.deploy):
#   PROJECT_REF              # e.g. resernova-staging
#   SALON_PROVIDER_ID        # uuid of the salon to enable (Phase F)
#   SALON_DEMO_SLUG          # default 'salon-demo'
#   SUPABASE_DB_URL          # psql connection string (postgres role)
#
# Optional env vars:
#   RESEND_API_KEY           # for web-booking-notify
#   RESEND_FROM              # default 'ReserNova <bookings@resernova.com>'
#   WHATSAPP_ENABLED         # default false; flip true after Meta template approved
#   VERCEL_TOKEN             # for the optional Vercel env step (Phase G)
# ============================================================================

set -euo pipefail

# ---------- args ----------
ENV_NAME="${ENV_NAME:-staging}"
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --env=*)   ENV_NAME="${arg#*=}" ;;
    *) echo "Unknown flag: $arg"; exit 2 ;;
  esac
done

run() {
  if [ "$DRY_RUN" = true ]; then
    printf '   $ %s\n' "$*"
  else
    printf '   $ %s\n' "$*"
    "$@"
  fi
}

# ---------- pre-flight ----------
echo ""
echo "▶ ReserNova Web Booking — Supabase deploy (env=$ENV_NAME, dry_run=$DRY_RUN)"
echo ""

: "${PROJECT_REF:?PROJECT_REF is required (e.g. resernova-staging)}"
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required (postgres role psql URL)}"

case "$ENV_NAME" in
  local|staging|prod) ;;
  *) echo "Unknown --env=$ENV_NAME (expected: local | staging | prod)"; exit 2 ;;
esac

if [ "$DRY_RUN" = false ]; then
  if ! command -v supabase >/dev/null 2>&1; then
    echo "✗ supabase CLI not found. Install: https://supabase.com/docs/guides/cli"
    exit 2
  fi
  if ! command -v psql >/dev/null 2>&1; then
    echo "✗ psql not found. Install postgresql-client."
    exit 2
  fi
  if ! command -v openssl >/dev/null 2>&1; then
    echo "✗ openssl not found. Install openssl."
    exit 2
  fi
fi

# ---------- A. Extensions ----------
echo ""
echo "═══ Phase A — Verify / install extensions ═══"
run psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;"
run psql "$SUPABASE_DB_URL" -tA -c "
  SELECT extname || ' ' || extversion
  FROM pg_extension
  WHERE extname IN ('pg_cron','pg_net','supabase_vault','pgcrypto','uuid-ossp')
  ORDER BY extname;
"

# ---------- B. Vault secrets ----------
echo ""
echo "═══ Phase B — Vault secrets ═══"
WEB_MGMT_KEY="${WEB_MANAGE_TOKEN_KEY:-$(openssl rand -hex 32 2>/dev/null || true)}"
WEB_SIGN_KEY="${WEB_BOOKING_SIGNING_SECRET:-$(openssl rand -hex 32 2>/dev/null || true)}"

# If keys are missing, generate them (only in dry-run mode are they NOT set)
if [ -z "${WEB_MGMT_KEY:-}" ] || [ -z "${WEB_SIGN_KEY:-}" ]; then
  if [ "$DRY_RUN" = false ]; then
    echo "✗ Could not generate Vault keys (openssl missing or random source failed)"
    exit 1
  fi
fi

run supabase secrets set "WEB_MANAGE_TOKEN_KEY=${WEB_MGMT_KEY}"
run supabase secrets set "WEB_BOOKING_SIGNING_SECRET=${WEB_SIGN_KEY}"
run psql "$SUPABASE_DB_URL" -tA -c "
  SELECT name, length(decrypted_secret)
  FROM vault.decrypted_secrets
  WHERE name IN ('web_manage_token_key','web_booking_signing_secret')
  ORDER BY name;
"

# ---------- C. Clients dedupe pre-flight ----------
echo ""
echo "═══ Phase C — Clients dedupe pre-flight (Migration 016) ═══"
DUPES=$(run psql "$SUPABASE_DB_URL" -tA -c "
  SELECT count(*) FROM (
    SELECT provider_id, phone_number
    FROM public.clients
    WHERE phone_number IS NOT NULL
    GROUP BY 1, 2
    HAVING count(*) > 1
  ) d;
" | tr -d ' ')

if [ "$DUPES" -gt 0 ] 2>/dev/null && [ "$DRY_RUN" = false ]; then
  echo "✗ Found $DUPES duplicate (provider_id, phone_number) groups in public.clients"
  echo "  Migration 016 will refuse to apply. Dedupe first, then re-run."
  echo "  SELECT provider_id, phone_number, count(*) FROM public.clients"
  echo "  WHERE phone_number IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;"
  echo
  echo "  Cleanup query:"
  echo "    WITH ranked AS ("
  echo "      SELECT id, ROW_NUMBER() OVER (PARTITION BY provider_id, phone_number ORDER BY id) AS rn"
  echo "      FROM public.clients WHERE phone_number IS NOT NULL"
  echo "    ) DELETE FROM public.clients WHERE id IN (SELECT id FROM ranked WHERE rn > 1);"
  exit 1
fi

# ---------- D. Migrations 011..022 ----------
echo ""
echo "═══ Phase D — Apply migrations 011..022 ═══"
MIG_DIR="$(cd "$(dirname "$0")/.." && pwd)/supabase/migrations"
if [ ! -d "$MIG_DIR" ]; then
  echo "✗ Migrations dir not found: $MIG_DIR"
  exit 1
fi

# Sort numerically lexically (011_, 012_, ... 022_)
for m in $(ls "$MIG_DIR"/0*.sql | sort); do
  echo "  → $(basename "$m")"
  run psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$m"
done

# ---------- E. Edge Function ----------
echo ""
echo "═══ Phase E — Edge Function deploy + env ═══"
run supabase functions deploy web-booking-notify
# Phase 2: supabase functions deploy web-booking-reminder

# Edge Function env vars
: "${RESEND_API_KEY:?RESEND_API_KEY is required (Phase E)}"
: "${RESEND_FROM:=ReserNova <bookings@resernova.com>}"
: "${WHATSAPP_ENABLED:=false}"

run supabase secrets set \
  "RESEND_API_KEY=${RESEND_API_KEY}" \
  "RESEND_FROM_EMAIL=${RESEND_FROM}" \
  "WEB_BOOKING_SIGNING_SECRET=${WEB_SIGN_KEY}" \
  "WHATSAPP_ENABLED=${WHATSAPP_ENABLED}"

# ---------- F. Seed pilot salon ----------
echo ""
echo "═══ Phase F — Seed pilot salon ═══"
SLUG="${SALON_DEMO_SLUG:-salon-demo}"
: "${SALON_PROVIDER_ID:?SALON_PROVIDER_ID is required (Phase F — get it from SELECT id FROM service_providers LIMIT 1;)}"

run psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "
UPDATE public.service_providers
SET
  public_slug         = '${SLUG}',
  web_booking_enabled = true,
  web_description     = COALESCE(web_description, 'Salon de démonstration — ReserNova Web.'),
  web_hero_image_url  = COALESCE(web_hero_image_url, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200'),
  web_theme           = COALESCE(web_theme, '{\"primary\":\"#1C6B6D\",\"primaryLight\":\"#2A9D8F\",\"accent\":\"#25D366\",\"font\":\"inter\"}'::jsonb),
  web_meta            = COALESCE(web_meta, '{}'::jsonb) || jsonb_build_object('updated_at', now()::text),
  updated_at          = now()
WHERE id = '${SALON_PROVIDER_ID}'
RETURNING id, public_slug, web_booking_enabled;"

run psql "$SUPABASE_DB_URL" -tA -c "
SELECT 'services published: ' || count(*) FROM public.services WHERE provider_id = '${SALON_PROVIDER_ID}' AND status = 'published';
SELECT 'locations:         ' || count(*) FROM public.provider_locations WHERE provider_id = '${SALON_PROVIDER_ID}';
"

# ---------- G. Vercel env ----------
echo ""
echo "═══ Phase G — Vercel env vars (optional) ═══"
if command -v vercel >/dev/null 2>&1; then
  run vercel link --project resernova-web --yes
  run vercel env add NEXT_PUBLIC_SUPABASE_URL "$ENV_NAME" \
    "https://${PROJECT_REF}.supabase.co"
  run vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "$ENV_NAME"
  run vercel env add SUPABASE_SERVICE_ROLE_KEY "$ENV_NAME"
  run vercel env add NEXT_PUBLIC_SITE_URL "$ENV_NAME" \
    "https://${SITE_URL:-book.resernova.com}"
else
  echo "  ⚠ vercel CLI not found; skipping Vercel env step. Set them manually:"
  echo "    NEXT_PUBLIC_SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
  echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste from API settings>"
  echo "    SUPABASE_SERVICE_ROLE_KEY=<paste from API settings>"
  echo "    NEXT_PUBLIC_SITE_URL=https://${SITE_URL:-book.resernova.com}"
fi

# ---------- Verification queries ----------
echo ""
echo "═══ Verification ═══"
run psql "$SUPABASE_DB_URL" -tA -c "
  SELECT '✓ service_providers cols: ' || count(*)::text
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='service_providers'
    AND column_name IN ('public_slug','web_booking_enabled','web_theme','web_meta','web_hero_image_url','web_description');

  SELECT '✓ bookings.source has web: ' ||
    (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'bookings_source_check');

  SELECT '✓ notifications.type has web_booking: ' ||
    (SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'notifications_type_check');

  SELECT '✓ web_rate_limits cron: ' || count(*)::text
  FROM cron.job WHERE jobname = 'purge-web-rate-limits';

  SELECT '✓ pg_net installed: ' || (count(*)::text)
  FROM pg_extension WHERE extname = 'pg_net';

  SELECT '✓ providers_public has demo slug: ' || count(*)::text
  FROM public.service_providers_public WHERE public_slug = '${SLUG}';
"

echo ""
echo "─── DONE ─────────────────────────────────────────────────────"
echo "Next: smoke test"
echo "  1. Open https://${SITE_URL:-book.resernova.com}/${SLUG} in browser"
echo "  2. Walk the booking wizard → reservation lands in public.bookings (source='web')"
echo "  3. web_bookings audit row appears; notifications row appears (type='web_booking')"
echo "  4. Resend dashboard shows the confirmation email"
echo "  5. Flutter app notification bell shows 'Nouvelle réservation web' within ~5s"
echo "──────────────────────────────────────────────────────────────"
