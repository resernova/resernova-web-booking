/**
 * ServiceCard — 2-col grid card on the catalog page.
 * Photo (4:3), name, duration, MAD price, short description, "Choisir" CTA.
 */
import Link from "next/link";

type Props = {
  slug: string;
  serviceId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  photoUrl?: string | null;
  locale?: "fr" | "en" | "ar";
};

const labels = {
  fr: {
    duration: (m: number) => `${m} min`,
    price: (n: number) => `${n} DH`,
    cta: "Choisir",
  },
  en: {
    duration: (m: number) => `${m} min`,
    price: (n: number) => `${n} DH`,
    cta: "Choose",
  },
  ar: {
    duration: (m: number) => `${m} دقيقة`,
    price: (n: number) => `${n} درهم`,
    cta: "اختيار",
  },
};

function formatMAD(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(
      locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA",
      {
        style: "currency",
        currency: "MAD",
        maximumFractionDigits: 0,
      },
    ).format(n);
  } catch {
    return `${n} DH`;
  }
}

export function ServiceCard({
  slug,
  serviceId,
  name,
  description,
  durationMinutes,
  price,
  photoUrl,
  locale = "fr",
}: Props) {
  const t = labels[locale];

  return (
    <article className="group overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-card transition-transform hover:-translate-y-0.5">
      {photoUrl && (
        <div className="aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {name}
          </h3>
          <span className="shrink-0 rounded-full bg-[var(--color-primary-500)]/10 px-3 py-1 text-sm font-semibold text-[var(--color-primary-500)]">
            {formatMAD(price, locale)}
          </span>
        </div>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            ⏱ {t.duration(durationMinutes)}
          </span>
          <Link
            href={`/${slug}/book/${serviceId}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {t.cta}
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
