/**
 * Manage page — RSC shell.
 * Validates the HMAC manage token server-side, then renders the booking
 * summary + a 2-tab segmented control (reschedule / cancel).
 *
 * Token verification calls the `verify_manage_token` RPC (migration 017).
 * If the token is invalid or expired, renders a branded error state with
 * a link back to the salon.
 */
import { DateTime } from "luxon";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CASABLANCA_TZ } from "@/lib/utils/time";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import { resolveLocale, type Locale } from "@/lib/i18n/config";
import { manageLabels } from "@/lib/i18n/labels";
import { SegmentedControl } from "./SegmentedControl";
import { CancelForm } from "./CancelForm";
import { RescheduleForm } from "./RescheduleForm";

type RouteParams = { slug: string; token: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  return {
    title: salon
      ? `Gérer ma réservation — ${salon.businessName}`
      : "Gérer ma réservation",
    robots: { index: false, follow: false },
  };
}

type ManageBooking = {
  bookingId: string;
  slug: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  start: Date;
  end: Date;
  status: string;
};

async function verifyAndLoad(
  token: string,
  slug: string,
): Promise<ManageBooking | null> {
  const supabase = createServiceRoleClient();

  // 1. Verify token (returns booking_id or null)
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "verify_manage_token",
    { p_token: token },
  );
  if (rpcError || !rpcData) return null;

  // 2. Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      "id, time_slot_start, time_slot_end, status, source, service_id, provider_id",
    )
    .eq("id", rpcData)
    .maybeSingle();
  if (bookingError || !booking) return null;

  // 3. Resolve slug from provider
  const salon = await getSalonBySlug(slug);
  if (!salon || salon.id !== booking.provider_id) return null;

  // 4. Fetch service name + duration
  const { data: service } = await supabase
    .from("services")
    .select("id, name, duration_minutes")
    .eq("id", booking.service_id)
    .maybeSingle();
  if (!service) return null;

  return {
    bookingId: booking.id,
    slug,
    serviceId: booking.service_id,
    serviceName: service.name,
    serviceDurationMinutes: service.duration_minutes,
    start: new Date(booking.time_slot_start),
    end: new Date(booking.time_slot_end),
    status: booking.status,
  };
}

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug, token } = await params;
  const { locale: localeRaw } = await searchParams;
  const locale: Locale = resolveLocale(localeRaw ?? null);
  const labels = manageLabels[locale];

  const booking = await verifyAndLoad(token, slug);

  if (!booking) {
    return (
      <main className="mx-auto max-w-xl bg-canvas px-4 py-24 text-center text-ink sm:px-6">
        <p className="font-mono text-eyebrow uppercase tracking-wider text-error">
          {labels.statusCanceled === "Annulé"
            ? "Lien invalide"
            : "Invalid link"}
        </p>
        <h1 className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
          {labels.invalidTokenHeading}
        </h1>
        <p className="mt-4 text-body-lg leading-relaxed text-ink-muted">
          {labels.invalidTokenBody}
        </p>
        <Link href={`/${slug}`} className="mt-8 inline-flex">
          <Button variant="primary" size="md">
            {labels.browserBack}
          </Button>
        </Link>
      </main>
    );
  }

  const start = DateTime.fromJSDate(booking.start, { zone: CASABLANCA_TZ });
  const dateDisplay = start.toFormat("cccc d LLLL yyyy 'à' HH'h'mm", {
    locale: locale === "ar" ? "ar" : locale === "en" ? "en" : "fr",
  });
  const refDisplay = booking.bookingId.slice(0, 8).toUpperCase();
  const initialDate = start.toISODate();
  const isFinalized = [
    "canceled_by_customer",
    "rejected_by_provider",
    "completed",
  ].includes(booking.status);

  return (
    <main className="mx-auto max-w-3xl bg-canvas px-4 py-12 text-ink sm:px-6">
      {/* Header */}
      <header className="border-b border-border pb-8">
        <Link
          href={`/${slug}`}
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
          {labels.backToSalon}
        </Link>
        <p className="mt-4 font-mono text-eyebrow uppercase tracking-wider text-accent">
          {labels.eyebrow}
        </p>
        <h1 className="mt-2 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
          {labels.heading}
        </h1>
        <p className="mt-2 font-mono text-caption text-ink-muted">
          {labels.referenceLabel}:{" "}
          <span className="text-ink">{refDisplay}</span>
        </p>
      </header>

      {/* Current booking summary */}
      <section
        aria-labelledby="current-booking"
        className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm"
      >
        <h2
          id="current-booking"
          className="font-display text-h4 font-medium text-ink"
        >
          {labels.currentBookingHeading}
        </h2>
        <dl className="mt-4 space-y-3 text-body-sm">
          <Row label={labels.service} value={booking.serviceName} />
          <Row label={labels.dateTime} value={dateDisplay} />
          <Row
            label={labels.duration}
            value={`${booking.serviceDurationMinutes} min`}
          />
          <Row
            label={labels.status}
            value={statusLabel(booking.status, locale, labels)}
          />
        </dl>
      </section>

      {/* Tabs */}
      <section className="mt-10">
        {isFinalized ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-center">
            <p className="text-body-sm text-ink-muted">
              {labels.cancelHeading}
            </p>
          </div>
        ) : (
          <SegmentedControl
            tabs={[
              {
                id: "reschedule",
                label: labels.tabs.reschedule,
                render: () => (
                  <RescheduleForm
                    manageToken={token}
                    serviceId={booking.serviceId}
                    serviceDurationMinutes={booking.serviceDurationMinutes}
                    labels={labels}
                    slug={slug}
                    locale={locale}
                    initialDate={initialDate}
                  />
                ),
              },
              {
                id: "cancel",
                label: labels.tabs.cancel,
                render: () => (
                  <CancelForm manageToken={token} labels={labels} slug={slug} />
                ),
              },
            ]}
            initial="reschedule"
          />
        )}
      </section>

      {/* Footer note */}
      <hr className="mx-auto mt-12 max-w-md border-border" />
      <p className="mt-6 text-center text-caption text-ink-muted">
        <Link
          href={`/${slug}/legal`}
          className="text-ink underline decoration-border underline-offset-2 transition-base duration-base ease-standard hover:decoration-accent hover:text-accent"
        >
          {labels.browserBack === "Back to home"
            ? "Legal & privacy"
            : labels.browserBack === "العودة إلى الصفحة الرئيسية"
              ? "الشروط وسياسة الخصوصية"
              : "Mentions légales & confidentialité"}
        </Link>
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function statusLabel(
  status: string,
  locale: Locale,
  labels: (typeof manageLabels)[Locale],
): string {
  if (status === "confirmed") return labels.statusConfirmed;
  if (status === "pending_staff_approval") return labels.statusPending;
  if (status === "canceled_by_customer" || status === "rejected_by_provider")
    return labels.statusCanceled;
  if (status === "completed") return labels.statusCompleted;
  return status;
}
