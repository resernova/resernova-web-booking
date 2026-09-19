/**
 * Salon profile page — RSC + ISR 60s.
 * Public-facing salon homepage at /<slug>.
 *
 * Renders:
 *   - Gallery-first hero (HeroHeader)
 *   - Action row: OpenHoursBadge + WhatsApp CTA + "Voir tous les services"
 *   - Description block
 *   - Services preview (top 3)
 *   - Address + map embed (Phase 2)
 *
 * Token-aligned with the Linear-style editorial language:
 *   - bg-canvas / text-ink / border-border / rounded-lg / font-medium
 *   - accent reserved for CTAs and active state
 *   - NO .glass, NO var(--color-primary-500), NO rounded-full for cards
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { HeroHeader } from "@/components/salon/HeroHeader";
import { OpenHoursBadge } from "@/components/salon/OpenHoursBadge";
import { WhatsAppDeepLinkButton } from "@/components/salon/WhatsAppDeepLinkButton";
import { ServiceCard } from "@/components/salon/ServiceCard";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import { getPublishedServices } from "@/server/queries/getPublishedServices";
import { resolveLocale, type Locale } from "@/lib/i18n/config";

type RouteParams = { slug: string };

export const revalidate = 60;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) return { title: "Salon introuvable" };

  return {
    title: salon.businessName,
    description:
      salon.description ??
      `Réservez votre rendez-vous chez ${salon.businessName}`,
    openGraph: {
      title: salon.businessName,
      description: salon.description ?? `Réservez chez ${salon.businessName}`,
      images: salon.heroImageUrl
        ? [{ url: salon.heroImageUrl, width: 1200, height: 630 }]
        : undefined,
    },
  };
}

export default async function SalonProfilePage({
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

  const services = await getPublishedServices(salon.id);
  const preview = services.slice(0, 3);

  const t = labels[locale];

  return (
    <main className="bg-canvas text-ink">
      <HeroHeader
        businessName={salon.businessName}
        slug={salon.publicSlug}
        category={
          typeof salon.meta?.category === "string"
            ? salon.meta.category
            : t.defaultCategory
        }
        openingHours={salon.openingHours}
        timeZone={salon.timeZone}
        heroImageUrl={salon.heroImageUrl}
        locale={locale}
      />

      <div className="mx-auto -mt-6 max-w-5xl px-4 sm:px-6">
        {/* Action row: Open badge + WhatsApp CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-6 py-5 shadow-sm">
          <OpenHoursBadge
            openingHours={salon.openingHours}
            timeZone={salon.timeZone}
            locale={locale}
          />
          <div className="flex items-center gap-3">
            <WhatsAppDeepLinkButton
              phone={salon.whatsappDisplayPhone}
              businessName={salon.businessName}
              locale={locale}
            />
          </div>
        </div>

        {/* Description */}
        {salon.description && (
          <section className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm">
            <p className="text-body-lg leading-relaxed text-ink">
              {salon.description}
            </p>
          </section>
        )}

        {/* Services preview */}
        <section className="mt-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-h2 font-medium leading-tight text-ink">
              {t.servicesHeading}
            </h2>
            {services.length > 3 && (
              <Link
                href={`/${salon.publicSlug}/services`}
                className="text-body-sm font-medium text-accent transition-base duration-base ease-standard hover:text-accent-dim"
              >
                {t.viewAll(services.length)} →
              </Link>
            )}
          </div>

          {preview.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-surface p-12 text-center text-ink-muted">
              {t.noServices}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {preview.map((s) => {
                const photo =
                  Array.isArray(s.photos) && s.photos.length > 0
                    ? s.photos[0]
                    : null;
                return (
                  <ServiceCard
                    key={s.id}
                    slug={salon.publicSlug}
                    serviceId={s.id}
                    name={s.name}
                    description={s.description}
                    durationMinutes={s.durationMinutes}
                    price={s.price}
                    photoUrl={photo}
                    locale={locale}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Address */}
        {salon.address && (
          <section
            id="address"
            className="mt-10 mb-12 rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="font-display text-h4 font-medium text-ink">
              {t.addressHeading}
            </h2>
            <p className="mt-2 text-body text-ink-muted">{salon.address}</p>
          </section>
        )}
      </div>
    </main>
  );
}

const labels = {
  fr: {
    defaultCategory: "Salon & Bien-être",
    servicesHeading: "Nos services",
    addressHeading: "Adresse",
    noServices: "Aucun service publié pour le moment.",
    viewAll: (n: number) => `Voir tous (${n})`,
  },
  en: {
    defaultCategory: "Salon & Wellness",
    servicesHeading: "Our services",
    addressHeading: "Address",
    noServices: "No services published yet.",
    viewAll: (n: number) => `View all (${n})`,
  },
  ar: {
    defaultCategory: "صالون وعناية",
    servicesHeading: "خدماتنا",
    addressHeading: "العنوان",
    noServices: "لا توجد خدمات منشورة بعد.",
    viewAll: (n: number) => `عرض الكل (${n})`,
  },
} as const;
