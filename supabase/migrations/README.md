# Supabase Migrations — ReserNova Web Booking

This directory holds the 8 forward-only schema migrations + 4 `SECURITY DEFINER` RPCs that power the public web booking surface. All changes are **additive** — nothing here modifies or drops existing data outside of CHECK constraint updates.

## Apply order

Migrations apply in lexical order (Supabase CLI default — `supabase db push`).

| # | File | Purpose | Dependencies |
|---|---|---|---|
| 011 | `011_web_booking_columns.sql` | Extend `service_providers` with `public_slug`, `web_booking_enabled`, `web_theme`, `web_meta` + slug format CHECK + partial UNIQUE | — |
| 012 | `012_web_bookings_audit.sql` | `web_bookings` audit table + UNIQUE partial index on `idempotency_key` | — |
| 013 | `013_web_rate_limits.sql` | `web_rate_limits` table + `pg_cron` purge every 15 min | — |
| 014 | `014_bookings_source_web.sql` | Extend `bookings.source` CHECK to include `'web'` | — |
| 015 | `015_web_public_views.sql` | PUBLIC VIEWS (`service_providers_public`, `provider_locations_public`) + GRANT to `anon` | 011 |
| 016 | `016_clients_unique_phone.sql` | `UNIQUE(provider_id, phone_number)` on `clients` (pre-flight dedupe check) | — |
| 017 | `017_manage_token.sql` | `generate_manage_token` + `verify_manage_token` (HMAC-SHA256, Vault key) | — |
| 018 | `018_notifications_type_web_booking.sql` | Extend `notifications.type` CHECK to include `'web_booking'` | — |
| 019 | `019_get_web_availability.sql` | RPC: `get_web_availability(slug, service_id, date, staff_id?)` — JSONB envelope, wraps `get_available_slots_v2` | 011, 015 |
| 020 | `020_create_web_booking.sql` | RPC: `create_web_booking(slug, payload, idempotency_key, ip_hash?)` — idempotent, calls `upsert_client_by_phone`, fires `web-booking-notify` via `pg_net` | 011, 012, 014, 015, 016, 017 |
| 021 | `021_cancel_web_booking.sql` | RPC: `cancel_web_booking(manage_token, reason?)` — HMAC-verified, rotates token | 017 |
| 022 | `022_reschedule_web_booking.sql` | RPC: `reschedule_web_booking(manage_token, new_slot_start, new_slot_end)` — HMAC-verified, anti-overlap excluding self, rotates token | 017 |

## Required Vault secrets

Set these in Vault before applying migrations 017 (and before any RPC that uses them in production):

```bash
supabase secrets set WEB_MANAGE_TOKEN_KEY=$(openssl rand -hex 32)
supabase secrets set WEB_BOOKING_SIGNING_SECRET=$(openssl rand -hex 32)
```

Migration 017 will `RAISE EXCEPTION` if `web_manage_token_key` is missing from Vault when invoked.

## Pre-flight for Migration 016

Migration 016 adds `UNIQUE(provider_id, phone_number)` to `clients`. It includes a pre-flight check that fails loudly if duplicates exist. If the pre-flight fails, run:

```sql
SELECT provider_id, phone_number, count(*)
FROM public.clients
WHERE phone_number IS NOT NULL
GROUP BY 1, 2
HAVING count(*) > 1;
```

…and dedupe before re-applying.

## Rollback

Every migration file has a `-- DOWN` section in comments with the exact reverse operations. Per-Appendix A of the blueprint.

## Why no `RETURN QUERY`?

`get_available_slots_v2` (full_dump.sql:1336) returns **JSONB** (`{success, data: [...]}`), not a TABLE. The `get_web_availability` wrapper passes the JSONB envelope straight through. Using `RETURN QUERY SELECT * FROM get_available_slots_v2(...)` (as the original blueprint proposed) is the silent breakage flagged in `15-DATABASE-SCHEMA-REFERENCE.md §15.3`.