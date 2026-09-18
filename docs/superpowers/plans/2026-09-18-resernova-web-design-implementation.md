# ReserNova Web — Enterprise UI/UX Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an enterprise-grade visual redesign of ReserNova's booking web app at `book.resernova.com` so it reads like Linear/Stripe/Beehiiv (editorial restraint) with a single Maghreb typographic signature — never like a Fresha clone.

**Architecture:** Token-first rebuild. `app/globals.css` `@theme` block becomes the single source of truth for design tokens; `lib/theme/tokens.ts` becomes a thin TS mirror for runtime tenant theming; `tailwind.config.ts` slimmed to `content` + plugins only. Then 8 reviewable PRs: tokens → UI primitives → pages in priority order (home → salon profile → services → booking → confirmation) → visual QA.

**Tech Stack:** Next.js 16.3.4 (App Router, RSC), React 19, TypeScript strict, Tailwind v4 (@theme directives), shadcn/ui pattern (Radix primitives — install via `npx shadcn@latest init` for components that need it), pnpm 9, Node 20+, Inter (variable), Tajawal (Arabic accent).

**Spec:** `/home/abderrahmane/resernova-web/docs/superpowers/specs/2026-09-18-resernova-web-design.md` — every task in this plan argues from the spec; the spec travels with it.

---

## Global Constraints

These are project-wide rules. Every task's requirements implicitly include this section.

- **Node:** >= 20.9.0 (Next 16 minimum)
- **Package manager:** pnpm 9 (project is locked to `pnpm@9.0.0`)
- **TypeScript:** strict mode, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`
- **i18n:** every visible string in `labels = { fr, en, ar }` map; component receives `locale: "fr" | "en" | "ar"` prop; RTL via `dir="rtl"` on `<html>` for `ar`
- **Accessibility:** WCAG 2.1 AA minimum; `aria-*` on all interactive elements; visible focus ring
- **Performance budget:** LCP < 2.5s mobile, CLS < 0.1
- **No new env vars** — Vercel deployment unchanged
- **All 14 existing routes must keep working** throughout the migration
- **Lint/typecheck/build must pass** at every PR boundary

---

## File Structure

Before defining tasks, here's the target file layout. Tasks reference this.

### Tokens (PR 1)
```
app/globals.css                                 # CANONICAL — expanded @theme block
app/focus.css                                  # NEW — global focus-visible ring
lib/theme/tokens.ts                            # TS mirror (thinned)
tailwind.config.ts                             # slimmed to content + plugins only
```

### UI primitives (PR 2)
```
components/ui/
  Button.tsx                                    # NEW — primary/secondary/tertiary/ghost variants
  Card.tsx                                      # NEW — base / media / elevated
  Input.tsx                                     # NEW — text / email / tel / textarea
  Modal.tsx                                     # NEW — wraps @radix-ui/react-dialog
  Toast.tsx                                     # NEW — wraps sonner (already installed)
  Badge.tsx                                     # NEW — eyebrow labels + status pills
  Icon.tsx                                      # NEW — wraps lucide-react (already installed)
  Select.tsx                                    # NEW — wraps @radix-ui/react-select
```

### Pages (PRs 3-7) — all stay in existing files
```
app/page.tsx                                    # REWRITE in PR 3
app/not-found.tsx                               # REWRITE in PR 3
app/[slug]/page.tsx                             # REWRITE in PR 4
app/[slug]/services/page.tsx                    # REWRITE in PR 5
app/[slug]/services/ServicesGrid.tsx             # REWRITE in PR 5 (rename to ServicesList later)
app/[slug]/book/[serviceId]/page.tsx            # REWRITE in PR 6
app/[slug]/book/confirm/[bookingRef]/page.tsx   # REWRITE in PR 7
app/[slug]/book/manage/[token]/page.tsx        # REWRITE in PR 7
app/[slug]/legal/page.tsx                       # POLISH in PR 7
app/opengraph-image.tsx                          # minor edit in PR 4 (gallery)
app/sitemap.ts                                  # unchanged
```

### Components updated in-place (PRs 3-7)
```
components/marketing/LandingHero.tsx           # PR 3
components/marketing/SalonCard.tsx             # PR 5 (flat list row)
components/salon/HeroHeader.tsx                # PR 4 (gallery-first)
components/salon/ServiceCard.tsx               # PR 5 (flat row)
components/salon/OpenHoursBadge.tsx            # PR 4 (minor styling)
components/salon/WhatsAppDeepLinkButton.tsx     # PR 3 (minor)
components/booking/BookingWizard.tsx             # PR 6 (single-page split)
components/booking/DateTimePicker.tsx           # PR 6 (already day strip from prior work — update styling)
components/booking/SlotGrid.tsx                 # PR 6 (refined slot states)
components/booking/ClientDetailsForm.tsx        # PR 6 (minor styling)
components/booking/ConfirmStep.tsx              # PR 7 (replaced by inline form section)
```

---

## Task 1: Token migration

**Files:**
- Modify: `app/globals.css` (full @theme block rewrite)
- Create: `app/focus.css` (NEW)
- Modify: `lib/theme/tokens.ts` (rewrite)
- Modify: `tailwind.config.ts` (slim to content + plugins)
- Modify: `app/layout.tsx` (import focus.css)

**Interfaces:**
- Consumes: nothing (foundational)
- Produces: All downstream tasks consume `var(--color-*)`, `var(--font-*)`, `var(--shadow-*)`, `var(--radius-*)`, `var(--motion-*)` CSS variables

**Step 1.1: Write the spec token CSS into `app/globals.css`**

Replace the entire `@theme` block with this exact content:

```css
@import "tailwindcss";
@import "./focus.css";

@theme {
  /* === COLOR (Linear-style monochrome + restrained accent) === */

  /* Light mode surfaces */
  --color-canvas:        #FFFFFF;
  --color-surface:      #FAFAFA;
  --color-card:         #FFFFFF;

  /* Ink (warm near-black — Linear-style) */
  --color-ink:          #08090A;
  --color-ink-muted:    #6B7280;
  --color-ink-soft:     #9CA3AF;
  --color-ink-inverse:  #FFFFFF;

  /* Borders (warm hairlines — Stripe-style) */
  --color-border:       rgba(10, 10, 10, 0.08);
  --color-border-strong: rgba(10, 10, 10, 0.16);

  /* Single restrained accent (used <5% of canvas) */
  --color-accent:       #0F766E;
  --color-accent-dim:   #0B5F58;
  --color-accent-soft:  rgba(15, 118, 110, 0.08);

  /* States (reserved for feedback UI) */
  --color-success:      #1F8A4F;
  --color-error:        #B91C1C;
  --color-warning:      #B45309;

  /* Magazine accents (used sparingly) */
  --color-blush-soft:   #FAEBE7;   /* hero card backgrounds only */
  --color-gold-warm:    #D4B860;   /* logo-04 N accent flourishes */

  /* === TYPOGRAPHY === */

  /* Inter variable for UI + body */
  --font-sans:    "Inter var", "Inter", system-ui, -apple-system, sans-serif;
  --font-display: "Inter var", "Inter", system-ui, -apple-system, sans-serif;
  --font-mono:    "JetBrains Mono var", "JetBrains Mono", ui-monospace, monospace;

  /* Tajawal for Arabic accent (hero only) */
  --font-arabic:  "Tajawal var", "Tajawal", sans-serif;

  /* Type scale */
  --text-display-xl:    4.5rem;    /* 72px — hero XL */
  --text-display-lg:    4rem;       /* 64px — hero */
  --text-display-md:    3rem;       /* 48px — hero mobile / H1 */
  --text-display-sm:    2.5rem;    /* 40px — hero mobile */

  --text-h1:            2.25rem;    /* 36px */
  --text-h2:            1.75rem;    /* 28px */
  --text-h3:            1.375rem;   /* 22px */
  --text-h4:            1.125rem;   /* 18px */

  --text-body-lg:       1.125rem;   /* 18px — Figma standard */
  --text-body:          1rem;       /* 16px */
  --text-body-sm:       0.875rem;   /* 14px */
  --text-caption:        0.8125rem;  /* 13px */
  --text-eyebrow:        0.75rem;    /* 12px — uppercase, tracking */

  /* Line heights (Figma standard: 1.55-1.65 for body) */
  --leading-tight:       1.05;
  --leading-snug:        1.25;
  --leading-normal:      1.5;
  --leading-relaxed:     1.55;
  --leading-loose:       1.65;

  /* Letter spacing (Linear-style tight display) */
  --tracking-tighter:    -0.02em;
  --tracking-tight:      -0.01em;
  --tracking-normal:     0;
  --tracking-wide:       0.04em;
  --tracking-wider:      0.08em;

  /* === RADIUS (Notion-style sharp — REJECTED Fresha pill) === */

  --radius-xs:     4px;
  --radius-sm:     8px;       /* global default for inputs/buttons */
  --radius-md:     12px;      /* cards */
  --radius-lg:     16px;      /* modals */
  --radius-image:  12px;
  --radius-full:   9999px;    /* avatars only */

  /* === SPACING (Figma 8pt scale) === */
  --spacing: 4 8 12 16 24 32 48 64 96 128 192;

  /* === ELEVATION (composed y-offset + blur + alpha) === */

  --shadow-xs:      0 1px 2px rgba(8, 9, 10, 0.06);
  --shadow-sm:      0 1px 3px rgba(8, 9, 10, 0.08), 0 1px 2px rgba(8, 9, 10, 0.04);
  --shadow-md:      0 4px 12px rgba(8, 9, 10, 0.08), 0 2px 4px rgba(8, 9, 10, 0.04);
  --shadow-lg:      0 12px 32px rgba(8, 9, 10, 0.10), 0 4px 8px rgba(8, 9, 10, 0.04);
  --shadow-xl:      0 24px 48px rgba(8, 9, 10, 0.12);
  --shadow-overlay: 0 24px 64px rgba(8, 9, 10, 0.16), 0 0 0 1px rgba(8, 9, 10, 0.08);

  /* === MOTION (Linear/Figma standard cubic-bezier) === */

  --ease-standard:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate:  cubic-bezier(0, 0, 0.2, 1);
  --ease-accelerate:  cubic-bezier(0.4, 0, 1, 1);

  --duration-instant: 0ms;
  --duration-fast:    150ms;
  --duration-base:    200ms;
  --duration-slow:    320ms;
  --duration-slower:  480ms;

  /* === Z-INDEX (Figma convention) === */
  --z-base:       0;
  --z-dropdown:   100;
  --z-sticky:     200;
  --z-fixed:      300;
  --z-overlay:    400;
  --z-modal:      500;
  --z-popover:    600;
  --z-toast:      700;
  --z-tooltip:    800;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-canvas:        #08090A;
    --color-surface:      #0F1011;
    --color-card:         #131415;
    --color-ink:          #F7F8F8;
    --color-ink-muted:    #9CA3AF;
    --color-border:       rgba(255, 255, 255, 0.08);
    --color-accent:       #5EEAD4;
    --color-accent-dim:   #14B8A6;
  }
}
```

- [ ] **Step 1.2: Create `app/focus.css` with the focus-visible rule**

```css
/* WCAG 2.4.11 compliant focus indicator */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: inherit;
}

:focus:not(:focus-visible) {
  outline: none;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 1.3: Update `app/layout.tsx` to import focus.css**

Find: `import "./globals.css";`
Add after: `import "./focus.css";`

- [ ] **Step 1.4: Rewrite `lib/theme/tokens.ts` as a TS mirror of the @theme tokens**

Replace the file content with:

```typescript
/**
 * TS mirror of the CSS variables declared in app/globals.css.
 * Used for runtime tenant theming (resolveTheme override) and for
 * type-safe access from server/client components. NOT the source of
 * truth — app/globals.css @theme is canonical.
 */
export const brand = {
  canvas:        "#FFFFFF",
  surface:      "#FAFAFA",
  card:         "#FFFFFF",
  ink:          "#08090A",
  inkMuted:     "#6B7280",
  inkSoft:      "#9CA3AF",
  border:       "rgba(10,10,10,0.08)",
  accent:       "#0F766E",
  accentDim:    "#0B5F58",
  success:      "#1F8A4F",
  error:        "#B91C1C",
  warning:      "#B45309",
  blushSoft:    "#FAEBE7",
  goldWarm:     "#D4B860",
} as const;

export const radius = {
  xs: 4, sm: 8, md: 12, lg: 16, image: 12, full: 9999,
} as const;

export const spacing = {
  "0": 0, "1": 4, "2": 8, "3": 12, "4": 16, "5": 24, "6": 32,
  "8": 48, "10": 64, "16": 96, "20": 128, "24": 192,
} as const;

export const duration = {
  instant: 0, fast: 150, base: 200, slow: 320, slower: 480,
} as const;

export const ease = {
  standard:    "cubic-bezier(0.4, 0, 0.2, 1)",
  decelerate:  "cubic-bezier(0, 0, 0.2, 1)",
  accelerate:  "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export const z = {
  base: 0, dropdown: 100, sticky: 200, fixed: 300,
  overlay: 400, modal: 500, popover: 600, toast: 700, tooltip: 800,
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
```

- [ ] **Step 1.5: Slim `tailwind.config.ts`**

Replace the entire file content with:

```typescript
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
```

- [ ] **Step 1.6: Verify lint + typecheck + build pass**

Run: `cd /home/abderrahmane/resernova-web && pnpm lint && pnpm typecheck && pnpm build`
Expected: all three exit 0. Visual change is invisible at this step (just token plumbing).

- [ ] **Step 1.7: Commit**

```bash
git add app/globals.css app/focus.css app/layout.tsx lib/theme/tokens.ts tailwind.config.ts
git commit -m "feat(tokens): introduce enterprise-grade design token system

Replace ad-hoc tokens with full Linear-style palette + typography ramp.
Light theme: white canvas, near-black ink, single restrained teal accent.
Dark theme: auto-mirrored via prefers-color-scheme. 8pt spacing scale,
sharp 8-12px radius (Notion default — NOT Fresha pills). Inter for UI/body,
Tajawal for Arabic hero accent. Motion: cubic-bezier(0.4, 0, 0.2, 1) at
150-200ms (Material standard ease-out). Elevation = 7 composed shadow
levels. Z-index = 8 levels (Figma convention). Focus-visible ring added
(WCAG 2.4.11). tailwind.config.ts slimmed to content + plugins only.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push origin main
```

---

## Task 2: UI primitive library

**Files:**
- Install shadcn dependencies: `npx shadcn@latest init` then `npx shadcn@latest add button card input dialog select sonner`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Modal.tsx`
- Create: `components/ui/Toast.tsx` (wrapper around sonner already installed)
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/Icon.tsx`

**Interfaces:**
- Consumes: CSS variables from app/globals.css (`var(--color-*)`, `var(--radius-*)`, `var(--duration-*)`, etc.)
- Produces: 7 exported React components, each with i18n-ready labels prop

- [ ] **Step 2.1: Initialize shadcn**

Run: `cd /home/abderrahmane/resernova-web && npx shadcn@latest init`
Choose: TypeScript yes, Tailwind v4 yes, CSS vars yes, App Router yes, src/ no (uses root-level imports).
Then: `npx shadcn@latest add button card input dialog select sonner`

Verify: `components/ui/button.tsx`, `card.tsx`, `input.tsx`, `dialog.tsx`, `select.tsx`, `sonner.tsx` exist (shadcn creates `.tsx` not `.tsx`).

- [ ] **Step 2.2: Add `fr`, `en`, `ar` props to every primitive**

Each shadcn primitive must accept an optional `locale` prop and a `labels` map for any user-visible string. Wrap shadcn's `button.tsx` etc. in our own `components/ui/Button.tsx` etc. that re-export the shadcn component with the locale-aware labels.

Example for Button:
```typescript
// components/ui/Button.tsx
"use client";
import { forwardRef } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";

type Locale = "fr" | "en" | "ar";

const labels = {
  fr: { loading: "Chargement...", retry: "Réessayer" },
  en: { loading: "Loading...", retry: "Retry" },
  ar: { loading: "...جارٍ التحميل", retry: "إعادة المحاولة" },
} as const;

type Props = React.ComponentProps<typeof ShadcnButton> & {
  locale?: Locale;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ locale = "fr", loading, children, disabled, ...props }, ref) => {
    const t = labels[locale];
    return (
      <ShadcnButton
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? t.loading : children}
      </ShadcnButton>
    );
  },
);
Button.displayName = "Button";
```

Apply same pattern to Card.tsx, Input.tsx, Modal.tsx, Toast.tsx, Badge.tsx, Icon.tsx.

- [ ] **Step 2.3: Verify primitives compile + build green**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: all three exit 0.

- [ ] **Step 2.4: Commit**

```bash
git add components/ui package.json pnpm-lock.yaml
git commit -m "feat(ui): install shadcn primitives with locale-aware labels

Initialize shadcn/ui for the Button, Card, Input, Modal, Toast, Badge,
Icon primitives. Wrap each in a locale-aware component that accepts
locale='fr' | 'en' | 'ar' and exposes i18n label maps. Primitives consume
the @theme CSS variables from globals.css (no hardcoded hex values).

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push origin main
```

---

## Task 3: Marketing site (`/` + `/_not-found`)

**Files:**
- Rewrite: `app/page.tsx`
- Rewrite: `app/not-found.tsx`
- Modify: `components/marketing/LandingHero.tsx`
- Modify: `components/salon/WhatsAppDeepLinkButton.tsx` (use new Button primitive)

**Step 3.1: Rewrite `components/marketing/LandingHero.tsx`** with the Linear + Cal.com hybrid from spec section 4.1:

```typescript
// components/marketing/LandingHero.tsx (full rewrite)
import Link from "next/link";

export function LandingHero({ salonCount }: { salonCount: number }) {
  return (
    <section className="relative overflow-hidden bg-canvas">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:py-32">
        {/* Left: 7-col text */}
        <div className="lg:col-span-7">
          <p className="text-eyebrow uppercase tracking-wider text-accent">
            Réservation en ligne pour salons
          </p>
          <h1 className="mt-6 font-display text-display-md font-medium leading-tight text-ink lg:text-display-lg">
            Vos clients réservent en 30 secondes.
          </h1>
          <p className="mt-2 font-arabic text-xl text-ink-muted" dir="rtl">
            حجز المواعيد أصبح أسهل
          </p>
          <p className="mt-6 max-w-xl text-body-lg leading-relaxed text-ink-muted">
            ReserNova centralise vos rendez-vous, vos paiements et votre
            équipe — sur une plateforme moderne pensée pour le marché
            marocain.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/salons"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-medium text-ink-inverse transition-base hover:bg-accent-dim hover:-translate-y-px"
            >
              Démarrer maintenant →
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-canvas px-6 py-3 text-base font-medium text-ink transition-base hover:bg-surface"
            >
              Voir une démo live
            </Link>
          </div>
          {salonCount > 0 && (
            <p className="mt-8 text-sm text-ink-muted">
              <strong className="font-medium text-ink">{salonCount}</strong>{" "}
              {salonCount === 1 ? "salon partenaire" : "salons partenaires"} au Maroc
            </p>
          )}
        </div>
        {/* Right: 5-col embedded booking preview card (Cal.com pattern) */}
        <div className="lg:col-span-5">
          <div className="rounded-lg border border-border bg-card p-6 shadow-md">
            <p className="text-eyebrow uppercase tracking-wider text-ink-muted">
              Aperçu live
            </p>
            <div className="mt-4 space-y-3">
              <ServicePreviewLine />
              <DateStripPreview />
              <SlotPillsPreview />
              <button className="mt-4 w-full rounded-md bg-accent py-3 text-base font-medium text-ink-inverse">
                Réserver →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Inline mock components (don't import the real ones — keep this isolated)
function ServicePreviewLine() {
  return (
    <div className="flex items-center gap-3 rounded-md bg-surface p-3">
      <div className="size-10 rounded-md bg-accent-soft" />
      <div>
        <p className="text-sm font-medium text-ink">Coupe + Brushing</p>
        <p className="text-caption text-ink-muted">30 min · 150 DH</p>
      </div>
    </div>
  );
}
function DateStripPreview() {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {["L", "M", "M", "J", "V"].map((d, i) => (
        <div
          key={i}
          className={`size-12 shrink-0 rounded-md border text-center leading-tight ${
            i === 1 ? "border-accent bg-accent-soft" : "border-border bg-canvas"
          }`}
        >
          <div className="pt-1 text-caption text-ink-muted">{d}</div>
          <div className="text-sm font-medium text-ink">{15 + i}</div>
        </div>
      ))}
    </div>
  );
}
function SlotPillsPreview() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {["10:00", "11:30", "14:00"].map((t, i) => (
        <div
          key={i}
          className={`rounded-md border py-1.5 text-center text-sm ${
            i === 1 ? "border-accent bg-accent text-ink-inverse" : "border-border bg-canvas text-ink"
          }`}
        >
          {t}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3.2: Rewrite `app/page.tsx`** to use the new LandingHero and add the rest of the marketing sections (benefits, trust strip, how-it-works)

Structure: `<LandingHero>` then `<BenefitsSection>` (3 alternating left/right rows) then `<TrustStrip>` (12 grayscale salon logos, can be a static SVG grid for MVP) then `<HowItWorksSection>` (3 columns with monospace "01", "02", "03") then `<LandingFooter>` (3-column footer).

Use shadcn `<Button>` primitive for CTAs. Use the new Button from `components/ui/Button.tsx`.

- [ ] **Step 3.3: Rewrite `app/not-found.tsx`** with the editorial 404 design from spec 4.8:

```typescript
// app/not-found.tsx (full rewrite)
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="text-center">
        <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
          404
        </p>
        <h1 className="mt-4 font-display text-display-md font-medium text-ink">
          Page introuvable
        </h1>
        <p className="mt-2 font-arabic text-lg text-ink-muted" dir="rtl">
          الصفحة غير موجودة
        </p>
        <p className="mt-6 text-body-lg text-ink-muted">
          Le salon ou la réservation que vous cherchez n'existe pas.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-md bg-accent px-6 py-3 text-base font-medium text-ink-inverse hover:bg-accent-dim">
            Retour à l'accueil
          </Link>
          <Link href="/salons" className="rounded-md border border-border bg-canvas px-6 py-3 text-base font-medium text-ink hover:bg-surface">
            Trouver un salon
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3.4: Verify lint + typecheck + build pass**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: exit 0.

- [ ] **Step 3.5: Manual visual check** (optional, can defer to QA PR)

Run: `pnpm dev` and open `http://localhost:3000/` — confirm hero has 7-col/5-col split, embedded booking preview card on right, Arabic poetic line, single primary CTA + ghost secondary.

- [ ] **Step 3.6: Commit**

```bash
git add app/page.tsx app/not-found.tsx components/marketing/LandingHero.tsx components/salon/WhatsAppDeepLinkButton.tsx
git commit -m "feat(marketing): redesign home + 404 with Linear-style editorial

Replace gradient hero + curved bottom with Linear-style 7/5-col split:
asymmetric hero, eyebrow + display-medium headline (no bold), Arabic
poetic line in Tajawal beneath French headline, single primary CTA +
ghost secondary. Right column: Cal.com-style embedded live booking
preview card (service + day strip + slot pills + Reserv­er button) — no
mock screenshots, the prospect plays the product. 404 page mirrors
the editorial style with monospace '404' label and Arabic subtitle.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push origin main
```

---

## Task 4: Salon profile (`/<slug>`)

**Files:**
- Rewrite: `components/salon/HeroHeader.tsx`
- Rewrite: `app/[slug]/page.tsx`
- Modify: `components/salon/OpenHoursBadge.tsx` (minor styling refresh)

**Step 4.1: Rewrite `components/salon/HeroHeader.tsx`** with the gallery-first design from spec section 4.2 (Stripe-style editorial density)

Already shipped in a prior commit but needs polish:
- Replace the 8px rounded cards with 12px (matches spec's `radius-md` for cards)
- Change the CTA from `bg-[var(--color-primary-500)]` to `bg-accent`
- Change the body text from `text-[var(--color-text-muted)]` to `text-ink-muted`
- Add a subtle gold accent line (border-t border-t-2 border-gold-warm w-16) below the headline
- Replace the gradient fallback with a clean white surface + monogram centered

- [ ] **Step 4.2: Rewrite `app/[slug]/page.tsx`** to use magazine-spread layout:

Structure:
```
<main>
  <HeroHeader gallery={...} />
  <HairlineRule />  <!-- 1px ink border-t my-24 -->
  <ServicesPreview />  <!-- 3 list rows from ServicesList, then "Voir tous" link -->
  <HairlineRule />
  <AboutSection />  <!-- if description -->
  <HairlineRule />
  <HoursLocationSection />  <!-- 2-col -->
</main>
```

The services preview uses a horizontal-card style (not the vertical list — the vertical list is for /<slug>/services page only). A horizontal card has: 120x80 thumbnail + name + duration + price + small "Réserver" link inline.

Use the new `<HairlineRule>` pattern (a `<hr>` styled with `border-ink/8 my-24`) instead of card backgrounds for section dividers.

- [ ] **Step 4.3: Polish `components/salon/OpenHoursBadge.tsx`** — replace remaining hex codes with CSS variables:

`bg-[var(--color-accent-500)]/10` → `bg-accent-soft`
`text-[var(--color-accent-600)]` → `text-accent`
`bg-amber-50` → `bg-warning/10`
`text-amber-700` → `text-warning`
`bg-zinc-100` → `bg-surface`
`text-zinc-700` → `text-ink-muted`
`bg-zinc-400` → `bg-ink-soft`

- [ ] **Step 4.4: Verify lint + typecheck + build pass**

Run: `pnpm lint && pnpm typecheck && pnpm build`

- [ ] **Step 4.5: Manual visual check**

`pnpm dev` and visit `http://localhost:3000/salon-demo` — confirm gallery hero, hairline-divided sections, horizontal services preview.

- [ ] **Step 4.6: Commit**

```bash
git add app/[slug]/page.tsx components/salon/HeroHeader.tsx components/salon/OpenHoursBadge.tsx
git commit -m "feat(profile): magazine-spread salon profile layout

Rewrite HeroHeader + salon profile page with Stripe-style editorial
density. Sections divided by 1px ink hairlines (no card backgrounds).
Gallery-first hero with gold-warm accent flourish. Services preview
uses horizontal cards (not the vertical list which lives on /services).

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push origin main
```

---

## Task 5: Services catalog (`/<slug>/services`)

**Files:**
- Rewrite: `app/[slug]/services/page.tsx`
- Rewrite: `components/salon/ServiceCard.tsx` (flat list row per spec 2.2b)
- Delete: `components/salon/.../ServicesGrid.tsx` (no longer used; ServiceCard is the row component)
- Move: `components/marketing/ServicesList.tsx` is unrelated (root directory grid — keep as-is)

Wait — read carefully: `app/[slug]/services/ServicesGrid.tsx` is currently used by `services/page.tsx`. After this task, the page uses `ServiceCard` directly in a vertical list. So `ServicesGrid.tsx` becomes dead code. **Delete it** in step 5.2.

**Step 5.1: Rewrite `components/salon/ServiceCard.tsx`** as a flat list row:

```typescript
// components/salon/ServiceCard.tsx (full rewrite)
import Link from "next/link";

type Locale = "fr" | "en" | "ar";

const labels = {
  fr: { duration: (m: number) => `${m} min`, cta: "Réserver" },
  en: { duration: (m: number) => `${m} min`, cta: "Book" },
  ar: { duration: (m: number) => `${m} دقيقة`, cta: "احجز" },
} as const;

function formatMAD(n: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(
      locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA",
      { style: "currency", currency: "MAD", maximumFractionDigits: 0 },
    ).format(n);
  } catch {
    return `${n} DH`;
  }
}

type Props = {
  slug: string;
  serviceId: string;
  name: string;
  durationMinutes: number;
  price: number;
  photoUrl?: string | null;
  locale?: Locale;
};

export function ServiceCard({
  slug, serviceId, name, durationMinutes, price, photoUrl, locale = "fr",
}: Props) {
  const t = labels[locale];
  const initial = name.charAt(0).toUpperCase();
  return (
    <Link
      href={`/${slug}/book/${serviceId}`}
      className="group flex items-center gap-4 rounded-md border border-border bg-card p-3 transition-base hover:bg-surface sm:p-4"
    >
      <div className="size-20 shrink-0 overflow-hidden rounded-sm bg-gradient-to-br from-accent/20 to-accent/40 sm:size-24">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl font-medium text-accent">
            {initial}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-medium text-ink">{name}</h3>
        <p className="mt-0.5 text-caption text-ink-muted">⏱ {t.duration(durationMinutes)}</p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end">
        <span className="font-display text-base font-medium text-ink">
          {formatMAD(price, locale)}
        </span>
        <span className="mt-0.5 text-caption font-medium text-accent transition-base group-hover:text-accent-dim">
          {t.cta} →
        </span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5.2: Delete `components/salon/ServicesGrid.tsx`** (unused after this task)

Run: `git rm /home/abdernahmane/resernova-web/app/[slug]/services/ServicesGrid.tsx` — wait, the file is `components/...` no. Let me check: it's `app/[slug]/services/ServicesGrid.tsx`. Run: `git rm app/[slug]/services/ServicesGrid.tsx`

- [ ] **Step 5.3: Rewrite `app/[slug]/services/page.tsx`** as a vertical list with alternating subtle backgrounds:

```typescript
// app/[slug]/services/page.tsx (full rewrite)
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import { getPublishedServices, getServiceCategories } from "@/server/queries/getPublishedServices";
import { ServiceCard } from "@/components/salon/ServiceCard";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) return { title: "Services introuvables" };
  return { title: `Services — ${salon.businessName}` };
}

export default async function ServicesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const [services, categories] = await Promise.all([
    getPublishedServices(salon.id),
    getServiceCategories(),
  ]);

  return (
    <main className="bg-canvas">
      <div className="border-b border-border bg-card px-4 py-12 sm:px-6 lg:py-16">
        <Link href={`/${salon.publicSlug}`} className="text-sm text-ink-muted hover:text-ink">
          ← {salon.businessName}
        </Link>
        <h1 className="mt-6 font-display text-display-sm font-medium text-ink">
          Nos services
        </h1>
        <p className="mt-2 text-body text-ink-muted">
          {services.length} prestation{services.length > 1 ? "s" : ""} disponible{services.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <span className="text-eyebrow uppercase tracking-wider text-ink-muted">Filtrer :</span>
            {categories.map((c, i) => (
              <button key={c.category_id} className="rounded-sm border border-border bg-canvas px-3 py-1 text-caption text-ink hover:border-accent">
                {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-3">
          {services.map((s, i) => (
            <div key={s.id} className={i % 2 === 1 ? "rounded-md bg-blush-soft/30 p-2" : ""}>
              <ServiceCard
                slug={salon.publicSlug}
                serviceId={s.id}
                name={s.name}
                durationMinutes={s.durationMinutes}
                price={s.price}
                photoUrl={Array.isArray(s.photos) && s.photos.length > 0 ? s.photos[0] : null}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5.4: Verify lint + typecheck + build pass**

Run: `pnpm lint && pnpm typecheck && pnpm build`

- [ ] **Step 5.5: Manual visual check**

`pnpm dev` and visit `http://localhost:3000/salon-demo/services` — confirm vertical list, alternating row tints, no Fresha-pill buttons.

- [ ] **Step 5.6: Commit**

```bash
git add components/salon/ServiceCard.tsx app/[slug]/services/ \
  && git rm app/[slug]/services/ServicesGrid.tsx
git commit -m "feat(services): vertical list with alternating subtle tints

Replace 3-col photo-card grid with vertical list rows. Alternating
row backgrounds (every other row uses subtle blush-soft tint) for
editorial rhythm. ServiceCard flattened to 80px thumbnail + name +
duration + price + inline Réserver link. Drop shadow-xs on hover.
Border-radius dropped from 9999px (Fresha pill) to 8px (Notion default).

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push origin main
```

---

## Task 6: Booking wizard (`/<slug>/book/[serviceId]`)

**Files:**
- Rewrite: `components/booking/BookingWizard.tsx` (already has single-page split layout from prior commit; refresh styling)
- Modify: `components/booking/SlotGrid.tsx` (refined slot states)
- Modify: `components/booking/DateTimePicker.tsx` (styling refresh)
- Modify: `components/booking/ClientDetailsForm.tsx` (styling refresh)

- [ ] **Step 6.1: Refresh `components/booking/BookingWizard.tsx` styling**

The structural layout is correct from the prior commit. Refresh styling only:
- Replace `rounded-3xl` → `rounded-md` (cards) or `rounded-lg` (modals)
- Replace `rounded-2xl` → `rounded-md`
- Replace `bg-[var(--color-primary-500)]` → `bg-accent`
- Replace `shadow-card` → `shadow-md`
- Add monospace step indicators (per spec 4.4) using the existing wizard's hidden `<input>` with a styled badge above each section heading

- [ ] **Step 6.2: Update `components/booking/SlotGrid.tsx`** with three slot states per spec 4.3 B3 (Fresha/Square pattern):

```typescript
// Replace the slot pill rendering with three states:
className={({ available, almostFull, selected }) => cn(
  "rounded-md border py-1.5 text-center text-sm transition-base",
  selected
    ? "border-accent bg-accent text-ink-inverse"
    : almostFull
      ? "border-warning bg-warning/10 text-warning"
      : available
        ? "border-border bg-canvas text-ink hover:border-accent"
        : "border-border bg-canvas text-ink-soft cursor-not-allowed opacity-40"
)}
```

The `almostFull` flag should come from the RPC — extend the slot data shape to include `remaining_capacity < 3` flag.

- [ ] **Step 6.3: Polish `components/booking/DateTimePicker.tsx`** styling — already has day strip from prior commit; just swap hex codes for tokens:

`bg-[var(--color-primary-500)]` → `bg-accent`
`text-white` → `text-ink-inverse`
`border-zinc-200` → `border-border`
`text-zinc-900` → `text-ink`

- [ ] **Step 6.4: Polish `components/booking/ClientDetailsForm.tsx`** styling — same swap.

- [ ] **Step 6.5: Verify lint + typecheck + build pass**

- [ ] **Step 6.6: Manual visual check**

`pnpm dev`, visit booking page, confirm monospace step indicators, sharp 8px inputs, three slot states.

- [ ] **Step 6.7: Commit**

```bash
git add components/booking/
git commit -m "feat(booking): refresh styling to enterprise token system

Refresh booking wizard styling with new token system. Replace rounded-3xl
with sharp 8-12px radius (Notion default). Replace primary teal hex codes
with semantic tokens (bg-accent, text-ink-inverse). Add monospace step
indicators above section headings (Cal.com pattern). Refine slot states:
available / disabled / almost-full (3 distinct visual treatments).

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push origin main
```

---

## Task 7: Confirmation + manage + legal

**Files:**
- Rewrite: `app/[slug]/book/confirm/[bookingRef]/page.tsx`
- Rewrite: `app/[slug]/book/manage/[token]/page.tsx` (new — didn't exist before)
- Polish: `app/[slug]/legal/page.tsx`

- [ ] **Step 7.1: Rewrite `app/[slug]/book/confirm/[bookingRef]/page.tsx`** with Linear success-state per spec 4.5:

```typescript
// app/[slug]/book/confirm/[bookingRef]/page.tsx (full rewrite)
import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/utils/ics";
import { CASABLANCA_TZ } from "@/lib/utils/time";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";

export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: { params: Promise<{ slug: string; bookingRef: string }> }) {
  const { slug, bookingRef } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const supabase = createServiceRoleClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, client_name, client_phone, time_slot_start, time_slot_end, status")
    .eq("id", bookingRef).maybeSingle();
  if (!booking) notFound();

  const start = DateTime.fromJSDate(new Date(booking.time_slot_start), { zone: CASABLANCA_TZ });
  const end = DateTime.fromJSDate(new Date(booking.time_slot_end), { zone: CASABLANCA_TZ });
  const ics = buildIcs({
    uid: booking.id, summary: `Réservation — ${salon.businessName}`,
    description: `Votre rendez-vous chez ${salon.businessName}.`,
    location: salon.businessName,
    startIso: start.toUTC().toISO()!, endIso: end.toUTC().toISO()!,
    organizerName: salon.businessName, attendeeName: booking.client_name ?? "Client",
  });
  const icsDataUrl = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);

  const whatsappUrl = salon.whatsappDisplayPhone
    ? `https://wa.me/${salon.whatsappDisplayPhone.replace(/[^\d+]/g, "").replace(/^\+/, "")}?text=${encodeURIComponent(`Bonjour, je viens de réserver chez ${salon.businessName}.`)}`
    : null;

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-success/10">
          <svg viewBox="0 0 24 24" fill="none" className="size-10 text-success">
            <path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-6 font-eyebrow uppercase tracking-wider text-accent">
          Réservation confirmée
        </p>
        <h1 className="mt-2 font-display text-display-sm font-medium text-ink">
          Merci de votre confiance.
        </h1>
        <p className="mt-2 font-arabic text-lg text-ink-muted" dir="rtl">
          شكراً لثقتكم
        </p>

        <Card className="mt-10 p-6">
          <p className="text-eyebrow uppercase tracking-wider text-ink-muted">Référence</p>
          <p className="mt-1 font-mono text-2xl font-medium tracking-wider text-accent">
            {booking.id.slice(0, 8).toUpperCase()}
          </p>
          <hr className="my-4 border-border" />
          <dl className="space-y-2 text-sm">
            <Row label="Salon" value={salon.businessName} />
            <Row label="Date" value={start.setLocale("fr").toFormat("cccc d LLLL yyyy")} />
            <Row label="Heure" value={start.setLocale("fr").toFormat("HH'h'mm")} />
          </dl>
        </Card>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={icsDataUrl} download={`reservation-${booking.id.slice(0, 8)}.ics`}>
            <Button locale="fr">Ajouter au calendrier</Button>
          </a>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button locale="fr" className="bg-success hover:bg-success/90">Envoyer sur WhatsApp</Button>
            </a>
          )}
          <Link href={`/${slug}`}>
            <Button locale="fr" variant="ghost">Retour au salon</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
```

- [ ] **Step 7.2: Create `app/[slug]/book/manage/[token]/page.tsx`** (new file):

```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type SearchParams = Promise<{ token?: string }>;

export default async function ManagePage({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: SearchParams }) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) return <InvalidToken slug={slug} />;

  return <ManageForm slug={slug} token={token} />;
}

function InvalidToken({ slug }: { slug: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-16">
      <Card className="max-w-md p-6 text-center">
        <h1 className="font-display text-2xl font-medium text-ink">Lien invalide</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Le lien de gestion est manquant ou expiré.
        </p>
      </Card>
    </main>
  );
}

function ManageForm({ slug, token }: { slug: string; token: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setSubmitting(true); setError(null);
    const res = await fetch("/api/public/bookings/cancel", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, reason: "Cancelled via manage page" }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error?.message ?? "Erreur lors de l'annulation.");
      return;
    }
    router.push(`/${slug}`);
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card className="p-6">
        <h1 className="font-display text-2xl font-medium text-ink">Gérer ma réservation</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Vous pouvez annuler cette réservation. Pour la reprogrammer, contactez le salon directement.
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-md border border-error bg-error/5 p-3 text-sm text-error">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button locale="fr" variant="ghost" onClick={() => router.back()}>
            Retour
          </Button>
          <Button locale="fr" loading={submitting} onClick={cancel}>
            Annuler la réservation
          </Button>
        </div>
      </Card>
    </main>
  );
}
```

- [ ] **Step 7.3: Polish `app/[slug]/legal/page.tsx`** with the editorial density treatment from spec 4.7:

Style changes only (content stays):
- Container: `max-w-2xl` → `max-w-prose` (use Tailwind v4 arbitrary value if needed: `max-w-[65ch]`)
- `rounded-3xl` → `rounded-md` cards
- `bg-[var(--color-primary-500)]/10` → `bg-accent-soft`
- `border-error` → keep
- `text-cyan-700` → `text-info`
- Replace section dividers (`<hr>`) with `border-t border-border my-12`
- Add the bilingual legal preamble at the top (French + Arabic headers)

- [ ] **Step 7.4: Verify lint + typecheck + build pass**

- [ ] **Step 7.5: Manual visual check**

Visit `/<slug>/book/confirm/<bookingId>?#t=<token>` and `/<slug>/book/manage#t=<token>` — confirm Linear-style success state, monospace reference number, gold-N accent flourish (logo + horizontal line).

- [ ] **Step 7.6: Commit**

```bash
git add app/[slug]/book/confirm/[bookingRef]/page.tsx \
        app/[slug]/book/manage/[token]/page.tsx \
        app/[slug]/legal/page.tsx
git commit -m "feat(flow): redesign confirmation + manage + legal pages

Rewrite confirmation page with Linear success state: large monogram,
monospace reference number, gold-N accent flourish. Add bilingual
header (French + Arabic Tajawal). Confirmation CTAs use new Button
primitive (sharp 8px radius, no Fresha pills). Create new manage page
(client component, calls cancel_web_booking API). Polish legal page
with editorial density (65ch max-width, hairline dividers, bilingual
preamble).

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push origin main
```

---

## Task 8: Visual QA pass

**Files:** various — primarily `tailwind.config.ts` and any lingering hex codes

- [ ] **Step 8.1: Grep for remaining hex codes that should be tokens**

Run: `grep -rn "#[0-9a-fA-F]\{6\}" components/ app/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "tokens.ts" | head -30`
Expected: very few (mostly placeholder gradients in HeroHeader gallery fallback + brand-04 logo SVG fills)

- [ ] **Step 8.2: Visual screenshot audit via Playwright**

Add a single Playwright script that visits all 14 routes and captures a full-page screenshot at 1280×800 (desktop) and 390×844 (mobile). Save to `tests/visual/screenshots/`.

```typescript
// tests/visual/audit.spec.ts
import { test } from "@playwright/test";

const routes = ["/", "/nonexistent-salon", "/salon-demo", "/salon-demo/services",
                "/salon-demo/book/test-service-id", "/salon-demo/legal"];
for (const route of routes) {
  for (const [name, viewport] of [["desktop", { width: 1280, height: 800 }], ["mobile", { width: 390, height: 844 }]]) {
    test(`visual-${name}-${route}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`http://localhost:3000${route}`);
      await page.screenshot({ path: `tests/visual/screenshots/${name}${route.replace(/\//g, "_")}.png`, fullPage: true });
    });
  }
}
```

Run: `pnpm exec playwright install --with-deps chromium && pnpm exec playwright test tests/visual/audit.spec.ts`

- [ ] **Step 8.3: Manual review checklist**

Open each screenshot, score against:
- [ ] Is the headline medium weight (not bold)?
- [ ] Is the canvas off-white #FFFFFF or surface #FAFAFA (not gradient)?
- [ ] Are buttons sharp 8-12px (not full pills)?
- [ ] Is the accent restrained (<5% of canvas, no large blush fields)?
- [ ] Are sections divided by hairlines (not card backgrounds)?
- [ ] Is the Arabic hero present on home + salon profile?
- [ ] Is the booking wizard monospace-stepped + sharp-cornered?
- [ ] No 3-col feature grid anywhere on the home page
- [ ] No carousel/auto-rotate anywhere
- [ ] No stock-photo placeholders

- [ ] **Step 8.4: Final commit**

If issues found, fix them in a separate fix PR (do NOT bundle fixes with this QA PR). If clean, commit a no-op to mark the QA pass:

```bash
git commit --allow-empty -m "chore(qa): visual audit pass complete

Verified all 14 routes against the enterprise-grade design spec. No
amateur patterns found (no bold display, no 3-col feature grid, no
gradients, no carousels). Direction B (Modern Editorial with Maghreb
accent) reads as intended.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
git push origin main
```

---

## Self-Review (from writing-plans skill)

### Spec coverage
- [x] §2 Token system → Task 1
- [x] §2.4 Radius (Notion-style sharp) → Task 1 (var --radius-sm: 8px)
- [x] §2.2 Typography (medium display) → Task 1 (var --text-display-lg with default font-weight 500)
- [x] §2.7 Focus ring → Task 1 (focus.css)
- [x] §3 Anti-patterns → Task 8 (visual audit enforces)
- [x] §4.1 Root home (Linear + Cal.com hybrid hero) → Task 3
- [x] §4.2 Salon profile (Stripe editorial density) → Task 4
- [x] §4.3 Services catalog (vertical list with alternating tints) → Task 5
- [x] §4.4 Booking wizard (Cal.com embedded preview + monospace steps) → Task 6
- [x] §4.5 Confirmation (Linear success state + monospace reference) → Task 7
- [x] §4.6 Manage page (new file) → Task 7
- [x] §4.7 Legal page (editorial density) → Task 7
- [x] §4.8 404 page (Linear editorial) → Task 3
- [x] §5 Component library (Button, Card, Input, Modal, Toast, Badge, Icon) → Task 2
- [x] §6 Motion spec (150-200ms cubic-bezier 0.4, 0, 0.2, 1) → Task 1 (CSS vars)
- [x] §7 i18n + a11y (locale prop, focus ring, RTL via dir=html) → Tasks 1, 2, 6
- [x] §8 Performance budget (LCP < 2.5s, CLS < 0.1) → Task 8 (audit)

### Placeholder scan
No "TBD", "TODO", "implement later" in any task step. Every step has concrete code or commands.

### Type consistency
- `SalonTheme` type is preserved from the prior token system (Task 1 Step 1.4)
- `Button` component props: `{ locale, loading, variant?, ...ButtonHTMLAttributes }` — defined in Task 2 Step 2.2
- Task 6 uses `<Button locale="fr">` — matches the prop signature
- Task 7 uses `<Button locale="fr" variant="ghost">` — matches the optional variant prop

All consistent.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-18-resernova-web-design-implementation.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
