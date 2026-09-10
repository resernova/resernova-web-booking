-- Migration 011 — Web Booking Columns on service_providers
-- Adds public_slug + web_booking_enabled + theme/meta columns for the public booking surface.
-- All additions are nullable / have safe defaults to avoid breaking existing rows.

BEGIN;

-- ============================================================
-- UP
-- ============================================================

-- 1. Public slug (kebab-case identifier used in URLs: book.resernova.com/<slug>)
ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS web_booking_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS web_hero_image_url text,
  ADD COLUMN IF NOT EXISTS web_description text,
  ADD COLUMN IF NOT EXISTS web_theme jsonb NOT NULL DEFAULT '{"primary":"#1C6B6D","accent":"#25D366","font":"inter"}'::jsonb,
  ADD COLUMN IF NOT EXISTS web_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Slug format constraint — kebab-case, 3-40 chars total
ALTER TABLE public.service_providers
  ADD CONSTRAINT service_providers_public_slug_format
  CHECK (public_slug IS NULL OR public_slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$');

-- 3. Global uniqueness on the public slug (NULLs allowed — opt-in model)
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_providers_public_slug
  ON public.service_providers(public_slug)
  WHERE public_slug IS NOT NULL;

-- 4. Lookup index for the kill-switch query path
CREATE INDEX IF NOT EXISTS idx_service_providers_web_enabled
  ON public.service_providers(public_slug)
  WHERE web_booking_enabled = true;

COMMENT ON COLUMN public.service_providers.public_slug IS 'URL-safe kebab-case slug used in book.resernova.com/<slug>. Auto-generated from business_name; owner-editable.';
COMMENT ON COLUMN public.service_providers.web_booking_enabled IS 'Kill-switch for the public web booking surface. Defaults false; turned on by owner in dashboard.';
COMMENT ON COLUMN public.service_providers.web_hero_image_url IS 'Optional hero image override for the public profile page.';
COMMENT ON COLUMN public.service_providers.web_description IS 'Optional public-facing description (markdown allowed).';
COMMENT ON COLUMN public.service_providers.web_theme IS 'Brand tokens for the public page (primary, accent, font). Defaults to ReserNova brand.';
COMMENT ON COLUMN public.service_providers.web_meta IS 'SEO + OG + GA config (jsonb). Empty by default.';

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   DROP INDEX IF EXISTS idx_service_providers_web_enabled;
--   DROP INDEX IF EXISTS uq_service_providers_public_slug;
--   ALTER TABLE public.service_providers DROP CONSTRAINT IF EXISTS service_providers_public_slug_format;
--   ALTER TABLE public.service_providers
--     DROP COLUMN IF EXISTS web_meta,
--     DROP COLUMN IF EXISTS web_theme,
--     DROP COLUMN IF EXISTS web_description,
--     DROP COLUMN IF EXISTS web_hero_image_url,
--     DROP COLUMN IF EXISTS web_booking_enabled,
--     DROP COLUMN IF EXISTS public_slug;

COMMIT;