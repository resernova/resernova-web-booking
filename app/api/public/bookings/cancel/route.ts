/**
 * POST /api/public/bookings/cancel
 *
 * Body: { token, reason? }
 * → calls cancel_web_booking RPC (HMAC-verified)
 * → returns JSONB envelope with new (rotated) manage token
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { CancelRequest } from "@/lib/validation/schemas";

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

  const parsed = CancelRequest.safeParse(body);
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
  const { data, error } = await supabase.rpc("cancel_web_booking", {
    p_manage_token: parsed.data.token,
    p_reason: parsed.data.reason ?? null,
  });

  if (error) {
    const code = mapPgErrorToApiError(error.message);
    const status =
      code === "INVALID_TOKEN"
        ? 401
        : code === "BOOKING_NOT_FOUND"
          ? 404
          : code === "BOOKING_ALREADY_FINALIZED"
            ? 409
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

function mapPgErrorToApiError(
  message: string,
): import("@/lib/validation/schemas").ApiErrorCode {
  if (message.includes("INVALID_TOKEN")) return "INVALID_TOKEN";
  if (message.includes("BOOKING_NOT_FOUND")) return "BOOKING_NOT_FOUND";
  if (message.includes("BOOKING_ALREADY_FINALIZED"))
    return "BOOKING_ALREADY_FINALIZED";
  return "INTERNAL";
}
