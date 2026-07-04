# Launch-Critical Ops Runbook

Three things must be verified before real families rely on Heirloom. Work top-down.

---

## 1 · Sealed-letter delivery — the core promise

`resolveTimeLocks` runs in the 9 AM UTC cron and releases matured DATE/AGE/GENERATION
locks, emailing the recipients. It has never fired with real data (0 letters have
matured). Prove it end-to-end **before launch**.

### Monitor (already live)
The daily scoreboard email now carries a **delivery-health row**. Any DATE lock
past its day still unresolved renders a red **"⚠ OVERDUE UNLOCKS — DELIVERY
FAILING"**. Zero shows *"Sealed-letter delivery · healthy"*. Watch it daily.

### End-to-end test
1. In the app, seal a letter **to your own email**, delivery **on a date = today**.
   (This exercises the real write path: `entry_unlocks` row with `unlock_date` = today.)
2. Trigger delivery on demand (don't wait for 9 AM). The endpoint is secret-gated:

   ```bash
   curl -sS -X POST https://api.heirloom.blue/api/admin/run-timelocks \
     -H "x-admin-secret: $ADMIN_SETUP_SECRET" | jq
   ```

   Expect `{"ok":true,"resolvedDate":1,...,"notifications":1}`.
3. Confirm the **email arrives** (check spam too — see §2).
4. Confirm the scoreboard shows **0 overdue** the next morning.

### Also verify
- `CRON_ENABLED` secret value is exactly `true` (it exists; value unconfirmed).
  If not `true`, **no cron runs at all** — no delivery, no scoreboard, nothing.
  ```bash
  npx wrangler secret put CRON_ENABLED   # enter: true
  ```

---

## 2 · Email deliverability — letters must not land in spam

- **Resend** (fallback sender): fully authenticated — SPF + DKIM present. Good.
- **Microsoft 365** (PRIMARY sender, `admin@heirloom.blue`): SPF present, **DKIM
  MISSING**. Mail via Graph is at high spam risk. This is the sender the letter
  path uses first.

### Fix — add O365 DKIM
1. Microsoft 365 admin → **Settings → Domains → heirloom.blue → DKIM**, click
   **Enable**. It will show two exact CNAME records to publish.
2. Publish them at your DNS host. They look like (domain slug `heirloom-blue`
   is confirmed; the `<tenant>` prefix is shown on that DKIM page):

   ```
   Host:  selector1._domainkey.heirloom.blue
   Type:  CNAME
   Value: selector1-heirloom-blue._domainkey.<tenant>.onmicrosoft.com

   Host:  selector2._domainkey.heirloom.blue
   Type:  CNAME
   Value: selector2-heirloom-blue._domainkey.<tenant>.onmicrosoft.com
   ```
   (`<tenant>` is likely `vantax` — confirm on the O365 DKIM page.)
3. Back in O365, toggle **DKIM signing = on**. Verify:
   ```bash
   dig +short CNAME selector1._domainkey.heirloom.blue   # must return the target
   ```

### Then harden DMARC
Currently `p=none` (monitor only). After DKIM passes for ~1 week, upgrade:
```
_dmarc.heirloom.blue  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@heirloom.blue; adkim=s; aspf=s"
```

Alternative if O365 DKIM is a blocker: make **Resend the primary sender** for
user-critical mail (it is fully authenticated today). One change in
`src/utils/email.ts` provider order.

---

## 3 · Durability / backup — the 1000-year claim

- **D1**: automatic Time Travel (30-day point-in-time restore). Covers accidental
  writes/deletes for 30 days only.
- **R2** (photos, voice recordings): **no automatic backup**.
- Users can self-export (`/export`), but there is **no org-level, off-Cloudflare
  backup** — a single-vendor dependency under a "permanent, thousand-year" promise.

### Now live — nightly logical backup to R2
`crons/backup.ts` runs 03:00 UTC, dumping the irreplaceable tables (users,
subscriptions, memories, letters, voice, entry_unlocks, thread/family) to
`backups/<YYYY-MM-DD>/<table>.json` in the STORAGE bucket, with a `_manifest.json`.
Trigger on demand:
```bash
curl -sS -X POST https://api.heirloom.blue/api/admin/run-backup \
  -H "x-admin-secret: $ADMIN_SETUP_SECRET" | jq
# list what landed
npx wrangler r2 object get heirloom-uploads backups/$(date -u +%F)/_manifest.json --pipe | jq
```

### Restore (drill this)
Read a table dump and re-insert. Example (subscriptions):
```bash
npx wrangler r2 object get heirloom-uploads backups/<DAY>/subscriptions.json --pipe \
  | jq -c '.rows[]'   # each row → build INSERT … ON CONFLICT DO UPDATE
```
Write the restore script once and **run a real drill against a scratch DB** —
an untested backup is not a backup.

### Still TODO — the dump is intra-R2 (same vendor)
- Copy the nightly dump **off Cloudflare** (B2/S3) so a account-level loss is survivable.
- R2 media (photos/voice blobs) still need cross-provider replication.
- Marketing claims an IPFS mirror + "succession commitment codified in bylaws".
  Either make those real or soften the copy (false-advertising / POPIA risk for
  a South African operator).

---

## Quick health commands
```bash
# real paying subscriptions
npx wrangler d1 execute heirloom-db --remote --command \
  "SELECT COUNT(*) FROM subscriptions WHERE stripe_subscription_id IS NOT NULL"

# overdue (failing) deliveries — must be 0
npx wrangler d1 execute heirloom-db --remote --command \
  "SELECT COUNT(*) FROM entry_unlocks WHERE lock_type='DATE' AND resolved_at IS NULL AND datetime(unlock_date) <= datetime('now')"

# secrets present
npx wrangler secret list
```
