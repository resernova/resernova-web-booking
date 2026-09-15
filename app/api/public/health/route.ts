/**
 * GET /api/public/health — liveness probe.
 * Cheap endpoint for Vercel health checks + uptime monitoring.
 * Node.js runtime (Next 16 deprecated the Edge runtime).
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
}
