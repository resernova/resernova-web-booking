/**
 * Error boundary for the booking wizard route.
 * Token-aligned with the Linear-style editorial language.
 */
"use client";

export default function WizardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl bg-canvas px-4 py-16 text-center text-ink">
      <p className="font-mono text-eyebrow uppercase tracking-wider text-error">
        Erreur
      </p>
      <h1 className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
        Une erreur est survenue
      </h1>
      <p className="mt-3 text-body-lg text-ink-muted">
        {error.message ?? "Impossible de charger cette page."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-body font-medium text-ink-inverse shadow-button transition-base duration-base ease-standard hover:bg-accent-dim"
      >
        Réessayer
      </button>
    </div>
  );
}
