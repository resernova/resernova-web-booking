/**
 * Services catalog page — RSC shell + Client filter component.
 * Renders the full list of published services as a vertical list with
 * category chips + sort (Fresha-inspired), token-aligned.
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
import { resolveLocale, type Locale } from "@/lib/i18n/config";

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
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale: localeRaw } = await searchParams;
  const locale: Locale = resolveLocale(localeRaw ?? null);
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const [services, categories] = await Promise.all([
    getPublishedServices(salon.id),
    getServiceCategories(),
  ]);

  const t = labels[locale];

  return (
    <main className="min-h-dvh bg-canvas pb-16 text-ink">
      <div className="border-b border-border bg-canvas px-4 pb-6 pt-8 sm:px-6">
        <Link
          href={`/${salon.publicSlug}`}
          className="inline-flex items-center gap-2 text-body-sm text-ink-muted transition-base duration-base ease-standard hover:text-ink"
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
        <h1 className="mt-4 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
          {t.heading}
        </h1>
        <p className="mt-2 text-body-sm text-ink-muted">
          {services.length} {t.prestation(services.length)}{" "}
          {t.disponible(services.length)}
        </p>
      </div>

      <div className="mx-auto -mt-2 max-w-3xl px-4 py-8 sm:px-6">
        <ServicesList
          slug={salon.publicSlug}
          services={services}
          categories={categories}
          locale={locale}
        />
      </div>
    </main>
  );
}

const labels = {
  fr: {
    heading: "Nos services",
    prestation: (n: number) => (n > 1 ? "prestations" : "prestation"),
    disponible: (n: number) => (n > 1 ? "disponibles" : "disponible"),
  },
  en: {
    heading: "Our services",
    prestation: (n: number) => (n > 1 ? "services" : "service"),
    disponible: (n: number) => (n > 1 ? "available" : "available"),
  },
  ar: {
    heading: "خدماتنا",
    prestation: (n: number) => (n > 1 ? "خدمات" : "خدمة"),
    disponible: (n: number) => (n > 1 ? "متاحة" : "متاح"),
  },
} as const;
