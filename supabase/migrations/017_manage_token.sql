-- Migration 017 — HMAC manage token (generate / verify)
-- Token = hex_hmac(booking_id|expiry_epoch).expiry_epoch.booking_id
-- Key stored in Vault as 'web_manage_token_key' (32 random bytes hex).
-- Token lives in URL hash (#t=...) — never hits server access logs.
-- 7-day expiry; regenerated on every cancel/reschedule.

BEGIN;

-- ============================================================
-- UP
-- ============================================================

-- 1. Generate a manage token for a booking_id
CREATE OR REPLACE FUNCTION public.generate_manage_token(p_booking_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_key      text;
  v_payload  text;
  v_expiry   bigint;
  v_mac      text;
BEGIN
  -- Look up the HMAC key from Vault
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'web_manage_token_key';

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Vault secret web_manage_token_key is not set. Run: supabase secrets set WEB_MANAGE_TOKEN_KEY=$(openssl rand -hex 32)';
  END IF;

  v_expiry := (extract(epoch from now() + interval '7 days'))::bigint;
  v_payload := p_booking_id::text || '|' || v_expiry::text;

  v_mac := encode(hmac(v_payload, v_key, 'sha256'), 'hex');

  RETURN v_mac || '.' || v_expiry::text || '.' || p_booking_id::text;
END;
$$;

ALTER FUNCTION public.generate_manage_token(p_booking_id uuid) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.generate_manage_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_manage_token(uuid) TO service_role;

COMMENT ON FUNCTION public.generate_manage_token(uuid) IS
  'Generates HMAC-SHA256 signed manage token for a booking. Format: hex_hmac.expiry_epoch.booking_id. 7-day expiry. Key from Vault secret web_manage_token_key.';

-- 2. Verify a manage token, return booking_id (uuid) or NULL
CREATE OR REPLACE FUNCTION public.verify_manage_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_parts     text[];
  v_expiry    bigint;
  v_key       text;
  v_expected  text;
  v_actual    text;
  v_booking_id uuid;
BEGIN
  -- Split on '.'
  v_parts := string_to_array(p_token, '.');
  IF array_length(v_parts, 1) IS DISTINCT FROM 3 THEN
    RETURN NULL;
  END IF;

  -- Validate expiry
  BEGIN
    v_expiry := v_parts[2]::bigint;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  IF v_expiry < extract(epoch from now())::bigint THEN
    RETURN NULL;
  END IF;

  -- Look up key
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'web_manage_token_key';

  IF v_key IS NULL THEN
    RETURN NULL;
  END IF;

  -- Recompute expected HMAC over (booking_id|expiry)
  v_expected := encode(hmac(v_parts[3] || '|' || v_parts[2], v_key, 'sha256'), 'hex');
  v_actual   := v_parts[1];

  -- Constant-time compare via decode() to avoid text-comparison timing leaks
  IF decode(v_actual, 'hex') = decode(v_expected, 'hex') THEN
    BEGIN
      v_booking_id := v_parts[3]::uuid;
      RETURN v_booking_id;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

ALTER FUNCTION public.verify_manage_token(text) OWNER TO postgres;

REVOKE EXECUTE ON FUNCTION public.verify_manage_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_manage_token(text) TO service_role;

COMMENT ON FUNCTION public.verify_manage_token(text) IS
  'Verifies HMAC manage token and returns booking_id (uuid) if valid and unexpired, else NULL. Constant-time HMAC compare via decode().';

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   DROP FUNCTION IF EXISTS public.verify_manage_token(text);
--   DROP FUNCTION IF EXISTS public.generate_manage_token(uuid);

COMMIT;