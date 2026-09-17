/**
 * Time utilities — per-location timezone, Ramadan silent hours, availability parsing.
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

export function nowIn(timeZone: string = CASABLANCA_TZ): DateTime {
  return DateTime.now().setZone(timeZone);
}

/* ---------------------------------------------------------------------------
 * provider_locations.opening_hours parser (canonical shape)
 * ---------------------------------------------------------------------------
 * Per the two-layer availability model (docs/14-AVAILABILITY-TWO-LAYER.md):
 *
 *   {
 *     "monday":    { "isOpen": true,  "slots": [{ "open": "09:00", "close": "17:00" }] },
 *     "tuesday":   { "isOpen": true,  "slots": [{ "open": "09:00", "close": "17:00" }] },
 *     "wednesday": { "isOpen": true,  "slots": [{ "open": "09:00", "close": "17:00" }] },
 *     "thursday":  { "isOpen": true,  "slots": [{ "open": "09:00", "close": "17:00" }] },
 *     "friday":    { "isOpen": true,  "slots": [{ "open": "14:00", "close": "22:00" }] },
 *     "saturday":  { "isOpen": false, "slots": [] },
 *     "sunday":    { "isOpen": false, "slots": [] }
 *   }
 *
 * Multiple slots per day are supported (e.g., Ramadan businesses with
 * lunch-break splits). `isOpen === false` or empty `slots` → closed.
 *
 * For back-compat with legacy data (flat {open,close} per day, or an array of
 * day objects), `normalizeAvailability` detects the shape and converts to the
 * canonical form. Both legacy shapes still parse; both return isOpen=true with a
 * single slot.
 */

export type Slot = { open: string; close: string };
export type DayHours = { isOpen: boolean; slots: Slot[] };
export type LocationAvailability = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    DayHours
  >
>;

/** @deprecated legacy flat shape. Kept as a type alias only; normalizeAvailability normalises to LocationAvailability. */
export type DayWindow = Slot;
export type WeeklyAvailability = LocationAvailability;

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

function isLegacyDayObject(v: unknown): v is Slot {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  // Canonical: { isOpen, slots[] } — legacy: { open, close }
  if ("isOpen" in o || "slots" in o) return false;
  return typeof o.open === "string" && typeof o.close === "string";
}

function isCanonicalDayObject(v: unknown): v is DayHours {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (!("slots" in o)) return false;
  return Array.isArray(o.slots);
}

export function normalizeAvailability(raw: unknown): LocationAvailability {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return {};
  }

  // Array form: [{ day, open, close }, ...] OR [{ day, isOpen, slots }, ...]
  if (Array.isArray(parsed)) {
    const out: LocationAvailability = {};
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const obj = entry as Record<string, unknown>;
      const day = (obj.day ?? obj.weekday ?? "").toString().toLowerCase();
      if (!DAY_KEYS.includes(day as DayKey)) continue;
      out[day as DayKey] = parseDayEntry(obj);
    }
    return out;
  }

  // Object form
  if (typeof parsed === "object") {
    const out: LocationAvailability = {};
    for (const key of DAY_KEYS) {
      const v = (parsed as Record<string, unknown>)[key];
      if (v == null) {
        // null = explicitly closed
        out[key as DayKey] = { isOpen: false, slots: [] };
        continue;
      }
      if (!v || typeof v !== "object") {
        out[key as DayKey] = { isOpen: false, slots: [] };
        continue;
      }
      out[key as DayKey] = parseDayEntry(v as Record<string, unknown>);
    }
    return out;
  }

  return {};
}

function parseDayEntry(entry: Record<string, unknown>): DayHours {
  // Canonical: { isOpen, slots[] }
  if (isCanonicalDayObject(entry)) {
    return entry;
  }
  // Legacy: { open, close }
  if (isLegacyDayObject(entry)) {
    return { isOpen: true, slots: [entry] };
  }
  // Legacy: { isOpen: false } explicitly
  if (entry.isOpen === false) {
    return { isOpen: false, slots: [] };
  }
  return { isOpen: false, slots: [] };
}

/** "Open today until 19:00" / "Fermé aujourd'hui" / "Ouvre à 14:00" badge logic.
 *
 * Handles:
 *  - isOpen === false or empty slots → closed
 *  - Single slot → next-upcoming / currently-open semantics as before
 *  - Multi-slot days → if between slots (e.g., lunch break), show "Fermé actuellement — ouvre à HH:MM"
 *
 * @param raw         the canonical `opening_hours` jsonb
 * @param timeZone    the location's IANA timezone (default 'Africa/Casablanca')
 * @param refDate     override for testing (defaults to "now in timeZone")
 */
export type OpenToday = {
  isOpen: boolean;
  opensAt?: string; // next slot's open time, if not currently open
  closesAt?: string; // current slot's close time, if currently open
  closedReason?:
    | "closed_today"
    | "closed_for_day"
    | "not_yet_open" // before today's first slot
    | "between_slots"; // currently in a multi-slot gap
};

export function openToday(
  raw: unknown,
  timeZone: string = CASABLANCA_TZ,
  refDate?: DateTime,
): OpenToday {
  const hours = normalizeAvailability(raw);
  const now = refDate ?? nowIn(timeZone);
  const dayKey = now.toFormat("EEEE").toLowerCase() as DayKey;
  const day = hours[dayKey];

  if (!day || !day.isOpen || day.slots.length === 0) {
    return { isOpen: false, closedReason: "closed_today" };
  }

  const nowHHMM = now.hour * 60 + now.minute;

  // Find the next or current slot
  // Sort by open time (defensive — slots may not be pre-ordered)
  const sorted = [...day.slots].sort((a, b) => hhmm(a.open) - hhmm(b.open));

  for (const slot of sorted) {
    const open = hhmm(slot.open);
    const close = hhmm(slot.close);
    if (nowHHMM < open) {
      // Before this slot — return its open time
      return {
        isOpen: false,
        opensAt: slot.open,
        closedReason: "not_yet_open",
      };
    }
    if (nowHHMM < close) {
      // Inside this slot
      return { isOpen: true, closesAt: slot.close };
    }
    // else: this slot already ended — keep checking the next one
  }

  // Past the last slot of the day
  return { isOpen: false, closedReason: "closed_for_day" };
}

function hhmm(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return Number.NaN;
  return Number(m[1]) * 60 + Number(m[2]);
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
