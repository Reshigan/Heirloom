# Premium Page Rubric — room-interior standardization

You are aligning Heirloom "room interior" pages to the shared layout/type token system so
every page sits at the same premium bar (consistent contrast, type scale, padding, web + PWA).
This is **alignment, not redesign**. Do NOT change page logic, data flow, routes, copy, or
component structure. Only normalize the **outer page container**, **header block**, **type
classes**, and **color tokens** to the canon below.

## Canon (defined in src/styles/globals.css — already loaded globally, just reference)

### Layout tokens
- `--page-pad-x:   clamp(22px, 6vw, 84px)` — horizontal page padding
- `--page-pad-top: clamp(40px, 6vw, 76px)` — top padding
- `--page-clear:   calc(108px + env(safe-area-inset-bottom,0px))` — bottom clearance (keeps content above PWA chrome)
- maxWidth picks ONE of:
  - `--page-max-reading: 1180px` — data/grids/feeds (multi-column, cards, lists)
  - `--page-max-wide:    920px`  — generous single column
  - `--page-max-prose:   720px`  — reading / letters / long prose
  - `--page-max-focus:   600px`  — ceremony / onboarding / single focused action

### Type scale (use the CSS var, not a raw clamp, where a heading maps cleanly)
- `--type-hero` clamp(52,8vw,96) · `--type-display` clamp(36,5.5vw,64) · `--type-title` clamp(26,3.5vw,40)
- `--type-subhead` clamp(20,2.5vw,28) · `--type-body-lg` clamp(18,2vw,21) · `--type-body` clamp(15,1.5vw,17)
- `--type-caption` clamp(12,1.2vw,14) · `--type-label` 11px · `--type-micro` 10px

### Type classes (prefer these over inline font props)
- `.hl-serif` — Source Serif 4, weight 300 (display + prose)
- `.hl-tight` — line-height 1.06, letter-spacing -0.022em (pair with hl-serif on large headings)
- `.hl-eyebrow` — mono uppercase eyebrow (the standard kicker above a heading)
- `.hl-prose` — body reading paragraph (serif, lh 1.85, max 60ch)
- `.hl-mono` — JetBrains Mono, archival/labels
- `.hl-italic` — serif italic
- `.hl-rule` — 1px hairline divider (`background: var(--rule)`)
- `.hl-btn` — the only button style (ghost/text variants: `.hl-btn.ghost`, `.hl-btn.text`)

### Color tokens (NEVER hardcode hex; map to these)
`--ink #0e0e0c` · `--bone #f4ecd8` · `--bone-dim rgba(244,236,216,0.55)` ·
`--bone-faint rgba(244,236,216,0.32)` · `--rule rgba(244,236,216,0.08)` ·
`--warm #b07a4a` · `--warm-bright #cf935a` · `--warm-dim #8c5a30`
Warm is the ONLY emotional color and stays under ~3% of surface (one CTA, one mark, one eyebrow accent — not fills).

## The canonical room container (copy this shape)
```tsx
<ClothShell topbarLeft={...} topbarCenter="...">
  <div style={{
    padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
    maxWidth: 'var(--page-max-reading)',   // pick the right one for THIS page
    margin: '0 auto',
  }}>
    <div className="hl-eyebrow" style={{ marginBottom: 22, color: 'var(--warm)' }}>section kicker</div>
    <h1 className="hl-serif hl-tight" style={{
      fontSize: 'var(--type-display)', fontWeight: 300, margin: '0 0 24px', color: 'var(--bone)',
    }}>
      Heading
    </h1>
    <p className="hl-serif" style={{
      fontSize: 'var(--type-body-lg)', color: 'var(--bone-dim)', lineHeight: 1.74, margin: '0 0 36px', maxWidth: '44ch',
    }}>
      Intro prose.
    </p>
    {/* ...existing page body, untouched except color-token + button-class normalization... */}
  </div>
</ClothShell>
```

## What to change (and ONLY this)
1. **Outer container padding** → `'var(--page-pad-top) var(--page-pad-x) var(--page-clear)'`.
   If the page splits padding (e.g. `paddingBottom` separate), fold it into the shorthand.
2. **Outer maxWidth** → the matching `--page-max-*` var. Keep `margin: '0 auto'`.
3. **h1 / primary heading** → add `className="hl-serif hl-tight"`; fontSize → nearest `--type-*` var
   (most room h1 = `--type-display`; sub-pages/compact = `--type-title`); fontWeight 300; color `var(--bone)`.
4. **Eyebrow/kicker** above the heading → `className="hl-eyebrow"`. If none exists and the page clearly
   has a section label, you may class an existing label; do NOT invent new copy.
5. **Body paragraphs** → serif via `hl-serif`/`hl-prose`; color `var(--bone-dim)` (never pure bone for long body).
6. **Buttons / primary CTAs** → `className="hl-btn"` (or `.hl-btn.ghost`/`.hl-btn.text`). Remove bespoke
   border-radius, custom bg fills, rounded-full.
7. **Hardcoded colors** → map every hex/rgba to the nearest token var. Kill any glass/blur/gradient-mesh,
   spinners, toasts, avatar circles, icon-library icons, decorative emoji you encounter.
8. **Dividers** → `<hr className="hl-rule" />` or `borderTop: '1px solid var(--rule)'`.

## What NOT to touch
- Route/auth logic, data fetching, state, props, conditionals, copy text.
- Inner card/list/grid internal spacing UNLESS it uses a hardcoded hex color (then token-map it).
- Pages that are already on `var(--page-pad-x)` (leave them).
- The ClothShell topbar props.
- Anything that would change behavior or break the build.

## Constraints (hard)
- TypeScript strict. The build gate is `npm run build` — your edits MUST keep it compiling.
- No new imports unless replacing a removed one. No new dependencies.
- Match the surrounding file's idiom.

## Output
Return a terse receipt: per page, the maxWidth var you chose + one line of what you normalized
(e.g. `Streaks: --page-max-prose; padding→tokens, h1→type-display+hl-tight, 3 hex→bone-dim`).
If a page was already on-spec or is legitimately bespoke (full-bleed canvas, ceremony), say so and skip it.
