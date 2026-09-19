/**
 * Server Action — rescheduleBooking.
 * Called from the Manage page's RescheduleForm.
 *
 * Verifies the HMAC manage token, then calls `reschedule_web_booking` RPC.
 * Returns the JSONB envelope.
 */
"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ApiOkEnvelope, ApiErrEnvelope } from "@/lib/validation/schemas";

type ReschedulePayload = {
  manageToken: string;
  newSlotStart: string;
  newSlotEnd: string;
};

export async function rescheduleBooking(payload: unknown): Promise<
  | ApiOkEnvelope<{
      bookingId: string;
      status: string;
      newSlotStart: string;
      newSlotEnd: string;
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

  const { manageToken, newSlotStart, newSlotEnd } =
    payload as ReschedulePayload;
  if (
    typeof manageToken !== "string" ||
    typeof newSlotStart !== "string" ||
    typeof newSlotEnd !== "string"
  ) {
    return {
      success: false,
      error: { code: "INVALID_INPUT", message: "Missing fields" },
    };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("reschedule_web_booking", {
    p_manage_token: manageToken,
    p_new_slot_start: newSlotStart,
    p_new_slot_end: newSlotEnd,
  });

  if (error) {
    const code = mapPgErrorToApiError(error.message);
    return {
      success: false,
      error: {
        code,
        message: error.message,
        ...(code === "SLOT_TAKEN" ? { suggestedSlots: undefined } : {}),
      },
    };
  }

  if (data && typeof data === "object" && "success" in data) {
    return data as ApiOkEnvelope<{
      bookingId: string;
      status: string;
      newSlotStart: string;
      newSlotEnd: string;
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
  if (message.includes("SLOT_IN_PAST")) return "SLOT_IN_PAST";
  if (message.includes("SLOT_DURATION_MISMATCH"))
    return "SLOT_DURATION_MISMATCH";
  if (message.includes("SLOT_TAKEN")) return "SLOT_TAKEN";
  if (message.includes("BOOKING_NOT_FOUND")) return "INVALID_INPUT";
  if (message.includes("BOOKING_NOT_RESCHEDULABLE")) return "INVALID_INPUT";
  return "INTERNAL";
}
