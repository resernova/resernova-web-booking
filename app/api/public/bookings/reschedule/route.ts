/**
 * POST /api/public/bookings/reschedule
 *
 * Body: { token, slotStart, slotEnd }
 * → calls reschedule_web_booking RPC (HMAC-verified)
 * → returns JSONB envelope with new (rotated) manage token + new slot
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { RescheduleRequest } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INPUT", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const parsed = RescheduleRequest.safeParse(body);
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

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("reschedule_web_booking", {
    p_manage_token: parsed.data.token,
    p_new_slot_start: parsed.data.slotStart,
    p_new_slot_end: parsed.data.slotEnd,
  });

  if (error) {
    const code = mapPgErrorToApiError(error.message);
    const status = code === "INVALID_TOKEN" ? 401
                 : code === "BOOKING_NOT_FOUND" ? 404
                 : code === "SLOT_TAKEN" ? 409
                 : code === "SLOT_IN_PAST" ? 410
                 : code === "BOOKING_NOT_RESCHEDULABLE" ? 409
                 : 400;
    return NextResponse.json(
      { success: false, error: { code, message: error.message } },
      { status },
    );
  }

  if (data && typeof data === "object" && "success" in data) {
    return NextResponse.json(data, { status: 200 });
  }
  return NextResponse.json(data, { status: 200 });
}

function mapPgErrorToApiError(message: string): import("@/lib/validation/schemas").ApiErrorCode {
  if (message.includes("INVALID_TOKEN")) return "INVALID_TOKEN";
  if (message.includes("BOOKING_NOT_FOUND")) return "BOOKING_NOT_FOUND";
  if (message.includes("SLOT_TAKEN")) return "SLOT_TAKEN";
  if (message.includes("SLOT_IN_PAST")) return "SLOT_IN_PAST";
  if (message.includes("SLOT_DURATION_MISMATCH")) return "SLOT_DURATION_MISMATCH";
  if (message.includes("BOOKING_NOT_RESCHEDULABLE")) return "BOOKING_NOT_RESCHEDULABLE";
  return "INTERNAL";
}