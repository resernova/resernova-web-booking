-- Migration 016 — UNIQUE (provider_id, phone_number) on clients
-- Lets create_web_booking RPC use INSERT ... ON CONFLICT (provider_id, phone_number)
-- to upsert the clients row in one round-trip.
--
-- PRE-CONDITION: Until this migration runs, two callers racing the same
-- phone number for a new provider will both succeed and produce two rows.
-- Use upsert_client_by_phone() (full_dump.sql:2574) for safe find-or-create.

BEGIN;

-- ============================================================
-- PRE-FLIGHT — fail loudly if duplicate (provider_id, phone_number) exists
-- ============================================================

DO $$
DECLARE
  dup_count int;
BEGIN
  SELECT count(*) INTO dup_count
  FROM (
    SELECT provider_id, phone_number, count(*) c
    FROM public.clients
    WHERE phone_number IS NOT NULL
    GROUP BY 1, 2
    HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Cannot add UNIQUE(provider_id, phone_number): % duplicate group(s) exist. Run dedupe SELECT first, then re-apply this migration.', dup_count;
  END IF;
END $$;

-- ============================================================
-- UP
-- ============================================================

ALTER TABLE public.clients
  ADD CONSTRAINT clients_provider_phone_unique
  UNIQUE (provider_id, phone_number);

-- ============================================================
-- DOWN
-- ============================================================
-- To rollback:
--   ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_provider_phone_unique;

COMMIT;