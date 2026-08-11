# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/kallar-central-sports-club/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Kallar Central Sports Club (KCSC)
**Generated:** 2026-08-11 · curated from `ui-ux-pro-max --design-system --variance 4 --density 8`
**Category:** Sports Team/Club × Educational App (admin/management facing)
**Design Dials:** Variance 4/10 (Balanced / Modern) | Density 8/10 (Dense / Dashboard)

**Stacks:** Web app = Next.js 16 + Tailwind v4 + shadcn/Base UI · Mobile app = React (Vite) + Capacitor + the same Tailwind v4/shadcn setup. One shared design system serves both, but the two token files are **duplicated, not imported** — see "Sync obligation" at the bottom.

> **Curation note.** The database matched this project to a generic *Sports Team/Club* profile:
> team red `#DC2626` + championship gold, with the *Dashboard Data* (Fira Code/Fira Sans) pairing.
> Both were overridden:
> 1. **Color** — KCSC has a real crest, and it is not bright red. The maroon was sampled directly
>    from the club logo (`#720000`, the dominant non-white pixel). Bright red would have been
>    off-brand *and* would have collided with `--destructive`.
> 2. **Type** — Fira Code as a heading face is wrong for a club with a laurel-wreath crest. The
>    *Sports/Fitness* pairing (Barlow Condensed + Barlow) was taken from the same database instead:
>    athletic and heritage-appropriate for headings, and Barlow is a genuinely good table/body face
>    for dense admin data, which is what the density dial actually asked for.
>
> The club runs **free** tuition classes. There is no fee, invoice, or payment surface anywhere in
> this product — do not reintroduce one.

---

## Global Rules

### Color Palette

Maroon is the brand and structural color. Gold is the **accent** — highlights, active states, stat
emphasis, crest framing. Gold is never a large background fill and never small body text.

| Role | Hex | OKLCH | CSS Variable |
|------|-----|-------|--------------|
| Primary (brand maroon) | `#720000` | `oklch(0.347 0.142 29.2)` | `--primary` |
| On Primary | `#FFF9F5` | — | `--primary-foreground` |
| Primary hover | `#8A1216` | `oklch(0.408 0.153 26.3)` | — |
| Gold (accent) | `#B8860B` | `oklch(0.652 0.132 81.6)` | `--gold` |
| Gold bright (on maroon) | `#E3B341` | `oklch(0.790 0.139 85.2)` | `--gold-bright` |
| Gold tint (surface) | `#FBF1DC` | `oklch(0.960 0.030 85.6)` | `--accent` |
| Background | `#FDF8F6` | `oklch(0.982 0.006 43.3)` | `--background` |
| Foreground | `#3A1214` | `oklch(0.248 0.064 20.0)` | `--foreground` |
| Card | `#FFFFFF` | `oklch(1 0 0)` | `--card` |
| Secondary | `#F9EBE9` | `oklch(0.951 0.015 27.3)` | `--secondary` |
| Muted | `#F5EDE9` | `oklch(0.951 0.010 48.6)` | `--muted` |
| Muted foreground | `#7C6560` | `oklch(0.528 0.031 32.4)` | `--muted-foreground` |
| Border | `#EBDCD6` | `oklch(0.905 0.018 43.2)` | `--border` |
| Input | `#DFCCC5` | `oklch(0.859 0.023 41.4)` | `--input` |
| Ring | `#720000` | `oklch(0.347 0.142 29.2)` | `--ring` |
| Sidebar (maroon slab) | `#5C0709` | `oklch(0.304 0.116 26.8)` | `--sidebar` |

**Status colors** — deliberately kept away from the maroon hue so they never read as "brand":

| Status | Hex | OKLCH | Usage |
|--------|-----|-------|-------|
| Present / Success | `#15803D` | `oklch(0.527 0.137 150.1)` | Attendance present, pass marks, success toasts |
| Warning | `#B45309` | `oklch(0.555 0.146 49.0)` | Low attendance, borderline marks |
| Absent / Destructive | `#D92D20` | `oklch(0.576 0.209 29.5)` | Absent, delete actions |

> `--destructive` `#D92D20` sits at hue 29.5 — the *same hue family as the maroon primary*, separated
> only by lightness and chroma. Never rely on hue alone to distinguish a delete button from a brand
> button: destructive actions must also carry a label or a Lucide icon.

**Verified contrast** (computed, not assumed):

| Pair | Ratio | Verdict |
|------|-------|---------|
| White on brand maroon | 12.24:1 | AAA |
| Foreground on background | 15.62:1 | AAA |
| Muted foreground on background | 5.13:1 | AA |
| Gold `#B8860B` on white | 3.25:1 | **UI/large text only — never body copy** |
| Gold bright on sidebar maroon | 7.24:1 | AAA |
| Dark-mode foreground on dark bg | 16.15:1 | AAA |
| Gold bright on dark bg | 9.83:1 | AAA |

**Dark mode.** Brand maroon `#720000` on the dark background scores **1.56:1** — unusable. Dark mode
therefore promotes **gold** to the primary action color (it is the club's second brand color, so this
is a brand-consistent swap, not a fallback) and keeps maroon for surfaces and the sidebar slab.

| Role | Hex |
|------|-----|
| Background | `#180C0D` |
| Card | `#241416` |
| Foreground | `#F6E9E6` |
| Primary | `#E3B341` (gold) |
| On Primary | `#2A1214` |
| Border | `rgba(255,255,255,0.12)` |

### Typography

- **Heading Font:** Barlow Condensed (600/700) — athletic, crest-appropriate, compact enough for a dense dashboard
- **Body Font:** Barlow (400/500/600/700) — same superfamily, excellent in data tables
- **Mood:** athletic, disciplined, heritage, credible
- **Pairing source:** `ui-ux-pro-max --domain typography` → "Sports/Fitness"

**Web app** loads these via `next/font/google` (self-hosted, no external request).
**Mobile app** bundles `@fontsource/barlow` + `@fontsource/barlow-condensed` — Capacitor's WebView must
work fully offline, so no Google Fonts URL is used in either app despite the DB emitting one.

Both resolve to the same variables: `--font-sans` (Barlow), `--font-heading` (Barlow Condensed).

Headings are `font-heading font-bold tracking-tight`. Because Barlow Condensed is narrow, page titles
may go one step larger than they would in a normal-width face without crowding.

### Spacing Variables

*Density: 8/10 — Dense / Dashboard. This is an operations console; screens are read, not browsed.*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `2px` | Tight gaps |
| `--space-sm` | `4px` | Icon gaps, inline spacing |
| `--space-md` | `8px` | Standard padding |
| `--space-lg` | `12px` | Section padding |
| `--space-xl` | `16px` | Large gaps |
| `--space-2xl` | `24px` | Section margins |
| `--space-3xl` | `32px` | Page header padding |

### Radius & Shadow

`--radius: 0.625rem`. Slightly tighter than a consumer app — this is a records system, and the crest
is an angular, formal mark. Shadows follow "Soft UI Evolution": present but restrained.

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(58,18,20,0.06)` | Inputs, subtle lift |
| `--shadow-md` | `0 4px 10px rgba(58,18,20,0.08)` | Cards |
| `--shadow-lg` | `0 12px 24px rgba(58,18,20,0.10)` | Dialogs, dropdowns |

Shadows are tinted with the foreground maroon-brown, not neutral black — on a warm background, pure
black shadows read as dirty gray.

---

## Layout Rules

### Web admin shell

- **Maroon sidebar slab**, full height, gold active indicator. This is the single strongest carrier of
  the brand — the content area stays near-white so data remains legible.
- Sidebar active item: gold left border + gold text, not a filled gold block (a filled gold block at
  sidebar width is too much accent area).
- Content area max width: none (tables need the room). Page padding `24px` desktop, `16px` mobile.
- Every admin page opens with a page header: condensed title + one-line description + primary action
  aligned right.

### Mobile app

- Bottom navigation, **max 5 items** (`ux` rule `bottom-nav-limit`). KCSC's five: Dashboard, Students,
  Classes, Scanner, Marks.
- Scanner is the primary daily task — it gets the visually dominant nav slot.
- Respect safe areas (`env(safe-area-inset-*)`) — the maroon header must extend *under* the status bar
  while its content stays below it.
- Touch targets ≥ 44×44px with ≥ 8px separation.

---

## Component Specs

### Buttons

```css
.btn-primary {
  background: var(--primary);        /* maroon */
  color: var(--primary-foreground);
  border-radius: var(--radius);
  font-weight: 600;
  transition: background 200ms ease, box-shadow 200ms ease;
  cursor: pointer;
}
.btn-primary:hover { background: #8A1216; }
.btn-primary:focus-visible { outline: none; box-shadow: 0 0 0 3px rgb(114 0 0 / 0.5); }

/* Gold is for emphasis, not for the default action. Use it for a single hero CTA per screen. */
.btn-gold {
  background: var(--gold);
  color: #2A1214;                    /* dark text on gold — white would fail contrast */
  font-weight: 600;
}
```

### Cards

Cards are **white on the warm background** — separation comes from the background tint plus a hairline
border, not from a heavy shadow.

```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
```

Stat cards carry a gold top accent rule (`2px`) to tie the dashboard to the crest.

### Data tables

Dense rows (`py-2.5`), maroon-tinted header row (`--secondary`), hairline `--border` dividers,
row hover `--muted`. Numeric columns right-aligned and tabular-figured.

### Charts (marks analysis)

Series order: maroon `#720000` → gold `#B8860B` → green `#15803D` → slate `#475569` → terracotta `#C2410C`.
Never encode pass/fail by color alone — pair with a label or icon (`chart` + `ux` accessibility rules).

---

## Style Guidelines

**Style:** Soft UI Evolution — improved shadows (softer than flat, clearer than neumorphism),
200–300ms transitions, always-visible focus, WCAG AA/AAA.

**Best For:** Modern business tools, professional admin panels — which is exactly what this is.

---

## Anti-Patterns (Do NOT Use)

- ❌ **Any fee / payment / invoice UI** — the club teaches for free. This product has no money surface.
- ❌ **Bright red `#DC2626` as a brand color** — that is `--destructive`'s neighborhood; the brand is `#720000`.
- ❌ **Gold as body text or as a large background fill** — 3.25:1 on white. Accent only.
- ❌ **Emojis as icons** — Lucide only, consistently.
- ❌ **Color-only status** — attendance and pass/fail always carry a label or icon too.
- ❌ **Missing `cursor-pointer`** on clickable elements.
- ❌ **Instant state changes** — transitions 150–300ms.
- ❌ **Invisible focus states.**

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (Lucide throughout)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with 150–300ms transitions
- [ ] Text contrast ≥ 4.5:1 (gold restricted to UI/large text)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile; tables scroll inside their own container
- [ ] Mobile: safe-area insets respected, touch targets ≥ 44px
- [ ] Dark mode checked — remember primary becomes gold there

---

## Sync obligation

`Web app/app/globals.css` and `Mobile app/src/index.css` are **independent copies** of these tokens.
There is no shared package. Any change to brand color, radius, spacing, or font must be applied to
**both files in the same commit**, or the two apps drift.
