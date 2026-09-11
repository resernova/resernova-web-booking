/**
 * Brand tokens — mirrors Flutter modern_design_system.dart
 * Three-layer architecture:
 *   1. Primitive tokens (raw values)
 *   2. Semantic tokens (purpose-named)
 *   3. Component tokens (component-scoped)
 *
 * Each salon's web_theme jsonb can override the semantic layer per-tenant.
 */

export const brand = {
  // Primary — deep teal (Moroccan-inspired)
  primary: "#1C6B6D",
  primaryLight: "#2A9D8F",
  primaryLightest: "#3ABDA2",
  primaryDark: "#124548",

  // Accent — WhatsApp green (chat surfaces only)
  accent: "#25D366",
  accentDark: "#128C7E",

  // Surfaces
  surface: "#FFFFFF",
  surfaceMuted: "#F4FAFA",
  surfaceElevated: "#FFFFFF",

  // Text
  text: "#1A1A2E",
  textMuted: "#5A6573",
  textInverse: "#FFFFFF",

  // States
  error: "#E53935",
  warning: "#FF9F43",
  success: "#25D366",
  info: "#1C6B6D",

  // Borders
  border: "#E0E5E8",
  borderStrong: "#B0B8BC",
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 30,
  hero: 36,
  full: 9999,
} as const;

export const shadow = {
  card: "0 8px 24px -12px rgba(28,107,109,0.25), 0 -4px 16px -8px rgba(255,255,255,0.4)",
  button: "0 4px 16px -8px rgba(28,107,109,0.45)",
  glass: "inset 0 1px 0 0 rgba(255,255,255,0.6)",
  modal: "0 24px 64px -16px rgba(28,107,109,0.35)",
} as const;

export const font = {
  sans: "var(--font-inter), system-ui, -apple-system, sans-serif",
  display: "var(--font-poppins), var(--font-inter), system-ui, sans-serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
} as const;

export const space = {
  px: "1px",
  0.5: "2px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
} as const;

export const breakpoint = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/**
 * Resolve a salon's web_theme overrides on top of the defaults.
 * Tenant can override: primary, accent, font (sans | display | mono).
 */
export type SalonTheme = {
  primary?: string;
  primaryLight?: string;
  accent?: string;
  font?: "inter" | "poppins" | "system";
};

export function resolveTheme(overrides?: SalonTheme | null) {
  return {
    primary: overrides?.primary ?? brand.primary,
    primaryLight: overrides?.primaryLight ?? brand.primaryLight,
    accent: overrides?.accent ?? brand.accent,
    font: overrides?.font ?? "inter",
  };
}
