-- Migration 023 — provider_locations_public_with_hours
-- Extends the public view to expose opening_hours + time_zone.

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
  'Public-facing locations of web-enabled providers. SELECT-only to anon. Exposes opening_hours (canonical nested-slot shape) + time_zone so the web app can render Open today / Ferme aujourd hui indicators without a separate query.';

-- DOWN: restore the 5-column original
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
