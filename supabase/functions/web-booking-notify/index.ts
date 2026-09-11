/**
 * Supabase Edge Function — web-booking-notify
 *
 * Invoked by pg_net.http_post from the create_web_booking RPC.
 * Sends a Resend email with .ics attachment + inserts a `notifications`
 * row that fires the existing trg_send_fcm_push trigger to push the
 * Flutter mobile dashboard.
 *
 * Phase 1 MVP: email-only path. Phase 2 adds WhatsApp UTILITY template
 * (web_booking_received_v1) once Meta approves the template.
 *
 * Required secrets (set via `supabase secrets set`):
 *   - WEB_BOOKING_SIGNING_SECRET  (must match the Vault value read by create_web_booking)
 *   - RESEND_API_KEY
 *   - RESEND_FROM_EMAIL            (e.g., "ReserNova <bookings@resernova.com>")
 *   - SUPABASE_URL                 (auto-injected by Edge Function runtime)
 *   - SUPABASE_SERVICE_ROLE_KEY    (auto-injected by Edge Function runtime)
 */
// @ts-nocheck — Deno-specific runtime; tsc on Next side ignores
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/resend.ts";
import { buildIcs } from "../_shared/ics.ts";

// ============================================================
// Idempotency in-memory cache (per cold start). pg_net may retry.
// ============================================================
const processedBookings = new Set<string>();

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-web-booking-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Verify signing secret (defense in depth — pg_net already authenticates as service_role)
  const expectedSecret = Deno.env.get("WEB_BOOKING_SIGNING_SECRET");
  const providedSecret = req.headers.get("x-web-booking-signature");
  if (!expectedSecret) {
    console.error("[web-booking-notify] WEB_BOOKING_SIGNING_SECRET not set");
    return new Response(
      JSON.stringify({
        ok: false,
        error: "WEB_BOOKING_SIGNING_SECRET not configured",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  if (providedSecret !== expectedSecret) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid signature" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 2. Parse body
  let payload: { bookingId?: string; slug?: string; idempotencyKey?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { bookingId, slug } = payload;
  if (!bookingId || !slug) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing bookingId or slug" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 3. Service-role Supabase client
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // 4. Idempotency — has this booking already been notified?
  if (processedBookings.has(bookingId)) {
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "in_memory_dedup" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("type", "web_booking")
    .limit(1);

  if (existing && existing.length > 0) {
    processedBookings.add(bookingId);
    return new Response(
      JSON.stringify({ ok: true, skipped: true, reason: "already_notified" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 5. Fetch booking + service + provider + client via single JOIN
  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .select(
      `
      id, client_name, client_phone, client_email, time_slot_start, time_slot_end,
      special_request, status, source,
      service:services(id, name, duration_minutes, price, provider_id),
      provider:service_providers(id, name, business_name, user_id)
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingErr || !booking) {
    console.error("[web-booking-notify] booking lookup failed", bookingErr);
    return new Response(
      JSON.stringify({ ok: false, error: "Booking not found" }),
      {
        status: 200, // always 200 — RPC has committed
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const service = (booking as any).service;
  const provider = (booking as any).provider;
  const businessName = provider?.business_name ?? "Salon";

  // 6. Build .ics
  const icsContent = buildIcs({
    uid: booking.id,
    summary: `${service.name} — ${businessName}`,
    description: `Votre rendez-vous chez ${businessName}. Référence: ${booking.id.slice(0, 8).toUpperCase()}`,
    location: businessName,
    startIso: booking.time_slot_start,
    endIso: booking.time_slot_end,
    organizerName: businessName,
    attendeeName: booking.client_name ?? "Client",
    attendeeEmail: booking.client_email ?? undefined,
  });

  // 7. Email via Resend (if customer provided email)
  let emailId: string | undefined;
  if (booking.client_email) {
    try {
      emailId = await sendEmail({
        to: booking.client_email,
        subject: `Votre rendez-vous chez ${businessName} est confirmé`,
        html: `
          <h2 style="font-family: system-ui; color: #1C6B6D;">Réservation confirmée</h2>
          <p>Bonjour ${escapeHtml(booking.client_name ?? "")},</p>
          <p>Votre rendez-vous <strong>${escapeHtml(service.name)}</strong> chez
          <strong>${escapeHtml(businessName)}</strong> est confirmé.</p>
          <p><strong>Référence :</strong> ${booking.id.slice(0, 8).toUpperCase()}</p>
          <p>Un fichier .ics est attaché à cet e-mail pour ajouter le rendez-vous à votre calendrier.</p>
          <p style="color: #5A6573; font-size: 12px; margin-top: 24px;">
            Pour modifier ou annuler ce rendez-vous, utilisez le lien contenu dans le SMS
            que vous recevrez ou contactez directement le salon.
          </p>
        `,
        attachments: [
          {
            filename: `reservation-${booking.id.slice(0, 8)}.ics`,
            content: icsContent,
            contentType: "text/calendar",
          },
        ],
      });
      console.log(`[web-booking-notify] email sent: ${emailId}`);
    } catch (e) {
      console.error("[web-booking-notify] email send failed", e);
    }
  }

  // 8. Insert notifications row (fires existing trg_send_fcm_push → FCM push to mobile dashboard)
  let notificationId: string | undefined;
  try {
    const { data: notif, error: notifErr } = await supabase
      .from("notifications")
      .insert({
        user_id: provider?.user_id ?? null,
        service_provider_id: provider?.id ?? null,
        booking_id: booking.id,
        type: "web_booking",
        title: "Nouvelle réservation web",
        message: `${booking.client_name ?? "Client"} a réservé ${service.name} via le site web`,
        action_data: {
          bookingId: booking.id,
          slug,
          source: "web",
        },
      })
      .select("id")
      .single();

    if (notifErr) {
      console.error(
        "[web-booking-notify] notification insert failed",
        notifErr,
      );
    } else {
      notificationId = notif?.id;
    }
  } catch (e) {
    console.error("[web-booking-notify] notification insert exception", e);
  }

  // 9. Phase 2: WhatsApp UTILITY template (web_booking_received_v1)
  // Gated behind env flag until Meta approves the template.
  const whatsappEnabled = Deno.env.get("WHATSAPP_ENABLED") === "true";
  let whatsappMessageId: string | undefined;
  if (whatsappEnabled) {
    try {
      // TODO Phase 2: send via Meta Graph API v22.0 using decrypt_token(...)
      // Skip implementation until template is approved (per Decision #3).
    } catch (e) {
      console.error("[web-booking-notify] whatsapp send failed", e);
    }
  }

  processedBookings.add(bookingId);

  return new Response(
    JSON.stringify({
      ok: true,
      notificationId,
      emailId,
      whatsappMessageId,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
