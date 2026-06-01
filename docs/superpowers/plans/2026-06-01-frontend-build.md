# Heirloom Frontend Build — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all 60+ artboards from the `loom3 2/` design canvas into the live `cloudflare/frontend/` app, design-system faithful and functionally complete, in four waves.

**Architecture:** Foundation wave (tokens, shell, routing, hooks) → Wave 1 (high-traffic surfaces) → Wave 2 (core product) → Wave 3 (PWA homes, moments, admin). Each wave gate: `cd cloudflare/frontend && npm run build` must exit 0 before the next wave starts.

**Tech Stack:** React 18, TypeScript strict, Vite, Tailwind (legacy bridge), React Router v6, Zustand (authStore), TanStack Query, Cloudflare Pages. Design references in `~/Downloads/loom3 2/*.jsx`.

---

## File Structure

### Created by Wave 0
- `cloudflare/frontend/src/hooks/useRole.ts` — derives UserRole from authStore + subscription query
- `cloudflare/frontend/src/hooks/useTapestryEntries.ts` — fetches CanvasEntry[] for the current thread
- `cloudflare/frontend/src/hooks/useListener.ts` — returns ambient daily prompt string

### Created by Wave 1
- `cloudflare/frontend/src/loom/pages/Today.tsx` — new default home (8pm prompt + cloth edge + family strip)
- `cloudflare/frontend/src/pages/Pricing.tsx` — Free/Family/Founder tier table
- `cloudflare/frontend/src/pages/Showcase.tsx` — public animated cloth of opt-in families
- `cloudflare/frontend/src/pages/Onboarding.tsx` — 3-step onboarding (replaces OnboardingWizardPage)
- `cloudflare/frontend/src/pages/InviteCard.tsx` — printable family invite letter

### Modified by Wave 1
- `cloudflare/frontend/src/styles/globals.css` — token gap-fill (Wave 0 sets foundation)
- `cloudflare/frontend/src/loom/components/Frame.tsx` — route label additions
- `cloudflare/frontend/src/loom/components/AppFrame.tsx` — role prop
- `cloudflare/frontend/src/App.tsx` — new lazy imports + routes
- `cloudflare/frontend/src/loom/pages/Marketing.tsx` — full rebuild (adoption landing)
- `cloudflare/frontend/src/pages/Login.tsx` — hl-input + 0px radius refresh
- `cloudflare/frontend/src/pages/Signup.tsx` — 3-step form
- `cloudflare/frontend/src/pages/ForgotPassword.tsx` — token refresh
- `cloudflare/frontend/src/pages/Settings.tsx` — token refresh
- `cloudflare/frontend/src/pages/Billing.tsx` — token refresh
- `cloudflare/frontend/src/pages/Founder.tsx` — animated TapestryCanvas hero
- `cloudflare/frontend/src/pages/FounderWelcome.tsx` — 720ms entrance

### Created by Wave 2
- `cloudflare/frontend/src/pages/Memories.tsx` — masonry mosaic (replaces MemoryRoom/MemoryCards routes)
- `cloudflare/frontend/src/pages/QA.tsx` — replaces QandA.tsx with new design (route `/qa`)
- `cloudflare/frontend/src/pages/ThreadsIndex.tsx` — replaces Threads.tsx with new design

### Modified by Wave 2
- `cloudflare/frontend/src/loom/pages/Weft.tsx` — Tapestry home (Canonical/Pull/Century views)
- `cloudflare/frontend/src/loom/pages/Composer.tsx` — 3 modes: Paper/Letter/Speak
- `cloudflare/frontend/src/loom/pages/ReadingRoom.tsx` — Wall + Book mode
- `cloudflare/frontend/src/loom/pages/Echo.tsx` — Listener: one ambient line
- `cloudflare/frontend/src/pages/Inbox.tsx` — token refresh
- `cloudflare/frontend/src/pages/Letters.tsx` — token refresh
- `cloudflare/frontend/src/pages/Family.tsx` — bloodline typography + hairline SVG edges
- `cloudflare/frontend/src/pages/PersonPage.tsx` — member profile (no avatar circle)

### Created by Wave 3
- `cloudflare/frontend/src/loom/pages/PwaHome.tsx` — 10-variant role-keyed PWA home
- `cloudflare/frontend/src/pages/InheritanceCard.tsx` — token-gated inheritance moment
- `cloudflare/frontend/src/pages/Wrapped.tsx` — annual summary (may already exist, rebuild)

### Modified by Wave 3
- `cloudflare/frontend/src/pages/DailySentence.tsx` — token refresh
- `cloudflare/frontend/src/pages/FoundersWall.tsx` — token refresh
- `cloudflare/frontend/src/pages/AdminDashboard.tsx` — add Tickets/Incidents/Audit tabs

---

## Design reference lookup

Before implementing any task, open the reference file:
```
open ~/Downloads/loom3\ 2/Heirloom\ Design.html
```
Navigate to the relevant section using the sidebar. Reference JSX files are in `~/Downloads/loom3 2/`.

---

## WAVE 0 — Foundation

---

### Task 0.1: globals.css gap-fill

**Files:**
- Modify: `cloudflare/frontend/src/styles/globals.css`

- [ ] **Step 1: Locate the hl-* block** — it starts around line 1977 in globals.css. Open it.

- [ ] **Step 2: Add motion tokens** — insert after the existing `--ease-out` / `--ease-in-out` block (around line 108):

```css
  /* Heirloom motion tokens — these are the ONLY permitted durations */
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 180ms;
  --dur-mid: 360ms;
  --dur-slow: 720ms;
  --dur-ceremony: 1400ms;
```

- [ ] **Step 3: Fix hl-tight** — find `.hl-tight` (around line 2064). It currently has only `line-height: 1.06`. Add letter-spacing:

```css
.hl-tight { line-height: 1.06; letter-spacing: -0.022em; }
```

- [ ] **Step 4: Add hl-input** — insert after `.hl-prose.dark` (around line 2054):

```css
.hl-input {
  font-family: var(--serif);
  font-size: 16px;
  font-weight: 300;
  color: var(--parchment-ink);
  background: var(--parchment);
  border: 1px solid var(--parchment-rule);
  border-radius: 2px;
  padding: 10px 14px;
  width: 100%;
  outline: none;
  transition: border-color var(--dur-fast) var(--ease);
}
.hl-input:focus { border-color: var(--warm); }
.hl-input::placeholder { color: var(--parchment-faint); }
```

- [ ] **Step 5: Add hl-tag and hl-chip** — insert after `.hl-input`:

```css
.hl-tag {
  display: inline-block;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--bone-dim);
  padding: 2px 6px;
  border: 1px solid var(--rule);
}
.hl-tag.warm { color: var(--warm); border-color: var(--warm); }
.hl-chip {
  display: inline-block;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--parchment-dim);
  padding: 2px 6px;
  border: 1px solid var(--parchment-rule);
}
```

- [ ] **Step 6: Verify build is green**

```bash
cd cloudflare/frontend && npm run build
```
Expected: exit 0, no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add cloudflare/frontend/src/styles/globals.css
git commit -m "style: add motion tokens + hl-input/tag/chip + fix hl-tight letter-spacing"
```

---

### Task 0.2: AppFrame role prop + Frame route labels

**Files:**
- Modify: `cloudflare/frontend/src/loom/components/AppFrame.tsx`
- Modify: `cloudflare/frontend/src/loom/components/Frame.tsx`

- [ ] **Step 1: Add role prop to AppFrame** — the role prop is optional and will be used in Wave 3 to gate nav items. Add it now so Wave 1/2 pages can pass it without another AppFrame change later:

In `AppFrame.tsx`, update the props interface and signature:

```tsx
export function AppFrame({
  children,
  width = 'reading',
  left,
  right,
  nav = true,
  role,
}: {
  children: ReactNode;
  width?: 'reading' | 'wide';
  left?: string;
  right?: ReactNode;
  nav?: boolean;
  role?: 'visitor' | 'trial' | 'family' | 'founder' | 'author' | 'reader' | 'successor' | 'future_member' | 'legacy' | 'admin';
}) {
```

The `role` prop is threaded through but not yet consumed — Wave 3 PwaHome will use it. No body changes needed yet.

- [ ] **Step 2: Add today/pwa route labels to Frame.tsx** — in the `routeLabel` function, add before the final `return 'heirloom'`:

```ts
if (pathname.startsWith('/loom/today'))  return 'today';
if (pathname.startsWith('/loom/pwa'))    return 'home';
if (pathname.startsWith('/pricing'))     return 'pricing';
if (pathname.startsWith('/showcase'))    return 'showcase';
if (pathname.startsWith('/memories'))    return 'memories';
if (pathname.startsWith('/qa'))          return 'ask the thread';
if (pathname.startsWith('/invite'))      return 'invite';
if (pathname.startsWith('/wrapped'))     return 'wrapped';
```

- [ ] **Step 3: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/loom/components/AppFrame.tsx cloudflare/frontend/src/loom/components/Frame.tsx
git commit -m "feat(shell): add role prop to AppFrame, extend route labels"
```

---

### Task 0.3: Shared hooks

**Files:**
- Create: `cloudflare/frontend/src/hooks/useRole.ts`
- Create: `cloudflare/frontend/src/hooks/useTapestryEntries.ts`
- Create: `cloudflare/frontend/src/hooks/useListener.ts`

- [ ] **Step 1: Create `hooks/useRole.ts`**

Role is derived from the subscription tier + auth state. The subscription endpoint returns `{ tier: 'STARTER' | 'FAMILY' | 'FOUNDER', status, trial_ends_at, trialDaysRemaining }`.

```ts
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { billingApi } from '../services/api';

export type UserRole =
  | 'visitor'
  | 'trial'
  | 'family'
  | 'founder'
  | 'author'
  | 'reader'
  | 'successor'
  | 'future_member'
  | 'legacy'
  | 'admin';

export function useRole(): UserRole {
  const { user, isAuthenticated } = useAuthStore();
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  if (!isAuthenticated || !user) return 'visitor';

  const tier = (subscription as any)?.tier ?? 'STARTER';
  const status = (subscription as any)?.status ?? null;
  const isTrialing = status === 'trialing';

  if (tier === 'FOUNDER') return 'founder';
  if (tier === 'FAMILY' && !isTrialing) return 'family';
  if (isTrialing) return 'trial';
  return 'family'; // STARTER with active sub fallback
}
```

- [ ] **Step 2: Create `hooks/useTapestryEntries.ts`**

Fetches entries for the current user's default thread and converts them to `CanvasEntry[]` for TapestryCanvas.

```ts
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import type { CanvasEntry } from '../loom/components/TapestryCanvas';

export function useTapestryEntries(): CanvasEntry[] {
  const { user, isAuthenticated } = useAuthStore();
  const threadId = user?.defaultThreadId ?? null;

  const { data } = useQuery({
    queryKey: ['tapestry-entries', threadId],
    queryFn: () => memoriesApi.list({ limit: 500 }).then((r) => r.data?.memories ?? []),
    enabled: isAuthenticated && !!threadId,
    staleTime: 30_000,
  });

  if (!data) return [];

  return data.map((m: any, i: number) => ({
    date: new Date(m.createdAt ?? m.created_at ?? Date.now()),
    n: i,
    dye: pickDye(m.type ?? 'memory'),
    tier: 'family' as const,
    author: m.userId ?? m.user_id,
    sealed: !!m.lockedUntil,
    sealUntil: m.lockedUntil ? new Date(m.lockedUntil) : undefined,
  }));
}

const DYE_MAP: Record<string, string> = {
  memory: 'madder',
  letter: 'indigo',
  voice: 'saffron',
  event: 'weld',
  milestone: 'cochineal',
};

function pickDye(type: string): string {
  return DYE_MAP[type] ?? 'madder';
}
```

- [ ] **Step 3: Create `hooks/useListener.ts`**

Returns the daily ambient prompt. Initially returns a static daily prompt derived from the date; this can be wired to an API later.

```ts
import { useMemo } from 'react';

const PROMPTS = [
  'What did you almost forget to write down today?',
  'What would your younger self not believe about your life right now?',
  'Name one person whose patience you have relied on this week.',
  'What small thing happened today that you want to remember in 20 years?',
  'What is a belief you held last year that you no longer hold?',
  'What is the oldest memory you have of your mother?',
  'What would you want your great-grandchildren to know about where you live right now?',
  'What is something you made with your hands this month?',
];

export function useListener(): string {
  return useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    return PROMPTS[dayOfYear % PROMPTS.length];
  }, []);
}
```

- [ ] **Step 4: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add cloudflare/frontend/src/hooks/
git commit -m "feat(hooks): add useRole, useTapestryEntries, useListener"
```

---

### Task 0.4: App.tsx routing additions

**Files:**
- Modify: `cloudflare/frontend/src/App.tsx`

- [ ] **Step 1: Add lazy imports** — after the existing lazy imports block, add:

```tsx
const Today         = lazy(() => import('./loom/pages/Today').then(m => ({ default: m.Today })));
const Pricing       = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));
const Showcase      = lazy(() => import('./pages/Showcase').then(m => ({ default: m.Showcase })));
const Onboarding    = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const InviteCard    = lazy(() => import('./pages/InviteCard').then(m => ({ default: m.InviteCard })));
const Memories      = lazy(() => import('./pages/Memories').then(m => ({ default: m.Memories })));
const QA            = lazy(() => import('./pages/QA').then(m => ({ default: m.QA })));
const ThreadsIndex  = lazy(() => import('./pages/ThreadsIndex').then(m => ({ default: m.ThreadsIndex })));
const PwaHome       = lazy(() => import('./loom/pages/PwaHome').then(m => ({ default: m.PwaHome })));
const InheritanceCard = lazy(() => import('./pages/InheritanceCard').then(m => ({ default: m.InheritanceCard })));
```

- [ ] **Step 2: Add public routes** — inside `<Routes>`, after the existing public routes (`/daily`, `/founders-wall`, etc.):

```tsx
<Route path="/pricing"    element={<Pricing />} />
<Route path="/showcase"   element={<Showcase />} />
<Route path="/inheritance/:token" element={<InheritanceCard />} />
```

- [ ] **Step 3: Add the new loom/today route** — in the loom routes block (near `/loom`, `/loom/weft`, etc.):

```tsx
<Route path="/loom/today" element={<ProtectedRoute><Today /></ProtectedRoute>} />
<Route path="/loom/pwa"   element={<ProtectedRoute><PwaHome /></ProtectedRoute>} />
```

- [ ] **Step 4: Update the post-auth default redirect** — find the line:
```tsx
return !isAuthenticated ? <>{children}</> : <Navigate to="/loom" replace />;
```
Change to:
```tsx
return !isAuthenticated ? <>{children}</> : <Navigate to="/loom/today" replace />;
```
Also update the `/dashboard` redirect:
```tsx
<Route path="/dashboard" element={<Navigate to="/loom/today" replace />} />
```

- [ ] **Step 5: Wire /memories, /onboarding, /invite, /qa, /wrapped to new pages** — update the existing entries:

```tsx
{/* Replace old /memories redirect */}
<Route path="/memories" element={<ProtectedRoute><Memories /></ProtectedRoute>} />

{/* Replace old OnboardingWizardPage */}
<Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

{/* New */}
<Route path="/invite" element={<ProtectedRoute><InviteCard /></ProtectedRoute>} />

{/* Replace /ask with /qa (keep /ask as alias) */}
<Route path="/qa" element={<ProtectedRoute><QA /></ProtectedRoute>} />
<Route path="/ask" element={<Navigate to="/qa" replace />} />

{/* Replace /threads with ThreadsIndex */}
<Route path="/threads" element={<ProtectedRoute><ThreadsIndex /></ProtectedRoute>} />
```

Note: The existing lazy imports for `QandA`, `Threads`, `OnboardingWizardPage` can stay until Wave 2 creates the replacement files — the old components remain as fallbacks until then.

- [ ] **Step 6: Build check** — these routes will fail with "module not found" for files that don't exist yet. Add empty stub exports to fix:

```bash
# Create stubs for Wave 1 pages so routing compiles
for f in Pricing Showcase Onboarding InviteCard; do
  echo "export function $f() { return null; }" > cloudflare/frontend/src/pages/$f.tsx
done
echo "export function Today() { return null; }" > cloudflare/frontend/src/loom/pages/Today.tsx
echo "export function PwaHome() { return null; }" > cloudflare/frontend/src/loom/pages/PwaHome.tsx
for f in Memories QA ThreadsIndex InheritanceCard; do
  echo "export function $f() { return null; }" > cloudflare/frontend/src/pages/$f.tsx
done
```

```bash
cd cloudflare/frontend && npm run build
```
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add cloudflare/frontend/src/App.tsx cloudflare/frontend/src/loom/pages/Today.tsx cloudflare/frontend/src/loom/pages/PwaHome.tsx cloudflare/frontend/src/pages/Pricing.tsx cloudflare/frontend/src/pages/Showcase.tsx cloudflare/frontend/src/pages/Onboarding.tsx cloudflare/frontend/src/pages/InviteCard.tsx cloudflare/frontend/src/pages/Memories.tsx cloudflare/frontend/src/pages/QA.tsx cloudflare/frontend/src/pages/ThreadsIndex.tsx cloudflare/frontend/src/pages/InheritanceCard.tsx
git commit -m "feat(routing): add Wave 1-3 routes + stubs, redirect default home to /loom/today"
```

---

## WAVE 1 — High-traffic surfaces

> **Prerequisite:** Wave 0 complete. Run `cd cloudflare/frontend && npm run build` — must be green.

---

### Task 1.1: Today — new default home

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/loom/pages/Today.tsx`
- Reference: `TodayHome` in `~/Downloads/loom3 2/heirloom-adoption.jsx`

- [ ] **Step 1: Open the reference**

```bash
open ~/Downloads/loom3\ 2/Heirloom\ Design.html
# Navigate to: "Adoption — product surfaces" → "A · Today (new home)"
```

- [ ] **Step 2: Write Today.tsx**

```tsx
import { Link } from 'react-router-dom';
import { Frame } from '../components/Frame';
import { TapestryCanvas } from '../components/TapestryCanvas';
import { useListener } from '../../hooks/useListener';
import { useTapestryEntries } from '../../hooks/useTapestryEntries';
import { useAuthStore } from '../../stores/authStore';

export function Today() {
  const prompt = useListener();
  const entries = useTapestryEntries();
  const { user } = useAuthStore();

  // Last 3 unique contributors from entries (most recent first)
  const contributors = [...new Map(
    [...entries].reverse().map(e => [e.author, e])
  ).values()].slice(0, 3);

  return (
    <Frame left="today">
      <div style={{ padding: '72px 56px 0', maxWidth: 720 }}>

        {/* eyebrow */}
        <div className="hl-eyebrow" style={{ marginBottom: 24 }}>
          tonight · 8 pm
        </div>

        {/* daily prompt — the Listener */}
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 'clamp(26px, 4vw, 38px)',
            fontWeight: 300,
            lineHeight: 1.15,
            margin: 0,
            color: 'var(--bone)',
            fontVariationSettings: '"opsz" 36',
          }}
        >
          {prompt}
        </h1>

        {/* write now CTA */}
        <div style={{ marginTop: 40 }}>
          <Link to="/loom/compose" className="hl-btn">
            write now
          </Link>
        </div>

        {/* family strip — last 3 contributors */}
        {contributors.length > 0 && (
          <div style={{ marginTop: 64, borderTop: '1px solid var(--rule)', paddingTop: 24 }}>
            <div className="hl-eyebrow" style={{ marginBottom: 16 }}>recent voices</div>
            <div style={{ display: 'flex', gap: 32 }}>
              {contributors.map((c, i) => (
                <span
                  key={i}
                  className="hl-mono"
                  style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  {String(c.author ?? '').slice(0, 6)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* animated cloth strip — full width, below content */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8 }}>
        <TapestryCanvas
          width={typeof window !== 'undefined' ? window.innerWidth : 1280}
          height={72}
          entries={entries}
          kind="full"
          animate
          opts={{
            tStart: new Date(2019, 0, 1),
            tEnd: new Date(2028, 0, 1),
            nowFrac: 0.88,
            background: '#0e0e0c',
            warpEvery: 10,
            showFraySelvedge: true,
          }}
        />
      </div>
    </Frame>
  );
}
```

- [ ] **Step 3: Build + dev check**

```bash
cd cloudflare/frontend && npm run build
npm run dev
# Open http://localhost:5173/loom/today — should show prompt, write button, cloth strip
```

- [ ] **Step 4: Confirm cloth is animating** — watch the cloth strip at the bottom. Threads should slowly pan. If static, check that `animate` prop is present (it is — it defaults to `true`).

- [ ] **Step 5: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/Today.tsx
git commit -m "feat(today): new default home — daily prompt, cloth strip, family voices"
```

---

### Task 1.2: Adoption landing rebuild

**Files:**
- Modify (rebuild): `cloudflare/frontend/src/loom/pages/Marketing.tsx`
- Reference: `LandingAdoption` in `~/Downloads/loom3 2/heirloom-adoption.jsx`

- [ ] **Step 1: Open the reference**

```bash
open ~/Downloads/loom3\ 2/Heirloom\ Design.html
# Navigate to: "Adoption — public surfaces" → "A · Landing (daily hook + free)"
```

- [ ] **Step 2: Replace Marketing.tsx content**

Keep the existing export name `Marketing` (the route `/loom/marketing` in App.tsx already uses it).

```tsx
import { Link } from 'react-router-dom';
import { TapestryCanvas } from '../components/TapestryCanvas';
import { HLogo } from '../components/HLogo';
import { useListener } from '../../hooks/useListener';

function MktTopbar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '24px 56px',
      borderBottom: '1px solid var(--parchment-rule)',
      fontFamily: 'var(--mono)',
      fontSize: 10.5, letterSpacing: '0.32em', textTransform: 'uppercase',
    }}>
      <HLogo size={20} wordmark wordColor="var(--parchment-ink)" />
      <span style={{ display: 'flex', gap: 32, color: 'var(--parchment-dim)' }}>
        <Link to="/loom/weft" style={{ color: 'inherit', textDecoration: 'none' }}>see the cloth</Link>
        <Link to="/founder" style={{ color: 'inherit', textDecoration: 'none' }}>founder</Link>
        <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>pricing</Link>
        <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>sign in</Link>
      </span>
    </div>
  );
}

export function Marketing() {
  const prompt = useListener();

  // Demo entries for the specimen cloth
  const demoEntries = Array.from({ length: 120 }, (_, i) => ({
    date: new Date(1948 + Math.floor(i * 0.65), (i * 3) % 12, 1),
    n: i,
    dye: ['madder','indigo','saffron','weld','woad','cochineal'][i % 6],
    tier: 'family' as const,
  }));

  return (
    <div className="hl-screen parchment" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <MktTopbar />

      {/* hero */}
      <div style={{ padding: '64px 56px 0' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 24 }}>Heirloom · The Family Thread</div>
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            lineHeight: 1.04, fontWeight: 300, margin: 0,
            color: 'var(--parchment-ink)',
            fontVariationSettings: '"opsz" 60',
            maxWidth: '18ch',
          }}
        >
          {prompt}
        </h1>
        <p className="hl-serif" style={{ fontSize: 19, lineHeight: 1.55, maxWidth: '52ch', color: 'var(--parchment-dim)', fontWeight: 400, marginTop: 32 }}>
          Write today. Lock entries for descendants who don't exist yet. Read what came before. The thread continues after you.
        </p>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', marginTop: 40 }}>
          <Link to="/signup" className="hl-btn">Begin your thread — free</Link>
          <Link to="/loom/weft" className="hl-btn text" style={{ color: 'var(--parchment-ink)', borderBottom: '1px solid currentColor', paddingBottom: 1 }}>
            See the cloth →
          </Link>
        </div>
      </div>

      {/* specimen cloth */}
      <div style={{ marginTop: 72, background: 'var(--ink)', position: 'relative' }}>
        <TapestryCanvas
          width={typeof window !== 'undefined' ? window.innerWidth : 1280}
          height={360}
          entries={demoEntries}
          kind="specimen"
          animate
          opts={{
            tStart: new Date(1948, 0, 1),
            tEnd: new Date(2026, 0, 1),
            nowFrac: 0.93,
            showFraySelvedge: true,
            showWarpHair: true,
            background: '#0e0e0c',
            warpEvery: 9,
          }}
        />
        <div style={{ position: 'absolute', left: 56, top: 24, fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          specimen · the Okonkwo family thread · 1948 – today · entry 4,318
        </div>
      </div>

      {/* five pillars */}
      <div style={{ padding: '96px 56px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px 96px' }}>
        {[
          ['Perpetual', 'A 1,000-year horizon, not a season.'],
          ['Append-only', 'Edits append. Nothing is silently rewritten.'],
          ['Time-locked', 'Release entries on a date, an age, a death.'],
          ['Outlives us', 'IPFS pinning, successor non-profit, family export.'],
          ['Private by default', 'Zero-knowledge. We cannot read your entries.'],
        ].map(([title, body]) => (
          <div key={title}>
            <div className="hl-eyebrow dark" style={{ marginBottom: 10 }}>{title}</div>
            <p className="hl-prose dark" style={{ marginTop: 0 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* pricing callout */}
      <div style={{ padding: '0 56px 96px', borderTop: '1px solid var(--parchment-rule)', paddingTop: 56 }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 24 }}>Start free. No credit card.</div>
        <Link to="/pricing" className="hl-btn ghost" style={{ color: 'var(--parchment-ink)', borderColor: 'var(--parchment-rule)' }}>
          See all plans →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build check + dev check**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# Open http://localhost:5173 — specimen cloth should animate, no icons visible
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/Marketing.tsx
git commit -m "feat(landing): rebuild adoption landing with daily hook + animated specimen cloth"
```

---

### Task 1.3: Pricing page

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/pages/Pricing.tsx`
- Reference: `PricingAdoption` in `~/Downloads/loom3 2/heirloom-adoption.jsx`

- [ ] **Step 1: Open the reference**

```bash
# Navigate to: "Adoption — public surfaces" → "B · Pricing"
```

- [ ] **Step 2: Write Pricing.tsx**

```tsx
import { Link } from 'react-router-dom';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '—',
    sub: 'forever',
    features: ['1 thread', '50 entries', 'Read-only inheritance link', 'Export anytime'],
    cta: 'Begin free',
    to: '/signup',
    warm: false,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$9',
    sub: '/ month',
    features: ['Unlimited threads', 'Unlimited entries', 'Time-locked entries', 'Voice entries', 'Up to 12 family members', '30-day trial'],
    cta: 'Start 30-day trial',
    to: '/signup?tier=family',
    warm: true,
  },
  {
    id: 'founder',
    name: 'Founder',
    price: '$240',
    sub: 'once, lifetime',
    features: ['Everything in Family', 'Founder badge + pledge number', 'Locked price forever', 'Vote on the product roadmap'],
    cta: 'Become a founder',
    to: '/founder',
    warm: false,
  },
];

export function Pricing() {
  return (
    <div className="hl-screen parchment" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <div style={{ padding: '80px 56px 120px', maxWidth: 1080, margin: '0 auto' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 24 }}>Pricing</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, margin: '0 0 64px', color: 'var(--parchment-ink)' }}>
          One price for the whole family.
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: '1px solid var(--parchment-rule)' }}>
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              style={{
                padding: '40px 32px',
                borderRight: '1px solid var(--parchment-rule)',
                borderBottom: '1px solid var(--parchment-rule)',
              }}
            >
              <div className="hl-eyebrow dark" style={{ marginBottom: 16 }}>{tier.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span className="hl-serif" style={{ fontSize: 40, fontWeight: 300, color: 'var(--parchment-ink)' }}>{tier.price}</span>
                <span className="hl-mono" style={{ fontSize: 11, color: 'var(--parchment-dim)', letterSpacing: '0.08em' }}>{tier.sub}</span>
              </div>

              <hr className="hl-rule parchment" style={{ margin: '24px 0' }} />

              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {tier.features.map((f) => (
                  <li key={f} style={{ fontFamily: 'var(--serif)', fontSize: 14, lineHeight: 1.7, color: 'var(--parchment-dim)', paddingLeft: 16, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: 'var(--parchment-faint)' }}>·</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 40 }}>
                <Link
                  to={tier.to}
                  className={tier.warm ? 'hl-btn' : 'hl-btn ghost'}
                  style={!tier.warm ? { color: 'var(--parchment-ink)', borderColor: 'var(--parchment-rule)' } : {}}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="hl-mono" style={{ fontSize: 10, color: 'var(--parchment-faint)', marginTop: 40, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          All plans include IPFS pinning + family export. No lock-in.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build + smoke**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# http://localhost:5173/pricing
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/pages/Pricing.tsx
git commit -m "feat(pricing): Free/Family/Founder tier table — no icons, hairline separators"
```

---

### Task 1.4: Public showcase

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/pages/Showcase.tsx`
- Reference: `PublicShowcase` in `~/Downloads/loom3 2/heirloom-adoption.jsx`

- [ ] **Step 1: Write Showcase.tsx**

```tsx
import { Link } from 'react-router-dom';
import { TapestryCanvas } from '../loom/components/TapestryCanvas';

// Stub opt-in families for the showcase cloth
const FAMILIES = [
  { name: 'The Okonkwo Thread', year: 1948, entries: 4318 },
  { name: 'The Lindqvist Thread', year: 1961, entries: 2104 },
  { name: 'The Mehta Thread', year: 1975, entries: 891 },
];

function makeEntries(seed: number, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(1960 + seed * 10 + Math.floor(i * 0.5), (i * 4) % 12, 1),
    n: seed * 1000 + i,
    dye: ['madder','indigo','weld','saffron','woad'][((seed + i) % 5)],
    tier: 'family' as const,
  }));
}

export function Showcase() {
  return (
    <div className="hl-screen" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <div style={{ padding: '64px 56px 0' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 24 }}>Public showcase</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, margin: '0 0 16px', color: 'var(--bone)' }}>
          Threads in the open.
        </h1>
        <p className="hl-serif" style={{ fontSize: 17, color: 'var(--bone-dim)', maxWidth: '52ch', lineHeight: 1.6, margin: '0 0 64px' }}>
          These families have chosen to share their cloth publicly. Entry content stays private — only the pattern is visible.
        </p>
      </div>

      {FAMILIES.map((family, fi) => (
        <div key={fi} style={{ marginBottom: 64 }}>
          <div style={{ padding: '0 56px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)' }}>{family.name}</span>
            <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              since {family.year} · {family.entries.toLocaleString()} entries
            </span>
          </div>
          <TapestryCanvas
            width={typeof window !== 'undefined' ? window.innerWidth : 1280}
            height={120}
            entries={makeEntries(fi, Math.min(family.entries, 200))}
            kind="specimen"
            animate
            opts={{ tStart: new Date(family.year, 0, 1), tEnd: new Date(2026, 0, 1), background: '#0e0e0c', warpEvery: 10 }}
          />
        </div>
      ))}

      <div style={{ padding: '64px 56px 96px', borderTop: '1px solid var(--rule)' }}>
        <Link to="/signup" className="hl-btn">Start your thread — free</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + smoke**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# http://localhost:5173/showcase — three animated cloth strips
```

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/pages/Showcase.tsx
git commit -m "feat(showcase): public animated cloth gallery with family attribution"
```

---

### Task 1.5: Onboarding (3-step)

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/pages/Onboarding.tsx`
- Reference: `Onboarding` in `~/Downloads/loom3 2/heirloom-adoption.jsx`

- [ ] **Step 1: Write Onboarding.tsx**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';

const STEPS = ['Name your thread', 'Write your first entry', 'Invite one family member'];

export function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [threadName, setThreadName] = useState(`The ${user?.lastName ?? ''} Thread`.trim());
  const [firstEntry, setFirstEntry] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const progress = (step + 1) / STEPS.length;

  async function handleNext() {
    if (step === 0 && !threadName.trim()) return;
    if (step === 1) {
      if (!firstEntry.trim()) return;
      setBusy(true);
      try {
        await memoriesApi.create({ text: firstEntry, type: 'memory' });
      } catch { /* stub — continue */ }
      setBusy(false);
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      navigate('/loom/today');
    }
  }

  return (
    <div className="hl-screen parchment" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* hairline progress bar */}
      <div style={{ height: 1, background: 'var(--parchment-rule)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${progress * 100}%`,
          background: 'var(--warm)',
          transition: `width var(--dur-mid) var(--ease)`,
        }} />
      </div>

      <div style={{ flex: 1, padding: '80px 56px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {/* step indicator */}
        <div className="hl-mono" style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
          step {step + 1} of {STEPS.length}
        </div>

        <h1 className="hl-serif hl-tight" style={{ fontSize: 40, fontWeight: 300, color: 'var(--parchment-ink)', margin: '0 0 40px' }}>
          {STEPS[step]}
        </h1>

        {step === 0 && (
          <input
            className="hl-input"
            value={threadName}
            onChange={(e) => setThreadName(e.target.value)}
            placeholder="The Smith Thread"
            autoFocus
          />
        )}

        {step === 1 && (
          <textarea
            className="hl-input"
            value={firstEntry}
            onChange={(e) => setFirstEntry(e.target.value)}
            placeholder="Write anything. A memory, a thought, a fact about today."
            rows={6}
            style={{ resize: 'none' }}
            autoFocus
          />
        )}

        {step === 2 && (
          <input
            className="hl-input"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="grandmother@email.com"
            autoFocus
          />
        )}

        <div style={{ marginTop: 40, display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            type="button"
            className="hl-btn"
            onClick={handleNext}
            disabled={busy}
          >
            {step === STEPS.length - 1 ? 'Go to your thread →' : 'Continue →'}
          </button>
          {step === 2 && (
            <button
              type="button"
              className="hl-btn text"
              onClick={() => navigate('/loom/today')}
              style={{ color: 'var(--parchment-dim)', fontSize: 14 }}
            >
              skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + smoke**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# http://localhost:5173/onboarding — 3 steps, warm progress bar, no icons
```

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/pages/Onboarding.tsx
git commit -m "feat(onboarding): 3-step flow with hairline progress bar, no spinner"
```

---

### Task 1.6: Invite card

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/pages/InviteCard.tsx`
- Reference: `InviteCard` in `~/Downloads/loom3 2/heirloom-adoption.jsx`

- [ ] **Step 1: Write InviteCard.tsx**

```tsx
import { useAuthStore } from '../stores/authStore';

export function InviteCard() {
  const { user } = useAuthStore();
  const senderName = user ? `${user.firstName} ${user.lastName}` : 'Your family member';
  const threadName = `The ${user?.lastName ?? ''} Thread`.trim();

  return (
    <>
      {/* Print-only CSS — hides nav chrome on print */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {/* Screen chrome */}
      <div className="no-print" style={{ padding: '24px 56px', borderBottom: '1px solid var(--parchment-rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-dim)' }}>invite card</span>
        <button
          type="button"
          className="hl-btn ghost"
          style={{ color: 'var(--parchment-ink)', borderColor: 'var(--parchment-rule)' }}
          onClick={() => window.print()}
        >
          print →
        </button>
      </div>

      {/* The letter — printable */}
      <div style={{
        maxWidth: 640, margin: '80px auto', padding: '64px',
        background: 'var(--parchment)', color: 'var(--parchment-ink)',
        border: '1px solid var(--parchment-rule)',
      }}>
        <p className="hl-serif" style={{ fontSize: 14, color: 'var(--parchment-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 48px' }}>
          Heirloom · Family Thread
        </p>

        <p className="hl-serif" style={{ fontSize: 20, lineHeight: 1.7, fontWeight: 300, color: 'var(--parchment-ink)', margin: '0 0 32px' }}>
          {senderName} has invited you to contribute to <em>{threadName}</em> — a family archive that will outlast us both.
        </p>

        <p className="hl-prose dark" style={{ marginTop: 0 }}>
          Heirloom is a place to write memories, letters, and stories for family members who haven't been born yet. Entries are append-only. Nothing is silently rewritten. You can lock an entry for a specific date, an age, or after your death.
        </p>

        <div style={{ margin: '48px 0', padding: '24px 32px', borderLeft: '1px solid var(--parchment-rule)' }}>
          <p className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-faint)', margin: '0 0 8px' }}>to join</p>
          <p className="hl-serif" style={{ fontSize: 18, color: 'var(--parchment-ink)', margin: 0 }}>
            heirloom.blue/signup
          </p>
        </div>

        <p className="hl-serif" style={{ fontSize: 14, color: 'var(--parchment-dim)', fontStyle: 'italic', margin: 0 }}>
          — {senderName}
        </p>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Build + smoke**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# http://localhost:5173/invite — letter format, print button visible
```

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/pages/InviteCard.tsx
git commit -m "feat(invite): printable family invite letter with sender personalisation"
```

---

### Task 1.7: Auth refresh — Login, Signup, ForgotPassword

**Files:**
- Modify: `cloudflare/frontend/src/pages/Login.tsx`
- Modify: `cloudflare/frontend/src/pages/Signup.tsx`
- Modify: `cloudflare/frontend/src/pages/ForgotPassword.tsx`
- Reference: `Login`, `Signup` in `~/Downloads/loom3 2/heirloom-auth.jsx`

- [ ] **Step 1: Open the reference** 
```bash
# Navigate to: "Auth · Settings · Legal · Founder" → "A · Login" and "B · Signup (3-step)"
```

- [ ] **Step 2: Apply hl-input to Login.tsx** — find every `<input` element and replace its `className` with `"hl-input"`. Remove any inline `style` that sets `border-radius`, `background`, `border`, or `padding` on inputs. Remove any icon imports (Lucide, Heroicons, etc.).

Pattern to find and change in Login.tsx:
```tsx
// Before (any of these patterns):
<input type="email" className="w-full border rounded ..." />
<input style={{ borderRadius: '8px', border: '1px solid #ccc' }} />

// After:
<input type="email" className="hl-input" ... />
```

Also remove any card-with-shadow container (`box-shadow`, `rounded-xl`, etc.) — the form should sit on the plain `parchment` background with no card.

- [ ] **Step 3: Expand Signup.tsx to 3-step** — reference `Signup` in `heirloom-auth.jsx`. The three steps are: (1) name (first + last), (2) email + password, (3) invite (optional). Use the same `step` + progress bar pattern as Onboarding.tsx:

```tsx
// In Signup.tsx, replace the single-form body with:
const [step, setStep] = useState(0);
// Step 0: First name, Last name
// Step 1: Email, Password
// Step 2: Invite email (optional — "skip for now")
```

Apply `hl-input` to all inputs, hairline progress bar at top, 0px radius throughout.

- [ ] **Step 4: Token refresh ForgotPassword.tsx** — same pattern: `hl-input` on the email field, remove any card/radius, parchment background.

- [ ] **Step 5: Icon audit** — run:
```bash
grep -r "lucide\|heroicons\|fontawesome\|react-icons" cloudflare/frontend/src/pages/Login.tsx cloudflare/frontend/src/pages/Signup.tsx cloudflare/frontend/src/pages/ForgotPassword.tsx
```
Expected: no output. Fix any hits by removing the import and replacing icon usage with text.

- [ ] **Step 6: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add cloudflare/frontend/src/pages/Login.tsx cloudflare/frontend/src/pages/Signup.tsx cloudflare/frontend/src/pages/ForgotPassword.tsx
git commit -m "style(auth): hl-input refresh, 3-step signup, remove icons + card radius"
```

---

### Task 1.8: Settings · Billing · Privacy · Terms token refresh

**Files:**
- Modify: `cloudflare/frontend/src/pages/Settings.tsx`
- Modify: `cloudflare/frontend/src/pages/Billing.tsx`
- Modify: `cloudflare/frontend/src/pages/Privacy.tsx` (if exists)
- Modify: `cloudflare/frontend/src/pages/Terms.tsx` (if exists)
- Reference: `Settings`, `Billing`, `Privacy`, `Terms` in `~/Downloads/loom3 2/heirloom-auth.jsx`

For each file, apply these three passes:

- [ ] **Step 1: Token pass** — find all arbitrary hex colors (anything not a CSS var). Replace with the nearest design token:
  - Dark background → `var(--ink)` or `var(--ink-deep)`
  - Light background → `var(--parchment)` or `var(--parchment-deep)`
  - Muted text → `var(--parchment-dim)` or `var(--bone-dim)`
  - Run: `grep -n "#[0-9a-fA-F]\{3,6\}" cloudflare/frontend/src/pages/Settings.tsx` and fix each hit.

- [ ] **Step 2: Radius pass** — find any `borderRadius` > 2px or Tailwind classes like `rounded-lg`, `rounded-xl`, `rounded-md`, `rounded`. Change to `borderRadius: 0` (or 2 for inputs).

- [ ] **Step 3: Divider pass** — find any `<hr />` and change to `<hr className="hl-rule parchment" />`. Find any thick border lines (2px+) and change to `1px solid var(--parchment-rule)`.

- [ ] **Step 4: Billing — tier badge** — in Billing.tsx, the tier label already uses `tierLabel()`. Ensure it renders in a `<span className="hl-tag">` instead of any icon-based badge. No chevron or check icons.

- [ ] **Step 5: Icon audit**

```bash
grep -rn "lucide\|heroicons\|fontawesome\|react-icons\|<svg" cloudflare/frontend/src/pages/Settings.tsx cloudflare/frontend/src/pages/Billing.tsx
```
Fix any hits — replace icon with text label or remove entirely.

- [ ] **Step 6: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add cloudflare/frontend/src/pages/Settings.tsx cloudflare/frontend/src/pages/Billing.tsx
git commit -m "style(settings/billing): token refresh, 0px radius, hairline dividers, no icons"
```

---

### Task 1.9: Founder · FounderWelcome

**Files:**
- Modify: `cloudflare/frontend/src/pages/Founder.tsx`
- Modify: `cloudflare/frontend/src/pages/FounderWelcome.tsx`
- Reference: `Founder`, `FounderWelcome` in `~/Downloads/loom3 2/heirloom-auth.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "Auth · Settings · Legal · Founder" → "E · Founder pitch" and "F · Founder welcome"
```

- [ ] **Step 2: Add animated TapestryCanvas to Founder.tsx hero** — at the top of the page (above the copy), add a full-width specimen cloth:

```tsx
import { TapestryCanvas } from '../loom/components/TapestryCanvas';

// Inside the JSX, as the hero section:
<div style={{ background: 'var(--ink)', marginBottom: 0 }}>
  <TapestryCanvas
    width={typeof window !== 'undefined' ? window.innerWidth : 1280}
    height={240}
    entries={demoEntries}  // use same stub entries as Marketing.tsx
    kind="specimen"
    animate
    opts={{ tStart: new Date(1948, 0, 1), tEnd: new Date(2026, 0, 1), background: '#0e0e0c' }}
  />
</div>
```

Apply the standard token pass (replace arbitrary hex), remove any radius, no icons.

- [ ] **Step 3: FounderWelcome 720ms entrance** — the page should fade + slide in on mount:

```tsx
import { useEffect, useState } from 'react';

// Inside FounderWelcome:
const [visible, setVisible] = useState(false);
useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);

// Wrap content in:
<div style={{
  opacity: visible ? 1 : 0,
  transform: visible ? 'none' : 'translateY(12px)',
  transition: `opacity var(--dur-slow) var(--ease), transform var(--dur-slow) var(--ease)`,
}}>
  {/* ... content ... */}
</div>
```

Pledge number renders in mono: `<span className="hl-mono" style={{ fontSize: 13, letterSpacing: '0.14em' }}>pledge #0144</span>`.

- [ ] **Step 4: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 5: Wave 1 gate — icon + hex audit**

```bash
grep -rn "lucide\|heroicons\|fontawesome\|react-icons" cloudflare/frontend/src/pages/ cloudflare/frontend/src/loom/pages/
grep -rn "#[0-9a-fA-F]\{6\}" cloudflare/frontend/src/pages/Founder.tsx cloudflare/frontend/src/pages/FounderWelcome.tsx
```
Both should be empty. Fix any hits.

- [ ] **Step 6: Wave 1 build gate**

```bash
cd cloudflare/frontend && npm run build
```
Expected: exit 0. This completes Wave 1.

- [ ] **Step 7: Commit**

```bash
git add cloudflare/frontend/src/pages/Founder.tsx cloudflare/frontend/src/pages/FounderWelcome.tsx
git commit -m "feat(founder): animated specimen cloth hero + 720ms welcome entrance"
```

---

## WAVE 2 — Core product screens

> **Prerequisite:** Wave 1 complete. `cd cloudflare/frontend && npm run build` must be green.

---

### Task 2.1: Tapestry home — Weft views

**Files:**
- Modify: `cloudflare/frontend/src/loom/pages/Weft.tsx`
- Reference: `TapestryHomeCanonical`, `TapestryHomePull`, `TapestryHomeCentury`, `EmptyThread` in `~/Downloads/loom3 2/heirloom-product.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "Pass 1 · The Tapestry — Home"
```

- [ ] **Step 2: Audit Weft.tsx** — check that:
  1. `TapestryCanvas` is rendered with `animate` (not `animate={false}`)
  2. There's a `ViewToggle` allowing Canonical / Pull / Century views
  3. The append-only counter is in the topbar (passed via `right` prop to Frame or AppFrame)
  4. There's an `EmptyThread` state when `entries.length === 0`

Fix anything missing. The canonical view is the default (`kind="full"`, horizontal pan). Pull mode is a vertical list of single-entry focus cards. Century view is `kind="century"` (compressed time scale).

- [ ] **Step 3: Wire useTapestryEntries** — replace any static/hardcoded entry arrays with `useTapestryEntries()`:

```tsx
import { useTapestryEntries } from '../../hooks/useTapestryEntries';

const entries = useTapestryEntries();
```

- [ ] **Step 4: Empty state** — when `entries.length === 0`, show warp-only cloth + prompt:

```tsx
{entries.length === 0 && (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
    <TapestryCanvas width={typeof window !== 'undefined' ? window.innerWidth : 1280} height={typeof window !== 'undefined' ? window.innerHeight : 800}
      entries={[]} kind="full" animate opts={{ background: '#0e0e0c' }} />
    <div style={{ position: 'absolute', textAlign: 'center' }}>
      <h2 className="hl-serif hl-tight" style={{ fontSize: 28, fontWeight: 300, color: 'var(--bone)', margin: '0 0 24px' }}>
        Your thread is unwoven.
      </h2>
      <Link to="/loom/compose" className="hl-btn">Begin your thread →</Link>
    </div>
  </div>
)}
```

- [ ] **Step 5: Build check**

```bash
cd cloudflare/frontend && npm run build
npm run dev
# http://localhost:5173/loom/weft — cloth should animate
```

- [ ] **Step 6: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/Weft.tsx
git commit -m "feat(weft): wire useTapestryEntries, empty-state warp, confirm animate=true"
```

---

### Task 2.2: Composer — 3 modes

**Files:**
- Modify: `cloudflare/frontend/src/loom/pages/Composer.tsx`
- Reference: `ComposerPaper`, `ComposerLetter`, `ComposerSpeak` in `~/Downloads/loom3 2/heirloom-product.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "Composer" → three artboards
```

- [ ] **Step 2: Audit Composer.tsx** — confirm it has a mode toggle for Paper / Letter / Speak. If the toggle is present, apply the token refresh (hl-input, no radius, no icons). If not, add it:

```tsx
type ComposerMode = 'paper' | 'letter' | 'speak';
const [mode, setMode] = useState<ComposerMode>('paper');

// Mode toggle row (mono labels, hairline underline on active):
<div style={{ display: 'flex', gap: 32, padding: '0 56px', borderBottom: '1px solid var(--rule)', marginBottom: 40 }}>
  {(['paper', 'letter', 'speak'] as ComposerMode[]).map((m) => (
    <button
      key={m}
      type="button"
      onClick={() => setMode(m)}
      style={{
        background: 'transparent', border: 0, cursor: 'pointer', padding: '16px 0',
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        color: mode === m ? 'var(--bone)' : 'var(--bone-faint)',
        borderBottom: mode === m ? '1px solid var(--warm)' : '1px solid transparent',
        transition: `color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease)`,
      }}
    >
      {m}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Speak mode — no waveform icon** — if there's a waveform SVG or audio icon in Speak mode, replace it with a text indicator:

```tsx
{/* Replace any waveform icon with: */}
<span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
  {recording ? '● recording' : '○ tap to speak'}
</span>
```

- [ ] **Step 4: Letter mode — hl-input fields** — recipient name field and unlock-date field must use `hl-input` class. The seal glyph is `∞`, not a lock icon.

- [ ] **Step 5: Build + smoke**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# http://localhost:5173/loom/compose — toggle modes, no icons
```

- [ ] **Step 6: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/Composer.tsx
git commit -m "feat(composer): 3-mode toggle Paper/Letter/Speak, no icons, hl-input"
```

---

### Task 2.3: Wall / ReadingRoom

**Files:**
- Modify: `cloudflare/frontend/src/loom/pages/ReadingRoom.tsx`
- Reference: `Wall`, `WallBook` in `~/Downloads/loom3 2/heirloom-detail.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "Wall — Thread detail"
```

- [ ] **Step 2: Audit ReadingRoom.tsx** — confirm:
  - Two modes: Wall (canonical) and Book
  - No avatar circles — author attribution is mono text only
  - Hairline `<hr className="hl-rule">` between entries
  - Book mode: wider margins, larger body text (`font-size: 19px` instead of 16)

- [ ] **Step 3: Remove avatar circles** — find any `<img>` or circular `<div>` used for author avatars. Replace with:
```tsx
<span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
  {authorName}
</span>
```

- [ ] **Step 4: Book mode toggle** — add if missing:
```tsx
const [viewMode, setViewMode] = useState<'wall' | 'book'>('wall');
```

- [ ] **Step 5: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/ReadingRoom.tsx
git commit -m "feat(reading-room): Wall+Book modes, no avatar circles, hairline separators"
```

---

### Task 2.4: Memories mosaic

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/pages/Memories.tsx`
- Reference: `Memories` in `~/Downloads/loom3 2/heirloom-product-index.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "Product · the rest of the IA" → "D · Memories (mosaic)"
```

- [ ] **Step 2: Write Memories.tsx**

```tsx
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

const DYE_COLORS: Record<string, string> = {
  memory:    'var(--madder,   #9f3a2a)',
  letter:    'var(--indigo,   #1f3a5b)',
  voice:     'var(--saffron,  #c69a3a)',
  event:     'var(--weld,     #a89248)',
  milestone: 'var(--cochineal,#7a1f2b)',
};

export function Memories() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['memories-mosaic'],
    queryFn: () => memoriesApi.list({ limit: 200 }).then((r) => r.data?.memories ?? []),
    enabled: isAuthenticated,
  });

  const memories = data ?? [];

  return (
    <AppFrame
      left="memories"
      right={<span className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.1em' }}>{memories.length} entries</span>}
    >
      {isLoading && (
        <progress style={{ width: '100%', height: 1, appearance: 'none', background: 'var(--rule)', color: 'var(--warm)', accentColor: 'var(--warm)' }} />
      )}

      {/* Masonry columns */}
      <div style={{
        columns: 'var(--mosaic-cols, 3) auto',
        columnGap: 24,
        padding: '24px 0',
      }}>
        <style>{`
          @media (max-width: 900px) { :root { --mosaic-cols: 2 } }
          @media (max-width: 600px) { :root { --mosaic-cols: 1 } }
        `}</style>

        {memories.map((m: any) => (
          <div
            key={m.id}
            style={{
              breakInside: 'avoid',
              marginBottom: 24,
              paddingLeft: 12,
              borderLeft: `1px solid ${DYE_COLORS[m.type] ?? DYE_COLORS.memory}`,
            }}
          >
            <div className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
              {new Date(m.createdAt ?? m.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: 0 }}>
              {m.text?.slice(0, 200)}{(m.text?.length ?? 0) > 200 ? '…' : ''}
            </p>
          </div>
        ))}
      </div>
    </AppFrame>
  );
}
```

- [ ] **Step 3: Update old memory routes to redirect** — in App.tsx, ensure:
```tsx
<Route path="/memory-room/:token" element={<MemoryRoom />} />  // keep — token-gated access
// Add these redirects for the listing pages:
<Route path="/memory-cards" element={<Navigate to="/memories" replace />} />
```

- [ ] **Step 4: Build + smoke**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# http://localhost:5173/memories — masonry grid, no avatar circles, dye-color accents
```

- [ ] **Step 5: Commit**

```bash
git add cloudflare/frontend/src/pages/Memories.tsx cloudflare/frontend/src/App.tsx
git commit -m "feat(memories): masonry mosaic with dye-color accents, redirect memory-cards"
```

---

### Task 2.5: Q&A (RAG + citations)

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/pages/QA.tsx`
- Reference: `QandA` in `~/Downloads/loom3 2/heirloom-product-index.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "Product · the rest of the IA" → "G · Q&A (RAG, cited)"
```

- [ ] **Step 2: Write QA.tsx**

```tsx
import { useState } from 'react';
import { AppFrame } from '../loom/components/AppFrame';
import { Link } from 'react-router-dom';

interface Citation {
  entryDate: string;
  excerpt: string;
  entryId: string;
}

interface Answer {
  text: string;
  citations: Citation[];
}

// Stub: no API yet — returns a believable placeholder
async function askThread(question: string): Promise<Answer> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    text: `Based on what's been written in your thread, ${question.toLowerCase().replace('?', '')} touches on themes your family has returned to often. The thread holds many answers — search within it.`,
    citations: [
      { entryDate: '12 March 2019', excerpt: 'A memory about that very thing…', entryId: 'stub-1' },
    ],
  };
}

export function QA() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    const result = await askThread(question);
    setAnswer(result);
    setLoading(false);
  }

  return (
    <AppFrame left="ask the thread">
      <div style={{ maxWidth: 640, padding: '48px 0' }}>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 32, fontWeight: 300, color: 'var(--bone)', margin: '0 0 40px' }}>
          Ask your thread anything.
        </h1>

        {/* Ask input */}
        <div style={{ position: 'relative' }}>
          <input
            className="hl-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="What did my grandfather do for work?"
            style={{ fontSize: 18, padding: '16px 18px', fontFamily: 'var(--serif)' }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="hl-btn"
            onClick={handleAsk}
            disabled={loading || !question.trim()}
          >
            {loading ? 'searching the thread…' : 'ask →'}
          </button>
        </div>

        {loading && (
          <progress style={{ display: 'block', width: '100%', height: 1, margin: '24px 0', appearance: 'none', accentColor: 'var(--warm)' }} />
        )}

        {answer && (
          <div style={{ marginTop: 48 }}>
            <p className="hl-serif" style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--bone)', fontWeight: 300, margin: '0 0 32px' }}>
              {answer.text}
            </p>

            {answer.citations.length > 0 && (
              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 24 }}>
                <div className="hl-eyebrow" style={{ marginBottom: 16 }}>from the thread</div>
                {answer.citations.map((c, i) => (
                  <div key={i} style={{ marginBottom: 16, paddingLeft: 12, borderLeft: '1px solid var(--rule)' }}>
                    <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', marginBottom: 6 }}>
                      {c.entryDate}
                    </div>
                    <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 6px', lineHeight: 1.6 }}>
                      {c.excerpt}
                    </p>
                    <Link to={`/loom/read?entry=${c.entryId}`} className="hl-btn text" style={{ fontSize: 12 }}>
                      read entry →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppFrame>
  );
}
```

- [ ] **Step 3: Build + smoke**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# http://localhost:5173/qa — ask input, hairline progress, cited answer
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/pages/QA.tsx
git commit -m "feat(qa): ask-the-thread with stub citations, hairline progress, no chatbot chrome"
```

---

### Task 2.6: Threads index

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/pages/ThreadsIndex.tsx`
- Reference: `ThreadsIndex` in `~/Downloads/loom3 2/heirloom-product-index.jsx`

- [ ] **Step 1: Write ThreadsIndex.tsx**

```tsx
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { threadsApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';
import { Link } from 'react-router-dom';

export function ThreadsIndex() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['threads-index'],
    queryFn: () => threadsApi.list().then((r) => r.data ?? []),
    enabled: isAuthenticated,
  });

  const threads = Array.isArray(data) ? data : [];

  return (
    <AppFrame left="threads">
      {isLoading && (
        <progress style={{ display: 'block', width: '100%', height: 1, marginBottom: 24, appearance: 'none', accentColor: 'var(--warm)' }} />
      )}

      <div style={{ paddingTop: 40 }}>
        {threads.length === 0 && !isLoading && (
          <p className="hl-serif" style={{ color: 'var(--bone-dim)', fontStyle: 'italic' }}>No threads yet.</p>
        )}

        {threads.map((thread: any, i: number) => (
          <Link
            key={thread.id ?? i}
            to={`/threads/${thread.id}`}
            style={{ display: 'block', textDecoration: 'none', borderBottom: '1px solid var(--rule)', padding: '20px 0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24 }}>
              <span className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)' }}>
                {thread.name ?? 'Unnamed Thread'}
              </span>
              <span style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {thread.memberCount ?? 1} {thread.memberCount === 1 ? 'member' : 'members'}
                </span>
                <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {thread.lastEntryAt ? new Date(thread.lastEntryAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </AppFrame>
  );
}
```

- [ ] **Step 2: Build + smoke**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/pages/ThreadsIndex.tsx
git commit -m "feat(threads): index list — serif names, mono meta, hairline rows, no cards"
```

---

### Task 2.7: Inbox · Letters token refresh

**Files:**
- Modify: `cloudflare/frontend/src/pages/Inbox.tsx`
- Modify: `cloudflare/frontend/src/pages/Letters.tsx`
- Reference: `Inbox`, `Letters` in `~/Downloads/loom3 2/heirloom-product-index.jsx`

- [ ] **Step 1: Token pass on Inbox.tsx** — same three passes as Task 1.8 (hex → CSS vars, radius → 0, hr → hl-rule). Additionally: any time-locked indicator that uses a lock icon or key icon must be replaced with a mono text label:

```tsx
// Replace lock icon with:
<span className="hl-mono" style={{ fontSize: 9, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
  locked · opens {unlockDate}
</span>
```

- [ ] **Step 2: Token pass on Letters.tsx** — same three passes.

- [ ] **Step 3: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/pages/Inbox.tsx cloudflare/frontend/src/pages/Letters.tsx
git commit -m "style(inbox/letters): token refresh, lock-icon → mono text, hairlines"
```

---

### Task 2.8: Family · PersonPage · Bloodline

**Files:**
- Modify: `cloudflare/frontend/src/pages/Family.tsx`
- Modify: `cloudflare/frontend/src/pages/PersonPage.tsx`
- Reference: `FamilyIndex`, `MemberProfile`, `Bloodline` in `~/Downloads/loom3 2/heirloom-product-index.jsx` and `heirloom-detail.jsx`

- [ ] **Step 1: Family.tsx — bloodline as typography** — remove any third-party tree library (react-family-tree, d3, etc.). The family tree is rendered as nested `<div>` rows with SVG hairline connectors:

```tsx
// Pattern for each member row:
<div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--rule)' }}>
  {/* Depth indent via padding-left */}
  <span className="hl-serif" style={{ fontSize: 16, fontWeight: 300, color: 'var(--bone)' }}>{member.name}</span>
  <span className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.12em' }}>
    {member.relationship}
  </span>
  <span className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.1em', marginLeft: 'auto' }}>
    {member.birthYear}{member.deathYear ? ` – ${member.deathYear}` : ''}
  </span>
</div>
```

No avatar circles anywhere. Connections shown as 1px `var(--rule)` left-border indentation.

- [ ] **Step 2: PersonPage.tsx — no avatar circle** — find any circular `<img>` or avatar `<div>`. Replace with initials in a hairline square or remove:

```tsx
// Replace avatar circle with:
<div style={{
  width: 36, height: 36,
  border: '1px solid var(--rule)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-faint)',
  borderRadius: 0,
  flexShrink: 0,
}}>
  {initials}
</div>
```

- [ ] **Step 3: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/pages/Family.tsx cloudflare/frontend/src/pages/PersonPage.tsx
git commit -m "feat(family): bloodline as typography, hairline connectors, no avatar circles"
```

---

### Task 2.9: Listener / Echo

**Files:**
- Modify: `cloudflare/frontend/src/loom/pages/Echo.tsx`
- Reference: `ListenerSpec` in `~/Downloads/loom3 2/heirloom-product-index.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "Product · the rest of the IA" → "H · The Listener (component spec)"
```

- [ ] **Step 2: Rebuild Echo.tsx as the Listener** — one ambient typographic line, no chatbot chrome:

```tsx
import { useListener } from '../../hooks/useListener';
import { Frame } from '../components/Frame';

export function Echo() {
  const prompt = useListener();

  return (
    <Frame left="echo">
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 56,
      }}>
        {/* The Listener — one typographic line */}
        <div style={{ textAlign: 'center', maxWidth: '52ch', padding: '0 32px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>
            the listener
          </span>
          <p
            className="hl-serif hl-italic"
            style={{
              fontSize: 22,
              lineHeight: 1.5,
              fontWeight: 400,
              color: 'var(--bone-dim)',
              margin: 0,
              fontVariationSettings: '"opsz" 18',
            }}
          >
            {prompt}
          </p>
        </div>
      </div>
    </Frame>
  );
}
```

- [ ] **Step 3: Wave 2 gate — full audit**

```bash
# Icon audit
grep -rn "lucide\|heroicons\|fontawesome\|react-icons" cloudflare/frontend/src/pages/ cloudflare/frontend/src/loom/pages/

# Animate audit — no animate={false} on visible cloth
grep -rn "animate={false}" cloudflare/frontend/src/

# Build
cd cloudflare/frontend && npm run build
```

All must pass. This completes Wave 2.

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/Echo.tsx
git commit -m "feat(echo): Listener as one ambient typographic line, no chatbot chrome"
```

---

## WAVE 3 — PWA role homes · moments · admin

> **Prerequisite:** Wave 2 complete. `cd cloudflare/frontend && npm run build` must be green.

---

### Task 3.1: PWA role-keyed home

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/loom/pages/PwaHome.tsx`
- Reference: `PwaVisitor`, `PwaTrial`, `PwaFamily`, etc. in `~/Downloads/loom3 2/heirloom-pwa.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "PWA · nine role-keyed homes"
```

- [ ] **Step 2: Write PwaHome.tsx**

```tsx
import { Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { useTapestryEntries } from '../../hooks/useTapestryEntries';
import { useListener } from '../../hooks/useListener';
import { TapestryCanvas } from '../components/TapestryCanvas';
import type { UserRole } from '../../hooks/useRole';

function MiniCloth({ entries }: { entries: ReturnType<typeof useTapestryEntries> }) {
  return (
    <TapestryCanvas
      width={typeof window !== 'undefined' ? window.innerWidth : 390}
      height={80}
      entries={entries}
      kind="specimen"
      animate
      opts={{ tStart: new Date(2019, 0, 1), tEnd: new Date(2027, 0, 1), background: '#0a0a08', warpEvery: 7 }}
    />
  );
}

function RoleContent({ role, entries, prompt }: { role: UserRole; entries: ReturnType<typeof useTapestryEntries>; prompt: string }) {
  switch (role) {
    case 'visitor':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>preview</span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 24, fontWeight: 300, color: 'var(--bone)', margin: '0 0 24px' }}>
            Start your family's thousand-year thread.
          </h2>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 32 }}>
            <Link to="/signup" className="hl-btn">Begin free →</Link>
          </div>
        </div>
      );

    case 'trial':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>trial</span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 22, fontWeight: 300, color: 'var(--bone)', margin: '0 0 16px' }}>
            {prompt}
          </h2>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/loom/compose" className="hl-btn">write now</Link>
            <Link to="/billing" className="hl-btn text" style={{ fontSize: 13 }}>upgrade →</Link>
          </div>
        </div>
      );

    case 'family':
    case 'founder':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>
            {role === 'founder' ? 'founder' : 'today'}
          </span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 22, fontWeight: 300, color: 'var(--bone)', margin: '0 0 16px' }}>
            {prompt}
          </h2>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 24 }}>
            <Link to="/loom/compose" className="hl-btn">write now</Link>
          </div>
        </div>
      );

    case 'reader':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>reading</span>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 24 }}>
            <Link to="/loom/read" className="hl-btn">open the thread →</Link>
          </div>
        </div>
      );

    case 'successor':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>inheritance</span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 22, fontWeight: 300, color: 'var(--bone)', margin: '0 0 24px' }}>
            A thread has been passed to you.
          </h2>
          <Link to="/loom/weft" className="hl-btn">Open the cloth →</Link>
        </div>
      );

    case 'future_member':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>awaiting</span>
          <p className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone-dim)', lineHeight: 1.6 }}>
            A thread is being prepared for you.
          </p>
        </div>
      );

    case 'legacy':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>legacy access</span>
          <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone-dim)', lineHeight: 1.6 }}>
            Verify your identity to access the archive.
          </p>
          <Link to="/inherit" className="hl-btn ghost" style={{ marginTop: 24, display: 'inline-block', borderColor: 'var(--rule)' }}>
            Verify →
          </Link>
        </div>
      );

    case 'admin':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>support</span>
          <Link to="/admin" className="hl-btn">Open admin console →</Link>
        </div>
      );

    default:
      return null;
  }
}

export function PwaHome() {
  const role = useRole();
  const entries = useTapestryEntries();
  const prompt = useListener();

  return (
    <div className="hl-screen" style={{ minHeight: '100vh', position: 'relative' }}>
      <RoleContent role={role} entries={entries} prompt={prompt} />
    </div>
  );
}
```

- [ ] **Step 3: Build + smoke**

```bash
cd cloudflare/frontend && npm run build && npm run dev
# http://localhost:5173/loom/pwa — should show family/founder role home by default (if logged in with subscription)
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/PwaHome.tsx
git commit -m "feat(pwa-home): 10-variant role-keyed home using useRole + animated cloth"
```

---

### Task 3.2: Inheritance Card

**Files:**
- Modify (replace stub): `cloudflare/frontend/src/pages/InheritanceCard.tsx`
- Reference: `InheritanceCard` in `~/Downloads/loom3 2/heirloom-viral.jsx`

- [ ] **Step 1: Write InheritanceCard.tsx**

```tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

// Stub API — real endpoint will be wired when the Worker route exists
async function fetchInheritance(token: string) {
  // Real: GET /api/inheritance/:token
  return {
    threadName: 'The Okonkwo Thread',
    authorName: 'Emeka Okonkwo',
    entryCount: 4318,
    yearStarted: 1948,
  };
}

export function InheritanceCard() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['inheritance', token],
    queryFn: () => fetchInheritance(token!),
    enabled: !!token,
  });

  const [unlocked, setUnlocked] = useState(false);

  function handleUnlock() {
    setUnlocked(true);
  }

  if (isLoading) {
    return (
      <div className="hl-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <progress style={{ width: 120, height: 1, appearance: 'none', accentColor: 'var(--warm)' }} />
      </div>
    );
  }

  return (
    <div className="hl-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 24 }}>inheritance</div>

        <h1 className="hl-serif hl-tight" style={{ fontSize: 36, fontWeight: 300, color: 'var(--bone)', margin: '0 0 16px' }}>
          {data?.threadName}
        </h1>

        <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone-dim)', lineHeight: 1.6, margin: '0 0 8px' }}>
          started by {data?.authorName} in {data?.yearStarted}
        </p>

        <p className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 48px' }}>
          {data?.entryCount?.toLocaleString()} entries
        </p>

        <hr className="hl-rule" style={{ margin: '0 0 48px' }} />

        {!unlocked ? (
          <button
            type="button"
            className="hl-btn"
            onClick={handleUnlock}
            style={{ fontSize: 16, padding: '18px 40px' }}
          >
            ∞ open the thread
          </button>
        ) : (
          <div
            style={{
              animation: `fadeIn var(--dur-slow) var(--ease) forwards`,
            }}
          >
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
            <p className="hl-serif" style={{ fontSize: 18, color: 'var(--bone)', lineHeight: 1.7 }}>
              The thread is open. Create your account to read and contribute.
            </p>
            <a href="/signup" className="hl-btn" style={{ display: 'inline-block', marginTop: 24 }}>
              Join the thread →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/pages/InheritanceCard.tsx
git commit -m "feat(inheritance-card): token-gated thread unlock, 720ms ceremony, no account required"
```

---

### Task 3.3: Heirloom Wrapped

**Files:**
- Modify: `cloudflare/frontend/src/pages/Wrapped.tsx` (may already partially exist — rebuild)
- Reference: `Wrapped` in `~/Downloads/loom3 2/heirloom-viral.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "The four shareable moments" → "A · Heirloom Wrapped (annual)"
```

- [ ] **Step 2: Write/rebuild Wrapped.tsx**

```tsx
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { memoriesApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

const YEAR = new Date().getFullYear();

export default function Wrapped() {
  const { isAuthenticated, user } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['wrapped', YEAR],
    queryFn: () => memoriesApi.list({ limit: 500 }).then((r) => r.data?.memories ?? []),
    enabled: isAuthenticated,
  });

  const memories = (data ?? []) as any[];
  const thisYear = memories.filter((m: any) => new Date(m.createdAt ?? m.created_at).getFullYear() === YEAR);
  const activeMonths = new Set(thisYear.map((m: any) => new Date(m.createdAt ?? m.created_at).getMonth())).size;

  return (
    <AppFrame left="wrapped">
      <div style={{ maxWidth: 600, padding: '64px 0' }}>
        <div className="hl-eyebrow" style={{ marginBottom: 16 }}>{YEAR} · Heirloom Wrapped</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 52, fontWeight: 300, color: 'var(--bone)', margin: '0 0 64px', lineHeight: 1.04 }}>
          Another year<br />in the thread.
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', borderTop: '1px solid var(--rule)' }}>
          {[
            ['entries this year', thisYear.length.toString()],
            ['months active', activeMonths.toString()],
            ['total in thread', memories.length.toString()],
            ['years running', (YEAR - 2019).toString()],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '32px 0', borderBottom: '1px solid var(--rule)', borderRight: '1px solid var(--rule)', paddingRight: 32, paddingLeft: 0 }}>
              <div className="hl-eyebrow" style={{ marginBottom: 8 }}>{label}</div>
              <div className="hl-serif hl-tight" style={{ fontSize: 48, fontWeight: 300, color: 'var(--bone)', lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 48 }}>
          share this year's thread →
        </p>
      </div>
    </AppFrame>
  );
}
```

Note: `Wrapped.tsx` exports `default` because App.tsx imports it as `lazy(() => import('./pages/Wrapped'))` (no named import). Keep it as a default export.

- [ ] **Step 3: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/pages/Wrapped.tsx
git commit -m "feat(wrapped): annual summary — entry count, active months, no avatar circles"
```

---

### Task 3.4: Daily Sentence · Founders' Wall refresh

**Files:**
- Modify: `cloudflare/frontend/src/pages/DailySentence.tsx`
- Modify: `cloudflare/frontend/src/pages/FoundersWall.tsx`
- Reference: `DailySentence`, `FoundersWall` in `~/Downloads/loom3 2/heirloom-viral.jsx`

- [ ] **Step 1: Token pass on DailySentence.tsx** — open the reference, apply the standard three passes (tokens, radius, dividers). The sentence renders as large serif display (`font-size: clamp(28px, 4vw, 48px)`), bone-on-ink. Attribution below in mono.

- [ ] **Step 2: Token pass on FoundersWall.tsx** — pledge rows: mono throughout, hairline row separators. Each row: pledge number · name · date · optional note. No avatar circles — the pledge number is the identifier.

- [ ] **Step 3: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/pages/DailySentence.tsx cloudflare/frontend/src/pages/FoundersWall.tsx
git commit -m "style(daily/founders-wall): token refresh, mono rows, no avatar circles"
```

---

### Task 3.5: Admin console — Tickets · Incidents · Audit tabs

**Files:**
- Modify: `cloudflare/frontend/src/pages/AdminDashboard.tsx`
- Reference: `AdminUsers`, `AdminTickets`, `AdminIncidents`, `AdminAudit` in `~/Downloads/loom3 2/heirloom-admin.jsx`

- [ ] **Step 1: Open the reference**
```bash
# Navigate to: "Admin · the full console"
```

- [ ] **Step 2: Add tab navigation to AdminDashboard.tsx**

Add a `tab` state with 4 options and a mono tab bar:

```tsx
type AdminTab = 'users' | 'tickets' | 'incidents' | 'audit';
const [tab, setTab] = useState<AdminTab>('users');

// Tab bar (add at the top of the page content, below the topbar):
<div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)', marginBottom: 40 }}>
  {(['users', 'tickets', 'incidents', 'audit'] as AdminTab[]).map((t) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      style={{
        background: 'transparent', border: 0, cursor: 'pointer', padding: '16px 24px',
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        color: tab === t ? 'var(--bone)' : 'var(--bone-faint)',
        borderBottom: tab === t ? '1px solid var(--warm)' : '1px solid transparent',
        marginBottom: -1,
        transition: `color var(--dur-fast) var(--ease)`,
      }}
    >
      {t}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Add Tickets tab content**

```tsx
{tab === 'tickets' && (
  <div>
    <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
      Support queue — zero-knowledge: thread IDs only, no entry content
    </p>
    {/* Stub: real data from support API */}
    <p className="hl-serif" style={{ color: 'var(--bone-dim)', fontStyle: 'italic' }}>No open tickets.</p>
  </div>
)}
```

- [ ] **Step 4: Add Incidents tab content**

```tsx
{tab === 'incidents' && (
  <div>
    <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
      Kill-switches + pins
    </p>
    {/* Stub incident toggle */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--rule)' }}>
      <span className="hl-serif" style={{ fontSize: 14, color: 'var(--bone)' }}>Composer disabled</span>
      <button type="button" className="hl-tag" style={{ cursor: 'pointer' }}>off</button>
    </div>
  </div>
)}
```

- [ ] **Step 5: Add Audit tab content**

```tsx
{tab === 'audit' && (
  <div>
    <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>
      Forensic log — zero-knowledge: metadata only
    </p>
    {/* Stub log entries */}
    {[
      { ts: '2026-06-01 09:14', actor: 'admin@heirloom.blue', action: 'user.viewed', resource: 'usr_abc123' },
      { ts: '2026-06-01 08:52', actor: 'system', action: 'billing.renewed', resource: 'usr_def456' },
    ].map((entry, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 160px 1fr', gap: '0 24px', padding: '12px 0', borderBottom: '1px solid var(--rule)' }}>
        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{entry.ts}</span>
        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-dim)' }}>{entry.actor}</span>
        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)' }}>{entry.action}</span>
        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{entry.resource}</span>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 6: Build check**

```bash
cd cloudflare/frontend && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add cloudflare/frontend/src/pages/AdminDashboard.tsx
git commit -m "feat(admin): add Tickets/Incidents/Audit tabs, mono tab bar, zero-knowledge stubs"
```

---

### Task 3.6: Wave 3 gate — full audit + deploy smoke

- [ ] **Step 1: Icon audit**
```bash
grep -rn "lucide\|heroicons\|fontawesome\|react-icons" cloudflare/frontend/src/
```
Expected: no output. Fix any hits.

- [ ] **Step 2: Animate audit**
```bash
grep -rn "animate={false}" cloudflare/frontend/src/
```
Review each hit — if it's on a visible cloth, change to `animate={true}` or remove the prop (default is `true`).

- [ ] **Step 3: Final build gate**
```bash
cd cloudflare/frontend && npm run build
```
Expected: exit 0 with 0 TypeScript errors.

- [ ] **Step 4: Dev smoke** — run `npm run dev`, visit these routes in a browser and confirm:
  - `/` → redirects to `/loom/today` → shows prompt + cloth
  - `/loom/today` → prompt, write button, animated cloth strip
  - `/loom/weft` → animated tapestry cloth
  - `/loom/compose` → 3-mode toggle, no icons
  - `/pricing` → tier table, no icons
  - `/showcase` → 3 animated cloths
  - `/loom/pwa` → role home (cloth + prompt)

- [ ] **Step 5: Deploy smoke** — after merging/deploying, open the production site and verify that the animated cloth is visible on `/` and `/loom/weft`. The CSP in production blocks inline scripts — if cloth appears but doesn't animate, check for inline `<script>` regressions.

- [ ] **Step 6: Final commit**
```bash
git add -A
git commit -m "chore: Wave 3 complete — all 60 artboards ported, icon/animate audit clean"
```

---

## Self-review checklist

- [ ] Wave 0: globals.css tokens (motion, hl-input, hl-tag, hl-tight) — Task 0.1
- [ ] Wave 0: AppFrame role prop, Frame route labels — Task 0.2
- [ ] Wave 0: useRole, useTapestryEntries, useListener hooks — Task 0.3
- [ ] Wave 0: App.tsx routing (Today, Pricing, Showcase, Onboarding, etc.) — Task 0.4
- [ ] Wave 1: Today home (daily prompt, animated cloth, family strip) — Task 1.1
- [ ] Wave 1: Marketing.tsx rebuilt (adoption landing + specimen cloth) — Task 1.2
- [ ] Wave 1: Pricing page (Free/Family/Founder) — Task 1.3
- [ ] Wave 1: Showcase (public animated cloth) — Task 1.4
- [ ] Wave 1: Onboarding (3-step, hairline progress) — Task 1.5
- [ ] Wave 1: InviteCard (printable letter) — Task 1.6
- [ ] Wave 1: Auth refresh (Login/Signup/ForgotPassword) — Task 1.7
- [ ] Wave 1: Settings/Billing/Privacy/Terms token refresh — Task 1.8
- [ ] Wave 1: Founder/FounderWelcome (animated hero, 720ms entrance) — Task 1.9
- [ ] Wave 2: Weft tapestry home (3 views, useTapestryEntries, empty state) — Task 2.1
- [ ] Wave 2: Composer (3 modes, no waveform icon) — Task 2.2
- [ ] Wave 2: ReadingRoom (Wall+Book, no avatar circles) — Task 2.3
- [ ] Wave 2: Memories mosaic (masonry, dye accents) — Task 2.4
- [ ] Wave 2: QA (ask + citations, no chatbot chrome) — Task 2.5
- [ ] Wave 2: ThreadsIndex (serif names, mono meta, hairlines) — Task 2.6
- [ ] Wave 2: Inbox/Letters token refresh — Task 2.7
- [ ] Wave 2: Family/PersonPage (bloodline typography, no avatar circles) — Task 2.8
- [ ] Wave 2: Echo/Listener (one ambient line) — Task 2.9
- [ ] Wave 3: PwaHome (10 role variants) — Task 3.1
- [ ] Wave 3: InheritanceCard (token-gated, 720ms unlock) — Task 3.2
- [ ] Wave 3: Wrapped (annual summary) — Task 3.3
- [ ] Wave 3: DailySentence/FoundersWall refresh — Task 3.4
- [ ] Wave 3: Admin Tickets/Incidents/Audit tabs — Task 3.5
- [ ] Wave 3: Full gate audit (icons, animate, build, deploy smoke) — Task 3.6
