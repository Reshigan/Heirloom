# Heirloom — Zero-Budget Viral Mechanics

**Owner:** growth/eng · **Status:** core shipped (OG share pipeline), loops documented
**Constraint:** £0 paid acquisition. Every new user must arrive through a surface an
existing user already touches. **Voice rule holds everywhere:** never the word
"legacy", never gift-product framing (see `marketing/automation/src/voice.ts`).

> The product already has the rare thing most apps fake: a built-in reason for one
> family member to pull in another (you cannot have a *family* thread of one). The job
> of these mechanics is to remove every gram of friction from that pull, and to make
> the artifacts the product naturally creates *worth sharing on sight*.

---

## The five loops (ranked by leverage)

| # | Loop | Trigger | Who it reaches | Built? |
|---|------|---------|----------------|--------|
| 1 | **Inherit link** | A recipient is given a link to a thread left for them | The single highest-intent person in the author's life | OG ✅ · flow exists (`worker/routes/inherit.ts`) |
| 2 | **Invite-to-contribute** | You can't fill a *family* thread alone | Siblings, parents, children | Surfaces exist (`referrals.ts`, `q4-features` invites) — needs OG + copy pass |
| 3 | **Year-in-the-thread (Wrapped)** | End-of-year / milestone recap | Whole family + their feeds | OG ✅ · `wrapped.ts` exists; needs share button + per-kind image |
| 4 | **Milestone entry-counter** | "Entry No. 1,000" — the append-only counter *is* the brand | Public feeds | OG ✅ (kind=`milestone`) · needs in-app trigger |
| 5 | **Shared single entry** | Author chooses to make one reflection public | Public feeds | OG ✅ (kind=`entry`) · needs author opt-in UI |

Loops 1, 3, 4, 5 now unfurl as distinct, on-voice cards. Before this change every one of
them shared the **same generic homepage card** — the biggest, cheapest leak in the funnel.

---

## What shipped in this pass

### 1. A single source of truth for every share surface
`cloudflare/worker/src/lib/share-meta.ts` — **pure, no I/O, 22 unit tests**
(`share-meta.test.ts`). Given a `kind` (+ optional count/title/origin) it returns the
canonical title, description, og:image, canonical URL, and Twitter card type, and can
render the meta-tag HTML fragment and a **brand-correct 1200×630 SVG card** (ink ground,
bone type, one warm hairline, the `∞` mark — no icons, no gradients; honours
STITCH_BRIEF §2).

Invariants the tests pin:
- **Privacy:** the `inherit` card *never* embeds a name, content, or the token — it
  cannot, by construction. (An inherit link is reachable by anyone holding it and by
  every crawler that touches it.)
- **Voice:** no surface copy may contain the word "legacy".
- **Safety:** hostile titles are HTML-escaped before entering markup or SVG; bad
  counts/paths degrade to safe defaults; unknown kinds fall back to `thread`.

### 2. Public, cacheable Worker endpoints
`cloudflare/worker/src/routes/share.ts`, mounted at `/api/share`:
- `GET /api/share/meta?kind=&count=&title=` → JSON `ShareMeta` (for the SPA + tooling)
- `GET /api/share/card.svg?kind=&count=&title=` → the SVG card (used for in-app share
  preview and as a downloadable asset). Hard-cached at the edge.

### 3. Crawler-facing OG injection at the edge (Cloudflare Pages Functions)
`cloudflare/frontend/functions/inherit/[[path]].ts` and `…/wrapped/[[path]].ts`
(shared logic in `functions/_shared/og.ts`). They take the SPA shell Pages would serve,
strip the static `og:`/`twitter:` tags, rewrite `<title>`, and inject the per-surface
tags with `HTMLRewriter`. **Real users still get the full SPA**; only the unfurl changes.
Any error falls through to the untouched SPA, so this can never 500 a shared link.

### 4. Per-kind OG image paths that don't 404
`cloudflare/frontend/public/og/{inherit,wrapped,milestone,entry}.png` seeded from the
brand image so every card renders today. The contract `/og/<kind>.png` is stable —
dropping in a real per-kind render later is a pure asset swap, no code change.

**Gates green after this pass:** worker `tsc --noEmit` clean · worker `vitest` 40/40 ·
frontend `npm run build` exit 0.

---

## The one follow-up that lights up per-kind imagery
The SVG renderer is done and tested; what's missing is **SVG→PNG rasterisation** (no
rasteriser is available in this environment, and Facebook/LinkedIn/iMessage need raster
og:images). Two clean options, in order of preference:

1. **Edge render with Satori + resvg-wasm** in a Worker route (`/api/share/card.png`),
   point `og:image` at it. Fully dynamic per count/title. ~1 day.
2. **Build-time prerender:** a small Node step rasterises the four static SVG cards into
   `public/og/*.png` during the frontend build. Covers loops 1/3/4/5 (the countless
   variants) without runtime cost. ~2 hours.

Until then the seeded brand image renders correctly everywhere; only the *picture* is
shared across kinds — the *headline and description*, which carry most of the click, are
already per-surface.

---

## Loop-by-loop activation checklist (next, all £0)

**Loop 1 — Inherit (highest intent):**
- [x] Privacy-safe OG card on `/inherit/*`
- [ ] Recipient landing copy mirrors the card ("Someone has been writing to you")
- [ ] After a recipient reads, offer *them* a thread of their own — the loop closes

**Loop 2 — Invite-to-contribute (highest volume):**
- [ ] One-tap "add the people who are in these stories" at the moment an entry names someone
- [ ] Invite link unfurls with kind=`thread` + inviter's family name in copy (no PII beyond what the inviter types)
- [ ] Reuse `referrals.ts` ledger so contribution, not just signup, is the reward trigger

**Loop 3 — Year-in-the-thread:**
- [ ] "Share our year" button on `Wrapped` → `/api/share/card.svg?kind=wrapped&count=N`
- [ ] Per-kind PNG (see follow-up) so the feed card shows the count

**Loop 4 — Milestone counter:**
- [ ] Fire a share prompt when the family crosses 100 / 1,000 / 10,000 entries
- [ ] The append-only counter is the most ownable visual the brand has — lead with it

**Loop 5 — Shared single entry:**
- [ ] Author opt-in toggle per entry → public `/entry/:id` with kind=`entry` card
- [ ] Default private; sharing is a deliberate, per-entry act (matches the product's ethic)

---

## Why these and not the usual growth hacks
The anti-patterns (popups, "invite 5 friends for a discount", referral spam, fake
scarcity) would violate both the design constitution and the voice. Heirloom's reach has
to feel like the product: quiet, permanent, and earned. The mechanics above are all
*consequences of using the product honestly* — you inherit a thread, you invite the
people already in your stories, you mark a real milestone. That is the only kind of viral
this brand can survive.
