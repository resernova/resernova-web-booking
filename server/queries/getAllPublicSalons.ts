/**
 * Server query — fetch all web-enabled public salons.
 *
 * Reads from `service_providers_public` (Migration 015) joined with
 * `provider_locations_public` (extended in Migration 023 to expose
 * `opening_hours` + `time_zone`). One roundtrip via Supabase FK-style
 * resource embedding.
 *
 * Anon-friendly — no service-role key needed.
 * Cached via unstable_cache (5 min). Tagged `salons` so a future
 * RevalidateTag can invalidate after owner-side edits.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicAnonClient } from "@/lib/supabase/server";
import type { LocationAvailability } from "@/lib/utils/time";

export type PublicSalonCard = {
  slug: string;
  name: string;
  businessName: string;
  heroImageUrl: string | null;
  description: string | null;
  address: string | null;
  whatsappDisplayPhone: string | null;
  /** Canonical opening-hours shape. */
  openingHours: LocationAvailability | null;
  /** IANA timezone, defaults to 'Africa/Casablanca'. */
  timeZone: string;
  /** web_meta (SEO/OG/GA; not availability). */
  webMeta: Record<string, unknown>;
};

type LocationRow = {
  address: string | null;
  name: string | null;
  whatsapp_display_phone: string | null;
  opening_hours: LocationAvailability | null;
  time_zone: string | null;
};

type SalonRow = {
  id: string;
  public_slug: string | null;
  name: string | null;
  business_name: string | null;
  web_hero_image_url: string | null;
  web_description: string | null;
  web_meta: Record<string, unknown> | null;
  locations: LocationRow[] | null;
};

function toPublicSalonCard(row: SalonRow): PublicSalonCard | null {
  if (!row.public_slug) return null;
  const loc = row.locations?.[0] ?? null;
  return {
    slug: row.public_slug,
    name: row.name ?? row.business_name ?? row.public_slug,
    businessName: row.business_name ?? row.name ?? row.public_slug,
    heroImageUrl: row.web_hero_image_url ?? null,
    description: row.web_description ?? null,
    address: loc?.address ?? null,
    whatsappDisplayPhone: loc?.whatsapp_display_phone ?? null,
    openingHours: loc?.opening_hours ?? null,
    timeZone: loc?.time_zone ?? "Africa/Casablanca",
    webMeta: row.web_meta ?? {},
  };
}

export const getAllPublicSalons = unstable_cache(
  async (): Promise<PublicSalonCard[]> => {
    const supabase = createPublicAnonClient();
    const { data, error } = await supabase
      .from("service_providers_public")
      .select(
        `id,
         public_slug,
         name,
         business_name,
         web_hero_image_url,
         web_description,
         web_meta,
         locations:provider_locations_public!inner(
           address, name, whatsapp_display_phone, opening_hours, time_zone, location_id
         )`,
      )
      .order("business_name", { ascending: true });

    if (error) {
      console.error("[getAllPublicSalons]", error.message);
      return [];
    }

    const cards: PublicSalonCard[] = [];
    for (const row of (data ?? []) as SalonRow[]) {
      const card = toPublicSalonCard(row);
      if (card) cards.push(card);
    }
    return cards;
  },
  ["all-public-salons-v2"],
  { revalidate: 300, tags: ["salons"] },
);
