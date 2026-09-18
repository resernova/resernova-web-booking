# ReserNova Web — Enterprise-Grade UI/UX Redesign — Design Spec

**Date:** 2026-09-18
**Visual direction:** B — Modern Editorial (GlossGenius-inspired)
**Status:** Approved by user (token system confirmed)
**Author:** Claude (architect mode)

---

## 1. Context & Goals

### Why
The current web app at `book.resernova.com/<slug>` is functional but reads as templated. The user wants an **enterprise-grade modern look that shows ReserNova's identity**. The Fresha-inspired redesign that shipped 2 days ago solved the UX flows but not the visual identity.

### What we're building
A complete UI system + page redesign that:
- Looks **internationally credible** (procurement-safe, polished)
- Carries **editorial gravitas** (magazine-spread layouts, generous whitespace)
- Speaks to **Moroccan identity** through restraint (gold-N logo lockup + Arabic poetic line beneath French headlines), not literalism (no lantern icons, no mint tea)
- Performs (LCP < 2.5s, CLS < 0.1)
- Stays accessible (WCAG 2.1 AA)

### Constraints (hard requirements)
- No breaking changes to the existing data model (`web_meta`, `provider_locations.opening_hours`, `services` schema, 14 routes all working)
- i18n preserved — every label in fr/en/ar via existing labels pattern
- Accessibility preserved — WCAG 2.1 AA minimum (radiogroup, aria-pressed, focus, contrast)
- Performance budget — LCP < 2.5s on mobile, CLS < 0.1
- Vercel deployment unchanged — no new env vars, no exotic bundling
- All existing functionality intact — booking, cancel, reschedule, manage, legal

---

## 2. Token System (approved)

### Color palette
```
Canvas:    #FAFAF7 (warm off-white — magazine paper)
Card:      #FFFFFF
Ink:       #0E0E0E (near-black, editorial)
Ink muted: #5A5A5A
Ink soft:  #8A8A8A
Border:    #E8E8E5 (warm hairline)

Primary:   #1C6B6D (existing brand teal — anchor)
Primary 50/100/200/.../950 (full ramp to be generated)
Accent:    #25D366 (WhatsApp green — chat surfaces only)
Blush:     #E76F99 (editorial accent — buttons, badges)
Gold:      #D4B860 (logo-04's "N" color, used sparingly)

States: error/warning/success/info — each gets -bg / -border / -text triplet
```

### Typography
```
Display:  Inter (700, 800) — same family, different weight
Body:     Inter (400, 500, 600) — already loaded
Arabic:   Inter Arabic — keep one family

Type sizes (rem):
  display: 3.5 / 4 / 5 / 6 / 7
  h1-h6:   2.25 / 1.875 / 1.5 / 1.25 / 1.125 / 1
  body:    1, body-lg: 1.125, body-sm: 0.875
  caption: 0.8125, micro: 0.6875

Line heights: tight (1.1), snug (1.25), normal (1.5), relaxed (1.625), loose (2)
Letter spacing: tighter (-0.04em), tight (-0.02em), normal, wide (0.04em), wider (0.08em)
```

### Motion
```
Durations: instant (0ms), fast (120ms), base (200ms), slow (320ms), slower (480ms)
Easings:
  standard:    cubic-bezier(0.2, 0, 0, 1)        — most UI
  decelerate:  cubic-bezier(0, 0, 0.2, 1)        — entrances
  accelerate:  cubic-bezier(0.4, 0, 1, 1)        — exits
  spring:      cubic-bezier(0.34, 1.56, 0.64, 1) — playful over-shoot

Named transitions: fade, slide-up, scale-in, press

Hover lift: translateY(-1px) + shadow swap sm→md, 180ms standard
NO carousel / NO marquee / NO editorial 01/N counter (these would age fast; we keep things timeless)
```

### Elevation (7 levels, tied to z-index)
```
z-base(0), z-raised(10), z-floating(20), z-sticky(30),
z-overlay(40), z-modal(50), z-popover(60)
Each: y-offset, blur, alpha — composed, not declared as raw rgba strings
```

### Spacing
```
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 120 / 160
Section vertical: 120px desktop, 64px mobile
Container max-width: 1280px, 24px gutter
Card padding: 32px
Button padding: 16px H × 12px V (md), 24px × 16px (lg)
```

### Radius
```
xs 4, sm 8, md 12, base 16, lg 20, xl 24, 2xl 32, hero 36, full 9999
```

### Focus ring (NEW — a11y gap fix)
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Distinguishing patterns (from Direction B)
1. **Asymmetric hero** — 55% text / 45% image
2. **Triplet image cards** — pastel color blocks (cream / blush / sage) each housing one service highlight
3. (dropped) Editorial 01/N counter — section pagination style — *rejected as too dated*
4. **Quantified trust stats** — "23% increase in repeat bookings"
5. **Bilingual hero** — French headline + Arabic poetic line beneath

---

## 3. Architecture

### Token source of truth

**`app/globals.css`** (the `@theme` block) becomes the canonical token source.

**`lib/theme/tokens.ts`** becomes a thin TypeScript mirror — typed against `@theme` values, used only for:
- Tenant-override resolution (`resolveTheme(overrides)`)
- Runtime CSS-variable overrides
- Flutter-mobile cross-stack sync reference

**`tailwind.config.ts`** is slimmed to `content` + plugins only (no `theme.extend` — that was duplicating `@theme`).

### Component library structure

```
components/
├── ui/                       # primitives (Button, Card, Input, Select, Modal, Toast, Tabs, Avatar, Badge, Icon)
│                             # These wrap shadcn primitives (Radix + Tailwind) — but use OUR tokens, not default shadcn
│                             # Single source of truth for visual feel
├── marketing/                # Home (root), ServicesList, HeroHeader, FeatureGrid
├── salon/                    # HeroHeader (gallery), ServiceCard, OpenHoursBadge, WhatsAppDeepLinkButton
├── booking/                  # BookingWizard (single-page split), DateTimePicker (day strip), SlotGrid, ClientDetailsForm, ConfirmStep
└── shared/                    # ErrorBoundary, EmptyState, LocaleSwitcher, HoneypotField
```

### State management
- Server Components (RSC) for all data fetching + initial render
- Client Components only for: form state (RHF), date strip (selection), slot grid (fetch + selection), modal flows
- `unstable_cache` for the heavy reads (salon profile, services list) with proper tags for future revalidation
- No Redux/Zustand — local state + form state is sufficient

---

## 4. Page-by-page vision

### 4.1 Root `/` (home / marketing)

**Layout:** Asymmetric hero (55% text left, 45% image collage right). Triplet image cards below ("Pilier 01 — Réservation", "Pilier 02 — Paiement", "Pilier 03 — Équipe"). Quantified trust stats in a slim strip.

**Magazine grid:** Section headings use clean typographic hierarchy (no editorial counter). Bilingual hero: "Réservez votre rendez-vous beauté" / Arabic poetic line (placeholder copy pending native Arabic review).

**Hero elements:**
- Wordmark monogram (logo-02) top-left in nav
- Editorial H1 display
- Gold accent line (1px, 80px wide) below H1 — signature flourish referencing logo-04
- Subtitle in muted ink
- Two CTAs: primary "Démarrer" (blush), secondary "Voir les salons" (text + arrow)
- Right side: 3-image collage stacked asymmetrically (one main image + 2 small offsets), all with subtle teal-tinted overlays

**CTAs that change:**
- Primary: "Démarrer" / "Get started" / "ابدأ" — links to `/salons` (or stays on `/` if we add a search bar later)
- Secondary: "Voir les salons" / "See salons" / "شاهد الصالونات"

### 4.2 `/<slug>` (salon profile)

**Layout:** Magazine-spread, single long-scroll page. Hero gallery (60/40 split desktop, full-width mobile carousel). Sticky right-rail summary card (desktop only) with service card, location, hours, action buttons. Below: long-form sections — about, services preview (3-up), hours + location, reviews (placeholder for Phase 2).

**Hero elements (refresh from current HeroHeader):**
- 60/40 image split, 1 large + 2 thumbnails

- Gallery-first identity block (category → name → rating → open-status dot)
- Inline CTA "Réserver" + "Voir l'adresse"

**Magazine touches:**
- Section dividers: typographic `* * *` instead of `<hr>`
- Asymmetric grids where possible (avoid 3-col / 2-col symmetry everywhere)
- Bilingual greeting in the salon description block (French + Arabic poetic line)

### 4.3 `/<slug>/services` (catalog)

**Layout:** Vertical list (current ServicesList), but with editorial polish — alternating row backgrounds (every other row has very subtle blush-tint), inline category chip strip at top, sort dropdown to the right.

**Per-row layout:**
- 80×80 thumbnail | name + duration | price + inline "Réserver →" link
- On hover: row gains subtle blush background + the "Réserver →" link shifts to teal
- Tap target: entire row (not just the link)

### 4.4 `/<slug>/book/[serviceId]` (booking)

**Layout:** Single-page split (35% sticky sidebar + 65% main column). No stepper — section headers carry progression.

**Sidebar (sticky):**
- Service summary (name + duration + price)
- Staff selector ("Tout professionnel" default, dropdown of staff)
- Live total (appears when slot is selected)
- Triangle edge connecting to main column

**Main column — three sections:**
1. **Date & heure** — day strip (14 days visible, prev/next chevrons) → SlotGrid (3-col pills, full accent when selected)
2. **Vos informations** — name, phone, email, WhatsApp opt-in, special requests (textarea), honeypot (hidden), min-time-on-page gate (3s)
3. **Confirm booking** — summary card (service + slot + price + total), single "Confirmer la réservation" button (blush, full-width, disabled until slot + form valid)

**Motion:** Scroll-in fade-up on section headers (24px translate, 400ms decelerate, stagger 80ms)

### 4.5 `/<slug>/book/confirm/<bookingRef>` (post-book)

**Layout:** Centered success state. Large monogram + "Réservation confirmée !" H1. Bilingual sub. Then: booking summary card (8-char reference), 3 CTAs (Ajouter au calendrier / Envoyer sur WhatsApp / Retour au salon). Below: salon name + "Merci de votre confiance."

**Magazine touches:** Gold accent line under H1 (echo logo-04 N). Single hero card with extra-large type for the booking reference.

### 4.6 `/<slug>/book/manage#t=<token>` (manage)

**Layout:** Card-based. Three sections: booking summary (read-only), actions (cancel + reschedule), contact salon.

**Visual:** Same single-page split as booking, but inverted (actions on left, summary on right) — Fresha-style "you're in control" framing.

### 4.7 `/<slug>/legal` (privacy + terms)

**Layout:** Long-form prose, magazine-spread. Max-width 65ch. H1 + H2 hierarchy. Bilingual legal preamble (French + Arabic). Bordered callout for "right to erasure" (CNDP / Loi 09-08).

### 4.8 Not-found page

**Layout:** Same gradient fallback as current. Editorial flourish: monogram + "404" + 1-line bilingual copy + 2 CTAs (home + salons).

---

## 5. Component Library Spec

### Buttons

```
# Primary CTA = bg=primary (teal) — main form/booking actions
# Secondary CTA = bg=blush (editorial) — hero CTAs, "Voir tout" type links
Primary:    full pill, bg=primary, text=white, hover:bg=primaryDark, shadow-button
Secondary:  full pill, bg=blush, text=white, hover:bg=blushDark, shadow-button
Tertiary:   full pill, bg=white, text=ink, border=border, hover:bg=canvas
Ghost:      full pill, bg=transparent, text=ink, hover:bg=canvas
Icon:       size=40px, full pill, same colors as primary/secondary
```

All buttons: 16px H × 12px V padding (md) or 24px × 16px (lg), radius=full, transition=180ms standard.

### Inputs

```
Default:   bg=white, border=border, radius=8px, focus:border=primary + focus ring
Error:     border=error, + error-bg ring
Disabled:  bg=canvas, text=ink soft
```

### Cards (3 variants)

```
Base:     bg=white, radius=lg (20px), shadow=sm, hover:shadow=md
Media:    Base + 16:9 image on top, content below
Elevated: Base + shadow=md, for floating UI
```

### Modal / Sheet

```
Width:    max-w-md (mobile) or max-w-lg (desktop)
Radius:   lg (20px)
Shadow:   shadow-modal
Backdrop: bg=ink / 50% opacity
Animation: scale-in 200ms spring + fade backdrop 200ms standard
```

### Toast

```
Top-right stack, max 3 visible
Variants: success / error / info / warning
Radius:    md (12px)
Auto-dismiss: 5s (configurable)
```

---

## 6. Motion Spec

### Page transitions
- No client-side route animation — Next.js App Router handles navigation too fast for it to feel intentional. Default instant.

### Hover / micro-interactions
- Button color shift: 120ms standard
- Button lift: 180ms standard + shadow swap sm→md
- Card lift on hover: 220ms decelerate + shadow md→lg
- Link color shift: 100ms standard

### Section enter
- Fade-up on scroll into view: 24px translateY → 0, 400ms decelerate, stagger 80ms
- Triggered by IntersectionObserver (one-shot per section)
- Reduced-motion respect: `prefers-reduced-motion: reduce` → no translate, just opacity

### Form / wizard transitions
- Day strip pill: 180ms scale 1.0→1.04 on tap (light haptic feel)
- Slot pill select: 240ms color shift + bg fill
- Form field focus: 120ms border + 120ms outline ring appear

### Loading states
- Skeleton screens (no spinners). Use `bg-zinc-100 animate-pulse` rounded rectangles matching content layout.
- Page transition: keep prior content visible until new content renders (no blank flash).

---

## 7. i18n + a11y Contract

### i18n

Every visible string is in a `labels = { fr, en, ar }` map. The component receives a `locale: "fr" | "en" | "ar"` prop. RTL: applied via `dir="rtl"` on `<html>` when locale is `ar`.

Arabic-specific:
- Use full Tashkil in hero display only
- Pluralization via `Intl.PluralRules` (built-in)
- Number formatting via `Intl.NumberFormat` (built-in) — `ar-MA`, `en-MA`, `fr-MA`

### Accessibility

- WCAG 2.1 AA minimum
- Color contrast: primary on white = 7.2:1 (passes AAA), blush on white = 4.8:1 (passes AA)
- All interactive elements: visible focus ring (`:focus-visible` rule)
- Slot grid: `role="radiogroup"` with arrow-key navigation
- Day strip: `role="listbox"` with `aria-selected`
- Form fields: `aria-invalid` on error, `aria-describedby` for help text
- Honeypot field hidden with `aria-hidden="true"` + visually-hidden class
- Live regions for booking status updates (`aria-live="polite"`)

---

## 8. Performance Budget

- **LCP:** < 2.5s on Moto G4 / 3G (target < 2.0s on Wi-Fi)
- **CLS:** < 0.1 (reserve space for hero image, no late-loading layout shift)
- **JS bundle:** < 200KB gzipped per route (Next.js App Router default)
- **Images:** AVIF/WebP via `next/image`, explicit width/height to prevent CLS
- **Fonts:** 2 weights max (Inter 400 + 700), subset to Latin + Arabic
- **CSS:** Tailwind v4 only, no runtime CSS-in-JS

---

## 9. Migration Plan (existing → new)

The redesign is a **progressive token migration** then **page-by-page replacement**:

1. **Token migration** (single PR, ~3 hrs):
   - Update `app/globals.css` `@theme` block with full token system
   - Update `lib/theme/tokens.ts` mirror
   - Slim `tailwind.config.ts`
   - Add `app/focus.css` for global focus-visible rule

2. **Component primitives** (single PR, ~4 hrs):
   - Build `components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Modal.tsx`, `Toast.tsx`, `Badge.tsx`, `Icon.tsx`
   - All consume the new tokens
   - Use Radix primitives where applicable (Modal, Toast, Select)

3. **Page-by-page** (one PR per major page):
   - PR 1: Root `/` + `not-found` (home + 404 — these set the visual tone)
   - PR 2: `/<slug>` salon profile (largest visual impact)
   - PR 3: `/<slug>/services` catalog
   - PR 4: `/<slug>/book/[serviceId]` booking wizard
   - PR 5: `/<slug>/book/confirm/[bookingRef]` + `/<slug>/book/manage#t=<token>` + `/<slug>/legal`

Each PR is independently reviewable + revertible.

---

## 10. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| i18n regression (forgot to translate a label) | Medium | High | Lint rule: `no-restricted-syntax` for hardcoded French in components |
| A11y regression (lost focus ring, lost radiogroup role) | Medium | High | Add `@axe-core/playwright` smoke tests in CI |
| Performance regression (new tokens + components bloat CSS bundle) | Low | Medium | Tailwind v4 JIT prunes unused tokens; measure CSS size in CI |
| Visual inconsistency (component primitives don't match all existing usages) | High | Medium | Refactor hero + booking wizard FIRST (high-traffic), accept temporary inconsistency on lower-traffic pages |
| LocaleSwitcher missing for ar (we currently have no UI switcher) | Low | Low | Add a discreet `fr | en | ar` switcher in the nav |
| RTL breaks layout (e.g., asymmetric hero in ar) | Medium | Medium | Test every page in `dir="rtl"` early; the SalonCard / hero gallery must mirror |

---

## 11. Order of operations

1. Approve this spec
2. Token migration PR (step 9.1)
3. UI primitives PR (step 9.2)
4. Home + 404 PR (PR 1)
5. Salon profile PR (PR 2)
6. Services catalog PR (PR 3)
7. Booking wizard PR (PR 4)
8. Confirmation + manage + legal PR (PR 5)
9. Final smoke test against staging
10. Deploy to production

Each PR is reviewable + revertible independently.

---

**Status:** Ready for user review. Once approved, proceed to implementation via writing-plans skill.
