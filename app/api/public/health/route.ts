/**
 * GET /api/public/health — liveness probe.
 * Cheap endpoint for Vercel health checks + uptime monitoring.
 * Edge runtime for low latency.
 */
import { NextResponse } from "next/server";

export const runtime = "edge";
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