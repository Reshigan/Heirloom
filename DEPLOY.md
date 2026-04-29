# Heirloom Deploy Runbook

Step-by-step from a clean checkout to a running production system. Companion to:

- [`THREAD.md`](THREAD.md) — what we're shipping
- [`marketing/PLAYBOOK.md`](marketing/PLAYBOOK.md) — go-to-market plan
- [`REGISTRATION.md`](REGISTRATION.md) — manual social-account setup

If you can run every step in this doc top-to-bottom without errors, the platform is live.

---

## 0. Before you start

**You will need real accounts at:**

- Cloudflare (Workers + Pages + D1 + R2 + KV)
- GitHub (Heirloom repo with Actions enabled)
- Anthropic (API key for the daily content engine)
- Stripe (live + test secret keys)
- AWS or any S3-compatible service (or just use R2 — already configured)
- Microsoft 365 — already provisioned per existing `MS_TENANT_ID` setup
- Resend (transactional email; free tier OK for low volume)

**You should already have rotated:**

- The Cloudflare Global API key shared in chat. Replace with the scoped Workers/Pages/D1/R2 token created in Phase 5.1.
- The GitHub PAT shared in chat. Replace with a fine-grained PAT scoped only to `Reshigan/Heirloom` with `Contents: write`, `Workflows: write`, `Actions: read`.

Both must be rotated. The legacy keys are in conversation transcripts; they are effectively public.

---

## 1. Local verify

Run before any push to make sure the build is green and the autonomous engine produces sensible output.

```bash
git clone https://github.com/Reshigan/Heirloom.git
cd Heirloom
./scripts/verify.sh
```

The script:

1. Type-checks the worker, the frontend, and `marketing/automation/`.
2. Runs `vite build` for the frontend.
3. Boots `marketing/automation/` in DRY_RUN with placeholder Anthropic key — generates one full day of content in `marketing/automation/output/preview/` so you can eyeball the brand voice before exposing the live key.

If any step fails, fix and rerun. Don't deploy a red verify.

---

## 2. Cloudflare bootstrap (one-time)

You'll do this once per environment.

### 2.1 Create resources

```bash
# Authenticate wrangler with the scoped API token (NOT the Global key).
export CLOUDFLARE_API_TOKEN="<scoped token from phase 5.1>"
export CLOUDFLARE_ACCOUNT_ID="08596e523c096f04b56d7ae43f7821f4"

cd cloudflare/worker

# D1 — production database
wrangler d1 create heirloom-db   # writes the database_id to console; copy it

# R2 — primary upload bucket
wrangler r2 bucket create heirloom-uploads

# KV — sessions + admin tokens
wrangler kv:namespace create heirloom-kv
```

Update the IDs in `wrangler.jsonc` (root) if they differ from the existing values.

### 2.2 Apply schema

```bash
# Migrations are append-only — applies any not-yet-run files in order.
cd ..   # repo root
wrangler d1 migrations apply heirloom-db --remote
```

The Family Thread schema is `cloudflare/migrations/0036_family_thread.sql` (Phase 3.2).

### 2.3 Worker secrets

```bash
cd cloudflare/worker

wrangler secret put JWT_SECRET                     # generate: openssl rand -base64 64
wrangler secret put ENCRYPTION_MASTER_KEY          # 32+ chars
wrangler secret put STRIPE_SECRET_KEY              # sk_live_…
wrangler secret put STRIPE_WEBHOOK_SECRET          # whsec_…
wrangler secret put RESEND_API_KEY                 # re_…
wrangler secret put MS_TENANT_ID                   # if using M365 Graph API
wrangler secret put MS_CLIENT_ID
wrangler secret put MS_CLIENT_SECRET

# Optional — only needed for the corresponding feature
wrangler secret put TIKTOK_RESEARCH_TOKEN          # creator discovery
wrangler secret put META_PAGE_ACCESS_TOKEN         # IG creator discovery + posting
wrangler secret put PINATA_JWT                     # archive pinning
wrangler secret put WEB3_STORAGE_TOKEN             # archive pinning (redundancy)
wrangler secret put LULU_API_KEY                   # Living Book printing
wrangler secret put LULU_API_SECRET
wrangler secret put LULU_WEBHOOK_SECRET

# Vars (visible, not secret)
wrangler kv:key put --binding=KV "META_PAGE_ID" "<your IG Page ID>"
wrangler kv:key put --binding=KV "META_IG_USER_ID" "<your IG Business User ID>"
```

Reference: every key is documented in [`REGISTRATION.md`](REGISTRATION.md) including how to obtain it.

### 2.4 Admin session for the autonomous content engine

The marketing engine writes generated content to the worker's `/api/social/bulk-load` endpoint via an admin session token. Create one:

```bash
# Generate a token
TOKEN=$(openssl rand -hex 32)

# Insert into KV. Session JSON shape matches what social.ts middleware expects.
wrangler kv:key put --binding=KV "admin:session:$TOKEN" \
  "{\"adminId\":\"system-autopost\",\"role\":\"SUPER_ADMIN\",\"expiresAt\":\"2099-12-31T00:00:00Z\"}"

echo "Set HEIRLOOM_ADMIN_TOKEN to: $TOKEN"
```

Save that token — you'll add it to GitHub secrets in step 4.

---

## 3. First worker deploy

```bash
cd cloudflare/worker
wrangler deploy
```

After deploy:

- Hit `https://<your-worker-subdomain>.workers.dev/health` — should return `{ ok: true }`.
- Hit `https://<your-worker-subdomain>.workers.dev/api/archive/audit` — should return aggregate pin stats (zeros are fine; just confirms the route is up).

### 3.1 Custom domain

In the Cloudflare dashboard:

1. DNS → ensure `heirloom.blue` and `api.heirloom.blue` exist.
2. Workers & Pages → your worker → Settings → Triggers → Routes → add `api.heirloom.blue/*`.
3. Pages will be wired in step 5.

---

## 4. GitHub Actions secrets + variables

`Settings → Secrets and variables → Actions`

**Repository secrets:**

```
CLOUDFLARE_API_TOKEN          (scoped, from Phase 5.1)
CLOUDFLARE_ACCOUNT_ID         (08596e523c096f04b56d7ae43f7821f4)
ANTHROPIC_API_KEY
HEIRLOOM_ADMIN_TOKEN          (from step 2.4)
META_PAGE_ACCESS_TOKEN
LINKEDIN_ACCESS_TOKEN
PINTEREST_ACCESS_TOKEN
BLUESKY_APP_PASSWORD
QUEUE_WEBHOOK_URL             (Discord/Slack webhook for queue-mode posts)
```

**Repository variables (non-secret):**

```
ANTHROPIC_MODEL               claude-sonnet-4-6
HEIRLOOM_API_URL              https://api.heirloom.blue
META_PAGE_ID
META_IG_USER_ID
LINKEDIN_AUTHOR_URN           urn:li:organization:NNNNN
PINTEREST_BOARD_ID
BLUESKY_HANDLE                heirloom.blue
PLATFORMS                     instagram,tiktok,pinterest,facebook,linkedin,x
```

The first two were already set in Phase 5.1.

---

## 5. Frontend deploy (Cloudflare Pages)

```bash
cd frontend
npm ci
npm run build

# First-time deploy — creates the Pages project.
npx wrangler pages deploy ./dist --project-name=heirloom-frontend --branch=main
```

Then in the Cloudflare dashboard:

1. Pages → `heirloom-frontend` → Custom domains → add `heirloom.blue` and `www.heirloom.blue`.
2. Build & Deployments → Production branch = `main`. Build command = `npm run build`. Build output = `dist`. Root directory = `frontend`.
3. Environment variables → `VITE_API_URL=https://api.heirloom.blue`.

After this, `git push origin main` triggers `.github/workflows/deploy-cloudflare.yml` and ships both worker + Pages on every push.

---

## 6. Verify the autonomous systems

### 6.1 Daily content engine (one manual run)

```bash
# Workflow_dispatch with mode=preview — DRY_RUN, writes to output/, no posts
gh workflow run social-autopost.yml -f mode=preview -R Reshigan/Heirloom
gh run watch -R Reshigan/Heirloom
```

When the run finishes, check `marketing/automation/output/<today>/queue/` for the day's variants. Voice should match `marketing/automation/src/voice.ts`.

### 6.2 Influencer discovery (worker cron, manual trigger)

```bash
# Trigger the daily 09:00 UTC block manually
curl -X POST "https://api.heirloom.blue/__scheduled?cron=0+9+*+*+*"
```

Watch the worker logs (`wrangler tail`) for:

```
Discovering new influencers from viral list...
Discovering creators on TikTok…
Discovering creators on Instagram…
Enriching placeholder emails from public bios…
Resolving Thread time-locks…
```

### 6.3 Weekly archive pinning (manual trigger)

```bash
curl -X POST "https://api.heirloom.blue/__scheduled?cron=0+0+*+*+SUN"
```

Then check `https://api.heirloom.blue/api/archive/audit` — `total_pins` should increment.

---

## 7. Post-launch checks

A 12-item checklist that, when all green, means the platform is operational. Mirrors `REGISTRATION.md` §8.

- [ ] heirloom.blue resolves with valid SSL
- [ ] DKIM/SPF/DMARC pass at https://dmarcian.com
- [ ] Test outreach email reaches inbox (not spam) on Gmail / Outlook / Yahoo
- [ ] Meta Business app review approved; IG post-via-API succeeds in production
- [ ] LinkedIn post-via-API succeeds
- [ ] Pinterest pin-via-API succeeds
- [ ] Bluesky post-via-API succeeds
- [ ] `marketing/automation/` daily GitHub Actions run completes green
- [ ] Worker daily cron logs show all five blocks: drip / discovery / enrich / locks / payouts
- [ ] Worker weekly cron logs show archive-pinning + lulu-sync
- [ ] One test influencer end-to-end: discover → email → click landing → signup → conversion → commission accrual → Stripe payout
- [ ] One test family thread: signup → open thread → entry written + encrypted → time-lock set → entry visible in `/api/threads/:id/entries` with `pending_lock` populated

When all 12 are checked, the system runs unattended.

---

## 8. Operating costs at this configuration

| Item | Monthly | Notes |
|---|---|---|
| Anthropic API (Sonnet 4.6) | ~$3 | Daily content gen with prompt caching |
| Cloudflare Workers + Pages + D1 + R2 + KV | $0–$5 | Workers Free covers ~10M req/mo; Workers Paid is $5/mo if scaled |
| Resend / M365 outbound email | $0 | Existing |
| Pinata Free / Web3.Storage | $0 | Until you exceed 1GB / 1TB respectively |
| Lulu Direct | $0 | Pure pay-per-print, revenue-positive |
| GitHub Actions | $0 | Within free tier |
| **Running cost** | **~$3–$10/mo** | At launch volume |

Scales sublinearly until you cross Workers Paid threshold (~10M requests/mo). When the autonomous engine pulls in real users, the cost stays under $50/mo for the first ~10K active users.

---

## 9. Backup + recovery

### 9.1 D1

`.github/workflows/d1-backup.yml` runs daily at 02:00 UTC; backups land in R2 under `heirloom-uploads/backups/`. Retention: 30 days via R2 lifecycle rule.

To restore:

```bash
wrangler d1 execute heirloom-db --remote --file=./backups/heirloom-db-backup-YYYYMMDD_HHMMSS.sql
```

### 9.2 IPFS archive

Read-only verification — anyone can confirm a Thread's snapshot is intact:

```bash
curl https://cloudflare-ipfs.com/ipfs/<CID> | jq .
```

The CIDs for every active thread are at `/api/archive/audit` (public) and the per-thread `archive_pins` rows.

If the company is wound down, the successor non-profit boots a minimal worker against the same D1 schema + the existing IPFS pins. No data migration required.

---

## 10. Post-launch ops (steady state)

- **Weekly**: review `marketing/automation/output/` to catch brand-voice drift; review `archive_pins` audit for verification failures.
- **Monthly**: sample 10 outreach emails sent from `marketing_outreach` for tone + accuracy.
- **Quarterly**: rotate `JWT_SECRET`, `ENCRYPTION_MASTER_KEY` (with proper key-rotation handoff), and the admin session token. Audit GitHub secrets for staleness.
- **Yearly**: Founder pledge revenue audit; non-profit board check-in; verify decentralized backup providers are still healthy.

If any cron is failing for 24 hours, you'll see it in `wrangler tail`. The daily cron is verbose by design — `console.log`s wrap every job's outcome.
