/**
 * Booking wizard page — server-rendered shell.
 * Loads service + provider + staff, then renders the client wizard.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import { getServiceById } from "@/server/queries/getPublishedServices";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { BookingWizard } from "@/components/booking/BookingWizard";

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
}: {
  params: Promise<RouteParams>;
}) {
  const { slug, serviceId } = await params;
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

  return (
    <main className="min-h-dvh pb-12">
      <div className="gradient-hero rounded-b-[36px] px-4 pb-8 pt-10 text-white sm:px-6">
        <Link
          href={`/${salon.publicSlug}/services`}
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
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
        <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
          Réserver
        </h1>
      </div>

      <BookingWizard
        slug={salon.publicSlug}
        serviceId={service.id}
        serviceName={service.name}
        serviceDurationMinutes={service.durationMinutes}
        servicePrice={service.price}
        staff={staffList}
      />
    </main>
  );
}
