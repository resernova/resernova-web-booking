/**
 * Next.js 16 Proxy — runs at the edge on every request.
 * (Renamed from `middleware.ts` → `proxy.ts` per Next 16; `middleware` is the deprecated alias.)
 *
 * Responsibilities:
 *   1. Rate limit per IP (coarse — Vercel Edge protection)
 *   2. Locale detection (Accept-Language → 'fr' fallback)
 *   3. CSP nonce (Phase 2)
 *
 * Note: granular per-slug rate limits live in web_rate_limits (Migration 013)
 * and are enforced inside the RPC + Edge Function.
 */
import { NextResponse, type NextRequest } from "next/server";

// Coarse in-memory rate limiter — best-effort; production should use Vercel Edge
// Config / Upstash Redis for cross-region accuracy.
const WINDOW_MS = 60_000;
const MAX_PROFILE = 60;       // GET /[slug]    — 60/min/IP
const MAX_API = 10;           // POST /api/*    — 10/min/IP

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

export function proxy(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const pathname = req.nextUrl.pathname;

  // Rate limit only on /[slug] and /api/*
  if (pathname.startsWith("/api/") && !rateLimit(ip, MAX_API)) {
    return new NextResponse(
      JSON.stringify({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } }),
      { status: 429, headers: { "Retry-After": "60", "Content-Type": "application/json" } },
    );
  }

  // Profile pages: rate-limit at 60/min/IP (light, since they're cached RSC)
  const slugMatch = /^\/[a-z0-9][a-z0-9-]{1,38}[a-z0-9](\/.*)?$/.exec(pathname);
  if (slugMatch && !rateLimit(ip, MAX_PROFILE)) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  // Locale detection — read Accept-Language, set header for downstream
  const acceptLang = req.headers.get("accept-language") ?? "fr";
  const locale = acceptLang.toLowerCase().includes("ar") ? "ar"
               : acceptLang.toLowerCase().includes("en") ? "en"
               : "fr";   // Morocco default

  const res = NextResponse.next();
  res.headers.set("x-resolved-locale", locale);
  return res;
}

// Deprecated alias — Vercel may still warn if removed entirely. Keep for one release.
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/public/health
     * - /_next/static, /_next/image
     * - favicon, /public assets
     */
    "/((?!_next/static|_next/image|favicon|public|api/public/health).*)",
  ],
};