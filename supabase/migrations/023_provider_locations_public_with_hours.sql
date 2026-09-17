-- Migration 023 — provider_locations_public_with_hours
-- Extends the public view to expose opening_hours + time_zone.
--
-- Why:
--   The two-layer availability model (per docs/14-AVAILABILITY-TWO-LAYER.md) puts
--   opening_hours on provider_locations (not service_providers.web_meta). The
--   Next.js web app needs this on the public surface for the
--   OpenHoursBadge / SalonCard "Open today" indicator.
--
--   The view's WHERE predicate already gates on web_booking_enabled = true
--   so no extra row leakage risk. Anon has GRANT ALL on the view (per
--   full_dump.sql:13629) — no further GRANT needed.
--
-- UP:

CREATE OR REPLACE VIEW public.provider_locations_public AS
 SELECT location_id,
    provider_id,
    address,
    name,
    whatsapp_display_phone,
    opening_hours,
    time_zone
   FROM public.provider_locations
  WHERE (provider_id IN ( SELECT service_providers.id
           FROM public.service_providers
          WHERE (service_providers.web_booking_enabled = true)));

COMMENT ON VIEW public.provider_locations_public IS
  'Public-facing locations of web-enabled providers. SELECT-only to anon. ' ||
  'Exposes opening_hours (canonical nested-slot shape) + time_zone so the web ' ||
  'app can render Open today / Fermé aujourd''hui indicators without a separate query.';

-- DOWN:

-- To rollback, recreate the original 5-column view (the old definition).
-- CREATE OR REPLACE VIEW public.provider_locations_public AS
--  SELECT location_id,
--     provider_id,
--     address,
--     name,
--     whatsapp_display_phone
--    FROM public.provider_locations
--   WHERE (provider_id IN ( SELECT service_providers.id
--            FROM public.service_providers
--           WHERE (service_providers.web_booking_enabled = true)));
