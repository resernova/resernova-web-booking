/**
 * Sentry 10 instrumentation — Next.js calls this once on server boot
 * and once on client init. Replaces the legacy sentry.client.config.ts
 * + sentry.server.config.ts + sentry.edge.config.ts pattern.
 *
 * Activates only when NEXT_PUBLIC_SENTRY_DSN env var is set.
 *
 * See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}