# design-sync notes — lakshan-mobile

- This repo is an **app**, not a published package: there is no `dist/`. The converter
  runs in synth-entry mode with `--entry src/components/index.ts` (a hand-maintained
  barrel of the public component set). When adding a component to `src/components/ui/`,
  also export it from that barrel or the sync won't see it.
- Styling is **Tailwind v4** (`src/index.css` with `@theme inline` tokens mirrored from
  the web app's `app/globals.css`). The DS stylesheet is compiled by
  `cfg.buildCmd` (`@tailwindcss/cli`) from `.design-sync/ds-styles.css`, which imports
  the app tokens and safelists a generous utility vocabulary via `@source inline(...)`
  so the design agent can use common layout/typography glue classes. If the design agent
  needs a utility that's missing, extend the safelist there and re-sync.
- Fonts: system-UI stack by design (`--font-sans` defined in `src/index.css`). The web
  app uses Geist via next/font; mobile deliberately uses the platform font. No font
  files ship — expect no `[FONT_MISSING]`.
- Components are shadcn "base-nova" style on **@base-ui/react** primitives (not Radix).
  Base UI uses `render={<Comp/>}` instead of `asChild`, and `data-checked`/
  `data-unchecked` state attributes.
- `Select` is deliberately a styled **native `<select>`** (platform picker UX inside the
  Capacitor webview), not the Base UI composite Select.
- The web app (`../Web app`) is the API backend; it shares these tokens. Design changes
  should stay visually compatible with both.
- Base UI menus: `DropdownMenuLabel` (Menu.GroupLabel) must be nested inside a
  `DropdownMenuGroup` or the preview throws "MenuGroupContext is missing".

## Re-sync risks

- `cfg.cssEntry` points into the gitignored `.design-sync/.cache/` — on a fresh clone
  (or whenever tokens/safelist/previews change), run `cfg.buildCmd` BEFORE the
  converter or the build fails / ships stale CSS.
- The `@source inline(...)` safelist in `.design-sync/ds-styles.css` is the design
  agent's entire layout-utility vocabulary. Arbitrary values (`w-[13px]`) are not
  compiled; previews and designs must stay on safelisted families, or extend the
  safelist and recompile.
- `src/components/index.ts` (the barrel) and `cfg.componentSrcMap` must both be
  updated when a component is added — the barrel feeds the bundle, the map feeds
  card discovery. A component missing from either silently doesn't sync.
- Fonts are the system stack by design. If the app ever adopts a brand font
  (e.g. Geist to match web), wire it via `cfg.extraFonts` or expect `[FONT_MISSING]`.
- All 18 previews were graded good on 2026-07-05; grades carry forward via the
  uploaded `_ds_sync.json`.

## Known render warns

- `[RENDER_THIN]` on **Dialog** and **Sheet**: DOM height measures 0px because their
  content renders through a portal with fixed positioning. Screenshots confirmed fully
  rendered (register-student dialog / right-side menu sheet). Benign.
