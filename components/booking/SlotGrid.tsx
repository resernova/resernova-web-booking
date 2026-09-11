/**
 * SlotGrid — 4-col grid of available 30-min slots for the selected date.
 * Calls /api/public/availability (Route Handler — implemented in Week 4)
 * or the Supabase RPC directly as a fallback.
 */
"use client";

import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { CASABLANCA_TZ } from "@/lib/utils/time";

type Slot = { slot_start: string; slot_end: string; available_staff: string[] };

type Props = {
  slug: string;
  serviceId: string;
  date: string;
  selectedSlot: { start: string; end: string } | null;
  onSlotChange: (slot: { start: string; end: string } | null) => void;
  locale: "fr" | "en" | "ar";
};

const labels = {
  fr: {
    loading: "Chargement des créneaux...",
    empty: "Aucun créneau disponible ce jour",
    try: "Essayez une autre date",
    remaining: (n: number) =>
      `${n} place${n > 1 ? "s" : ""} restante${n > 1 ? "s" : ""}`,
  },
  en: {
    loading: "Loading slots...",
    empty: "No slots available on this day",
    try: "Try another date",
    remaining: (n: number) => `${n} spot${n > 1 ? "s" : ""} left`,
  },
  ar: {
    loading: "جاري تحميل المواعيد...",
    empty: "لا توجد مواعيد متاحة في هذا اليوم",
    try: "جرب تاريخا آخر",
    remaining: (n: number) => `${n} مكان${n > 1 ? "" : ""} متبقي`,
  },
};

export function SlotGrid({
  slug,
  serviceId,
  date,
  selectedSlot,
  onSlotChange,
  locale,
}: Props) {
  const t = labels[locale];
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/public/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, serviceId, date }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.success && Array.isArray(json.data)) {
          setSlots(json.data);
        } else if (json?.success && json?.data?.data) {
          // get_available_slots_v2 returns {success, data: [{...}]}
          setSlots(json.data.data);
        } else {
          setSlots([]);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error("[SlotGrid]", e);
          setError(t.empty);
          setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, serviceId, date, t.empty]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-[var(--color-text-muted)]">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="size-16 animate-pulse rounded-2xl bg-zinc-100"
            />
          ))}
        </div>
        <p className="text-sm">{t.loading}</p>
      </div>
    );
  }

  if (error || !slots || slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-zinc-50 p-6 text-center">
        <p className="font-medium text-[var(--color-text-muted)]">
          {error ?? t.empty}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{t.try}</p>
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Available time slots"
      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
    >
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.start === slot.slot_start &&
          selectedSlot?.end === slot.slot_end;
        const remaining = slot.available_staff?.length ?? 0;
        const time = DateTime.fromISO(slot.slot_start, { zone: "utc" })
          .setZone(CASABLANCA_TZ)
          .toFormat("HH:mm");

        return (
          <button
            key={slot.slot_start}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() =>
              onSlotChange({ start: slot.slot_start, end: slot.slot_end })
            }
            className={`relative flex flex-col items-center rounded-2xl border-2 px-2 py-3 text-center transition-all ${
              isSelected
                ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/5 shadow-card"
                : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-500)]/40"
            }`}
          >
            <span className="text-base font-bold">{time}</span>
            <span className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {t.remaining(remaining)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
