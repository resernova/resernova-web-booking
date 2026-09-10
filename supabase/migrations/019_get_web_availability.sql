-- RPC 019 — get_web_availability
-- Public-facing wrapper around get_available_slots_v2 that enforces
-- tenant guard (slug → provider_id, web_booking_enabled=true).
-- Returns JSONB envelope matching get_available_slots_v2 shape:
--   {success: true, data: [{slot_start, slot_end, available_staff}]}
--
-- IMPORTANT: do NOT use RETURN QUERY — get_available_slots_v2 returns
-- JSONB, NOT a TABLE. Pass the JSONB envelope straight through.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_web_availability(
  p_slug       text,
  p_service_id uuid,
  p_date       date,
  p_staff_id   uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_provider_id   uuid;
  v_web_enabled   boolean;
  v_service_ok    boolean;
BEGIN
  -- 1. Slug → provider_id + enabled guard
  SELECT id, web_booking_enabled
    INTO v_provider_id, v_web_enabled
    FROM public.service_providers
    WHERE public_slug = p_slug;

  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'PROVIDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  IF NOT v_web_enabled THEN
    RAISE EXCEPTION 'PROVIDER_DISABLED' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Service must belong to this provider + be published
  SELECT EXISTS (
    SELECT 1 FROM public.services
    WHERE id = p_service_id
      AND provider_id = v_provider_id
      AND status = 'published'
  ) INTO v_service_ok;

  IF NOT v_service_ok THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Delegate to the existing slot engine (returns JSONB)
  RETURN public.get_available_slots_v2(p_service_id, p_date, p_staff_id);
END;
$$;

ALTER FUNCTION public.get_web_availability(text, uuid, date, uuid) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.get_web_availability(text, uuid, date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_web_availability(text, uuid, date, uuid) TO service_role;

COMMENT ON FUNCTION public.get_web_availability(text, uuid, date, uuid) IS
  'Public-facing availability lookup. Slug-resolved tenant guard + delegates to get_available_slots_v2 (returns JSONB envelope).';

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   DROP FUNCTION IF EXISTS public.get_web_availability(text, uuid, date, uuid);

COMMIT;