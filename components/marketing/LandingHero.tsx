/**
 * LandingHero — marketing hero for the root `/` page.
 * Brand-true deep teal gradient, bilingual tagline, salon-count badge.
 */
type Props = {
  salonCount: number;
};

export function LandingHero({ salonCount }: Props) {
  return (
    <header className="gradient-hero relative overflow-hidden rounded-b-[36px] pb-16 pt-14 text-white">
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="absolute -left-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-16 right-1/4 size-56 rounded-full bg-white/5 blur-2xl"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-white/15 font-display text-lg font-bold backdrop-blur-sm">
            R
          </div>
          <span className="font-display text-lg font-semibold tracking-wide">
            ReserNova
          </span>
        </div>

        {/* Tagline (trilingual, stacked — fr primary, EN/AR subtitles) */}
        <h1 className="mt-10 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
          Réservez votre prochain{" "}
          <span className="block sm:inline">rendez-vous beauté</span>{" "}
          <span className="block">en quelques clics.</span>
        </h1>
        <p className="mt-4 max-w-2xl font-display text-lg text-white/80 sm:text-xl">
          Book your next beauty appointment in a few taps.
          <span className="mx-2 text-white/40">·</span>
          حجز موعدك القادم في ثوانٍ.
        </p>

        {/* CTA + salon counter */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#salons"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-[var(--color-primary-500)] shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Trouver un salon
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
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-3 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            Comment ça marche
          </a>
        </div>

        {salonCount > 0 && (
          <p className="mt-8 text-sm text-white/70">
            <strong className="font-semibold text-white">{salonCount}</strong>{" "}
            {salonCount === 1 ? "salon partenaire" : "salons partenaires"}{" "}
            disponibles
          </p>
        )}
      </div>
    </header>
  );
}
