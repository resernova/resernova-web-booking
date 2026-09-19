/**
 * HeroHeader — gallery-first hero (Fresha-inspired), token-aligned.
 *
 * Layout:
 *  - Desktop: 1 large image (3/5 width, full height) + 2 stacked thumbnails (2/5) + "+N" overlay
 *  - Mobile: full-width carousel
 *  - Below: category eyebrow + H1 name + status dot + "Réserver" CTA + "Voir l'adresse"
 *
 * Token usage:
 *  - bg-canvas / text-ink / border-border / rounded-md / font-medium
 *  - selected slot/open state uses bg-accent / text-ink-inverse
 *  - gallery fallback uses an inline bg-accent gradient (no legacy
 *    utility class).
 */
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { openToday, type LocationAvailability } from "@/lib/utils/time";

type Locale = "fr" | "en" | "ar";

const labels = {
  fr: { cta: "Réserver", directions: "Voir l'adresse" },
  en: { cta: "Book now", directions: "Get directions" },
  ar: { cta: "احجز الآن", directions: "عرض العنوان" },
};

type Props = {
  businessName: string;
  slug: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  openingHours: LocationAvailability | null;
  timeZone: string;
  galleryImages?: string[];
  heroImageUrl?: string | null;
  locale?: Locale;
};

export function HeroHeader({
  businessName,
  slug,
  category,
  rating,
  reviewCount,
  openingHours,
  timeZone,
  galleryImages = [],
  heroImageUrl,
  locale = "fr",
}: Props) {
  const t = labels[locale];
  const images =
    galleryImages.length > 0
      ? galleryImages.slice(0, 10)
      : heroImageUrl
        ? [heroImageUrl]
        : [];
  const status = openToday(openingHours, timeZone);

  return (
    <header className="bg-canvas">
      {/* Gallery */}
      {images.length > 0 ? (
        <Gallery images={images} />
      ) : (
        <GradientFallback businessName={businessName} />
      )}

      {/* Identity block */}
      <div className="mx-auto max-w-5xl px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
        <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
          {category}
        </p>
        <h1 className="mt-2 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
          {businessName}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-caption">
          {rating !== undefined && reviewCount !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1 font-medium text-ink">
              <span aria-hidden className="text-warning">
                ★
              </span>
              {rating.toFixed(1)}
              <span className="text-ink-muted">({reviewCount})</span>
            </span>
          )}

          <OpenStatusDot status={status} locale={locale} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href={`/${slug}/book`} className="inline-flex">
            <Button variant="primary" size="md">
              {t.cta}
              <svg
                width="18"
                height="18"
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
            </Button>
          </Link>
          <a
            href="#address"
            className="text-body-sm font-medium text-ink-muted transition-base duration-base ease-standard hover:text-ink"
          >
            {t.directions}
          </a>
        </div>
      </div>
    </header>
  );
}

function Gallery({ images }: { images: string[] }) {
  const main = images[0];
  const thumbs = images.slice(1, 3);
  const rest = Math.max(0, images.length - 3);

  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-5 sm:grid-rows-2 sm:gap-1.5 sm:aspect-[16/7]">
      {/* Main image — full-width mobile, 3/5 width desktop, spans 2 rows */}
      <div className="relative overflow-hidden sm:col-span-3 sm:row-span-2 sm:aspect-auto sm:h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main}
          alt=""
          className="h-full max-h-[60vh] w-full object-cover sm:max-h-none"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Thumbnails — stacked right side on desktop, hidden on mobile */}
      {thumbs.map((src, i) => (
        <div
          key={src + i}
          className="relative hidden overflow-hidden sm:col-span-2 sm:block sm:aspect-auto sm:h-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {i === thumbs.length - 1 && rest > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/50 text-h2 font-medium text-ink-inverse">
              +{rest}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GradientFallback({ businessName }: { businessName: string }) {
  return (
    <div
      className="relative h-48 overflow-hidden sm:h-64"
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dim) 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute -top-20 -right-20 size-64 rounded-full bg-canvas/10 blur-3xl"
      />
      <div className="relative flex h-full items-end px-4 pb-6 sm:px-6">
        <span className="font-display text-h2 font-medium text-ink-inverse drop-shadow-sm md:text-h1">
          {businessName}
        </span>
      </div>
    </div>
  );
}

function OpenStatusDot({
  status,
  locale,
}: {
  status: ReturnType<typeof openToday>;
  locale: Locale;
}) {
  const labelsByLocale = {
    fr: {
      open: "Ouvert",
      closesAt: "ferme à",
      opensAt: "Ouvre à",
      closed: "Fermé",
    },
    en: {
      open: "Open",
      closesAt: "closes at",
      opensAt: "Opens at",
      closed: "Closed",
    },
    ar: {
      open: "مفتوح",
      closesAt: "يُغلق في",
      opensAt: "يفتح في",
      closed: "مغلق",
    },
  } as const;
  const l = labelsByLocale[locale];

  let text: string;
  let cls: string;
  if (status.isOpen && status.closesAt) {
    text = `${l.open} · ${l.closesAt} ${status.closesAt}`;
    cls = "bg-accent-soft text-accent ring-1 ring-accent/30";
  } else if (status.opensAt) {
    text = `${l.opensAt} ${status.opensAt}`;
    cls = "bg-warning/10 text-warning ring-1 ring-warning/30";
  } else {
    text = l.closed;
    cls = "bg-surface text-ink-muted ring-1 ring-border";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-caption font-medium ${cls}`}
    >
      <span
        aria-hidden
        className={`size-2 rounded-full ${
          status.isOpen
            ? "bg-success"
            : status.opensAt
              ? "bg-warning"
              : "bg-ink-soft"
        }`}
      />
      {text}
    </span>
  );
}
