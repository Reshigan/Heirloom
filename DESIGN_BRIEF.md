# Heirloom — Visual Design Brief

For: a graphics / motion designer or small studio.
From: Reshigan + the engineering side of Heirloom.
Date: 2026-04-29.

---

## In one paragraph

Heirloom is a perpetual, multi-generational family archive — a "thread" a family writes into over decades, with entries that can be time-locked to release on dates, ages, or events. It's designed to age well over 50+ years of use; it's also designed to be share-worthy enough that families talk their friends into joining. The product's home surface is *The Hearth* — a fire on a deep warm canvas, with stones around it for each family member, and time-locked "bundles" sitting in the warm darkness waiting to unfold. The artifact view is *The Tapestry* — a woven cloth where every entry is a single thread. The engineering is built. The visuals need a real hand. We've shipped a developer-built placeholder; replacing it is your job.

Live placeholder: <https://heirloom.blue/hearth>

---

## Audience

Adult women 35–60 with at least one living parent over 65. Grief-adjacent, family-keeper psychology. Browses on iPhone or iPad, increasingly on Vision Pro by 2028+. Not the Linear/Figma/Notion design-aware audience — these are people who recognize Pinterest aesthetic and Penguin paperback covers more than Are.na or Vercel docs.

---

## What's already decided

- Single hot accent: a warm sealing-wax terra-cotta. Not yellow gold.
- Page surface: warm near-black `#0e0e0c`. Not pure black.
- Type system: Newsreader (variable optical sizes 6..72) + Inter + JetBrains Mono.
- The two surfaces are *The Hearth* (home/ritual/presence) and *The Tapestry* (artifact/woven record).
- The wax seal is the canonical mark for time-locked entries.
- The unlock sequence is the product's signature motion: cord burns, seal melts, cloth unfolds. ~4 seconds.
- Honors `prefers-reduced-motion`. WCAG 2.2 AA contrast minimum.

These can be questioned — but bring evidence.

---

## What we need from you

### 1. The Fire

The current canvas-particle fire reads as developer-generated. We need a fire that reads as real, but **not as a video screensaver**. Think: a small, intimate fire at dusk seen across a quiet room, more Tarkovsky than Pixar.

Deliverables:
- One looping animation, ~6–10 seconds, perfectly seamless. Format: WebM (VP9 + AV1) for web, plus a Lottie or video alternative. Resolution: 1080×1620 (vertical), with a crop-friendly composition that holds at any aspect.
- Or: a layered Lottie (After Effects) build with separable layers (flames / coals / sparks / smoke / heat shimmer) that we can composite per-state in code. Preferred over video for scale + performance + future Vision Pro porting.
- Five flame intensity states: dim / low / steady / strong / settling. We crossfade between them in code based on app state.
- A "fire dim" state at ~70% intensity for when an entry is being read.

### 2. The Hearthstone & Logs

The thing the fire sits on. Currently SVG. Needs to read as actual charred wood with glowing red coals between cracks. Slow pulse on the coal glow. Could be a single illustration with a Lottie pulse layer.

### 3. The Stones (family members)

Each member is a small stone in the arc near the fire. We need:
- 6–8 organic stone shapes with believable surface texture and slight variations.
- Each stone has three live states: dim (cool, no recent activity) / warm (recent activity) / lit (currently being viewed).
- Lit state: a directional warmth on the stone's fire-side, a faint cast shadow on the dark side.
- Stones are typographic-affordance; member names appear on hover only, set in Newsreader 12pt.

### 4. The Wax Seal

The single most-used visual primitive. It marks every time-locked entry. We need:
- One canonical wax seal: hand-pressed, warm red-orange, with the ∞ mark embossed into it. Slightly imperfect — real wax bubbles at edges.
- A breathing animation for the sealed state (very subtle, ~8s cycle).
- A melting/breaking animation for the unlock moment (see #5).
- File: SVG with optional Lottie wrapper for the breathe.

### 5. The Unlock Sequence (signature motion)

When a time-locked bundle's date arrives, the cord burns, the seal melts, the cloth unfolds. ~4 seconds. This is the product's most-shareable moment — it's the screenshot/video the family posts when their grandmother's letter opens for them. **Get this right or nothing else matters.** Reference: the burning rope in *Apocalypto*, the candle going out at the end of *Andrei Rublev*, the seal-press scene in any good period film.

Deliverable: a Lottie or video loop, transparent background, with a clean handoff timecode (cord ignition → seal melt → unfold).

### 6. The Tapestry texture

The artifact view is a woven cloth illuminated by the fire. We have the data layout (one weft thread per entry, 10-stop natural-dye color palette already defined). What we need is the *texture* — believable hand-loomed fabric:
- Visible warp threads (vertical, structural) with subtle irregularity.
- Frayed right edge where the next thread will be tied.
- Slight vertical sag from the cloth's weight.
- An overall lamp/firelight viewing tint.

Deliverable: a Photoshop / Procreate texture export at 4K, plus an SVG warp-pattern. We composite the colored weft threads in code on top.

### 7. Page atmosphere

A lighting study for the page itself: where is the firelight casting? Where are the deepest darks? How does the user's pointer-light interact with the surfaces? Describe with annotated screenshots, not specs.

### 8. Iconography system

Replace Lucide entirely. We need ~12 custom icons drawn by the same hand. List in `frontend/src/components/icons/needed.md` (we'll write this if you take the engagement).

---

## Tone references

Study these specifically. We will reject work that reads as inspired by Apple, Vercel, Linear, Figma, or other tech-aesthetic peers — those signal "of 2024–2026" and we are designing for 2076.

- **Painters:** Caravaggio's candlelight (*The Calling of Saint Matthew*, *The Cardsharps*); Vermeer's interior light (*Woman Holding a Balance*); Andrew Wyeth (*Christina's World* — the dryness, the patience).
- **Filmmakers:** Tarkovsky (any fire scene, especially *Stalker*'s opening); Terrence Malick (*Days of Heaven* — the firelit-prairie sequence); the seal-pressing scene in Tarr's *Werckmeister Harmonies*.
- **Books:** Penguin Modern Classics hardback covers (Coralie Bickford-Smith); Phaidon's *Studio Ghibli Storyboards*; FSG hardcover poetry; Folio Society editions.
- **Print/illustration:** Olly Moss; Anders Nilsen; the woodblock prints of Hiroshige; Sara Fanelli's children's books; Beatrice Alemagna.
- **Web/digital:** Are.na's restraint; Sefaria's Talmud reader (for Tapestry); the Folger Shakespeare's online Hamlet edition; *Cabinet Magazine*'s site.
- **Anti-references** (don't): Apple's product pages; Vercel's gradient meshes; any site that uses Inter Display tightly tracked at 80px; "fireplace screensaver" videos; mobile-game wax seals.

---

## Constraints

### Technical

- Final assets ship in `frontend/public/hearth/` and are referenced by existing components (`Fire.tsx`, `Stone.tsx`, `Bundle.tsx`, `Tapestry.tsx`). The component API is already abstracted; you replace the rendering layer.
- File budgets: Fire animation under 800KB (we'll cache aggressively in service worker). Wax seal SVG under 8KB. Tapestry texture under 200KB.
- Lottie versions preferred over video where possible — scales, themes, compose-able, zero pixel artifacts. Bring your After Effects + Bodymovin output.
- Honors `prefers-reduced-motion`: provide single static frames for every animation.
- Honors `prefers-color-scheme: dark`: the entire visual system is dark-only (the logged-in archive is a vault, not a page).
- WCAG 2.2 AA on every text element; AAA on body text.
- 60fps target on iPhone 12 (4-year-old phone) for all motion; budget enforcement is on us.
- Vision Pro readiness: every layered animation must be re-implementable in RealityKit. Avoid effects that depend on 2D-canvas-only tricks (additive blending stacks, etc.). Document layer separation.

### Aging

This is a 50-year product. Avoid every visual trend that will date.
- No glassmorphism. No gradient meshes. No 3D-skewed cards. No tracked-tight Inter Display.
- Yes typography that's been beautiful for 200 years. Yes color systems borrowed from natural dyes and pigments. Yes restraint.

### Accessibility

- Contrast ratios specified per component.
- Reduced-motion versions of every animation.
- Voice / screen-reader friendly: all motion is decorative, never load-bearing.
- Keyboard focus visible on every interactive surface.

---

## Process & integration

1. **Kickoff.** 60-minute call. We walk through the live placeholder, the data architecture, the Tapestry concept. You ask questions.
2. **Reference round.** You come back in week 1 with a moodboard pinned to specific elements. We approve direction before any production work.
3. **Production.** Weeks 2–5. Async, with a Friday async review each week. Figma board for static, Frame.io or Vimeo for motion.
4. **Integration.** I integrate your assets into the existing component architecture as you ship them. We test on real devices each week (iPhone 12, iPad, MacBook, Vision Pro if you have access).
5. **Polish.** Week 6+. Real-user testing (5 people, family-keeper demographic). Adjust.

---

## Timeline & budget

- 4–6 weeks for the initial visual system (items 1–8 above).
- $8K–$25K depending on your level. We pay weekly. We're fine with milestone-based.
- Equity considered for the right person who wants to be the design lead long-term.

---

## How to apply / who we're looking for

We're looking for one of:
- A motion-designer or graphics designer with 5+ years of independent work, ideally with print/editorial in your background, ideally with experience on emotional/family product (not just SaaS).
- A small studio (2–5 people) whose recent work shows restraint and editorial sensibility. Buck if scoped right; Block & Tackle for the unlock sequence specifically; smaller shops like Studio Otherways, 1750, Daylight, or solo: Rauno Freiberg (probably unavailable but worth asking), Frank Chimero, Andy J. Pizza, Sara Wong, Charles Broskoski's referral list.
- A designer who recently left Apple, Linear, the Browser Company, or a respected editorial publication.

To apply: send 3–5 pieces of work with a sentence on each about *why* you made the decisions you made. We don't want a polished portfolio site — we want to see your reasoning. Reply to <reshigan@vantax.co.za>.

---

## What we won't accept

- Anything generated by AI as final art. Reference, sketch, ideate with it — fine. Final assets must be human-craft.
- Stock animations or templates.
- "Fire screensaver" footage.
- Mobile-game style anything.
- Anything that signals "2026 tech aesthetic."

---

## What we will

- Real craft. Slow process. The right reference. A hand on the surface.

— end brief —
