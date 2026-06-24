# Heirloom — Website Redesign Spec

> The marketing + key-screen direction for `heirloom.blue` on the contemporary brand. This
> file is downstream of and bound by [`brand/BRAND.md`](../BRAND.md) and
> [`brand/_SYSTEM.json`](../_SYSTEM.json). Where this spec and the Brand Book disagree, the
> Brand Book wins — fix this file. Where the code and this file disagree, fix the code.
>
> **Product truth (fixed):** Heirloom is a perpetual, append-only, multi-author,
> multi-generational family Thread. Web at `heirloom.blue` + installable PWA.
> **Commercial facts (frozen):** Free $0 · Family $6.99/mo · $69/yr · Founder $249 role-only
> (withdrawn from sale) · ZAR localization untouchable. No A/B pressure on price, ever.
>
> One sentence to govern the whole site: **the landing page must make a stranger feel *held*
> before it asks them for anything.**

---

## 0 — The job of this site

The website has exactly one emotional job and one functional job, in that order.

1. **Emotional:** make a 34-year-old new parent and their 78-year-old grandmother both feel
   *held* and both find it beautiful and easy. (Brand essence: **Held.**)
2. **Functional:** get the right person to *begin a Thread* — without a single countdown,
   scarcity cue, streak, or drop of fear.

Everything below serves those two jobs. If a section, animation, or word does neither, it is
cut. We never behave like quarterly-growth SaaS; the thousand-year promise dies the instant we
do.

---

## 1 — Token & Component Contract

These are the **only** values the marketing site may use. All pulled verbatim from
`BRAND.md` §6 / `_SYSTEM.json`. No new colours, no new fonts, no off-system spacing.

### 1.1 Colour tokens (build hex)

**Dark — default, "ink":**

| Token | Hex | Use on site |
|---|---|---|
| `ink` (ground) | `#0b0907` | Page ground |
| `abyss` | `#090706` | Deepest recess (footer, behind cloth) |
| `surface` | `#16110c` | Raised paper plane (cards, pricing panel) |
| `elevated` | `#1e1812` | Hover-raised card, modal |
| `hover` | `#261e15` | Hover state fill |
| `bone` (primary text) | `#f2e6d0` | Body, most headlines |
| `bone-bright` | `#faf3e4` | Hero word emphasis |
| `bone-dim` | `rgba(242,230,208,0.72)` | Secondary text |
| `bone-faint` | `rgba(242,230,208,0.44)` | Tertiary / hints / mono stamps |
| `rule` | `rgba(242,230,208,0.11)` | Hairlines, the warp line, dividers |

**Ember — the one accent (copper-amber, means "NOW"):**

| Token | Hex | |
|---|---|---|
| `ember` | `#e0a062` | Base accent |
| `ember-bright` | `#f0c074` | Highlight / mark pip core |
| `ember-dim` | `#b07a3e` | Pressed / hover-down |
| `ember-shadow` | `#8a5a2a` | Recede |

> **Ember budget: under 5% of any rendered surface.** On the marketing site ember is reserved
> for: the single primary CTA ("Begin a Thread"), the Listener prompt's live word, the
> convergence pip inside the Warp-and-Weft mark, and the one drawn ember weft in the hero. That
> is the entire list. **Ember = NOW.** If you are unsure whether an element earns ember, it does
> not.

**Destructive:** `blood #9f3a2a` — never used in marketing UI. Listed only so nobody reaches
for a brighter red.

**Light — "vellum":** vellum ground `oklch(0.96 0.014 75)` ≈ `#f6ecda`; text ink `#0b0907`.
The copper accent on vellum must use the AA-lifted light family (the dual `--warm` /
`--loom-warm` tokens both raised) so it clears 4.5:1.

### 1.2 The ten dyes — signal only (canonical table, do not re-derive)

Dyes appear on the site in exactly two places: a member/quote **name colour** and the **3px
left warp-margin thread** beside a quote. Never as a fill, button, badge, or background.

| Dye | Meaning | `--dye` (ink) | `--dye-text` (ink) | `--dye` (vellum) | `--dye-text` (vellum) |
|---|---|---|---|---|---|
| madder | joy | `#d94f38` | `#d94f38` | `#b54230` | `#ab3e2d` |
| cochineal | grief | `#8a5578` | `#a2678e` | `#744764` | `#744764` |
| kermes | love | `#c46a7a` | `#c46a7a` | `#a55867` | `#934e5c` |
| saffron | achievement | `#d4a32f` | `#d4a32f` | `#b08826` | `#7b5f1b` |
| weld | daily | `#c9941f` | `#c9941f` | `#a87a18` | `#805d12` |
| walnut | travel | `#7d5635` | `#a16f44` | `#68472c` | `#68472c` |
| oakgall | record | `#6d8a56` | `#6d8a56` | `#5a7347` | `#526941` |
| woad | contemplation | `#4f8a8a` | `#4f8a8a` | `#427373` | `#3d6a6a` |
| indigo | reflection | `#46679c` | `#577bb4` | `#3a5582` | `#3a5582` |
| iron | ending | `#56707a` | `#617e8a` | `#485e66` | `#485e66` |

Name text always uses `--dye-text` (AA-tuned for the active ground); the 3px warp margin always
uses `--dye`. The two are different values on purpose — keep both.

### 1.3 Type contract

Four roles, no exceptions. **Cormorant is forbidden** (the dated vault tell).

| Role | Family | Settings | On the site |
|---|---|---|---|
| **Display / Voice** | **Fraunces** (variable) | `opsz` ~110–120 at hero · weight ~360 · `SOFT` 0 · `WONK` 0 · tracking −0.01em | Hero lines, every section headline, the Listener prompt, sealed/release copy, the wordmark. **Never below ~24px. Never running body.** |
| **Reading / Prose / Inputs** | **Source Serif 4** (variable) | 17px / 1.6 | All paragraph copy, quoted memories, FAQ answers, form inputs. The hundred-year-letter workhorse. |
| **UI chrome** | **Inter** (variable) | tall x-height, calm | Buttons, nav links, footer links, form labels, pricing fine print. |
| **Archival / Metadata** | **JetBrains Mono** | UPPERCASE · +0.12em tracking · tabular numerals | Dates, generation counts, keepership roles, thread IDs, the footer colophon, the OG stamp. Used sparingly. |

Type scale is fluid (clamp-based) — ~1.5 ratio at display, ~1.2 in body. **Body is ≥17px
everywhere** — multigenerational legibility is non-negotiable.

Wordmark: *Heirloom* in Fraunces, `opsz` ~110, weight ~360, all lowercase except a capital
`H`, tracking −0.01em. The two adjacent `o`s may optionally render as two small woven cells —
a quiet, never-required flourish.

### 1.4 The mark

The **Warp-and-Weft mark** — one over-under woven cell, three warps × two wefts, a single ember
knot pip at the held centre `(96,96)`. It is bone-on-ink (or ink-on-vellum) + the one ember
knot, always. Never recoloured to a dye, never a second glow, never the bare `∞`, never an icon
glyph. Full geometry law in `BRAND.md` §8. Shipped assets:
`brand/mark/heirloom-mark-192.svg`, `…-favicon-48.svg`, `…-maskable-512.svg`,
`…-lockup-vellum.svg`. The site nav uses the horizontal lockup; the favicon/PWA icons use the
shipped tiles.

### 1.5 Component contract (the only marketing components)

| Component | Built from | Rules |
|---|---|---|
| `<MarkLockup>` | shipped lockup SVG | nav + footer only; mark height = cap-height of the `H`; gap ≈ 0.6× cap-height. |
| `<DisplayLine>` | Fraunces voice | section headlines; fluid clamp; never <24px. |
| `<Prose>` | Source Serif 4 | 17px/1.6, max 66ch measure. |
| `<EmberButton>` | Inter label on `ember` fill (or ember hairline outline) | **one per viewport max**; the only ember-filled element; label always a soft verb ("Begin a Thread"). |
| `<QuietLink>` | Inter, `bone-dim` → `bone` on hover, ember hairline underline grows on hover only | every secondary action. Never ember-filled. |
| `<QuoteThread>` | `Prose` quote + 3px `--dye` left margin + `--dye-text` name + mono date | the memory specimen; the dyes' only marketing appearance. |
| `<MonoStamp>` | JetBrains Mono, `bone-faint`, uppercase +0.12em | dates, gen counts, the footer colophon, section index numbers. |
| `<ProgressHair>` | 1px ember hairline | any loading. **No spinners.** |
| `<Spectrum>` | woven `--dye` colour-bar from real family data | OG cards + (future) family Book cover. §6. |

Inline status only — **no toasts**. Identity shows as name-in-dye-text — **no avatar circles,
no `rounded-full` chips**. No icon library, no decorative emoji.

---

## 2 — The Three-Second Test, made concrete

A stranger lands cold. In the first **three seconds**, before scrolling, before reading a full
sentence, the page must deliver four signals. This is the acceptance test for the hero — if any
one fails, the hero is wrong.

| # | In 3 seconds they must register… | Delivered by | Pass condition |
|---|---|---|---|
| 1 | **"This is warm and human, not a tech vault."** | warm ink ground (`#0b0907`), bone serif (`#f2e6d0`), one ember weft drawing across, real woven-cloth texture | no cold blue, no grid dashboard, no glass; the cloth is visibly *cloth* |
| 2 | **"This is about my family and keeping it."** | the hero line *"Some things are meant to be kept."* in Fraunces | the word *kept* lands before any feature word |
| 3 | **"This is mine / about people, not data."** | one `<QuoteThread>` specimen with a dye margin + a real first name | a human name in a dye colour is visible above the fold |
| 4 | **"There is one calm thing to do."** | the single `<EmberButton>` "Begin a Thread" | exactly one ember element in view; no competing CTAs |

The negative test is equally binding — in those three seconds the stranger must **not** see: a
countdown, a price, the word *death*/*legacy*/*vault*, a spinner, a cookie wall over the hero, a
stock photo of a smiling family, or more than one ember thing. If any appear, the hero fails.

---

## 3 — Navigation & Information Architecture

The site is a **single long scroll** (the eight sections in §4) plus a thin set of routed pages.
The scroll *is* the argument; the routes are the utilities.

### 3.1 Top nav

Minimal, calm, **no global tab bar / dashboard chrome** (forbidden by the cloth system). Left:
`<MarkLockup>` → scrolls to top. Right, in Inter `bone-dim`: **The story** (anchor),
**Pricing** (anchor), **Sign in** (`<QuietLink>`), and one **`<EmberButton>` Begin a Thread**.
That ember button is the only ember in the nav and the page's single repeating CTA. On scroll
the nav stays but never grows a shadow stack or a sticky banner; at most a 1px `rule` hairline
appears under it.

### 3.2 Routes (utilities, off the scroll)

| Route | Purpose | Notes |
|---|---|---|
| `/` | the 8-section landing scroll | this spec |
| `/begin` | the First-Thread ceremony entry | existing ceremony; new signups flow through it |
| `/pricing` | full pricing detail | mirrors §5 exactly; ZAR localization; **no countdowns** |
| `/story` *(opt)* | long-form "why we built a loom" | in-voice; never an estate-planning angle |
| `/help`, `/privacy`, `/terms` | utility | Source Serif 4 prose, mono section stamps |
| `/release/:token` | the after-passing release surface | **no marketing chrome, no ember**; recipient controls *when* (`BRAND.md` §10) |

### 3.3 IA principles

- **One primary action sitewide:** *Begin a Thread*. Everything else is a `<QuietLink>`.
- **No fear navigation.** No "secure your legacy" menu item, no estate/death section.
- **Footer** is the archival colophon: `<MonoStamp>` with the wordmark, the established line
  *"Built to outlast everyone who uses it."* (durability proof-point, quiet, never a headline),
  legal links, and a theme toggle (ink ⇄ vellum). The demoted *"Start your family's
  thousand-year thread"* may appear **once here**, low and quiet, as evidence of permanence —
  never above the fold.

---

## 4 — The Landing Scroll Story (8 sections)

Each section: **one Fraunces headline**, a short `Prose` body, and **exactly one ember
moment** (named). Ember never appears twice in one viewport. Headlines are in-voice — present
tense, second person, a real named person where it lands. Section index numbers are
`<MonoStamp>` (`01 / 08` … `08 / 08`).

---

### Section 01 — Hero · *The held opening*

**Headline (Fraunces, hero `opsz`):**

> # Some things are meant to be kept.

**Sub-line (Source Serif 4):** *Keep your family's story going — across generations. Written,
spoken, and passed on.*

**Visual:** the woven-cloth home plane (real macro warp/weft texture, abstract and premium —
never yarn balls or samplers). On load the cloth **draws one ember weft across (~1400ms,
stiffness ~170 / damping ~26) then rests**. Nothing loops.

**Single ember moment:** the **drawn ember weft + the `<EmberButton>` "Begin a Thread"** read as
the same warm present. (These count as one ember zone; the weft settles, the button remains.)

**Secondary:** `<QuietLink>` *"See how it works"* (scrolls to 02). No price, no countdown, no
sign-up urgency here.

---

### Section 02 — The Listener · *The daily way in*

**Headline:**

> # What did your mother always say in the car?

**Body:** *One quiet question a day. You answer in a sentence, a voice note, or not at all.
That's how a Thread grows — a little, on the days you feel like it.* (No streak, no "you
 haven't written in 5 days".)

**Visual:** a single Listener card on the warm paper plane — the prompt itself, large, calm.

**Single ember moment:** the **live word of the prompt** rendered in ember — the Listener is
the one place ember marks "answer this *now*." The rest of the card is bone.

---

### Section 03 — The Composer · *Write, speak, record*

**Headline:**

> # Tell your daughter what the kitchen smelled like.

**Body:** *Type it, say it out loud, or record your voice. A hundred-year-old letter should
read like a letter — so your words stay in Source Serif, never in app-chrome.* No audience
counters, no quality score, no "great memories get more reads" (forbidden, `BRAND.md` §11.10).

**Visual:** the Composer specimen — Source Serif 4 input, a `<QuoteThread>` forming with its
author's dye margin appearing as the entry is "woven in."

**Single ember moment:** the **active compose cursor** (a single ember caret). Nothing else.

---

### Section 04 — Your colour for life · *Choosing your thread*

**Headline:**

> # Choose your thread.

**Body:** *When you join, you pick one of ten natural dyes — madder for joy, woad for
contemplation, iron for endings. It becomes your name's colour and your margin thread,
everywhere, for as long as the family lasts.* Dyes are **named, not numbered**.

**Visual:** the ten dyes shown as **ten 3px warp threads** down a left margin, each beside its
name in `--dye-text` and its meaning in mono. **No fills, no swatches-as-buttons** — signal
only, per the contract. This is the canonical dye table (§1.2) made visible, nothing new.

**Single ember moment:** **none on the threads** (dyes are WHO, never NOW). The lone ember is
the section's inline `<EmberButton>` *"Choose yours"* → `/begin`.

---

### Section 05 — The Bloodline & the Wall · *Many threads, one cloth*

**Headline:**

> # Everyone you love, weaving the same cloth.

**Body:** *Parents, children, the grandmother who tells the best stories — each one a thread,
all held in one Thread. Append-only: nothing is ever overwritten, only woven in. The family
owns it, not a single account.*

**Visual:** a Wall of several `<QuoteThread>` specimens, each in a different dye margin with a
real first name in `--dye-text` and a mono date — the Bloodline made concrete. A new thread
visibly **weaves into the warp** on scroll-in (the "woven in" motion), then settles.

**Single ember moment:** the **Family Spectrum bar** for this example family — the woven
colour-bar of exactly the dyes present in the quotes above. It is allowed a single ember
hairline baseline to read as "this family, alive now." (One ember stroke only.)

---

### Section 06 — Held until, opens when · *The reverent seal, handled with dignity*

**Headline:**

> # For Maya, when she turns 30.

**Body:** *Some things are meant to wait. You can hold a note for a date, a birthday, or to be
passed on when the time is right. We keep it safe and make sure it reaches exactly the person
you meant it for.* Lead with arrival-of-love, never loss. **No padlock, no hourglass, no
countdown, no "deceased."**

**Visual:** a `<QuoteThread>` rendered as a **folded weft** (the seal-as-cloth), with a
`<MonoStamp>` label `HELD UNTIL · 2031` — the reverent release lexicon set in Fraunces. The
seal is shown via the press-and-hold *fold* gesture still-frame, not a lock.

**Single ember moment:** **none.** This section is deliberately ember-free — sealed/past
content is quiet bone/dye, never NOW (the hierarchy rule, `BRAND.md` §6.5). The absence of
ember *is* the design.

---

### Section 07 — Pricing · *Plainly, never pressured*

**Headline:**

> # Everyone in. One price.

Full presentation in §5 below. Stated plainly: Free $0 · Family $6.99/mo or $69/yr · Founder
$249 (role only, withdrawn from sale). ZAR localization shown for ZA visitors, untouchable.
**No countdown, no scarcity, no "upgrade or lose," no A/B price pressure** (forbidden,
`BRAND.md` §11.12).

**Single ember moment:** the **one `<EmberButton>` on the Family plan** — the recommended,
everyone-in choice. Free and Founder use `<QuietLink>`s. Exactly one ember in the pricing
viewport.

---

### Section 08 — The quiet close · *Held, and an invitation*

**Headline:**

> # Keep the conversation going.

**Body:** *Ask someone tonight what their childhood bedroom smelled like. Then keep it — for
as long as your family lasts.* A soft, relational close — *"ask someone tonight,"* never *"sign
up now, limited spots."*

**Durability proof-point (quiet, mono, below the line):** *Built to outlast everyone who uses
it.*

**Visual:** the cloth, settled. A final `<MonoStamp>` colophon transitions into the footer.

**Single ember moment:** the final **`<EmberButton>` "Begin a Thread"** — the same calm action
that opened the page, closing the loop. One ember, then the footer goes quiet bone/abyss.

---

## 5 — Frozen Pricing Presentation

Three plans, presented as a single calm panel on the `surface` plane. **The numbers are frozen
and may not be A/B-tested, discounted, dressed with urgency, or reordered to manufacture
scarcity.** ZAR localization is untouchable — show ZAR to ZA visitors, never strip the
localization guard.

| Plan | Price | Framed as | CTA |
|---|---|---|---|
| **Free** | **$0** | *"Start a Thread. One bloodline, room to begin."* | `<QuietLink>` **Start free** → `/begin` |
| **Family** | **$6.99 / mo** · **$69 / yr** | *"Family — everyone in. Unlimited members, all the room a family needs."* | **`<EmberButton>` Choose Family** → checkout (the single ember in this view) |
| **Founder** | **$249** | *"The Founder role — for the member who began the Thread. Withdrawn from sale; the role is kept."* | `<QuietLink>` **Learn about the Founder** (role only — **no buy button**) |

Presentation rules:

- **No countdown, no "limited time," no fake discount, no strikethrough decoy price, no
  scarcity counter, no "X people upgraded today," no exit-intent pricing modal.** Categorically
  forbidden (`BRAND.md` §4.4, §11.1, §11.12).
- The yearly price is shown as a calm fact (*"$69/yr"*), not as *"save 18%! limited!"* The
  saving may be stated once, plainly, in `bone-dim`: *"two months held for you"* — no urgency
  verb.
- Trial behaviour: a trial that lapses **drops to Free** — it never "expires" or threatens loss
  of memories. Copy: *"Your trial eased back to Free. Everything you've kept is still here."*
- Mono fine print (`<MonoStamp>`): `PRICES SHOWN IN USD · ZAR AT CHECKOUT FOR ZA`.
- Founder field must remain present in the pricing data for the localization/role guard even
  though it is unbuyable — do not strip the `$249` FOUNDER field.

---

## 6 — OG / Share-Card System (incl. the per-family Spectrum bar)

Share cards are the brand's most-seen surface off-site. They are **ink-grounded, bone-typed,
ember-disciplined, and — when a real family is involved — carry that family's own Spectrum
bar.** No stock photography, ever.

### 6.1 Card anatomy (1200×630, OG/Twitter)

```
┌───────────────────────────────────────────────┐
│  [woven-cloth macro, low-contrast, ink-toned]  │  ← ground: ink #0b0907, real weave texture
│                                                 │
│   Some things are meant to be kept.             │  ← Fraunces, bone #f2e6d0, opsz high
│   ─────────                                     │  ← one short ember weft (the ONLY ember)
│                                                 │
│   ▌ "What the kitchen smelled like."   — Ada    │  ← <QuoteThread>: 3px --dye margin + --dye-text name
│                                                 │
│  heirloom · HELD · GEN 03            ▬▬▬▬▬▬▬▬▬   │  ← mono stamp (left) + Family Spectrum bar (right)
└───────────────────────────────────────────────┘
```

- **Ground:** ink `#0b0907` with the abstract woven macro texture (never a smiling-family
  stock photo, never glass).
- **Headline:** Fraunces, `bone`, the hero line by default; for a shared *entry* the entry's
  own first line may sit in the quote slot.
- **Quote thread:** Source Serif 4 quote, 3px `--dye` left margin, name in `--dye-text` — the
  one place dye appears on the card.
- **Mono stamp:** JetBrains Mono, `bone-faint`, uppercase +0.12em — `heirloom` wordmark + a
  reverent label (`HELD`, `WOVEN IN`, `GEN 03`) + tabular date/gen count.
- **The single ember moment:** one short drawn **ember weft** under the headline. Nothing else
  on the card is ember. On the after-passing release card, **ember is removed entirely**
  (`BRAND.md` §10).

### 6.2 The per-family Spectrum bar

The **Family Spectrum** is the woven colour-bar of the exact dyes a specific family contains —
a coat of arms generated from real data, so **every family's share card is literally theirs
alone.**

- It is built from the family's actual member dyes (the canonical `--dye` ink values, §1.2),
  woven left→right in join order as alternating warp/weft bands.
- Width is fixed; the band count = the number of distinct dyes in the family (de-duplicated).
- It appears bottom-right of the card, bottom of (future) Book covers as foil bands, and in the
  anniversary email footer.
- It is **signal, not decoration** — no gradient blending between bands, no glow, no animation
  on a static card. Hard woven edges only.
- A family with no members yet (a brand/default card) shows **no Spectrum** — it falls back to
  the plain mono wordmark stamp. The Spectrum is earned by real data; never faked.

### 6.3 Card variants

| Card | Headline slot | Ember | Spectrum |
|---|---|---|---|
| Default brand (`/`) | *Some things are meant to be kept.* | one ember weft | none (no family) |
| Shared family Wall | family name + gen count | one ember weft | **family Spectrum** |
| Shared entry | the entry's first line + author in dye | one ember weft | family Spectrum |
| Sealed note teaser | *Held until …* (mono label) | **none** (sealed = quiet) | family Spectrum, muted |
| After-passing release | *Someone left this for you.* | **none — ember forbidden** | family Spectrum, muted |

---

## 7 — React / Tailwind Build Notes

The deployed tree is `cloudflare/frontend/` (React 18 + Vite + TS + Tailwind). The landing
scroll extends the cloth system — **never add a global nav bar, tab bar, or dashboard grid on
top of the cloth.**

### 7.1 Tokens are the source of truth

- All colours come from CSS custom properties in `src/styles/globals.css` **and** the Tailwind
  utility map in `tailwind.config.js`. Keep both in sync — the project has a documented bug
  where an out-of-sync `tailwind.config.js` lets the old palette bleed into the bundle. **No
  raw hex in components** — use `text-bone`, `bg-ink`, `text-ember`, the dye tokens, etc.
- The light/dark bridge already exists (CSS token bridge in `globals.css`, vault/paper toggle).
  The marketing site reuses it; do not invent a new theming mechanism. The footer `ThemeToggle`
  drives ink ⇄ vellum across the whole scroll.
- Dyes ship as **paired** `--dye-*` / `--dye-*-text` variables that already re-resolve per
  theme. `<QuoteThread>` reads `--dye` for the 3px margin and `--dye-text` for the name. Do not
  hardcode dye hex.

### 7.2 Type

- Fraunces, Source Serif 4, Inter, JetBrains Mono loaded as variable fonts, `font-display:
  swap`, subset to Latin + the punctuation the copy uses. Self-host (same-origin) — the prod
  CSP has no third-party font origins, and same-origin assets survive the SW precache.
- Fraunces axis settings via `font-variation-settings` (`opsz`, `wght`, `SOFT 0`, `WONK 0`).
  Enforce the ~24px floor: any Fraunces utility class must clamp its minimum so it can never
  render below ~24px (the documented "Cormorant heading trap" lesson — display serif below its
  floor is unreadable).
- Body utilities lock to ≥17px / 1.6 and a 66ch `max-w` measure.

### 7.3 Motion (Motion / Framer)

- One spring config object exported once and reused: `{ type: 'spring', stiffness: 170,
  damping: 26 }` for entrances/layout; a `220ms` ease for micro-states. Durations only from
  `{180, 360, 720, 1400}`.
- The hero ember weft is a single SVG path `pathLength` draw over ~1400ms, then static.
  Section threads use the "woven in" entrance on scroll via `whileInView` with `once: true` —
  **nothing loops.**
- `prefers-reduced-motion`: fully honoured — `useReducedMotion()` short-circuits every weave;
  sections render settled, the cloth renders static. No spinners anywhere — loading is the 1px
  `<ProgressHair>` ember hairline. No toasts — inline status only.
- Use `LazyMotion` + the `m` component to keep the marketing bundle small; the landing route is
  eager, deeper routes lazy-loaded (the App.tsx convention).

### 7.4 PWA / deploy hygiene

- Bump the `CACHE` version in `public/sw.js` on any significant deploy — the browser
  byte-compares `sw.js`; an unchanged file means no update cycle and a stale PWA.
- Mark/maskable/favicon come from the shipped `brand/mark/*` SVGs; the maskable tile keeps the
  weave + ember knot inside the inner 80% safe circle so it survives iOS squircle + Android
  circle masks.
- OG cards rendered at the edge (worker) from the §6 template; the Spectrum bar is generated
  from the family's real member dyes server-side. Default brand card carries no Spectrum.
- Always smoke the **live** site after deploy — the prod CSP has no `unsafe-inline`, so inline
  scripts/handlers that work locally die in production. Keep scripts external + same-origin.

### 7.5 Accessibility

- All text clears **AA 4.5:1** in both grounds. `--dye-text` variants are the only dye values
  allowed on text and are pre-tuned for both grounds — never put a raw `--dye` on text.
- Ember on its ground is decorative-adjacent but the CTA label must still clear AA: the
  `<EmberButton>` uses ink text on the ember fill (which passes) or a bone label with an ember
  hairline outline.
- Single reading column, logical heading order (one `h1` — the hero line), every interactive
  element keyboard-reachable with a visible ember-hairline focus ring. No motion required to
  comprehend any content.

---

## 8 — Ship-Gate Checklist

The redesign does not ship until **every** box is true. Verify by looking at the rendered page,
not by intention.

**Brand fidelity**
- [ ] Colours come only from the §1.1 tokens; **zero raw hex** in components; `globals.css` and
      `tailwind.config.js` are in sync (old palette does not bleed into the bundle).
- [ ] Fonts are exactly Fraunces / Source Serif 4 / Inter / JetBrains Mono. **No Cormorant
      anywhere.** Fraunces never renders below ~24px; no running body in the display serif.
- [ ] Body type is ≥17px everywhere; prose measure ≤66ch.
- [ ] The dye table on the page matches §1.2 byte-for-byte (one canonical table). Dyes appear
      **only** as 3px margins + name text — no dye fills, buttons, or backgrounds.
- [ ] The mark is the shipped Warp-and-Weft (bone-on-ink + one ember knot). No glowing node,
      filament web, bare `∞`, or icon glyph. No second glow/bevel/shadow on the mark.

**Ember discipline**
- [ ] Ember is under 5% of every viewport; **at most one ember element per viewport.**
- [ ] Each of the 8 sections has exactly the one named ember moment (and §06 has *none*).
- [ ] Sealed/past/release surfaces carry **no ember.**

**The three-second test (§2)**
- [ ] In 3s the hero delivers warmth, family/keeping, a human dye name, and one calm action.
- [ ] In 3s the hero shows **no** countdown, price, death/legacy/vault word, spinner, stock
      family photo, or second ember.

**Voice & no-dark-patterns**
- [ ] All copy is present-tense, second-person, names a real person where it lands; leads with
      arrival-of-love, never loss.
- [ ] **No** countdown, scarcity, streak, FOMO, exit-intent modal, or urgency anywhere — and
      categorically none near pricing or any sealed/release surface.
- [ ] No banished words on any rendered surface: *death, deceased, memorialize, legacy data,
      vault, secure your legacy, before it's too late, expires, last chance, upgrade or lose.*
- [ ] No gamification: no badges, points, %, streaks, leaderboards, or read-receipts-as-score.
- [ ] AI (if shown) is labelled as a midwife to the user's own words — **no ventriloquism.**

**Pricing (frozen)**
- [ ] Free $0 · Family $6.99/mo & $69/yr · Founder $249 role-only, shown exactly; Founder has
      no buy button; the $249 FOUNDER field is **not** stripped from data.
- [ ] One ember CTA on Family; Free + Founder are `<QuietLink>`s.
- [ ] ZAR localization intact for ZA visitors; **no A/B price pressure, no decoy strikethrough,
      no fake discount.**

**Build / platform**
- [ ] No spinners (only `<ProgressHair>`); no toasts (inline status); no avatar circles /
      `rounded-full` chips; no icon library; no decorative emoji.
- [ ] Motion uses the one spring + the four durations; nothing loops; `prefers-reduced-motion`
      renders everything settled.
- [ ] AA 4.5:1 verified for all text in both ink and vellum; keyboard focus visible; one `h1`.
- [ ] OG cards render from the §6 template; family cards carry the per-family Spectrum;
      default brand card and release card carry no ember / no Spectrum-as-decoration.
- [ ] `public/sw.js` CACHE version bumped; fonts + scripts same-origin; **live** site smoked
      post-deploy (prod CSP has no `unsafe-inline`).
- [ ] `npm run build` (`tsc && vite build`) passes clean — the typecheck/launch gate.

---

*Heirloom. Some things are meant to be kept.*
