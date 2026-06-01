# Heirloom Frontend Build — Design Spec

**Date:** 2026-06-01  
**Source:** `loom3 2/` design canvas (60+ artboards, `Heirloom Design.html`)  
**Approach:** Design-system faithful + functionally complete  
**Strategy:** Foundation wave → Wave 1 → Wave 2 → Wave 3

---

## 1. Goals

Convert the full Heirloom design canvas (`Downloads/loom3 2/`) into the live deployed app (`cloudflare/frontend/`). Every screen must:

- Apply the correct design tokens (bone/ink/warm, Source Serif 4, Inter, JetBrains Mono)
- Match the design canvas layout structure and visual hierarchy
- Wire real data (auth, API) where the mockup used static props — stubs are acceptable where the API doesn't exist yet
- Pass `npm run build` (tsc + vite) after every wave

This is **not** a pixel-perfect port — it is a faithful translation that engineers real UX where the mockup has placeholders.

---

## 2. Design reference files

| File | Contents |
|---|---|
| `Downloads/loom3 2/Heirloom Design.html` | Design canvas viewer (open in browser) |
| `Downloads/loom3 2/heirloom-styles.css` | Reference CSS with all `hl-*` primitives |
| `Downloads/loom3 2/heirloom-tapestry.jsx` | Tapestry canvas component (already ported) |
| `Downloads/loom3 2/heirloom-landing.jsx` | Landing + adoption screens |
| `Downloads/loom3 2/heirloom-auth.jsx` | Login · Signup · Settings · Billing · Founder · Legal |
| `Downloads/loom3 2/heirloom-product.jsx` | Tapestry home · Composer · Wall · Unlock · Inherit |
| `Downloads/loom3 2/heirloom-detail.jsx` | Wall detail · Book mode · Bloodline |
| `Downloads/loom3 2/heirloom-adoption.jsx` | Today · Onboarding · Invite · Pricing · Showcase |
| `Downloads/loom3 2/heirloom-product-index.jsx` | Threads · Inbox · Letters · Memories · Family · Q&A · Listener |
| `Downloads/loom3 2/heirloom-mobile.jsx` | 5 mobile screens |
| `Downloads/loom3 2/heirloom-viral.jsx` | Wrapped · InheritanceCard · DailySentence · FoundersWall |
| `Downloads/loom3 2/heirloom-pwa.jsx` | PWA install · splash · 10 role-keyed homes |
| `Downloads/loom3 2/heirloom-admin.jsx` | Admin: Users · Tickets · Incidents · Audit |

---

## 3. Cross-cutting constraints

These apply to **every** screen in every wave. A screen that violates any of these fails review.

| Constraint | Rule |
|---|---|
| Colors | `--bone`, `--ink`, `--warm` and their alpha variants only. No arbitrary hex. Natural-dye palette inside cloth only. |
| Typography | Source Serif 4 (display + prose), Inter (UI labels/meta), JetBrains Mono (archival/metadata). No 4th typeface. |
| Radius | 0px default. 2px on inputs. Never >4px. No `rounded-lg`, no card radius. |
| Borders | 1px hairlines only (`var(--rule)` or `var(--parchment-rule)`). No 2px borders. |
| Icons | None. `∞` is the only glyph. No Lucide, Heroicons, FontAwesome, or any icon library. |
| Motion | Easing: `cubic-bezier(0.16,1,0.3,1)`. Durations: 180ms / 360ms / 720ms / 1400ms only. |
| Feedback | No toasts — inline status text only. No spinners — hairline `<progress>` bar only. |
| Tapestry | `TapestryCanvas` must render with `animate={true}` (default) wherever the cloth appears. Never `animate={false}` on visible cloth. |
| Negative space | 60–70% empty. No dense card grids, no filled backgrounds on content areas. |
| Anti-patterns (§2.6) | No glassmorphism · no gradient meshes · no `translateY` hover floats · no decorative emoji · no avatar circles · no literal metaphor objects (fire/vault/key/quill) |

---

## 4. Wave 0 — Foundation audit & hardening

**Goal:** One pass that all subsequent waves inherit. No new pages, only infrastructure.

### 4.1 globals.css gap-fill

Compare `cloudflare/frontend/src/styles/globals.css` against `Downloads/loom3 2/heirloom-styles.css` and resolve:

- `hl-tight` is missing `letter-spacing: -0.022em` in the live app (reference has it)
- Add `hl-input` class: 0px radius, 1px `var(--parchment-rule)` border, `var(--parchment)` background, `var(--parchment-ink)` text
- Add `hl-tag` and `hl-chip` primitives (mono, 10px, uppercased, used in Memories/Admin/Q&A)
- Add CSS custom properties for motion: `--ease: cubic-bezier(0.16,1,0.3,1)`, `--dur-fast: 180ms`, `--dur-mid: 360ms`, `--dur-slow: 720ms`, `--dur-ceremony: 1400ms`
- Audit `hl-btn.text` against reference (reference: `color: var(--warm); padding: 0; border-radius: 0`)

### 4.2 AppFrame / Frame shell audit

File: `cloudflare/frontend/src/loom/components/AppFrame.tsx` + `Frame.tsx`

- Confirm `BottomNav` has no icon library imports — items are text/mono labels only
- Confirm `TapeEdge` (8px animated cloth band) is present and `animate={true}`
- Confirm `HLogo` renders `∞` only, no icon library
- Add optional `role` prop to `AppFrame` — gates which nav items are visible per role (needed by Wave 3 PWA homes)
- Confirm `Unlock` ceremony uses 720ms duration with `var(--ease)` easing

### 4.3 Routing — App.tsx additions

Add lazy routes for all new pages before Wave 1 lands:

| Route | Component | Auth |
|---|---|---|
| `/` (post-auth) | `loom/pages/Today` | required — swap from current Tapestry default |
| `/tapestry` | existing Tapestry/Loom | required |
| `/today` | `loom/pages/Today` | required |
| `/memories` | `pages/Memories` | required |
| `/threads` | `pages/ThreadsIndex` | required |
| `/qa` | `pages/QA` | required |
| `/pricing` | `pages/Pricing` | public |
| `/showcase` | `pages/Showcase` | public |
| `/onboarding` | `pages/Onboarding` | required (new users) |
| `/invite` | `pages/InviteCard` | required |
| `/wrapped` | `pages/Wrapped` | required |
| `/inheritance/:token` | `pages/InheritanceCard` | public, token-gated |
| `/pwa` | `loom/pages/PwaHome` | role-keyed |

### 4.4 Shared hooks

Create in `cloudflare/frontend/src/hooks/`:

- `useRole()` — returns current user's role string: `'visitor' | 'trial' | 'family' | 'founder' | 'author' | 'reader' | 'successor' | 'future_member' | 'legacy' | 'admin'`. Derives from `useAuthStore` + subscription status.
- `useTapestryEntries()` — fetches + memoizes the current user's tapestry entries as `CanvasEntry[]`. Shared by Today, Tapestry home, PWA homes.
- `useListener()` — ambient Listener/Echo state (current prompt string). Shared by Today and Echo page.

---

## 5. Wave 1 — High-traffic user-facing surfaces

**Prerequisite:** Wave 0 complete and `npm run build` green.  
**Reference files:** `heirloom-adoption.jsx`, `heirloom-auth.jsx`, `heirloom-landing.jsx`

### 5.1 Today — new default home
**File:** `cloudflare/frontend/src/loom/pages/Today.tsx` (new)  
**Reference:** `TodayHome` in `heirloom-adoption.jsx`

- 8pm daily prompt (large serif, prominent)
- Animated `TapestryCanvas` edge band at bottom (8px, `kind="edge"`)
- Mini family strip: last 3 contributors, no avatar circles — initials in mono
- Listener ambient line (one typographic sentence from `useListener()`)
- "Write now" → opens Composer
- This page becomes the default route `/` post-auth (routing change in Wave 0)

### 5.2 Adoption landing redesign
**File:** `cloudflare/frontend/src/loom/pages/Marketing.tsx` (rebuild)  
**Reference:** `LandingAdoption` in `heirloom-adoption.jsx`

- Daily hook lead above the fold (large serif headline)
- Free tier CTA primary, "See the cloth →" secondary
- Full-width animated `TapestryCanvas` specimen cloth (hero, `kind="specimen"`, animate)
- Five pillars grid below
- Pricing preview (links to `/pricing`)
- MktTopbar: wordmark + mono nav links (no icons)

### 5.3 Pricing page
**File:** `cloudflare/frontend/src/pages/Pricing.tsx` (new)  
**Reference:** `PricingAdoption` in `heirloom-adoption.jsx`

- Three tiers: Free · Family · Founder
- Hairline table — mono labels, no icon checkmarks
- Warm CTA button on recommended tier only
- Links to `/onboarding` (free) or Stripe checkout (Family/Founder)

### 5.4 Public showcase
**File:** `cloudflare/frontend/src/pages/Showcase.tsx` (new)  
**Reference:** `PublicShowcase` in `heirloom-adoption.jsx`

- Public, no auth required
- Animated cloth of opt-in families (read-only `TapestryCanvas`)
- Mono labels: family name · year started · entry count
- CTA: "Start your thread"

### 5.5 Onboarding
**File:** `cloudflare/frontend/src/pages/Onboarding.tsx` (replaces OnboardingWizardPage.tsx)  
**Reference:** `Onboarding` in `heirloom-adoption.jsx`

- 3 steps, 90-second target
- Hairline progress bar (not a spinner, not dots)
- Step 1: Name your thread · Step 2: First entry · Step 3: Invite one family member
- Redirects to Today on completion

### 5.6 Invite card
**File:** `cloudflare/frontend/src/pages/InviteCard.tsx` (new)  
**Reference:** `InviteCard` in `heirloom-adoption.jsx`

- Printable/shareable letter format
- Print CSS: hides chrome, preserves letter layout
- Personalised with sender name + family thread name

### 5.7 Auth refresh — Login · Signup · ForgotPassword
**Files:** `pages/Login.tsx`, `pages/Signup.tsx` (add 3-step), `pages/ForgotPassword.tsx`  
**Reference:** `Login`, `Signup` in `heirloom-auth.jsx`

- Apply `hl-input` class to all form inputs
- Remove any icon library imports
- Signup: expand to 3-step form matching design (name → email+pw → invite)
- 0px radius on all elements; no card-with-shadow layouts

### 5.8 Settings · Billing · Privacy · Terms
**Files:** `pages/Billing.tsx`, `pages/Settings.tsx`, `pages/Contact.tsx` (Privacy/Terms are static routes in App.tsx)  
**Reference:** `Settings`, `Billing`, `Privacy`, `Terms` in `heirloom-auth.jsx`

- Token refresh: replace any arbitrary colors with `--parchment-*` / `--ink`
- Hairline `<hr class="hl-rule parchment">` as section dividers
- Remove any radius >2px, any card float patterns
- Billing: tier badge in mono, no icon indicators

### 5.9 Founder · FounderWelcome
**Files:** `pages/Founder.tsx`, `pages/FounderWelcome.tsx`  
**Reference:** `Founder`, `FounderWelcome` in `heirloom-auth.jsx`

- Founder pitch: full-width animated `TapestryCanvas` specimen cloth in hero
- FounderWelcome: warm ceremony tone, 720ms entrance animation, pledge number in mono

---

## 6. Wave 2 — Core product screens

**Prerequisite:** Wave 1 complete and `npm run build` green.  
**Reference files:** `heirloom-product.jsx`, `heirloom-detail.jsx`, `heirloom-product-index.jsx`

### 6.1 Tapestry home — loom/ refresh
**Files:** `loom/pages/` — `Loom.tsx` / `LoomShell.tsx` / `TapestryCanvas.tsx`  
**Reference:** `TapestryHomeCanonical`, `TapestryHomePull`, `TapestryHomeCentury` in `heirloom-product.jsx`

- Three views via `ViewToggle`: Canonical cloth (horizontal pan) · Pull mode (vertical paging) · Century compressed
- Animated `TapestryCanvas` on all three (`animate={true}`)
- Append-only counter always visible in topbar (invariant B)
- `EmptyThread` state: warp only, no weft — "Begin your thread" prompt

### 6.2 Composer — 3 modes
**File:** `loom/pages/Composer.tsx`  
**Reference:** `ComposerPaper`, `ComposerLetter`, `ComposerSpeak` in `heirloom-product.jsx`

- Mode toggle: Paper · Letter · Speak
- Paper: full-bleed serif editor on cloth background
- Letter: sealed format — recipient + unlock date fields
- Speak: large type, voice-first layout (no waveform icon — text indicator only)

### 6.3 Wall / ReadingRoom
**File:** `loom/pages/ReadingRoom.tsx`  
**Reference:** `Wall`, `WallBook` in `heirloom-detail.jsx`

- Two modes: Wall (canonical) · Book (for descendants)
- Chronological reader, hairline entry separators
- No avatar circles — author name in mono only
- Book mode: wider margins, larger serif body text

### 6.4 Memories mosaic
**File:** `cloudflare/frontend/src/pages/Memories.tsx` (new)  
**Reference:** `Memories` in `heirloom-product-index.jsx`

- Masonry layout — variable card heights
- Entry type distinguished by natural-dye color accent (1px left border only)
- No avatar circles, no card radius
- Entry count label in mono topbar
- Existing `MemoryRoom.tsx`, `MemoryCards.tsx`, `MemoryMap.tsx`: update their routes in App.tsx to redirect to `/memories`. Do not delete the files until Wave 2 ships and is verified live.

### 6.5 Q&A — RAG + citations
**File:** `cloudflare/frontend/src/pages/QA.tsx` (new)  
**Reference:** `QandA` in `heirloom-product-index.jsx`

- Ask input (serif, full-width, 0px radius)
- Answer renders in serif body with inline citations (mono, entry date)
- Cites specific thread entries — links to ReadingRoom at that entry
- Listener-adjacent: ambient phrasing, not chatbot chrome

### 6.6 Threads index
**File:** `cloudflare/frontend/src/pages/ThreadsIndex.tsx` (new)  
**Reference:** `ThreadsIndex` in `heirloom-product-index.jsx`

- List of all threads the user is part of
- Each row: thread name (serif) · member count (mono) · last entry date (mono)
- Hairline row separators, no cards

### 6.7 Inbox · Letters — token refresh
**Files:** `pages/Inbox.tsx`, `pages/Letters.tsx`  
**Reference:** `Inbox`, `Letters` in `heirloom-product-index.jsx`

- Apply token refresh (hl-* classes, hairlines, 0px radius)
- Inbox: time-locked entry indicator in mono (unlock date, not an icon)

### 6.8 Family index · Member profile · Bloodline
**Files:** `pages/Family.tsx`, `pages/PersonPage.tsx` (update in-place — no rename needed)  
**Reference:** `FamilyIndex`, `MemberProfile`, `Bloodline` in `heirloom-product-index.jsx` and `heirloom-detail.jsx`

- Family index: bloodline as typography — names + connecting hairlines, no tree graphic library
- Member profile (`PersonPage.tsx`): no avatar circle — name initial in a hairline square or nothing
- Bloodline view: family tree rendered as pure typography with SVG hairline edges (no third-party tree library)
- Note: `Bloodline` artboard is in `heirloom-detail.jsx` — belongs in this section as it's the full family tree surface

**Mobile screens note:** The 5 mobile screens in `heirloom-mobile.jsx` (MobileToday, MobileSpeak, MobileTapestry, MobileInherit, MobileNotif) are responsive variants, not separate routes. They are satisfied by: responsive CSS in Today.tsx (MobileToday), Composer Speak mode (MobileSpeak), the tapestry loom at mobile viewport (MobileTapestry), Inherit.tsx (MobileInherit), and the PWA notification surface (MobileNotif — handled by the existing push notification stub).

### 6.9 Listener / Echo
**File:** `loom/pages/Echo.tsx`  
**Reference:** `ListenerSpec` in `heirloom-product-index.jsx`

- One typographic line, ambient — not a chatbot interface
- Updates periodically from `useListener()`
- Position: bottom of screen above tape edge, centered, bone-dim color

---

## 7. Wave 3 — PWA role homes · shareable moments · admin console

**Prerequisite:** Wave 2 complete and `npm run build` green.  
**Reference files:** `heirloom-pwa.jsx`, `heirloom-viral.jsx`, `heirloom-admin.jsx`

### 7.1 PWA role-keyed homes
**File:** `cloudflare/frontend/src/loom/pages/PwaHome.tsx` (new)  
**Reference:** `PwaVisitor`, `PwaTrial`, `PwaFamily`, etc. in `heirloom-pwa.jsx`

Single component with `role` prop from `useRole()`. 10 variants:

| Role | Key difference |
|---|---|
| `visitor` | Read-only preview cloth · "Start your thread" CTA |
| `trial` | Day counter (e.g. "day 6 of 30") · upgrade nudge. Trial is 30 days (the design canvas label "day 6 of 14" is outdated — the live app shipped 30-day trial). |
| `family` | Full home — today prompt + cloth + family strip |
| `founder` | Same as family + pledge number in mono |
| `author` | Contributing to another's thread — scoped view |
| `reader` | Age-gated read-only |
| `successor` | Post-inheritance trigger — special ceremony state |
| `future_member` | Placeholder — "A thread is being prepared for you" |
| `legacy` | Deceased author — verify + archive access only |
| `admin` | Support tier — user lookup, no entry content |

PWA install, splash, springboard, offline screens per design (`PwaInstallBanner`, `PwaSplash`, `PwaSpringboard`, `PwaOffline` in `heirloom-pwa.jsx`).

### 7.2 Heirloom Wrapped
**File:** `cloudflare/frontend/src/pages/Wrapped.tsx` (new)  
**Reference:** `Wrapped` in `heirloom-viral.jsx`

- Annual summary: entry count · active months · top contributors (no avatars)
- Shareable — generates a static OG image card
- Triggered once/year (no route guard needed — just shows current year data)

### 7.3 Inheritance Card
**File:** `cloudflare/frontend/src/pages/InheritanceCard.tsx` (new)  
**Reference:** `InheritanceCard` in `heirloom-viral.jsx`

- Token-gated: `/inheritance/:token`
- No account required for recipient
- Shows thread name · author · entry count · unlock ceremony button (720ms)
- Shareable card for the "inheritance moment"

### 7.4 Daily Sentence refresh
**File:** `cloudflare/frontend/src/pages/DailySentence.tsx` (update)  
**Reference:** `DailySentence` in `heirloom-viral.jsx`

- One sentence from a thread, syndicated
- Large serif display, bone-on-ink, thread attribution in mono
- Token refresh — remove any icon imports

### 7.5 Founders' Wall refresh
**File:** `cloudflare/frontend/src/pages/FoundersWall.tsx` (update)  
**Reference:** `FoundersWall` in `heirloom-viral.jsx`

- Pledge list: name · number · date · optional note
- Mono throughout, hairline row separators
- No avatar circles — pledge number is the identifier

### 7.6 Admin console — Tickets · Incidents · Audit
**File:** `cloudflare/frontend/src/pages/AdminDashboard.tsx` (extend)  
**Reference:** `AdminUsers`, `AdminTickets`, `AdminIncidents`, `AdminAudit` in `heirloom-admin.jsx`

- Add tab navigation (mono labels, hairline underline active state): Users · Tickets · Incidents · Audit
- Tickets: support queue — thread ID, status, priority, no entry content
- Incidents: kill-switch toggles + pinned notices (warm accent for active incidents)
- Audit: forensic log — timestamp · actor · action · resource ID (zero-knowledge: no entry content)

---

## 8. Testing gate (per wave)

Before marking a wave complete:

1. `cd cloudflare/frontend && npm run build` — must exit 0 (tsc + vite)
2. `npm run dev` — spot-check animated cloth is visible and animating on all tapestry screens
3. No new icon-library imports (`grep -r "lucide\|heroicons\|fontawesome\|react-icons" src/`)
4. No arbitrary hex colors outside globals.css (`grep -r "#[0-9a-fA-F]\{3,6\}" src/` — review each hit)
5. Visual smoke of the live site after deploy (check production for CSP inline-script issues)

---

## 9. Out of scope

- Backend API changes (new endpoints for Q&A/RAG, Wrapped generation, etc.) — stub data is acceptable
- Marketing automation (`marketing/` directory) — untouched
- `frontend/` (old non-deployed tree) — untouched
- Native mobile (`mobile/`) — untouched
- New Cloudflare Worker routes — stubs only where needed
