/**
 * i18n config — locale list + fallback.
 * Mirrors Flutter app_*.arb key structure.
 */
export const locales = ["fr", "en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeLabels: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function resolveLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const lc = acceptLanguage.toLowerCase();
  for (const loc of locales) {
    if (lc.includes(loc)) return loc;
  }
  return defaultLocale;
}