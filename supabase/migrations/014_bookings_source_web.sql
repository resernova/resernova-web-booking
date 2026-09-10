-- Migration 014 — Extend bookings.source CHECK to include 'web'
-- Without this, create_web_booking INSERT fails the existing CHECK.
-- The Flutter mobile app reads source as raw String? (no Dart enum),
-- so the mobile side needs no change.
-- The index idx_bookings_source keeps working unchanged.

BEGIN;

-- ============================================================
-- UP
-- ============================================================

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_source_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_source_check
  CHECK (source IN ('manual', 'whatsapp', 'app', 'web'));

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   ALTER TABLE public.bookings DROP CONSTRAINT bookings_source_check;
--   ALTER TABLE public.bookings ADD CONSTRAINT bookings_source_check
--     CHECK (source IN ('manual', 'whatsapp', 'app'));

COMMIT;