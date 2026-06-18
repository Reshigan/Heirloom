# Deployment Portability — re-hosting the substrate

Heirloom's promise is that the family thread outlives the company. The data
itself is portable (every user can export a self-contained ZIP at `/export`),
but the *running deployment* is currently single-tenant on one Cloudflare
account. This document records the exact bindings that account holds and the
steps to reconstitute the deployment on a fresh Cloudflare account (or, with
adaptation, another host).

This is a re-host runbook, not a per-user export — for that, see `/export`.

## The single-tenant bindings (today)

All live in `cloudflare/wrangler.toml`. The values below are the current
production substrate; a re-host replaces every one of them.

| Binding | Name / value | Where |
|---|---|---|
| Account | `account_id = 08596e523c096f04b56d7ae43f7821f4` | `wrangler.toml` |
| Worker script | `name = "heirloom"` (NOT `heirloom-api`) | `wrangler.toml` |
| D1 database | `database_name = "heirloom-db"`, `database_id = 4a228f5e-5ab9-4337-80d7-ebdb4eca0b7d` | `[[d1_databases]]` |
| R2 bucket | `bucket_name = "heirloom-uploads"` (binding `STORAGE`) | `[[r2_buckets]]` |
| KV namespace | `id = a95e2aeaffd14f7f8c28ed9645d81b48` (binding `KV`) | `[[kv_namespaces]]` |
| Durable Object | `RATE_LIMITER` → class `RateLimiter` | `[[durable_objects.bindings]]` |
| Workers AI | binding `AI` | `[ai]` |
| API domain | `api.heirloom.blue/*` (zone `4f33448ad768746ae4f365abde120f0d`) | `routes` |
| Uploads domain | `uploads.heirloom.blue` — R2 public hostname | worker `routes/settings.ts` builds `https://uploads.heirloom.blue/${key}` |
| Web app | `heirloom.blue` — Cloudflare Pages project `heirloom` (Pages, deployed from `cloudflare/frontend`) | Pages, not in wrangler.toml |

### Frontend → backend wiring

- `cloudflare/frontend/src/services/api.ts` — `VITE_API_URL || 'https://api.heirloom.blue/api'`.
- `cloudflare/frontend/.env.production` — `VITE_VAPID_PUBLIC_KEY` (must equal the worker's `VAPID_PUBLIC_KEY`).
- Uploaded media URLs are absolute `https://uploads.heirloom.blue/...` strings,
  built server-side and persisted into D1 rows. Changing the uploads hostname
  means new uploads point at the new host; historical rows still carry the old
  absolute URL (see "Caveats").

## Worker secrets (set via `wrangler secret put`)

Not committed; must be re-created on the new account:

- `JWT_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` (transactional email)
- `VAPID_PRIVATE_KEY` (Web Push; pairs with the public `VAPID_PUBLIC_KEY` var)
- `ENCRYPTION_MASTER_KEY` (server-held AES-GCM at rest — without it, encrypted
  fields cannot be read; this key MUST be migrated, not regenerated)
- `CRON_ENABLED` (`true` to arm the Dead Man's Switch cron triggers)

Public, non-secret vars already live in `[vars]` of `wrangler.toml`
(`APP_URL`, `API_URL`, `ADMIN_NOTIFICATION_EMAIL`, `VAPID_PUBLIC_KEY`,
`VAPID_SUBJECT`).

## Re-host steps (fresh Cloudflare account)

1. **D1.** `wrangler d1 create heirloom-db`. Apply every migration in
   `cloudflare/migrations/*.sql` **in numeric order** (`0001_…` → `0069_…`);
   `migrations_dir = "migrations"` lets `wrangler d1 migrations apply heirloom-db`
   run them in sequence. To carry existing data, export the old D1 first
   (`wrangler d1 export`) and import the dump before/instead of seeding.
2. **R2.** `wrangler r2 bucket create heirloom-uploads`. Copy existing objects
   from the old bucket (e.g. `rclone` between the two accounts). Attach a public
   custom domain (the new equivalent of `uploads.heirloom.blue`).
3. **KV.** `wrangler kv namespace create KV`. Note the new id.
4. **wrangler.toml.** Replace `account_id`, the D1 `database_id`, the KV `id`,
   the `routes` zone_id, and (if renamed) the bucket/db names with the new
   account's values. Keep `name = "heirloom"` aligned with whatever route the
   API domain binds to.
5. **Secrets.** `wrangler secret put` each secret listed above. Migrate
   `ENCRYPTION_MASTER_KEY` verbatim — regenerating it orphans all encrypted data.
6. **Deploy the worker.** `wrangler deploy` (or per the project's deploy flow).
7. **Repoint the frontend.** Set `VITE_API_URL` to the new API origin
   (`https://<new-api-host>/api`) and rebuild/redeploy Pages
   (`cloudflare/frontend`). Update `VITE_VAPID_PUBLIC_KEY` to match the new
   worker's VAPID public key. Point the web app's custom domain at the new
   Pages project.
8. **DNS.** Repoint `heirloom.blue` (web), `api.heirloom.blue` (worker route),
   and `uploads.heirloom.blue` (R2 public domain) at the new account.

## Caveats

- **Historical media URLs are absolute.** Rows persisted before a host change
  still reference the old `uploads.heirloom.blue` origin. Either keep that
  hostname pointed at the new R2 bucket, or run a one-off D1 rewrite of stored
  URLs. (Per-user `/export` ZIPs are unaffected — they inline media bytes and
  rewrite to relative paths.)
- **Stripe** webhooks/products are account-bound; reconfigure the webhook
  endpoint and re-create products/prices on the new Stripe account. Do not
  change pricing in the process.
- **Off-Cloudflare hosts** require replacing D1 (→ any SQLite/Postgres with the
  same schema from `cloudflare/migrations/`), R2 (→ any S3-compatible store),
  KV, and the Durable Object rate limiter with equivalents — a larger port than
  an account-to-account move, but the schema + worker logic are the portable core.
