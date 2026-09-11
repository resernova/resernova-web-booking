/**
 * Tailwind v4 config — token-first architecture.
 * Three layers:
 *   1. Primitive tokens (raw values) — colors, radii, shadows, spacing
 *   2. Semantic tokens (purpose-named) — primary, surface, text, border
 *   3. Component tokens (component-scoped) — Card.padding, Button.height
 *
 * Read at @theme block in app/globals.css. This file augments with components.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        hero: "36px",
        "2xl": "30px",
      },
      boxShadow: {
        card: "0 8px 24px -12px rgba(28,107,109,0.25), 0 -4px 16px -8px rgba(255,255,255,0.4)",
        button: "0 4px 16px -8px rgba(28,107,109,0.45)",
        glass: "inset 0 1px 0 0 rgba(255,255,255,0.6)",
        modal: "0 24px 64px -16px rgba(28,107,109,0.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1C6B6D 0%, #2A9D8F 50%, #3ABDA2 100%)",
        "accent-gradient": "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;