/**
 * Sitemap — lists every web-enabled salon.
 * Reads from service_providers_public (anon SELECT).
 */
import type { MetadataRoute } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://book.resernova.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("service_providers_public")
    .select("public_slug, web_meta");

  if (error || !data) {
    return [
      { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ];
  }

  const baseEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
  ];

  const salonEntries: MetadataRoute.Sitemap = data
    .filter((s) => s.public_slug)
    .map((s) => {
      const meta = (s.web_meta ?? {}) as Record<string, string | undefined>;
      return {
        url: `${SITE_URL}/${s.public_slug}`,
        lastModified: meta.updated_at ? new Date(meta.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

  return [...baseEntries, ...salonEntries];
}