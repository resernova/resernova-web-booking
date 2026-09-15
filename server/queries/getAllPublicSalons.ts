/**
 * Server query — fetch all web-enabled public salons.
 *
 * Reads from `service_providers_public` (Migration 015) joined with
 * `provider_locations_public`. Reuses the anon-friendly views so no
 * service-role key is needed.
 *
 * Cached via unstable_cache (5 min). Tagged `salons` so a future
 * RevalidateTag can invalidate after owner-side edits.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import { createServerAnonClient } from "@/lib/supabase/server";

export type PublicSalonCard = {
  slug: string;
  name: string;
  businessName: string;
  heroImageUrl: string | null;
  description: string | null;
  address: string | null;
  whatsappDisplayPhone: string | null;
  webMeta: Record<string, unknown>;
};

type LocationRow = {
  address: string | null;
  name: string | null;
  whatsapp_display_phone: string | null;
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
    webMeta: row.web_meta ?? {},
  };
}

export const getAllPublicSalons = unstable_cache(
  async (): Promise<PublicSalonCard[]> => {
    const supabase = await createServerAnonClient();
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
           address, name, whatsapp_display_phone, location_id
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
  ["all-public-salons"],
  { revalidate: 300, tags: ["salons"] },
);
