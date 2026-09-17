/**
 * OpenHoursBadge — "Open today until 19:00" / "Closed today" / "Opens at 10:00".
 * Server component; takes the canonical `opening_hours` jsonb + location timezone.
 */
import { openToday } from "@/lib/utils/time";

type Props = {
  openingHours: unknown;
  /** IANA timezone, e.g. 'Africa/Casablanca'. Defaults to Casablanca. */
  timeZone?: string;
  /** Locale for "today" label */
  locale?: string;
};

const labels = {
  fr: {
    open: "Ouvert aujourd'hui jusqu'à",
    opensAt: "Ouvre aujourd'hui à",
    closed: "Fermé aujourd'hui",
    closedReason: {
      not_yet_open: "Pas encore ouvert",
      closed_today: "Fermé",
      closed_for_day: "Fermé pour la journée",
    },
  },
  en: {
    open: "Open today until",
    opensAt: "Opens today at",
    closed: "Closed today",
    closedReason: {
      not_yet_open: "Not yet open",
      closed_today: "Closed",
      closed_for_day: "Closed for the day",
    },
  },
  ar: {
    open: "مفتوح اليوم حتى",
    opensAt: "يفتح اليوم على",
    closed: "مغلق اليوم",
    closedReason: {
      not_yet_open: "لم يفتح بعد",
      closed_today: "مغلق",
      closed_for_day: "أغلق اليوم",
    },
  },
};

export function OpenHoursBadge({
  openingHours,
  timeZone,
  locale = "fr",
}: Props) {
  const status = openToday(openingHours, timeZone);
  const t = labels[locale as keyof typeof labels] ?? labels.fr;

  if (status.isOpen) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-500)]/10 px-4 py-2 text-sm font-medium text-[var(--color-accent-600)]">
        <span className="grid size-2 place-items-center rounded-full bg-[var(--color-accent-500)] shadow-[0_0_0_4px_rgba(37,211,102,0.2)]" />
        {t.open} <strong className="font-semibold">{status.closesAt}</strong>
      </div>
    );
  }

  if (status.opensAt) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
        <span className="grid size-2 place-items-center rounded-full bg-amber-500" />
        {t.opensAt} <strong className="font-semibold">{status.opensAt}</strong>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
      <span className="grid size-2 place-items-center rounded-full bg-zinc-400" />
      {t.closed}
    </div>
  );
}
