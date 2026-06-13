# Organic growth — the levers the engine can't pull for you

The autopost engine broadcasts well: distinct woven images, link-in-first-comment
on Facebook, richtext tag facets + threaded posts on Bluesky, SEO captions,
seasonal discovery tags. Broadcasting is necessary and it is also **not enough**.

Reach on both platforms comes from showing up in conversations that are already
happening, and from a few one-time structural moves the API can't make for you.
This doc is the manual half. None of it costs money. All of it stays inside brand
voice rule 14 — quiet, compounding, never engagement bait.

## Daily — the 5-minute engagement pass

```bash
cd marketing/automation
PLATFORMS= tsx src/run.ts engage   # prints a work-list, posts nothing
```

`engage` discovers in-niche Bluesky threads (via `app.bsky.feed.searchPosts`)
where a genuine memory-keeper reply belongs, ranks them by engagement, and — when
a generation provider is set — drafts one genuine, never-pitch reply opener per
thread for you to edit and send by hand. It also lists the Facebook group themes
to participate in. Output: `output/<date>/engage.md`, also printed to stdout.

It needs `BLUESKY_HANDLE` + `BLUESKY_APP_PASSWORD` for live discovery (reply
drafts also need `CLOUDFLARE_*` or `ANTHROPIC_API_KEY`). Both are already the
autopost secrets — nothing new to configure.

**Rules for the human doing the pass:**
- Reply as a person, never as the brand. React to what they actually said.
- Never paste a link into the reply itself. If someone asks, link in a reply to
  your own comment, once.
- Skip raw grief. Replying to "my mom just died" with anything brand-adjacent is
  tasteless — the work-list already filters the obvious cases, but use judgment.
- One genuine reply beats ten. This is a 5-minute habit, not a quota.

This is the single highest-leverage free lever on both platforms, and it's
ToS-safe precisely because a human sends each reply — no auto-reply.

## One-time — Bluesky structural moves

Bluesky has **no ranking algorithm**: timelines are chronological + follows +
reposts + custom feeds + starter packs. You win reach by owning discovery surfaces.

1. **Starter pack.** Create one at `bsky.app/starter-packs` — "Family memory &
   story keepers." Add the Heirloom account + 20–40 genuine in-niche accounts
   (genealogists, memoir writers, oral-history projects). Starter packs are
   shareable and surface in onboarding; being the curator puts the account at the
   top of a list new users actually install.
2. **Custom feed.** A feed defined by the niche terms (same phrases `engage.ts`
   searches) becomes a discovery surface others subscribe to — and every post in
   it carries the account. Build with a feed generator (e.g. `skyfeed.app`, free)
   or `bluesky-feed-generator`. The account that runs a good feed gets followed.
3. **Pin a real post**, not a pitch. The taggable-question sayings are ideal.

## One-time — Facebook structural moves

Facebook **Page** organic reach is structurally dead (~1–2% of followers). The
two free levers that actually reach people:

1. **Groups, not the Page.** Join the largest active public groups in the themes
   `engage` lists (genealogy, questions-to-ask-your-parents, caring-for-aging-
   parents, memory-keeping, family-recipes). Comment as a person. Optionally
   create a Heirloom-adjacent group ("Questions Worth Asking Your Parents") and
   seed it — a group you own is a first-party audience the Page can never match.
2. **Reels, not link cards.** Facebook pushes vertical video into non-follower
   feeds the way the Page feed hasn't worked in years. The woven-cloth + saying
   images are already produced daily; the next pipeline step is rendering them as
   a 5–8s vertical video (Ken-Burns drift over the weave, saying fading in) and
   posting as a Reel. This is the highest-upside unbuilt lever — flagged here, not
   yet automated.

## Why this is the plan

With near-zero followers, broadcasting lands in a void: no engagement signal → no
distribution. The fix is not more posts (six a day reads as a bot and buys
nothing). The fix is (a) a human genuinely present in the right conversations
daily, and (b) owning the discovery surfaces — starter pack, custom feed, group,
Reels — that both platforms actually reward. The engine does the broadcasting;
this doc is everything the API can't do for you.
