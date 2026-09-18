import type { Config } from "tailwindcss";

/**
 * Tailwind v4 reads tokens from app/globals.css @theme block.
 * This config file is intentionally minimal — DO NOT add theme.extend here.
 * All tokens are declared in CSS variables (see app/globals.css).
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  plugins: [],
};

export default config;
