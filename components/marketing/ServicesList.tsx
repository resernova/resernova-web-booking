/**
 * ServicesList — vertical list with category chips + sort (Fresha-inspired).
 *
 * Same logic as the old ServicesGrid but renders flat list rows instead of
 * 2-column photo cards. Inline category chips + sort dropdown above the list.
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
          <button
            onClick={() => setActiveCat(null)}
            aria-pressed={activeCat === null}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeCat === null
                ? "bg-[var(--color-primary-500)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-primary-500)]/5"
            }`}
          >
            {t.all}
          </button>
          {categories.map((c) => (
            <button
              key={c.category_id}
              onClick={() => setActiveCat(c.category_id)}
              aria-pressed={activeCat === c.category_id}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeCat === c.category_id
                  ? "bg-[var(--color-primary-500)] text-white"
                  : "bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-primary-500)]/5"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-[var(--color-text-muted)]">
            {t.sortBy}
          </label>
          <select
            id="sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm font-medium focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
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
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-12 text-center text-[var(--color-text-muted)]">
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
