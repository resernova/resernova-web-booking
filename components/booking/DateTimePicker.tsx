/**
 * DateTimePicker — horizontally scrollable day strip (Fresha-inspired).
 *
 * Replaces the previous full-month calendar grid. 14 visible days at a time,
 * prev/next chevrons to shift the window. Selected day = full accent fill.
 *
 * Same Props API as before so SlotGrid doesn't need to change:
 *   value: ISO date string (e.g., "2026-09-20") or null
 *   onChange: (date: string) => void
 *   locale: 'fr' | 'en' | 'ar'
 */
"use client";

import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { CASABLANCA_TZ } from "@/lib/utils/time";

type Props = {
  value: string | null;
  onChange: (date: string) => void;
  locale: "fr" | "en" | "ar";
};

const labels = {
  fr: {
    prev: "Jours précédents",
    next: "Jours suivants",
    weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    months: [
      "janv.",
      "févr.",
      "mars",
      "avr.",
      "mai",
      "juin",
      "juil.",
      "août",
      "sept.",
      "oct.",
      "nov.",
      "déc.",
    ],
    today: "Aujourd'hui",
  },
  en: {
    prev: "Previous days",
    next: "Next days",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    today: "Today",
  },
  ar: {
    prev: "أيام سابقة",
    next: "أيام لاحقة",
    weekdays: ["إث", "ثل", "أر", "خم", "جم", "سب", "أحد"],
    months: [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ],
    today: "اليوم",
  },
};

const WINDOW_DAYS = 14;

export function DateTimePicker({ value, onChange, locale }: Props) {
  const t = labels[locale];
  const today = useMemo(
    () => DateTime.now().setZone(CASABLANCA_TZ).startOf("day"),
    [],
  );

  // Window start = today's index in the visible window. 0 means today is the
  // first chip; WINDOW_DAYS means we've scrolled far enough that today is gone.
  const [windowStart, setWindowStart] = useState(0);

  const days = useMemo(() => {
    const out: DateTime[] = [];
    for (let i = 0; i < WINDOW_DAYS; i++) {
      out.push(today.plus({ days: windowStart + i }));
    }
    return out;
  }, [today, windowStart]);

  // Selected date → ISO YYYY-MM-DD
  const selectedIso = value;

  const canGoPrev = windowStart > 0;
  const canGoNext = windowStart < 30; // arbitrary cap so users don't book 6 months out

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-eyebrow uppercase tracking-wider text-ink-muted">
          {value
            ? (() => {
                const dt = DateTime.fromISO(value, { zone: CASABLANCA_TZ });
                return `${t.weekdays[dt.weekday - 1]} ${dt.day} ${t.months[dt.month - 1]}`;
              })()
            : t.today}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWindowStart(Math.max(0, windowStart - 7))}
            disabled={!canGoPrev}
            aria-label={t.prev}
            className="grid size-8 place-items-center rounded-md text-ink-muted transition-base duration-base ease-standard hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 5l-5 5 5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setWindowStart(windowStart + 7)}
            disabled={!canGoNext}
            aria-label={t.next}
            className="grid size-8 place-items-center rounded-md text-ink-muted transition-base duration-base ease-standard hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M8 5l5 5-5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        role="listbox"
        aria-label="Date selection"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0"
      >
        {days.map((d) => {
          const iso = d.toISODate()!;
          const isSelected = selectedIso === iso;
          const isToday = d.equals(today);

          return (
            <button
              key={iso}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onChange(iso)}
              className={`flex shrink-0 flex-col items-center justify-center rounded-md border px-3 py-2 transition-base duration-base ease-standard sm:px-4 sm:py-3 ${
                isSelected
                  ? "border-accent bg-accent text-ink-inverse shadow-button"
                  : isToday
                    ? "border-accent bg-canvas text-ink"
                    : "border-border bg-canvas text-ink hover:border-ink-muted"
              }`}
              style={{ minWidth: "64px" }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                {t.weekdays[d.weekday - 1]}
              </span>
              <span className="mt-0.5 text-lg font-medium leading-none">
                {d.day}
              </span>
              <span className="mt-0.5 text-[10px] font-medium opacity-70">
                {t.months[d.month - 1]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
