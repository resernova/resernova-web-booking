/**
 * POST /api/public/bookings/create
 *
 * Body: { slug, payload, idempotencyKey }
 * → calls create_web_booking RPC (service-role client)
 * → returns JSONB envelope
 *
 * NOTE: alternative path to the Server Action in server/actions/createBooking.ts.
 * Server Actions handle form posts inside Next.js; this Route Handler handles
 * external API clients (curl, mobile clients, future embeddable widget).
 * Both wrap the same RPC.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CreateBookingRequest } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_INPUT", message: "Invalid JSON" },
      },
      { status: 400 },
    );
  }

  const parsed = CreateBookingRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { slug, payload, idempotencyKey } = parsed.data;

  if (payload.honeypot && payload.honeypot.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_INPUT", message: "Bot detected" },
      },
      { status: 400 },
    );
  }

  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("create_web_booking", {
    p_slug: slug,
    p_payload: payload,
    p_idempotency_key: idempotencyKey,
    p_ip_hash: ipHash,
  });

  if (error) {
    const code = mapPgErrorToApiError(error.message);
    const status =
      code === "SLOT_TAKEN"
        ? 409
        : code === "SLOT_IN_PAST"
          ? 410
          : code === "PROVIDER_DISABLED"
            ? 403
            : code === "PROVIDER_NOT_FOUND" || code === "SERVICE_NOT_FOUND"
              ? 404
              : code === "RATE_LIMITED"
                ? 429
                : 400;
    return NextResponse.json(
      { success: false, error: { code, message: error.message } },
      { status },
    );
  }

  if (data && typeof data === "object" && "success" in data) {
    return NextResponse.json(data, { status: 200 });
  }
  return NextResponse.json(
    {
      success: false,
      error: { code: "INTERNAL", message: "Unexpected response" },
    },
    { status: 500 },
  );
}

function mapPgErrorToApiError(
  message: string,
): import("@/lib/validation/schemas").ApiErrorCode {
  if (message.includes("PROVIDER_NOT_FOUND")) return "PROVIDER_NOT_FOUND";
  if (message.includes("PROVIDER_DISABLED")) return "PROVIDER_DISABLED";
  if (message.includes("SERVICE_NOT_FOUND")) return "SERVICE_NOT_FOUND";
  if (message.includes("SLOT_IN_PAST")) return "SLOT_IN_PAST";
  if (message.includes("SLOT_DURATION_MISMATCH"))
    return "SLOT_DURATION_MISMATCH";
  if (message.includes("SLOT_TAKEN")) return "SLOT_TAKEN";
  if (message.includes("RATE_LIMITED")) return "RATE_LIMITED";
  if (message.includes("INVALID_INPUT")) return "INVALID_INPUT";
  return "INTERNAL";
}
