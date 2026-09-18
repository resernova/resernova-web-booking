/**
 * Services catalog page — RSC shell + Client filter component.
 * Renders the full list of published services as a vertical list with
 * category chips + sort (Fresha-inspired).
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import {
  getPublishedServices,
  getServiceCategories,
} from "@/server/queries/getPublishedServices";
import { ServicesList } from "@/components/marketing/ServicesList";

type RouteParams = { slug: string };

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) return { title: "Services introuvables" };
  return {
    title: `Services — ${salon.businessName}`,
    description: `Découvrez tous les services proposés par ${salon.businessName} et réservez en ligne.`,
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const [services, categories] = await Promise.all([
    getPublishedServices(salon.id),
    getServiceCategories(),
  ]);

  return (
    <main className="min-h-dvh pb-16">
      <div className="border-b border-zinc-200 bg-white px-4 pb-6 pt-8 sm:px-6">
        <Link
          href={`/${salon.publicSlug}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M13 5l-5 5 5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {salon.businessName}
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-[var(--color-text)] sm:text-4xl">
          Nos services
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {services.length} prestation{services.length > 1 ? "s" : ""}{" "}
          disponible{services.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mx-auto -mt-2 max-w-3xl px-4 py-8 sm:px-6">
        <ServicesList
          slug={salon.publicSlug}
          services={services}
          categories={categories}
        />
      </div>
    </main>
  );
}
