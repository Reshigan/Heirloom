# Heirloom Cosmic Archetype Playbook

You are mirroring Heirloom's live cosmic design system into ONE assigned page.
Edit ONLY your assigned file. Presentation-only: preserve ALL data fetching,
routing, state, props, handlers, and exports. Do not remove features. TS strict —
no unused imports/vars/params (build fails on them).

## Constitution (non-negotiable)

- **Color tokens only** (from globals.css): `--ink` (bg `#0e0e0c`), `--bone` (text
  `#f4ecd8`), `--bone-dim`, `--bone-faint`, `--rule` (hairlines), `--warm` (the ONE
  emotional accent `#b07a4a`, used on **<3% of surface** — CTAs, the ∞, active state
  only), `--warm-bright`, `--warm-dim`, `--warm-glow`. Per-author dye via
  `dyeVar(dye)` / `dyeColor` from `src/loom/dye`.
- **Fonts:** `var(--serif)` Source Serif 4 = display + prose. `var(--sans)` Inter =
  UI. `var(--mono)` JetBrains Mono = eyebrows / labels / meta / years — ALWAYS
  uppercase with letter-spacing 0.14–0.3em.
- **∞ is the ONLY mark.** NO icon libraries, NO emoji, NO glassmorphism / blur /
  backdrop-filter, NO gradient meshes / conic gradients, NO box-shadows (except the
  sanctioned warm ∞ glow via `textShadow`), NO loading spinners (use a 1px
  `<progress>` or a hairline bar), NO toast notifications (inline mono status only),
  NO avatar circles / `borderRadius:'50%'` identity chips, NO rounded cards
  (border-radius ~0; a pill radius is allowed ONLY on a single primary CTA button).
- **60–70% negative space.** One easing `cubic-bezier(0.16,1,0.3,1)`; durations
  180 / 360 / 720 / 1400ms only. "Outside time" — nothing that signals a trendy 2026.
- **Reuse primitives** from `src/loom/cosmic/CosmicUI.tsx`:
  - `CosmicHeader({ eyebrow, title, sub, align })` — mono eyebrow + giant serif title.
  - `EntryRow({ title, sub, year, author, dye, italic, onClick })` — serif title left;
    mono right cluster = year + dye dot + AUTHOR tinted by dye; hairline bottom rule.
  - `SectionLabel` — uppercase mono group label.
  - `WarmDot({ color, size })` — the small dye/warm dot.
  - `WaxSeal({ size })` — the ∞ resting warm at a page foot.
- If the page already wraps in `ClothShell` / `Breadcrumbs` / `UserMenu`, keep that chrome.
- Mobile: stack columns, ≥44px touch targets, clamp() type. Test narrow widths.

## Archetypes — apply the ONE named in your assignment

### LEDGER  (collection / list / feed / dashboard)
`CosmicHeader` with a mono eyebrow stating the count + kind (e.g. "47 WOVEN",
"12 LETTERS", "8 VOICES") and a giant serif title → a vertical list of `EntryRow`
(serif title on the left; mono right cluster of year + dye dot + author tinted by
dye) separated by hairline rules → `WaxSeal` at the foot. Replace any card grid,
mosaic, CSS-columns, or table layout with this row list. Keep filters/search as a
quiet mono control bar above the list. Keep edit/delete/select via row click-through
or small mono text affordances (never icon buttons). Empty state: a centered
serif-italic line in `--bone-dim` + a quiet listener prompt.

### READING  (single entry / story / letter / card shown to read)
A left **dye margin thread**: the reading column gets `borderLeft: 3px solid <dyeColor>`
(fallback 1px `--rule`) with `paddingLeft: 24`. Serif headline title
`clamp(30px,6vw,44px)` weight 400 `--bone`. Directly under it a mono warm subline,
uppercase 0.26em: "A MEMORY BY <AUTHOR> · <YEAR>" (adapt the kind word — LETTER /
RECORDING / PHOTOGRAPH / STORY). Body in `var(--serif)` 18px, line-height 1.75,
`--bone`, `text-align: justify`, max-width ~62ch, column centered, paragraph breaks
preserved. `WaxSeal` foot. Any prev/next/edit affordances go quietly in mono below.

### COMPOSER  (write / record / capture)
Lead with a mono eyebrow (contextual, e.g. "THE LISTENER ASKS" or "WEAVE A NEW
LETTER") + a giant serif prompt/title. Flat serif title input `clamp(30px,5vw,44px)`
(no box — transparent, no border, warm caret). Serif body textarea 18px / 1.75. A
bottom action bar: the primary verb (e.g. WEAVE / RECORD / SAVE) as a mono pill or
mono warm button + a mono date pill + any secondary action (e.g. SPEAK). Keep EVERY
existing field, control, draft-persistence, and submit path.

### CEREMONY  (sealed letter / time capsule / gift / welcome ritual)
Centered, vast air, optionally inside one faint rounded-rect frame (radius ~14px, 1px
`--rule`). A large GLOWING warm ∞ at top: color `--warm`, `clamp(40px,10vw,64px)`,
`textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)'`. Serif title
`clamp(24px,5vw,34px)` `--bone`. Mono warm meta uppercase 0.26em (e.g.
"SEALED · OPENS <year>", "A GIFT FOR <name>"). Serif-italic dim byline. If there is a
primary action, a mono warm uppercase button (e.g. "BREAK THE SEAL →", "OPEN").

### FORM  (auth / single-input / centered capture)
Centered column, content vertically centered, vast air. Mono eyebrow. Giant serif
headline `clamp(40px,9vw,72px)` centered, line-height ~1.05. Underline-only inputs:
`border:0; borderBottom:1px solid var(--rule)`; focus → `borderBottomColor:var(--warm)`;
transparent bg; color `--bone`; `caretColor:var(--warm)`; placeholder `--bone-faint`;
serif or sans ~18px; centered; max-width ~360px. `WaxSeal` for ceremony. Serif-italic
sub in `--bone-dim`. Primary CTA: mono uppercase 0.26em `--warm`, ≥44px touch. Keep ALL
auth logic, validation, OAuth, and error handling — show errors as inline mono lines in
`--warm` (or `--bone-dim`), never toasts.

### LABEL-VALUE  (settings / billing / account / legal / docs)
Giant serif page title (`clamp(40px,8vw,64px)`). Group with `SectionLabel` headers.
Each setting is a row: `display:flex; justify-content:space-between; align-items:center;
padding:14px 0; borderBottom:1px solid var(--rule)`. Left = label (serif/sans `--bone`);
right = value/control (mono `--bone-dim` static, `--warm` if actionable like VIEW /
MANAGE / ON). `WaxSeal` foot. For LEGAL / long-text pages (Terms, Privacy): a mono
eyebrow + giant serif title, then serif prose body 17px / 1.7, max-width 62ch.

### HERO  (marketing / landing / year-in-review / observatory)
A centered or left serif hero `clamp(40px,8vw,64px)` + mono eyebrow + serif-italic
sub + a mono warm CTA. Below the hero, compose with ledger rows / SectionLabel blocks
/ a `WaxSeal`. Keep all marketing copy, links, tabs, and embeds.

### UTILITY  (404 / offline / tiny states)
Centered. A small `WaxSeal` ∞. Serif headline. One serif-italic dim line. One mono
warm link back home. Minimal — mostly negative space.

## Functionality Parity Contract (MANDATORY — read twice)

This is a **re-skin, not a rewrite.** Losing functionality is a FAILURE, even if the
page looks perfect. Before you change anything, build an inventory of the file's
behavior; after, prove every item survived.

**Step A — inventory BEFORE editing.** List, from the current file:
- every `export` (component, hook, const),
- every route string / `navigate(...)` / `<Link to=...>` / `useNavigate` target,
- every API call (`*Api.*`, `fetch`, react-query `useQuery`/`useMutation` keys),
- every event handler (onClick/onChange/onSubmit/onKeyDown…) and what it does,
- every `useState`/`useEffect`/`useRef`/store selector and its purpose,
- every conditional branch the user can reach (loading / error / empty / success /
  permission / step states),
- every form field + its validation,
- any timers, intervals, subscriptions, analytics, or side effects.

**Step B — re-skin.** Change only JSX structure and styles. Keep the same state, the
same handlers wired to the same elements, the same data flow. If a control was an
icon button, it becomes a mono **text** affordance with the SAME `onClick`. If a card
grid becomes a row list, each row keeps its click-through. Do not drop a field, a
branch, a query, or a route. Do not change behavior, only appearance.

**Step C — prove parity.** Re-check your inventory against the edited file. Every item
present and wired? If you intentionally moved/merged a control, say so explicitly.

A reviewer will independently diff your file and reject the change if any handler,
route, API call, state branch, or field disappeared. Build the inventory honestly.

## Process

1. Read your assigned file fully.
2. **Functionality Parity Contract Step A** — write the behavior inventory.
3. Restructure the JSX/styles into the named archetype, mapping real fields in
   (Step B). Make it responsive.
4. **Step C** — verify every inventory item survived and is still wired.
5. Run `cd /Users/reshigan/Heirloom/cloudflare/frontend && npx tsc --noEmit` and fix
   ONLY the errors in YOUR file (other files may show transient errors from sibling
   edits running concurrently — ignore those).
6. Report: (a) the functionality inventory, (b) what you restyled, (c) any control you
   deliberately relocated/merged and why, (d) confirm tsc clean for your file.
