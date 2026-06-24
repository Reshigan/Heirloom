# Heirloom — Email Design System

> Email is the only Heirloom surface that arrives **uninvited, into a stranger's client**. It must
> survive Gmail clipping, Outlook's Word renderer, Apple Mail dark inversion, and a 78-year-old
> grandmother's default-zoom inbox — and still feel *held*. This file governs every email Heirloom
> sends. It is downstream of, and bound by, `brand/BRAND.md` and `brand/_SYSTEM.json`. Where an email
> client forces a compromise, the compromise must still obey the brand's two fixed truths: lead with
> arrival-of-love never loss, and **ember = NOW, dye = WHO, sealed/past content is quiet — never
> ember.** When in doubt, render quieter.

---

## 1 — Client reality & hard constraints

Email is not the web. We design to the floor, not the ceiling.

| Constraint | Rule |
|---|---|
| **Layout engine** | Nested `<table>` only. No flex, no grid, no float. One 600px centred warp table. |
| **Styling** | **Inline `style=""` on every element.** `<style>` blocks are stripped by Gmail clipping and many webmail clients — never depend on them. No external CSS, no `<link>`. |
| **Width** | Body table **600px** max; cells use explicit `width`. Mobile reflows via `width:100%;max-width:600px`. |
| **Images** | Decorative imagery is **forbidden** (brand do-not #13: no stock photography in email). The mark ships as **inline SVG**, with a bone Unicode/text fallback. Never rely on a remote image to carry meaning — images-off must still read whole. |
| **Fonts** | Web fonts do not load reliably in email. Use **web-safe fallback stacks** (§4) that echo the four brand families. Body text is **≥17px everywhere** — non-negotiable for multigenerational legibility. |
| **Dark mode** | Apple Mail / Outlook auto-invert. Set **both `bgcolor` attribute and inline `background-color`**, and keep text contrast AA in the inverted state. Our dark ground (`#0b0907`) is already near-black, so we ship dark-first and let light clients see warm ink-on-bone; we never depend on a colour the client may flip. |
| **No JS, no forms, no video, no web-fonts-as-meaning, no spinners, no toasts.** | Status and choices are plain bone links/buttons. |
| **Tracking** | No open-pixel theatrics or read-receipt-as-performance (brand do-not #9). A single quiet delivery confirmation is acceptable; never surfaced to the family as a score. |

---

## 2 — The mark in email (inline SVG)

The **Warp-and-Weft mark** ships inline so it survives images-off. Master geometry is copied from
`BRAND.md §8` (viewBox `0 0 192 192`): three bone warps at x=64/96/128, two interlacing bone wefts at
y=72/120, the centre warp crossing OVER both wefts at x=96, and the **single ember knot** (radial halo
r=40 @ ~0.4 alpha behind a solid pip r=12, `#f0c074`→`#e0a062`) at the held centre (96,96). In email we
render it at 44–56px.

**Knot colour is the one variable that changes by email tone:**
- Normal emails: ember knot (`#e0a062` / `#f0c074`) — the live present.
- **death-verification & release-to-recipient: the knot is rendered BONE** (`#f2e6d0`), never ember.
  These are not the live present; they are reverent. ZERO ember anywhere in those two emails.

Images-off fallback: if SVG fails (a few older clients), the lockup degrades to the bone wordmark
*Heirloom* alone (see §4 display stack). Never an image `alt` that says "logo"; the wordmark IS the
fallback.

**Lockup in email:** inline-SVG mark tile at left, wordmark *Heirloom* to its right in the display
stack, lowercase except a capital `H`, optical gap ~0.6× cap-height. Centred at the top of every email.

---

## 3 — The 600px warp-grid layout

Every email is one centred 600px table — the digital warp.

```
[ outer table  bgcolor=#0b0907  width=100% ]
  [ inner table width=600 centred ]
    row 1  · 40px top quiet margin
    row 2  · mark lockup, centred
    row 3  · 32–48px quiet margin
    row 4  · the one display line (Fraunces stack), ≤66ch measure
    row 5  · body prose (Source Serif 4 stack), 17px/1.6, max ~520px text width
    row 6  · the dye-margin block  ← 3px left border in the member's --dye, padding-left 20px
    row 7  · the ONE ember CTA (only on non-sensitive emails)
    row 8  · 40px quiet margin
    row 9  · mono colophon footer (JetBrains-stack, uppercase, +0.12em, bone-faint)
    row 10 · 40px bottom quiet margin
```

- **Left warp line:** content hangs off a left edge; the dye-margin block makes that warp literal with a
  3px left border in the relevant member's dye.
- **Measure:** prose column never exceeds ~66ch; set text cells to ~520px inner width inside the 600px
  table.
- **Rhythm:** 8px base (4px sub-grid). Quiet margins cluster at 16 / 24 / 32 / 40 / 48px.
- **Negative space:** ~55–60% empty, warm and inhabited — never the austere 70% vault.

---

## 4 — The four-family web-safe fallback stack (body ≥17px)

Web fonts are unreliable in email, so each brand family maps to a web-safe stack that holds its job.

| Brand role | Brand font | Email web-safe stack | Email settings |
|---|---|---|---|
| **Display / Voice** | Fraunces | `Georgia, 'Times New Roman', Times, serif` | ≥24px, weight 400, letter-spacing −0.01em. Hero/display line, the Listener prompt, sealed/release copy. Never running body. |
| **Reading / Prose** | Source Serif 4 | `Georgia, Cambria, 'Times New Roman', serif` | **17px / line-height 1.6.** The memory-body workhorse. |
| **UI chrome** | Inter | `-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | Buttons, links, small labels. ≥15px (≥17px when it carries reading weight). |
| **Archival / Metadata** | JetBrains Mono | `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace` | UPPERCASE, letter-spacing 0.12em, tabular figures. Dates, thread IDs, colophon, generation counts. Used sparingly. |

Body is **≥17px everywhere**. Display sits at ≥24px (its optical floor) and is never used for running text.

---

## 5 — Colour rules (dark default + AA-lifted light)

Hex is copied verbatim from `BRAND.md §6.3`. Email ships **dark-first** (our ground is near-black, safe
under auto-invert) and supplies AA-lifted copper for any light-rendered client.

**DARK (default ground — "ink"):**

| Token | Hex | Email use |
|---|---|---|
| `ink` (ground) | `#0b0907` | Outer + inner table `bgcolor` + `background-color` |
| `surface` | `#16110c` | Raised block (dye-margin block, CTA plate) |
| `elevated` | `#1e1812` | Choice plates in verification |
| `bone` | `#f2e6d0` | Primary text |
| `bone-bright` | `#faf3e4` | Display emphasis |
| `bone-dim` | `rgba(242,230,208,0.72)` | Secondary text |
| `bone-faint` | `rgba(242,230,208,0.44)` | Colophon, hairlines, hints |
| `rule` | `rgba(242,230,208,0.11)` | Hairline dividers / the warp line |

**EMBER — the one accent (means "now"):** `ember #e0a062` · `ember-bright #f0c074` · `ember-dim #b07a3e`
· `ember-shadow #8a5a2a`. **Under 5% of any surface.** Reserved in email for: the single primary CTA and
the Listener prompt, and the mark's knot. **Never** on death-verification or release-to-recipient.

**blood** (destructive only, muted, never a bright-red tell): `#9f3a2a`. Not used as urgency colour and
never near sealing/verification/release.

**LIGHT ("vellum") — for clients that render light:** vellum ground ≈ `#f6ecda`; text ink `#0b0907`. Any
copper on vellum must use the **AA-lifted light copper** so it clears 4.5:1 — use **`#9a6420`** for copper
text/links on vellum (do not use raw `#e0a062` on light, it fails AA). Dyes on vellum use the
`--dye-text (vellum)` column below.

---

## 6 — The canonical 10-dye table (copied verbatim from BRAND.md §6.4)

The single source of truth. Dyes appear ONLY as the **3px left warp margin + name text** — never fills,
buttons, or backgrounds. `--dye-text` is the AA-tuned name colour (clears 4.5:1 in its ground).

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

In templates, the dynamic dye is injected as `{{dye_hex}}` (the `--dye (ink)` value, for the 3px warp
margin) and `{{dye_text}}` (the `--dye-text (ink)` value, for the member's name). The build picks the
correct ink/vellum column for the recipient's theme.

---

## 7 — Voice rules in email (from BRAND.md §4)

1. **Arrival-of-love, never loss.** Lead with the person and the kept thing, never "after you're gone."
2. **Present tense, second person, name a real person.** `{{member_first}}`, `{{recipient_first}}`.
3. **Kept-vocabulary only:** keep · pass on · held until · opens when · choose your thread · the Listener
   · the Bloodline · keeper/Successor · woven in. **Banished:** death · deceased · memorialize · legacy
   data · vault · secure your legacy · before it's too late · countdown · expires · streak · last chance.
4. **No urgency, ever.** No countdowns, scarcity, streak guilt, FOMO. Forbidden absolutely near sealing,
   verification, release, and pricing.
5. **No gamification.** No points, badges, completion %, streaks, read-receipts-as-score. Reinforcement is
   relational: *"Maya read your kitchen story."*
6. **Verification = calm caretaking.** *"A quiet note — just confirming all is well. No action needed if it
   is. Take your time."*
7. **AI is a labelled midwife, never a ventriloquist.** Never generate words in a real person's voice.

---

## 8 — Per-email accent & tone table

| Email | Knot | Ember CTA | Dye warp line | Marketing footer | Tone |
|---|---|---|---|---|---|
| **welcome** | ember | yes — one | recipient's chosen dye | yes (mono colophon) | warm arrival; introduces the chosen dye; tonight's Listener |
| **kin-joined** | ember | one (soft) | the new member's dye | yes (mono colophon) | reciprocity, welcome — never "+1" / gamified |
| **check-in-reminder** | ember | one (soft) | recipient's dye | yes (mono colophon) | gentle keepership check-in; NO countdown, NO urgency colour |
| **entry-unlocked** | ember | one ("read it") | the author's dye | yes (mono colophon) | calm, inviting; a date-sealed note opened, author alive |
| **death-verification** | **BONE** | **none** — two equal bone choices | **the MEMBER's dye** | **none** — quiet mono lineage line + human mailto only | calm caretaking; never assumes a passing; reversible; waiting period + undo + separate final confirmation |
| **release-to-recipient** | **BONE** | **none** — one quiet bone link | the author's dye | **none** — no chrome, no upsell | the most delicate object; reverent, present-tense; an arrival of something kept; take your time |

**Governing line:** ember = NOW; dye = WHO; sealed/past/reverent content is quiet bone — never ember.

---

## 9 — QA checklist (every email, before send)

- [ ] Renders whole with **images OFF** — the inline-SVG mark degrades to the bone wordmark; no meaning lost.
- [ ] **Body text ≥17px**, line-height 1.6; display ≥24px and never used for running body.
- [ ] Every element carries **inline `style`**; no dependency on `<style>` blocks (test in Gmail clipped view).
- [ ] Outer + inner table set **both `bgcolor` and inline `background-color`** = `#0b0907`.
- [ ] **Apple Mail / Outlook dark-mode** checked — no inverted text drops below AA, no white box behind the mark.
- [ ] **Ember under 5%** of surface and only on a non-sensitive CTA / the Listener / the knot.
- [ ] **death-verification & release-to-recipient carry ZERO ember** — knot is bone, no copper anywhere.
- [ ] Dye appears ONLY as the 3px left warp margin + the member's name colour — never a fill/button/background.
- [ ] Dye hex matches the §6 canonical table exactly (correct ink/vellum column for the recipient theme).
- [ ] **No countdown, no urgency colour, no streak/points/badge, no scarcity** anywhere.
- [ ] **No banished words** (death/deceased/memorialize/vault/legacy data/etc.); kept-vocabulary only.
- [ ] death-verification offers **two equal reversible bone choices**, promises a **waiting period + undo + a
      separate final confirmation**, gives a **human mailto**, never says "deceased," carries no countdown,
      no marketing footer.
- [ ] release-to-recipient is **present-tense, names author + recipient**, has **one quiet bone link**, a
      **take-your-time line**, **no marketing footer, no upsell, no ember**.
- [ ] Light/vellum render uses **AA-lifted copper `#9a6420`** and the vellum dye-text column.
- [ ] No web fonts depended on; the four web-safe stacks (§4) are used; mono colophon is uppercase +0.12em.
- [ ] Links are real `https://heirloom.blue/...` URLs; mailto for human support resolves.
- [ ] No stock photography, no glassmorphism, no spinner, no toast, no decorative emoji, no icon-library glyph.

*Heirloom. Some things are meant to be kept.*
