/**
 * TS mirror of the CSS variables declared in app/globals.css.
 * Used for runtime tenant theming (resolveTheme override) and for
 * type-safe access from server/client components. NOT the source of
 * truth — app/globals.css @theme is canonical.
 *
 * Design language: Linear-style editorial restraint + Maghreb accent.
 * See /docs/superpowers/specs/2026-09-18-resernova-web-design.md.
 */

export const brand = {
  canvas: "#FFFFFF",
  surface: "#FAFAFA",
  card: "#FFFFFF",
  ink: "#08090A",
  inkMuted: "#6B7280",
  inkSoft: "#9CA3AF",
  inkInverse: "#FFFFFF",
  border: "rgba(10,10,10,0.08)",
  borderStrong: "rgba(10,10,10,0.16)",
  accent: "#0F766E",
  accentDim: "#0B5F58",
  accentSoft: "rgba(15,118,110,0.08)",
  success: "#1F8A4F",
  error: "#B91C1C",
  warning: "#B45309",
  blushSoft: "#FAEBE7",
  goldWarm: "#D4B860",
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  image: 12,
  full: 9999,
} as const;

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  8: 48,
  10: 64,
  16: 96,
  20: 128,
  24: 192,
} as const;

export const duration = {
  instant: 0,
  fast: 150,
  base: 200,
  slow: 320,
  slower: 480,
} as const;

export const ease = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  decelerate: "cubic-bezier(0, 0, 0.2, 1)",
  accelerate: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export const z = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  overlay: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
} as const;

export type SalonTheme = {
  primary?: string;
  primaryLight?: string;
  accent?: string;
  font?: "inter" | "tajawal" | "system";
};

export function resolveTheme(overrides?: SalonTheme | null) {
  return {
    primary: overrides?.primary ?? brand.accent,
    primaryLight: overrides?.primaryLight ?? brand.accentDim,
    accent: overrides?.accent ?? brand.accent,
    font: overrides?.font ?? "inter",
  };
}
