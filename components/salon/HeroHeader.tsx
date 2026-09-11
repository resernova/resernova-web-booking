/**
 * HeroHeader — curved gradient header echoing the Flutter dashboard.
 * Deep teal gradient + decorative orbs + 36px radius bottom.
 */
import Link from "next/link";

type Props = {
  businessName: string;
  slug: string;
  heroImageUrl?: string | null;
};

export function HeroHeader({ businessName, slug, heroImageUrl }: Props) {
  return (
    <header className="gradient-hero relative overflow-hidden rounded-b-[36px] pb-10 pt-12 text-white">
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="absolute -top-20 -right-20 size-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -left-10 size-48 rounded-full bg-white/5 blur-2xl"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Logo / monogram */}
          <div className="grid size-12 place-items-center rounded-2xl bg-white/15 font-display text-xl font-bold backdrop-blur-sm">
            {businessName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-white/70">
              ReserNova
            </p>
            <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
              {businessName}
            </h1>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href={`/${slug}/services`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[var(--color-primary-500)] transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-button"
          >
            Voir les services
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M7 5l5 5-5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        {heroImageUrl && (
          <div className="mt-8 overflow-hidden rounded-[28px] border border-white/20 shadow-modal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageUrl}
              alt={`${businessName} — photo principale`}
              className="aspect-[4/3] w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}
      </div>
    </header>
  );
}
