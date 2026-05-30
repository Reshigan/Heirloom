# Heirloom — Stitch Design Brief

---

## ⛬ Directive to Stitch / Claude design / any generative design agent

**Generate every screen in this brief in a single pass. Do not stop at 4 screens, 6 screens, or any batch limit. Do not paginate. Do not ask "shall I continue?"**

There are **27 distinct screens** (the public marketing surface in §5.1, the authenticated product in §5.2, the admin console in §5.3, plus the named state variations in §6). All of them are required. Generation is complete only when every path in §5 has at least one corresponding screen artifact, every state variation in §6 is rendered, and every screen carries the persistent elements in §6.0 (Tapestry edge, Listener slot, eyebrow row).

If the host platform enforces a per-call cap, **continue automatically in the next call until the full set is shipped**. Do not summarize "I will continue with the remaining screens" — continue. The deliverable is the full UI, not a sample.

Acceptance is per §11 Definition of done; partial deliveries (e.g., "Landing + Tapestry + Composer + Wall and that's enough to show direction") are rejected — every role-gated and state-gated variant matters because the brief's world-first claims (§1.5) only render correctly when seen as a system.

**Order of generation** (do not deviate; this preserves cross-screen consistency):

1. Landing → 2. The Tapestry (home screen) → 3. The Tapestry component in isolation (the full-surface view) → 4. The Listener component in isolation → 5. Composer → 6. Record → 7. Wall (Thread detail) → 8. Bloodline → 9. Q&A → 10. Inbox → 11. Letters → 12. Memories → 13. Family index → 14. Member profile → 15. Settings → 16. Billing → 17. Threads index → 18. Founder → 19. Founder Welcome → 20. Inherit (descendants' reader) → 21. Wrapped → 22. Privacy → 23. Terms → 24. Login → 25. Signup → 26. Admin Dashboard → 27. Admin Users / Tickets / Incidents / Audit.

For each screen, ship: **desktop ≥ 1180px, tablet 768px, mobile 360px, plus PWA standalone** variants, and every state variation called out in §6 (empty, error, loading, role-gated, reduced-motion). Don't omit edge states because they "look similar" — they are the audit trail of a 50-year product.

— end directive —

---

**Purpose of this document.** A single source of truth for redesigning Heirloom's entire web + PWA frontend in Google Stitch. It enumerates every feature, every screen, every role, every state, and the rules that govern them — enough that an AI design tool (or a human designer) can generate the full UI without re-discovery.

**Surface scope.** Marketing site (logged-out), authenticated product (logged-in), descendants' reader (no account / token-based), admin console. Web at `heirloom.blue` + installable PWA. Same codebase, responsive from 360px → 2560px. Dark-only product, light marketing surface.

**Non-negotiable visual constitution.** See §2. The product is **the Tapestry** — a woven cloth of every entry a family has written, where the cloth itself is the interface. Quiet, editorial, restrained. If a generated screen reads as SaaS-trendy (glassmorphism, gradient meshes, tracked-tight Inter Display, floating cards, decorative emoji, toast spam, spinner loaders), it is wrong and must be regenerated.

---

## 1. Product premise (read first)

Heirloom is a **Family Thread** — a perpetual, append-only, multi-author, multi-generational story archive owned by a bloodline (or chosen-family unit), not a single user.

- A Thread is started by someone alive today, contributed to by descendants in 2050, 2100, 2200.
- Entries can be **time-locked**: released on a date, on a recipient's milestone (18th birthday, wedding), on the author's death, on a generation-event (first great-grandchild).
- Entries are **append-only**: edits leave a visible amendment trail, never silent edits. 30-day delete grace window for the original author only; immutable after that.
- The Thread **outlives the company**: continuous IPFS pinning, successor non-profit, family-export at any time.

**The product is the Thread.** The Living Book, the Wall, the Bloodline tree, the Time-Locked Inbox, the Q&A — these are *views* on the Thread. Every screen should reinforce that this is an heirloom, not a feed.

### One-sentence positioning
> Start your family's thousand-year thread.

### Sub
> Write today. Lock entries for descendants who don't exist yet. Read what came before. The thread continues after you, after us, after the company.

---

## 1.5 World-first interface invariants

This product is making a claim that the interface itself is unlike anything that has shipped. That claim has to be visible in the design, not the marketing. The following five inventions, in combination, have never been built. If a generated screen does not honor all five, it has fallen back to a conventional dashboard and must be regenerated.

### Invariant A — The Tapestry is the interface.

Heirloom has no dashboard, no feed, no home tile-grid, no "you" page. The home of the product is **The Tapestry** itself — a full-surface woven cloth where every entry the family has ever written is a single weft thread, colored from a 10-stop natural-dye palette (madder, indigo, weld, walnut, cochineal, oak gall, woad, kermes, saffron, iron). The user lands inside the cloth. They scroll across decades by panning the loom. They zoom into a single thread to read an entry. They watch their unwritten entries as an unfinished selvedge at the right edge of the cloth.

On every other screen in the product (Composer, Wall, Bloodline, Settings, Inbox), a **Tapestry edge** persists as the bottom-of-canvas chrome — a 4px-tall band on mobile, 8px on desktop — carrying the same cloth in miniature, with a single 1px warm hairline indicating *where in the cloth you currently are*. This replaces all conventional chrome: no breadcrumbs, no progress steppers, no tab bar, no global nav rail. The cloth **is** how you know where you are.

- **The Tapestry home screen:** the full cloth at full surface, pannable across decades.
- **On a single entry:** the active entry's weft thread glows warm in the edge band; the rest is bone-dim. You can see your single entry within the whole archive.
- **In the Composer:** an unwoven warm thread hangs from the right edge, animating ±2% length as you type. Publishing weaves it into the cloth in a single 1400ms motion. Writing the entry is literally adding a thread.
- **In the Inbox:** future Sealed Notes appear as `∞`-glyph pegs hovering above their future positions in the cloth.
- **On admin screens:** the band is replaced by a `Ledger` band — a 4px tabular bar of mono-set platform metrics. The admin is reminded they are looking at the same archive, from the loom-keeper's side.

No competitor has ever made the archive itself the navigation surface. Storyworth uses a calendar. Ancestry uses a tree. We use the cloth — and we use it as the home, not as a decoration on the home.

### Invariant B — Append-only is visible.

Every screen surfaces, somewhere in its eyebrow row or its margin, a single mono-set entry counter:

```
thread no. 0001 · entry 1,247 · amendment trail visible
```

This number always grows. It is the typographic equivalent of the cloth itself: a count that descendants in 2090 will see continuing to climb, where every other app's counter resets daily. The first time a Visitor sees a five-digit entry count on a Thread is the first time the product's core promise renders without copy.

### Invariant C — The Listener is the AI surface.

The product's AI is ambient, anonymous, and uninvited. It is not a chatbot, not a sidebar, not a "✨ Suggest" button, not a copilot panel. It is **The Listener** — a single typographic line that appears in the margin of any screen only when it has something useful, dismisses on tap, and never speaks twice in the same session unless invited.

Full specification in §2.5 and §7.3. The world-first claim: this is the first AI interface where the AI's *visual cost* is one warm hairline. Every other AI product surfaces a panel or a chat thread. We surface a sentence. The user can ignore it forever, and the product is unchanged.

### Invariant D — The Unlock is the only ceremony.

In a 50-year product where the user might log in 8,000 times, only one motion is allowed to be ceremonial: the **Unlock dissolve** — 720ms, the `∞` fades, the date fades, the entry title appears in `warm`. Every other motion is utility (180/360/720ms transitions, the 1400ms Tapestry-weave on publish, the slow pan of the cloth). When something opens that has been sealed for decades, *that* gets motion. Nothing else does. No other product reserves ceremony.

### Invariant E — Print-fidelity textile.

The product is designed at print fidelity (60ch measures, optical-sized type, hand-tuned tracking, hairline rules) and at *textile fidelity* (visible warp threads, natural-dye palette, frayed selvedge edge, a slight vertical sag from the cloth's weight). No SaaS product ships this aesthetic. Every screen should look like a page from a Folio Society edition stitched into a hand-loomed cloth — and the Living Book export must render identically to the screen. The test: print any screen at 300dpi on uncoated stock. If it looks wrong on paper, the screen is wrong.

---

## 2. Visual constitution (the design constitution)

These rules are absolute. Stitch should treat them as constraints, not suggestions.

### 2.1 The five rules

1. **The cloth is the home.** The Tapestry is the product's central surface and the visual signature of every other screen. If a layout would work as well without the cloth, the cloth is missing.
2. **Type is the hero.** Newsreader (display serif, optical sizes 6–72), Inter (UI), JetBrains Mono (archival timestamps + pledge numbers). No third typeface ever.
3. **One color has emotion.** A single sealing-wax warmth `#b07a4a`. Used at **<3% surface area**, always. Everything else is bone `#f4ecd8` on ink `#0e0e0c` at varying opacity. The cloth uses the 10-stop natural-dye palette in §2.7 — those colors live only inside the woven threads.
4. **Negative space is the composition.** 60–70% of any view is empty. Empty is the design, not a placeholder.
5. **Motion has meaning or it's removed.** One easing curve: `cubic-bezier(0.16, 1, 0.3, 1)`. One duration vocabulary: 180ms / 360ms / 720ms / 1400ms. Anything decorative is cut.
6. **Outside time.** The page should look authored in 1970, 2026, and 2076. If a visual move signals "this is the era," kill it.

### 2.2 Color tokens

| Token | Value | Usage |
|---|---|---|
| `ink` | `#0e0e0c` | Page surface (logged-in) |
| `ink-deep` | `#0a0a08` | Cards (the rare ones) |
| `bone` | `#f4ecd8` | Body, headings |
| `bone-dim` | `rgba(244,236,216,0.55)` | Secondary text |
| `bone-faint` | `rgba(244,236,216,0.32)` | Tertiary text |
| `rule` | `rgba(244,236,216,0.08)` | Hairline dividers |
| `warm` | `#b07a4a` | Single accent (sealing-wax) |
| `warm-bright` | `#cf935a` | Hover/active warmth (rare) |
| `warm-dim` | `#8c5a30` | Pressed warmth (rarer) |
| `parchment` | `#faf6ee` | Marketing surface (light) |
| `parchment-ink` | `#1a1916` | Text on parchment |

Contrast: body on ink = 16.4:1, headings = 16.4:1, warm on ink = 5.7:1 (AAA at large sizes), bone-faint on ink = 6.3:1 (AA at 16px+).

### 2.3 Type spec

**Newsreader Display**

| Use | Size | Optical | Tracking | Leading | Weight |
|---|---|---|---|---|---|
| H1 hero | clamp(2.75rem, 6vw, 4.75rem) | opsz 72 | -0.022em | 1.04 | 300 |
| H2 section | clamp(1.875rem, 4vw, 2.75rem) | opsz 56 | -0.014em | 1.1 | 400 |
| H3 entry title | 1.625rem | opsz 28 | -0.008em | 1.2 | 400 |
| Body prose (reader) | 1.125rem | opsz 14 | -0.001em | 1.85 | 400 |

**Inter (UI)**

| Use | Size | Tracking | Weight |
|---|---|---|---|
| Body UI | 0.94rem | -0.002em | 400 |
| Eyebrow | 0.7rem | 0.32em UPPER | 500 |
| Button | 0.94rem | 0 | 500 |

**JetBrains Mono (archival)**

| Use | Size | Tracking |
|---|---|---|
| Date | 0.78rem | 0.04em |
| Pledge number | 0.94rem | 0.06em |

### 2.4 Spacing & geometry

- 8px base unit, hard. No 7s, no 13s, no eyeballed margins.
- Content measure for prose: max 60ch.
- Maximum content width: 1180px on desktop archive; the Wall reader has its own 64ch measure.
- Corner radius: 0px default. 2px on input fields. Never more than 4px anywhere.
- Borders: 1px hairline `rule` token only. No 2px borders, no double borders, no shadows.

### 2.5 Component grammar (the named primitives)

These are the canonical building blocks. They must be used by name across every relevant screen.

- **The Tapestry** — The product's central surface and signature. A woven cloth. The home screen of the authenticated product **is** the full-surface Tapestry; every other screen carries a Tapestry edge along its bottom. Specifications:
  - **Full-surface (home, `/`).** The entire canvas (above the eyebrow row, above the Tapestry edge of any sub-screens) is a hand-loomed cloth. Each entry the family has ever written is one weft thread, drawn left-to-right across the cloth in chronological order, colored from the 10-stop natural-dye palette (madder, indigo, weld, walnut, cochineal, oak gall, woad, kermes, saffron, iron — see §2.7). Visible warp threads (vertical, structural) sit beneath, slightly irregular. A subtle vertical sag from the cloth's weight. A frayed selvedge at the right edge where the next thread will be tied.
  - **Pan and zoom.** The user can pan horizontally across decades, vertically across visibility tiers (family-only, descendants-only, historian-public). Pinch / scroll-zoom from "the whole century" down to "a single thread" — at maximum zoom, a thread enlarges to reveal the entry's title and date marks inline in the weave.
  - **Active position.** A single 1px warm vertical hairline runs floor-to-ceiling at the current scroll position. This is the only `warm` element on the canvas.
  - **Tapestry edge (every other screen).** A 4px-tall band on mobile, 8px-tall band on desktop, along the bottom edge of every authenticated screen, the descendants' reader, and the admin console (as a `Ledger` band). The same cloth, in miniature. The warm position-hairline rises from the band.
  - **In the Composer:** an unwoven warm thread hangs from the right edge, animating ±2% length as you type. On publish, it weaves into the cloth in a 1400ms motion. Writing the entry is literally adding a thread.
  - **Time-locked entries** appear as a single `∞`-glyph peg suspended above their future position in the cloth, with a 1px warm thread tethering the peg to where the woven thread will appear when the lock releases.
  - **Admin screens** replace the band with a `Ledger` band — a 4px tabular bar of mono-set platform metrics. Same position, different content. The admin is looking at the loom-keeper's reverse of the cloth.
  - **No tab bars, no breadcrumbs, no rails.** The Tapestry is the orientation.

- **The Sealed Note** — Time-locked entries appear in the cloth as a small typographic block at their future position: a single `∞` glyph (in warm), a date in mono, an em-dash, the recipient's name in italic.

  ```
        ∞
  2055 — for Maya, when she turns 18
  ```
- **The Unlock** — When a sealed note's release condition is met, it **dissolves**: the `∞` fades, the date fades, the entry title appears in its place — and simultaneously the suspended thread above the cloth lowers into its weave position. Single 720ms cross-fade. Restraint *is* the moment.

- **The Listener** — The product's AI surface, expressed as ambient typography. Never a chatbot. Never a panel. Specifications:
  - The Listener appears as a single right-aligned mono line in the margin of the active screen:
    ```
                                                    the listener offers ·
                                                  there is a 1947 letter
                                                       you have not read.
    ```
  - It animates in as a 720ms opacity fade from `bone-faint` to `bone-dim`. Never `warm` — the Listener never raises its voice.
  - It is dismissed by tap, by pressing Esc, or by any other interaction. Once dismissed, it does not return in the same session unless explicitly invited (`/threads/:id/q-a`).
  - It speaks at most once per screen visit. It does not speak in the first 12 seconds of any session on `/` (the Tapestry home) — the user's first look at the cloth must be unmediated.
  - Its sentences are short, declarative, and editorial. Never a question (a question demands response). Never a suggestion-list. Never two thoughts in one appearance. Examples:
    - *the listener offers · a sealed note unlocks for Maya in 11 days.*
    - *the listener offers · you mentioned a name not yet on the thread — Aunt Rina.*
    - *the listener offers · this entry shares language with three earlier ones.*
  - Tapping a Listener line opens the relevant entry / surface. Tapping its surrounding negative space dismisses it.
  - The Listener has no name, no avatar, no persona, no model identity. It is not "Claude" or "Sage" or "Echo." It is *the listener*, lowercase, always.
  - The Listener's full transcript history is available, never exposed by default, at `/listener` (a hidden settings sub-route). It is an audit trail, not a conversation.

- **The Composer** — The writing surface. Newsreader 22px body, leading 1.85, max measure 60ch. A piece of paper laid over the cloth, not a UI element. No borders, no focus glow. Cursor is the only signal of attention. The unwoven thread is always visible at the right edge of the bottom Tapestry band — the writer can see the literal thread they are about to add to the cloth.
- **The Wall** — Chronological list-reader for the Thread, accessed by zooming a single thread of the Tapestry to maximum. Editorial typography on ink. Date-marks in mono in the gutter. No cards. The Tapestry edge at the bottom shows the user's vertical position within the whole cloth.
- **The Bloodline** — A typographic family tree, not a chart. Nodes are names. Edges are hairlines. The active path is in `warm`. The Tapestry edge persists at the bottom, with each member's contributions visible as a clustered region of weft threads.
- **The Living Book** — Print-on-demand snapshot view. Renders identically to screen (same fonts, same spacing, same breaks). The cover is a print of the family's Tapestry as it stands on the day of binding. Designed at letterpress fidelity.

### 2.6 Anti-patterns (regenerate the screen if any appear)

- Glassmorphism, frosted glass, blurred backgrounds.
- Gradient meshes, conic gradients, animated noise.
- Inter Display tracked tight at 80px (the SaaS hero pattern).
- "Floating" cards with translateY hover.
- Any radial gradient billed as "atmospheric."
- Any motion that doesn't carry information.
- Any icon library. The product has **no icons**. `∞` is the only mark; everything else is type. (Marketing site may use 2–3 hand-drawn line marks; product UI uses none.)
- Decorative emoji.
- Loading spinners (use a `bone`-on-`ink` horizontal hairline progress bar instead).
- Toast notifications (use inline status only).
- Avatar circles, gravatar-style identity chips.
- 3D-skewed cards, isometric illustrations, hand-and-laptop hero images.
- A "home dashboard" with cards, tiles, recent-activity feeds, or stats blocks. The home is the cloth, full surface. Nothing else.
- A fire, a hearth, a candle, a flame, a glow source, a campfire, a fireplace, a vault door, a safe, a key, a lock-and-key, a manuscript scroll, a quill — any literal metaphor object. The Tapestry is the only object.

### 2.7 The natural-dye palette (used only inside the cloth)

The Tapestry's weft threads are colored from this 10-stop palette of historic natural dyes. These colors never appear elsewhere — never as UI accents, never as text, never in icons. They live only in the woven threads, the same way pigment lives only in fabric.

| Stop | Dye | Hex | Used for |
|---|---|---|---|
| 1 | Madder root | `#9f3a2a` | Joy, celebration, weddings |
| 2 | Cochineal | `#7a1f2b` | Grief, loss |
| 3 | Kermes | `#b14a4a` | Birth, beginning |
| 4 | Saffron | `#c69a3a` | Achievement, harvest |
| 5 | Weld | `#a89248` | Daily life, ordinary days |
| 6 | Walnut hull | `#5b3a22` | Travel, distance |
| 7 | Oak gall | `#3a2e1f` | Records, legal, official |
| 8 | Woad | `#3a4a6a` | Contemplation, prayer |
| 9 | Indigo | `#1f3a5b` | Memory, the past |
| 10 | Iron mordant | `#1c1c1a` | Death, ending |

The dye assigned to each entry is set by the author from a single-tap selector at publish time (or inferred from the entry's emotion tag if the author skips). The Listener may quietly suggest a dye if the author has been writing for >10 minutes — but never imposes.

---

## 3. Audience & personas

### 3.1 Primary: The Keeper (Sarah, 47)
Adult women 35–60 with at least one living parent over 65. Grief-adjacent, family-keeper psychology. Browses on iPhone or iPad. Recognizes Pinterest aesthetic, Penguin paperback covers, FSG poetry — not Linear/Figma/Notion. Wants: a way to hold the family's stories that will outlast her.

### 3.2 Secondary: The Patriarch/Matriarch (Robert, 73)
Has stories to tell, may be intimidated by tech. Needs: oversized type, voice as a first-class input, a single "begin" affordance per session. Will resist any UI that looks "like Facebook."

### 3.3 Tertiary: The Descendant (Maya, 19, in 2050)
Inherits the Thread. May never have met the original Founder. Needs: an archive that reads like a book, not an app. The Q&A and Bloodline are her primary surfaces.

### 3.4 Operator: The Successor
The person who inherits administrative authority. Needs: clear succession audit log, the ability to add/remove members without touching content.

### 3.5 B2B (Phase 2): Professional Advisers
Estate planners, lawyers. Needs: client portal, audit trail export, will integration. Out of scope for this redesign except as a navigation placeholder.

---

## 4. Roles & permissions matrix

The product has eight distinct role classes. Stitch must produce role-specific UI variations where indicated.

### 4.1 Account-level roles

| Role | Code | Description | Default capabilities |
|---|---|---|---|
| **Visitor** | `VISITOR` | Logged out. Browsing marketing surface. | View public pages only. Sign up. Open a `/inherit/:token` reader link. |
| **Trial Member** | `TRIAL` | New account, 14-day trial. | All Family-tier features. Content frozen (not deleted) on expiry. |
| **Subscriber — Essential** | `ESSENTIAL` | $2.99/mo. | 100 entries, 30 min voice, 20 letters, 1GB. |
| **Subscriber — Family** | `FAMILY` | $15/mo per family (not per seat). | Unlimited entries, unlimited members, all features. |
| **Founder** | `FOUNDER` | $999 one-time, lifetime. | Family-tier capability + name engraved in continuity record + funds successor non-profit. |

### 4.2 Thread-level roles (within a single Family Thread)

A user can hold different Thread roles in different Threads (e.g., Founder of their own bloodline, Author in their spouse's).

| Role | Code | Granted by | Capabilities |
|---|---|---|---|
| **Thread Founder** | `THREAD_FOUNDER` | Creating a Thread | All capabilities. Cannot be revoked except by self. Names successors. |
| **Successor** | `SUCCESSOR` | Founder designation | Inherits administrative authority on Founder's death. Up to 5 ordered successors per Thread. |
| **Author** | `AUTHOR` | Founder or current admin | Write entries, comment, invite Readers. Cannot remove members. |
| **Reader** | `READER` | Founder, admin, or any member with grant authority | Read-only. Common for children below the configured authorship age, in-laws, etc. |
| **Descendant-on-the-list** | `FUTURE_MEMBER` | Created as a placeholder | Inherits Reader/Author rights at configured age once verified. Cannot log in until verified. |
| **Legacy Contact** | `LEGACY_CONTACT` | Account holder | Used for dead-man's-switch verification. Not a Thread member; receives a verification-only token on trigger. |

### 4.3 Platform-level roles (admin console only — at `/admin/*`)

| Role | Code | Capabilities |
|---|---|---|
| **Support** | `SUPPORT` | Read-only access to account state. Issue refunds within policy. Respond to tickets. Cannot read entry content (ever — zero-knowledge). |
| **Admin** | `ADMIN` | Support capabilities + user lifecycle actions + content moderation (flagged-only). Cannot read entry content. |
| **Super Admin** | `SUPER_ADMIN` | Admin capabilities + platform configuration + cryptographic-key escrow audit. Cannot read entry content (the architecture forbids it). |

**Critical:** No platform role can read user entry content. The architecture forbids it. Admin screens show only metadata, status, and audit trails. This must be visually obvious — the admin console should look like a ledger, not a CMS.

### 4.4 Per-feature role visibility

| Feature / surface | VISITOR | TRIAL | ESSENTIAL | FAMILY | FOUNDER | Thread-FOUNDER | SUCCESSOR | AUTHOR | READER | SUPPORT | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Landing `/` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| Tapestry `/` (home) | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Compose entry | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Time-lock entry | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Read inbox | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Manage members | — | ✓* | ✓* | ✓ | ✓ | ✓ | ✓ (post-trigger) | — | — | — | — | — |
| Designate successors | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| Configure dead-man's switch | — | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| Family-export (open archive) | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Billing | — | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| Q&A (RAG) | — | limited | limited | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Living Book order | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Admin console | — | — | — | — | — | — | — | — | — | ✓ (read) | ✓ | ✓ |

*Trial/Essential: limited to 3 Thread members.

### 4.5 Visibility levels (per entry, set by author)

These appear in the Composer as a single segmented selector — not buried in a settings drawer:

- **Private** — Author + explicit recipients only.
- **Family-only** (default) — All current Thread members.
- **Descendants-only** — Members of generations N+1 and below; current generation cannot read.
- **Public-historian** — Opt-in redacted release to the open archive ~50–100 years after author's death.

---

## 5. Information architecture

### 5.1 Public surface (logged-out)

| Path | Screen | Purpose |
|---|---|---|
| `/` | Landing | World-first thesis; Founder CTA; how it works; pricing; FAQ. |
| `/preview` | Public Tapestry preview | A read-only specimen Tapestry — the same cloth surface non-members can pan and zoom to understand the product. |
| `/founder` | Founder tier | Pitch the $999 lifetime tier. Funds the successor non-profit. |
| `/founder/welcome` | Founder welcome | Post-purchase ceremonial screen. Engraves name in continuity record. |
| `/creators` | Creator program | For influencers / family-keepers building their own Threads. |
| `/influencer/:slug` | Influencer landing | Per-creator referral landing page. |
| `/privacy` | Privacy policy | Editorial-typeset legal. |
| `/terms` | Terms of service | Editorial-typeset legal. |
| `/inherit/:token` | Inherited Thread reader | Token-gated read surface for descendants. No account required. |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Auth | Account access. |

### 5.2 Authenticated surface (the product)

The home of the authenticated product is **`/` — The Tapestry**, the full-surface cloth. Every other route is a zoomed-in or modal view onto that same cloth. Routes do not introduce new metaphors; they reveal sub-views of the Tapestry.

| Path | Screen | Purpose |
|---|---|---|
| `/` | The Tapestry | Home. The full-surface woven cloth of the active Thread. Pan across decades, zoom into single threads, switch active Thread. The only true home screen. |
| `/threads` | Threads index | Lists every Thread the user has access to (Founder of, member of, inherited from). Each row is a miniature Tapestry preview. |
| `/threads/:id` | Thread detail (Wall) | The Wall — a single thread of the Tapestry zoomed all the way in, rendered as chronological prose. The full cloth persists as the Tapestry edge. |
| `/threads/:id/bloodline` | Bloodline | Family tree as typography. Each node has attached entries, with that member's region of the cloth highlighted on hover. |
| `/threads/:id/q-a` | Q&A | RAG-over-readable-entries natural-language query interface. Cited entries glow in the Tapestry edge as the answer renders. |
| `/threads/:id/book` | Living Book | Print-on-demand snapshot order screen. Cover is the family's Tapestry as it stands on the day of binding. |
| `/inbox` | Time-Locked Inbox | Entries unlocking soon for the current viewer. Future entries appear as `∞` pegs above the Tapestry edge's projection zone. |
| `/compose` | Composer | Write/record/photograph. Set visibility + time-lock + dye color. The unwoven thread is visible at the cloth's selvedge. |
| `/record` | Record voice | Mobile-first voice capture surface. Used inside Composer also. |
| `/letters` | Letters | Long-form, time-locked letters to specific recipients (a specialized Composer view). |
| `/memories` | Memories archive | Photo/video archive (legacy view; integrated with Thread entries). |
| `/family` | Members | Manage current and future Thread members. |
| `/family/:id` | Member profile | Per-member view: their entries, their dates, their grants. That member's cloth region is highlighted on the Tapestry edge. |
| `/settings` | Settings | Account, encryption, dead-man's switch, currency, language, accessibility. |
| `/billing` | Billing | Subscription state, invoice history, currency, tier change. |
| `/wrapped` | Year-in-review | Annual reflective summary (December surface). Each "page" is a sentence laid over the year's slice of the Tapestry. |

### 5.3 Admin surface (`/admin/*`)

| Path | Screen | Purpose |
|---|---|---|
| `/admin/login` | Admin login | Separate auth, FIDO2 required. |
| `/admin/dashboard` | Admin home | Ledger of platform metrics — accounts, MRR, switch events, IPFS pin health. No content. |
| `/admin/users` | User ledger | Account list, status, role. No entry content. |
| `/admin/tickets` | Support | Ticket queue. |
| `/admin/incidents` | Incidents | Switch triggers awaiting verification; archival pin failures. |
| `/admin/audit` | Audit | Full action log for forensics. |

---

## 6. Screen specifications

This is the core of the brief. Each screen has: **purpose**, **header content**, **primary content blocks**, **interactions**, **state variations**, **role variations**, **responsive notes**.

### 6.0 What every screen carries

Every screen in the authenticated product, the descendants' reader, and the admin console renders these persistent elements. Stitch should layer them onto every generated screen unless explicitly noted.

1. **The Tapestry edge** (bottom of canvas). 4px on mobile, 8px on desktop. The full active Thread rendered as weft threads in their natural-dye colors. A 1px warm hairline indicates the current viewport's position in the archive. Hover/tap expands to 240px reveal with decade labels. On admin screens, replaced by the Ledger band of the same dimensions. On marketing/public screens (Landing, Founder, Privacy, Terms, Login, Signup), the Tapestry edge is **not** rendered — those surfaces belong to the un-archived public. The single exception is `/preview`, which is a full-surface specimen Tapestry.
2. **The Listener margin slot** (right margin on desktop; below the eyebrow on mobile). A reserved typographic slot 60ch from the content measure. Empty by default. Renders a single right-aligned mono Listener line when the system has something useful to offer (see §2.5, §7.3). Never present on first 12s of `/` in a session. Never present on the Composer while the user is typing. Never present on admin surfaces.
3. **The Eyebrow row** (top of canvas). Mono. Tiny. Contains:
   - Screen name or breadcrumb-equivalent (one to two words).
   - The append-only entry counter: `thread no. 0001 · entry 1,247`. This is the world-first invariant B made visible.
   - On the right: a single text link (always `compose →` on most screens; context-specific elsewhere).
4. **No global nav bar, no tab bar, no rail.** Navigation is via editorial text links in the eyebrow row, in the body, and via direct pan-and-zoom from any screen back to `/` (clicking the Tapestry edge zooms it out to the full-surface home).

### 6.1 Landing `/`

**Purpose.** Convert a Visitor into a Trial (or a Founder). Communicate the world-first thesis without sounding like marketing.

**Header content.**
- Eyebrow: `HEIRLOOM · THE FAMILY THREAD`
- H1 (Newsreader, hero size): *Start your family's thousand-year thread.*
- Sub (Inter, 1.0625rem, bone-dim, max-w 56ch): *Write today. Lock entries for descendants who don't exist yet. Read what came before. The thread continues after you, after us, after the company.*
- Primary CTA: `Begin your thread` (button, warm fill on ink). Secondary: `See the cloth` (text link → `/preview`).

**Primary content blocks (top to bottom, generous spacing).**
1. **The specimen Tapestry** — A 70vh canvas at first paint showing a hand-loomed cloth — a specimen Tapestry of a fictional 120-year family Thread, slowly panning right at ~1px/s. The H1 sits above it in negative space. No imagery beyond the cloth itself. The cloth is the hero.
2. **What is a Thread** — Three-paragraph editorial column, max measure 60ch, set in Newsreader 1.125rem leading 1.85. No icons, no numbered features.
3. **The five pillars** — Five rows, each: a single-line eyebrow in mono, a one-sentence definition in Newsreader, a 3-line example in bone-dim. (Perpetual, Append-only, Multi-author, Time-locked, Continuity.)
4. **A sealed note appears** — A scrolled-into-view section that *demonstrates* the Sealed Note primitive on-page. Visible time-lock dissolve animation (720ms) when the example date "arrives" — and the suspended thread above the cloth lowers into the weave. This is the share-worthy moment for the marketing surface.
5. **Pricing** — Three blocks: Family, Founder, Free. Per-family pricing emphasized: *one subscription covers the whole bloodline*.
6. **What we are not** — A four-line manifesto block: *not a book service · not a death-planning app · not a genealogy tool · not an AI ghost.* Set as four right-aligned lines in Newsreader italic.
7. **Continuity pledge** — A short editorial paragraph + a mono-set IPFS pledge number (e.g., `pledge no. 0001 — Jun 2026`).
8. **Footer** — Hairline divider; copyright; minimal links; no social-media stack.

**Interactions.**
- CTA `Begin your thread` → `/signup`.
- Scroll behavior: every section enters with a 360ms bone-dim → bone opacity fade. No translateY.

**State variations.**
- First visit: full experience.
- Returning visitor (cookie): the H1 swaps to *Welcome back* with the original copy as subhead.
- Inbound from `/inherit/:token`: the H1 swaps to *Someone left this for you*, the CTA becomes `Open the thread`.

**Responsive.**
- 360–767px: single column, H1 clamps to 2.75rem, specimen cloth occupies the lower 50% of the viewport with the H1 above.
- 768–1179px: tighter rhythm, two-column pricing.
- 1180px+: full editorial measure.

### 6.2 The Tapestry — Home `/`

**Purpose.** The home of the logged-in product. Not a dashboard, not a feed, not a tile grid. The user lands inside their family's woven cloth — every entry the family has ever written is visible as a single weft thread, drawn left-to-right across decades in its natural-dye color. The user's first action is to look at the cloth; their second action is to pan, zoom, or pull one thread.

**Header content.**
- Tiny mono eyebrow (top left): `[thread name] · founded [year] · thread no. NNNN · entry N,NNN`.
- No avatar, no logo lockup, no notification bell. (Inbox state is surfaced inline by `∞` pegs above the cloth.)
- A single ghost link (top right): `compose →`.

**Primary content blocks (the full-surface Tapestry).**
1. **The cloth.** Occupies the full canvas between the eyebrow row (top) and the bottom 24px of viewport (the cloth's selvedge gutter). Hand-loomed: visible warp threads (vertical, structural, slightly irregular, `bone` at 32% on `ink`), weft threads (horizontal, one per entry, in their natural-dye color from §2.7), slight vertical sag, frayed right edge. Decade markers appear as mono date labels in the gutter every 10 years.
2. **The active position hairline.** A single 1px `warm` vertical line floor-to-ceiling at the current pan position (today, by default). The cloth pans behind the hairline as the user navigates time.
3. **Suspended `∞` pegs.** Time-locked entries scheduled for the future appear as `∞` glyphs (warm, 12pt) hovering above the cloth at their scheduled position, with a hairline thread tethering them to the future weave point. The Sealed Note typography (date + recipient) appears below the peg on hover.
4. **Active-member glow.** Threads authored by a single hovered member illuminate while everyone else's threads dim to `bone` at 12%. Releasing the hover restores the cloth.
5. **The Tapestry edge (miniature).** On this screen, the bottom-edge persistent Tapestry is replaced by the *full-surface* cloth — there is no miniature edge here. Every other screen reverts to the 4/8px edge.

**Interactions.**
- **Pan.** Horizontal scroll / drag pans the cloth across decades. Vertical scroll / drag pans across the three visibility tiers (family-only top, descendants-only middle, historian-public bottom — each as a horizontal band of weave).
- **Zoom.** Pinch / scroll-zoom. At minimum zoom: the whole century in view, threads compressed to 1px-thick. At medium zoom: thread titles appear inline. At maximum zoom: a single thread fills the canvas and transitions into the Wall reader (`/threads/:id` scrolled to that entry).
- **Tap a thread.** Opens the Wall reader for that entry.
- **Tap an `∞` peg.** Reveals the Sealed Note. The entry's contents stay sealed until release.
- **Tap a decade marker.** Snaps the pan to that decade.
- **The selvedge prompt.** At the right edge of the cloth — the unfinished selvedge — a single mono line in the gutter reads: `the next thread is yours. compose →`.

**State variations.**
- **Empty Thread (first session).** The cloth is a single warp without any weft yet — vertical threads only, ready to be woven. A single centered sentence in Newsreader italic: *Your cloth is waiting. The first thread is the hardest.* CTA `Weave the first thread →` opens Composer.
- **Few entries (<10).** The cloth shows the few woven threads tight to the left edge, with a wide unfinished selvedge dominating the canvas. The visual asymmetry is the design — it tells the user the cloth has just begun.
- **Switch in WARNING state.** A single mono line below the eyebrow: `check-in due in 2 days · check in →`. No banner, no color, no urgency styling beyond the link being warm.
- **Switch TRIGGERED state.** The cloth's saturation drops to 60% — every dye color is desaturated as if seen through grief. A single line above the cloth: `the switch has triggered · cancel within 48h`. This is the *only* surface that breaks the calm pattern.
- **Reduced-motion.** The pan animation is replaced by a snap; the gentle ±2% length animation on the selvedge thread is removed; everything else is static.
- **Listener.** On `/`, the Listener never appears in the first 12 seconds of any session — the user's first look at the cloth must be unmediated. After that, it may speak once.

**Responsive.**
- 360–767px: The cloth is rotated 90° — entries run top-to-bottom (vertical weft) instead of left-to-right, so the user can scroll the cloth as they would a feed. Decade markers in the right gutter. Pinch-zoom still applies.
- 768–1179px: Horizontal cloth, slightly compressed. Touch and mouse interactions both supported.
- 1180px+: Full horizontal cloth, full canvas.

### 6.3 Composer `/compose`

**Purpose.** Write / record / photograph an entry. The page is a piece of paper laid over the cloth. No chrome.

**Header content.**
- Eyebrow mono: `composing · [today's date] · [visibility]`
- That's all. No back button (use browser). No save button (autosaves every 4s; status set inline at bottom).

**Primary content blocks.**
1. **The paper** — A full-width surface set in Newsreader 22px, leading 1.85, max measure 60ch, centered on the canvas, floating over a softly visible Tapestry-edge band at the bottom (8px desktop, 4px mobile). No border, no focus glow. The cursor is the only signal of attention.
2. **Title affordance** — A single line above the paper, set in Newsreader H3, placeholder bone-faint: *Title* (optional).
3. **Bottom rail** (mono, hairline divider above):
   - Visibility selector: `private · family · descendants · historian` — current state in warm, others in bone-dim. One tap toggles.
   - Lock selector: `open now · on date · on age · on event · on death`. Tapping `on date` reveals a date input inline; `on age` reveals member-picker + age; `on event` reveals event-type picker.
   - Recipient selector: `to: [family · or pick names]`.
   - Dye selector: `dye: [auto · madder · cochineal · kermes · saffron · weld · walnut · oak gall · woad · indigo · iron]`. Default `auto` (inferred from emotion tag). User-chosen overrides the inference. The selected dye colors the unwoven thread at the cloth's selvedge in real time, so the writer literally sees the color of the thread they are about to weave.
   - Save status (right-aligned): `saved · 14:22` in mono dim.

**Modalities.**
- **Text** — default. Type into the paper.
- **Voice** — a single mono link in the bottom rail: `record voice →`. Opens the Record sub-surface (see §6.4).
- **Photograph / video** — a single mono link: `attach image →`. Once attached, the image sits *above* the paper at the user's chosen full-bleed or measure-width size.

**Interactions.**
- Autosave every 4s; status set inline (no toast).
- Cmd/Ctrl-Enter publishes. No "Publish" button on screen by default; a `publish →` link appears in the bottom rail once a title + body exist.
- The visibility selector includes a tooltip on first use only: *Family-only is the default. Descendants-only hides from current members.*
- **The unwoven thread.** At the right edge of the Tapestry band, a single warm thread of length proportional to the draft's word count hangs unwoven, gently swaying (±2% length, 9s cycle). On publish, the 1400ms weave-in motion fires: the thread folds into the band, the band extends by one pick, and the new pick lights warm for 720ms before settling to its natural-dye color.
- **The Listener is silenced while typing.** The Listener does not speak on the Composer until 8s after the last keystroke. When it does speak, it never offers a phrase suggestion or autocomplete — its scope is limited to *naming what's missing*: "*you mentioned a name not yet on the thread — Aunt Rina.*" The Composer is the user's voice, not the model's.

**State variations.**
- **Draft (default).** Paper, cursor, autosave status. Unwoven thread visible at Tapestry's right edge.
- **Time-lock chosen.** A small Sealed Note primitive appears in the upper right margin reflecting the selected lock. The unwoven thread takes on the `warm` color until publish (visual signal: this thread is going to the future).
- **Publishing.** Paper fades to bone-faint for 360ms. Simultaneously, the unwoven thread weaves into the Tapestry (1400ms). On success, the page transitions to the published entry's reader view.
- **Offline (PWA).** Bottom rail status changes to `holding offline · will save when connected`. The unwoven thread takes on a `bone-dim` tint until sync.

**Responsive.**
- Mobile: paper takes full width minus 24px padding. Bottom rail collapses to a single scrollable line above the keyboard.

### 6.4 Record (voice) `/record`

**Purpose.** Voice capture as a first-class input. Used by older patriarchs/matriarchs.

**Header content.**
- Eyebrow mono: `recording · [today's date]`.
- A single oversized timer in JetBrains Mono, centered: `00:00`.

**Primary content blocks.**
1. **The breath ring** — A single bone-on-ink hairline circle that expands/contracts gently while recording (not a waveform; not a level meter — that signals "app"). Center of viewport. Diameter ~40vmin.
2. **Prompt** (optional, bone-dim, above the ring): *What did your mother say about the war?* — these are configurable prompt cards, swiped horizontally to change. On a fresh session, no prompt — silence is offered first.
3. **One control** — A single text link below the ring: `begin` → during recording becomes `stop`. No record button, no pause, no scrubber. (A pause is available as a tiny `pause` text link to the right of `stop`.)
4. **Transcript** (post-stop) — A scrollable transcript in Newsreader, editable inline. AI-generated; user can correct.

**Interactions.**
- Begin → countdown 3-2-1 in mono, then ring activates, timer starts.
- Stop → transcript appears below within ~2s. User can edit, then `save to thread →`.

**State variations.**
- **Permission denied.** A single mono line: *microphone access is required · grant permission*.
- **Offline.** Recording continues; transcript is generated when connection returns. Status: `holding offline`.

**Responsive.**
- Mobile-first surface. Ring scales to viewport. Timer dominates.

### 6.5 Threads index `/threads`

**Purpose.** Show every Thread the user has access to.

**Header content.**
- Eyebrow: `threads · [count]`.
- H2: *The threads you hold.*

**Primary content blocks.**
- A typeset table (not a card grid), one row per Thread:
  - Thread name (Newsreader)
  - Founder name (italic, bone-dim)
  - Date founded (mono)
  - Role in this thread (eyebrow case)
  - Entry count (mono dim, right-aligned)
- Below the table: a single text link `Start a new thread →`.

**Interactions.**
- Row hover: row receives a single hairline underline. Click → `/threads/:id`.

**State variations.**
- **One thread only.** Table replaced by a single editorial paragraph: *You hold one thread — [name]. Founded by [founder] on [date].*
- **Inherited thread.** Tagged with a small mono inline label: `inherited · 2049`.

### 6.6 Thread detail / The Wall `/threads/:id`

**Purpose.** Chronological reader of the Thread.

**Header content.**
- Eyebrow: `[thread name] · founded [year]`.
- H1: thread title in Newsreader.
- Below the title: a single line of Founder + successor names in mono dim.
- The Tapestry edge (§6.0) is at the canvas bottom as on every screen. On the Wall, the 1px warm hairline tracks the active entry — as the user scrolls, the hairline glides along the band, so the user can always see *where in the whole archive* they are reading. This is the world-first invariant A made viscerally felt: the scroll position is the position-in-the-cloth.

**Primary content blocks.**
1. **The Wall** — A vertical chronological list of entries. Each entry block:
   - Date mark (mono, right-margin gutter)
   - Author name (Newsreader italic, bone-dim)
   - Title (Newsreader H3)
   - Body (Newsreader prose, max 60ch)
   - Attachments (full-bleed or measure-width)
   - Inline meta (visibility, amendment-count) in mono dim below the body
   - A hairline divider before the next entry.
2. **Margin Sealed Notes** — Time-locked entries scheduled to release inside the Wall's date range appear in the margin as Sealed Note primitives; their position in the Wall is reserved by a dotted hairline.
3. **Comments thread per entry** — Indented below the entry. Same typographic system; one shade dimmer.

**Interactions.**
- Reader scrolls. No infinite-scroll trickery. Virtualized rendering for performance.
- Per-entry actions (low-emphasis, revealed on hover/tap of the date mark): `amend · comment · share within family`.
- Amendments append; never silently edit.

**State variations.**
- **Empty Thread.** A centered editorial block: *This thread is waiting. The first entry is the hardest.* CTA `Write the first entry`.
- **Reader role only.** No `amend`, no `comment` (unless the Thread allows reader comments — Thread setting).
- **Filter active.** A single mono line above the Wall: `showing · entries by [member] · 2031–2049 · clear`.

**Responsive.**
- Mobile: date mark moves above the entry block in mono; gutter disappears.

### 6.7 Bloodline `/threads/:id/bloodline`

**Purpose.** The tree as typography. Each node shows attached entries on hover/tap.

**Primary content blocks.**
- A vertical genealogical tree. Each node is a name in Newsreader with dates in mono below. Connecting hairlines only — no boxes, no avatars.
- Active path (from user → ancestor selected) is in `warm`.
- Hovering/tapping a node reveals a side rail: the node's bio sentence + a count of entries.

**Interactions.**
- Click a node → side rail expands to list their entries.
- Click an entry → opens the Wall scrolled to that entry.

**State variations.**
- **Future descendants placeholder.** A `FUTURE_MEMBER` node renders as a Sealed Note (`∞` + name + age-gate), not a typeset name.
- **Branching adoption / chosen family.** Hairlines render as dotted vs solid based on relationship type. Legend offered once on first view.

### 6.8 Q&A `/threads/:id/q-a`

**Purpose.** RAG-over-readable-entries natural-language query.

**Primary content blocks.**
1. A single editorial input line: *Ask the archive.* Newsreader, no border, hairline below.
2. Suggested prompts (mono dim, max 5): *What did Grandma say about leaving Cape Town? · When did Dad first meet Mom? · How did Aunt Rina describe the farm?*
3. Answer composition: prose paragraph in Newsreader citing entries inline. Each citation is a small superscript date in mono; clicking opens the source entry in a right-side reader.

**Interactions.**
- User types question; on Enter, hairline progress bar appears beneath the input. Answer streams in.
- The system only retrieves from entries readable by the current viewer (enforced at retrieval time; visibility levels respected).

**State variations.**
- **No matches.** *The archive holds no entries that match that question. Try asking about a person, place, or year.*
- **Reader role + descendants-only filter.** Answer composition silently omits descendants-only-but-not-yet-released entries.

### 6.9 The Time-Locked Inbox `/inbox`

**Purpose.** Show entries unlocking soon *for the current viewer*.

**Primary content blocks.**
- Header: H2 *Unlocking soon.* Subhead bone-dim: *[N] entries will open for you in the next 365 days.*
- A vertical list of Sealed Notes:
  ```
        ∞
  2027-06-14 — for you, on your 50th birthday
  written by Dad, 2019-03-22
  ```
- Past unlocks appear in a second section below, hairline divider: *Recently opened.*
- **Tapestry projection (inbox-only behavior).** On the Inbox screen, the Tapestry edge extends rightward beyond the warm "current position" hairline into a faded projection zone, where each upcoming Sealed Note is rendered as a tiny `∞`-glyph peg hovering above its scheduled future position. The user can see, in the band, the rhythm of their upcoming inheritances: a cluster of unlocks in 2032, a single one in 2050, etc.

**Interactions.**
- A Sealed Note's release date arriving while the user is on the page triggers the Unlock dissolve in place — the entry title appears in `warm`, and tapping opens the reader. The corresponding `∞` peg on the Tapestry simultaneously dissolves into a permanent woven pick.
- Notification settings link in mono dim at the bottom: `tell me by email · push · neither`.
- The Listener on the Inbox may speak once to surface forgotten context: *the listener offers · this letter was written the year your father retired.*

### 6.10 Letters `/letters`

**Purpose.** Long-form, recipient-addressed time-locked entries. A specialized Composer view with letter-shaped affordances.

**Primary content blocks.**
- The Composer with three additions:
  - A `To:` line at the top (member picker + custom recipient name).
  - A `From:` line auto-filled with the author.
  - A salutation suggestion bone-faint, e.g., *Dear Maya,*
- The default visibility is `private` and the default lock is `on date` (not `open now`).

**Interactions.**
- All Composer interactions apply.

### 6.11 Family / Members `/family`, `/family/:id`

**Purpose.** Manage current and future Thread members.

**Header content.**
- Eyebrow: `members · [count]`.
- H2: *Who's on the thread.*

**Primary content blocks.**
- A typeset table:
  - Name (Newsreader)
  - Dates of life or `—` for living (mono)
  - Role in this Thread (eyebrow case)
  - Age-gate (mono dim, e.g., `reader at 12 · author at 16`)
  - Last activity (mono dim)
- Below the table: `Invite a member →`, `Add a future descendant →`, `Designate a successor →`.

**Per-member detail `/family/:id`.**
- The member's name as H1.
- Below: their bio paragraph (editable by them or by the Founder).
- Their entries (chronological).
- Their grants log (mono): *granted Author by [founder] · 2027-04-12 · grant entry #0042*.

**Interactions / state variations.**
- Only `THREAD_FOUNDER`, `SUCCESSOR` (post-trigger), and the Founder can revoke roles. Author can invite Readers only.
- A `FUTURE_MEMBER` row renders the name as a Sealed Note.

### 6.12 Settings `/settings`

**Purpose.** Account, encryption, dead-man's switch, preferences. The loom-keeper's panel.

**Primary content blocks (sections, each separated by hairline + eyebrow):**
1. **Account** — name, email, password (rotate), language, currency, timezone.
2. **Encryption** — master key state, recovery phrase view (re-auth required), key escrow status.
3. **Dead-man's switch** — interval (7–90 days), grace period, last check-in date, next check-in due, legacy contacts (2+ required), trigger history. **Check-in button is a single warm text link, not a card.**
4. **Devices & sessions** — active sessions table, FIDO2/passkey management, biometric toggles.
5. **Accessibility** — reduced motion, larger type, high contrast, simplified interface (elder mode).
6. **Notifications** — email, push, frequency.
7. **Privacy & data** — full export (one-click JSON + media), right to be forgotten (per GDPR — but archived content remains in the bloodline archive; this exports/removes account-level identity only).
8. **Continuity pledge** — read-only display of the user's IPFS pin status + successor non-profit pledge number.

**State variations.**
- **Switch in WARNING state.** Section 3's eyebrow becomes `dead-man's switch · check-in due`. The check-in link is the only `warm` element on the page.
- **Switch TRIGGERED.** Section 3 displays the legacy-contact verification audit log + a cancellation link.

### 6.13 Billing `/billing`

**Purpose.** Subscription state, currency, invoice history.

**Primary content blocks.**
1. Current tier (display name, price in user currency, next renewal date) in Newsreader H3.
2. Tier comparison table — Free / Essential / Family / Founder. Marked current tier; clear tier-change links. Family-tier emphasized as *per family, not per seat*.
3. Currency selector — segmented mono control: `USD · EUR · GBP · ZAR · AUD · CAD · INR · JPY · CNY · BRL`.
4. Invoice history — table: date (mono), amount (mono), status (eyebrow), download link.
5. Payment method — masked card; update via Stripe checkout link.

### 6.14 Inherit `/inherit/:token`

**Purpose.** Token-gated reader for descendants who do not have an account. The first impression of Heirloom for a 14-year-old reading their grandmother's letter.

**Primary content blocks.**
1. **Cover** — A single editorial screen:
   - Eyebrow mono: `for [recipient name]`
   - H1 (Newsreader): *Someone left this for you.*
   - Sub (bone-dim): *Written by [author], [year]. Unlocked [release-condition].*
   - A single text link: `open →`.
2. **Reader** — On open, the entry renders in the same Wall typography as the product. No nav, no chrome. A single text link at the bottom: `create an account to read the full thread →` (optional; descendants are never forced to sign up).

**Interactions.**
- The Unlock dissolve plays once on first open (720ms). On reload, the entry is shown directly.

**State variations.**
- **Expired/revoked token.** *This invitation is no longer active. The thread's current keeper can issue you a new one.*

### 6.15 Founder `/founder`

**Purpose.** Pitch the $999 lifetime Founder tier. Funds the successor non-profit.

**Primary content blocks.**
1. Hero — eyebrow `THE FOUNDER PLEDGE`, H1 *Be remembered as the one who began.*
2. The pledge — A four-paragraph editorial explanation: what Founder funds, what the engraved name means, the successor non-profit, the IPFS continuity layer.
3. The continuity record — A scrolling vertical list of mono-set pledge numbers + Founder names + year. The current count: `pledge no. 0117 — 2026-06-05 — [name redacted]`.
4. Pricing block — single warm `$999 one-time · lifetime` line.
5. CTA — `Become a founder →` (warm).
6. FAQ — editorial Q&A.

### 6.16 Founder Welcome `/founder/welcome`

**Purpose.** Ceremonial post-purchase screen.

**Primary content blocks.**
- A single full-screen editorial moment:
  - Eyebrow mono: `pledge no. [N] · [date]`
  - H1 (Newsreader, large): *Welcome, [Name].*
  - Sub: *Your name has been engraved in the continuity record. Your family's thread can begin.*
  - A single warm text link: `begin →`.
- No confetti, no animation other than a single 1400ms fade-in.

### 6.17 Wrapped `/wrapped`

**Purpose.** Annual reflective summary (December).

**Primary content blocks.**
- A vertical scroll of editorial moments:
  1. *This year, your thread added [N] entries.*
  2. *The most-read entry was [title] by [author].*
  3. *[Name] joined the thread.*
  4. *[N] entries are sealed for the future.*
  5. *Next year, [N] entries will unlock for [recipient].*
- Each "page" is a single sentence in Newsreader, plus a mono-set sub-line.
- No share buttons. The user may export the wrap to PDF.

### 6.18 Admin Dashboard `/admin/dashboard`

**Purpose.** A ledger of platform metrics — accounts, MRR, switch events, IPFS pin health. **Never content.**

**Primary content blocks.**
- A monospaced tabular ledger:
  - Accounts total / active / trial / paid
  - MRR in USD-equivalent
  - Switches in WARNING / TRIGGERED states
  - IPFS pin failures (last 24h / 7d)
  - Recent admin actions (audit excerpt)
- No charts with gradient fills. If a chart is necessary, it's a single-color hairline line chart.

**State variations.**
- **SUPPORT role.** All write actions hidden. Tables read-only.

---

## 7. Cross-cutting features

### 7.1 Search

A single global search affordance — invoked with `/` or by tapping a mono `search →` link in the eyebrow row. The result surface is editorial:
- One result per row: title in Newsreader, date + author in mono dim, 1-line snippet in bone-dim.
- Filters appear inline above results: `entries · members · letters · all`.
- No autocomplete dropdown that resembles Google. Results render inline below the input.

### 7.2 Notifications

**No toast notifications.** All system feedback is inline:
- Switch state changes appear as a single mono line in the eyebrow row of `/` (the Tapestry home).
- Entry unlocks appear in `/inbox` and via email/push if configured.
- Comment notifications appear as a count in the relevant Thread row.

**Push notifications (PWA).** Editorial copy, not punchy. *"A letter has opened for you."* not *"📬 New unlock!"*

### 7.3 AI features — The Listener

AI in Heirloom is one named, ambient presence: **The Listener**. It is not a chatbot, not a sidebar, not a "✨" button, not a copilot panel, not a slash-menu. It is a typographic line in the margin, governed by strict invariants. See §1.5 Invariant C and §2.5 (the Listener component).

**The Listener's behavior across the product.**

| Surface | Listener does | Listener does not do |
|---|---|---|
| Tapestry home `/` | Stays silent 12s. May speak once about an upcoming unlock or a long-silent member's region of the cloth. | Greet, suggest a topic, prompt to write. |
| Composer | Stays silent while typing. After 8s pause, may name a missing referent (a person, place, date not yet on the Thread). | Suggest phrasings. Autocomplete. Edit prose. |
| Wall | May speak once, noting an entry that shares language with the one on screen. | Summarize, paraphrase, "TL;DR." |
| Inbox | May speak once, surfacing forgotten context for an unlocking note. | Recommend a "next letter to read." |
| Bloodline | May speak once, naming a member with the longest silence on the Thread. | Suggest who to invite next. |
| Q&A | Is fully present — this is the one surface where the Listener answers. Its answers cite entries; it never invents. | Speak in first person, claim feelings, take a persona. |
| Letters | Same as Composer. | Generate letter drafts. |
| Memories / Family / Settings / Billing | Silent. The Listener never interrupts administrative work. | — |
| Admin | Silent. The Listener never appears on admin surfaces. | — |
| Public marketing | Silent. | — |

**Underlying capabilities (invisible plumbing).**
- **Voice transcription** — inside `/record`. Inline. The user sees the transcript; they do not see the Listener doing it.
- **Tag generation** — applied silently. Tags appear in the meta line of an entry without ceremony.
- **Retrieval (RAG)** — only on Q&A. Visibility-respecting (descendants-only entries are not retrieved for current-generation readers).
- **Referent detection** — what powers the Composer's "missing name" Listener line.
- **Pattern surfacing** — what powers the Wall's "shares language with three earlier entries" line.

**Why this is a world-first.**

No shipping AI product expresses itself as ambient typography. Every consumer AI today is a chat panel, an inline rewriter, a sidebar copilot, a `/`-menu, or a popup. The Listener is the inverse: the AI's visual cost is one warm-adjacent hairline, dismissable, with strict per-screen quotas, and zero persona. A user can use Heirloom for years and never engage the Listener — the product is unchanged. That choice is the world-first.

**No AI is the headline. The product is a thread.** The Listener is the only AI the user ever sees, and it is small on purpose.

### 7.4 Offline (PWA)

Every authenticated screen must function offline for read; Composer + Record must function offline for write (queued sync). Offline state is communicated by a single mono line in the eyebrow row: `offline · changes will sync`. No banner, no modal.

### 7.5 Internationalization

The product ships in English, French, Spanish, German, Portuguese, Dutch, Italian, Afrikaans, Zulu, Mandarin, Japanese at launch. Type system must support CJK + diacritics. Newsreader has full Latin Extended; CJK falls back to Source Han Serif (matching weights). Layout adapts to RTL (Hebrew + Arabic in phase 2) — eyebrow rows mirror, gutters swap.

### 7.6 Accessibility (hard requirements)

- WCAG 2.2 AA on every text element. AAA on body text.
- Reduced motion: every motion has a static equivalent. The Tapestry pan is replaced by a snap; the selvedge thread sway is removed; the Unlock is an immediate state change.
- Keyboard: every interactive surface is reachable + visible focus ring (1px warm hairline, 2px offset).
- Screen reader: all named primitives have aria labels. The Tapestry announces as a navigable region: *"family tapestry · [N] entries from [year] to [year]"*. Individual woven threads announce as *"entry · [author] · [date] · [title]"*. Sealed Notes announce as *"sealed entry · [date] · for [recipient]"*.
- Touch targets: 44px minimum.
- Larger-type mode (elder mode): scales the entire type system by 1.25× and increases line-height by 0.1. A toggle in Settings → Accessibility.
- High-contrast mode: bone bumped to `#ffffff`, warm bumped to `#e89a5e`.

### 7.7 PWA-specific behavior

- **Install affordance.** A single mono link in the Settings → Account section: `install heirloom as an app →`. Not an in-app banner.
- **Splash.** The cloth's warp threads being woven from left to right at high speed, finishing at the user's actual entry count. ≤1200ms. After the last weft thread lands, the canvas resolves into `/`.
- **App icon.** A single `∞` glyph in warm on ink. No avatar, no wordmark.
- **Status bar.** Ink. The Tapestry edge's natural-dye palette is allowed to bleed into the bottom safe area on iOS — the cloth runs to the edge of the device.
- **Pull-to-refresh.** Disabled. The product is not a feed.

---

## 8. State conventions

### 8.1 Loading

A 1px bone-on-ink hairline progress bar across the top edge of the affected container. Animates left-to-right at 1400ms. **No spinners. Ever.**

### 8.2 Empty

Empty states are editorial moments, not illustrations. One sentence in Newsreader, one optional CTA link in warm. Examples:
- Empty Thread: *Your thread is waiting. The first entry is the hardest.*
- Empty inbox: *No letters are queued for you. Quiet years are still part of the thread.*
- Empty search: *The archive holds no entries that match. Try asking about a person, place, or year.*

### 8.3 Error

Error states are inline mono lines beneath the affected control: `couldn't reach the archive · try again`. The control receives a single warm underline. No red. No alert dialog (except for destructive confirmations).

### 8.4 Confirmation

Destructive actions (delete account, cancel triggered switch) use a single inline confirmation that replaces the action affordance with two mono links: `confirm · cancel`. No modal.

### 8.5 Success

Success states are inline. The action affordance is replaced with the new state. No "Saved!" toast.

---

## 9. Responsive grid

- 360–767px (Mobile): 4-column grid, 16px gutters, 24px margins.
- 768–1179px (Tablet): 8-column grid, 24px gutters, 40px margins.
- 1180px+ (Desktop): 12-column grid, 24px gutters, max content 1180px.
- 2560px+ (Large desktop): content width remains 1180px; surrounding ink expands.

**Vertical rhythm.** Every section spaced in multiples of 64px on desktop, 32px on mobile.

---

## 10. The naming dictionary (for Stitch's outputs)

Stitch should label components in its export using these exact names. They map 1:1 to the React component library.

| Component | Role | Where it appears |
|---|---|---|
| `Tapestry` | The central surface. Full-canvas woven cloth on `/`; 4/8px persistent edge band on every other authenticated screen, descendants' reader, and admin (as `Ledger`). Carries the warm position-hairline. | All product screens |
| `TapestryWeave` | The 1400ms publish motion (unwoven selvedge thread → woven weft) | Composer, on publish |
| `SealedNote` | Time-locked entry primitive (∞ glyph + date + recipient, with a hairline tether to the future weave position in the cloth) | Tapestry home, Inbox, Wall margins |
| `Unlock` | The 720ms dissolve | Sealed Note → entry transition |
| `Listener` | Right-margin ambient AI line; mono; speaks once per screen at most | All authenticated screens except Composer (rate-limited) and admin (never) |
| `Ledger` | The admin analogue of the Tapestry — mono tabular band at canvas bottom | Admin console |
| `Composer` | The writing paper laid over the cloth | Compose, Letters |
| `BreathRing` | Voice-record indicator | Record |
| `Wall` | Chronological entry list — a single thread of the Tapestry zoomed all the way in | Thread detail |
| `Bloodline` | Typographic tree, with each member's region of the cloth highlighted on hover | Thread bloodline |
| `LivingBookOrder` | Print-on-demand surface; cover is a print of the family's Tapestry | Thread book |
| `ProgressHair` | 1px hairline progress | Loading state, global |
| `EditorialCTA` | Warm text link in negative space | Used everywhere |
| `EyebrowMono` | Tiny mono row at top of screens; carries the append-only entry counter | Used everywhere |

---

## 11. Definition of done (for any screen Stitch produces)

A screen is **done** when:

1. It uses only `Newsreader`, `Inter`, `JetBrains Mono` — no third typeface.
2. It uses only the color tokens in §2.2 — `warm` covers <3% of the surface.
3. It contains no spinners, no toasts, no glassmorphism, no gradient meshes, no avatar circles, no decorative icons, no decorative emoji.
4. It has 60–70% negative space.
5. Its only motion is the slow cloth pan (when applicable), the ±2% selvedge thread sway (Composer only), and meaningful 180/360/720/1400ms transitions.
6. It hits WCAG 2.2 AA on all text, AAA on body prose.
7. Every interactive element has visible keyboard focus.
8. It has reduced-motion, offline, empty, error, and loading variants.
9. It includes role-specific variants where §4.4 demands them.
10. It looks like it could have been printed in 1970 and could be read in 2076.
11. **It carries the Tapestry edge** along the canvas bottom (4px mobile / 8px desktop) with the 1px warm position-hairline. The Tapestry is the navigation chrome — no tab bars, no breadcrumbs, no rail. (Exception: public marketing screens.)
12. **It carries the append-only entry counter** in the eyebrow row: `thread no. NNNN · entry N,NNN`.
13. **It reserves the Listener margin slot** — a right-margin column 60ch from the content measure (below the eyebrow on mobile), empty by default, sized to render a single mono right-aligned line. The Listener is silent on public marketing, on the Composer while typing, on admin, and during the first 12s of any session on `/` (the Tapestry home).
14. **No chatbot panel, sidebar AI, copilot dock, or sparkle ✨ button anywhere.** The Listener is the only AI surface in the product.

If any of these fail, regenerate.

— end brief —
