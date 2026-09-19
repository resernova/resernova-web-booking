/**
 * Confirmation page — RSC.
 * Token-aligned with the Linear-style editorial design language.
 *
 * Layout:
 *   - Centered success header (monospace eyebrow + display heading)
 *   - Booking reference card (large monospace)
 *   - Summary card (service + date/time + duration + place + email)
 *   - Two CTAs (.ics download + manage link)
 *   - Footer trust strip
 */
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Banner } from "@/components/ui/Banner";
import { KeyValueRow } from "@/components/ui/KeyValueRow";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/utils/ics";
import { CASABLANCA_TZ } from "@/lib/utils/time";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import { resolveLocale, type Locale } from "@/lib/i18n/config";
import type { Metadata } from "next";

type RouteParams = { slug: string; bookingRef: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) return { title: "Réservation confirmée" };
  return {
    title: "Réservation confirmée",
    description: `Votre rendez-vous chez ${salon.businessName} est confirmé`,
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<{ locale?: string; t?: string }>;
}) {
  const { slug, bookingRef } = await params;
  const { locale: localeRaw, t: manageToken } = await searchParams;
  const locale: Locale = resolveLocale(localeRaw ?? null);
  const t = labels[locale];

  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const supabase = createServiceRoleClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, client_name, client_phone, client_email, time_slot_start, time_slot_end, special_request, status, source, service_id",
    )
    .eq("id", bookingRef)
    .maybeSingle();

  if (error || !booking) notFound();

  // Defensive: ensure the booking belongs to a service of this salon
  const { data: service } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price, provider_id")
    .eq("id", booking.service_id)
    .maybeSingle();
  if (!service || service.provider_id !== salon.id) notFound();

  const start = DateTime.fromJSDate(new Date(booking.time_slot_start), {
    zone: CASABLANCA_TZ,
  });
  const end = DateTime.fromJSDate(new Date(booking.time_slot_end), {
    zone: CASABLANCA_TZ,
  });

  // Build .ics server-side (it's deterministic; we send it as a data URL)
  const ics = buildIcs({
    uid: booking.id,
    summary: `${service.name} — ${salon.businessName}`,
    description: `${t.icsDescription} Référence: ${booking.id.slice(0, 8).toUpperCase()}`,
    location: salon.address ?? salon.businessName,
    startIso: start.toUTC().toISO()!,
    endIso: end.toUTC().toISO()!,
    organizerName: salon.businessName,
    attendeeName: booking.client_name ?? "Client",
  });

  const icsDataUrl =
    "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);

  const refDisplay = booking.id.slice(0, 8).toUpperCase();
  const dateDisplay = start.toFormat("cccc d LLLL yyyy 'à' HH'h'mm", {
    locale: locale === "ar" ? "ar" : locale === "en" ? "en" : "fr",
  });
  const dateDisplayArabic = start
    .setLocale("ar")
    .toFormat("cccc d LLLL yyyy 'في' HH:mm");

  const manageHref = manageToken ? `/${slug}/book/manage/${manageToken}` : null;

  return (
    <main className="bg-canvas text-ink">
      <Container size="sm" bleed>
        {/* Success header */}
        <header className="text-center">
          <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
            {t.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
            {t.heading}
          </h1>
          <p
            className="mx-auto mt-3 max-w-md font-arabic text-body-lg text-ink-muted"
            dir="rtl"
          >
            {t.headingArabic}
          </p>
          <p className="mt-4 text-body-lg leading-relaxed text-ink-muted">
            {t.sub}{" "}
            <strong className="font-medium text-ink">
              {salon.businessName}
            </strong>
            {locale === "ar" && (
              <span className="mt-1 block font-arabic" dir="rtl">
                {dateDisplayArabic}
              </span>
            )}
          </p>
        </header>

        {/* Reference */}
        <Banner tone="accent" className="mt-12 text-center">
          <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
            {t.referenceLabel}
          </p>
          <p className="mt-2 font-mono text-h2 font-medium tracking-wider text-accent">
            {refDisplay}
          </p>
        </Banner>

        {/* Summary */}
        <dl className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
          <KeyValueRow label={t.service} value={service.name} />
          <KeyValueRow label={t.dateTime} value={dateDisplay} />
          <KeyValueRow
            label={t.duration}
            value={`${service.duration_minutes} min`}
          />
          <KeyValueRow label={t.place} value={salon.businessName} />
          {booking.client_email && (
            <KeyValueRow label={t.email} value={booking.client_email} mono />
          )}
        </dl>

        {/* CTAs */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={icsDataUrl}
            download={`reservation-${refDisplay}.ics`}
            className="inline-flex"
          >
            <Button variant="primary" size="md">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 5v14m-7-7l7 7 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t.calendarCta}
            </Button>
          </a>
          {manageHref && (
            <Link href={manageHref} className="inline-flex">
              <Button variant="secondary" size="md">
                {t.manageCta}
              </Button>
            </Link>
          )}
          <Link href={`/${slug}`} className="inline-flex">
            <Button variant="ghost" size="md">
              {t.backCta}
            </Button>
          </Link>
        </div>

        {/* Footer trust strip */}
        <hr className="mx-auto mt-12 max-w-md border-border" />
        <p className="mt-8 text-center text-caption text-ink-muted">
          {t.emailSent}{" "}
          <Link
            href={`/${slug}/legal`}
            className="text-ink underline decoration-border underline-offset-2 transition-base duration-base ease-standard hover:decoration-accent hover:text-accent"
          >
            {t.legalLink}
          </Link>
          .
        </p>
      </Container>
    </main>
  );
}

const labels = {
  fr: {
    eyebrow: "✓ Réservation confirmée",
    heading: "Votre rendez-vous est confirmé.",
    headingArabic: "تم تأكيد موعدكم",
    sub: "Votre rendez-vous chez",
    referenceLabel: "Référence",
    service: "Prestation",
    dateTime: "Date & heure",
    duration: "Durée",
    place: "Lieu",
    email: "E-mail",
    calendarCta: "Ajouter au calendrier",
    manageCta: "Modifier ou annuler",
    backCta: "Retour à l'accueil",
    emailSent: "Un e-mail de confirmation vous a été envoyé.",
    legalLink: "Mentions légales & confidentialité",
    icsDescription: "Votre rendez-vous chez votre salon ReserNova. Référence:",
  },
  en: {
    eyebrow: "✓ Booking confirmed",
    heading: "Your booking is confirmed.",
    headingArabic: "تم تأكيد موعدكم",
    sub: "Your appointment at",
    referenceLabel: "Reference",
    service: "Service",
    dateTime: "Date & time",
    duration: "Duration",
    place: "Location",
    email: "Email",
    calendarCta: "Add to calendar",
    manageCta: "Modify or cancel",
    backCta: "Back to home",
    emailSent: "A confirmation email has been sent to you.",
    legalLink: "Legal & privacy",
    icsDescription: "Your appointment at your ReserNova salon. Reference:",
  },
  ar: {
    eyebrow: "✓ تم تأكيد الحجز",
    heading: "تم تأكيد موعدكم.",
    headingArabic: "تم تأكيد موعدكم",
    sub: "موعدكم في",
    referenceLabel: "المرجع",
    service: "الخدمة",
    dateTime: "التاريخ والوقت",
    duration: "المدة",
    place: "المكان",
    email: "البريد الإلكتروني",
    calendarCta: "أضف إلى التقويم",
    manageCta: "تعديل أو إلغاء",
    backCta: "العودة إلى الصفحة الرئيسية",
    emailSent: "تم إرسال بريد إلكتروني للتأكيد.",
    legalLink: "الشروط وسياسة الخصوصية",
    icsDescription: "موعدكم في صالون ريزيرنوفا. المرجع:",
  },
} as const;
