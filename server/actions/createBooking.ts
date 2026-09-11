/**
 * Server Action — createBooking.
 * Called from the BookingWizard client component on submit.
 *
 * Validates the payload with Zod, then calls the create_web_booking RPC.
 * Returns the JSONB envelope (success/data or error).
 */
"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  CreateBookingRequest,
  type ApiOkEnvelope,
  type ApiErrEnvelope,
} from "@/lib/validation/schemas";

export async function createBooking(
  request: unknown,
): Promise<ApiOkEnvelope<{ bookingId: string; status: string; manageToken: string; reused: boolean }> | ApiErrEnvelope> {
  // 1. Validate payload
  const parsed = CreateBookingRequest.safeParse(request);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const { slug, payload, idempotencyKey } = parsed.data;

  // 2. Honeypot check (defense in depth — should also be enforced by Zod)
  if (payload.honeypot && payload.honeypot.length > 0) {
    return {
      success: false,
      error: { code: "INVALID_INPUT", message: "Bot detected" },
    };
  }

  // 3. Hash IP (the action runtime IP via X-Forwarded-For)
  //    For Server Actions in production on Vercel, `headers()` exposes them.
  const { headers } = await import("next/headers");
  const h = await headers();
  const xff = h.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0]?.trim() || "unknown";
  const ipHash = await sha256(ip);

  // 4. Call RPC
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("create_web_booking", {
    p_slug: slug,
    p_payload: payload,
    p_idempotency_key: idempotencyKey,
    p_ip_hash: ipHash,
  });

  if (error) {
    // Map Postgres RAISE EXCEPTION codes to our typed error codes
    const code = mapPgErrorToApiError(error.message);
    return {
      success: false,
      error: {
        code,
        message: error.message,
        ...(code === "SLOT_TAKEN" ? { suggestedSlots: extractSuggestedSlots(error) } : {}),
      },
    };
  }

  // RPC returns JSONB envelope; pass through
  if (data && typeof data === "object" && "success" in data) {
    return data as ApiOkEnvelope<{ bookingId: string; status: string; manageToken: string; reused: boolean }>;
  }

  return {
    success: false,
    error: { code: "INTERNAL", message: "Unexpected response from RPC" },
  };
}

async function sha256(input: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(input).digest("hex");
}

function mapPgErrorToApiError(message: string): import("@/lib/validation/schemas").ApiErrorCode {
  if (message.includes("PROVIDER_NOT_FOUND")) return "PROVIDER_NOT_FOUND";
  if (message.includes("PROVIDER_DISABLED")) return "PROVIDER_DISABLED";
  if (message.includes("SERVICE_NOT_FOUND")) return "SERVICE_NOT_FOUND";
  if (message.includes("SLOT_IN_PAST")) return "SLOT_IN_PAST";
  if (message.includes("SLOT_DURATION_MISMATCH")) return "SLOT_DURATION_MISMATCH";
  if (message.includes("SLOT_TAKEN")) return "SLOT_TAKEN";
  if (message.includes("INVALID_INPUT")) return "INVALID_INPUT";
  if (message.includes("RATE_LIMITED")) return "RATE_LIMITED";
  return "INTERNAL";
}

function extractSuggestedSlots(_error: unknown): Array<{ slotStart: string; slotEnd: string }> | undefined {
  // TODO: when the RPC returns suggested slots via RAISE EXCEPTION, parse them here.
  // For now, return undefined — the wizard's SlotGrid will refetch on next render.
  return undefined;
}