/**
 * Salon profile page — RSC + ISR 60s.
 * Public-facing salon homepage at /<slug>.
 *
 * Renders:
 *   - Curved teal hero (HeroHeader)
 *   - "Open today" badge + WhatsApp CTA
 *   - Service preview (top 3)
 *   - Address + map embed (Phase 2)
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HeroHeader } from "@/components/salon/HeroHeader";
import { OpenHoursBadge } from "@/components/salon/OpenHoursBadge";
import { WhatsAppDeepLinkButton } from "@/components/salon/WhatsAppDeepLinkButton";
import { ServiceCard } from "@/components/salon/ServiceCard";
import {
  getSalonBySlug,
  getSalonLocation,
} from "@/server/queries/getSalonBySlug";
import { getPublishedServices } from "@/server/queries/getPublishedServices";
import Link from "next/link";

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
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const [location, services] = await Promise.all([
    getSalonLocation(slug),
    getPublishedServices(salon.id),
  ]);

  const preview = services.slice(0, 3);

  return (
    <main>
      <HeroHeader
        businessName={salon.businessName}
        slug={salon.publicSlug}
        heroImageUrl={salon.heroImageUrl}
      />

      <div className="mx-auto -mt-6 max-w-5xl px-4 sm:px-6">
        {/* Action row: Open badge + WhatsApp CTA */}
        <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl px-6 py-5">
          <OpenHoursBadge availability={null} locale="fr" />
          <div className="flex items-center gap-3">
            <WhatsAppDeepLinkButton
              phone={location?.whatsapp_display_phone ?? null}
              businessName={salon.businessName}
            />
          </div>
        </div>

        {/* Description */}
        {salon.description && (
          <section className="mt-8 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-card">
            <p className="text-base leading-relaxed text-[var(--color-text)]">
              {salon.description}
            </p>
          </section>
        )}

        {/* Services preview */}
        <section className="mt-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold">
              Nos services
            </h2>
            {services.length > 3 && (
              <Link
                href={`/${salon.publicSlug}/services`}
                className="text-sm font-semibold text-[var(--color-primary-500)] hover:underline"
              >
                Voir tous ({services.length}) →
              </Link>
            )}
          </div>

          {preview.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white p-12 text-center text-[var(--color-text-muted)]">
              Aucun service publié pour le moment.
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
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Address */}
        {location?.address && (
          <section className="mt-10 mb-12 rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Adresse</h2>
            <p className="mt-2 text-[var(--color-text-muted)]">
              {location.address}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
