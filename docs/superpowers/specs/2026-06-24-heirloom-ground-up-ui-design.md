# Heirloom — Ground-Up UI & Brand Rebuild Spec

> Ground-up rebuild of the entire Heirloom surface — web app / PWA, marketing & landing site,
> login, logo, and PWA identity — on the new **BRAND.md ("The Deep")**. Keeps the water backdrop
> and the edge API. Replaces the screen architecture, the journey, the type/layout/colour system,
> and the visual identity with one coherent interface grounded in the psychology of the three
> people who actually use it. Supersedes the live Cormorant/Spectral re-skin and the interim
> "Held" cloth/copper/ink system.

**Status:** approved direction — ground-up new UI (no preserved legacy layer); new-from-scratch
brand ("The Deep") approved; logo direction A mark ② approved; scope includes marketing site,
login, logo, PWA. Straight to plan.
**Date:** 2026-06-24. **Branch:** `rebrand-2026`.

---

## 1. Why rebuild

The live app is aesthetically extraordinary and emotionally mistuned. It is a museum optimized for
reverent *reading*, bolted onto a capture flow that asks ordinary families — especially reluctant
elders — to do the single hardest thing in the category: write into a blank box framed as "the
first line of a thousand-year thread." Reverence is right for *keeping*. It actively fights
*filling*. And the visual identity (cloth, copper, ink) fought both the product's name
(`heirloom.blue`) and the one element every team loved and kept: the **water**.

Three facts make a ground-up rebuild the right call rather than a patch:

1. **The brand is new from scratch — The Deep.** BRAND.md is rewritten on the water: `deep` blue
   ground, the warm gold **surface-line** as the lone "now" accent, the **Sounding mark** (depth
   rings + one gold line), depth/rise-sink motion, and a vocabulary built on the water (*the Deep,
   lowered in, surfaced*). The live bundle is on none of this. The rebuild is how The Deep ships.
2. **The information architecture is wrong, not just the paint.** The empty-timeline home, the
   blank-box onboarding, the buried prompts, the cold "join my archive" invite — these are IA
   failures. Re-skinning them keeps the failures.
3. **The identity surfaces are stale or absent.** The logo (cloth knot), the PWA icons, the login,
   and the marketing/landing site all carry the old language. They are in scope and rebuilt here.

This spec is **binding on UI and brand surfaces**. When code and this spec disagree, fix the code.
The two truths above the spec are unchanged: the **product truth** (perpetual, append-only,
multi-author, multi-generational family Thread; web `heirloom.blue` + PWA) and the **frozen
commercial facts** (Free $0 · Family $6.99/mo · $69/yr · Founder $249 role-only, withdrawn · ZAR
untouchable).

---

## 2. Who we design for (and what they can tolerate)

Three people, opposite tolerances. Every decision below is traceable to one of them.

- **The Custodian** (35–50, usually the adult daughter — kin-keeping skews female). Tech-fluent.
  Buys the subscription, drives activation. Engine: **anticipatory loss** and **regret-avoidance**
  — *"I wish I'd asked Grandma before she died."* The most-felt sentence in the category.
- **The Source** (60–85). Holds the richest content. Lowest tech tolerance, highest emotional
  stakes. Motivated by being *heard* (generativity). Defeated by a blank box; threatened by any
  "you're going to die" framing. **Voice is native; typing is a wall.**
- **The Inheritor** (5–30). The entire long-term value is for them. Passive today. The payoff,
  not the user.

### The five psychological laws

1. **Question-led beats blank-canvas, always.** Free generation is the most expensive cognitive
   act; answering a concrete question is nearly free.
2. **Cued reminiscence is intrinsically rewarding** (the reminiscence bump, ages 10–30). Cue the
   era and an elder talks for an hour; don't and they freeze.
3. **Endowment + loss aversion.** Three threads make the archive a possession a family won't
   abandon. Onboarding's only job is to manufacture that endowment fast — ideally one thread from
   the elder inside five minutes.
4. **Memory is a social act.** The **question relay** ("Maya asked you: how did you and Dad meet?")
   converts a solo chore into answering a loved one — the strongest engine in the category and the
   natural viral loop.
5. **Mortality is sublimated, never stated.** The water carries "forever"; the words stay warm and
   present. (BRAND §4 rule 1: arrival-of-love, never loss.)

---

## 3. The two modes, one water

The product reads as two emotional registers sharing the water as their constant:

- **THE ASKING** — the capture engine. Warm, easy, present-tense, momentum. Question-led,
  voice-first, conversational. Gold on the live prompt (NOW). Where families spend daily effort.
- **THE KEEPING** — the archive, reading, inheritance. Reverent, generous, eternal. Fraunces
  display, mono stamps, the reverent release lexicon, sealed notes lowered into the water. The
  cathedral; the payoff.

The water (`WaterCanvas`, seeded by the family's member dyes) is the **home plane** beneath both,
unchanged. UI sits on the quiet **surface plane** above it (BRAND §6.1). The water is the one thing
the rebuild does not touch — never re-skinned, blurred, or layered over.

---

## 4. Information architecture

Collapse the sprawl (84 routes, ambiguous `cloth | memory | home | voice | profile` nav) to four
clear surfaces with plain names, plus one action surface. Jargon nav dies.

| Surface | Mode | Job | Default? |
|---|---|---|---|
| **Today** (the Listener) | Asking | One warm question + the Prompt Deck. Voice-first. The present surface, the daily front door. | ✅ home for returning users |
| **The Deep** | Keeping | The kept record. Descend through it — reverent reading, browse by person / time / thread. The timeline/horizon lives here as an *earned* view, never the empty default. | — |
| **The Bloodline** | both | The family: dyes, keepership, invites, and the **question relay** ("ask someone"). | — |
| **You** | chrome | Account, theme, export, the dead-man's-switch, the quiet "N voices · N threads kept" counter. | — |

Nav = **Today · The Deep · Bloodline · You** (Inter, sentence case, self-evident; Today = the
present surface, the Deep = descend into the kept past). Compose is the primary action, gold,
reachable from Today and from any answer — not a nav tab.

### 4.1 First run — the Source-safe path

Replaces the wordless 6-beat `/begin` ceremony and the blank-box onboarding.

1. **Land.** Hero *"Some things only get deeper."* (Fraunces). One CTA.
2. **Choose your thread.** Name + pick one of the ten named dyes (BRAND asset #2, the dye ritual) —
   which also seeds the family's water. Low stakes, identity, warm. Never "pick your profile
   colour."
3. **The first question.** ONE concrete Listener question, a large **hold-to-talk** affordance, a
   small *type instead*. Answerable in ~20 seconds by voice. First thread **lowered in** →
   endowment created. (Never "the first line of a thousand-year thread.")
4. **Bring someone in — as a relay.** *"Who do you want to hear from?"* sends **them a question**,
   not a bare invite. Skippable.
5. **Land on Today**, first thread already in the Deep, the next question waiting.

### 4.2 Daily loop

Open → Today → the Listener question → answer (voice default) → *lowered in* → it settles into the
Deep → optionally relay a question to someone. Async: *"Maya asked you: …"* — warm, no urgency, no
streak.

### 4.3 Keeping / inheritance

The Deep: descend through the kept record, reverent. Sealed notes read *held until / opens when*
and sit below the surface. Release surfaces use the reverent lexicon — **no gold, no app chrome**
(BRAND §10). Recipient controls when they open.

---

## 5. Design system (binding — from BRAND.md "The Deep")

### 5.1 Type *(kept stack — re-justified, not re-chosen)*
| Role | Family | Settings | Where |
|---|---|---|---|
| Display / Voice | **Fraunces** (variable) | `opsz`~110, weight~360, tracking −0.01em, never < ~24px | Hero, the Listener prompt, sealed/release copy, chapter openers. Never running body. |
| Reading / Prose / Inputs | **Source Serif 4** | 17px / 1.6 | The memory-body workhorse. |
| UI chrome | **Inter** | calm, tall x-height | Buttons, nav, labels, small UI. |
| Archival / Metadata | **JetBrains Mono** | UPPERCASE, +0.12em, tabular | Dates, generation counts, keepership, IDs, colophon. Sparingly. |

**Cormorant is deleted. Spectral is replaced by Source Serif 4.** Body type ≥17px everywhere.

### 5.2 Colour
- Ground `deep #070d14` (near-black, blue cast), recesses `abyss #04080d`, raised
  `surface-plane #0c151f` / `elevated #122031` / `hover #182a40`. Text `bone #f2e6d0`
  (+`bone-bright/dim/faint`). Hairline / left margin line `rule rgba(242,230,208,0.11)`.
- **Gold `surface #e0a062` = NOW**, under 5% of any surface: the Listener prompt, the active
  compose cursor, the single primary CTA, the mark's surface-line. Nothing else. (Highlight
  `surface-bright #f0c074`, pressed `surface-dim #b07a3e`.)
- **Ten dyes = WHO**, signal only: 3px left margin-thread + name colour + the family water tint.
  Never fills, buttons, or solid backgrounds. Paired `--dye` / `--dye-text` (AA in both grounds).
  Names, not numbers.
- `blood #9f3a2a` destructive only. Light theme = `shallows #eef2f6`, gold AA-lifted.
- **Hierarchy rule:** Gold = NOW · Dye = WHO · blue depth = the medium & the kept past (deeper =
  older, cooler, dimmer), never gold.

### 5.3 Space
8px base rhythm (4px sub-grid). Content hangs off a **left margin line** (the member's dye thread
descending). Single column, **66ch** prose measure. **~55–60% inhabited empty** — calm and deep,
never the old 70% monastic vault. Water is the home plane; UI on the surface plane above, depth
showing through.

### 5.4 Motion
One calm spring (stiffness ~170, damping ~26) for entrances/layout; **220ms** micro-states. Things
**settle, never bounce**. Durations 180 / 360 / 720 / 1400ms. Information-carrying only, metaphor =
**rise/sink**: a new entry/member **surfaces** (rises from depth); a note **sinks** as it seals
(water closing over); past entries rest at their depth (descending = scrolling back); on load the
gold surface-line draws once (~1400ms) then rests. **UI chrome loops nothing forever** (the water
itself moves perpetually and untouched). Seal = press-and-hold / lower into still water.
`prefers-reduced-motion` fully honoured (renders at rest). **ProgressHair**, never spinners. Inline
status, never toasts.

### 5.5 Mark & assets
The **Sounding mark** (BRAND §8) — concentric depth-rings (bone, descending alpha) crossed by one
gold surface-line. Master 192, favicon 48, maskable 512, shallows-reversed lockup. No `∞`, no
filament web, no cosmic loom, no cartoon droplet. The Family Spectrum (dye colour-bar + water
seed), the mono archival stamp, the reverent release lexicon.

---

## 6. What is kept, rebuilt, deleted

**Kept (do not touch):**
- `WaterCanvas` + water shaders + dye seeding (the home plane). Never re-skinned or effect-layered.
- The entire edge API / worker (append-only, soft-delete, seal redaction, encryption, billing,
  moderation). The dye data model. ProgressHair. Pricing. ZAR localization.

**Rebuilt:**
- The shared UI kit (new descent-grid primitives + the Sounding mark; retire `CosmicUI`).
- Design tokens in `globals.css` + `tailwind.config.js` (fonts, gold, deep/shallows grounds, dyes,
  space, motion).
- Nav (4 clear surfaces) — retire `BottomNav`'s jargon items.
- Today / the Listener + Prompt Deck (new). Voice-first Compose. The question relay. Choose-thread
  onboarding + first-question. The Deep (reverent reading). Bloodline. You.
- **The logo & PWA identity:** the Sounding mark as logo / wordmark lockup; favicon; maskable +
  any-purpose PWA icons (512/192/apple-touch); `manifest.json` (name, theme `#070d14`, background
  `#070d14`, icons); OG/share image on The Deep.
- **The login / auth screen** — on-brand entry over the water (replaces the legacy login surface).
- **The marketing / landing site** — public front door at `heirloom.blue`: hero *"Some things only
  get deeper."*, the Listener as the content unit, plain pricing (frozen), share/OG, on The Deep.

**Deleted:**
- Cormorant usage everywhere; Space-Mono-as-chrome; the cloth/copper "Held" tokens & Warp-and-Weft
  mark.
- The wordless `/begin` 6-beat ceremony; the blank-box onboarding; the empty-timeline-as-home
  default. Dead legacy components once their routes are migrated.

### 6.1 Two-store footgun (must honour)
`thread_entries` (threadsApi) and `memories` (memoriesApi) are disjoint stores; the home surface
and the new-user gate read **only** `memories`. Every capture surface in The Asking (Listener
answer, Compose, relay answer, voice) MUST write via `memoriesApi` or the entry is invisible.
Sealed `thread_entries` endpoints must keep server-side seal redaction.

---

## 7. Phasing (each phase ships working software; each gets its own plan)

- **Phase 0 — Foundation & identity.** Design tokens (4 fonts, gold, deep/shallows, dyes, space,
  motion) in `globals.css` + `tailwind.config.js`; descent-grid layout primitives; the new shared
  kit; **the Sounding mark SVGs (logo lockup, favicon-48, maskable-512, any-purpose 192/512,
  apple-touch) built and wired; `manifest.json` + index head updated (theme/bg `#070d14`); OG/share
  image**; motion springs; ProgressHair retained; light-theme + dye-on-`deep` **AA re-verify**.
  Everything downstream depends on this.
- **Phase 1 — The Asking & entry** (highest leverage). Today/Listener + Prompt Deck; voice-first
  Compose (auto-transcribe); the question relay; choose-thread onboarding + first-question; **the
  new login / auth screen**. Activation lives here.
- **Phase 2 — The Keeping.** The Deep reverent reading; sealed/release surfaces (reverent lexicon,
  no gold); the timeline/horizon as an earned view.
- **Phase 3 — Bloodline & periphery.** Family/keepership, invites, You/Settings, export, DMS,
  letters — onto the new system.
- **Phase 4 — Sweep.** Remaining ~70 routes onto the new kit; delete dead old components; final
  a11y + reduced-motion + light-theme AA pass.
- **Phase 5 — Marketing & landing.** The public site at `heirloom.blue` on The Deep: hero, the
  Listener content unit, plain frozen pricing, OG/share, install/PWA prompt. (Marketing *automation*
  in `marketing/automation/` is unchanged — this is the landing surface only.)

The first implementation plan covers **Phase 0 + Phase 1** (foundation/identity + the activation
engine, including login). Later phases get their own plans.

---

## 8. Success criteria

- New family reaches **one voice thread lowered in inside 5 minutes**, no blank box, no
  thousand-year framing (psychology law 3).
- Capture is question-led and voice-default everywhere a Source touches it (laws 1, 2).
- The relay loop exists end to end: ask → notify → answer → lowered in (law 4).
- Identity ships coherent: Sounding logo + favicon + maskable/any-purpose PWA icons + manifest
  (`#070d14`) + OG image, all on The Deep; install prompt works; no old cloth/copper mark remains.
- Login and the landing site are on The Deep, hero *"Some things only get deeper."*, pricing stated
  plainly and frozen (Free $0 · Family $6.99/$69 · Founder $249 role-only withdrawn · ZAR intact).
- Zero Cormorant; body ≥17px; AA in both grounds (re-verified on `deep`/`shallows`);
  `prefers-reduced-motion` honoured; no spinners, no toasts, no countdowns/streaks/urgency near
  sealing/DMS/release/pricing (BRAND §11).
- Gold < 5% of every surface; dyes signal-only; the water untouched.
- `tsc --noEmit` / `npm run build` clean (the launch gate).
