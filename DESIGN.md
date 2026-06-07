# Heirloom — Design System

## Color tokens (canonical in src/styles/globals.css)

```css
--ink: #0e0e0c          /* primary background (dark mode) */
--bone: #f4ecd8         /* primary text + background (light mode) */
--bone-dim: rgba(244,236,216,0.55)
--bone-faint: rgba(244,236,216,0.32)
--rule: rgba(244,236,216,0.08)
--warm: #b07a4a         /* sealing-wax accent — <3% surface area */
--warm-bright: #cf935a
--warm-dim: #8c5a30
```

## Typography

- **Source Serif 4** (variable, opsz): display headings + body prose. `hl-h1` through `hl-h4`, `hl-body`, `hl-serif`.
- **Inter**: UI chrome — topbar labels, button text, form inputs. `hl-ui`.
- **JetBrains Mono**: archival metadata — timestamps, entry counts, IDs. `hl-mono`.

Typographic scale (approximate):
- `hl-h1`: clamp(2.25rem, 5vw, 3.5rem) / opsz 72
- `hl-h2`: clamp(1.5rem, 3.5vw, 2.25rem) / opsz 48
- `hl-h3`: 1.25rem / opsz 24
- `hl-body`: 1rem (16px), line-height 1.6, max-width 65ch
- `hl-mono`: 0.75rem (12px), letter-spacing 0.04em

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
- **Name color**: DYE_TEXT lightened variants (e.g. madder → #d97860).
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

## Current violations (from UX_AUDIT.md, fix in priority order)

1. `Echo.tsx:96` — 400ms transition (spec: 360ms). One-line fix.
2. `globals.css:120` — `--cloth-scrim` radial gradient. Replace with flat rgba.
3. `Record.tsx:282–334` — concentric breathing circles. Rebuild to cloth/type system.
4. `globals.css:1254` — `.loom-horizon` atmospheric elliptical glow. Replace with flat.
5. ~40 authenticated pages missing ClothShell wrapping.
