/**
 * Supabase Edge Function — web-booking-reminder (Phase 2)
 *
 * Cron-triggered 24h reminder for web bookings.
 * Filter: source='web', confirmed, time_slot_start within 23-25h from now.
 * Honours client_whatsapp_optins.opted_in and Ramadan silent hours.
 *
 * Gated behind env WHATSAPP_ENABLED until Meta template approved (Decision #3).
 *
 * Required secrets:
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto)
 *   - META_APP_ID, META_ACCESS_TOKEN, META_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN
 *   - WEB_BOOKING_SIGNING_SECRET (shared with create_web_booking)
 */
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isSilentHour, CASABLANCA_TZ } from "../_shared/time.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Fetch web bookings needing a 24h reminder
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      id, client_name, client_phone, status, source, time_slot_start,
      service:services(name, duration_minutes),
      client:clients(id, whatsapp_optin:client_whatsapp_optins(opted_in))
    `,
    )
    .eq("source", "web")
    .eq("status", "confirmed")
    .gte("time_slot_start", new Date(Date.now() + 23 * 3600_000).toISOString())
    .lte("time_slot_start", new Date(Date.now() + 25 * 3600_000).toISOString());

  if (error) {
    console.error("[web-booking-reminder] query failed", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
    });
  }

  const results: Array<{ bookingId: string; status: string; reason?: string }> =
    [];
  const now = new Date();

  for (const b of bookings ?? []) {
    const bookingId = (b as any).id;
    const clientPhone = (b as any).client_phone;
    const optedIn = (b as any).client?.whatsapp_optin?.[0]?.opted_in ?? false;

    // Idempotency: check reminder_logs
    const { data: existing } = await supabase
      .from("reminder_logs")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("template_name", "web_booking_reminder_v1")
      .limit(1);

    if (existing && existing.length > 0) {
      results.push({
        bookingId,
        status: "skipped",
        reason: "already_reminded",
      });
      continue;
    }

    if (!optedIn) {
      results.push({ bookingId, status: "skipped", reason: "no_optin" });
      await logReminder(supabase, bookingId, "skipped_no_optin");
      continue;
    }

    if (!clientPhone) {
      results.push({ bookingId, status: "skipped", reason: "no_phone" });
      await logReminder(supabase, bookingId, "skipped_no_optin");
      continue;
    }

    // Ramadan silent hours
    if (isSilentHour(now)) {
      results.push({ bookingId, status: "skipped", reason: "silent_hours" });
      await logReminder(supabase, bookingId, "skipped_silent_hours");
      continue;
    }

    // Send via Meta Graph API v22.0 (Phase 2 — gated)
    const whatsappEnabled = Deno.env.get("WHATSAPP_ENABLED") === "true";
    if (!whatsappEnabled) {
      results.push({
        bookingId,
        status: "skipped",
        reason: "whatsapp_disabled",
      });
      continue;
    }

    try {
      // TODO Phase 2: implement Meta UTILITY template web_booking_reminder_v1 via v22.0
      // await sendWhatsAppTemplate(clientPhone, "web_booking_reminder_v1", {...});
      await logReminder(supabase, bookingId, "sent");
      results.push({ bookingId, status: "sent" });
    } catch (e) {
      console.error(`[web-booking-reminder] send failed for ${bookingId}`, e);
      await logReminder(supabase, bookingId, "failed");
      results.push({ bookingId, status: "failed", reason: String(e) });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: results.length, results }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});

async function logReminder(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  status: string,
) {
  await supabase.from("reminder_logs").insert({
    booking_id: bookingId,
    template_name: "web_booking_reminder_v1",
    status,
  });
}
