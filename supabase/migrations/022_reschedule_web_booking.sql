-- RPC 022 — reschedule_web_booking
-- HMAC-verified reschedule. Verifies manage_token via Migration 017,
-- validates the new slot (not in past, duration matches, no overlap
-- excluding self), updates time_slot_start/end + booking_date,
-- rotates the manage token.

BEGIN;

CREATE OR REPLACE FUNCTION public.reschedule_web_booking(
  p_manage_token     text,
  p_new_slot_start   timestamp with time zone,
  p_new_slot_end     timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_booking_id       uuid;
  v_provider_id      uuid;
  v_service_id       uuid;
  v_duration_minutes int;
  v_new_slot_start   timestamp without time zone;
  v_new_slot_end     timestamp without time zone;
  v_new_token        text;
BEGIN
  -- 1. Verify HMAC token
  v_booking_id := public.verify_manage_token(p_manage_token);

  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TOKEN' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Fetch booking + service + provider
  SELECT b.service_id, s.provider_id, s.duration_minutes
    INTO v_service_id, v_provider_id, v_duration_minutes
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    WHERE b.id = v_booking_id;

  IF v_service_id IS NULL THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Validate new slot
  IF p_new_slot_start <= now() THEN
    RAISE EXCEPTION 'SLOT_IN_PAST' USING ERRCODE = 'P0001';
  END IF;

  IF (p_new_slot_end - p_new_slot_start) <> make_interval(mins => v_duration_minutes) THEN
    RAISE EXCEPTION 'SLOT_DURATION_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  -- Cast to timestamp without time zone for the bookings column type
  v_new_slot_start := p_new_slot_start AT TIME ZONE 'Africa/Casablanca';
  v_new_slot_end   := p_new_slot_end   AT TIME ZONE 'Africa/Casablanca';

  -- 4. Anti-overlap check (excluding self, and excluding cancelled/rejected/pending)
  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    WHERE s.provider_id = v_provider_id
      AND b.id <> v_booking_id
      AND b.status NOT IN ('canceled_by_customer', 'rejected_by_provider', 'pending_staff_approval')
      AND b.time_slot_start < v_new_slot_end
      AND b.time_slot_end   > v_new_slot_start
  ) THEN
    RAISE EXCEPTION 'SLOT_TAKEN' USING ERRCODE = 'P0001';
  END IF;

  -- 5. Update booking
  UPDATE public.bookings
    SET time_slot_start = v_new_slot_start,
        time_slot_end   = v_new_slot_end,
        booking_date    = v_new_slot_start::date,
        updated_at      = now()
    WHERE id = v_booking_id
      AND status IN ('pending_staff_approval', 'pending_customer_approval', 'confirmed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_RESCHEDULABLE' USING ERRCODE = 'P0001';
  END IF;

  -- 6. Rotate manage token
  v_new_token := public.generate_manage_token(v_booking_id);

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'bookingId',    v_booking_id,
      'status',       'rescheduled',
      'newSlotStart', p_new_slot_start,
      'newSlotEnd',   p_new_slot_end,
      'newManageToken', v_new_token
    )
  );
END;
$$;

ALTER FUNCTION public.reschedule_web_booking(text, timestamp with time zone, timestamp with time zone) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.reschedule_web_booking(text, timestamp with time zone, timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reschedule_web_booking(text, timestamp with time zone, timestamp with time zone) TO service_role;

COMMENT ON FUNCTION public.reschedule_web_booking(text, timestamptz, timestamptz) IS
  'HMAC-verified reschedule. Validates slot, anti-overlap excluding self, rotates manage token. Returns JSONB envelope.';

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   DROP FUNCTION IF EXISTS public.reschedule_web_booking(text, timestamp with time zone, timestamp with time zone);

COMMIT;