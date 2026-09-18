# ReserNova Web — Enterprise-Grade UI/UX Redesign — Design Spec

**Date:** 2026-09-18
**Visual direction:** B + Direction-A Maghreb accent (calibrated)
**Status:** Revised with research findings (Linear / Stripe / Cal.com / Figma / Notion / Beehiiv audit)
**Author:** Claude (architect mode)

---

## 1. Context & Goals

### Why
The current web app at `book.resernova.com/<slug>` is functional but reads as templated. The Fresha-inspired redesign that shipped 2 days ago solved UX flows but not the visual identity — user feedback confirmed.

The original "Direction B — Modern Editorial (GlossGenius-inspired)" approved token system was correct in philosophy but underspecified in execution. This revision adds:
- **Concrete execution tokens** drawn from Linear / Stripe / Cal.com / Figma / Notion / Beehiiv audit
- **Anti-patterns explicitly rejected** (3-column feature grid, gradient mesh, carousel, bold display weight)
- **Moroccan typographic signature** as a quiet hero accent (Tajawal/Cairo at weight 400 — the one thing that distinguishes ReserNova from every global competitor)
- **Cal.com-style embedded live preview card** as the hero CTA
- **Linear-style restraint everywhere else** (medium display weight, single restrained accent used <5%)

### Goals (concrete + measurable)
- Pixel-perfect spacing & typography (no "templated" feeling)
- Editorial gravitas via restraint, not decoration
- Distinctive without being orientalist (no arches, no zellige kitsch)
- Performance: LCP < 2.5s mobile, CLS < 0.1
- Accessibility: WCAG 2.1 AA minimum
- Bilingual hero: French headline + subtle Arabic poetic line beneath

### Constraints (unchanged from prior spec)
- No breaking changes to data model
- i18n preserved — every label in fr/en/ar
- A11y: WCAG 2.1 AA
- Vercel deployment unchanged — no new env vars
- All 14 routes still working

---

## 2. Design Tokens (REVISED — calibrated against research)

### 2.1 Color palette (Linear-style monochrome + single restrained accent)

**Light theme:**
```
Canvas:        #FFFFFF            (page surface)
Surface:      #FAFAFA            (elevated panels, "paper" tone)
Card:         #FFFFFF            (with 1px hairline border)
Border:       rgba(10,10,10,0.08) (warm hairline)
Ink:           #08090A            (primary text — warm near-black)
Ink muted:     #6B7280            (secondary text)
Ink soft:      #9CA3AF            (tertiary)
Ink inverse:   #FFFFFF            (on dark)

Accent:        #0F766E            (deep teal — used <5% of canvas)
Accent dim:    #0B5F58            (hover, pressed)
Success:      #1F8A4F            (confirmation)
Error:        #B91C1C            (errors only)
Warning:      #B45309            (warnings only)

Magazine accents (used sparingly):
Blush soft:   #FAEBE7            (hero card backgrounds only)
Gold warm:    #D4B860            (logo-04 "N" accent — gold flourishes)
```

**Dark theme (mirror):**
```
Canvas:        #08090A
Surface:      #0F1011
Border:       rgba(255,255,255,0.08)
Ink:           #F7F8F8
Ink muted:     #9CA3AF
Accent:        #5EEAD4            (teal-mint for dark backgrounds)
```

**Rationale:** Linear's #08090A is the warm-near-black that reads "premium ink" without being cold. Stripe's off-white #FAFAFA creates the magazine-paper feel. The single deep-teal accent #0F766E (used <5%) echoes ReserNova's existing brand teal while shifting it toward a more sophisticated, less saturated hue. No blush at full saturation — that's GlossGenius-clone territory.

### 2.2 Typography (REVISED — Linear's medium weight signature)

**Display (hero, page h1, large features):**
- **Inter** variable font, weight **500 (medium)** — NOT 700+
- This is the signature Linear/Stripe/Beehiiv move. Bold weight at 56–80px reads as "shouting" and lowers perceived sophistication. Medium weight holds presence without aggression.
- Sizes: 56 / 64 / 72 / 80 / 96 (desktop), 36 / 40 / 48 / 56 (mobile)
- Line height: 1.05–1.1 (tight on display)
- Letter spacing: -0.02em (tight)

**Subheadings / H2 / H3:**
- Inter variable, weight 600 (semibold)
- Sizes: 24 / 20 / 18 / 16 (desktop)
- Line height: 1.25–1.4

**Body:**
- Inter variable, weight 400 / 500 / 600
- Size: **18 (large — Figma standard)** / 16 (default) / 14 (small) / 13 (caption)
- Line height: 1.55–1.65 (Figma standard)

**Arabic display accent (NEW — the distinguishing move):**
- **Tajawal** or **Cairo** at weight 400 (NOT bold), used in:
  - The single poetic Arabic line beneath the French hero headline
  - Marketing page eyebrow labels (NOT body)
- Sets up a subtle "we are Moroccan" identity marker that no global competitor imitates

**Monospace step indicators (NEW — Cal.com move):**
- **JetBrains Mono** or **IBM Plex Mono** weight 500
- Used for step numbers in the booking wizard ("01", "02", "03", "04")
- Cal.com's signature move; reads as "this is a serious engineering-grade product"

**Hierarchy summary:**
```
display:    Inter 500    56-96px (tight 1.05-1.1)
h2:         Inter 600    24-32px
h3:         Inter 600    18-22px
body-lg:    Inter 400    18px / 1.55
body:       Inter 400    16px / 1.55
body-sm:    Inter 400    14px / 1.5
caption:    Inter 500    13px / 1.4
eyebrow:    Inter 600    12px / 1.0 / tracking 0.08em / uppercase
arabic-poem: Tajawal 400 18-24px (hero only)
mono-step:  JetBrains 500 14px (booking wizard only)
```

### 2.3 Spacing (Figma-style 8pt scale)

```
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 192

Section vertical padding:
  desktop: 128px (was 120)
  mobile:  64px

Container max-width: 1280px
  Gutter: 24px desktop / 16px mobile

Card padding: 32px desktop / 24px mobile
Button padding (md): 16px H × 12px V
Button padding (lg): 24px H × 16px V

Inter-card gap: 16px (Figma standard, was 24 — too generous)
Inter-section gap: 96px (Figma standard)
```

### 2.4 Radius (Notion-style — REVISED, was Fresha-pill style)

```
Global default: 8px (Notion signature — was 9999px pill, which screams "Fresha clone")
Inputs:         8px
Buttons:        8px (NOT pills; this is the Linear/Stripe move)
Cards:          12px
Modals:         16px
Image:          12px (NOT rounded — sharp 4px corners for product photography)
Avatars:        9999px (this is the ONLY place to use full radius)
```

**Rationale:** The previous spec kept Fresha's pill buttons (9999px). Linear/Stripe/Cal.com/Notion/Beehiiv all use 8-12px sharp corners — they read as "professional product" not "boutique booking widget". This is the single biggest visual differentiator from Fresha/Mindbody/Boulevard.

### 2.5 Motion (Linear + Figma standard — REVISED)

**Curves:**
- `standard:    cubic-bezier(0.4, 0, 0.2, 1)` — Material standard ease-out (Linear/Figma/Notion all use this)
- `decelerate:  cubic-bezier(0, 0, 0.2, 1)` — entrances
- `accelerate:  cubic-bezier(0.4, 0, 1, 1)` — exits

**Durations:**
```
instant: 0ms
fast:    150ms       (hover, color shifts)
base:    200ms       (button press, default UI)
slow:    320ms       (modals open/close, drawer slide)
slower:  480ms       (page transitions — rarely used)
```

**REJECT:** spring/bounce easing (Linear/Stripe/Cal.com don't use it — feels playful). REJECT: 500ms+ durations (feels slow for product UI).

**Hover:** `translateY(-1px) + shadow swap sm→md, 180ms standard`. NEVER scale.

**Section enter:** `opacity 0→1 + translateY(24px → 0), 400ms decelerate, stagger 60ms`. Triggered by IntersectionObserver. Reduced-motion: skip translate, just opacity.

**Page transitions:** No client-side route animation. Next.js App Router is too fast for it to feel intentional. Default instant.

### 2.6 Elevation (7 levels tied to z-index)

```
z-base(0), z-raised(10), z-floating(20), z-sticky(30), z-overlay(40), z-modal(50), z-popover(60)

Tokens (each = y-offset + blur + alpha, NOT raw rgba strings):
  shadow-none:    none
  shadow-xs:       0 1px 2px rgba(8,9,10,0.06)
  shadow-sm:       0 1px 3px rgba(8,9,10,0.08), 0 1px 2px rgba(8,9,10,0.04)
  shadow-md:       0 4px 12px rgba(8,9,10,0.08), 0 2px 4px rgba(8,9,10,0.04)
  shadow-lg:       0 12px 32px rgba(8,9,10,0.10), 0 4px 8px rgba(8,9,10,0.04)
  shadow-xl:       0 24px 48px rgba(8,9,10,0.12)
  shadow-overlay:  0 24px 64px rgba(8,9,10,0.16), 0 0 0 1px rgba(8,9,10,0.08)
  shadow-modal:    shadow-overlay + 8px hairline border
  shadow-inset:    inset 0 1px 0 0 rgba(255,255,255,0.06)
```

### 2.7 Focus ring (NEW — a11y gap fix)

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: inherit;
}

/* WCAG 2.4.11 compliant: focus not obscured */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 2.8 Z-index scale (Figma convention)

```
z-base(0), z-dropdown(100), z-sticky(200), z-fixed(300),
z-modal-backdrop(400), z-modal(500), z-popover(600), z-toast(700), z-tooltip(800)
```

---

## 3. Anti-Patterns to ACTIVELY Reject (from research)

Per the research audit, these dated moves must be avoided:

| Anti-pattern | Why amateur | Replacement |
|---|---|---|
| **3-column feature grid with icons** | Screams "2018 SaaS template" | Linear-style product-as-hero + 3 stacked captions, OR Cal.com-style embedded live preview |
| **Stock photos of "diverse businesspeople pointing at screens"** | Signals "we have no real product imagery" | Real product screenshots in 12px-rounded cards with subtle shadow |
| **Carousels / sliders with auto-rotate** | WCAG violation (vestibular issues); avg <1% engagement on slide 2+ | Single hero; tabs if you have multiple items |
| **Hero with 5 CTAs** | Decision paralysis | ONE primary + ONE secondary CTA maximum |
| **Gradient mesh backgrounds / glassmorphism cards** | Peak 2022 trend, now reads as "trying to look modern" | Solid #FAFAFA background with 1px hairlines |
| **Bold (700+) hero headlines** | Reads as "shouting" at large sizes | Medium (500) display weight — Linear/Stripe/Beehiiv all do this |
| **Hamburger menu on desktop** | Hides navigation from B2B buyers | Desktop nav shows all 4–6 top-level items inline |
| **Hero with 3 stacked images + emoji + "🚀 Nouveau" badges** | 2018 startup cliche | Editorial hero with single product screenshot + eyebrow label |

---

## 4. Page-by-page Vision (REVISED with concrete patterns)

### 4.1 Root `/` (home / marketing)

**Pattern:** Linear + Cal.com hybrid
**Layout:** 7-col copy + 5-col embedded booking preview (Cal.com's signature move). The preview is a LIVE ReserNova booking card — let prospects use the product before signing up.

**Hero elements:**
- Eyebrow label (12px, uppercase, tracking 0.08em, accent color): "RÉSERVATION EN LIGNE POUR SALONS"
- Display H1 (Inter 500, 72px desktop / 40px mobile, line-height 1.05): "Vos clients réservent en 30 secondes." (fr) / "حجز المواعيد أصبح أسهل" (Arabic poetic line beneath, weight 400)
- Subtitle (Inter 400, 18px, line-height 1.55, ink-muted): "ReserNova centralise vos rendez-vous, vos paiements et votre équipe — sur une plateforme moderne pensée pour le marché marocain."
- Single CTA cluster:
  - Primary: "Démarrer maintenant" (filled dark accent)
  - Secondary: "Voir une démo live" (ghost with arrow)
- Right side: Embedded live booking preview card showing service "Coupe + Brushing 30 min · 150 DH" with date strip + slot pills + "Réserver" CTA — all interactive (lets the visitor play)

**Below hero:** Alternating two-column rows for benefits (text-left/media-right). Figma's pattern. Three benefit rows max:
1. "Réservation 24/7" (with salon dashboard mockup screenshot)
2. "Paiements & rappels automatisés" (with WhatsApp message mockup)
3. "Synchronisation agenda en temps réel" (with calendar view mockup)

**Trust strip (slim, single-row):**
- 12 grayscale salon logos in marquee scroll (Figma pattern). Auto-scroll at 30s/loop. Pause on hover.
- Below: 3 quantified stats inline: "23% plus de réservations récurrentes / 75% de réduction des no-shows / 40h économisées par mois"

**How it works (Cal.com pattern):**
- 3 equal columns with monospace step labels above short headings
- 01 — "Vos clients réservent"
- 02 — "Vous êtes notifié"
- 03 — "Vous gagnez du temps"

**Footer (Beehiiv-style):**
- Single-row, sparse, ink-muted
- 3 columns: product / company / legal
- Logo + tagline on the left

### 4.2 `/<slug>` (salon profile)

**Pattern:** Stripe-style editorial density
**Layout:** Magazine-spread, single long-scroll. Hairline rules between sections.

**Hero elements:**
- 60/40 image split (large left + 2 stacked thumbnails right)
- Below images: editorial text block (centered, narrow)
- Eyebrow (Tajawal 400 if ar, Inter 600 if fr): category name (e.g., "SALON & BIEN-ÊTRE" or "صالون وعناية")
- Display H1 (Inter 500, 56–64px desktop / 36–40px mobile): business name
- Sub-headline (Inter 400, 18px): description
- Open-status dot (small, left of "Réserver" CTA)
- Single CTA: "Réserver" (filled accent) + secondary "Appeler" (ghost)

**Below hero:** Services preview as a VERTICAL LIST (3 rows max), then "Voir tous les services →" link.

**About section:** Long-form copy with images in 12px-rounded cards. Section heading uses eyebrow + h2.

**Hours + Location:** Two-column block. Hours as a table with day rows. Location as text + optional map embed.

### 4.3 `/<slug>/services` (catalog)

**Pattern:** Linear + Notion
**Layout:** Vertical list, alternating subtle backgrounds (every other row has very slight blush-tint `#FAEBE7`).

**Per-row layout:**
- 80×80 thumbnail | name + duration | price + inline "Réserver →" link
- 8px radius (Notion-style) on thumbnail + row
- Hover: subtle blush background + "Réserver →" shifts to accent color
- Tap target: entire row, not just link

### 4.4 `/<slug>/book/[serviceId]` (booking wizard)

**Pattern:** Cal.com embedded booking + Linear restraint

**Layout:** Single-page split (35% sticky sidebar + 65% main column)

**Sidebar (sticky):**
- Service summary card (12px radius, NOT pill)
- Staff selector ("Tout professionnel" default, dropdown)
- Live total (appears when slot is selected)
- Gold accent line under "Votre réservation"

**Main column — three sections (no stepper indicator — Cal.com move):**

1. **Date & heure**
   - Day strip (14 days visible, prev/next chevrons, **monospace step numbers** for week labels)
   - SlotGrid below (3-col pills, 8px radius, three visual states: available / disabled / "almost-full" with amber border)

2. **Vos informations**
   - Name + phone + email fields (Inter, 8px radius inputs)
   - WhatsApp opt-in checkbox (small, secondary)
   - Special requests textarea (expanded by default, not hidden behind a toggle)
   - Honeypot (hidden via Tailwind `sr-only`)
   - Min-time-on-page gate (3s) before submit enables

3. **Confirmer**
   - Single full-width CTA: "Confirmer la réservation" (filled accent, hover lift -1px)
   - Below CTA: "Retour au salon" link (text + arrow, ink-muted)

### 4.5 `/<slug>/book/confirm/<bookingRef>` (post-book)

**Pattern:** Linear success-state

**Layout:** Centered single column

**Elements:**
- Large monogram logo (logo-02) at top
- Display H1 (Inter 500, 48px): "Réservation confirmée !" / "تم تأكيد الحجز"
- Reference number in monospace, large, accent color
- Booking summary card (12px radius, hairline border, 8px shadow-sm)
- 3 horizontal CTAs (single row desktop, stacked mobile):
  - Primary: "Ajouter au calendrier" (filled accent)
  - Secondary: "Envoyer sur WhatsApp" (filled WhatsApp-green)
  - Tertiary: "Retour au salon" (ghost)

### 4.6 `/<slug>/book/manage#t=<token>` (manage)

**Layout:** Card-based, similar to confirmation

### 4.7 `/<slug>/legal` (privacy + terms)

**Pattern:** Stripe Docs editorial

**Layout:** Long-form prose, max-width 65ch
- H1 + H2 + H3 hierarchy
- Bilingual legal preamble (French + Arabic)
- Bordered callout for "right to erasure" (CNDP / Loi 09-08)

### 4.8 Not-found page

**Pattern:** Linear 404
**Layout:** Editorial with monogram + "404" + bilingual copy + 2 CTAs

---

## 5. Component Library Spec

### Buttons (Linear + Stripe pattern — 8px radius, NOT pills)

```css
/* Primary CTA = filled accent (deep teal #0F766E) */
.btn-primary {
  bg: var(--color-accent);
  color: var(--color-ink-inverse);
  border: none;
  padding: 16px 24px;       /* md */
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  hover: bg = var(--color-accent-dim); translateY(-1px);
  transition: 180ms standard;
}

/* Secondary CTA = ghost (transparent + hairline border) */
.btn-secondary {
  bg: transparent;
  color: var(--color-ink);
  border: 1px solid var(--color-border);
  ...
}

/* Tertiary CTA = text only (with arrow glyph) */
.btn-tertiary {
  bg: transparent;
  color: var(--color-accent);
  border: none;
  text-decoration: none;
  ...
}
```

**Sizes:** xs / sm / md (default) / lg — all share same border-radius and motion.

### Inputs (8px radius, hairline border)

```
Default:    bg=white, border=border-color, radius=8px, focus=accent + 2px ring
Error:      border=error + error-bg ring
Disabled:   bg=surface, text=ink-soft
Search:     same as default with leading icon
```

### Cards (12px radius, 1px hairline)

```
Base:       bg=white, radius=12px, border=rgba(0,0,0,0.06), shadow-sm on hover
Media:      Base + 16:9 image, 12px radius
Elevated:   Base + shadow-md
```

### Modal / Sheet (16px radius)

```
Width:    max-w-md (mobile) or max-w-lg (desktop)
Radius:   16px
Shadow:   shadow-overlay
Animation: scale-in 200ms decelerate
Backdrop: rgba(8,9,10,0.5)
```

### Toast

```
Top-right stack, max 3 visible
Variants: success / error / info / warning
Radius:    8px
Auto-dismiss: 5s
```

---

## 6. Motion Spec

### Page transitions
- No client-side route animation. Next.js App Router is too fast.

### Hover micro-interactions
- Button color shift: 150ms standard
- Button lift: 180ms standard + 1px translateY + shadow-sm→md swap
- Link color shift: 100ms standard
- Card hover: 220ms decelerate + 1px translateY + shadow swap

### Section enter (scroll-in fade-up)
- opacity 0→1 + translateY(24px → 0), 400ms decelerate, stagger 60ms
- Triggered by IntersectionObserver (one-shot per section)
- Reduced-motion: skip translate, just opacity

### Form interactions
- Field focus: 120ms border + outline ring appear
- Day-strip pill select: 180ms scale 1.0→1.04 + accent fill (subtle haptic feel)
- Slot pill select: 240ms color shift + bg fill

### Loading states
- Skeleton screens (no spinners). `bg-zinc-100 animate-pulse` rounded rectangles matching content layout.
- Page transition: keep prior content visible until new content renders.

---

## 7. i18n + a11y Contract

### i18n
- Every visible string in `labels = { fr, en, ar }` map
- Component receives `locale: "fr" | "en" | "ar"` prop
- RTL: applied via `dir="rtl"` on `<html>` when locale is `ar`
- Arabic hero: Tajawal 400, 18-24px, weight light, subtle decorative
- Pluralization via `Intl.PluralRules` (built-in)
- Number formatting via `Intl.NumberFormat` (built-in)

### Accessibility (WCAG 2.1 AA)
- Color contrast: ink-on-canvas = 16:1 (AAA); accent-on-canvas = 4.9:1 (AA)
- Focus visible: 2px accent ring with 2px offset (universal)
- Slot grid: `role="radiogroup"` with arrow-key navigation
- Day strip: `role="listbox"` with `aria-selected`
- Form fields: `aria-invalid` on error, `aria-describedby` for help text
- Honeypot hidden with `aria-hidden="true"`
- Live regions for booking status updates (`aria-live="polite"`)
- prefers-reduced-motion respected

---

## 8. Performance Budget

- LCP: < 2.5s on Moto G4 / 3G
- CLS: < 0.1 (reserve image dimensions)
- JS bundle: < 200KB gzipped per route
- Images: AVIF/WebP via `next/image`, explicit width/height
- Fonts: 3 weights max (Inter 400 + 500 + 600), subset to Latin + Arabic
- CSS: Tailwind v4 only, no runtime CSS-in-JS

---

## 9. Migration Plan (REVISED — 8 PRs, each independently reviewable + revertible)

| # | PR | Scope | Files |
|---|---|---|---|
| 1 | Token migration | Full `@theme` block in globals.css + tokens.ts mirror + slim tailwind.config + focus.css | 4 files |
| 2 | UI primitives | Button, Card, Input, Modal, Toast, Badge — all consume new tokens | ~7 new files |
| 3 | Marketing site (root + not-found) | Sets visual tone for the rest | 2 files |
| 4 | Salon profile (`/<slug>`) | Largest visual impact | 4 files |
| 5 | Services catalog (`/<slug>/services`) | Vertical list polish | 2 files |
| 6 | Booking wizard (`/<slug>/book/[serviceId]`) | Most complex page | 3 files |
| 7 | Confirmation + manage + legal | Polish + editorial density | 3 files |
| 8 | Visual QA pass + polish | Catch anything missed | various |

---

## 10. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bold-display regression (reflex to 700+ for hero) | High | Medium | ESLint rule + code review checklist |
| Fresha-clone trap (rounded pills everywhere) | High | High | Visual QA: every new component passes the "Would Linear ship this?" test |
| Orientalist cliche (lantern icons, mint tea) | Medium | High | Blocklist in PR review; spec explicitly forbids literalism |
| i18n regression | Medium | High | Lint rule + RTL snapshot tests |
| A11y regression | Medium | High | axe-core smoke tests in CI |
| Arabic hero poetic line is awkward literal translation | Medium | Low | Native Arabic review before final deployment |

---

## 11. The One Distinguishing Move (restated)

What separates ReserNova from every competitor:

**Editorial restraint (Linear-grade) + a single Maghreb typographic signature (Tajawal/Cairo at 400 in the hero only).**

Every global competitor executes editorial premium. None of them speak North Africa without going literalist. We use editorial restraint everywhere — Inter, medium weight, monochrome, single accent used <5%, generous spacing. And we add ONE quiet move: a single Tajawal/Cairo line beneath the French hero headline. That's it. No arches, no zellige patterns, no desert photography. Just a typographic signature that says "we are Moroccan" without performing it.

---

## 12. Order of operations

1. Approve this revised spec
2. PR 1: Token migration
3. PR 2: UI primitives
4. PRs 3-7: Page-by-page redesign
5. PR 8: Visual QA
6. Final smoke test against staging
7. Deploy to production

**Status:** Revised spec ready for user approval.
