/**
 * Server query — fetch a salon's public profile by slug.
 *
 * Reads from `service_providers_public` (migration 015) joined with
 * `provider_locations_public` (extended in migration 023 to expose
 * `opening_hours` + `time_zone`). One roundtrip via Supabase's FK-style
 * resource embedding.
 *
 * Anon-friendly — no service-role key needed.
 * Cached via unstable_cache (60s). Tagged `salon-profile`.
 */
import "server-only";
import { createPublicAnonClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import type { LocationAvailability } from "@/lib/utils/time";

export type SalonProfile = {
  id: string;
  publicSlug: string;
  name: string;
  businessName: string;
  heroImageUrl: string | null;
  description: string | null;
  theme: {
    primary?: string;
    primaryLight?: string;
    accent?: string;
    font?: string;
  };
  meta: Record<string, unknown>;
  /** Per-location address (from joined provider_locations_public). */
  address: string | null;
  /** Per-location WhatsApp phone for deep-link button. */
  whatsappDisplayPhone: string | null;
  /** Canonical opening-hours shape: `{day: {isOpen, slots: [{open, close}]}}`. */
  openingHours: LocationAvailability | null;
  /** IANA timezone, e.g. 'Africa/Casablanca'. Defaults to Casablanca. */
  timeZone: string;
};

export const getSalonBySlug = unstable_cache(
  async (slug: string): Promise<SalonProfile | null> => {
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
         web_theme,
         web_meta,
         locations:provider_locations_public!inner(
           address, name, whatsapp_display_phone, opening_hours, time_zone
         )`,
      )
      .eq("public_slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[getSalonBySlug]", error.message);
      return null;
    }

    if (!data) return null;

    const loc = (data as any).locations?.[0] ?? null;

    return {
      id: data.id,
      publicSlug: data.public_slug,
      name: data.name,
      businessName: data.business_name,
      heroImageUrl: data.web_hero_image_url,
      description: data.web_description,
      theme: data.web_theme ?? {},
      meta: data.web_meta ?? {},
      address: loc?.address ?? null,
      whatsappDisplayPhone: loc?.whatsapp_display_phone ?? null,
      openingHours: loc?.opening_hours ?? null,
      timeZone: loc?.time_zone ?? "Africa/Casablanca",
    };
  },
  ["salon-by-slug-v2"],
  {
    revalidate: 60,
    tags: ["salon-profile"],
  },
);
