/**
 * Branded 404 — applies to the entire site when a page is not found.
 * Carries the brand colors, points the visitor back to `/` or a salon.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh">
      {/* Slim brand strip — partial hero, full teal gradient */}
      <div className="gradient-hero relative h-32 overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-12 -right-12 size-48 rounded-full bg-white/10 blur-3xl"
        />
      </div>

      <div className="mx-auto -mt-16 max-w-2xl px-4 sm:px-6">
        <div className="glass rounded-3xl px-6 py-12 text-center shadow-card sm:px-12 sm:py-16">
          <p className="font-display text-7xl font-bold text-[var(--color-primary-500)]/40">
            404
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Page introuvable
          </h1>
          <p className="mt-3 text-[var(--color-text-muted)]">
            Le salon ou la page que vous cherchez n'existe pas, ou a été
            désactivé.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-5 py-3 font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
              >
                <path
                  d="M13 5l-5 5 5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Retour à l'accueil
            </Link>
            <Link
              href="/#salons"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-3 font-semibold text-[var(--color-text)] hover:bg-zinc-50"
            >
              Trouver un salon
            </Link>
          </div>

          <p className="mt-10 text-xs text-[var(--color-text-muted)]">
            Vous avez un lien de réservation direct ? Vérifiez qu'il est bien
            orthographié — les slugs ressemblent à{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px]">
              salon-elegance-casablanca
            </code>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
