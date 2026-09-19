/**
 * Branded 404 — Linear editorial.
 * Monospace "404" label + bilingual subtitle + 2 CTAs via Button primitive.
 */
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-16">
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
          <Link href="/" className="inline-flex">
            <Button variant="primary" size="md">
              <span aria-hidden>←</span>
              Retour à l&apos;accueil
            </Button>
          </Link>
          <Link href="/salons" className="inline-flex">
            <Button variant="secondary" size="md">
              Trouver un salon
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
