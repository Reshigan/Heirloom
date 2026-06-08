# Heirloom Frontend Audit

Generated: 2026-06-07
Scope: `cloudflare/frontend/src/`

---

## 1. Auth State — Hydration Gap

**MEDIUM — not a true race condition; correctly handled**

`authStore.ts` uses Zustand `persist` with a custom `onRehydrateStorage` that calls `setHasHydrated(true)` once localStorage is read. Both `ProtectedRoute` and `PublicRoute` in `App.tsx` gate on `_hasHydrated` before acting, rendering an ink-background blank div while waiting. There is no redirect-to-login flash for users with a valid token.

**No bug here.** However, `fetchUser()` is **never called on app startup**. The persisted `isAuthenticated` flag survives across sessions, so a user whose token has been revoked server-side will appear authenticated to the frontend until they attempt an API call that returns 401. There is a `fetchUser` action in the store but no site-wide call to verify the token on mount. This means:

- Revoked/expired tokens keep `isAuthenticated = true` in the store.
- The user sees protected pages until their first API call fails.
- No interceptor in the API service was spotted that clears auth on 401 (would require reading `services/api.ts` to confirm).

**Severity: MEDIUM** — auth bypass for revoked tokens is real but requires a server-side revocation event to trigger.

---

## 2. Billing UI — Price Mismatch

**HIGH — displayed price does not match the canonical 3-tier pricing**

`Billing.tsx` line 56 hardcodes `'$9.99'` for the FAMILY tier:

```ts
const priceLabel = isFounderTier(currentTier) ? 'lifetime' : isFreeTier(currentTier) ? 'free' : '$9.99';
```

And line 63:
```ts
: currentTier === 'FAMILY'
? 'family · $9.99/mo'
```

The authoritative price in `Pricing.tsx` is `$6.99/mo` (`FAMILY: { monthly: 6.99 }`). The Billing page shows **$9.99** everywhere while the Pricing page correctly shows **$6.99**. A user on the Billing page is shown the wrong amount — this will cause support confusion or trust issues.

**No `showAnnual` vs `annual` variable mismatch was found** — that bug does not exist in the current code. The billing cycle toggle is implemented as a direct `checkout.mutate('yearly')` call without a toggle state variable.

**Fix:** Replace `'$9.99'` with `'$6.99'` in both places on lines 56 and 63 of `Billing.tsx`.

---

## 3. Compose Flow

**LOW — no bugs, one missing validation**

- Character limit: **none enforced**. The textarea has no `maxLength` and the submit handler does not enforce one. This may be intentional (entries are the permanent record; truncation would be destructive), but there is no server-side limit communicated to the user either. If the backend enforces a limit, the frontend gives no feedback until the API returns an error.
- Form reset on success: correct — `localStorage.removeItem(draftKey)` is called in `onSuccess` and the `woven` flag redirects to `/loom/index` after 4.2 s.
- Unsaved-changes warning: implemented via `beforeunload` on `body.trim() && !woven` (line 599–607). Does **not** fire when the user clicks the in-page "cancel" button — the cancel handler saves the draft to localStorage instead, which is the correct behaviour.
- Delivery trigger `'event'` maps to `'MILESTONE'` API value (line 696). This may be intentional (same backend enum) but the UI label says "on an event" while the API records "MILESTONE". Worth confirming with the backend schema.
- Draft key uses `user?.id ?? 'anon'` — if a user logs out and another logs in without clearing state, an 'anon' draft could persist, but logout explicitly clears all `hl-compose-draft:*` keys so this is safe.

---

## 4. Family Management

**MEDIUM — no crash, but two UX issues**

1. **No loading guard before render of member list**: `data` is typed as `FamilyMember[] | undefined`. Line 102 coalesces with `[]`: `const allMembers = (data ?? []) as FamilyMember[]`. The `isLoading` state is used to show a hairline progress indicator. No null/crash risk.

2. **No confirmation before delete**: The delete button on a family member fires `deleteMember.mutate(m.id)` on a single click (line 652) with no confirmation dialog. The backend implements a soft-delete 7-day grace window (shown in the UI), but the user receives no "are you sure?" before the member moves to the "pending removal" list. A misclick initiates a deletion.

3. **Invite duplicate handling**: The invite `onError` handler passes through whatever the server returns: `err?.response?.data?.error ?? 'Could not send invite.'`. If the backend returns a meaningful error message for duplicate invites, it will surface. But the frontend has **no proactive client-side check** against existing pending invites before submission. No crash, but a confusing API error may appear raw.

4. **`inviteSent` state not reset when closing the form**: `openForm()` sets `setInviteSent(false)` correctly. But switching tabs within the form (line 291 `onClick`) only sets `setInviteSent(false)` when the tab button is clicked — not when the close (cancel) button is used. If a user sends an invite, sees the success view, then closes and reopens the form via the top-right "add" button, `inviteSent` is reset. Safe.

---

## 5. Routing Gaps

**HIGH — two unprotected authenticated pages; one unprotected success page**

### 5a. `/loom/echo` and `/loom/read` are not wrapped in `ProtectedRoute`

```ts
// App.tsx lines 548–549
<Route path="/loom/echo" element={<LoomEcho />} />
<Route path="/loom/read" element={<LoomReadingRoom />} />
```

Both pages call real authenticated API endpoints:
- `Echo`: calls `aiApi.getPrompt()` (skipped when unauthenticated, degrades to a local prompt — acceptable).
- `ReadingRoom`: calls `memoriesApi.getAll`, `lettersApi.getAll`, `voiceApi.getAll` — all skipped when `!isAuthenticated`, rendering an empty reading room to an anonymous visitor. No crash, but a logged-out user can navigate to `/loom/read` and see the full reading room UI with no entries, with no redirect to login. This is a **confusing UX** and a potential auth expectation gap.

**Severity: HIGH for `/loom/read`** (shows authenticated-looking UI to anonymous users), **LOW for `/loom/echo`** (gracefully degrades).

### 5b. `/book-builder/success` is not protected

```ts
// App.tsx line 523
<Route path="/book-builder/success" element={<BookSuccess />} />
```

This is a post-payment success page. It lacks `ProtectedRoute`. An anonymous user who knows the URL can view it. Low security risk (no user data shown), but it is inconsistent with `/book-builder` which is protected.

### 5c. Routes that correctly 404 on direct navigation

All routes hit the catch-all `<Route path="*" element={<NotFound />} />` on direct browser navigation to unknown paths. No gap here.

---

## 6. BottomNav

**LOW — missing routes in hide list**

The hide list (`HIDE_PREFIXES`) covers: `/login`, `/signup`, `/pricing`, `/privacy`, `/terms`, `/admin`, `/onboarding`, `/loom/marketing`.

Routes that are **public** but not in the hide list, so authenticated users see the BottomNav over them:
- `/daily` — marketing/public
- `/founders-wall` — marketing/public
- `/contact`, `/for/*` scenario pages, `/showcase`, `/pricing` (IS in list), `/gift`, `/join`, `/gift/redeem`, `/gift/success`, `/inheritance/:token`, `/card/:id`, `/gift-memory/:token`, `/story/:token`, `/memory-room/:token`, `/inherit/:token`

For authenticated users visiting `/daily`, `/founders-wall`, `/contact`, or the `/for/*` scenario pages, the BottomNav renders on top. This is a cosmetic issue — the nav is meaningless on marketing pages but does not break them.

**Higher severity gap**: `/forgot-password` and `/reset-password` are wrapped in `PublicRoute` (redirects to `/loom` if authenticated), so authenticated users never reach them. No BottomNav concern there.

---

## 7. ClothShell Missing on Authenticated Pages

Pages using `Frame` (Loom 3 shell) instead of `ClothShell` have a topbar and entry counter, so they are not truly "naked." However, `Frame` and `ClothShell` are two different chrome components — pages on `Frame` don't get the `Breadcrumbs` trail that `ClothShell` provides.

Pages using `Frame` (confirmed from imports):
1. **Streaks** — `<Frame left="streaks">` — has topbar/counter/user menu, no breadcrumbs
2. **Challenges** — `<Frame>` — same
3. **InterviewMode** — uses `TapestryEdge` directly, no Frame or ClothShell at all — **fully naked topbar**
4. **TimeCapsule** — `<Frame>` — has topbar
5. **MemoryMap** — `<Frame>` — has topbar
6. **Milestones** — `<Frame>` — has topbar
7. **MemoryCards** — `<Frame>` — has topbar
8. **OnThisDay** — `<Frame>` — has topbar
9. **QandA** — `<Frame>` — has topbar
10. **Referrals** — `<Frame>` — has topbar

The audit asked about ClothShell specifically. Only `Billing`, `Family`, `Settings`, and the loom room pages use `ClothShell`. All others use `Frame`. `Frame` is a valid shell (it has the topbar, counter, UserMenu) — the issue is that `Frame` routes have no breadcrumb trail, and `InterviewMode` has no shell at all (just `TapestryEdge` + a raw `HLogo`).

**InterviewMode** is the one page that could be considered "shell-missing" — it renders its own ad-hoc topbar outside of any shell component.

---

## 8. Error Boundary

**MEDIUM — uses legacy v1 CSS classes that may not render correctly**

`ErrorBoundary.tsx` uses old Tailwind class names: `bg-void`, `bg-void-elevated`, `bg-gold`, `text-paper`, `border-gold/20`, `rounded-lg`, `rounded-full`.

The loom CSS bridge in `globals.css` maps most of these (e.g., `.loom .bg-void`, `.loom .bg-void-elevated`, `.loom .bg-gold`, `.loom .border-gold`). However:
- `rounded-lg` and `rounded-full` are **not bridged** — these are standard Tailwind border-radius utilities. If Tailwind is not configured with the `loom` class scope, they may work or may not, depending on whether the Tailwind config includes them. The ART_DIRECTION spec says "no `rounded-full` identity chips" — the ErrorBoundary uses `rounded-full` for the error icon container, which is an anti-pattern violation.
- The `handleRetry` sets `hasError: false` and re-renders the children — if the error is caused by a missing API response or broken component state, retry may immediately re-crash without clearing the underlying cause.

**The ErrorBoundary is the app's only safety net** — it is mounted once at the root in `App.tsx`. There are no nested ErrorBoundaries around individual pages or the Suspense fallbacks, so a crash in any lazy-loaded page propagates to the root boundary.

---

## Summary Table

| # | Area | Severity | Issue |
|---|---|---|---|
| 2 | Billing price | HIGH | Shows $9.99/mo for Family tier; canonical price is $6.99/mo |
| 5a | `/loom/read` unprotected | HIGH | ReadingRoom visible to anonymous users with no redirect |
| 1 | Token revocation | MEDIUM | `fetchUser` never called on startup; expired tokens keep `isAuthenticated = true` |
| 4b | Family delete | MEDIUM | Single-click delete with no confirmation dialog |
| 5b | `/book-builder/success` | MEDIUM | Success page not protected; inconsistent with sibling route |
| 8 | ErrorBoundary | MEDIUM | Uses legacy CSS classes, `rounded-full` (design anti-pattern), no nested boundaries |
| 3 | Compose char limit | LOW | No character limit enforced in UI |
| 4c | Invite duplicates | LOW | No client-side duplicate invite check; server error passed raw |
| 5a | `/loom/echo` unprotected | LOW | Gracefully degrades; acceptable |
| 6 | BottomNav hide list | LOW | Nav visible on public marketing pages for authenticated users |
| 7 | InterviewMode shell | LOW | Ad-hoc topbar, not using Frame or ClothShell |
