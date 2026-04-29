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
- Sign up: Ayrshare ($149/mo for posting API), Beehiiv (free tier), Bannerbear ($49/mo for templated images), Anthropic API ($0/mo + usage).

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

Built in `marketing/automation/`. See its README for the architecture. In short:

1. **Themes**: `themes.ts` defines a 52-week rolling calendar — weekly theme, seasonal context, target relation/audience.
2. **Generation**: `generate.ts` calls Claude API to produce a source post per theme, in the brand voice defined above.
3. **Variants**: `variants.ts` produces per-platform variants (caption length, hashtags, image dimensions).
4. **Posting**: `post.ts` ships variants to Ayrshare for multi-platform delivery.
5. **Orchestration**: `run.ts` is the entrypoint, called daily by `.github/workflows/social-autopost.yml`.
6. **Metrics**: `metrics.ts` (scaffolded) pulls back engagement and feeds the next generation.

This system is designed to run with **zero ongoing operator effort** once API keys are in place. The only human-in-the-loop work is approving creator partnerships and writing the occasional founder essay. Everything else compounds on its own.

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

## 7. Decisions still needed (from you)

These are blocking and need your call before I build them:

1. **Gift-flow backend**: integrate with a print-on-demand book partner (e.g. Lulu, Blurb, Bookmundi API) for the year-end keepsake? Or partner with Storyworth's book printer? Cost: ~$25–40/book at volume.
2. **Email prompt loop**: build in-house with Postmark + cron, or use Customer.io / Loops? Recommendation: Loops ($49/mo) for speed.
3. **Visual rebrand for marketing pages**: keep current dark-gold for app, build a separate warm-light marketing site? Or unify?
4. **API budget**: Ayrshare is $149/mo, Bannerbear $49/mo, Anthropic API ~$50/mo at expected volume = ~$250/mo for the autonomous engine. Approve?
5. **Creator budget**: $5K for first wave (25 creators × $200 each)?
6. **Domain**: heirloom.app vs heirloom.blue vs something gift-forward (e.g. mystorybook.gift)?

Once these are answered, the rest can be built and run autonomously.
