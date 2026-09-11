// @ts-nocheck — Deno runtime; Next.js tsc ignores
/**
 * Shared: time utilities — Deno port of lib/utils/time.ts.
 */

export const CASABLANCA_TZ = "Africa/Casablanca";

const RAMADAN_YEARS: Record<number, { start: string; end: string }> = {
  2026: { start: "2026-02-17", end: "2026-03-18" },
  2027: { start: "2027-02-07", end: "2027-03-08" },
};

export function isInRamadan(date: Date = new Date()): boolean {
  const y = date.getUTCFullYear();
  const window = RAMADAN_YEARS[y];
  if (!window) return false;
  const start = new Date(window.start);
  const end = new Date(window.end);
  return date >= start && date <= end;
}

export function isSilentHour(date: Date = new Date()): boolean {
  if (!isInRamadan(date)) return false;
  const h = date.getHours();
  return (h >= 12 && h < 14) || (h >= 18 && h < 20);
}
