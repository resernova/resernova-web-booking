-- Migration 013 — web_rate_limits + cron purge
-- Per-IP-per-slug-per-endpoint rate limits. Granular defense
-- in addition to Vercel Edge Middleware. Old rows purged every
-- 15 minutes by pg_cron (CNDP/Loi 09-08 compliance — no IP retention >24h).

BEGIN;

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS public.web_rate_limits (
  id           bigserial PRIMARY KEY,
  ip_hash      text NOT NULL,
  slug         text NOT NULL,
  endpoint     text NOT NULL,             -- 'availability' | 'create' | 'cancel' | 'reschedule'
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  hit_count    int NOT NULL DEFAULT 1,
  UNIQUE (ip_hash, slug, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_web_rate_limits_window
  ON public.web_rate_limits(window_start);

ALTER TABLE public.web_rate_limits ENABLE ROW LEVEL SECURITY;
-- No anon / authenticated policies — service_role only.

COMMENT ON TABLE public.web_rate_limits IS 'Per-IP-per-slug-per-endpoint rate limit counters. Purged by pg_cron after 24h.';
COMMENT ON COLUMN public.web_rate_limits.window_start IS 'Truncated to minute. UNIQUE constraint ensures one row per (ip, slug, endpoint, minute).';

-- ============================================================
-- pg_cron — purge rows older than 24 hours every 15 minutes
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Avoid duplicate-schedule error on re-run
    PERFORM cron.unschedule('purge-web-rate-limits')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-web-rate-limits');

    PERFORM cron.schedule(
      'purge-web-rate-limits',
      '*/15 * * * *',
      $sql$DELETE FROM public.web_rate_limits WHERE window_start < now() - interval '24 hours'$sql$
    );
  ELSE
    RAISE NOTICE 'pg_cron extension not installed — skipping purge-web-rate-limits schedule. Install pg_cron and run this block manually.';
  END IF;
END $$;

COMMENT ON INDEX idx_web_rate_limits_window IS 'Speeds up the purge query (window_start < now() - 24h).';

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   SELECT cron.unschedule('purge-web-rate-limits');  -- if pg_cron exists
--   DROP TABLE IF EXISTS public.web_rate_limits;

COMMIT;