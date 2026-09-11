/**
 * DateTimePicker — date selector for the wizard.
 * Server-rendered calendar grid (next 30 days, weekdays only optionally).
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
  fr: { next: "Mois suivant", prev: "Mois précédent", monthNames: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"], dayNames: ["Lu","Ma","Me","Je","Ve","Sa","Di"], today: "Aujourd'hui" },
  en: { next: "Next month", prev: "Previous month", monthNames: ["January","February","March","April","May","June","July","August","September","October","November","December"], dayNames: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], today: "Today" },
  ar: { next: "الشهر التالي", prev: "الشهر السابق", monthNames: ["يناير","فبراير","مارس","أبريل","ماي","يونيو","يوليوز","غشت","شتنبر","أكتوبر","نونبر","دجنبر"], dayNames: ["إ","ث","أ","خ","ج","س","ح"], today: "اليوم" },
};

export function DateTimePicker({ value, onChange, locale }: Props) {
  const t = labels[locale];
  const initial = value ? DateTime.fromISO(value, { zone: CASABLANCA_TZ }) : DateTime.now().setZone(CASABLANCA_TZ);
  const [cursor, setCursor] = useState(initial.startOf("month"));

  const today = useMemo(() => DateTime.now().setZone(CASABLANCA_TZ).startOf("day"), []);
  const max = useMemo(() => today.plus({ days: 30 }), [today]);

  const cells = useMemo(() => {
    const firstDay = cursor.startOf("month");
    // Monday-first: Luxon weekday 1=Mon, 7=Sun. Adjust to 0-based Monday-first.
    const firstWeekday = ((firstDay.weekday - 1) + 7) % 7;
    const daysInMonth = cursor.daysInMonth!;

    const out: (DateTime | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(firstDay.set({ day: d }));
    }
    return out;
  }, [cursor]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(cursor.minus({ months: 1 }))}
          aria-label={t.prev}
          className="grid size-9 place-items-center rounded-full bg-white shadow-card hover:bg-zinc-50"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="font-display text-lg font-semibold">
          {t.monthNames[cursor.month - 1]} {cursor.year}
        </div>
        <button
          type="button"
          onClick={() => setCursor(cursor.plus({ months: 1 }))}
          aria-label={t.next}
          className="grid size-9 place-items-center rounded-full bg-white shadow-card hover:bg-zinc-50"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--color-text-muted)]">
        {t.dayNames.map((d) => (<div key={d}>{d}</div>))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid">
        {cells.map((d, i) => {
          if (!d) return <div key={i} aria-hidden />;
          const isPast = d < today;
          const isFuture = d > max;
          const isSelected = value && DateTime.fromISO(value, { zone: CASABLANCA_TZ }).equals(d);
          const isToday = d.equals(today);

          const disabled = isPast || isFuture;
          const cls = `aspect-square grid place-items-center rounded-full text-sm font-semibold transition-colors ${
            isSelected ? "bg-[var(--color-primary-500)] text-white"
            : disabled ? "text-zinc-300 cursor-not-allowed"
            : "hover:bg-[var(--color-primary-500)]/10 cursor-pointer"
          } ${isToday && !isSelected ? "ring-2 ring-[var(--color-primary-500)]/30" : ""}`;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(d.toISODate()!)}
              className={cls}
              aria-pressed={isSelected}
              aria-label={d.toFormat("cccc d LLLL yyyy", { locale })}
            >
              {d.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}