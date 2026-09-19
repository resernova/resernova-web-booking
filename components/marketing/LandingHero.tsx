/**
 * LandingHero — Linear-style restraint + Cal.com-style live preview.
 *
 * Layout:
 *  - 7-col text (left) + 5-col embedded booking preview (right)
 *  - No carousel. No 3-column feature grid.
 *  - Editorial density: generous whitespace, hairline borders on cards, sharp corners.
 *  - Bilingual hero: French headline + Tajawal Arabic poetic line beneath.
 *  - Display weight: 500 medium (NOT bold) — Linear / Stripe signature move.
 */
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Locale = "fr" | "en" | "ar";

const labels = {
  fr: {
    eyebrow: "Réservation en ligne pour salons",
    headline: "Vos clients réservent en 30 secondes.",
    arabicLine: "حجز المواعيد أصبح أسهل",
    sub: "ReserNova centralise vos rendez-vous, vos paiements et votre équipe — sur une plateforme moderne pensée pour le marché marocain.",
    ctaPrimary: "Démarrer maintenant",
    ctaSecondary: "Voir une démo live",
    salonCountOne: "salon partenaire",
    salonCountMany: "salons partenaires",
    suffix: "au Maroc",
    demo: {
      eyebrow: "Aperçu live",
      bookCta: "Réserver →",
      dayLabels: ["L", "M", "M", "J", "V", "S", "D"],
    },
  },
  en: {
    eyebrow: "Online booking for salons",
    headline: "Your clients book in 30 seconds.",
    arabicLine: "Booking just got easier",
    sub: "ReserNova centralizes your appointments, payments and team — on a modern platform built for the Moroccan market.",
    ctaPrimary: "Get started now",
    ctaSecondary: "See a live demo",
    salonCountOne: "partner salon",
    salonCountMany: "partner salons",
    suffix: "in Morocco",
    demo: {
      eyebrow: "Live preview",
      bookCta: "Book →",
      dayLabels: ["M", "T", "W", "T", "F", "S", "S"],
    },
  },
  ar: {
    eyebrow: "حجز المواعيد للصالونات",
    headline: "عملاؤك يحجزون في 30 ثانية.",
    arabicLine: "حجز المواعيد أصبح أسهل",
    sub: "ريزيرنوفا تجمع مواعيدك ومدفوعاتك وفريقك في منصة عصرية مبنية للسوق المغربي.",
    ctaPrimary: "ابدأ الآن",
    ctaSecondary: "عرض حي",
    salonCountOne: "صالون شريك",
    salonCountMany: "صالونات شريكة",
    suffix: "في المغرب",
    demo: {
      eyebrow: "معاينة حية",
      bookCta: "احجز →",
      dayLabels: ["إ", "ث", "أ", "خ", "ج", "س", "ح"],
    },
  },
};

type Props = {
  salonCount: number;
  locale?: Locale;
};

export function LandingHero({ salonCount, locale = "fr" }: Props) {
  const t = labels[locale];
  const demo = t.demo;

  return (
    <section className="relative bg-canvas">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-12 lg:py-32">
        {/* Left: 7-col text */}
        <div className="lg:col-span-7">
          <p className="text-eyebrow uppercase tracking-wider text-accent">
            {t.eyebrow}
          </p>
          <h1 className="mt-6 font-display text-display-md font-medium leading-tight text-ink md:text-display-lg">
            {t.headline}
          </h1>
          <p className="mt-3 font-arabic text-xl text-ink-muted" dir="rtl">
            {t.arabicLine}
          </p>
          <p className="mt-6 max-w-xl text-body-lg leading-relaxed text-ink-muted">
            {t.sub}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/salons" className="inline-flex">
              <Button variant="primary" size="md">
                {t.ctaPrimary}
                <span aria-hidden>→</span>
              </Button>
            </Link>
            <Link href="#how" className="inline-flex">
              <Button variant="secondary" size="md">
                {t.ctaSecondary}
              </Button>
            </Link>
          </div>

          {salonCount > 0 && (
            <p className="mt-8 text-caption text-ink-muted">
              <strong className="font-medium text-ink">{salonCount}</strong>{" "}
              {salonCount === 1 ? t.salonCountOne : t.salonCountMany} {t.suffix}
            </p>
          )}
        </div>

        {/* Right: 5-col embedded booking preview card (Cal.com pattern) */}
        <div className="lg:col-span-5">
          <div className="rounded-lg border border-border bg-card p-6 shadow-md">
            <p className="text-eyebrow uppercase tracking-wider text-ink-muted">
              {demo.eyebrow}
            </p>

            {/* Service row */}
            <div className="mt-4 flex items-center gap-3 rounded-md bg-surface p-3">
              <div className="size-10 shrink-0 rounded-sm bg-accent-soft" />
              <div className="flex-1">
                <p className="text-body font-medium text-ink">
                  Coupe + Brushing
                </p>
                <p className="text-caption text-ink-muted">30 min · 150 DH</p>
              </div>
            </div>

            {/* Day strip */}
            <div className="mt-4 flex gap-2">
              {[15, 16, 17, 18, 19, 20, 21].map((d, i) => (
                <div
                  key={d}
                  className={`flex h-12 shrink-0 flex-1 flex-col items-center justify-center rounded-md border text-caption ${
                    i === 1
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-canvas"
                  }`}
                >
                  <span className="text-ink-muted">{demo.dayLabels[i]}</span>
                  <span className="text-body font-medium text-ink">{d}</span>
                </div>
              ))}
            </div>

            {/* Slot pills */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["10:00", "11:30", "14:00"].map((t, i) => (
                <button
                  type="button"
                  key={t}
                  className={`rounded-md border px-2 py-1.5 text-center text-body transition-base duration-base ease-standard ${
                    i === 1
                      ? "border-accent bg-accent text-ink-inverse"
                      : "border-border bg-canvas text-ink hover:border-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Confirm CTA */}
            <button
              type="button"
              className="mt-5 w-full rounded-md bg-accent py-3 text-body font-medium text-ink-inverse transition-base duration-base ease-standard hover:bg-accent-dim"
            >
              {demo.bookCta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
