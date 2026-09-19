/**
 * Booking wizard page — server-rendered shell.
 * Loads service + provider + staff, then renders the client wizard.
 *
 * Token-aligned with the Linear-style editorial language: hairline rules,
 * restrained type scale, accent reserved for the wizard's primary CTA.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import { getServiceById } from "@/server/queries/getPublishedServices";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { resolveLocale, type Locale } from "@/lib/i18n/config";

type RouteParams = { slug: string; serviceId: string };

export const dynamic = "force-dynamic"; // service lookup should always be fresh

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug, serviceId } = await params;
  const salon = await getSalonBySlug(slug);
  const service = await getServiceById(serviceId);
  if (!salon || !service) return { title: "Réservation introuvable" };
  return {
    title: `Réserver — ${service.name}`,
    description: `Réservez ${service.name} chez ${salon.businessName}`,
    robots: { index: false, follow: false }, // don't index booking pages
  };
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug, serviceId } = await params;
  const { locale: localeRaw } = await searchParams;
  const locale: Locale = resolveLocale(localeRaw ?? null);
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const service = await getServiceById(serviceId);
  if (!service) notFound();

  // Fetch active staff for this provider (for the "preferred staff" dropdown)
  const supabase = createServiceRoleClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("id, user_id, status")
    .eq("provider_id", service.providerId)
    .eq("status", "active");

  const staffList = (staff ?? []).map((s) => ({
    id: s.id,
    name: `Praticien #${s.id.slice(0, 4)}`, // TODO: lookup user name in Phase 2
  }));

  const t = labels[locale];

  return (
    <main className="min-h-dvh bg-canvas pb-12 text-ink">
      <header className="border-b border-border bg-canvas px-4 pb-6 pt-8 sm:px-6">
        <Link
          href={`/${salon.publicSlug}/services`}
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
        <p className="mt-3 font-mono text-eyebrow uppercase tracking-wider text-accent">
          {t.headingEyebrow}
        </p>
        <h1 className="mt-1 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
          {t.heading}
        </h1>
      </header>

      <BookingWizard
        slug={salon.publicSlug}
        serviceId={service.id}
        serviceName={service.name}
        serviceDurationMinutes={service.durationMinutes}
        servicePrice={service.price}
        staff={staffList}
        locale={locale}
      />
    </main>
  );
}

const labels = {
  fr: { headingEyebrow: "Réservation", heading: "Réserver" },
  en: { headingEyebrow: "Booking", heading: "Book" },
  ar: { headingEyebrow: "الحجز", heading: "احجز" },
} as const;
