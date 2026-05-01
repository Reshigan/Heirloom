# Heirloom v3 — design spec

A working prototype at `/v3/*` for a frontend that takes the product
seriously as an institutional archive, not as a consumer app pretending
at gravity.

This is light-mode-first, single-column-first, type-first. It is not
trying to be ethereal or "premium." It is trying to be **correct** —
the way a well-bound book or a well-designed museum wall is correct.

---

## Seven principles

### 1. Library, not vault
The product feels like a private family library. Books, papers, well-bound
things. Not crypts, not constellations, not nebulae. Quiet competence.

### 2. Letterpress, not LED
Light comes from outside the page, not from inside the UI. No glowing
borders, no "ethereal" auras, no animated mist. The paper has texture;
the ink absorbs light.

### 3. Generations, not feeds
The dominant axis is generational, not chronological-per-session. Years
group into eras. Members are organized by descent, not by recency.

### 4. Read first, write second
The default mode is reading. Writing is a single discrete action a
couple of clicks deep — like writing in a real journal. We are not a
social product; we are not optimizing for posting frequency.

### 5. Signal over animation
Motion is reserved for state transitions that mean something: a lock
opening, an entry committing, a member joining. No idle animation.
No particle effects. Reduce-motion is honored everywhere.

### 6. Three faces of type
One serif (Newsreader, set on the page like a book). One mono
(JetBrains Mono, used for labels and rules). One handwriting (Caveat,
used sparingly for personal marks). No display sans, no decorative
script, no sans-serif body.

### 7. One accent
Two neutrals (paper, ink) and one accent (mark — a deep aged gold).
That is the entire palette. Errors borrow blood-red. There is no
brand secondary, no accent gradient, no extra "highlight" colors.

---

## Tokens

### Color (light mode is canonical)

| Token   | Hex       | Use                                                                |
| ------- | --------- | ------------------------------------------------------------------ |
| `bone`  | `#F4EFE6` | Page background. Warm off-white. Slightly aged.                    |
| `bone-2`| `#EAE3D4` | Subtle surfaces (cards, quoted blocks, sidebars).                  |
| `ink`   | `#1B1815` | Primary text. Near-black with warmth.                              |
| `char`  | `#66615A` | Secondary text, captions, metadata.                                |
| `edge`  | `#D5CCBA` | Hairline rules and dividers.                                       |
| `mark`  | `#92602B` | The single accent. Used for links, marginalia, lock icons.         |
| `blood` | `#8C2C2C` | Errors and destructive actions only.                               |

### Type scale

| Name        | Size    | Line height | Tracking   | Use                                |
| ----------- | ------- | ----------- | ---------- | ---------------------------------- |
| Display 1   | 5.5rem  | 1.0         | -0.02em    | Landing hero only.                 |
| Display 2   | 3.75rem | 1.05        | -0.018em   | Page headers.                      |
| Display 3   | 2.5rem  | 1.1         | -0.014em   | Section headers.                   |
| H4          | 1.5rem  | 1.3         | 0          | Subsection.                        |
| Body XL     | 1.375rem| 1.65        | 0.005em    | Reading column default.            |
| Body        | 1.0625rem| 1.65       | 0.005em    | Secondary body.                    |
| Caption     | 0.875rem| 1.5         | 0.02em     | Metadata, picture captions.        |
| Eyebrow     | 0.6875rem| 1          | 0.32em     | Uppercase mono labels.             |

### Space (4px base)

`0.5 / 1 / 2 / 3 / 4 / 6 / 8 / 12 / 16 / 24` — `rem` units.
Generous side margins are mandatory; never butt content against the
viewport edge below 768px width.

### Reading column

Max width: **640px** for prose, **800px** for prose-with-marginalia.
Hero and detail headers may run to **920px**.

### Motion

- Default: 220ms, `cubic-bezier(0.4, 0, 0.2, 1)`.
- Narrative transitions (page enter, lock opening): 460ms, same easing.
- `prefers-reduced-motion`: instant.
- No idle/looping animation. Ever.

### Borders & shadows

- Borders: 1px solid `edge`. Hairline only.
- Shadows: not used. (No drop shadows; surfaces are demarcated by hairlines and color.)
- Radius: 0 by default. The product is paper, not rounded plastic.
  Buttons may use 2px corner-rounding to soften clickability.

---

## What we deliberately don't do

- Gradients (except a single thin paper-edge wash on the landing).
- Glassmorphism / backdrop blur.
- Drop shadows on UI.
- Glow effects.
- Particles, animated mists, stars-drift.
- Decorative SVG backgrounds.
- Stock photography.
- Cards as the default container.
- Multi-column dashboards.
- Animated counters.
- Emojis in product UI.
- More than three font families on a page.
- More than one accent color.

---

## What we deliberately do

- Set every page on a single reading column unless there's a strong reason not to.
- Use generous whitespace as a structural element, not as filler.
- Prefer rules (`<hr>`) and small caps labels to dividers and pill chips.
- Treat dates and numbers like a typesetter would (not the way a chart
  library would).
- Italicize for emphasis, never bold.
- Hyphenate prose, set `text-wrap: balance` on headings.
- Show real content, not lorem ipsum, in every prototype.

---

## Pages prototyped at /v3

- `/v3` — landing
- `/v3/home` — quiet home / dashboard
- `/v3/thread` — read the thread
- `/v3/write` — compose

Each page links to the others; none link to the existing app surfaces.
This tree is parallel and disposable. If the design doesn't land, delete
the directory and the routes; nothing else depends on it.
