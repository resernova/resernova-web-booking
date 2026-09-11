/**
 * Services catalog page — RSC shell + Client filter component.
 * Renders the full list of published services with category chips + sort.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import {
  getPublishedServices,
  getServiceCategories,
} from "@/server/queries/getPublishedServices";
import { ServicesGrid } from "./ServicesGrid";

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
      <div className="gradient-hero rounded-b-[36px] px-4 pb-8 pt-10 text-white sm:px-6">
        <Link
          href={`/${salon.publicSlug}`}
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
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
        <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
          Nos services
        </h1>
        <p className="mt-2 text-white/85">
          {services.length} prestation{services.length > 1 ? "s" : ""}{" "}
          disponible{services.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mx-auto -mt-6 max-w-5xl px-4 sm:px-6">
        <div className="glass rounded-3xl px-4 py-6 sm:px-6">
          <ServicesGrid
            slug={salon.publicSlug}
            services={services}
            categories={categories}
          />
        </div>
      </div>
    </main>
  );
}
