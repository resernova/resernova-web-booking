/**
 * POST /api/public/availability
 *
 * Body: { slug, serviceId, date, staffId? }
 * → calls get_web_availability RPC (service-role client)
 * → returns JSONB envelope with cache headers
 *
 * Cache strategy: s-maxage=60, stale-while-revalidate=300.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { AvailabilityRequest } from "@/lib/validation/schemas";

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

  const parsed = AvailabilityRequest.safeParse(body);
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
  const { data, error } = await supabase.rpc("get_web_availability", {
    p_slug: parsed.data.slug,
    p_service_id: parsed.data.serviceId,
    p_date: parsed.data.date,
    p_staff_id: parsed.data.staffId ?? null,
  });

  if (error) {
    const code = mapPgErrorToApiError(error.message);
    const status =
      code === "PROVIDER_DISABLED"
        ? 403
        : code === "PROVIDER_NOT_FOUND" || code === "SERVICE_NOT_FOUND"
          ? 404
          : 400;
    return NextResponse.json(
      { success: false, error: { code, message: error.message } },
      { status, headers: cacheHeaders(0) },
    );
  }

  return NextResponse.json(unwrapV2Envelope(data), {
    status: 200,
    headers: cacheHeaders(60),
  });
}

function cacheHeaders(sMaxAge: number) {
  return {
    "Cache-Control": `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=300`,
  };
}

function unwrapV2Envelope(data: unknown) {
  if (data && typeof data === "object" && "success" in data) return data;
  return { success: true, data };
}

function mapPgErrorToApiError(
  message: string,
): import("@/lib/validation/schemas").ApiErrorCode {
  if (message.includes("PROVIDER_NOT_FOUND")) return "PROVIDER_NOT_FOUND";
  if (message.includes("PROVIDER_DISABLED")) return "PROVIDER_DISABLED";
  if (message.includes("SERVICE_NOT_FOUND")) return "SERVICE_NOT_FOUND";
  return "INTERNAL";
}
