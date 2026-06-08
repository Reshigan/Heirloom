# Heirloom — Launch Readiness Audit
**Date:** 2026-06-07  
**Auditor:** Claude Code (automated)

---

## 1. Build Health

| Check | Status | Notes |
|---|---|---|
| `cloudflare/frontend` build (`npm run build`) | ✅ PASS | Exits 0, 0 TypeScript errors. 93 routes pass link-integrity check. |
| Worker TypeScript (`npx tsc --noEmit`) | ✅ PASS | Exits 0, 0 errors after filtering test/cloudflare:test noise. |
| Bundle size warning | ⚠️ WARNING | `ClothCanvas3D` chunk is 515 kB (gzipped 130 kB). `index` chunk is 363 kB. Above the 500 kB Rollup threshold. Not a blocker but will hurt mobile load times. Consider lazy-loading the 3D canvas. |
| Dynamic/static import mismatch | ⚠️ WARNING | `api.ts` and `pushNotificationService.ts` are both dynamically and statically imported. Vite logs this as a warning — the modules land in the main bundle, defeating code-splitting. Low-priority but worth cleaning up post-launch. |

---

## 2. Environment Variables Checklist

### Worker secrets (set via `wrangler secret put` or CI sync)

| Secret | Required? | Status |
|---|---|---|
| `JWT_SECRET` | ❌ Required — auth is broken without it | Unknown — must verify in CF dashboard |
| `STRIPE_SECRET_KEY` | ❌ Required for billing | Unknown — CI syncs it if GH secret set; deployment comment says "Stripe billing stays disabled" if absent |
| `STRIPE_WEBHOOK_SECRET` | ❌ Required for webhook verification | Unknown — same as above; absent = webhooks unverified (Stripe subscription events silently dropped) |
| `RESEND_API_KEY` | ❌ Required for transactional email (welcome, verification, check-in reminders) | Unknown |
| `VAPID_PRIVATE_KEY` | ⚠️ Optional — web push dormant if absent | Unknown — CI skips cleanly if unset |
| `ENCRYPTION_MASTER_KEY` | ⚠️ Optional — at-rest encryption dormant if absent | Known missing per project memory; dormant until set |
| `HEIRLOOM_ADMIN_TOKEN` | ⚠️ Optional — marketing automation handoff | Unknown |

### Worker vars (set in `wrangler.toml` — committed, confirmed)

| Var | Value |
|---|---|
| `ENVIRONMENT` | `production` |
| `APP_URL` | `https://heirloom.blue` |
| `API_URL` | `https://api.heirloom.blue` |
| `ADMIN_NOTIFICATION_EMAIL` | `reshigan@gonxt.tech` |
| `VAPID_PUBLIC_KEY` | Set (matches frontend `.env.production`) |
| `VAPID_SUBJECT` | `mailto:hello@heirloom.blue` |

### Cloudflare infrastructure bindings (wrangler.toml — confirmed)

| Binding | Type | Status |
|---|---|---|
| `DB` | D1 (heirloom-db) | ✅ Configured |
| `STORAGE` | R2 (heirloom-uploads) | ✅ Configured |
| `KV` | KV Namespace | ✅ Configured |
| `RATE_LIMITER` | Durable Object | ✅ Configured |
| `AI` | Workers AI | ❌ MISSING — `env.AI` is accessed in `routes/ai.ts` (Llama 3 inference) but there is **no `[[ai]]` binding in `wrangler.toml`**. The AI route will 500 in production. |

### Deploy workflow secrets (GitHub Actions)

| Secret | Required by CI |
|---|---|
| `CLOUDFLARE_API_TOKEN` | ✅ Required (deploy will fail without it) |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ Required |
| `VAPID_PRIVATE_KEY` | Optional — sync step skips if absent |
| `ENCRYPTION_MASTER_KEY` | Optional — sync step skips if absent |
| `STRIPE_SECRET_KEY` | Optional — sync step skips if absent (**but billing is broken if missing**) |
| `STRIPE_WEBHOOK_SECRET` | Optional — sync step skips if absent (**but webhook verification is disabled if missing**) |

---

## 3. Database Migrations

| Check | Status | Notes |
|---|---|---|
| Sequential numbering (0001–0052) | ✅ PASS | No gaps found. |
| Latest migration (0052) safety | ⚠️ WARNING | `0052_relax_subscriptions_check.sql` does `DROP TABLE subscriptions; ALTER TABLE subscriptions_new RENAME TO subscriptions`. This is a table rebuild — safe only if the INSERT…SELECT succeeds first. On a live DB with a large subscriptions table this is atomic in SQLite but has no explicit transaction wrapper. D1 likely wraps each migration in a transaction, making this safe, but it's worth verifying in a staging run before next deploy if you have real subscriber rows. |

---

## 4. CSP and Security Headers

| Check | Status | Notes |
|---|---|---|
| `script-src 'self'` (no unsafe-inline) | ✅ PASS | `_headers` has `script-src 'self' https://static.cloudflareinsights.com`. No `'unsafe-inline'` for scripts. |
| `frame-ancestors 'none'` | ✅ PASS | Present in CSP. |
| `X-Content-Type-Options: nosniff` | ✅ PASS | Present. |
| `Strict-Transport-Security` | ✅ PASS | 1-year HSTS with `includeSubDomains`. |
| `X-Frame-Options: DENY` | ✅ PASS | Present (belt-and-suspenders with `frame-ancestors`). |
| Inline `<script>` in `index.html` | ✅ PASS | No inline scripts. `/theme-boot.js` and `/splash-boot.js` are external same-origin files — CSP compliant. |
| Inline `<style>` in `index.html` body | ✅ PASS | `style-src 'unsafe-inline'` is permitted in the CSP, covering React/framer-motion inline styles and the splash `<style>` block. |

---

## 5. Service Worker

| Check | Status | Notes |
|---|---|---|
| Cache version | ✅ PASS | `CACHE = 'heirloom-v56'` — matches the documented latest bump. |
| Offline fallback | ✅ PASS | Navigation requests: network-first → cached shell (`/index.html`) → `/offline`. API requests: network-first → `heirloom-api-v1` cache. |
| SW cache headers | ✅ PASS | `_headers` sets `Cache-Control: no-cache, no-store, must-revalidate` for `/sw.js` — SW updates will propagate. |
| Precache uses clean URLs | ✅ PASS | Precaches `/offline` not `/offline.html` (correctly avoids redirect-rejection bug documented in SW comments). |

---

## 6. PWA Manifest

| Check | Status | Notes |
|---|---|---|
| `start_url` | ✅ PASS | `/loom/pwa?source=pwa` |
| `display: standalone` | ✅ PASS | Also has `display_override: ["standalone", "minimal-ui"]` |
| `theme_color` | ✅ PASS | `#0e0e0c` (ink — matches `<meta name="theme-color">` in `index.html`) |
| Icons | ✅ PASS | 192px, 512px (any + maskable variants), SVG any. Cache-busted with `?v=20260602`. |
| Apple touch icon | ✅ PASS | Linked in `index.html` with version cache-bust. |
| `manifest.json` vs `manifest.webmanifest` | ⚠️ WARNING | File is `manifest.webmanifest` (correct, standards-compliant). No `manifest.json` exists — nothing broken, but ensure nothing references the `.json` form. |

---

## 7. Pricing + Billing E2E Readiness

| Check | Status | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` in worker Env type | ✅ PASS | Declared at `index.ts:90`. |
| `STRIPE_WEBHOOK_SECRET` in worker Env type | ✅ PASS | Declared at `index.ts:91`. |
| Stripe test vs live mode indicator | ⚠️ WARNING | No `sk_test_`/`sk_live_` prefix guard in code. No `STRIPE_MODE` env var. Whether the live site is hitting Stripe test or live depends entirely on which key was `wrangler secret put`. Confirm the GH secret `STRIPE_SECRET_KEY` begins with `sk_live_` before accepting real payments. |
| Billing if secrets absent | ❌ BLOCKER | If `STRIPE_SECRET_KEY` is not set as a worker secret, billing endpoints will fail silently (no Stripe client). Subscription checkout, webhook processing, and gift vouchers all depend on it. Must confirm the secret is present in the CF dashboard. |

---

## 8. Error Monitoring

| Check | Status | Notes |
|---|---|---|
| Sentry | ❌ MISSING | No Sentry SDK found in worker or frontend. |
| Axiom | ❌ MISSING | Not wired. |
| Logtail / Logflare | ❌ MISSING | Not wired. |
| Cloudflare Tail Workers | ⚠️ WARNING | `[tail_consumers]` is commented out in `wrangler.toml`. The worker has `console.error(...)` calls throughout, but without a tail consumer these logs are only visible in the CF dashboard Logs tab during an active session — not stored, not alerted. |
| Overall | ⚠️ WARNING | No persistent error monitoring. Production failures will be invisible until a user reports them. At minimum, un-comment the tail consumer and point it at a logging service before accepting paying customers. |

---

## 9. Rate Limiting

| Check | Status | Notes |
|---|---|---|
| Auth endpoint rate limiting | ✅ PASS | `RATE_LIMITER` Durable Object applied to `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-2fa`. |
| Admin login rate limiting | ✅ PASS | `admin-login:<ip>` namespace used in `routes/admin.ts`. |
| Contact form rate limiting | ✅ PASS | `contact:<ip>` namespace applied. |
| AI route rate limiting | ✅ PASS | KV-backed 10-calls/minute/user limit. |
| Token refresh / logout | ✅ PASS | Explicitly excluded from rate limiting (by design — non-brute-forceable). |

---

## 10. Marketing Engine Readiness

| Check | Status | Notes |
|---|---|---|
| Schedule | ✅ PASS | Two cron triggers: `0 14 * * *` (anchor, daily) and `0 22 * * *` (seasonal). |
| `ANTHROPIC_API_KEY` | ⚠️ WARNING | Required for generation. Known dormant per project memory until added to GH secrets. |
| Platform secrets | ⚠️ WARNING | `META_ACCESS_TOKEN`, `LINKEDIN_ACCESS_TOKEN`, `PINTEREST_ACCESS_TOKEN`, `BLUESKY_APP_PASSWORD` are all optional — platforms skipped if absent. Engine runs but posts nowhere until secrets are set. |
| Dry-run safety | ✅ PASS | `preview` mode is the `workflow_dispatch` default — won't accidentally post. |
| Output commit | ✅ PASS | Commits `marketing/automation/output/` back to main via bot user. |

---

## Summary

### Blockers (must fix before accepting real customers)

1. **❌ Workers AI binding missing** — `[[ai]]` is not declared in `wrangler.toml`. The `/ai/*` routes (prompt generation, future letters, legacy score) will 500 in production. Add:
   ```toml
   [ai]
   binding = "AI"
   ```

2. **❌ Stripe secrets unconfirmed** — Billing is the revenue engine. Confirm `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set as Cloudflare Worker secrets (not just GitHub secrets — the CI sync step only runs on deploy). Verify the key prefix is `sk_live_` not `sk_test_`.

3. **❌ JWT_SECRET and RESEND_API_KEY unconfirmed** — Auth and transactional email are non-functional without these. Confirm both are set in the CF Worker secrets panel.

### Warnings (should fix soon after launch)

4. **⚠️ No error monitoring** — No Sentry, Axiom, or tail worker. Failures are invisible in production.
5. **⚠️ Migration 0052 is a table rebuild** — Safe in theory (SQLite atomic), but validate against a backup before the next deploy with active subscriber rows.
6. **⚠️ Stripe mode not code-guarded** — No assertion that `STRIPE_SECRET_KEY` starts with `sk_live_` in production. Risk of accidentally charging test cards.
7. **⚠️ ENCRYPTION_MASTER_KEY not set** — Memory description encryption is dormant. Not a blocker, but user data is not encrypted at rest until this is set.
8. **⚠️ VAPID_PRIVATE_KEY not confirmed** — Web push notifications are silently disabled. Not a blocker but a shipped feature that appears broken to users.
9. **⚠️ Marketing engine idle** — Add `ANTHROPIC_API_KEY` + platform secrets to GH secrets to activate.
10. **⚠️ Large bundle chunks** — `ClothCanvas3D` (515 kB) and `index` (363 kB) exceed Rollup's 500 kB threshold. No user-facing breakage but hurts mobile performance.
