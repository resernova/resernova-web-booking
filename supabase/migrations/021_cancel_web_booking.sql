-- RPC 021 — cancel_web_booking
-- HMAC-verified cancellation. Verifies manage_token via Migration 017,
-- updates bookings.status='canceled_by_customer', appends reason to
-- special_request, and rotates the manage token (old link is invalid).

BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_web_booking(
  p_manage_token text,
  p_reason       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_booking_id   uuid;
  v_was_rotated  boolean := false;
  v_new_token    text;
BEGIN
  -- 1. Verify HMAC token
  v_booking_id := public.verify_manage_token(p_manage_token);

  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TOKEN' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Confirm booking exists and is cancellable
  IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE id = v_booking_id) THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Update status + append reason
  UPDATE public.bookings
    SET status = 'canceled_by_customer'::booking_status,
        special_request = CASE
          WHEN p_reason IS NOT NULL THEN
            COALESCE(special_request, '') ||
            CASE WHEN special_request IS NOT NULL AND special_request <> '' THEN E'\n' ELSE '' END ||
            '[Web cancel] ' || p_reason
          ELSE special_request
        END,
        updated_at = now()
    WHERE id = v_booking_id
      AND status IN ('pending_staff_approval', 'pending_customer_approval', 'confirmed');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_ALREADY_FINALIZED' USING ERRCODE = 'P0001';
  END IF;

  -- 4. Rotate the manage token — re-sign for the same booking_id with
  --    a fresh 7-day expiry. (Vault secret unchanged; new expiry epoch.)
  v_new_token := public.generate_manage_token(v_booking_id);

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'bookingId',  v_booking_id,
      'status',     'canceled_by_customer',
      'newManageToken', v_new_token
    )
  );
END;
$$;

ALTER FUNCTION public.cancel_web_booking(text, text) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.cancel_web_booking(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_web_booking(text, text) TO service_role;

COMMENT ON FUNCTION public.cancel_web_booking(text, text) IS
  'HMAC-verified cancellation. Sets bookings.status=canceled_by_customer, rotates manage token (old link invalid). Returns JSONB envelope.';

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   DROP FUNCTION IF EXISTS public.cancel_web_booking(text, text);

COMMIT;