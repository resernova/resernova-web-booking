/**
 * SalonCard — directory-card on the root landing page.
 * 2-col on mobile, 3-col on md+. Hero image (or seeded gradient fallback),
 * business name, address, OpenHoursBadge (if available), "Réserver" CTA.
 */
import Link from "next/link";
import { openToday } from "@/lib/utils/time";
import type { PublicSalonCard } from "@/server/queries/getAllPublicSalons";

type Props = {
  salon: PublicSalonCard;
};

const labels = {
  fr: { cta: "Réserver", bookCta: "Voir le salon" },
  en: { cta: "Book", bookCta: "View salon" },
};

export function SalonCard({ salon }: Props) {
  const today = openToday(salon.webMeta?.availability ?? null);
  const showOpenBadge = today.isOpen || today.opensAt !== undefined;

  // Generate a stable-ish gradient seed from slug for visual differentiation
  const seed = salon.slug
    .split("")
    .reduce((acc, c) => (acc + c.charCodeAt(0)) % 360, 0);
  const gradient = `linear-gradient(135deg, hsl(${seed}, 50%, 35%) 0%, hsl(${(seed + 40) % 360}, 45%, 50%) 100%)`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-card transition-transform hover:-translate-y-0.5">
      {/* Hero image or gradient fallback */}
      <Link
        href={`/${salon.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
        aria-label={`Voir ${salon.businessName}`}
      >
        {salon.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={salon.heroImageUrl}
            alt={salon.businessName}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full" style={{ background: gradient }}>
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-5xl font-bold text-white/90 mix-blend-overlay">
                {salon.businessName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {showOpenBadge && (
          <div className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow-card backdrop-blur-sm">
            {today.isOpen ? (
              <span className="text-[var(--color-accent-600)]">● Ouvert</span>
            ) : today.opensAt ? (
              <span className="text-amber-700">● Ouvre à {today.opensAt}</span>
            ) : null}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-tight">
          {salon.businessName}
        </h3>

        {salon.description && (
          <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">
            {salon.description}
          </p>
        )}

        {salon.address && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-[var(--color-text-muted)]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
              className="mt-0.5 shrink-0"
            >
              <path
                d="M10 18s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="10"
                cy="8"
                r="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="line-clamp-2">{salon.address}</span>
          </p>
        )}

        <div className="mt-auto pt-4">
          <Link
            href={`/${salon.slug}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary-500)] px-4 py-2.5 text-sm font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {labels.fr.cta}
            <svg
              width="14"
              height="14"
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
      </div>
    </article>
  );
}
