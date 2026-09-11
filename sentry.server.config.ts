/**
 * Sentry 10 — Server runtime config.
 * Imported lazily by instrumentation.ts when NEXT_RUNTIME === "nodejs".
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enableLogs: false,
    // PII: scrub user data before sending
    sendDefaultPii: false,
    // Server-side beforeSend: strip Authorization / Cookie / IP
    beforeSendTransaction(event) {
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
  });
}