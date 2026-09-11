/**
 * Confirmation page — RSC.
 * Reads booking + service + provider, renders success + .ics download + WhatsApp deep-link.
 *
 * URL hash #t=<manage_token> is never sent to the server (browsers don't include
 * hash in HTTP requests), so it's purely client-side state.
 */
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/utils/ics";
import { CASABLANCA_TZ } from "@/lib/utils/time";
import { getSalonBySlug, getSalonLocation } from "@/server/queries/getSalonBySlug";
import type { Metadata } from "next";

type RouteParams = { slug: string; bookingRef: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) return { title: "Réservation confirmée" };
  return {
    title: "Réservation confirmée",
    description: `Votre rendez-vous chez ${salon.businessName} est confirmé`,
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmPage({ params }: { params: Promise<RouteParams> }) {
  const { slug, bookingRef } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const supabase = createServiceRoleClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, client_name, client_phone, client_email, time_slot_start, time_slot_end, special_request, status, source, service_id")
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

  const location = await getSalonLocation(slug);
  const start = DateTime.fromJSDate(new Date(booking.time_slot_start), { zone: CASABLANCA_TZ });
  const end = DateTime.fromJSDate(new Date(booking.time_slot_end), { zone: CASABLANCA_TZ });

  // Build .ics server-side (it's deterministic; we send it as a data URL)
  const ics = buildIcs({
    uid: booking.id,
    summary: `${service.name} — ${salon.businessName}`,
    description: `Votre rendez-vous chez ${salon.businessName}. Référence: ${booking.id.slice(0, 8).toUpperCase()}`,
    location: location?.address ?? salon.businessName,
    startIso: start.toUTC().toISO()!,
    endIso: end.toUTC().toISO()!,
    organizerName: salon.businessName,
    attendeeName: booking.client_name ?? "Client",
  });

  const icsDataUrl = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);

  const whatsappDeepLink = location?.whatsapp_display_phone
    ? `https://wa.me/${location.whatsapp_display_phone.replace(/[^\d+]/g, "").replace(/^\+/, "")}?text=${encodeURIComponent(
        `Bonjour, je viens de réserver ${service.name} chez ${salon.businessName} le ${start.toFormat("dd LLL yyyy 'à' HH'h'mm", { locale: "fr" })}. Référence: ${booking.id.slice(0, 8).toUpperCase()}.`,
      )}`
    : null;

  const refDisplay = booking.id.slice(0, 8).toUpperCase();
  const dateDisplay = start.toFormat("cccc d LLLL yyyy 'à' HH'h'mm", { locale: "fr" });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Success header */}
      <div className="text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-[var(--color-accent-500)]/10">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12.5l5 5 9-11" stroke="var(--color-accent-600)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Réservation confirmée !</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Votre rendez-vous chez <strong>{salon.businessName}</strong> est confirmé.
        </p>
      </div>

      {/* Reference */}
      <div className="mt-8 rounded-2xl bg-[var(--color-primary-500)]/5 p-5 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Référence</p>
        <p className="mt-1 font-display text-2xl font-bold tracking-wide text-[var(--color-primary-500)]">{refDisplay}</p>
      </div>

      {/* Summary */}
      <dl className="mt-6 space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-5 text-sm shadow-card">
        <div className="flex items-center justify-between">
          <dt className="text-[var(--color-text-muted)]">Prestation</dt>
          <dd className="font-medium">{service.name}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-[var(--color-text-muted)]">Date & heure</dt>
          <dd className="font-medium">{dateDisplay}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-[var(--color-text-muted)]">Durée</dt>
          <dd className="font-medium">{service.duration_minutes} min</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-[var(--color-text-muted)]">Lieu</dt>
          <dd className="font-medium">{salon.businessName}</dd>
        </div>
        {booking.client_email && (
          <div className="flex items-center justify-between">
            <dt className="text-[var(--color-text-muted)]">E-mail</dt>
            <dd className="font-medium">{booking.client_email}</dd>
          </div>
        )}
      </dl>

      {/* CTAs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={icsDataUrl}
          download={`reservation-${refDisplay}.ics`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary-500)] px-5 py-3 font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14m-7-7l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ajouter au calendrier
        </a>
        {whatsappDeepLink && (
          <a
            href={whatsappDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent-500)] px-5 py-3 font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Envoyer sur WhatsApp
          </a>
        )}
        <Link
          href={`/${slug}`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-3 font-semibold text-[var(--color-text)] hover:bg-zinc-50"
        >
          Retour à l'accueil
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">
        Un e-mail de confirmation vous a été envoyé.
        {" "}
        <Link href={`/${slug}/legal`} className="underline">Mentions légales & confidentialité</Link>.
      </p>
    </main>
  );
}