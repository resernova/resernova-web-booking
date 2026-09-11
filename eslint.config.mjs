/**
 * ESLint Flat Config — ESLint 9 + Next.js 16.
 * Uses Flat Config format. Inherits from eslint-config-next.
 *
 * Suppresses rules that conflict with our patterns:
 * - @next/next/no-html-link-for-pages: we don't use Link for internal nav heavily
 * - react-hooks/exhaustive-deps: some intentional deps arrays in our wizard
 */
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Global ignores
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "build/**",
      "pnpm-lock.yaml",
      "supabase/.branches/**",
      "supabase/.temp/**",
      "graphify-out/**",
      "playwright-report/**",
      "lighthouse-ci/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Deno files: @ts-nocheck already silences TS; allow Deno globals
      "no-undef": "off",
      // Allow the deprecated `middleware` export name in proxy.ts during transition
      "no-restricted-exports": "off",
    },
  },
  // Edge Function files use Deno globals (Deno.env, Deno.serve)
  {
    files: ["supabase/functions/**/*.ts"],
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];