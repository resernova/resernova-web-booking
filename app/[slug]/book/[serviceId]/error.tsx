/**
 * Error boundary for the booking wizard route.
 */
"use client";

export default function WizardError({
  error,
  reset,
}: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        {error.message ?? "Impossible de charger cette page."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-5 py-2.5 font-semibold text-white shadow-button"
      >
        Réessayer
      </button>
    </div>
  );
}