/**
 * Server query — fetch published services for a salon.
 * Uses the public SELECT pattern on services table (existing RLS allows anon
 * SELECT of status='published' rows).
 *
 * Note: `services.availability json` was DROPPED by mobile migration 014
 * (the two-layer model puts hours on `provider_locations.opening_hours`).
 * Do NOT reference it here — silent SELECT failures caused services to not
 * render on the salon page. Fix is to omit the column from the select.
 */
import "server-only";
import { createPublicAnonClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export type PublishedService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMinutes: number;
  serviceType: string | null;
  categoryId: string | null;
  photos: string[] | null;
  locationId: string | null;
};

export const getPublishedServices = unstable_cache(
  async (providerId: string): Promise<PublishedService[]> => {
    const supabase = createPublicAnonClient();
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, name, description, price, duration_minutes, service_type, category_id, photos, location_id",
      )
      .eq("provider_id", providerId)
      .eq("status", "published")
      .order("price", { ascending: true });

    if (error) {
      console.error("[getPublishedServices]", error.message);
      return [];
    }

    return (data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: Number(s.price ?? 0),
      durationMinutes: s.duration_minutes,
      serviceType: s.service_type,
      categoryId: s.category_id,
      photos: s.photos ?? null,
      locationId: s.location_id,
    }));
  },
  ["published-services"],
  {
    revalidate: 300,
    tags: ["services"],
  },
);

export async function getServiceById(serviceId: string) {
  const supabase = createPublicAnonClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, description, price, duration_minutes, service_type, category_id, photos, provider_id, location_id",
    )
    .eq("id", serviceId)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    price: Number(data.price ?? 0),
    durationMinutes: data.duration_minutes,
    serviceType: data.service_type,
    categoryId: data.category_id,
    photos: data.photos ?? null,
    providerId: data.provider_id,
    locationId: data.location_id,
  };
}

export async function getServiceCategories() {
  const supabase = createPublicAnonClient();
  const { data, error } = await supabase
    .from("service_categories")
    .select("category_id, name")
    .order("name");

  if (error) return [];
  return data ?? [];
}
