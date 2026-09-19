/**
 * Server Action — cancelBooking.
 * Called from the Manage page's CancelForm.
 *
 * Verifies the HMAC manage token server-side, then calls the
 * `cancel_web_booking` RPC. Returns the JSONB envelope.
 */
"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ApiOkEnvelope, ApiErrEnvelope } from "@/lib/validation/schemas";

type CancelPayload = {
  manageToken: string;
  reason?: string;
};

export async function cancelBooking(payload: unknown): Promise<
  | ApiOkEnvelope<{
      bookingId: string;
      status: "canceled_by_customer";
      newManageToken: string;
    }>
  | ApiErrEnvelope
> {
  if (typeof payload !== "object" || payload === null) {
    return {
      success: false,
      error: { code: "INVALID_INPUT", message: "Invalid payload" },
    };
  }

  const { manageToken, reason } = payload as CancelPayload;
  if (typeof manageToken !== "string" || manageToken.length === 0) {
    return {
      success: false,
      error: { code: "INVALID_INPUT", message: "Missing manage token" },
    };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("cancel_web_booking", {
    p_manage_token: manageToken,
    p_reason: reason ?? null,
  });

  if (error) {
    const code = mapPgErrorToApiError(error.message);
    return {
      success: false,
      error: { code, message: error.message },
    };
  }

  if (data && typeof data === "object" && "success" in data) {
    return data as ApiOkEnvelope<{
      bookingId: string;
      status: "canceled_by_customer";
      newManageToken: string;
    }>;
  }

  return {
    success: false,
    error: { code: "INTERNAL", message: "Unexpected response from RPC" },
  };
}

function mapPgErrorToApiError(
  message: string,
): import("@/lib/validation/schemas").ApiErrorCode {
  if (message.includes("INVALID_TOKEN")) return "INVALID_INPUT";
  if (message.includes("BOOKING_NOT_FOUND")) return "INVALID_INPUT";
  if (message.includes("BOOKING_ALREADY_FINALIZED")) return "INVALID_INPUT";
  return "INTERNAL";
}
