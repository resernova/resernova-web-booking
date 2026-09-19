/**
 * Branded 404 — Linear editorial.
 * Monospace "404" label + bilingual subtitle + 2 CTAs.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
          404
        </p>
        <h1 className="mt-4 font-display text-display-sm font-medium leading-tight text-ink md:text-display-md">
          Page introuvable
        </h1>
        <p className="mt-2 font-arabic text-h4 text-ink-muted" dir="rtl">
          الصفحة غير موجودة
        </p>
        <p className="mt-6 text-body-lg text-ink-muted">
          Le salon ou la réservation que vous cherchez n&apos;existe pas.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-body font-medium text-ink-inverse shadow-button transition-base duration-base ease-standard hover:bg-accent-dim hover:-translate-y-px"
          >
            <span aria-hidden>←</span>
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/salons"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-canvas px-6 py-3 text-body font-medium text-ink transition-base duration-base ease-standard hover:border-ink-muted hover:bg-surface"
          >
            Trouver un salon
          </Link>
        </div>
      </div>
    </main>
  );
}
