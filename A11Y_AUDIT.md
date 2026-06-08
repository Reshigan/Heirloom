# Heirloom — Accessibility Audit (WCAG 2.2 AA)

Scope: `cloudflare/frontend/src/` (the live, deployed tree). Audience: adult women 35–60 on
iPhone/iPad/Vision Pro. Bar: WCAG 2.2 AA minimum. Findings ranked CRITICAL / HIGH / MEDIUM / LOW.

Files reviewed: `loom/components/BottomNav.tsx`, `loom/components/ClothShell.tsx`,
`loom/components/ClothPage.tsx`, `loom/components/ClothCanvas3D.tsx`,
`loom/components/ClothBackdrop.tsx`, `loom/components/ComposerChrome.tsx`,
`pages/Compose.tsx`, `pages/Billing.tsx`, `styles/globals.css` (full 2086 lines, focused on
:root tokens, focus rules, reduced-motion blocks, `.loom`/`.hl-*` primitives).

---

## 1. Core interactive elements

### 1.1 — HIGH — `BottomNav` active item is not announced to screen readers
`loom/components/BottomNav.tsx:61-90`. The active tab is conveyed only by colour
(`var(--bone)` vs `var(--bone-low)`) and a 2px `border-top` in `var(--warm)`. There is **no
`aria-current="page"`** on the active `<Link>`. A screen-reader user tabbing through the five
items hears five identical-structure links with no indication which destination is "current."
WCAG 2.2 SC 4.1.2 (Name, Role, Value) / 1.3.1 (Info and Relationships).

**Fix:** add `aria-current={isActive ? 'page' : undefined}` to the `<Link>`.

The nav itself is correctly an `<nav aria-label="Loom navigation">` wrapping real `<Link>`
(anchor) elements — that part is solid (pass).

### 1.2 — LOW — Center "∞" item has no accessible label distinct from its glyph
`label: '∞'` (line 22) is rendered as the link's only text content. VoiceOver will read this as
"infinity" (or may skip/garble the glyph on some AT/font combinations) rather than "home" —
the actual destination (`/loom/index`). Consider `aria-label="Home"` (or "The thread / home")
on that one `<Link>` so its purpose reads clearly regardless of how the glyph is voiced.

### 1.3 — PASS — `ClothShell` topbar header
`loom/components/ClothShell.tsx:35` — `<header aria-label="Navigation">`. Present and
descriptive enough. (Minor: "Navigation" duplicates the `<nav>`'s "Loom navigation" label one
screen down — consider "Page header" / "{section} header" for less ambiguity, but this is
cosmetic, not a failure.)

### 1.4 — PASS — `ClothPage` fold panels correctly toggle `aria-hidden`
`loom/components/ClothPage.tsx:29` (`aria-hidden={isOpen}` on the cloth face) and `:47`
(`aria-hidden={!isOpen}` on the page face) are wired correctly and track `isOpen` — the
folded-away panel is properly hidden from AT. This is exactly right. **However** see §3.2:
the panels are not removed from the tab sequence (`pointerEvents` is toggled but focusable
descendants of the hidden panel remain keyboard-reachable while `aria-hidden="true"`), which
is its own failure (a focusable element inside an `aria-hidden="true"` subtree is an ARIA
authoring-practices violation that confuses AT — SC 4.1.2 / 1.3.1). Add `inert` (or
`tabIndex={-1}` cascaded / `visibility: hidden` swap) to the hidden face so its buttons/links
can't receive focus while `aria-hidden`.

### 1.5 — HIGH — Compose textarea has no accessible name
`pages/Compose.tsx:994-1024`. The `<textarea>` carries only a `placeholder` (e.g. "Write
freely. The Listener will read alongside you."). Placeholder text (a) is not a substitute for
a label/accessible name per WCAG 3.3.2 and 4.1.2 (it disappears once text is entered, and is
not reliably exposed as the accessible name across all screen readers/browsers — VoiceOver on
iOS in particular announces it inconsistently as a "hint" rather than a name), and (b) fails
1.3.1 because the field's *purpose* (the letter/memory body) is conveyed only visually via
surrounding layout (the dye-coloured left border + the eyebrow line above). A screen-reader
user landing on the field hears only "text area," with no indication of what to write.

**Fix:** add `aria-label="Write your letter"` / `"Write your memory"` (computed from
`isLetter`), or wire a visually-hidden `<label htmlFor>` tied to the textarea's `id`. The
`title` `<input>` (line 971) has the same gap — only a `placeholder`.

### 1.6 — MEDIUM — No live-region announcement of the word count
`pages/Compose.tsx:1027-1040`. The "{wordCount} words" indicator is a plain `<div>` that
updates on every keystroke with no `aria-live`/`role="status"`. Sighted users see it fade in
at `opacity: wordCount > 0 ? 1 : 0`; screen-reader users get nothing — they cannot tell how
long their entry is getting (relevant: this app's core audience writes long-form letters and
memories). This is not a hard SC failure (word counts aren't mandated to be live), but it's a
best-practice gap relative to the product's own emphasis on the writing experience, and other
parts of the same composer *do* use `aria-live="polite"` (the `ListenerLine`,
`ComposerChrome.tsx:157`) — so the omission here reads as an inconsistency rather than a
deliberate choice. Recommend `aria-live="polite" aria-atomic="true"`, throttled (e.g. announce
on word-count change, not per keystroke, to avoid chatter).

### 1.7 — PASS — Recipient autosuggest, image remove, and clear-recipient controls
`ToField` (Compose.tsx:46-239): the input has `aria-label="Recipient name"` (106), the clear
button has `aria-label="Clear recipient"` (138), `removeImage` has `aria-label="Remove photo"`
(1119). These are correctly labelled. The autosuggest listbox itself, however, is a plain
`<div>`/`<button>` list with no `role="listbox"`/`role="option"`/`aria-expanded`/
`aria-activedescendant` wiring (lines 159-220) — a screen-reader user gets no indication that
typing opens a suggestion menu, nor can they navigate it predictably with arrow keys. **MEDIUM**
— combobox pattern (WAI-ARIA APG) would close this; at minimum add
`role="combobox"`/`aria-expanded`/`aria-controls` on the input and `role="listbox"` +
`role="option"` on the menu.

---

## 2. Color contrast

Calculated using the WCAG relative-luminance formula against the actual composited colours
(all the `--bone-*` tokens are translucent bone over the ink ground, so the *effective* RGB
after alpha-compositing is what matters for contrast — not the nominal hex):

| Token | Composited RGB on `#0e0e0c` | Contrast vs ink | AA body (4.5:1) | AA large/UI (3:1) |
|---|---|---|---|---|
| `--bone-faint: rgba(244,236,216,0.44)` (canonical, globals.css:80) | ≈(115,112,102) | **3.89:1** | **FAIL** | pass |
| `--paper-30 / rgba(...,0.32)` (the value named in the brief) | ≈(88,85,77) | **2.59:1** | **FAIL** | **FAIL** |
| `--bone-low: rgba(244,236,216,0.24)` | ≈(76,74,68) | **1.96:1** | **FAIL** | **FAIL** |
| `--bone-dim: rgba(244,236,216,0.72)` | ≈(180,176,162) | 8.72:1 | pass | pass |
| `--warm #b07a4a` | (176,122,74) | **5.27:1** | pass (≥4.5) | pass |
| `--bone #f4ecd8` | (244,236,216) | 16.41:1 | pass | pass |

### 2.1 — HIGH — `bone-faint` fails AA for body text at the sizes it's actually used at
The canonical `--bone-faint` (rgba(244,236,216,**0.44**), globals.css:80) composites to
**3.89:1** against ink — short of the 4.5:1 AA minimum for normal text. It is used
*pervasively* as **body-weight, sub-18px copy**, not just decorative captions:
- `Compose.tsx` "to" / "available" / "on" field labels at **11px** (lines 78-84, 269-276,
  395-403) — well under the 18pt/14pt-bold "large text" threshold that would drop the bar to
  3:1.
- `ComposerChrome.tsx` hint text, dye/visibility rail copy, the autosuggest relationship tags
  at **10–12px** (lines 126, 174, 210, 228).
- The eyebrow line and rail microcopy throughout `Compose.tsx` (e.g. line 901-914, 1208).

At these sizes (10–14px, regular weight), **4.5:1 is the applicable AA threshold**, and
`bone-faint` misses it (3.89:1). This affects a large fraction of the app's UI chrome —
labels, hints, metadata — for the stated audience (35–60-year-olds, who statistically have
measurably reduced contrast sensitivity vs. 20-somethings).

If the brief's documented value (`rgba(244,236,216,0.32)`, i.e. `--paper-30`) is used anywhere
in place of the canonical 0.44 token, it is **far worse** — 2.59:1, which fails even the
relaxed 3:1 large-text/UI-component bar.

**Fix:** raise the effective alpha. `rgba(244,236,216,0.44)` → ~3.89:1; reaching 4.5:1 against
`#0e0e0c` requires roughly **α ≈ 0.50–0.52** (composited RGB ≈ (128,124,113), ≈4.5:1). Either
bump `--bone-faint` to `rgba(244,236,216,0.52)`, or reserve the current `--bone-faint` strictly
for ≥18.66px/14px-bold "large text" contexts (where 3:1 applies and it passes) and introduce a
slightly stronger token for the sub-15px label/hint role it's currently overloaded onto.

### 2.2 — PASS (with a caveat) — `warm #b07a4a` on ink
**5.27:1** measured (not the 5.7:1 cited in the prompt — the discrepancy is likely a rounding/
formula difference, but 5.27:1 is the WCAG-formula-correct figure for `#b07a4a` on `#0e0e0c`).
This **passes AA for normal body text** (≥4.5:1) at any size, which covers its heaviest uses —
the "weave into cloth →" / "send letter →" submit button label on `--ink` background
(`Compose.tsx:1272-1294`, but note: there the *background* is warm and the *text* is ink —
see §2.3), the active nav state, links, and 11–14px CTA microcopy throughout `Billing.tsx` and
`ComposerChrome.tsx`. No action needed for warm-on-ink; it clears AA with headroom even at
small sizes.

### 2.3 — MEDIUM — `--ink` text on `--warm` background (inverted) — verify the reverse pairing
The primary submit button (`Compose.tsx:1271-1284`) renders `color: var(--ink)` text on
`background: var(--warm)`. Because contrast is symmetric, `#0e0e0c` on `#b07a4a` is also
**5.27:1** — passes AA. Flagging only because this *inverted* pairing recurs (founder CTA,
primary buttons site-wide per `.hl-btn`) and is worth keeping on the radar if `--warm` is ever
darkened for brand reasons — at 5.27:1 there's only ~0.77 of headroom before an AA failure on
normal text.

### 2.4 — LOW — `--bone-low` (0.24) and `--rule`/`--rule-strong` hairlines
`--bone-low` (1.96:1) and `--rule` (rgba(...,0.11) ≈ 1.4:1) are far below any text threshold,
but they are used as **decorative hairline borders**, not text — SC 1.4.11 (non-text contrast,
3:1) technically applies to *meaningful* UI-component boundaries (e.g. input borders, focus
indicators, active-state borders communicating state). Spot-check: the `DeliveryField` row
borders (`Compose.tsx:297`, `var(--rule)`) and the inactive `borderLeft: 3px solid transparent`
vs active `var(--warm)` (line 298) are *stateful* borders that arguably need to clear 3:1
against the adjacent fill — `--rule` (1.4:1) likely doesn't. Low severity because the state is
redundantly conveyed by text-colour change too, but worth a pass if these borders are ever the
*sole* state indicator elsewhere.

---

## 3. Focus management

### 3.1 — MEDIUM — `.loom input/textarea/select:focus` strips the visible focus ring with `!important`, leaving only a border-colour change
`globals.css:1815-1820`:
```css
.loom input:focus,
.loom textarea:focus,
.loom select:focus {
  outline: none !important;
  border-bottom-color: var(--loom-warm) !important;
}
```
This sits *after* (and is more specific/important than) the global
`*:focus-visible { outline: 1px solid var(--warm); outline-offset: 2px; }` rule at
`globals.css:598-601`. Since the entire authenticated app is wrapped in `<div class="loom">`
(per `LoomShellRoot` in `App.tsx`), **every text input, textarea, and select in the product
loses its outline ring** and falls back to a **1px `border-bottom-color` change** as the only
focus indicator. A 1px colour-only change on a hairline border is a thin, easy-to-miss signal —
borderline against SC 2.4.7 (Focus Visible) and outright risky against the *new* WCAG 2.2 SC
2.4.11 (Focus Not Obscured) / 2.4.13 (**Focus Appearance**, AAA but increasingly treated as the
de-facto bar), which calls for a focus indicator with a minimum area/contrast — a 1px border
segment likely does not meet the 2.4.13 area guidance even though it clears 2.4.7's lower bar.
The `.hl-input:focus-visible { outline: none; }` rule (line 924) doubles down on the same
pattern for the `hl-input` primitive used elsewhere.

**Fix:** restore a real focus ring for form controls — e.g.
`.loom input:focus-visible, .loom textarea:focus-visible, .loom select:focus-visible { outline: 1px solid var(--loom-warm); outline-offset: 2px; }`
in addition to (not instead of) the border-colour change. (Using `:focus-visible` rather than
`:focus` avoids showing the ring on mouse click while still showing it for keyboard users —
which appears to be the original intent, just executed by deleting the indicator rather than
scoping it.)

### 3.2 — HIGH — Global `*:focus-visible` ring exists and is well-designed — but is overridden for the most common interactive surface (text entry) in the live app
Restating §3.1 from the opposite angle: `globals.css:598-610` *does* define a correct,
brief-aligned focus style (`1px solid var(--warm)`, 2px offset, single curve/colour — no
"glow," no box-shadow halo, in keeping with §2.6's anti-glassmorphism stance). The skip-link
(`globals.css:613-626`, `.skip-to-content` / `:focus { top: 0 }`) is also present and correctly
implemented. **The infrastructure for good focus visibility exists; it's selectively disabled
for `.loom` form fields**, which is precisely the surface a 35–60 audience writing long letters
spends the most time in. This is the highest-impact focus issue in the audit.

### 3.3 — HIGH — Cloth-fold reveal does not move focus to the new content panel
`loom/components/ClothPage.tsv` (no `useEffect`/`ref.focus()` anywhere in `loom/` — confirmed
via repo-wide search returning zero `.focus()` calls in `loom/components/`). When `isOpen`
flips to `true`, the "page" panel fades/rotates into view and becomes interactive
(`pointerEvents: 'auto'`), but **focus remains wherever it was** (typically on the trigger that
opened the cloth-fold). For keyboard and screen-reader users this means:
- They don't know the "page" content has appeared (no SR announcement of a context change).
- They must manually tab through the entire remaining page to reach the new content, or worse,
  tab *past* it into background chrome.
- The "← cloth" close button (`ClothPage.tsx:62-87`, the natural first focus target) is never
  reached programmatically.

This is a SC 2.4.3 (Focus Order) / 4.1.3 (Status Messages) / 3.2.2 (On Input — context change
without user awareness) cluster failure, and it is the **single most consequential a11y gap**
in the "world-first" cloth-fold UX, since that interaction is the product's signature reading
flow.

**Fix:** on the `isOpen: false → true` transition, move focus to the page panel's container
(`tabIndex={-1}` + `.focus()`) or to its heading/the "← cloth" button, and consider an
`aria-live="polite"` announcement region (e.g. "Reading {title}") so screen-reader users get
the equivalent of the sighted "fold" cue. On close (`isOpen: true → false`), return focus to
the element that triggered the open (store a ref before navigating).

### 3.4 — MEDIUM — Several "small text" buttons fall short of comfortable focus-ring legibility *and* tap-target size simultaneously
Compounding §3.1/§6: buttons like `ClothPage`'s "← cloth" (10px mono, `padding: '8px 0'`, no
horizontal padding — `ClothPage.tsx:73-79`) and `Compose`'s "back →" (`minHeight: 36`,
`Compose.tsx:863-879`) are small enough that a 1px focus ring at 2px offset will be visually
marginal even where it *is* shown. Increasing both the hit area (§6) and the indicator
prominence together would resolve this in one pass.

---

## 4. Screen reader semantics

### 4.1 — PASS — `<nav>` landmark present
`BottomNav.tsx:45`, `<nav aria-label="Loom navigation">` — correct landmark + accessible name.

### 4.2 — HIGH — No `aria-current="page"` on the active nav item
Restated from §1.1 — the single biggest semantic gap in `BottomNav`. A `<nav>` landmark with
five undifferentiated links is only half the job; AT users rely on `aria-current` to know
"where am I" exactly the way sighted users rely on the warm border-top + bone colour. **Fix is
a one-line addition** (`aria-current={isActive ? 'page' : undefined}`) — highest
value-for-effort item in this audit.

### 4.3 — PASS (contrary to the audit brief's premise) — Billing CTAs are contextually distinct, not "Start free trial ×3"
Reviewed every actionable control in `pages/Billing.tsx`:
- `become a founder →` (125-127)
- `switch to annual` / `opening…` (130-133)
- `downgrade` / `opening…` (135-139)
- `start 30-day trial →` / `opening…` (141-145)
- `open portal →` (156-159), `replace card →` (170-173), `cancel · gentle exit →` (188-191)

Each tier-state renders **at most one primary CTA plus distinct secondary actions** — they are
not duplicated generic "Start free trial" labels. This *passes* the brief's stated concern.
**However**, two real gaps remain:
- The tier "card" containing the price, renewal date, usage grid, and CTAs
  (`Billing.tsx:85-147`) is a bare `<div>` with no `role="region"`/heading association — a
  screen-reader user gets a flat stream of text/numbers with no structural grouping ("your
  tier" is a separate sibling `<div className="hl-eyebrow">`, not a `<h2>`/`aria-labelledby`
  pairing). **MEDIUM** — wrap in `<section aria-labelledby="tier-heading">` with the eyebrow as
  an actual heading (or `aria-labelledby` reference) so AT users can jump to/scope the section.
- The usage grid (`Billing.tsx:114-121`, `n`/`u` pairs like "3 of 10") relies entirely on
  visual stacking to convey "X of Y {unit}" — there's no accessible string assembling the pair
  (e.g. `aria-label="3 threads of 10"`). A screen-reader reads "3 … of 10" as two disconnected
  fragments. **LOW** — add an `aria-label` per cell that reads the full sentence.

### 4.4 — LOW — Decorative dye swatch in `DyeControl` is correctly `aria-hidden`
`ComposerChrome.tsx:283` — the colour swatch `<span aria-hidden>` is properly hidden, with the
dye name/motif conveyed in adjacent text. Good pattern; no action.

---

## 5. Motion sensitivity

### 5.1 — PASS — `prefers-reduced-motion` is respected at the global CSS level
`globals.css:586-595` — a top-level catch-all collapses `animation-duration` /
`transition-duration` to `0.01ms` and forces `scroll-behavior: auto`. Two more scoped blocks
reinforce this for specific subsystems: `globals.css:747-753` (the `.progress-hair` loading
sweep degrades to a static 50%-opacity bar — exactly the right "no spinners, ever" + "respect
the OS" combination) and `globals.css:1877-1882` / `:2007-2012` (`.loom *` and the
`.hl-infinity-3d`/`.hl-thread-new`/`.hl-cloth-breathe-el` CSS-driven cloth animations). This is
a thorough, well-layered implementation — better than most production apps at this size.

### 5.2 — CRITICAL — `ClothCanvas3D` (the WebGL cloth) **ignores `prefers-reduced-motion` entirely**
`loom/components/ClothCanvas3D.tsx` runs a `requestAnimationFrame` loop
(lines 200-212) that *unconditionally*:
- advances `uTime` to drive the vertex-shader "breathing" wave displacement (lines 42-46) and
  the fragment-shader "shimmer"/"bloom" colour drift (lines 72-78),
- continuously dollies the camera from z=32 → z=24 over ~8 seconds (`startZ`/`targetZ`,
  lines 198, 206),
- applies real-time **mouse/touch parallax** that tilts the camera based on pointer position
  (lines 173-184, 207-208) — a vection-inducing effect that is one of the more reliable
  vestibular-disorder triggers (large-field motion that doesn't match the user's own movement).

There is **no `window.matchMedia('(prefers-reduced-motion: reduce)')` check anywhere in this
file** (confirmed — zero matches for `prefers-reduced-motion` or `matchMedia` in
`ClothCanvas3D.tsx`, vs. `AmbientThreads.tsx:64` which *does* check it correctly: "Honours
prefers-reduced-motion (renders a still scatter, no animation)"). Critically, **this canvas is
mounted as the persistent background of every authenticated screen** via `ClothBackdrop.tsx`
(line 59, unconditional `<ClothCanvas3D entries={...} />`) — meaning a user who has set "Reduce
Motion" at the OS level (iOS Settings → Accessibility → Motion) still gets a full-bleed,
continuously-undulating, parallax-reactive 3D surface behind every page in the app, all day,
with no opt-out short of disabling JS/WebGL. This is the loudest possible contradiction of the
product's own documented "Honours prefers-reduced-motion" standard (which the *sibling*
`AmbientThreads` component states and implements correctly two files away) and is a textbook
SC 2.3.3 (Animation from Interactions, AAA — but functionally a 1.4.2/2.2.2-adjacent CRITICAL
given the always-on, full-viewport, vection-inducing nature and the explicit Vision Pro target,
where large-field motion mismatch is *substantially* more provocative of motion sickness than
on a phone screen).

**Fix:** in `ClothBackdrop` (or inside `ClothCanvas3D`'s effect), check
`window.matchMedia('(prefers-reduced-motion: reduce)').matches` once on mount and either (a)
skip constructing the renderer/animation loop entirely and render a single static frame (set
`uTime` to a fixed value, draw once, no RAF), or (b) fall back to the existing CSS
`.hl-cloth-breathe`/static-scatter treatment used elsewhere. At minimum, **disable the
mouse/touch parallax** (lines 173-184, 207-208) under reduced motion even if the shader
breathing is judged "ambient enough" to keep — parallax-from-pointer is the most provocative
single element here and the cheapest to gate.

### 5.3 — LOW — Camera drift has no pause/resume on tab visibility
Unrelated to reduced-motion strictly, but worth noting alongside §5.2: the RAF loop
(`ClothCanvas3D.tsx:200-212`) has no `document.visibilitychange` handler, so it keeps computing
(burning battery/CPU) when the tab is backgrounded — `AmbientThreads` explicitly does pause
"when the tab is hidden" per its own doc comment (line 12) but `ClothCanvas3D` does not mirror
that. Not an a11y SC in itself, but relevant to the same audience on older iPads where thermal
throttling degrades the experience further.

---

## 6. Touch target sizes

Apple HIG / WCAG 2.2 SC 2.5.8 (Target Size Minimum, AA) calls for **24×24px** minimum with
exceptions; SC 2.5.5 (Target Size, AAA) and Apple's own HIG call for **44×44pt**. Given the
stated audience (adult women 35-60, a population with measurably higher rates of mild tremor/
reduced fine-motor precision than 20-somethings, on touch-first devices), **44×44 is the right
practical bar** even though 24×24 is the AA letter-of-the-law minimum.

| Control | Location | Effective size | Verdict |
|---|---|---|---|
| `BottomNav` items | `BottomNav.tsx:65-90` | `flex:1` × `64px` height ≈ 64–75px × 64px on common widths | **PASS** (comfortably ≥44×44) |
| `ClothPage` "← cloth" close | `ClothPage.tsx:62-87` | `padding: '8px 0'`, font-size 10, no horizontal padding → ≈ text-width × ~26px | **FAIL** — height ~26px, well under 44px; the only way back from a reading view |
| `Compose` "back →" topbar button | `Compose.tsx:863-879` | `minHeight: 36`, `padding: '8px 0'` | **FAIL** — 36px < 44px |
| `Compose` cancel/submit action buttons | `Compose.tsx:1225-1295` | `minHeight: 40` | **MEDIUM-FAIL** — 40px, 4px short of 44px (close, but still below the practical bar for the stated audience) |
| `Compose` "+ add a photo" | `Compose.tsx:1146-1172` | `minHeight: 40` | **MEDIUM-FAIL** — same 40px shortfall |
| `Compose` image-remove "×" | `Compose.tsx:1116-1140` | `width: 24, height: 24` | **FAIL** — 24×24, meets the *letter* of SC 2.5.8's minimum only if no better-spaced alternative exists nearby; here it overlaps a small thumbnail in a tight grid (`minmax(96px,...)`), making mis-taps likely |
| `DeliveryField` trigger rows | `Compose.tsx:287-369` | `minHeight: 48`, full-width | **PASS** |
| `ComposerChrome` Visibility/Dye/Listener inline text-buttons | `ComposerChrome.tsx:228-247, 264-298, 325-343, 187-209` | `padding: '2px 0'` / `padding: 0`, single-line 10-14px mono | **FAIL** — these are bare inline text runs with no padding box; effective tap height is the line-height of 10-14px text (≈14-22px). They sit inside a `flex-wrap` rail (`ComposerChrome.tsx:32-45`) where adjacent controls are separated only by `gap`/`/` glyphs — both small targets *and* tight adjacent-target spacing (compounding 2.5.8's "no overlap" sub-criterion) |
| `ToField` clear "×" | `Compose.tsx:134-156` | `padding: '4px 2px'`, font-size 14 | **FAIL** — ≈18×22px |
| `EntryDateField` invisible date overlay | `Compose.tsx:419-431` | `position: absolute, inset: 0` over a small inline row | **PASS** on area (inherits the row's full bounding box), but **MEDIUM** on discoverability — a fully transparent `<input type="date">` stretched over a short text+glyph row is a non-obvious tap target whose boundaries aren't visually indicated; users may not realize the *whole* row (not just the "↗" glyph) is tappable |

### 6.1 — HIGH — Multiple primary navigation/exit controls sit below the 44px practical minimum
Summarizing the table: the **two most-used "go back" affordances in the entire reading/writing
flow** — `ClothPage`'s "← cloth" (≈26px tall) and `Compose`'s "back →" (36px) — are both under
44px, and several composer micro-controls (visibility/dye/listener "another →") are essentially
unpadded text runs. For an audience that skews toward larger fingers and less precise tapping,
and on a product whose entire UX is funneled through these exact exit/navigation points, this
is a meaningful, recurring friction source rather than an isolated nit.

**Fix:** wrap small text-only controls in a hit-area that preserves the visual 10-14px label
but pads the interactive box to 44×44 (e.g. `min-height: 44px; display: inline-flex;
align-items: center; padding: 0 8px;` with `margin: -12px 0` to avoid disturbing layout flow) —
a pattern already correctly used for `DeliveryField` rows (`minHeight: 48`) and `BottomNav`
items. Apply it consistently to "← cloth," "back →," the rail's inline buttons, and the image
"×" controls.

### 6.2 — LOW — 10px mono labels (`hl-eyebrow`, field labels) themselves are not interactive
Worth confirming explicitly: the *very small type* the brief calls out (`hl-eyebrow` at 11px,
`globals.css:807-813`; the 10-11px field-label `<div>`s in `Compose.tsx`) is **not** itself
tappable — it's metadata/section labelling, so SC 2.5.8 doesn't apply to it directly. The
touch-target risk in this codebase comes entirely from small *interactive* elements styled to
match that type scale (the rail buttons, close/back links), not from the labels themselves.
No action needed on the labels qua labels — but see §2.1 for their *contrast*, which is the
real issue with that type scale.

---

## Summary — ranked action list

| # | Rank | Issue | File(s) | Effort |
|---|---|---|---|---|
| 1 | **CRITICAL** | `ClothCanvas3D` ignores `prefers-reduced-motion` — full-bleed animated/parallax 3D on every screen | `loom/components/ClothCanvas3D.tsx`, `ClothBackdrop.tsx` | Medium (gate RAF loop + parallax behind `matchMedia` check) |
| 2 | HIGH | `bone-faint` (3.89:1) fails AA 4.5:1 for the 10-14px body/label text it's used at throughout | `styles/globals.css:80` + all consumers | Medium (raise α to ~0.50-0.52, or split into a stronger label token) |
| 3 | HIGH | `.loom input/textarea:focus { outline: none !important }` strips focus rings from every form field app-wide | `styles/globals.css:1815-1820`, `:924` | Low (add `:focus-visible` outline alongside the border-colour change) |
| 4 | HIGH | Cloth-fold reveal never moves focus to the new panel — keyboard/SR users lose context | `loom/components/ClothPage.tsx` | Medium (add `tabIndex={-1}` + `.focus()` on open, restore on close) |
| 5 | HIGH | `BottomNav` active item has no `aria-current="page"` | `loom/components/BottomNav.tsx:65-90` | **Trivial** — one prop |
| 6 | HIGH | Compose `<textarea>`/title `<input>` have no accessible name (placeholder-only) | `pages/Compose.tsx:971-1024` | Low (`aria-label` derived from `isLetter`) |
| 7 | HIGH | Several core nav/exit controls under 44px tap target ("← cloth" ~26px, "back →" 36px, rail buttons unpadded) | `ClothPage.tsx`, `Compose.tsx`, `ComposerChrome.tsx` | Medium (consistent hit-area wrapper pattern) |
| 8 | MEDIUM | Focusable elements remain reachable inside `aria-hidden="true"` cloth-fold panels | `loom/components/ClothPage.tsx` | Low-Medium (`inert` or focus-trap swap) |
| 9 | MEDIUM | Recipient autosuggest lacks combobox/listbox ARIA semantics | `pages/Compose.tsx` `ToField`, lines 159-220 | Medium |
| 10 | MEDIUM | Word-count indicator has no `aria-live` (inconsistent with `ListenerLine` which does) | `pages/Compose.tsx:1027-1040` | Trivial |
| 11 | MEDIUM | Billing tier card lacks `<section>`/heading structure for AT navigation | `pages/Billing.tsx:85-147` | Low |
| 12 | LOW | Center "∞" nav item's accessible name relies on glyph pronunciation | `loom/components/BottomNav.tsx:22` | Trivial (`aria-label="Home"`) |
| 13 | LOW | `ClothCanvas3D` doesn't pause on tab-hidden (battery/thermal, not strictly a11y) | `loom/components/ClothCanvas3D.tsx` | Low |
| 14 | LOW | Billing usage-grid "3 of 10" pairs lack assembled `aria-label` | `pages/Billing.tsx:114-121` | Trivial |

**What's already right** (don't regress these): the global `*:focus-visible` ring design
(brief-aligned: single curve, single colour, no glow), the `.skip-to-content` link, the
top-level `prefers-reduced-motion` CSS collapse plus `.progress-hair`'s graceful degradation,
`AmbientThreads`' correct `matchMedia` gating + tab-visibility pause, `ClothPage`'s correct
`aria-hidden` toggling on the fold faces, `ListenerLine`'s `aria-live="polite"`, the
`<nav aria-label>` landmark, and Billing's CTA labels (which — contrary to the brief's
working hypothesis — are already contextually distinct, not "Start free trial" ×3).
