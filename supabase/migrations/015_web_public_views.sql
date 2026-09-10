-- Migration 015 — PUBLIC VIEWS for anonymous tenant lookup
-- Per blueprint §14.3 hint: choose PUBLIC VIEWS over anon RLS on raw tables.
-- Views are narrower (no user_id, no internal columns), survive any
-- future RLS redesign, and don't add policies to RLS-locked tables.
-- Anon gets SELECT only via these views.

BEGIN;

-- ============================================================
-- UP
-- ============================================================

-- 1. Public-facing service_providers view (only enabled providers)
CREATE OR REPLACE VIEW public.service_providers_public AS
SELECT
  id,
  public_slug,
  name,
  business_name,
  web_hero_image_url,
  web_description,
  web_theme,
  web_meta
FROM public.service_providers
WHERE web_booking_enabled = true;

COMMENT ON VIEW public.service_providers_public IS
  'Public-facing subset of service_providers, filtered to web_booking_enabled=true. SELECT-only to anon.';

-- 2. Public-facing provider_locations view (locations of enabled providers)
CREATE OR REPLACE VIEW public.provider_locations_public AS
SELECT
  location_id,
  provider_id,
  address,
  name,
  whatsapp_display_phone
FROM public.provider_locations
WHERE provider_id IN (
  SELECT id FROM public.service_providers WHERE web_booking_enabled = true
);

COMMENT ON VIEW public.provider_locations_public IS
  'Public-facing locations of web-enabled providers. SELECT-only to anon.';

-- 3. Grant SELECT to anon (Postgres-side)
GRANT SELECT ON public.service_providers_public TO anon;
GRANT SELECT ON public.provider_locations_public TO anon;

-- 4. Lock down the underlying tables more explicitly — these are belt-and-braces
--    since the existing RLS already blocks anon SELECT on the raw tables.
--    The key change is that anon can now read the public views.

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   REVOKE SELECT ON public.service_providers_public FROM anon;
--   REVOKE SELECT ON public.provider_locations_public FROM anon;
--   DROP VIEW IF EXISTS public.provider_locations_public;
--   DROP VIEW IF EXISTS public.service_providers_public;

COMMIT;