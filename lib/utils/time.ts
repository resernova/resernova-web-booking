/**
 * Time utilities — Africa/Casablanca timezone, Ramadan silent hours.
 * Mirrors Flutter timezone + silence_hour logic.
 */
import { DateTime } from "luxon";

export const CASABLANCA_TZ = "Africa/Casablanca";

/** Ramadan silent hours (12:00-14:00, 18:00-20:00 Africa/Casablanca).
 * Source: docs README TODO — refresh yearly.
 * NOTE: this is a placeholder for 2026; verify before Ramadan 2027. */
const RAMADAN_YEARS: Record<number, { start: string; end: string }> = {
  2026: { start: "2026-02-17", end: "2026-03-18" },
  2027: { start: "2027-02-07", end: "2027-03-08" },
  // TODO: refresh yearly — set a cron reminder
};

export function isInRamadan(
  date: DateTime = DateTime.now().setZone(CASABLANCA_TZ),
): boolean {
  const y = date.year;
  const window = RAMADAN_YEARS[y];
  if (!window) return false;
  const start = DateTime.fromISO(window.start, { zone: CASABLANCA_TZ });
  const end = DateTime.fromISO(window.end, { zone: CASABLANCA_TZ });
  return date >= start && date <= end;
}

/** Hour-of-day pairs during which sending messages would be intrusive.
 * Within Ramadan: 12:00-14:00 (post-lunch) + 18:00-20:00 (iftar).
 * Outside Ramadan: no silent hours. */
export function isSilentHour(
  date: DateTime = DateTime.now().setZone(CASABLANCA_TZ),
): boolean {
  if (!isInRamadan(date)) return false;
  const h = date.hour;
  return (h >= 12 && h < 14) || (h >= 18 && h < 20);
}

export function nowCasablanca(): DateTime {
  return DateTime.now().setZone(CASABLANCA_TZ);
}

/* ---------------------------------------------------------------------------
 * services.availability parser
 * ---------------------------------------------------------------------------
 * Shape 1 (object — day-of-week key):
 *   {
 *     "monday":    { "open": "09:00", "close": "19:00" },
 *     "tuesday":   { "open": "09:00", "close": "19:00" },
 *     "wednesday": null,                            // closed
 *     "thursday":  { "open": "09:00", "close": "19:00" },
 *     "friday":    { "open": "14:00", "close": "22:00" },
 *     "saturday":  { "open": "10:00", "close": "20:00" },
 *     "sunday":    null
 *   }
 *
 * Shape 2 (array of day objects):
 *   [
 *     { "day": "monday", "open": "09:00", "close": "19:00" },
 *     ...
 *   ]
 *
 * Both shapes accepted. Missing or unparseable → treated as closed all week.
 */

export type DayWindow = { open: string; close: string };
export type WeeklyAvailability = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    DayWindow | null
  >
>;

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type DayKey = (typeof DAY_KEYS)[number];

export function normalizeAvailability(raw: unknown): WeeklyAvailability {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }

  if (Array.isArray(parsed)) {
    const out: WeeklyAvailability = {};
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const obj = entry as Record<string, unknown>;
      const day = (obj.day ?? obj.weekday ?? "").toString().toLowerCase();
      if (!DAY_KEYS.includes(day as DayKey)) continue;
      const open = obj.open?.toString();
      const close = obj.close?.toString();
      out[day as DayKey] = open && close ? { open, close } : null;
    }
    return out;
  }

  if (typeof parsed === "object") {
    const out: WeeklyAvailability = {};
    for (const key of DAY_KEYS) {
      const v = (parsed as Record<string, unknown>)[key];
      if (v == null) {
        out[key] = null;
        continue;
      }
      if (typeof v === "object") {
        const obj = v as Record<string, unknown>;
        const open = obj.open?.toString();
        const close = obj.close?.toString();
        out[key] = open && close ? { open, close } : null;
      } else {
        out[key] = null;
      }
    }
    return out;
  }

  return {};
}

/** "Open today until 19:00" badge logic. */
export type OpenToday = {
  isOpen: boolean;
  opensAt?: string;
  closesAt?: string;
  closedReason?: string;
};

export function openToday(
  raw: unknown,
  refDate: DateTime = nowCasablanca(),
): OpenToday {
  const hours = normalizeAvailability(raw);
  const dayKey = refDate.toFormat("EEEE").toLowerCase() as DayKey;
  const window = hours[dayKey];

  if (!window) {
    return { isOpen: false, closedReason: "closed_today" };
  }

  const open = parseHHMM(window.open);
  const close = parseHHMM(window.close);
  if (!open || !close) {
    return { isOpen: false, closedReason: "closed_today" };
  }

  const refHHMM = refDate.hour * 60 + refDate.minute;
  const openHHMM = open.hour * 60 + open.minute;
  const closeHHMM = close.hour * 60 + close.minute;

  if (refHHMM < openHHMM) {
    return {
      isOpen: false,
      opensAt: window.open,
      closedReason: "not_yet_open",
    };
  }
  if (refHHMM >= closeHHMM) {
    return { isOpen: false, closedReason: "closed_for_day" };
  }

  return { isOpen: true, closesAt: window.close };
}

function parseHHMM(s: string): { hour: number; minute: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function formatSlot(dateIso: string, locale: string = "fr-MA"): string {
  const dt = DateTime.fromISO(dateIso, { zone: "utc" }).setZone(CASABLANCA_TZ);
  return dt.setLocale(locale).toFormat("HH:mm");
}

export function formatSlotLong(
  dateIso: string,
  locale: string = "fr-MA",
): string {
  const dt = DateTime.fromISO(dateIso, { zone: "utc" }).setZone(CASABLANCA_TZ);
  return dt.setLocale(locale).toFormat("HH'h'mm");
}

export function formatDate(dateIso: string, locale: string = "fr-MA"): string {
  const dt = DateTime.fromISO(dateIso, { zone: "utc" }).setZone(CASABLANCA_TZ);
  return dt.setLocale(locale).toFormat("cccc d LLLL yyyy");
}
