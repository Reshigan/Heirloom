# Heirloom — Design System

## Color tokens (canonical in src/styles/globals.css)

```css
--ink: #0b0907          /* ground — primary background (dark mode) */
--ink-card: #1b1610     /* the rare raised card */
--ink-deep: #090706     /* abyss — deepest recess */
--bone: #f2e6d0         /* cream — primary text + background (light mode) */
--bone-dim: rgba(242,230,208,0.72)
--bone-faint: rgba(242,230,208,0.44)
--rule: rgba(242,230,208,0.11)
--warm: #e0a062         /* copper accent — <3% surface area */
--warm-bright: #f0c074
--warm-dim: #b07a3e
```

> Mirrored in `tailwind.config.js` (the `void`/`paper`/`gold`/`bone`/`ink`/`mark` static color names). Utility classes bypass globals.css, so both files carry the palette — change one without the other and old colors bleed into the bundle.

## Typography

- **Cormorant Garamond** — DISPLAY ONLY (≥~24px; unreadable smaller). Reaches the page only via heading tags (`.loom h1–h6`), `.loom-display`/`.loom-h2`/`.loom-serif`/`.loom-mark`, the `--serif-display`/`--font-display` tokens, and Tailwind `font-display`.
- **Spectral** — the readable workhorse: body, reading prose, inputs, values. `--serif`/`--font-body`, Tailwind `body`/`hand`/`news`/`loom-serif`. `.loom input/textarea/select` are forced to Spectral `!important` — never let Cormorant touch a form field.
- **Space Mono** — archival/labels: timestamps, counts, eyebrows (uppercase, letterspaced). `--mono`, Tailwind `v3mono`/`loom-mono`.
- **Inter** — residual UI chrome only. `--sans`, Tailwind `loom-ui`.
- **Tangerine** — the signature hand alone. `--font-hand`.

Typographic scale (approximate):
- H1 hero: clamp(2.75rem, 6vw, 4.75rem), Cormorant, weight 300–400
- H2 section: clamp(1.875rem, 4vw, 2.75rem), Cormorant
- H3 entry title: 1.625rem, Cormorant
- Body prose (reader): 1.125rem Spectral, line-height ~1.85, max measure ~60ch
- Mono label: 0.7–0.78rem Space Mono, letter-spacing 0.04–0.32em UPPER

## Motion

Single curve: `cubic-bezier(0.16,1,0.3,1)` (spring-out feel).
Durations: 180ms (micro), 360ms (standard), 720ms (ceremony), 1400ms (reveal).
`prefers-reduced-motion`: cut to instant where possible.

## Cloth system components

- `ClothCanvas3D` — WebGL woven cloth. Mounted once in `LoomShellRoot`. Never re-mount.
- `ClothBackdrop` — ambient cloth layer. Mounted once globally. Pages see it behind them.
- `ClothShell` — app chrome: 56px topbar + safe-area + content area. The standard wrapper for all authenticated pages.
- `ClothPage` — cloth-fold/page-reveal transition (360ms, perspective rotateX).
- `BottomNav` — 4-tab bottom navigation. Hidden on public/auth/admin routes.

## Dye system

10-stop natural-dye palette (`src/loom/dye.ts`). Each family member owns one dye. Usage:
- **Left-margin thread**: 3px solid left-border in member's dye. 14px padding. Authorship signal.
- **Name color**: theme-adaptive CSS tokens — `dye.ts` reads `var(--dye-*)` (no hardcoded hex), so dyes mordant per theme (e.g. dark-mode madder `#d94f38`, a lighter mordanted variant in paper/light mode).
- Dyes are signal only — no dye backgrounds, fills, or buttons.

## Spacing

No uniform spacing. Vary for rhythm:
- Section padding: 24px–48px vertical, 20px–32px horizontal
- Card/entry: 16px internal, 8px between entries
- Topbar: 56px height + env(safe-area-inset-top)
- Bottom nav clearance: 72px + env(safe-area-inset-bottom)

## Key anti-patterns

- `border-left` > 1px as colored accent: never. Use `borderLeft: '3px solid ${dyeColor}'` only for dye threads, never for callouts.
- `rounded-full` / `border-radius: 50%`: forbidden except avatar placeholder (which should be text initial, not an image circle).
- `backdrop-filter: blur()`: forbidden.
- Gradient backgrounds on content areas: forbidden.
- Progress spinners: replace with `ProgressHair` (1px hairline).
- Toasts: replace with inline status text.

## Notes

- This file is a quick-reference companion to [ART_DIRECTION.md](ART_DIRECTION.md), which is the authoritative constitution. When they disagree, verify against the live bundle (`src/styles/globals.css` + `tailwind.config.js`) — docs lag the deployed UI.
- An earlier `## Current violations` list pointed at `Echo.tsx` and fixed line numbers; those references are dead (the Echo route was deleted; line numbers drifted). Removed rather than left to mislead.
