/**
 * Client-side filterable services grid.
 * Receives the full server-fetched list and renders category chips + sort.
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

export function ServicesGrid({
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
      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCat(null)}
          aria-pressed={activeCat === null}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
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
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeCat === c.category_id
                ? "bg-[var(--color-primary-500)] text-white"
                : "bg-white text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-primary-500)]/5"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="mb-4 flex items-center justify-end gap-2 text-sm">
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

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white p-12 text-center text-[var(--color-text-muted)]">
          {t.empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
