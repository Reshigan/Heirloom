# Heirloom — Viral Free Strategy

## 1. The one-sentence strategy

Make a bloodline-owned family archive spread itself, one sealed letter at a time, by making the free tier the default door and letting every recipient who reads a held-until note become the next author — at zero ad spend, zero bait, in the brand voice the book already mandates.

## 2. The tension resolved

Rule 14 of `voice.ts` forbids engagement bait, trend-chasing, and urgency. Viral mechanics usually require exactly those. The resolution: Heirloom does not go viral by a post. It goes viral by the artifact a post produces — a sealed note delivered by direct link to a named recipient. The product's core unit is already a share event, tuned to the warmest possible moment (someone reading words left for them by a relative). That is a viral mechanic that compounds and never baits, because the share carries genuine emotional payload, not a CTA. The loop is: author writes → note is lowered in → note opens on a future date → recipient reads on a no-signup public surface (`/inherit/:token`, `Marketing.tsx:17` "Letters arrive as a direct link. No signup. No app.") → recipient, now the warmest lead in the system, is invited to add their voice → a new author is created, who lowers in their own note. Each cycle adds an author without a single ad. Rule 14 is squared because nothing in the loop manufactures urgency; the urgency is intrinsic and the voice stays quiet.

## 3. Positioning sharpening

The brand book already did the hard work. We stop undermining it.

- **Hero line:** "Some things only get deeper." (`brand/BRAND.md:62`) — ownable, emotional, never boasts. Today the live hero is `"Start your family's thousand-year thread."` (`Marketing.tsx:138`), the exact line `BRAND.md:76-79` demotes to a durability proof-point because it boasts. Swap them.
- **Pitch (one breath):** Heirloom is the deep water a family keeps the conversation in across generations — written, spoken, and passed on at exactly the right moment — held safe for as long as the family lasts. (`BRAND.md` §3 in-market phrase)
- **Three truths that defend it:**
  1. The metaphor IS the data model — append-only, multi-generational, never deleted, made visible as deep water (`BRAND.md:24-29`). No "memory vault" competitor can copy this without lying about their architecture.
  2. Owned by a bloodline, not a login — the thread belongs to the family, exports free forever even if Heirloom ends (`Pricing.tsx:179`). This is the only honest answer to "what happens when you shut down," and every competitor dodges it.
  3. The held-until note — a letter or voice set to open on a specific future date — is the single most Heirloom-only object on the internet. `voice.ts` rule 4 names it: "the single most Heirloom-only thing there is." Nobody else ships it as a primitive.

`voice.ts:14` says the essence word is HELD. `BRAND.md:34` says it is DEPTH. The book is the source of truth. Fix `voice.ts` first — it is the system prompt for every generated post, and until it matches the book, every social post is off-brand.

## 4. The free viral loop (the architecture)

```
                 ┌─────────────────────────────────────┐
                 │  Author (Free tier) writes a line     │
                 │  + lowers a sealed note for a named  │
                 │  recipient on a future date          │
                 └──────────────┬──────────────────────┘
                                │
                ┌───────────────▼──────────────────┐
                │  Note held at depth (server-side   │
                │  redactSealedEntry, fc8603f)       │
                └───────────────┬──────────────────┘
                                │ date arrives
                ┌───────────────▼──────────────────┐
                │  Recipient reads via /inherit/    │
                │  :token — no signup, no app       │
                └───────────────┬──────────────────┘
                                │ warmest moment
                ┌───────────────▼──────────────────┐
                │  "Add your voice to {threadName} →"│
                │  → /join?code=<recipient-code>    │
                └───────────────┬──────────────────┘
                                │
                ┌───────────────▼──────────────────┐
                │  Recipient becomes a Free author   │
                │  → lowers their own note           │
                └───────────────┬──────────────────┘
                                │
                                └── cycle repeats, compounding authors per bloodline
```

The `/join` preview surface already works — it shows `inviterName, threadName, sampleTitle, memberCount, sinceYear` (`Join.tsx:334-366`) and lets a recipient see the thread before committing. The `PendingInviteAcceptor` (`App.tsx:166-183`) redeems the code post-signup. The loop is wired. The two missing pieces: (a) the recipient-to-author CTA on `/inherit/:token` does not exist — read pages render bequests but never push signup; (b) the primary top-of-funnel CTA defaults to the paid tier, so the first author never enters free without a URL hack.

## 5. Platform plan

The engine's voice prompt is strong (`voice.ts:57-79`); the deployment is stale. The book bans cloth/copper, the engine still ships it (`image.ts:1,21` "The cloth IS the Heirloom identity"; `generate.ts:117` imagePrompt asks for woven linen). The live UI is the "glowing filament web" the brand book explicitly bans (`BRAND.md:339-346`).

| Platform | Verdict | Why | Cadence | Top format |
|---|---|---|---|---|
| Facebook | Keep | 35–65 family-keeper lives here; shares come from recognition (`voice.ts` FB guideline) | 1/day, 40–90 words | Taggable question + cloth-free image with Sounding mark |
| Bluesky | Keep | Asymmetry/surprising-gap shapes spread here; "writes like a person thinking out loud" (`voice.ts` Bluesky guideline) | 1/day, 3-post thread | Asymmetry observation, ≤280 char opener |
| Pinterest | Add back | Long-tail SEO for "family history," "letter to my daughter"; pin images are the longest-lived social asset | 3/week | Sounding-mark card with a taggable question as pin title |
| LinkedIn | Drop for v1 | Voice is kitchen-table, not professional; forced fit breaks rule 7 | — | — |
| TikTok/X/Threads/YT queue | Drop for v1 | `post.ts:12-18` lists queue paths but `voice.ts:11` says only FB + Bluesky. The voice prompt is right; the code is stale. Retire the dead paths. | — | — |

Visual rework (highest-leverage brand gap): replace `image.ts` woven-linen renderer with deep-water + Sounding mark from `BRAND.md` §6/§8. The Sounding mark (concentric depth-rings + one warm surface-line) is the ownable asset the book mandates and the funnel lacks. Until this ships, every social card looks like a stationery app, indistinguishable from a linen brand.

## 6. Earned-media & community roadmap (ranked by reach-per-hour)

1. **Recipient delivery itself.** Every sealed note that opens is an earned-media event, delivered to the one person most likely to forward it. Zero cost, highest trust. The `/inherit` page is the most-read Heirloom surface per unit of effort. Fix its CTA and it becomes the primary acquisition channel.
2. **The Listener as a public daily.** The Listener prompt (`BRAND.md` asset #5) is already "the signature content unit across product, social, and email." Publish one taggable question a day as a standalone public page at `heirloom.blue/listener`, optimized for "ask your [relation] [question]" search intent. These rank, get forwarded peer-to-peer, and each is a product demo.
3. **The held-until note as a shareable artifact.** When a note opens, offer the recipient a quiet "share this with [sibling]" path that links to the note (read-only) — not the product. The note is the marketing; the brand stays invisible.
4. **Family Spectrum as an onboarding share.** At "choose your thread" (`BRAND.md` asset #2), generate the family's dye palette as a shareable card. This is the one onboarding moment people will post unprompted — it's their family's coat of arms. Underexploited per the brand audit.
5. **Pitched earned press** around the durability proof-point: "an archive that exports free forever, even if the company ends" (`Pricing.tsx:179`). This is a story no competitor can tell honestly. One feature in a longevity-obsessed publication is worth a month of posts.

## 7. Funnel fixes

The cold→free→first entry→invite→recipient-signup path has three real leaks.

**Leak 1 (critical): the primary CTA defaults to paid.** `Signup.tsx:71-74` defaults `tier` to `'family'` unless `?tier=free` is in the URL. `Marketing.tsx:164` hero "begin" CTA routes to `/signup` with no tier param. `Pricing.tsx:67` Free card CTA routes to `/signup` with no `?tier=free`. A visitor who clicked "begin" or chose Free on the pricing page lands on a form defaulting to $6.99/mo, then `Signup.tsx:147-158` redirects to Stripe checkout. This is the single biggest free-growth leak and it is a ~3-line edit: flip the default to `free`, pass `?tier=free` from every free-surfaced CTA.

**Leak 2: capture is buried under two ceremonies.** Path is `/signup → /begin` (FirstThread, 6 theatrical steps, `FirstThread.tsx:211-364`, plays a canned transcript, captures no real entry) → `/onboarding` (welcome → tour → entry, `Onboarding.tsx:14-15`), where the first real line is finally requested at `Onboarding.tsx:391-422`. A new user walks ~8 screens before writing one real line. The ceremony is a wow-moment, not a first-value moment. Merge FirstThread's Record/Woven step (`FirstThread.tsx:278-303`) with Onboarding's entry step — capture the user's actual first line via `memoriesApi` (the store the home cloth reads, per `Onboarding.tsx:391-422` comment), skip the second ceremony.

**Leak 3: recipient-to-author conversion is implicit.** `/inherit/:token` renders bequests and reactions but has no prominent "join this thread / add your voice" CTA. `Marketing.tsx:17` promises "No signup. No app." — the no-signup read works, but the upward conversion is left implicit. Add a warm "Add your voice to {threadName} →" link to `/join?code=<recipient-code>` directly under the letter.

**The one metric:** recipients-who-become-authors per week. This is the viral coefficient in disguise. If it's ≥0.3, the loop compounds; if it's <0.1, the product is a journal, not a thread.

## 8. The 30-day launch sequence (free only)

**Week 1 — fix the door.**
- Day 1: Flip `Signup.tsx` default tier to `free`. Pass `?tier=free` from `Marketing.tsx:164` and `Pricing.tsx:67` Free card.
- Day 2: Swap hero line on `Marketing.tsx` to "Some things only get deeper." Demote "thousand-year thread" to a single quiet proof-point per `BRAND.md:76-79`.
- Day 3: Add "Add your voice to {threadName} →" CTA on `/inherit/:token` and `/m/:token`, linking to `/join?code=`.
- Day 4: Fix `voice.ts` — essence DEPTH (not HELD), hero "Some things only get deeper." (not "meant to be kept"), strip loom/cloth/woven framing from lines 14-17.
- Day 5: Replace `image.ts` woven-linen renderer with deep-water + Sounding mark from `BRAND.md` §6/§8. Regenerate the OG image set.
- Day 6-7: Smoke the live site post-deploy (CSP blocks inline scripts in prod only — per project memory, always smoke live).

**Week 2 — collapse the ceremony, ship the first value.**
- Day 8-10: Merge FirstThread Record/Woven step with Onboarding entry step. One ceremony, one real capture via `memoriesApi`, then invite. Cut ~3 screens.
- Day 11: Add PwaHome "Begin free" door for signed-out launches (`PwaHome.tsx:539-541` currently hard-redirects to `/login`).
- Day 12: Add a recipient-specific signup code path so `/join?code=` can attribute conversion back to the delivering letter.
- Day 13-14: Publish `/listener` as a public daily-question page. Seed with 30 taggable questions.

**Week 3 — turn on the engine.**
- Day 15: Set `ANTHROPIC_API_KEY` + FB/Bluesky/Pinterest creds in repo. The autopost CI is green but idle per project memory.
- Day 16: Add Pinterest back to `post.ts` (or confirm it's truly retired and document why). Retire the dead TikTok/X/Threads/YT queue paths so `post.ts` and `voice.ts:11` agree.
- Day 17-18: Regenerate monthly plan (`plan.ts`) against the fixed voice. Verify 7 days of output reads on-brand (no cloth, no "meant to be kept," DEPTH voice).
- Day 19-21: Let the engine run. Monitor the one metric (recipients→authors). No paid spend.

**Week 4 — earned-media and compounding.**
- Day 22: Ship Family Spectrum share card at "choose your thread."
- Day 23: Ship "share this note" read-only path on opened letters.
- Day 24: Pitch the "exports free forever, even if we end" angle to 3 longevity/family-focused outlets.
- Day 25-28: Watch the loop. If recipients→authors ≥0.3, hold course. If <0.1, the leak is in the `/inherit` CTA copy, not the engine — iterate there, do not add spend.
- Day 29-30: Bump SW cache version per the project memory rule (`public/sw.js`), deploy, smoke live.

## 9. The three highest-leverage moves

If only three things ship:

1. **Flip the signup default to free and thread `?tier=free` through every CTA.** ~3 lines. Removes the paywall from the primary free-acquisition path. The highest-leverage change in the entire plan. (`Signup.tsx:71-74`, `Marketing.tsx:164`, `Pricing.tsx:67`)

2. **Add the recipient-to-author CTA on `/inherit/:token` and `/m/:token`.** Turns the sealed-letter delivery — already a viral surface — into an actual signup driver. This is the loop closing. Without it, the loop is open and the product does not compound. (`Inherit.tsx`, `/join?code=`)

3. **Rewrite `voice.ts` to BRAND.md as source of truth and replace the woven-cloth image identity with the Deep + Sounding mark.** Until the system prompt and the visual output match the brand book, every social post is off-brand and the funnel's top is indistinguishable from a stationery app. (`voice.ts:14-18`, `image.ts:1,21`, `generate.ts:117`)

## 10. Risks & brand-voice guardrails

**What NOT to do:**

- Do not add paid acquisition in the first 30 days. The loop is not closed; paid traffic will hit the paywall leak and burn money. Rule 14 forbids urgency, and paid social is where urgency creeps in first.
- Do not run a streak, a leaderboard, a referral giveaway, a "limited spots" push, or a countdown. All banned by `BRAND.md` §4 rule 4-5 and `voice.ts` rules 5-6. The thousand-year promise dies the instant the product sounds like quarterly-growth SaaS.
- Do not lead with death, "legacy," "before it's too late," "forever," or "memorialize." All on the banished list (`BRAND.md:96-134`, `voice.ts` rule 8). The arrival-of-love rule is non-negotiable: "For Maya, when she turns 30" — never "after you're gone."
- Do not ship a cloth, woven, filament-web, or cosmic-loom visual to the acquisition surface. `BRAND.md:339-346` bans it explicitly. The live UI being CosmicLoom is a product-vs-constitution contradiction that must be reconciled, not propagated.
- Do not let `voice.ts` and `BRAND.md` keep disagreeing on the essence word, the hero line, or the material metaphor. Two sources of truth is the root cause of every off-brand output. The book wins; the code is fixed to match.
- Do not cite social proof. `voice.ts` rule 12 forbids invented stats; `signals.ts:38-54` correctly steers by live counts without citing them. Never print "thousands of families."
- Do not add a countdown timer to a sealed note. The release lexicon is "held until Maya turns 30" (`BRAND.md` asset #7), not "4,015 days remaining." A countdown is the single fastest way to turn reverence into SaaS.

**The guardrail test for any new surface:** would a 34-year-old new parent and their 78-year-old grandmother both find it beautiful and both find it easy (`BRAND.md` §4)? If not, cut it.

---

Key files: `brand/BRAND.md` (constitution), `marketing/automation/src/voice.ts` (off-brand system prompt), `marketing/automation/src/image.ts` + `generate.ts:117` (off-brand visual identity), `cloudflare/frontend/src/pages/Signup.tsx:71-74` (paid-default leak), `cloudflare/frontend/src/pages/Marketing.tsx:138,164` (wrong hero, no tier param), `cloudflare/frontend/src/pages/Pricing.tsx:67` (Free CTA missing `?tier=free`), `cloudflare/frontend/src/pages/Onboarding.tsx:391-422` (real first capture buried), `cloudflare/frontend/src/loom/PwaHome.tsx:539-541` (hard /login redirect), `cloudflare/frontend/src/pages/Join.tsx:334-366` (working invite preview), `cloudflare/frontend/src/pages/Inherit.tsx` (missing recipient→author CTA — the loop that does not close).