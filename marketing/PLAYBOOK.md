# Heirloom Launch & Growth Playbook

This is the operating doc. If a marketing decision isn't covered here, ask. If a tactic isn't producing, pull it.

---

## 1. Positioning

### What's broken

The current positioning is **"plan your death, deliver memories after you die."** The buyer pays today for an event 30 years away with no compounding loop. That positioning has killed every digital-legacy startup of the last decade — Eter9 (creepy AI immortality), SafeBeyond (death-only utility), MyWishes (admin focus, no monetization). The category graveyard is consistent and the cause is structural: people don't sign up to plan their death.

The single positioning shift that has worked in this category, repeatedly, is **gift-as-wedge**. Storyworth ($30M+ ARR, ~2023 figure), Remento ($4.4M seed 2023), and Promptly Journals all sell the same thing: *"give your parent a year of stories, get a printed book at the end."* The buyer (adult child) gets immediate emotional payoff. The user (parent) gets weekly prompts that are easy to engage with. The artifact (book) is the viral object that pulls in siblings. Posthumous delivery is a quiet trust feature in the footer — never the headline.

### Repositioning

**Old headline:** *"Preserve your memories for generations."*
**New headline:** *"Give your parent a year of stories. Get the book."*

**Old hero:** the user planning their own death.
**New hero:** the adult child preserving their parent's voice.

**Old wedge:** 14-day trial → $11.99/mo subscription → eventual death.
**New wedge:** $99 gift purchase → year of weekly prompts → printed hardcover at year-end → ~30% upsell to subscription.

**Posthumous delivery, encryption, dead-man's switch** stay in the product. They become trust features ("your stories stay yours, even after you're gone") not the marketing surface. They are reassurance, not the sales argument.

### Audience

Primary: **adult children, 35–60, mostly women, with at least one living parent over 65.** They live on Pinterest, Facebook (yes still), Instagram Reels, and TikTok in that order of intent depth. They search "questions to ask grandma," "interview my dad," "Mother's Day gift for mom who has everything."

Secondary (much smaller): people facing terminal diagnosis, new parents writing letters, estate planners as a B2B2C channel.

Tertiary (don't optimize for): the original framing — middle-aged user planning their own death. Keep them welcome but don't write copy for them.

### Brand voice

Today's voice: funeral-home goth (Void, Blood, Sanctuary, animated infinity, dark UI on gold). This signals "death" to a buyer who wants warmth.

Target voice: **warm, plain, present-tense, specific.** Examples below — keep them in the automation prompt library.

> ✘ *"Your stories matter. Preserve them for generations."*
> ✓ *"Mom's spaghetti recipe. Dad's army stories. Your grandma's voice. Save one this weekend."*

> ✘ *"End-to-end encrypted, zero-knowledge architecture."*
> ✓ *"What you record is yours. Always."*

> ✘ *"Configure your dead man's switch."*
> ✓ *"Decide who gets what, when. Adjust anytime."*

The dark visual identity can stay for the logged-in product (it's actually a nice differentiator from the saccharine competition). The marketing surface — landing page, ads, social — needs the warm voice.

---

## 2. The 90-Day Launch Sequence

A **massive launch is built, not announced.** Big-bang product launches don't work in this category — the buying decision is emotional and slow. What works is a 90-day compound: warm list → creator seeding → press → paid amplification, each amplifying the previous.

### Days 1–14: Foundation

- Ship Phase 1 fixes (done) + Phase 2 (gift flow + onboarding rewrite)
- Stand up a Beehiiv newsletter with referral milestones. Goal: 5K subs by day 90.
- Create the SEO content moat: 50 long-tail "questions to ask [grandma/dad/mom]" pages, programmatically generated via the automation in this repo. Each page is a list of 30–80 questions + a soft CTA "save these answers in Heirloom — free, no card." This is Promptly Journals' moat; it's defensible because it compounds.
- Create the autonomous social engine (this repo's `marketing/automation/`).
- Set up Google Search Console, GA4, Meta Pixel, TikTok Pixel.
- API access: Anthropic (~$3/mo at our volume on Sonnet 4.6), Meta Business app + LinkedIn Developer + Pinterest Developer + Bluesky app password (all free, ~1-2 weeks for app reviews). Beehiiv free tier. **Total marketing-stack cost: ~$3/mo.** TikTok and X stay in queue mode (operator pastes manually 2 min/day) until paid tiers are worth it or app reviews land.

### Days 15–45: Warm-list build

- Daily TikTok + Instagram Reels via the automation engine (themes below). Goal: 100K cumulative views, 3K followers.
- Pinterest pin daily, leveraging the SEO moat. Goal: 100 pins, 50K monthly viewers.
- Identify 80 micro-creators (10K–200K followers) in grief / family / grandparent niches. Reach out via DM with a personalized "I built this because…" pitch. Offer: $200/post + free lifetime Family plan + custom referral link.
- Submit founder story to: WIRED (death tech beat), The Atlantic, NYT Styles, Fast Company, Modern Loss newsletter. Pitch human story, not features.
- Reddit narrative posts (carefully) on r/AskOldPeople, r/AgingParents, r/Genealogy, r/GriefSupport. Soft mentions only. No ads.

### Days 46–75: Creator wave

- 30 of the 80 creators post in a 3-week window. Stagger so something hits the algorithm every 1–2 days.
- Reuse top-performing creator clips as **TikTok Spark Ads + Meta Advantage+** campaigns. Budget: $5K test, scale winners. Expected CPI for this audience: $4–8 install, $12–25 paid conversion.
- Newsletter sponsorships: Letters of Note, Modern Loss, Anne Helen Petersen's *Culture Study*, The Sunday Long Read. CPM ~$40–80, expect 3–5x podcast conversion.
- Beehiiv referral milestones launch: refer 3 → free month, refer 10 → free year, refer 25 → printed book at year-end.

### Days 76–90: Product Hunt + press

- Product Hunt launch on a Tuesday or Wednesday (best traffic days). Goal: top 3 product of the day. Coordinate with hunters Chris Messina, Kevin William David, Aaron O'Leary.
- Press embargo lifted same day. WIRED / Atlantic / Fast Company piece(s) drop.
- Reddit AMA on r/AgingParents or r/GriefSupport, day-of.
- Push paid amplification budget to $20K/mo, hold for 30 days, evaluate.

### Success criteria at day 90

- 10K signups, 2K active weekly users.
- 500 gift purchases ($49.5K rev).
- 50 paid subscriptions ($500 MRR — small but predicts the curve).
- 5K newsletter subs.
- SEO: ranking for 30+ long-tail "questions to ask" queries.
- Top 3 creator partnerships generating organic content month-over-month.

If by day 90 you don't have ≥300 gift purchases, the wedge isn't working — pause paid, dig into the gift-flow funnel.

---

## 3. The Sustained Growth Loops (Months 4–12)

Launch isn't growth. After day 90, the system needs to be self-perpetuating. Five compounding loops:

### Loop A — Gift-as-referral

Every gift purchase pulls in 1 user (the giver) + 1 active user (the recipient) + 3–10 passive impressions (siblings, kids, friends who see the printed book at Thanksgiving). **This is the core loop. Optimize the gift flow above all else.**

Levers: gift-flow conversion rate, prompt-to-answer rate, year-end book opt-in rate, sibling-add prompt at end of year.

### Loop B — Email prompt loop (Storyworth's killer mechanic)

Every Family-plan user (or gift recipient) gets a weekly question email. Answer rate at Storyworth is reportedly 40–60%. After 52 weeks, the answers compile into a book. We add voice + photo, which Storyworth doesn't.

Build status: scaffolding pending in Phase 2. This is the second-most-important thing after gift flow.

### Loop C — SEO content moat

200+ programmatic "questions to ask [relation] before [event]" pages. Compounds at ~10–15% MoM organic search growth for the first 18 months in this niche. Promptly Journals has 50K+/mo organic from this strategy. Generated by `marketing/automation/`.

### Loop D — Seasonal peaks

Four annual peaks: **Mother's Day (May), Father's Day (June), Grandparents Day (Sept), Christmas (Dec).** Storyworth does 60%+ of revenue around these four. Plan 4-week paid pushes around each + dedicated landing pages.

Calendar baked into `marketing/automation/themes.ts`.

### Loop E — UGC + creator partnerships

Once the brand has 6 months of organic content, creators come inbound. Maintain a $5–10K/mo creator budget for the top 20 partners. Repurpose the best clips as Spark Ads.

---

## 4. Channel Specifics

### TikTok

- Format: talking-head with voiceover-of-grandparent over family photos. The "questions to ask your grandma before she dies" tag has 500M+ cumulative views.
- Cadence: 1/day from the brand account, 30/month from creator partners.
- Expected CPM organic: $0. Expected CPM Spark Ads: $8–15. Expected CPI: $4–8.

### Pinterest

- Format: vertical 1000×1500 pin, "50 questions to ask your dad before it's too late" + branded footer. High save rate, evergreen traffic.
- Cadence: 3/day, 90/month.
- Expected: 50K monthly viewers within 6 months for a consistent poster.

### Instagram Reels

- Mirror the TikTok output. Expected reach is ~30% of TikTok in this niche.

### YouTube Shorts

- Repurpose all TikTok content. YouTube Shorts CPM is rising; worth posting.

### YouTube long-form

- Once a month: 15–30 min "I interviewed my [parent/grandparent]" video. Lower volume, very high intent. Drives email signups.

### Newsletter (Beehiiv)

- Weekly. Question of the week + one user story. Referral milestones are the growth lever.

### Substack guest posts

- Don't build your own Substack from zero. Guest-post or sponsor: Modern Loss, Letters of Note, Anne Helen Petersen, grief writers.

### Reddit

- Organic narrative posts only, never ads. Subs: r/AskOldPeople, r/GriefSupport, r/Genealogy, r/AgingParents, r/Parenting.

### Twitter/X

- Lowest priority. Use for press relays + founder thought leadership only. Don't optimize.

### LinkedIn

- B2B2C only. Reach out to estate planners, hospice orgs, funeral homes, financial advisors. Empathy went hard here with insurance partnerships (MetLife, NY Life).

### Facebook

- Boomer audience for Meta ads. Family-history Facebook groups (with permission) for organic.

### Meta paid

- 60–70% of paid budget. Advantage+ campaigns + Spark Ads boosting top organic creator content.

### Google Search

- 20–30% of paid budget. Bid on "gift for parents," "gift for grandparents," "interview my [relation]," "Mother's Day gift," etc.

---

## 5. The Autonomous Content Engine

Two layers, both already built in this repo:

### Layer A — Existing Postiz scheduler (`cloudflare/worker/src/crons/social-posting.ts`)

A Cloudflare Worker cron runs every 5 minutes, picks up posts from the D1 `social_posts` table, and ships them via a Postiz instance. Pre-written week-N.json content is bulk-loaded by week. This is the production scheduling/publishing layer — **don't touch it**, hand off content to it.

### Layer B — New Claude content generator (`marketing/automation/`)

Daily content generator that produces brand-voiced source posts + per-platform variants from the 52-week theme calendar. Replaces the static week-N.json approach with dynamic generation.

Architecture:

1. **Themes** (`themes.ts`): 52-week rolling calendar + 4 seasonal overrides (Mother's / Father's / Grandparents / Christmas).
2. **Generation** (`generate.ts`): Sonnet 4.6 produces one source post per day in the brand voice from `voice.ts`.
3. **Variants** (`variants.ts`): single Sonnet 4.6 call produces 6–10 platform variants.
4. **Posting** (`post.ts`): direct platform APIs (Meta / LinkedIn / Pinterest / Bluesky — all free) + queue-mode fallback (TikTok / X / Threads / YT Shorts → operator pastes from webhook).
5. **Orchestration** (`run.ts`): single CLI, daily cron via GitHub Actions.

### Integration plan (next phase)

Layer B should hand off to Layer A: instead of `post.ts` calling platform APIs directly, write generated variants to the D1 `social_posts` table via the existing `/api/social/bulk-load` admin route. Then Layer A's cron picks them up and publishes via Postiz. Single posting pipeline, two content sources.

Cost: ~$3/mo (Anthropic Sonnet only). Operator time: ~5 min/day for queue-mode platforms (TikTok, X) until app reviews land.

---

## 6. What to stop doing

Things in the current setup that should stop:

- **Stop calling it a 14-day free trial.** It's a free plan with optional premium. (Done in Phase 1.)
- **Stop deleting trial-expiry content.** (Done in Phase 1.)
- **Stop fabricating trust signals** ("10K+ Families," "SOC 2 Type II Compliant"). Replace with truthful ones or remove. (Done in Phase 1.)
- **Stop building features.** The product has 25+ pages. Cut to the core loop until the gift flow converts.
- **Stop leading with encryption.** It's a trust feature, not a sales argument. Move it to the FAQ.
- **Stop the "death planning" frame.** Until the gift wedge is profitable, posthumous delivery is a footer trust signal, not a hero.
- **Stop the funeral-goth visual identity in marketing.** Keep it in the logged-in app. Marketing surface needs warmth.

---

## 7. Decisions made

1. **Domain**: heirloom.blue.
2. **API budget**: ~$3/mo (Sonnet 4.6) + free direct platform APIs. No Ayrshare, no Bannerbear.
3. **Print-on-demand**: Lulu Direct API (no MOQ, hardcover, white-label fulfillment).
4. **Email prompt loop**: extend existing nodemailer/SMTP stack — no new vendor.
5. **Visual**: keep dark-gold for the logged-in app; warm light theme via CSS variable override on marketing/gift surfaces (single domain, two voices).
6. **Creator budget**: $5K for first wave (25 micro-creators × $200) — operator action, not a code change.

## 8. What still needs to be built (Phase 3)

Most gift/social infrastructure already exists in `cloudflare/worker/`:
- `routes/gift-vouchers.ts` — gift voucher purchase + redemption
- `routes/gifts-v2.ts` — send memory as gift (viral loop)
- `routes/social.ts` + `crons/social-posting.ts` — Postiz-backed scheduling
- `routes/marketing.ts` — marketing endpoints
- `routes/recipient-experience.ts` — recipient flow
- `routes/story-artifacts.ts` — keepsake output products

What's still missing for the gift-as-wedge playbook:

1. **Story-prompt loop for gift recipients** — weekly question email triggered when someone redeems a gift voucher. Storyworth's killer mechanic. Build on top of existing gift-vouchers redemption hook.
2. **Lulu Direct integration** — year-end book printing service that compiles a recipient's prompt responses into a hardcover. Pure pay-per-print, no monthly cost.
3. **"Year of stories" gift product** — a specific gift-voucher SKU positioned as "give a year of weekly story prompts + the printed book." Copy + tier addition.
4. **Layer A ↔ Layer B integration** — wire `marketing/automation/` output into the existing `social_posts` D1 queue via the `/api/social/bulk-load` route.
5. **Onboarding rewrite** — defer encryption setup + dead-man-switch until after first action.
