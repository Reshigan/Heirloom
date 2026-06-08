# TypeScript Type-Safety Audit — Heirloom

Scope: `cloudflare/worker/src/routes/`, `cloudflare/frontend/src/`. Date: 2026-06-07.

---

## 1. `any` usage in worker routes

`grep -rn ": any\|as any\|<any>" cloudflare/worker/src/routes/` returns ~70 hits across
`inherit.ts`, `announcements.ts`, `engagement.ts`, `engagement-v2.ts`, `push-notifications.ts`,
`family.ts`, `memories.ts`, `share.ts`. Patterns, in order of risk:

### HIGH
- **`memories.ts:60`** — `memories.results.map(async (m: any) => ...)` then accesses `m.metadata`,
  `m.description`, `m.encrypted` etc. with no shape guarantee. A D1 row shape change (renamed/
  dropped column) silently produces `undefined` deep in a map with no compile-time signal.
- **`memories.ts:155-157`** — `statsResult.results[0] as any`, `letterCountResult.results[0] as any`,
  `voiceStatsResult.results[0] as any` — three separate blind casts on raw D1 query results feeding
  numeric aggregates (storage totals, counts) returned to the client. A null/empty `results[0]`
  (e.g. empty table) becomes `undefined as any`, and arithmetic on `undefined` silently yields `NaN`
  rather than throwing.
- **`inherit.ts:291`** (`metadata?: any`) and `inherit.ts:308` / `engagement-v2.ts:114`
  (`for (const m of memories.results as any[])`) — inheritance/legacy-portal code reaches into
  `metadata` and memory fields with zero shape checking; this is the recipient-facing "read the
  whole archive" path, i.e. exactly where a malformed/legacy record should not crash the response.
- **`inherit.ts:378`** — `(response as any).response?.trim()` on a Workers AI call result. If the AI
  binding's response shape changes (model upgrade), this degrades silently to the fallback string
  with no type error to catch it at build time.
- **`push-notifications.ts`** — 11 occurrences of `catch (error: any)`, plus `env: any` (lines 322,
  359) on two helper functions that receive the typed `Env` from their callers but re-type it away,
  and `for (const user of users.results as any[])` (line 374). This is the module that drives actual
  device push delivery; losing `Env` typing here means typos in `env.VAPID_PRIVATE_KEY` etc. won't
  be caught.

### MEDIUM
- **`inherit.ts:93`** and **`announcements.ts:91`** — `(c: any, next: any)` for Hono middleware
  (`validateRecipientSession`, `adminAuth`). Hono exports `MiddlewareHandler<AppEnv>` /
  `Context<AppEnv>` / `Next` — using `any` here means `c.env`, `c.get('userId')`, `c.json(...)` are
  all unchecked inside these auth gatekeepers, which is precisely the code that should be the most
  rigorously typed (it decides who gets access to recipient/admin data).
- **`announcements.ts:212-224, 264`** — `(user as any).email`, `.name`, `.id`, and
  `recipients[i] as any` — recipient/notification fan-out code casts D1 rows ad hoc per-field
  instead of typing the row once.
- **`family.ts:39,55,108,121,130`**, **`engagement.ts:196,197,204,476`**,
  **`engagement-v2.ts:94,142`** — repeated `(x: any) => ...` on `.results.map`/`.filter`/`.sort`
  over D1 query results. Each call site re-derives field names from memory; a typo (`d.startsDate`
  vs `d.start_date`) compiles fine and fails at runtime.
- **`memories.ts:33,52,98`** — `const params: any[]`, `const countParams: any[]`, `const memories: any[]`
  for SQL bind-parameter arrays and accumulator arrays. These should be `(string | number | null)[]`
  (D1's `bind()` parameter type) — using `any[]` defeats the point of `@cloudflare/workers-types`.
- **`share.ts:23`** — `function readParams(c: any)` returns a precisely-typed object
  (`{ kind: ShareKind; count?: string; ... }`) but takes an untyped `c`, so the function body itself
  is unchecked even though its contract looks strict.

### LOW
- **`catch (err: any)` / `catch (error: any)`** — `memories.ts:236,281`, `inherit.ts` (none),
  `push-notifications.ts` (9x), `index.ts` (5x). TS' default `unknown` for catch bindings is safer
  (forces a type-guard before `.message` access); `any` lets `err.message` / `err.foo` through
  unchecked. Low because it's a very common, low-blast-radius idiom — but ~25 occurrences worker-wide
  is a lot of surface area for "what if `err` isn't an Error".
- **`engagement.ts:655,700`, `announcements.ts:291`** — `function f(env: any, ...)`,
  `(progress: any)`, `(announcement: any, ...)` — helper function parameters typed `any` instead of
  reusing `Env` / a `Progress` shape / the announcement row type that's already known at the call site.

**Routes with the heaviest concentration:** `push-notifications.ts` (11), `memories.ts` (9),
`inherit.ts` (6), `engagement.ts` (6), `announcements.ts` (6), `family.ts` (5).

---

## 2. `any` usage in frontend

~110 hits. The riskiest cluster is **API-response unwrapping** — almost every page/hook that calls
`.then(r => r.data)` then re-casts the untyped result with `as any` to dig into nested fields:

### HIGH
- **`hooks/useTapestryEntries.ts:48-50`** and **`pages/Weft.tsx:151-156`** — identical pattern,
  duplicated: `Array.isArray((memoriesData as any)?.data) ? (memoriesData as any).data : []`,
  repeated for memories/letters/voice/received in *both* files. This is the data path that feeds the
  Tapestry/Wall — the canonical `loom` reading surface — and the exact shape check
  (`data.data` vs `data` vs missing) is re-implemented twice with `any` rather than once with a
  typed envelope (`{ data: T[] }`). A worker response-shape change requires fixing it in two places,
  and TS won't flag the second site.
- **`hooks/useIsNewUser.ts:14,26,38`** — three near-identical `const data = r.data as any;` blocks
  doing the same `Array.isArray(data?.data) ? ... : Array.isArray(data) ? ... : 0` dance — the same
  "is it `{data: [...]}` or a bare array?" ambiguity as above, copy-pasted three times.
- **`hooks/useRole.ts:25-26`** — `(subscription as any)?.tier`, `(subscription as any)?.status`.
  `subscription` already comes from `billingApi.getSubscription().then(r => r.data)` (untyped/`any`
  via axios), so the `as any` is a no-op cast on an already-`any` value — a clear signal the actual
  fix is to type `getSubscription()`'s response once (see §5). This is the function that decides
  `'founder' | 'family' | 'trial' | 'visitor'` — gating paid-feature UI — entirely off stringly-typed,
  uncast fields.
- **`pages/Settings.tsx:60-61, 132, 188`** — `(profileData as any).birthDate`, `.gender`,
  `(deadmanStatus.data ?? {}) as any`, `((notifData as any)?.preferences ?? {})`. Settings mutates
  user profile/security data; if the worker's `/settings/profile` response omits a field the page
  expects, `undefined` flows silently into form state with no compile-time warning.

### MEDIUM (auth / billing / API layer)
- **`pages/Billing.tsx:41,47,53`** — `onSuccess: (data: any) => { if (data?.url) ... }` (checkout
  and portal mutations) and `(subscription as any)?.trial_ends_at`, `.trialDaysRemaining`. Same
  "double any" problem as `useRole`: `subscription` is already untyped from
  `billingApi.getSubscription().then(r => r.data)`, then individually re-cast per field at each
  access site (`as any` three separate times across lines 50-54) instead of declaring one
  `interface SubscriptionResponse` once. `data?.url` on the Stripe checkout/portal response is a
  redirect URL — if it's missing or renamed, the user silently gets stuck on the page with no error.
- **`pages/Pricing.tsx:28`** — `billingApi.getPricing().then((r: any) => { const d = r.data ?? r; ... })`.
  The `r.data ?? r` defensive fallback (handling "is it an Axios response or already unwrapped?")
  combined with `r: any` suggests the call site genuinely doesn't know the response shape contract.
  (The local `PricingData` interface used afterwards is reasonable — see §5 — but the entry point
  into it is untyped.)
- **`pages/ComposeLetter.tsx:131`** — `let data: any;` for what is presumably the encrypted-letter
  payload assembled before `encrypted`/`encryption_iv` submission — exactly the kind of
  security-sensitive payload that should have an explicit interface (per the
  `legacy-append-only-encryption-shipped` work already in flight).
- **`pages/Weft.tsx:41,53,59-61`** — `dyeOf(metadata: any)`, `recipientOf(l: any)`,
  `(memories: any[], letters: any[], voice: any[])` — the Tapestry-merge helpers (which decide dye
  color / authorship thread per §2.7 of the design constitution) operate on untyped entry shapes.
  Given the project's design system encodes *member identity* in the dye, a metadata-shape mismatch
  here would silently mis-attribute a thread's color/author.
- **`pages/Record.tsx:62`** and **`pages/ThreadsIndex.tsx:12`** —
  `familyApi.getAll().then(r => (r.data as any)?.members ?? r.data ?? [])` /
  `threadsApi.list().then(r => (r.data as any)?.threads ?? r.data ?? [])`. Same "guess the envelope
  shape" fallback chain as Pricing — three different possible shapes tolerated at runtime with no
  type to pin down which one the worker actually sends.

### LOW
- **`catch (err: any)`** — `VaultModal.tsx` (x2), `Founder.tsx`, `Login.tsx`, `ResetPassword.tsx`,
  `AdminLogin.tsx`, `Compose.tsx`, `MarketingTab.tsx` (x2), `ComposeLetter.tsx` (x2),
  `Settings.tsx` (x2) — ~13 occurrences of `catch (err: any) => err?.response?.data?.error`. Same
  idiom as the worker; low risk individually (defensive optional-chaining already present), but a
  shared `getErrorMessage(err: unknown): string` helper would remove the `any` and the duplication
  in one move.
- **`useState<any>(null)`** — `Memorials.tsx:46`, `GiftSubscriptions.tsx:62`, `Challenges.tsx:9` —
  modal/selection state typed `any` instead of the row type already implied by the list it's drawn
  from (`memorialList: any[]`, etc. — see next bullet).
- **List-shape escape hatches** — `Milestones.tsx:105-106`, `Memorials.tsx:92`,
  `Streaks.tsx:465,479`, `GiftSubscriptions.tsx:144,275`, `MarketingTab.tsx` (6x),
  `PersonPage.tsx:18-20,77-91` — `const xList: any[] = x || []` then `.map((x: any) => ...)`. This
  is the single most common pattern in the frontend `any` list (>20 occurrences): "the query
  returned `unknown`/`{}`-ish data, so re-declare it as `any[]` and move on." Each is individually
  low-stakes (display-only lists) but collectively this is where most of the frontend's type
  coverage leaks out.
- **`MarketingTab.tsx:221`** — `setActiveSubTab(id as any)` — casting a loop variable to satisfy a
  union-typed setter; the fix is to type the tab-id array as the union directly (`const TABS:
  {id: SubTab}[]`).

---

## 3. Missing null checks in `services/api.ts`

`grep -n "\.data\." cloudflare/frontend/src/services/api.ts` returns **zero matches** — `api.ts`
itself never chains off `.data` (it's a thin axios wrapper: every `xxxApi.method` just returns
`api.get/post/patch/delete(...)`, i.e. an `AxiosPromise`). So the literal question ("does api.ts
access `.data` without null-checking?") is **no** — but that's because **the unwrapping and
null-checking is deferred to every call site**, which is the actual problem:

- `api.ts` exports raw `AxiosPromise<any>` for nearly every endpoint (axios's default response type
  is `any` unless a generic is supplied — only `bookOrdersApi.create` at line 887 uses
  `api.post<{ url: string }>(...)`). That means **every single consumer** re-derives "is the payload
  `{data: [...]}`, a bare array, or `{}`?" from scratch — which is exactly what produces the
  `(x as any)?.data ?? x.data ?? []` chains catalogued in §2 (`useTapestryEntries`, `useIsNewUser`,
  `Record.tsx`, `ThreadsIndex.tsx`, `Pricing.tsx`, `Billing.tsx`).
- One real exception inside `api.ts` itself worth flagging: the token-refresh interceptor
  (lines 74-77) does `const { data } = await axios.post(...)` then
  `localStorage.setItem('token', data.token)` / `data.refreshToken` / `return data.token as string`
  — **no null check** on `data`, `data.token`, or `data.refreshToken`. If the worker's
  `/auth/refresh` ever returns `{}` or an error body with status 200 (or the response shape
  changes), this throws inside a `.finally()`-wrapped promise that every concurrent 401 awaits,
  which would cascade into a hard logout for the whole session — worth a guard given how central
  this path is (it was already hardened once for the H5 race condition per the comment above it).

**Risk:** MEDIUM-HIGH. Not a literal "`.data.` without null check" in `api.ts`, but `api.ts`
*causes* the problem cataloged in §2 by not giving any endpoint a typed response shape — the actual
null-check burden (and the `any` casts that paper over it) is pushed onto ~15 different call sites
that each guess independently.

---

## 4. Worker `Env` type safety

`cloudflare/worker/src/index.ts:67-137` — **`Env` is fully and explicitly typed.** Every D1/R2/KV/
DO/AI binding (`DB: D1Database`, `STORAGE: R2Bucket`, `KV: KVNamespace`,
`RATE_LIMITER: DurableObjectNamespace`, `AI: Ai`) and every secret/env var (`JWT_SECRET`,
`STRIPE_SECRET_KEY`, `ENCRYPTION_MASTER_KEY`, VAPID/APNs/FCM/MS365/OAuth keys, etc., correctly
marked optional with `?`) is declared. `AppEnv = { Bindings: Env; Variables: Variables }` is
threaded through `new Hono<AppEnv>()`.

- **No `(c.env as any)` casts anywhere** in `index.ts` — confirmed via grep.
- The one real gap: **`verifyJWT(token: string, secret: string): Promise<any>`** (line 1085) —
  the JWT-verification helper that backs every authenticated request returns `any`, so its caller
  (`c.set('user', payload)` / `c.get('userId')` etc.) gets no compile-time guarantee about the
  decoded claim shape (`sub`, `sessionId`, `iat`, `exp` — which *are* declared on `Variables.user`
  at line 141-146, but nothing connects `verifyJWT`'s return type to that interface). A claims-shape
  typo would compile fine and fail only at runtime.
- `catch (err: any)` appears 5x in `index.ts` (lines 337, 443, 478, 571, 693) — same low-risk idiom
  as elsewhere.

**Verdict:** `Env` itself — HIGH marks for completeness. The narrow gap is `verifyJWT`'s
`Promise<any>` return type (LOW-MEDIUM: it's the auth backbone, but the actual `Variables.user`
contract is separately and correctly typed, so the blast radius of a mismatch is "wrong claim read"
not "wrong binding").

---

## 5. Response-shape match: billing `/pricing` & `/subscription`

**`/billing/pricing`** (`cloudflare/worker/src/routes/billing.ts:307-389`) returns, among other
fields:
```ts
{
  ...
  FAMILY: { monthly: prices.FAMILY.monthly, yearly: prices.FAMILY.yearly },
  FOUNDER: { lifetime: prices.FOUNDER.lifetime },
  tiers: [ ... ],
  ...
}
```
**`Pricing.tsx:6-11`** declares:
```ts
interface PricingData {
  symbol: string;
  code: string;
  FAMILY?: { monthly: number; yearly: number };
  FOUNDER?: { lifetime?: number };
}
```
**This matches** — the flat `FAMILY`/`FOUNDER` fields the worker explicitly comments
"Flat fields the web Pricing page reads directly for localized display" (billing.ts:314) line up
with `PricingData`. Good: this is one of the few places the frontend declares an explicit interface
for a worker response. The only softness: the entry point is still
`billingApi.getPricing().then((r: any) => { const d = r.data ?? r; if (d?.FAMILY && d?.FOUNDER)
setPricing(d) })` — `r: any` plus an `r.data ?? r` guard that suggests uncertainty about whether
axios already unwrapped the response. (It always has — `r.data` is correct; `?? r` is dead-code
defensiveness that also silently swallows a shape mismatch into `FALLBACK`.)

**`/billing/subscription`** (`billing.ts:393-426`) returns:
```ts
{ id, tier, status, billingCycle, currentPeriodEnd, cancelAtPeriodEnd,
  trial_ends_at, trialDaysRemaining, storage, limits, ... }
```
(or, for users with no subscription row: `{ tier: 'STARTER', status, storage, limits,
trialDaysRemaining: 0 }` — note **no `trial_ends_at` key at all** in that branch).

**`Billing.tsx`** has **no interface** for this response — `subscription` is inferred as
`any` from `.then(r => r.data)`, then individually field-accessed:
```ts
const currentTier = (subscription?.tier ?? 'STARTER') as string;
const renews = subscription?.currentPeriodEnd ?? null;
const status = subscription?.status ?? null;
const trialEndsAt = (subscription as any)?.trial_ends_at ?? null;
const trialDaysRemaining = (subscription as any)?.trialDaysRemaining ?? 0;
```
Field names line up with what the worker actually sends (`tier`, `status`, `currentPeriodEnd`,
`trial_ends_at`, `trialDaysRemaining`) — so there is **no current mismatch** — but:
1. `(subscription as any)?.trial_ends_at` is a **snake_case** field accessed directly from a
   TS-untyped value sitting next to **camelCase** `currentPeriodEnd`/`trialDaysRemaining` — this
   inconsistency (worker mixes `snake_case` DB columns with camelCase derived fields in the same
   payload) is exactly the kind of thing a shared interface would catch/normalize, and exactly the
   kind of thing that silently breaks if someone "cleans up" the worker to be all-camelCase.
2. `useRole.ts` (§2) independently re-derives `tier`/`status` off the *same* `getSubscription()`
   call with its own `(subscription as any)?.tier` — two independent untyped readers of one
   endpoint, neither anchored to a shared `interface SubscriptionResponse`.

**Verdict:** No live mismatch found — current field names agree — but the **lack of a shared
response-type contract** (only `Pricing.tsx` bothered to declare one, and even that entry point is
`any`-cast) means a future worker change to either endpoint has **zero compile-time tripwire** on
either of its two independent frontend consumers.

---

## 6. Strict mode

| | `strict` | `noImplicitAny` (implied by strict) | `noUnusedLocals` | `noUnusedParameters` |
|---|---|---|---|---|
| **Frontend** (`cloudflare/frontend/tsconfig.json`) | ✅ `true` | ✅ | ✅ `true` | ✅ `true` |
| **Worker** (`cloudflare/worker/tsconfig.json`) | ✅ `true` | ✅ | ❌ absent | ❌ absent |

- Frontend: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`,
  `noFallthroughCasesInSwitch: true` — the strongest config in the repo. Cruft (unused
  imports/locals/params) fails the build gate.
- Worker: `strict: true` only. **`noUnusedLocals` / `noUnusedParameters` are not set** (default
  `false`) — unused destructured body fields, unused imports, and unused function parameters
  compile silently. Given §7 (body fields are destructured-but-trusted with no validation), this
  also means a destructured field that's silently never used (e.g. a stale `couponCode` after a
  refactor) won't be flagged either.

**Recommendation:** add `"noUnusedLocals": true, "noUnusedParameters": true` to
`cloudflare/worker/tsconfig.json` to match the frontend gate — LOW effort, catches exactly the kind
of "destructured `metadata` that nothing reads" cruft this audit's §1/§7 findings are adjacent to.

---

## 7. Runtime validation (Zod or equivalent)

**There is none.** `grep -rl "zod" cloudflare/worker/src/` and `grep "zod" cloudflare/worker/package.json`
both return nothing — **zod is not a dependency of the worker** (note: it *is* a dependency of
`marketing/automation`, per CLAUDE.md, but that's a separate package).

Every route handler that accepts a body does:
```ts
const body = await c.req.json();              // type: any
const { type, title, description, ... } = body; // all destructured fields: any
if (!type || !title) return c.json({ error: '...' }, 400);  // truthy-check only
```
Representative call sites: `auth.ts` (register/login/refresh/forgot-password — destructures
`email, password, firstName, lastName, acceptedTerms, marketingConsent` etc., validates only
presence), `memories.ts:489-495` (destructures 12 fields including `metadata`, `recipientIds`,
`encrypted`, `encryption_iv` — validates only `type`/`title` truthiness), `billing.ts:519,551,692`
(destructures `tier, billingCycle, couponCode, influencerCode` — validated only by an
`if (normalizedTier !== 'FAMILY')` business-rule check, not a shape/type check).

**Concretely missing:**
- **Type validation**: `c.req.json()` returns `any`; nothing guarantees `email` is a string,
  `fileSize` is a number, `metadata` is an object (not an array/string/null), or `recipientIds` is
  `string[]`. A client sending `{ "email": 12345 }` or `{ "metadata": "oops" }` passes every
  current truthy check and flows into SQL `bind()` / JSON storage as whatever it is.
- **Shape validation**: nested objects (`metadata`, `encryption_iv`, gift-voucher payloads, etc.)
  are passed through with no schema — the "worker metadata sanitizer whitelist" memory note
  (`memories.ts` — only whitelisted keys survive) is itself evidence that the team has already hit
  this exact gap once (a composer key silently vanishing because it wasn't in the allow-list) and
  patched it ad hoc rather than with a schema that both validates *and* documents the contract.
- **Range/format validation**: e.g. `billingCycle` is checked against `'yearly'` via
  `=== 'yearly'` (implicitly anything else → `'monthly'`) rather than a `z.enum(['monthly','yearly'])`
  — a typo'd `billingCycle: 'yeary'` silently bills monthly.

**Verdict: HIGH.** This is the single biggest structural gap in the audit — every authenticated
mutation endpoint trusts `c.req.json()` completely past a `!field` truthy check. Adding `zod`
(already a proven pattern in `marketing/automation`) with one schema per route body would convert
an entire class of "malformed request → silent bad data / NaN / proto-pollution-shaped bug" into a
clean `400` at the door, and would give the destructured fields real types for free (eliminating
much of the worker-side `any` in §1 as a side effect).

---

## Summary ranking

| Rank | Finding | Why |
|---|---|---|
| **HIGH** | §7 — no runtime validation (no zod) on any worker route body | `c.req.json()` is `any`; only truthy-checks gate ~20 mutation endpoints incl. auth/billing/memories; malformed input flows into SQL/storage |
| **HIGH** | §1 — `memories.ts:155-157` blind `results[0] as any` triple-cast feeding numeric stats | empty-table → `undefined` → `NaN` silently returned to client |
| **HIGH** | §1 — `inherit.ts` / `engagement-v2.ts` `as any[]` over memory/letter/voice rows in the recipient-portal read path | exactly the path that must not crash on a legacy/malformed record |
| **HIGH** | §2 — `useTapestryEntries.ts` + `Weft.tsx` duplicate `(x as any)?.data ?? x.data` envelope-guessing for the Tapestry feed | core reading-surface data path re-implemented untyped in two places |
| **HIGH** | §2 — `useRole.ts` gates paid-feature access (`founder`/`family`/`trial`/`visitor`) off doubly-`any`-cast `subscription.tier`/`.status` | wrong tier inference → wrong feature gating, no compile-time tripwire |
| **MEDIUM** | §3 — `api.ts` exports untyped `AxiosPromise<any>` for ~all endpoints, pushing shape-guessing onto every call site | root cause of the §2 `any`-cast proliferation; one typed wrapper would fix ~15 sites at once |
| **MEDIUM** | §3 — token-refresh interceptor reads `data.token`/`data.refreshToken` with no null check, inside a promise every concurrent 401 awaits | malformed `/auth/refresh` response could cascade into a full-session logout |
| **MEDIUM** | §1 — `inherit.ts:93` / `announcements.ts:91` `(c: any, next: any)` Hono middleware for recipient/admin auth gates | the access-control code itself is untyped |
| **MEDIUM** | §5 — billing response fields read with no shared `interface SubscriptionResponse`/`PricingResponse`, mixed snake_case/camelCase (`trial_ends_at` vs `trialDaysRemaining`) read via ad hoc `as any` in two independent consumers | no live mismatch today, but zero compile-time tripwire if either side changes |
| **LOW** | §6 — worker `tsconfig.json` missing `noUnusedLocals`/`noUnusedParameters` (frontend has both) | easy parity fix; would also catch dead destructured body fields |
| **LOW** | §1/§2 — ~38 `catch (err: any)` across worker+frontend | idiomatic but `unknown` + type-guard is strictly safer; a shared `getErrorMessage(err: unknown)` helper removes both the `any` and the duplication |
| **LOW** | §2 — `useState<any>(null)` / `xList: any[]` display-list patterns (Milestones, Memorials, Streaks, GiftSubscriptions, MarketingTab, PersonPage — 20+ sites) | display-only, low blast radius, but the largest single bucket of frontend `any` by count |
| **LOW** | §4 — `verifyJWT(): Promise<any>` not anchored to the already-correct `Variables.user` claim shape | `Env`/`Variables` themselves are fully and correctly typed; this is the one loose thread |
