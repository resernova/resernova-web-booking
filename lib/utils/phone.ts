/**
 * Morocco phone utilities — normalize +212 / 0[5-7]XXXXXXXX to E.164.
 */

const MOROCCO_REGEX = /^(\+212|0)[5-7]\d{8}$/;

export function isValidMoroccoPhone(phone: string): boolean {
  return MOROCCO_REGEX.test(phone);
}

/** Normalize 0XXXXXXXXX or +212XXXXXXXXX to +212XXXXXXXXX. */
export function normalizeMoroccoPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (!MOROCCO_REGEX.test(cleaned)) return null;
  if (cleaned.startsWith("+212")) return cleaned;
  if (cleaned.startsWith("0")) return "+212" + cleaned.slice(1);
  return null;
}

/** Display format: 06XX-XX-XX-XX (local Moroccan style). */
export function formatMoroccoPhone(phone: string): string {
  const normalized = normalizeMoroccoPhone(phone);
  if (!normalized) return phone;
  const local = "0" + normalized.slice(4);
  return local.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3-$4");
}
