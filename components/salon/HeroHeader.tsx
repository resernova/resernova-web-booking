/**
 * HeroHeader — gallery-first hero (Fresha-inspired).
 *
 * Layout:
 *  - Desktop: 1 large image (60% w, 4:5) + 2 stacked thumbnails (40%) + "show all" badge
 *  - Mobile: full-width carousel with horizontal swipe
 *  - Below: H1 name, category, rating pill, open-status dot, "Get directions",
 *    inline "Book now" CTA. No orbs, no monogram, no curved bottom — flat.
 *
 * Gallery falls back gracefully to a single hero image or gradient placeholder
 * (the existing gradient-hero class) when `galleryImages` is empty.
 */
import Link from "next/link";
import { openToday, type LocationAvailability } from "@/lib/utils/time";

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
}: Props) {
  const images =
    galleryImages.length > 0
      ? galleryImages.slice(0, 10)
      : heroImageUrl
        ? [heroImageUrl]
        : [];
  const status = openToday(openingHours, timeZone);

  return (
    <header className="bg-white">
      {/* Gallery */}
      {images.length > 0 ? (
        <Gallery images={images} />
      ) : (
        <GradientFallback businessName={businessName} />
      )}

      {/* Identity block */}
      <div className="mx-auto max-w-5xl px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
        <p className="text-sm font-medium text-[var(--color-text-muted)]">
          {category}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-tight text-[var(--color-text)] sm:text-4xl">
          {businessName}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {rating !== undefined && reviewCount !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-900">
              <span className="text-amber-500">★</span>
              {rating.toFixed(1)}{" "}
              <span className="text-zinc-500">({reviewCount})</span>
            </span>
          )}

          <OpenStatusDot status={status} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={`/${slug}/book`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-6 py-3 font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Réserver
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
          </Link>
          <a
            href="#address"
            className="text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Voir l&apos;adresse
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white">
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
    <div className="gradient-hero relative h-48 overflow-hidden sm:h-64">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 size-64 rounded-full bg-white/10 blur-3xl"
      />
      <div className="relative flex h-full items-end px-4 pb-6 sm:px-6">
        <span className="font-display text-2xl font-bold text-white drop-shadow-sm sm:text-3xl">
          {businessName}
        </span>
      </div>
    </div>
  );
}

function OpenStatusDot({ status }: { status: ReturnType<typeof openToday> }) {
  const labels = {
    open: "Ouvert",
    closes_at: "Ferme à",
    closed: "Fermé",
    not_yet_open: "Ouvre à",
  };

  let text: string;
  let cls: string;
  if (status.isOpen && status.closesAt) {
    text = `${labels.open} · ferme à ${status.closesAt}`;
    cls = "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  } else if (status.opensAt) {
    text = `${labels.not_yet_open} ${status.opensAt}`;
    cls = "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  } else {
    text = labels.closed;
    cls = "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${cls}`}
    >
      <span
        aria-hidden
        className={`size-2 rounded-full ${
          status.isOpen
            ? "bg-emerald-500"
            : status.opensAt
              ? "bg-amber-500"
              : "bg-zinc-400"
        }`}
      />
      {text}
    </span>
  );
}
