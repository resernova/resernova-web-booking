-- RPC 020 — create_web_booking
-- The core web booking creation path. Idempotency via 24h dedupe on
-- web_bookings.idempotency_key. Calls upsert_client_by_phone (not
-- create_booking_from_ai — that creates auth.users ghost rows).
-- Fires web-booking-notify Edge Function via pg_net.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_web_booking(
  p_slug            text,
  p_payload         jsonb,
  p_idempotency_key uuid,
  p_ip_hash         text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_provider_id          uuid;
  v_web_enabled          boolean;
  v_service              public.services%ROWTYPE;
  v_slot_start           timestamp without time zone;
  v_slot_end             timestamp without time zone;
  v_slot_start_tz        timestamp with time zone;
  v_slot_end_tz          timestamp with time zone;
  v_client_id            uuid;
  v_existing_booking_id  uuid;
  v_booking_id           uuid;
  v_status               booking_status;
  v_manage_token         text;
  v_payload_keys         text[];
  v_service_options_json jsonb;
BEGIN
  -- ============================================================
  -- 1. Idempotency check — same key within last 24h returns original
  -- ============================================================
  SELECT wb.booking_id
    INTO v_existing_booking_id
    FROM public.web_bookings wb
    JOIN public.bookings b ON b.id = wb.booking_id
    WHERE wb.idempotency_key = p_idempotency_key
      AND wb.created_at > now() - interval '24 hours'
    LIMIT 1;

  IF v_existing_booking_id IS NOT NULL THEN
    v_manage_token := public.generate_manage_token(v_existing_booking_id);
    RETURN jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'bookingId',  v_existing_booking_id,
        'status',     (SELECT status::text FROM public.bookings WHERE id = v_existing_booking_id),
        'manageToken', v_manage_token,
        'reused',     true
      )
    );
  END IF;

  -- ============================================================
  -- 2. Tenant guard — slug → provider_id, assert web_booking_enabled
  -- ============================================================
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

  -- ============================================================
  -- 3. Service guard — must belong to this provider, be published
  -- ============================================================
  SELECT * INTO v_service
    FROM public.services
    WHERE id = (p_payload->>'serviceId')::uuid
      AND provider_id = v_provider_id
      AND status = 'published';

  IF v_service.id IS NULL THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  -- ============================================================
  -- 4. Parse + validate the requested slot (engine uses timestamptz)
  -- ============================================================
  BEGIN
    v_slot_start_tz := (p_payload->>'slotStart')::timestamptz;
    v_slot_end_tz   := (p_payload->>'slotEnd')::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'INVALID_INPUT: slot dates could not be parsed';
  END;

  IF v_slot_start_tz <= now() THEN
    RAISE EXCEPTION 'SLOT_IN_PAST' USING ERRCODE = 'P0001';
  END IF;

  IF (v_slot_end_tz - v_slot_start_tz) <> make_interval(mins => v_service.duration_minutes) THEN
    RAISE EXCEPTION 'SLOT_DURATION_MISMATCH' USING ERRCODE = 'P0001';
  END IF;

  -- Cast to timestamp without time zone for the bookings column type
  v_slot_start := v_slot_start_tz AT TIME ZONE 'Africa/Casablanca';
  v_slot_end   := v_slot_end_tz   AT TIME ZONE 'Africa/Casablanca';

  -- ============================================================
  -- 5. Anti-overlap check — same provider, same window, not cancelled/rejected.
  --    `pending_staff_approval` IS counted as a conflict (matches the trigger
  --    `bookings_check_no_overlap` on prod). The DB trigger is the source of
  --    truth; this app-layer check is a cheap early-exit mirror.
  -- ============================================================
  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.services s ON s.id = b.service_id
    WHERE s.provider_id = v_provider_id
      AND b.status NOT IN ('canceled_by_customer', 'rejected_by_provider')
      AND b.time_slot_start < v_slot_end
      AND b.time_slot_end   > v_slot_start
  ) THEN
    RAISE EXCEPTION 'SLOT_TAKEN' USING ERRCODE = 'P0001';
  END IF;

  -- ============================================================
  -- 6. Upsert client row by (provider_id, phone) using the existing helper
  --    (does NOT touch auth.users — see full_dump.sql:2574)
  -- ============================================================
  v_client_id := public.upsert_client_by_phone(
    v_provider_id,
    p_payload->>'clientPhone',
    p_payload->>'clientName'
  );

  -- Optional: refresh email if newly provided
  IF NULLIF(p_payload->>'clientEmail', '') IS NOT NULL THEN
    UPDATE public.clients
      SET email = p_payload->>'clientEmail',
          updated_at = now()
      WHERE id = v_client_id;
  END IF;

  -- ============================================================
  -- 7. WhatsApp opt-in (opt_in_source='web' is already accepted per L2825)
  -- ============================================================
  IF COALESCE((p_payload->>'whatsappOptIn')::boolean, false) THEN
    INSERT INTO public.client_whatsapp_optins (client_id, opted_in, opt_in_source)
      VALUES (v_client_id, true, 'web')
      ON CONFLICT (client_id) DO UPDATE
        SET opted_in     = true,
            opt_in_source = 'web';
  END IF;

  -- ============================================================
  -- 8. Status — auto-confirm if service is configured, else pending
  -- ============================================================
  v_status := CASE
    WHEN v_service.is_auto_confirm THEN 'confirmed'::booking_status
    ELSE 'pending_staff_approval'::booking_status
  END;

  -- ============================================================
  -- 9. Parse service_options if present
  -- ============================================================
  IF p_payload ? 'serviceOptions' THEN
    v_service_options_json := p_payload->'serviceOptions';
  ELSE
    v_service_options_json := NULL;
  END IF;

  -- ============================================================
  -- 10. INSERT booking
  -- ============================================================
  INSERT INTO public.bookings (
    service_id, client_id, client_name, booking_date,
    time_slot_start, time_slot_end, special_request,
    requested_staff_id, service_options, status, source, is_manual_entry
  ) VALUES (
    v_service.id, v_client_id, p_payload->>'clientName', v_slot_start::date,
    v_slot_start, v_slot_end,
    NULLIF(p_payload->>'specialRequest', ''),
    NULLIF(p_payload->>'requestedStaffId','')::uuid,
    CASE
      WHEN v_service_options_json IS NULL THEN NULL
      WHEN jsonb_typeof(v_service_options_json) = 'array' THEN
        ARRAY(SELECT jsonb_array_elements_text(v_service_options_json))
      ELSE NULL
    END,
    v_status, 'web', false
  )
  RETURNING id INTO v_booking_id;

  -- ============================================================
  -- 11. INSERT audit row
  -- ============================================================
  INSERT INTO public.web_bookings (booking_id, slug, idempotency_key, utm, ip_hash, user_agent, referrer)
    VALUES (
      v_booking_id,
      p_slug,
      p_idempotency_key,
      COALESCE(p_payload->'utm', '{}'::jsonb),
      p_ip_hash,
      NULLIF(p_payload->>'userAgent', ''),
      NULLIF(p_payload->>'referrer', '')
    );

  -- ============================================================
  -- 12. Signed manage token (HMAC-SHA256 via Migration 017)
  -- ============================================================
  v_manage_token := public.generate_manage_token(v_booking_id);

  -- ============================================================
  -- 13. Fire-and-forget notification via pg_net (best-effort, async)
  --     If pg_net is missing, the notification is skipped silently.
  -- ============================================================
  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true) || '/functions/v1/web-booking-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
        'X-Web-Booking-Signature', current_setting('app.settings.web_booking_signing_secret', true)
      ),
      body := jsonb_build_object(
        'bookingId', v_booking_id,
        'slug', p_slug,
        'idempotencyKey', p_idempotency_key
      )::text
    );
  EXCEPTION WHEN OTHERS THEN
    -- Don't fail the booking if pg_net is unavailable — the booking is
    -- already committed. The web-booking-notify path will be retried
    -- via the booking status change trigger if/when added.
    RAISE WARNING 'web-booking-notify dispatch failed: %', SQLERRM;
  END;

  -- ============================================================
  -- 14. Return success
  -- ============================================================
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'bookingId',   v_booking_id,
      'status',      v_status::text,
      'manageToken', v_manage_token,
      'reused',      false
    )
  );
END;
$$;

ALTER FUNCTION public.create_web_booking(text, jsonb, uuid, text) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.create_web_booking(text, jsonb, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_web_booking(text, jsonb, uuid, text) TO service_role;

COMMENT ON FUNCTION public.create_web_booking(text, jsonb, uuid, text) IS
  'Create a booking from the web surface. Idempotency via 24h dedupe, upsert_client_by_phone, anti-overlap, fires web-booking-notify via pg_net. Returns JSONB envelope.';

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   DROP FUNCTION IF EXISTS public.create_web_booking(text, jsonb, uuid, text);

COMMIT;