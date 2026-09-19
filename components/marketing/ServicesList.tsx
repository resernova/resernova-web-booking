/**
 * ServicesList — vertical list with category chips + sort (Fresha-inspired),
 * token-aligned.
 *
 * Same logic as before but rendering with the Linear-style palette:
 *   - chips: bg-canvas / border-border / text-ink at rest, bg-accent /
 *     text-ink-inverse when selected
 *   - sort dropdown: bg-canvas with hairline border, focus ring in accent
 *   - empty state: dashed border on bg-surface
 */
"use client";

import { useMemo, useState } from "react";
import { ServiceCard } from "@/components/salon/ServiceCard";
import type { PublishedService } from "@/server/queries/getPublishedServices";

type Category = { category_id: string; name: string };

type Props = {
  slug: string;
  services: PublishedService[];
  categories: Category[];
  locale?: "fr" | "en" | "ar";
};

const labels = {
  fr: {
    all: "Tous",
    sortBy: "Trier par",
    sortPriceAsc: "Prix ↑",
    sortPriceDesc: "Prix ↓",
    sortDurationAsc: "Durée ↑",
    sortName: "Nom",
    empty: "Aucun service dans cette catégorie.",
  },
  en: {
    all: "All",
    sortBy: "Sort by",
    sortPriceAsc: "Price ↑",
    sortPriceDesc: "Price ↓",
    sortDurationAsc: "Duration ↑",
    sortName: "Name",
    empty: "No services in this category.",
  },
  ar: {
    all: "الكل",
    sortBy: "ترتيب حسب",
    sortPriceAsc: "السعر ↑",
    sortPriceDesc: "السعر ↓",
    sortDurationAsc: "المدة ↑",
    sortName: "الاسم",
    empty: "لا توجد خدمات في هذه الفئة.",
  },
};

type SortKey = "price-asc" | "price-desc" | "duration-asc" | "name";

export function ServicesList({
  slug,
  services,
  categories,
  locale = "fr",
}: Props) {
  const t = labels[locale];
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("price-asc");

  const filtered = useMemo(() => {
    let list = services;
    if (activeCat) list = list.filter((s) => s.categoryId === activeCat);
    const sorted = [...list];
    switch (sortKey) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "duration-asc":
        sorted.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name, locale));
        break;
    }
    return sorted;
  }, [services, activeCat, sortKey, locale]);

  return (
    <>
      {/* Filter chips + sort */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 overflow-x-auto">
          <Chip
            active={activeCat === null}
            onClick={() => setActiveCat(null)}
            label={t.all}
          />
          {categories.map((c) => (
            <Chip
              key={c.category_id}
              active={activeCat === c.category_id}
              onClick={() => setActiveCat(c.category_id)}
              label={c.name}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 text-caption">
          <label htmlFor="sort" className="text-ink-muted">
            {t.sortBy}
          </label>
          <select
            id="sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-border bg-canvas px-3 py-1.5 text-body-sm font-medium text-ink transition-base duration-base ease-standard focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="price-asc">{t.sortPriceAsc}</option>
            <option value="price-desc">{t.sortPriceDesc}</option>
            <option value="duration-asc">{t.sortDurationAsc}</option>
            <option value="name">{t.sortName}</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-surface p-12 text-center text-ink-muted">
          {t.empty}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => {
            const photo =
              Array.isArray(s.photos) && s.photos.length > 0
                ? s.photos[0]
                : null;
            return (
              <ServiceCard
                key={s.id}
                slug={slug}
                serviceId={s.id}
                name={s.name}
                description={s.description}
                durationMinutes={s.durationMinutes}
                price={s.price}
                photoUrl={photo}
                locale={locale}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-md border px-4 py-2 text-body-sm font-medium transition-base duration-base ease-standard ${
        active
          ? "border-accent bg-accent text-ink-inverse"
          : "border-border bg-canvas text-ink hover:border-ink-muted hover:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
