/**
 * Sentry initialization — lazy-loaded to avoid overhead in dev.
 * Captures client-side React errors + server-side Route Handler / Server Action exceptions.
 *
 * Activated only when SENTRY_DSN env var is set.
 */
"use client";

import * as Sentry from "@sentry/nextjs";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [Sentry.replayIntegration()],
  });

  initialized = true;
}

// Auto-init on import
initSentry();

export { Sentry };