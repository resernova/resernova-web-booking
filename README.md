# ReserNova Web Booking

Public web booking surface for [ReserNova](https://resernova.com) — B2B SaaS for Moroccan salons, spas, and aesthetic businesses.

`book.resernova.com/<slug>` lets salon customers book appointments in three taps without an account, an app, or a WhatsApp thread. The booking lands in the same `bookings` table consumed by the Flutter mobile dashboard, n8n WhatsApp AI, and reminder cron. **Zero regression on the Flutter app is a hard constraint.**

## Stack

- **Next.js 15** (App Router, RSC, Server Actions) deployed on **Vercel**
- **TypeScript strict**, **Tailwind v4** + **shadcn/ui**
- **React Hook Form** + **Zod**
- **Luxon** (Africa/Casablanca) for Ramadan-aware slot math
- **next-intl** for en / fr / ar-Darija
- **Framer Motion** + **Lottie** for animations
- **Supabase JS v2** (`@supabase/ssr`) talking to the existing production database

## Local development

```bash
pnpm install
cp .env.example .env.local          # fill in real values
pnpm dev                            # http://localhost:3000
```

For Supabase locally (in a separate terminal, in the `resernova-mobile` repo):

```bash
supabase start
supabase db reset                   # applies 001..018
supabase functions serve web-booking-notify
```

## Project layout

```
resernova-web/
├── app/                            # Next.js App Router
│   ├── [slug]/                     # Public routes per salon
│   │   ├── page.tsx                # RSC + ISR 60s
│   │   ├── services/page.tsx
│   │   ├── book/[serviceId]/page.tsx
│   │   ├── book/confirm/[bookingRef]/page.tsx
│   │   ├── book/manage/[token]/page.tsx
│   │   └── legal/page.tsx
│   └── api/public/                 # Route Handlers (BFF)
├── components/{ui,booking,salon,shared}/
├── lib/{supabase,crypto,i18n,validation,theme,utils}/
├── server/{actions,queries}/        # RSC data loaders
├── supabase/
│   ├── migrations/011..018_*.sql   # Database changes (additive only)
│   └── functions/web-booking-notify/index.ts
├── tests/{unit,e2e}/
├── middleware.ts                    # Edge: rate-limit + locale + CSP
└── next.config.ts
```

## Database changes

Eight forward-only migrations in `supabase/migrations/` (lexical apply order):

| # | File | Purpose |
|---|---|---|
| 011 | `web_booking_columns` | Extend `service_providers` with `public_slug`, `web_booking_enabled`, theme/meta |
| 012 | `web_bookings_audit` | Audit table for web bookings (idempotency key, UTM, IP hash) |
| 013 | `web_rate_limits` | Per-IP-per-slug rate limit + 15-min `pg_cron` purge |
| 014 | `bookings_source_web` | Extend `bookings.source` CHECK to include `'web'` |
| 015 | `web_public_views` | PUBLIC VIEWS for tenant lookup (instead of anon RLS) |
| 016 | `clients_unique_phone` | `UNIQUE(provider_id, phone_number)` on `clients` |
| 017 | `manage_token` | HMAC `generate_manage_token` / `verify_manage_token` |
| 018 | `notifications_type_web_booking` | Extend `notifications.type` CHECK to include `'web_booking'` |

Plus four `SECURITY DEFINER` RPCs (called via service-role client):

- `get_web_availability(slug, service_id, date, staff_id?)` — wraps `get_available_slots_v2` with slug→provider guard, returns JSONB
- `create_web_booking(slug, payload, idempotency_key, ip_hash?)` — idempotency dedupe (24h), `upsert_client_by_phone`, anti-overlap, fires `web-booking-notify` via `pg_net`
- `cancel_web_booking(manage_token, reason?)` — HMAC-verified
- `reschedule_web_booking(manage_token, new_slot_start, new_slot_end)` — HMAC-verified, anti-overlap excluding self

Plus one Edge Function: `web-booking-notify` (Deno) — verifies `WEB_BOOKING_SIGNING_SECRET` header, idempotency-checks via `notifications` row, sends Meta Graph API **v22.0** WhatsApp UTILITY template + Resend email with `.ics` attachment, inserts `notifications` row that triggers the existing `trg_send_fcm_push` for the Flutter dashboard.

## Security & compliance

- **Defense in depth:** Vercel Edge Middleware → `web_rate_limits` table → honeypot + min-time-on-page → Zod → RAISE EXCEPTION → HMAC token verification → CSP + nonce.
- **CNDP/Loi 09-08:** IP stored as SHA-256 hash for 24h only; right-to-erasure via `privacy@resernova.com`; explicit WhatsApp opt-in checkbox.
- **No customer accounts:** HMAC-signed manage link in URL hash (`#t=...`), 7-day expiry, regenerated on cancel/reschedule.

## Production

- **Domain:** `book.resernova.com`
- **Staging:** `staging.book.resernova.com` ↔ Supabase `resernova-staging`
- **Preview:** automatic per-PR via Vercel GitHub integration

## License

Proprietary — © ReserNova 2026.