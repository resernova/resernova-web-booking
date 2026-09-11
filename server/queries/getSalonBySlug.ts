/**
 * Server query — fetch a salon's public profile by slug.
 * Reads from the PUBLIC VIEW (migration 015) — anon-friendly, no service-role needed.
 */
import "server-only";
import { createServerAnonClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

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
};

export const getSalonBySlug = unstable_cache(
  async (slug: string): Promise<SalonProfile | null> => {
    const supabase = await createServerAnonClient();
    const { data, error } = await supabase
      .from("service_providers_public")
      .select(
        "id, public_slug, name, business_name, web_hero_image_url, web_description, web_theme, web_meta",
      )
      .eq("public_slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[getSalonBySlug]", error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      publicSlug: data.public_slug,
      name: data.name,
      businessName: data.business_name,
      heroImageUrl: data.web_hero_image_url,
      description: data.web_description,
      theme: data.web_theme ?? {},
      meta: data.web_meta ?? {},
    };
  },
  ["salon-by-slug"],
  {
    revalidate: 60,
    tags: ["salon-profile"],
  },
);

export async function getSalonLocation(slug: string) {
  const supabase = await createServerAnonClient();
  const { data: provider } = await supabase
    .from("service_providers_public")
    .select("id")
    .eq("public_slug", slug)
    .maybeSingle();

  if (!provider) return null;

  const { data: location, error } = await supabase
    .from("provider_locations_public")
    .select("location_id, provider_id, address, name, whatsapp_display_phone")
    .eq("provider_id", provider.id)
    .maybeSingle();

  if (error) {
    console.error("[getSalonLocation]", error.message);
    return null;
  }
  return location;
}
