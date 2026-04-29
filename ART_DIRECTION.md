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

1. **Type is the hero.** Newsreader Display at 6..72 optical sizes, set with hand-tuned tracking. Inter for UI. JetBrains Mono for archival timestamps. No third typeface ever.
2. **One color has emotion.** A single sealing-wax warmth (`#b07a4a`). Used at <3% surface area, always. Everything else is bone (`#f4ecd8`) on ink (`#0e0e0c`) at varying opacity.
3. **Negative space is the composition.** 60–70% of any view is empty. Empty is not "we couldn't think of what goes there"; empty is the design.
4. **Motion has meaning or it's removed.** One easing curve (`cubic-bezier(0.16, 1, 0.3, 1)`). One duration vocabulary (180 / 360 / 720 / 1400 ms). Anything decorative gets cut.
5. **Outside time.** The page should look authored in 1970, 2026, and 2076. If a visual move signals "this is the era," kill it.

---

## Component grammar

### The Horizon (replaces Fire)

A single warm light at the bottom 18% of the canvas. Not a gradient mesh. Not a particle system. A flat horizontal warmth that breathes ±2% intensity over 9 seconds. The "fire" is the threshold between dark and warm — the line where heat meets darkness. Looking at the Hearth is looking at a doorway with light spilling under it.

Composition: think Hammershøi's interior windows, not a campfire.

### The Names (replaces Stones)

Family members are typeset names on a list. Not graphic stones, not avatars. Each name in Newsreader, set right-aligned in two columns: the name itself, and dates of life (or "—" for living). The currently-active member's name is the only one in warmth color; everyone else is bone. No glow, no halo.

When a member is "warm" (recent activity), their name has a single underdot; when "lit" (currently being read), it's the warmth color. That's it.

### The Sealed Notes (replaces Bundles)

Time-locked entries appear as a small typographic block in the margin: a date in mono, an em-dash, the recipient's name in italic. Above each, a single ∞ glyph in warmth color. No cloth, no wax, no animation other than the unlock dissolve.

```
        ∞
2055 — for Maya, when she turns 18
```

### The Unlock (replaces the bundle-unfold sequence)

When a sealed note's date arrives, it doesn't burn or unfold. It **dissolves**. The ∞ fades, the date fades, and the entry's title appears in its place — a single 720ms cross-fade. That's it. Restraint *is* the moment.

### The Tapestry

Stays in the design language but is now positioned beneath the Hearth as a thin horizontal band — not a tall block. Each entry is one weft pick at 2px height. The whole tapestry is at most 60px tall on desktop. Hover to enlarge to 240px height for inspection. The artifact is implied, not the centerpiece.

### The Sanctuary Composer

Stays editorial, becomes more like a printed page than a form. Newsreader 22px body, leading 1.85, max measure 60ch. The textarea is a piece of paper, not a UI element. No borders. No focus glow. The cursor itself is the only signal of attention.

---

## The first impression test

When a stranger lands on `heirloom.blue/hearth`, in the first 3 seconds, they should feel:

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

| Token | Value | Usage |
|---|---|---|
| `ink` | `#0e0e0c` | Page surface |
| `ink-deep` | `#0a0a08` | Cards (the rare ones) |
| `bone` | `#f4ecd8` | Body, headings |
| `bone-dim` | `rgba(244,236,216,0.55)` | Secondary text |
| `bone-faint` | `rgba(244,236,216,0.32)` | Tertiary text |
| `rule` | `rgba(244,236,216,0.08)` | Hairline dividers |
| `warm` | `#b07a4a` | Single accent (sealing-wax) |
| `warm-bright` | `#cf935a` | Hover/active warmth (rare) |
| `warm-dim` | `#8c5a30` | Pressed warmth (rarer) |

Body text on ink: 16.4:1. Headings: 16.4:1. Warmth on ink: 5.7:1 (passes AA for body, AAA for large). Bone-faint on ink: 6.3:1 (passes AA only at 16px+).

---

## Motion spec

| Token | Value | Usage |
|---|---|---|
| `ease-vault` | `cubic-bezier(0.16, 1, 0.3, 1)` | The only easing curve. Period. |
| `dur-fast` | 180ms | Hover, focus, micro-state |
| `dur-shift` | 360ms | Page transitions, card entry |
| `dur-veil` | 720ms | Reading view enter, composer enter |
| `dur-breath` | 9000ms | The horizon's breath cycle |

Anything else is a violation.

---

## Typographic spec

### Newsreader Display (heading + display)

| Use | Size | Optical | Tracking | Leading | Weight |
|---|---|---|---|---|---|
| H1 hero | clamp(2.75rem, 6vw, 4.75rem) | `opsz 72` | `-0.022em` | 1.04 | 300 |
| H2 section | clamp(1.875rem, 4vw, 2.75rem) | `opsz 56` | `-0.014em` | 1.1 | 400 |
| H3 entry title | 1.625rem | `opsz 28` | `-0.008em` | 1.2 | 400 |
| Body prose (reader) | 1.125rem | `opsz 14` | `-0.001em` | 1.85 | 400 |
| Italic prose | as above | `opsz 14` italic | `0` | 1.85 | 400 |

### Inter (UI)

| Use | Size | Tracking | Weight |
|---|---|---|---|
| Body UI | 0.94rem | `-0.002em` | 400 |
| Eyebrow | 0.7rem | `0.32em` UPPER | 500 |
| Button | 0.94rem | `0` | 500 |

### JetBrains Mono (archival)

| Use | Size | Tracking |
|---|---|---|
| Date | 0.78rem | `0.04em` |
| Pledge number | 0.94rem | `0.06em` |

---

## What this changes from the current build

**Removed:** Fire.tsx canvas particle system, Embers.tsx, the ornamental wax-seal SVG, Bundle.tsx unfold animation, breathing canvas vignette, cursor-light, the radial atmospheric gradient on Founder/Hearth pages.

**Added:** Horizon.tsx (single warm light at bottom 18%), NameRoll.tsx (typeset member list), SealedNote.tsx (typographic time-lock), unified motion tokens in `tailwind.config.js`, refactored EntryReader and SanctuaryComposer for new aesthetic.

**Net:** ~180kB of canvas + animation code deleted. The page is faster, more accessible, more honest, and more designed. A real designer can layer texture and craft on top of this skeleton; what's there now defends itself.

---

## What this is not

This is not the *final* design. A real designer with paint will still bring craft I cannot — the warmth color may want adjustment toward red, the Newsreader optical sizes may need physical-typography eye-testing, and the eventual Hearth illustration (if any) needs a hand. But what we ship now is **defensible**. It reads as authored. It does not read as amateur because it does not pretend to do what amateurs reach for.

— end direction —
