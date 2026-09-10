-- Migration 018 — Extend notifications.type CHECK to include 'web_booking'
-- Without this, web-booking-notify Edge Function's INSERT into notifications
-- fails the existing CHECK constraint.
-- The existing trg_send_fcm_push trigger (full_dump.sql:4272) accepts any type;
-- the type is just a discriminator.

BEGIN;

-- ============================================================
-- UP
-- ============================================================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'booking',
    'payment',
    'dispute',
    'reminder',
    'booking_approval',
    'ai_booking',
    'web_booking'
  ));

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
--   ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
--     CHECK (type IN ('booking','payment','dispute','reminder','booking_approval','ai_booking'));

COMMIT;