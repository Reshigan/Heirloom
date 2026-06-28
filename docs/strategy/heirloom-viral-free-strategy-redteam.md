Red-team review follows. All file claims were verified against source.

## Brand-voice violations in the strategy's own recommendations

The strategy is mostly voice-clean. Two issues:

1. **It mis-states the ban on "forever."** §10 says: *Do not lead with death, "legacy," "before it's too late," "forever," or "memorialize."* "Forever" is NOT in the §9 banished lexicon (`BRAND.md:379`: death · deceased · memorialize · legacy data · vault · secure your legacy · before it's too late · countdown · expires · streak...). `BRAND.md:65` only says the *hero line* never says forever; `BRAND.md:146` uses "forever" in product copy. Lumping it with banished words overstates the rule and would block legitimate durability copy.

2. **It cites the wrong BRAND.md section for the cosmic-loom ban.** §5 says `BRAND.md:339-346` bans the cosmic-loom visual. That range is the *Sounding mark do-not list* (`BRAND.md:337-346`) — it governs the MARK, not the UI. The real UI ban is `BRAND.md:403` §11.3: *"No glowing radial node, converging filament web, sci-fi 'cosmic loom' mark."* Same conclusion, wrong citation. A reviewer who checked would dock credibility.

No engagement-bait, urgency, or gamification crept in. The Listener daily and the "share with [sibling]" path are brand-book-mandated (`BRAND.md:156`, `BRAND.md:367`) and stay on-voice.

## Is "viral" realistic on zero budget? No. Honest coefficient: 0.15–0.30.

A sealed note is delivered to ONE named recipient, not a feed. For the loop to compound, each recipient must read → convert to author → write a new note → address it to a fresh recipient. That is a referral chain, not virality. Realistic math:
- Read rate on a personally-addressed letter: ~0.95.
- Recipient-to-author conversion (most recipients are not "family-keepers"): 0.10–0.25.
- New recipients per new author: 1–3.
- Composite k ≈ 0.10–0.70. Almost certainly sub-linear.

The strategy's own threshold (`≥0.3` compounds, `<0.1` is a journal) is the honest admission that the title oversells. A coefficient of 0.3 means the chain *decays* at 30% per generation — that is not compounding, that is a slow fizzle. True virality needs k>1, which this mechanic cannot reach unless the "share with sibling" path is made the primary lever (see below). Calling this "viral" is hopium. The honest framing: a warm, slow, trust-bound referral chain with a half-life of ~3 generations.

## The ONE highest reach-per-hour move the strategy buried

**Pre-allocating multiple recipients at note-write time.** The strategy ranks "share with [sibling]" #3 in §6 and treats it as an afterthought to the daily-Listener page. This is backwards. The sealed-note-to-one-recipient path is intrinsically k≤1 — it can never go viral. The ONLY mechanic in the entire plan that can produce k>1 is one author writing one note addressed to N recipients (or the "share with sibling" forward path). `LegacyRecipientPicker` already supports multiple bequests (per project memory). Making 3–5 recipients the default write-time configuration is the single move that turns a linear chain into a branching tree. It is never named as a lever. Everything else (the CTA fix, the voice.ts rewrite, the /listener page) is reach-per-hour-positive but k-neutral.

Secondary under-weighted move: earned press. §6 ranks it LAST, then immediately says "one feature in a longevity-obsessed publication is worth a month of posts." That is self-contradicting. If true, it belongs at #1 or #2, not #5. One pitch to one editor at a longevity outlet is the highest reach-per-hour action in the entire 30-day plan, and the strategy buries it behind 3/week Pinterest pins.

## What the panel missed

1. **The seed-author problem.** The viral loop requires a seed population writing the first 100 notes. With a near-zero-follower account, who writes them? Week 3 "turns on the engine" but the FB/Bluesky accounts have no audience. The door is fixed (Week 1) but nobody is at the door. Zero-budget growth with no seed authors means the loop never starts. The 30-day plan has no answer for this.

2. **Google SEO is absent.** Pinterest is named for "family history" long-tail. Google is the larger long-tail surface by 100x: "letter to my daughter on her wedding day," "how to write a letter to my future child," "questions to ask your grandfather." `/listener` as a public daily page is mentioned but never framed as the SEO play it actually is. This is the durable, zero-spend acquisition channel and it gets one line.

3. **Reddit.** r/Genealogy, r/AskOldPeople, r/FamilyHistory, r/parenting, r/Mommit. These are the literal congregations of "family-keepers" (`BRAND.md` audience definition) sharing stories unprompted, no ad spend, kitchen-table voice. The strategy drops LinkedIn (correct) but never considers Reddit, which is far closer to the brand voice than Facebook. Missed entirely.

4. **No competitor named.** StoryWorth owns the "family keepsake" mental real estate via heavy paid spend. Remento, FamilySearch Memories, Afterword, Eterneva all play in adjacent space. The strategy claims "no memory-vault competitor can copy this" without naming one or explaining why a recipient would choose Heirloom over a StoryWorth book they were just gifted. The durability proof-point is honest but untested against awareness.

5. **The /inherit friction wall.** The recipient reads the note with no account, then the "Add your voice" CTA demands email+password signup at the warmest moment. That is the highest-dropoff step in the funnel and the strategy adds the CTA without addressing the friction. A "leave your email, we'll save your reply" lighter intercept would lift recipient→author conversion materially. Missed.

6. **FirstThread UI copy is off-brand.** `FirstThread.tsx:289` "STOP & WEAVE", `:306` "Woven into the thread.", `:309` "SEAL ONE FOR THE FUTURE". "Woven" is not in the §9 kept vocabulary (`BRAND.md:371-376`); CLAUDE.md retires "cloth" from user copy. The strategy flags voice.ts and image.ts but misses that the ceremony UI itself speaks retired vocabulary at the first-run moment. A brand-voice leak the panel did not catch.

7. **Wrong file path.** §8 Day 11 cites `cloudflare/frontend/src/loom/PwaHome.tsx:539-541`. The file is at `cloudflare/frontend/src/pages/PwaHome.tsx` (no `loom/` subpath). The redirect is at lines 538-540. Minor, but a red-team that checks paths finds it.

## 5-year test

Mixed. The architecture (sealed-note-as-acquisition, the loop, the funnel fixes, the brand-voice reconciliation, the /listener format, the "exports free forever" press angle) is evergreen and would still be worth reading in 2031. The platform-cadence table (Facebook 1/day, Bluesky 1/day, Pinterest 3/week) and the 30-day sequence are 2026-tactical and will be stale — platforms shift, Bluesky may not matter in 5 years, the cadence numbers are arbitrary. Verdict: read §2–4 and §7–9 in 2031; skip §5 platform table and §8 calendar. The strategy passes the rule-14 test on principles and fails it on tactics, which is the correct split.

---

## EXEC SUMMARY (200 words)

**The strategy in 3 sentences.** Heirloom's sealed-note delivery is already a share event; the plan closes the loop by fixing the signup-default paywall, adding a recipient-to-author CTA on `/inherit`, and reconciling the off-brand `voice.ts` and cloth-visual identity with the brand book — all at zero ad spend. Growth is framed as "viral" but the mechanic is a warm referral chain (one note → one recipient → one new author), not exponential virality. The durable core is sound; the packaging oversells it.

**Top 3 actions.** (1) Flip `Signup.tsx:71-74` default tier to `free` and thread `?tier=free` through every CTA — 3 lines, removes the paywall from the free-acquisition path. (2) Add the "Add your voice to {threadName} →" CTA on `/inherit/:token` linking to `/join?code=` — closes the loop. (3) Rewrite `voice.ts` to DEPTH/Some-things-only-get-deeper and replace the `image.ts` woven-cloth renderer with the Deep + Sounding mark — fixes every off-brand social output at the root.

**Biggest risk.** No seed authors. The loop cannot start without a first population of note-writers, and the 30-day plan has no answer for zero audience.

**Honest probability it moves the needle.** 20–30%. The fixes are correct and cheap, but k≈0.15–0.30 means slow linear growth, not a curve. Without the multi-recipient write-time lever (not in the plan) and earned press (under-weighted), the loop likely fizzles within 3 generations.