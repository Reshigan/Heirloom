# Heirloom Registration Runbook

Things only a human can do — accounts, app reviews, payments. This doc lists every external account/key the autonomous systems need, the manual steps to obtain them, and where to put them. Reference [`marketing/PLAYBOOK.md`](marketing/PLAYBOOK.md) and [`THREAD.md`](THREAD.md) for the strategic context.

Once everything in this doc is set up, the autonomous content engine + influencer discovery + outreach run unattended.

---

## 1. Domain + email

| Item | Where | Value |
|---|---|---|
| Domain | Cloudflare | `heirloom.blue` |
| MX | Cloudflare | already configured (Microsoft 365 per existing `MS_TENANT_ID`) |
| Sending addresses | Microsoft 365 | `noreply@heirloom.blue`, `admin@heirloom.blue`, `support@heirloom.blue`, `creators@heirloom.blue` |
| SPF / DKIM / DMARC | Cloudflare DNS | required — verify in Microsoft 365 admin and add the records to Cloudflare DNS. Without these, outreach emails will land in spam. |

---

## 2. Brand social accounts

These need real human registration. Once registered, the API keys feed `marketing/automation/` (daily content engine) and `cloudflare/worker/` (discovery + tagging).

### 2.1 Instagram + Facebook (Meta)

1. Create a Facebook **Page** named *Heirloom*. Use the brand email `admin@heirloom.blue`.
2. Convert an Instagram account `@heirloom.blue` to a **Business** account, link it to the Page.
3. Create a Meta Business Suite app at https://developers.facebook.com/apps. Type: Business.
4. Add the products: **Instagram Graph API**, **Instagram Content Publishing**, **Pages API**.
5. Submit for App Review with permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `instagram_manage_insights`. Expect 1–2 week review.
6. Once approved, generate a long-lived Page Access Token. Note the Page ID and IG Business User ID.

| Variable | Used by | Stored in |
|---|---|---|
| `META_PAGE_ACCESS_TOKEN` | automation + worker | `marketing/automation/.env` and worker secret |
| `META_PAGE_ID` | automation + worker | env var |
| `META_IG_USER_ID` | automation + worker | env var |

### 2.2 TikTok

1. Create a TikTok **Business** account `@heirloom.blue`.
2. Apply for the **TikTok Content Posting API** at https://developers.tiktok.com. Approval takes ~6 weeks; submission must include the brand's planned content.
3. Apply for the **TikTok Research API** at https://developers.tiktok.com/products/research-api. Researcher access requires institutional or business affiliation; submission takes ~2–4 weeks.

Until reviews land, TikTok content runs in queue mode — `marketing/automation/post.ts` writes the post to `output/<date>/queue/tiktok.md` and pings the configured `QUEUE_WEBHOOK_URL`. An operator pastes manually (~2 min/day).

| Variable | Used by | Stored in |
|---|---|---|
| `TIKTOK_CONTENT_TOKEN` | automation | env var (post creation) |
| `TIKTOK_RESEARCH_TOKEN` | worker | secret (creator discovery) |

### 2.3 LinkedIn

1. Register a **Heirloom Company Page** on LinkedIn.
2. Create a LinkedIn Developer app at https://www.linkedin.com/developers, attach to the Company Page.
3. Request the `w_organization_social` scope. Approval is usually 24–72 hours.
4. Generate a long-lived OAuth token.

| Variable | Used by | Stored in |
|---|---|---|
| `LINKEDIN_ACCESS_TOKEN` | automation | env |
| `LINKEDIN_AUTHOR_URN` | automation | env (e.g. `urn:li:organization:12345`) |

### 2.4 Pinterest

1. Create a Pinterest **Business** account, claim heirloom.blue as your verified domain.
2. Pinterest Developer Portal: create a developer app at https://developers.pinterest.com.
3. Request `boards:read`, `boards:write`, `pins:read`, `pins:write`.
4. Create a Board called *Family Threads* (or several themed boards). Note its ID.

| Variable | Used by | Stored in |
|---|---|---|
| `PINTEREST_ACCESS_TOKEN` | automation | env |
| `PINTEREST_BOARD_ID` | automation | env |

### 2.5 YouTube

1. Create a Google Brand Account. Create a YouTube channel under it.
2. Verify the channel for long-form upload + Shorts.
3. Google Cloud Console: enable the **YouTube Data API v3**. OAuth consent screen, get a refresh token via the OAuth playground.
4. Approval for raised quotas: optional but recommended for daily Shorts upload.

YouTube Shorts content runs in queue mode until the YT Data API integration is wired (currently scaffolded; ships in next phase). Operator pastes manually for now.

### 2.6 X (Twitter)

X removed the free posting tier. Skip unless you commit to the **Basic** tier ($200/mo). The autonomous engine writes X variants to `output/<date>/queue/x.md` for manual posting in queue mode.

### 2.7 Threads

Meta's Threads API is in beta (as of 2026); we run Threads in queue mode by default. Operator pastes manually until the API stabilizes.

### 2.8 Bluesky

No app review needed.

1. Register `@heirloom.blue` (or `@heirloom.bsky.social`).
2. Settings → App Passwords → create a dedicated app password for the autoposter.

| Variable | Used by | Stored in |
|---|---|---|
| `BLUESKY_HANDLE` | automation | env |
| `BLUESKY_APP_PASSWORD` | automation | env |

---

## 3. Email + outbound infrastructure

| Item | Notes |
|---|---|
| Microsoft 365 | already provisioned per worker's `MS_TENANT_ID` / `MS_CLIENT_ID` / `MS_CLIENT_SECRET`. Used for transactional + outreach email. |
| Resend | used by some templates per `RESEND_API_KEY`. Can be unified with M365 over time. |
| `ADMIN_NOTIFICATION_EMAIL` | set to `admin@heirloom.blue` so admin gets influencer-application alerts. |

**Important — outbound DM compliance.** Instagram and TikTok prohibit unsolicited automated DMs and ban accounts that violate. The outreach pipeline emails creators only. The `discoverFromTikTok` and `discoverFromInstagram` jobs ingest creator handles + follower counts; the email step uses a separately sourced address (manual review, or a public-email enrichment vendor like Hunter.io / Apollo.io). Do NOT wire DM sends.

---

## 4. Content engine (`marketing/automation/`)

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Claude Sonnet 4.6 daily content gen, ~$3/mo |
| `ANTHROPIC_MODEL` | no | defaults to `claude-sonnet-4-6` |
| Meta / LinkedIn / Pinterest / Bluesky tokens | optional | enable direct posting; queue mode otherwise |
| `QUEUE_WEBHOOK_URL` | optional | Discord/Slack webhook for queue-mode notifications |

Set as **GitHub repo secrets** (for the daily Actions cron) and as a local `.env` in `marketing/automation/` for development.

---

## 5. Influencer autopilot (in `cloudflare/worker/`)

| Variable | Required | Purpose |
|---|---|---|
| `TIKTOK_RESEARCH_TOKEN` | optional | enables real TikTok creator discovery via Research API |
| `META_PAGE_ACCESS_TOKEN` + `META_IG_USER_ID` | optional | enables real Instagram creator discovery via hashtag search |
| `STRIPE_SECRET_KEY` | yes | already required for billing; reused for creator commission payouts via Stripe Connect |
| `RESEND_API_KEY` | yes | outbound creator outreach + follow-ups |

Daily cron runs at 09:00 UTC and:

1. `discoverNewProspects` — sweeps the curated lists.
2. `discoverFromTikTok` — TikTok Research API (if token set).
3. `discoverFromInstagram` — Instagram hashtag search (if token set).
4. `processInfluencerOutreach` — sends initial outreach email with the auto-generated unique discount code + landing page URL.
5. `processInfluencerFollowUps` — sends follow-ups at 3 / 7 / 14 days.
6. `processAutomatedPayouts` — Stripe Connect payouts to creators above their threshold.

All operate on the same `influencers` D1 table. Every newly discovered prospect is given a unique `discount_code` (e.g. `JANE7K`) and `landing_page_slug` at insert time, so outreach emails land with a working code immediately.

---

## 6. Continuity infrastructure (Phase 3 backlog)

These are part of the Thread architecture's continuity guarantee (see [`THREAD.md`](THREAD.md) §Pillar 5). Not yet wired:

| Item | Cost | Notes |
|---|---|---|
| Pinata (IPFS pinning) | $20/mo Pro | primary archival pin |
| Web3.Storage | free tier | secondary, redundancy |
| Filecoin Saturn | free | tertiary, content addressing |
| Successor 501(c)(3) | ~$1500 | Delaware filing + DAF, target within 12 months of public launch |

Track these in PLAYBOOK §6 as Phase 3.7 — `archive_pins` schema is already in `cloudflare/migrations/0036_family_thread.sql`.

---

## 7. Lulu Direct (Living Book printing — Phase 3.9 backlog)

1. Account at https://developers.lulu.com.
2. Sandbox API key for testing, then production key.
3. Configure shipping origin + tax registration in their portal.

| Variable | Used by | Stored in |
|---|---|---|
| `LULU_API_KEY` | worker | secret |
| `LULU_API_SECRET` | worker | secret |
| `LULU_ENVIRONMENT` | worker | env (`sandbox` or `production`) |

Pure pay-per-print, no monthly cost. Margin per book ~$60 retail / $25 cost.

---

## 8. Verification checklist

Before declaring autopilot operational:

- [ ] `heirloom.blue` resolves, SSL valid
- [ ] DKIM/SPF/DMARC pass at https://dmarcian.com
- [ ] Test outreach email reaches inbox (not spam) on Gmail, Outlook, Yahoo
- [ ] Meta Business app approved, IG post-via-API succeeds in production
- [ ] LinkedIn post-via-API succeeds
- [ ] Pinterest pin-via-API succeeds
- [ ] Bluesky post succeeds
- [ ] `marketing/automation/` daily GitHub Actions run completes green
- [ ] Worker daily cron logs show `discoverFromTikTok` / `discoverFromInstagram` either succeeding or correctly reporting "tokens not set"
- [ ] One test influencer goes through: discover → email outreach → click landing page → signup → conversion attribution → commission accrual
- [ ] Stripe Connect payout succeeds for a $1 test commission

When all 12 are checked, the system runs unattended.
