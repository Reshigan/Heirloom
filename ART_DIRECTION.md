# Heirloom — Art Direction

This is the design constitution. Every visual decision answers to it.

---

## The thesis in one line

**A vault, not a campfire.** The hearth is implied by warmth, not rendered as fire.

---

## Why we're not rendering fire

The previous direction tried to render flames in canvas. Three iterations made it less amateur, never world-class. Photographic fire is a job for video or a 3D artist; illustrated fire risks Disney; and any flickering blob in a header signals "of 2026" — which is the opposite of a 50-year product.

The hearth's emotional payload is **warmth, vigilance, ritual presence**. None of those require flame on screen. They require:

- A single warm light source, abstract.
- Typography that holds the eye where the eye should rest.
- Negative space that signals weight, not emptiness.
- Restraint as the loudest move on the page.

---

## The five rules

1. **Type is the hero.** Cormorant Garamond for display, set with hand-tuned tracking — DISPLAY ONLY (≥~24px; it turns unreadable smaller). Spectral for body and reading prose (the readable workhorse). Space Mono for archival timestamps and labels. Inter for residual UI chrome. Tangerine is the lone exception, used only for the signature hand.
2. **One color has emotion.** A single copper warmth (`#e0a062`). Used at <3% surface area, always. Everything else is cream (`#f2e6d0`) on ground (`#0b0907`) at varying opacity.
3. **Negative space is the composition.** 60–70% of any view is empty. Empty is not "we couldn't think of what goes there"; empty is the design.
4. **Motion has meaning or it's removed.** One easing curve (`cubic-bezier(0.16, 1, 0.3, 1)`). One duration vocabulary (180 / 360 / 720 / 1400 ms). Anything decorative gets cut.
5. **Outside time.** The page should look authored in 1970, 2026, and 2076. If a visual move signals "this is the era," kill it.

---

## Component grammar

> The grammar below was first written for a pre-cloth era (a "Hearth" page with a `Horizon`/`NameRoll`/`Fire` component set). Those components are gone. The interface is now built on **the cloth** — a 3D woven fabric (`ClothCanvas3D`) where every family entry is a weft thread, with `CosmicLoom` rendering it as a glowing filament web under the copper skin. The principles below survive; the cloth/loom subsystem realizes them.

### The cloth (the home surface)

`ClothCanvas3D` is the home surface — a woven field, not a feed. `ClothBackdrop` mounts it once globally so every screen sits on the same ambient cloth; `ClothShell` is the app chrome (56px topbar + safe-area + content). Build new screens by extending these — never a global nav bar, tab grid, or dashboard on top of the cloth. The warmth is a single copper light on the weave, abstract — think Hammershøi's interior windows, not a campfire. It breathes slowly (the ambient aura cycle), never flickers.

### The Names

Family members are typeset names, not avatars or graphic stones. Each name in Cormorant; the active member is the only one in copper, everyone else in cream. Recent activity is a single underdot; "currently being read" is the copper color. No glow, no halo, no `rounded-full` chip. Each member also owns a natural dye (see below) that travels as a 3px left-margin thread.

### The Sealed Notes

Time-locked entries are a small typographic block: a date in Space Mono, an em-dash, the recipient's name in italic, a single ∞ glyph in copper above.

```
        ∞
2055 — for Maya, when she turns 18
```

When the date arrives it does not burn or unfold — it **dissolves**. The ∞ fades, the date fades, the entry's title cross-fades into its place over 720ms. Restraint *is* the moment.

### The Tapestry

The artifact is implied, not the centerpiece: a thin horizontal band, each entry one weft pick at ~2px height. Compact by default; hover/expand to inspect.

### The Composer

Editorial, a printed page rather than a form. Spectral body (~22px), leading ~1.85, max measure ~60ch. The textarea is a piece of paper — no borders, no focus glow; the cursor is the only signal of attention. Inputs are forced to Spectral (never Cormorant — display type is unreadable at input size).

---

## The first impression test

When a stranger lands on `heirloom.blue` (the cloth), in the first 3 seconds, they should feel:

1. *Quiet.* The page is silent. No movement except the breath.
2. *Weight.* The darkness has gravity. This is not a feed.
3. *Lit.* There is one warm thing on the page. Their eye finds it.
4. *Type.* Then they read. The typography signals book, not app.
5. *Recognition.* They cannot place this product. Nothing about it looks like Apple, Notion, Linear, or any tech-aesthetic peer. That confusion is the brand.

If those five fail, the page fails.

---

## Anti-patterns (kill on sight)

- Glassmorphism, frosted glass, blurred backgrounds.
- Gradient meshes, conic gradients, animated noise.
- Inter Display tracked tight at 80px (the SaaS hero pattern).
- "Floating" cards with translateY hover.
- Any radial gradient that's "atmospheric."
- Any motion that doesn't carry information.
- Any icon library. We have no icons. ∞ is the only mark.
- Any decorative emoji.
- Loading spinners. Use a bone-on-ink horizontal hairline progress bar instead.
- Toast notifications. Inline status is the only feedback.

---

## Color & contrast spec

Canonical in `src/styles/globals.css` `:root`, mirrored in `tailwind.config.js` (utility classes bypass globals.css — keep both in sync or old palette bleeds into the bundle).

| Token | Value | Usage |
|---|---|---|
| `ink` | `#0b0907` | Page surface (ground) |
| `ink-card` | `#1b1610` | Cards (the rare ones) |
| `ink-deep` | `#090706` | Deepest recess (abyss) |
| `bone` | `#f2e6d0` | Body, headings (cream) |
| `bone-dim` | `rgba(242,230,208,0.72)` | Secondary text |
| `bone-faint` | `rgba(242,230,208,0.44)` | Tertiary text |
| `rule` | `rgba(242,230,208,0.11)` | Hairline dividers |
| `warm` | `#e0a062` | Single accent (copper) |
| `warm-bright` | `#f0c074` | Hover/active warmth (rare) |
| `warm-dim` | `#b07a3e` | Pressed warmth (rarer) |
| `warm-glow` | `rgba(224,160,98,0.18)` | Copper bloom on the weave |

Cream on ground ≈16:1. Copper on ground ≈8.5:1 (passes AA for all text, AAA for large). bone-faint is tertiary — use at 16px+ only. A `[data-theme="light"]` bridge flips ground→cream and re-mordants copper darker (`#a86220`) for paper mode; both themes carry the full ramp.

---

## Motion spec

| Token | Value | Usage |
|---|---|---|
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | The only easing curve. Period. |
| `--dur-fast` | 180ms | Hover, focus, micro-state |
| `--dur-mid` | 360ms | Page transitions, card entry |
| `--dur-slow` | 720ms | Reading view enter, composer enter |
| `--dur-ceremony` | 1400ms | Reveal / unlock dissolve |
| ambient | ~9–12s | The cloth's slow aura breath (a loop, not a transition) |

Anything else is a violation.

---

## Typographic spec

### Cormorant Garamond — DISPLAY ONLY (≥~24px)

No optical-size axis (Cormorant uses weight + italic). It turns unreadable below ~24px — never set it smaller, and never on a form input.

| Use | Size | Tracking | Leading | Weight |
|---|---|---|---|---|
| H1 hero | clamp(2.75rem, 6vw, 4.75rem) | `-0.022em` | 1.04 | 300–400 |
| H2 section | clamp(1.875rem, 4vw, 2.75rem) | `-0.014em` | 1.1 | 400 |
| H3 entry title | 1.625rem | `-0.008em` | 1.2 | 500 |

### Spectral — body & reading (the workhorse)

| Use | Size | Tracking | Leading | Weight |
|---|---|---|---|---|
| Body prose (reader) | 1.125rem | `-0.001em` | 1.85 | 400 |
| Italic prose | 1.125rem italic | `0` | 1.85 | 400 |
| Inputs / values | 1rem | `0` | 1.5 | 400 |

### Inter — residual UI

| Use | Size | Tracking | Weight |
|---|---|---|---|
| Body UI | 0.94rem | `-0.002em` | 400 |
| Button | 0.94rem | `0` | 500 |

### Space Mono — archival & labels

| Use | Size | Tracking |
|---|---|---|
| Eyebrow / label | 0.7rem | `0.32em` UPPER |
| Date | 0.78rem | `0.04em` |
| Pledge number | 0.94rem | `0.06em` |

---

## Current reality

The live UI (`cloudflare/frontend`, deployed to heirloom.blue) is the **cloth/loom** subsystem skinned in **Cormorant / Spectral / Space Mono + copper-on-ground**. The `Horizon`/`NameRoll`/`Fire`/`Bundle` component set named in older drafts of this file no longer exists — it was superseded by `ClothCanvas3D` + `CosmicLoom` (the glowing filament web). Verify any visual claim against the live bundle (`src/styles/globals.css` + `tailwind.config.js`), not against this prose: docs lag the deployed UI.

---

## What this is not

This is not the *final* design. A real designer with paint will still bring craft I cannot — the copper accent may want fine-tuning, the Cormorant display sizes may need physical-typography eye-testing, and the cloth itself can be deepened. But what we ship now is **defensible**. It reads as authored. It does not read as amateur because it does not pretend to do what amateurs reach for.

— end direction —
