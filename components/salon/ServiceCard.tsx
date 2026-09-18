/**
 * ServiceCard — flat list row (Fresha-inspired).
 *
 * Layout: 80×80 thumbnail | name + duration | price + inline "Réserver" link
 * No hover-lift. Hover = inline link color change only.
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
    cta: "Réserver",
  },
  en: {
    duration: (m: number) => `${m} min`,
    price: (n: number) => `${n} DH`,
    cta: "Book",
  },
  ar: {
    duration: (m: number) => `${m} دقيقة`,
    price: (n: number) => `${n} درهم`,
    cta: "احجز",
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
  durationMinutes,
  price,
  photoUrl,
  locale = "fr",
}: Props) {
  const t = labels[locale];
  const initial = name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/${slug}/book/${serviceId}`}
      className="group flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-3 transition-colors hover:bg-zinc-50 sm:p-4"
    >
      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-primary-500)] sm:size-24">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-white">
            {initial}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-[var(--color-text)]">
          {name}
        </h3>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          ⏱ {t.duration(durationMinutes)}
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end">
        <span className="font-display text-base font-bold text-[var(--color-text)]">
          {formatMAD(price, locale)}
        </span>
        <span className="mt-0.5 text-sm font-semibold text-[var(--color-primary-500)] transition-colors group-hover:text-[var(--color-primary-600)]">
          {t.cta} →
        </span>
      </div>
    </Link>
  );
}
