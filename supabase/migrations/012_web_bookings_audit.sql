-- Migration 012 — web_bookings audit table
-- Per-booking audit row written by create_web_booking RPC. Captures
--   - slug (tenant)
--   - ip_hash (SHA-256 of client IP — 24h retention only, see Migration 013 purge)
--   - user_agent, referrer (raw — operator visibility)
--   - utm (jsonb — acquisition attribution)
--   - idempotency_key (uuid v4 from client — 24h dedupe window)
-- No anon RLS — service_role only. Used for analytics + idempotency.

BEGIN;

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS public.web_bookings (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  slug            text NOT NULL,
  ip_hash         text,
  user_agent      text,
  referrer        text,
  utm             jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_bookings_booking_id
  ON public.web_bookings(booking_id);

CREATE INDEX IF NOT EXISTS idx_web_bookings_created_at
  ON public.web_bookings(created_at);

-- Idempotency: same key within 24h dedupes. Partial unique index
-- allows NULL keys (anonymous bot traffic without idempotency).
CREATE UNIQUE INDEX IF NOT EXISTS uq_web_bookings_idempotency_key
  ON public.web_bookings(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.web_bookings ENABLE ROW LEVEL SECURITY;

-- No anon / authenticated policies — service_role only.
-- Supabase grants table-level access to service_role by default when RLS is enabled.

COMMENT ON TABLE public.web_bookings IS 'Per-booking audit row written by create_web_booking RPC. Idempotency via uq_web_bookings_idempotency_key. Service-role only.';
COMMENT ON COLUMN public.web_bookings.ip_hash IS 'SHA-256 of client IP. Purged after 24h by Migration 013 cron.';
COMMENT ON COLUMN public.web_bookings.idempotency_key IS 'UUID v4 from client (sessionStorage). 24h dedupe window.';

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   DROP TABLE IF EXISTS public.web_bookings;

COMMIT;