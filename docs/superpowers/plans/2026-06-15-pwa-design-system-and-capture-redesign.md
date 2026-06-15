# Heirloom PWA Design System + Capture Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every PWA/web screen legible and coherent — fix the veil readability failure per-route, extract one reusable Room design system, rebuild `/loom/pwa` capture-first, wire voice→text on the Speak flow, and sweep all screens onto four visual anchors.

**Architecture:** A small shared Room primitive set (`src/loom/components/room/`) + a per-route veil mode in `ClothBackdrop`. Screens compose primitives; each maps to one of four anchors (Capture / Thread-List / Reading-room / Artifact-builder). Voice→text (`/ai/transcribe` Whisper) and refine (`/ai/refine`) backends already exist — work is frontend wiring + UI. No worker/DB schema changes.

**Tech Stack:** React 18, Vite, TypeScript strict, Tailwind, react-router-dom, @tanstack/react-query, Zustand. Tree: `cloudflare/frontend`.

**Testing reality:** This tree has no component test runner (`Component tests TBD` per CLAUDE.md). The discipline gate per task is `npm run build` (`tsc --noEmit && vite build`, must be 0 errors) + manual smoke on the running dev server, then on live `heirloom.blue` after deploy. Where a task adds pure logic (e.g. Listener rotation), it gets a tiny standalone Node assertion script run via `node`. This substitutes for unit tests given the harness gap — noted so it is a deliberate choice, not a silent TDD drop.

**Constraints (carried, non-negotiable):**
- ART_DIRECTION constitution: Source Serif 4 / Inter / JetBrains Mono; one warm accent `#b07a4a` <3% surface; ink `#0e0e0c` / bone `#f4ecd8`; 60–70% negative space; curve `cubic-bezier(0.16,1,0.3,1)`; durations 180/360/720/1400ms. No icons (`∞` only), no glassmorphism, no gradient meshes, no spinners (use `ProgressHair`), no toasts (inline status), no avatar circles / `rounded-full` identity chips.
- Edit `cloudflare/frontend` only. CosmicLoom stays the live cloth.
- Prod CSP has **no `unsafe-inline`** — no inline `<script>` / inline event handler attributes in HTML; React inline `style={}` objects are fine (they are not CSP-scoped). External same-origin files + SW precache only.
- Worker metadata sanitizer drops non-whitelisted keys — if a new composer metadata key is introduced, whitelist it in the worker. (This plan introduces none.)
- Bump `public/sw.js` `CACHE` version on every significant deploy. The browser byte-compares `sw.js`; an unchanged file = no update = stale PWA.
- Branch before commit. Commit trailer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Smoke live `heirloom.blue` after each deploy.

---

## File Structure

**New:**
- `src/loom/components/room/RoomHeader.tsx` — eyebrow + serif title + lede. One header pattern, every screen.
- `src/loom/components/room/RoomSection.tsx` — hairline-divided vertical-rhythm wrapper + optional mono micro-label.
- `src/loom/components/room/CapturePills.tsx` — co-equal `Write →` / `Speak →` pills.
- `src/loom/components/room/RoomRow.tsx` — one hairline list row: dye dot + serif title + mono meta.
- `src/loom/components/room/index.ts` — barrel re-export.
- `scripts/check-listener-rotation.mjs` — throwaway logic assertion for Listener rotation.

**Modified:**
- `src/loom/components/ClothBackdrop.tsx` — veil-per-route (`full` / `band` / `room`).
- `src/hooks/useListener.ts` — rotate every open + `reroll()`.
- `src/pages/PwaHome.tsx` — `AuthHome` rebuilt capture-first (layout C); drop deprecated `backdropOpacity` prop usage.
- `src/pages/Record.tsx` — auto-transcribe after stop + inline refine via `VoiceRefine`.
- ~Anchor sweep screens (Phase 4) — adopt Room primitives, one anchor each.
- `public/sw.js` — bump `CACHE` (currently `heirloom-v95`) per deploy.

Each file has one responsibility. Primitives are presentational only (props in, JSX out, no data fetching) so they compose into any screen and stay holdable in context.

---

## Phase 1 — Foundation: Room primitives + veil-per-route + Listener rotation

### Task 1: `RoomHeader` primitive

**Files:**
- Create: `cloudflare/frontend/src/loom/components/room/RoomHeader.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { ReactNode } from 'react';

/**
 * RoomHeader — the single header pattern for every screen.
 * Mono uppercase eyebrow → Source Serif title → optional dim lede.
 * Left-aligned, uses the page-pad tokens. No icons, no rules of its own.
 */
export interface RoomHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  /** Tint the eyebrow warm (e.g. role/state emphasis). Default faint bone. */
  warmEyebrow?: boolean;
  className?: string;
}

export function RoomHeader({ eyebrow, title, lede, warmEyebrow, className }: RoomHeaderProps) {
  return (
    <header className={className} style={{ display: 'grid', gap: 14 }}>
      {eyebrow != null && (
        <span
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: warmEyebrow ? 'var(--warm)' : 'var(--bone-faint)',
          }}
        >
          {eyebrow}
        </span>
      )}
      <h1
        className="hl-serif hl-tight"
        style={{
          margin: 0,
          fontWeight: 300,
          fontSize: 'clamp(24px, 6vw, 34px)',
          lineHeight: 1.15,
          color: 'var(--bone)',
          fontVariationSettings: '"opsz" 32',
        }}
      >
        {title}
      </h1>
      {lede != null && (
        <p
          className="hl-serif"
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: 'clamp(14px, 4vw, 16px)',
            lineHeight: 1.68,
            color: 'var(--bone-dim)',
            maxWidth: '46ch',
          }}
        >
          {lede}
        </p>
      )}
    </header>
  );
}

export default RoomHeader;
```

- [ ] **Step 2: Typecheck**

Run: `cd cloudflare/frontend && npx tsc --noEmit`
Expected: 0 errors. (`hl-mono`, `hl-serif`, `hl-tight` classes already exist in `globals.css`; tokens `--bone`, `--bone-dim`, `--bone-faint`, `--warm` already defined.)

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/components/room/RoomHeader.tsx
git commit -m "feat(room): RoomHeader primitive — the one header pattern"
```

### Task 2: `RoomSection` primitive

**Files:**
- Create: `cloudflare/frontend/src/loom/components/room/RoomSection.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { ReactNode } from 'react';

/**
 * RoomSection — a vertical-rhythm block with a hairline top divider and an
 * optional mono micro-label. No cards, no boxes — structure by hairline only.
 */
export interface RoomSectionProps {
  label?: ReactNode;
  children: ReactNode;
  /** Omit the top hairline (first section under a RoomHeader). */
  flush?: boolean;
  className?: string;
}

export function RoomSection({ label, children, flush, className }: RoomSectionProps) {
  return (
    <section
      className={className}
      style={{
        borderTop: flush ? 'none' : '1px solid var(--rule)',
        paddingTop: flush ? 0 : 20,
        marginTop: flush ? 0 : 24,
        display: 'grid',
        gap: 14,
      }}
    >
      {label != null && (
        <span
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.30em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          {label}
        </span>
      )}
      {children}
    </section>
  );
}

export default RoomSection;
```

- [ ] **Step 2: Typecheck** — `cd cloudflare/frontend && npx tsc --noEmit` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/components/room/RoomSection.tsx
git commit -m "feat(room): RoomSection primitive — hairline-divided rhythm block"
```

### Task 3: `CapturePills` primitive

**Files:**
- Create: `cloudflare/frontend/src/loom/components/room/CapturePills.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Link } from 'react-router-dom';

/**
 * CapturePills — the co-equal Write / Speak capture affordance.
 * Write is the warm-outline pill (`hl-btn`); Speak is the ghost pill
 * (`hl-btn text`). Either can be a route (href) or a handler (onClick).
 * Reused anywhere capture is offered — home, empty states, entity pages.
 */
export interface CapturePillsProps {
  writeHref?: string;
  speakHref?: string;
  onWrite?: () => void;
  onSpeak?: () => void;
  writeLabel?: string;
  speakLabel?: string;
  className?: string;
}

export function CapturePills({
  writeHref = '/compose',
  speakHref = '/record',
  onWrite,
  onSpeak,
  writeLabel = 'write →',
  speakLabel = 'speak →',
  className,
}: CapturePillsProps) {
  return (
    <div
      className={className}
      style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
    >
      {onWrite ? (
        <button type="button" onClick={onWrite} className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>
          {writeLabel}
        </button>
      ) : (
        <Link to={writeHref} className="hl-btn" style={{ fontSize: 13, padding: '11px 20px' }}>
          {writeLabel}
        </Link>
      )}
      {onSpeak ? (
        <button type="button" onClick={onSpeak} className="hl-btn text" style={{ fontSize: 13 }}>
          {speakLabel}
        </button>
      ) : (
        <Link to={speakHref} className="hl-btn text" style={{ fontSize: 13 }}>
          {speakLabel}
        </Link>
      )}
    </div>
  );
}

export default CapturePills;
```

- [ ] **Step 2: Typecheck** — `cd cloudflare/frontend && npx tsc --noEmit` → 0 errors. (`hl-btn` and `hl-btn.text` already styled in `globals.css`.)

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/components/room/CapturePills.tsx
git commit -m "feat(room): CapturePills primitive — co-equal Write/Speak"
```

### Task 4: `RoomRow` primitive

**Files:**
- Create: `cloudflare/frontend/src/loom/components/room/RoomRow.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * RoomRow — the Thread/List atom. One hairline row: a 6px dye dot (glow),
 * a serif title, and mono meta on the right. The dye is signal only —
 * a `--dye-<key>` CSS var, never a background fill. 44px min touch target.
 */
export interface RoomRowProps {
  /** Dye key (e.g. 'madder'); resolves to `--dye-<dye>`, falls back to warm. */
  dye?: string;
  title: ReactNode;
  meta?: ReactNode;
  href: string;
  className?: string;
}

export function RoomRow({ dye, title, meta, href, className }: RoomRowProps) {
  const dot = dye ? `var(--dye-${dye}, var(--warm))` : 'var(--warm)';
  return (
    <Link
      to={href}
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'baseline',
        columnGap: 12,
        textDecoration: 'none',
        padding: '11px 0',
        minHeight: 44,
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          alignSelf: 'center',
          background: dot,
          boxShadow: `0 0 8px ${dot}`,
        }}
      />
      <span
        className="hl-serif"
        style={{
          fontSize: 'clamp(15px, 4vw, 17px)',
          fontWeight: 300,
          color: 'var(--bone)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </span>
      {meta != null && (
        <span
          className="hl-mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textAlign: 'right',
          }}
        >
          {meta}
        </span>
      )}
    </Link>
  );
}

export default RoomRow;
```

- [ ] **Step 2: Typecheck** — `cd cloudflare/frontend && npx tsc --noEmit` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/components/room/RoomRow.tsx
git commit -m "feat(room): RoomRow primitive — the Thread/List atom"
```

### Task 5: Room barrel export

**Files:**
- Create: `cloudflare/frontend/src/loom/components/room/index.ts`

- [ ] **Step 1: Write the barrel**

```ts
export { RoomHeader } from './RoomHeader';
export type { RoomHeaderProps } from './RoomHeader';
export { RoomSection } from './RoomSection';
export type { RoomSectionProps } from './RoomSection';
export { CapturePills } from './CapturePills';
export type { CapturePillsProps } from './CapturePills';
export { RoomRow } from './RoomRow';
export type { RoomRowProps } from './RoomRow';
```

- [ ] **Step 2: Typecheck** — `cd cloudflare/frontend && npx tsc --noEmit` → 0 errors.

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/components/room/index.ts
git commit -m "feat(room): barrel export for Room primitives"
```

### Task 6: Veil-per-route in `ClothBackdrop`

**Files:**
- Modify: `cloudflare/frontend/src/loom/components/ClothBackdrop.tsx:28` (HOME_ROUTES), `:53` (isHome), `:73` (present), `:94-128` (the two veil divs)

- [ ] **Step 1: Replace the route constant and derive a veil mode**

Replace line 28:

```ts
const HOME_ROUTES = new Set(['/loom', '/loom/pwa']);
```

with:

```ts
type VeilMode = 'full' | 'band' | 'room';

// `/loom` — the cloth IS the screen, full presence, no veil.
// `/loom/pwa` — capture home: cloth lives in a touchable top band, ink below.
// everything else — the room veil draws over so the page's work stays legible.
function veilModeFor(pathname: string): VeilMode {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/loom') return 'full';
  if (p === '/loom/pwa') return 'band';
  return 'room';
}
```

- [ ] **Step 2: Replace `isHome` / `present` derivation**

Replace line 53:

```ts
  const isHome = HOME_ROUTES.has(location.pathname.replace(/\/$/, '') || '/');
```

with:

```ts
  const veilMode = veilModeFor(location.pathname);
  const isHome = veilMode !== 'room';
```

Replace line 73:

```ts
  const present = isHome || surging;
```

with:

```ts
  // Cloth comes to full presence on a home surface or during the weave ceremony.
  const present = isHome || surging;
  // During a surge the veil always lifts; otherwise it follows the route mode.
  const effectiveMode: VeilMode = surging ? 'full' : veilMode;
```

- [ ] **Step 3: Render the veil by mode**

Replace the veil `<div>` (lines 116-127, the second aria-hidden div) with a mode switch. The cloth presence div (lines 96-111) stays as-is except `interactive={isHome}` — keep it; `band` is a home surface so the cloth stays touchable.

```tsx
      {/* The veil. `full` → none. `room` → radial ink, the page floats in calm
          centre dark. `band` → vertical: cloth reads in the top band, solid ink
          below so the capture block is legible while the cloth stays touchable. */}
      {effectiveMode === 'room' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.97,
            transition: 'opacity 1400ms var(--ease-out)',
            background:
              'radial-gradient(ellipse 76% 88% at 50% 46%, var(--ink) 38%, color-mix(in srgb, var(--ink) 55%, transparent) 68%, transparent 92%)',
          }}
        />
      )}
      {effectiveMode === 'band' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            transition: 'opacity 1400ms var(--ease-out)',
            background:
              'linear-gradient(to bottom, transparent 0%, transparent 30%, color-mix(in srgb, var(--ink) 72%, transparent) 44%, var(--ink) 60%, var(--ink) 100%)',
          }}
        />
      )}
```

(`full` renders no veil div — matches today's home behaviour.)

- [ ] **Step 4: Typecheck + build**

Run: `cd cloudflare/frontend && npm run build`
Expected: 0 errors.

- [ ] **Step 5: Manual smoke (dev server)**

Run: `cd cloudflare/frontend && npm run dev`, then in a browser:
- `/loom` → cloth full, no veil (unchanged).
- `/loom/pwa` → cloth visible in top ~30–40vh, fading to solid ink below; capture text fully legible; touching the cloth band still highlights threads.
- any room route (e.g. `/memories`) → radial ink veil, text crisp.
Expected: all three legible; `/loom/pwa` no longer washes out.

- [ ] **Step 6: Commit**

```bash
git add cloudflare/frontend/src/loom/components/ClothBackdrop.tsx
git commit -m "fix(cloth): veil-per-route — band veil makes /loom/pwa legible"
```

### Task 7: Listener rotation every open + `reroll()`

**Files:**
- Modify: `cloudflare/frontend/src/hooks/useListener.ts:58-65`
- Create: `cloudflare/frontend/scripts/check-listener-rotation.mjs`

- [ ] **Step 1: Write the rotation logic as a pure, testable helper**

Replace the `useListener` export (lines 58-65) with a pure `nextIndex` helper + a hook that persists and advances on mount:

```ts
import { useMemo, useState, useCallback } from 'react';

const STORAGE_KEY = 'heirloom.listener.lastIdx';

// Pure: pick an index different from `last`, deterministic given `seed` in [0,1).
// Exposed for the rotation assertion script.
export function nextIndex(last: number, total: number, seed: number): number {
  if (total <= 1) return 0;
  const offset = 1 + Math.floor(seed * (total - 1)); // 1..total-1, never 0
  return ((last < 0 ? 0 : last) + offset) % total;
}

function readLast(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw == null ? -1 : parseInt(raw, 10);
    return Number.isFinite(n) ? n : -1;
  } catch {
    return -1;
  }
}

function writeLast(i: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(i));
  } catch {
    /* private mode / disabled storage — rotation degrades to per-mount only */
  }
}

export interface Listener {
  prompt: string;
  reroll: () => void;
}

/**
 * useListener — a fresh prompt on every open/login. Persists the last index in
 * localStorage and advances by a non-zero offset so the same prompt never
 * repeats back-to-back. `reroll()` advances again for the ↻ affordance.
 */
export function useListener(): Listener {
  const total = PROMPTS.length;
  const [idx, setIdx] = useState(() => {
    const i = nextIndex(readLast(), total, Math.random());
    writeLast(i);
    return i;
  });
  const reroll = useCallback(() => {
    setIdx((cur) => {
      const i = nextIndex(cur, total, Math.random());
      writeLast(i);
      return i;
    });
  }, [total]);
  const prompt = useMemo(() => PROMPTS[idx], [idx]);
  return { prompt, reroll };
}
```

Note the call sites change: `useListener()` now returns `{ prompt, reroll }`, not a bare string. Every consumer must destructure. Known consumers: `PwaHome.tsx:577` (`const prompt = useListener();` → `const { prompt, reroll } = useListener();`) and any `useListenerAI` wrapper. Grep before building (Step 4).

- [ ] **Step 2: Write the rotation assertion script**

```js
// scripts/check-listener-rotation.mjs
// Pure-logic check for nextIndex: never 0-offset, always in range, never repeats.
function nextIndex(last, total, seed) {
  if (total <= 1) return 0;
  const offset = 1 + Math.floor(seed * (total - 1));
  return ((last < 0 ? 0 : last) + offset) % total;
}
const total = 52;
let last = -1;
let ok = true;
for (let t = 0; t < 100000; t++) {
  const seed = Math.random();
  const i = nextIndex(last, total, seed);
  if (i < 0 || i >= total) { ok = false; console.error('out of range', i); break; }
  if (i === last) { ok = false; console.error('repeated', i); break; }
  last = i;
}
console.log(ok ? 'PASS: no repeats, all in range' : 'FAIL');
process.exit(ok ? 0 : 1);
```

- [ ] **Step 3: Run the assertion**

Run: `cd cloudflare/frontend && node scripts/check-listener-rotation.mjs`
Expected: `PASS: no repeats, all in range`

- [ ] **Step 4: Update consumers + build**

Run: `cd cloudflare/frontend && grep -rn "useListener(" src` — for each call site, destructure `{ prompt }` (and `reroll` where a re-roll affordance is wanted). Then:
Run: `npm run build`
Expected: 0 errors.

- [ ] **Step 5: Manual smoke** — load `/loom/pwa`, note the prompt, reload several times: a different prompt each load, never the same twice running.

- [ ] **Step 6: Commit**

```bash
git add cloudflare/frontend/src/hooks/useListener.ts cloudflare/frontend/scripts/check-listener-rotation.mjs
git commit -m "feat(listener): rotate prompt every open + reroll()"
```

---

## Phase 2 — Capture: PwaHome rebuild + Record transcription

### Task 8: Rebuild `AuthHome` capture-first (layout C)

**Files:**
- Modify: `cloudflare/frontend/src/pages/PwaHome.tsx` — `AuthHome` active-author branch (lines 274-570), the `useListener` call (577), the `ClothShell` `backdropOpacity` prop (613)

Layout C, the approved active-author home, top → bottom:
1. **Listener hero** — `RoomHeader` with eyebrow `the listener asks` + `↻` reroll affordance; title = the rotating `prompt`. This is the hero; it sits over the touchable cloth band (band veil from Task 6).
2. **CapturePills** — `Write →` (`/compose`) + `Speak →` (`/record`), co-equal.
3. **Recently woven** — last 3 titled entries as `RoomRow` + `see all N →` to `/memories`.
4. **Quiet nav row** — `letters · family · book · ask` as a single mono line of links.
5. **One status line** — `since {firstYear} · {count} woven · year {threadYear} of a thousand`.

- [ ] **Step 1: Add imports**

At the top of `PwaHome.tsx`, add:

```tsx
import { RoomHeader, CapturePills, RoomRow } from '../loom/components/room';
```

- [ ] **Step 2: Update the `useListener` call**

Line 577: change `const prompt = useListener();` to `const { prompt, reroll } = useListener();` and thread `reroll` into `AuthHome` via a new prop. Update `AuthHome`'s signature (line 161-171) to accept `reroll: () => void` and the call site (686) to pass it.

- [ ] **Step 3: Replace the active-author return (lines 293-570) with the layout-C composition**

```tsx
  // ── Active author — capture-first home (layout C) ──
  const recent = [...entries].filter((e) => e.title).reverse().slice(0, 3);
  const QUIET_NAV: { to: string; label: string }[] = [
    { to: '/letters', label: 'letters' },
    { to: '/family', label: 'family' },
    { to: '/book', label: 'book' },
    { to: '/ask', label: 'ask' },
  ];

  return (
    <div
      style={{
        padding: `0 ${P}`,
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Listener hero — over the touchable cloth band. Fills the first view. */}
      <div
        style={{
          minHeight:
            'clamp(340px, calc(100svh - 200px - env(safe-area-inset-top, 0px)), 640px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 22,
          paddingBottom: 8,
        }}
      >
        <RoomHeader
          eyebrow={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              the listener asks
              <button
                type="button"
                onClick={reroll}
                aria-label="another prompt"
                className="hl-mono"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--warm)',
                  fontSize: 12,
                  lineHeight: 1,
                  padding: 2,
                }}
              >
                ↻
              </button>
            </span>
          }
          title={
            <span style={{ fontStyle: 'italic', textShadow: '0 0 50px var(--ink)' }}>
              {prompt}
            </span>
          }
        />
        <CapturePills writeHref="/compose" speakHref="/record" />
      </div>

      {/* Recently woven */}
      {recent.length > 0 && (
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 20, marginTop: 8 }}>
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              marginBottom: 12,
            }}
          >
            recently woven
          </div>
          {recent.map((e, i) => (
            <RoomRow
              key={`${e.n}-${i}`}
              dye={e.dye}
              href="/loom/weft"
              title={`${e.title}${e.sealed ? ' ∞' : ''}`}
              meta={e.date.getFullYear()}
            />
          ))}
          <Link
            to="/memories"
            className="hl-mono"
            style={{
              display: 'inline-block',
              marginTop: 14,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              textDecoration: 'none',
            }}
          >
            see all {count} {count === 1 ? 'memory' : 'memories'} →
          </Link>
        </div>
      )}

      {/* Quiet nav */}
      <div
        style={{
          borderTop: '1px solid var(--rule)',
          marginTop: 24,
          paddingTop: 18,
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        {QUIET_NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="hl-mono"
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bone-dim)',
              textDecoration: 'none',
            }}
          >
            {n.label}
          </Link>
        ))}
      </div>

      {/* One status line */}
      <p
        className="hl-mono"
        style={{
          marginTop: 22,
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
        }}
      >
        since {firstYear} · <b style={{ color: 'var(--warm-dim)', fontWeight: 400 }}>{count}</b>{' '}
        {count === 1 ? 'memory' : 'memories'} woven · year {threadYear} of a thousand
        {stats && stats.members > 0 ? ` · ${stats.members} ${stats.members === 1 ? 'voice' : 'voices'}` : ''}
      </p>
    </div>
  );
```

Keep the existing `visitor`, read-only-empty, and `count === 0` branches (lines 183-272) — they already follow the system; only restyle their CTAs to `CapturePills` where two actions appear (the `count === 0` branch's Write/Speak pair at lines 252-260 → `<CapturePills writeHref="/compose" speakHref="/record" writeLabel="write your first letter →" />`). `firstYear`, `threadYear`, `count`, `stats` are already computed above the return (lines 279-283).

- [ ] **Step 4: Drop the deprecated `backdropOpacity` prop**

Line 613: remove `backdropOpacity={0.45}` from the `ClothShell` call — veil presence is now route-driven by `ClothBackdrop` (Task 6), and the prop is deprecated. Verify `ClothShell` does not require it (it is optional per the deprecated-prop comment in `ClothBackdrop`). If `ClothShell`'s prop type marks it required, make it optional there.

- [ ] **Step 5: Build**

Run: `cd cloudflare/frontend && npm run build`
Expected: 0 errors. Remove any now-unused locals the old return referenced (e.g. `getStage`, `stage`, `heroStat`, `todayStamp`, `TARGET`, `primaryCta`) if the new composition no longer uses them — `tsc` `noUnusedLocals` will flag them; delete dead code rather than suppress.

- [ ] **Step 6: Manual smoke** — `/loom/pwa` as an active author: rotating prompt hero over the cloth band, Write/Speak pills, 3 recent rows + see-all, quiet nav, one status line. Legible top to bottom. Reload → prompt changes. ↻ rerolls.

- [ ] **Step 7: Commit**

```bash
git add cloudflare/frontend/src/pages/PwaHome.tsx
git commit -m "feat(home): rebuild /loom/pwa capture-first (layout C)"
```

### Task 9: Auto-transcribe + inline refine on Record (Speak)

**Files:**
- Modify: `cloudflare/frontend/src/pages/Record.tsx` — imports (1-9), recorder `onstop` (146-154) / `stop` (178-182), add a transcribe effect + state, transcript field UI (~620-635)

The Whisper backend exists (`aiApi.transcribe({ audioUrl })`); Record never calls it. Wire: after a recording is captured, auto-transcribe and populate the editable `transcript` field; offer inline refine via the existing `VoiceRefine` refine path. Graceful-fail to the manual field — never block save.

- [ ] **Step 1: Add imports + the data-URL helper + state**

Add to the import block:

```tsx
import { aiApi } from '../services/api';
import { ProgressHair } from '../loom/components/ProgressHair';
import { VoiceRefine } from '../loom/components/VoiceRefine';
```

Add state near the other `useState`s (after line 52):

```tsx
  const [transcribing, setTranscribing] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
```

Add the helper above the component (near line 37, module scope):

```tsx
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}
```

- [ ] **Step 2: Trigger transcription when a recording lands**

In `recorder.onstop` (lines 146-154), after `setAudioUrl(...)`, kick transcription off the captured blob. Add inside `onstop`, after `setAudioUrl(URL.createObjectURL(blob));`:

```tsx
        void autoTranscribe(blob);
```

Define `autoTranscribe` as a `useCallback` in the component body (after `start`):

```tsx
  const autoTranscribe = useCallback(async (blob: Blob) => {
    // Best-effort: fill the transcript so the voice memory is searchable.
    // Any failure leaves the manual field untouched — never blocks save.
    setTranscribing(true);
    try {
      const dataUrl = await blobToDataUrl(blob);
      const res = await aiApi.transcribe({ audioUrl: dataUrl });
      const heard = (res.data?.transcript || '').trim();
      if (heard) {
        setTranscript((cur) => (cur.trim() ? cur : heard));
        setShowRefine(true);
      }
    } catch {
      /* leave the field for manual entry */
    } finally {
      setTranscribing(false);
    }
  }, []);
```

(`autoTranscribe` is referenced inside `start`'s `onstop` closure; declare it with `useCallback` before `start`, or hoist `start` to depend on it. Simplest: declare `autoTranscribe` above `start` and add it to `start`'s dependency considerations — `start` is not memoized here, so a plain function-order declaration in the component body suffices.)

- [ ] **Step 3: Render transcribing state + refine in the transcript area**

In the transcript field block (~620-635), above the manual `<textarea>`, add:

```tsx
        {transcribing && <ProgressHair label="listening to your words…" />}
```

And below the textarea, offer refine when a transcript exists:

```tsx
        {showRefine && transcript.trim() && (
          <div style={{ marginTop: 14 }}>
            <VoiceRefine kind="memory" onPick={(text) => setTranscript(text)} />
          </div>
        )}
```

`VoiceRefine` records its own audio for the refine flow; here it serves as the "find better words" affordance on the transcript. (It calls `onPick` only on explicit choice — typed text is never lost.) Keep the existing manual placeholder copy ("Transcript will appear here — or write your own.").

- [ ] **Step 4: Build**

Run: `cd cloudflare/frontend && npm run build`
Expected: 0 errors.

- [ ] **Step 5: Manual smoke** — record a short clip → on stop, `ProgressHair` "listening…" appears → transcript auto-fills with the spoken words → "find better words" refine is offered → save. Then verify the saved voice memory carries the transcript (it flows through the existing `save` mutation, line 213, `transcript: transcript.trim() || null`). Force a failure (deny mic / offline) → field stays manual, save still works.

- [ ] **Step 6: Commit**

```bash
git add cloudflare/frontend/src/pages/Record.tsx
git commit -m "feat(record): auto-transcribe on stop + inline refine (Speak parity with Write)"
```

### Task 10: Phase 1–2 deploy gate

- [ ] **Step 1: Full build** — `cd cloudflare/frontend && npm run build` → 0 errors.
- [ ] **Step 2: Bump SW cache** — in `public/sw.js`, bump `CACHE` (`heirloom-v95` → `heirloom-v96`). The byte change is what triggers the PWA update.
- [ ] **Step 3: Commit + push the branch; deploy via the existing `deploy-cloudflare.yml` flow** (only on user request to push/deploy).
- [ ] **Step 4: Smoke live `heirloom.blue`** — `/loom/pwa` legible (band veil), rotating prompt, capture pills, recent rows; Record transcribes; a room route shows the radial veil. Hard-reload to confirm the SW picked up `v96`.

---

## Phase 3 — Anchor sweep (all remaining screens)

Mechanical application of the four anchors. Each screen: import the relevant primitives, replace its ad-hoc header with `RoomHeader`, group body with `RoomSection`, lists with `RoomRow`, capture with `CapturePills`. No new logic — preserve every screen's data fetching, route params, and state. Goal: visual coherence + legibility, not behaviour change.

**The transform pattern (worked example — applies to all):**

Before (typical ad-hoc header):
```tsx
<div style={{ padding: 24 }}>
  <span className="hl-eyebrow">letters</span>
  <h1 className="hl-serif" style={{ fontSize: 30 }}>Sealed Letters</h1>
  <p>...</p>
  {items.map(it => <SomeAdHocRow key={it.id} {...it} />)}
</div>
```

After:
```tsx
import { RoomHeader, RoomSection, RoomRow } from '../loom/components/room';
// ...
<div style={{ padding: `clamp(28px, 6vw, 44px) var(--page-pad-x, clamp(20px,5vw,32px))` }}>
  <RoomHeader eyebrow="letters" title="Sealed Letters" lede="..." />
  <RoomSection label={`${items.length} sealed`}>
    {items.map(it => (
      <RoomRow key={it.id} dye={it.dye} href={`/letters/${it.id}`} title={it.title} meta={it.year} />
    ))}
  </RoomSection>
</div>
```

Each task below = one anchor group. Within a group, convert each listed screen, then run `npm run build` once for the group and smoke 2–3 representative screens. Group commit. (Per-screen commits are fine too if a screen is large.)

### Task 11: Thread/List anchor sweep

**Screens:** Memories, Letters, ThreadsIndex, FamilyFeed, Inbox, Milestones, LifeEvents, OnThisDay, StoryArtifact, TimeCapsule, Challenges, Streaks, Referrals, MemoryCards, Memorials.

- [ ] **Step 1:** For each screen file (locate via `grep -rln "export function <Name>" src/pages`), apply the transform pattern: `RoomHeader` for the title block, `RoomSection` to group, `RoomRow` for every list item. Lists cap at a reading max-width (`maxWidth: 'min(100%, 720px)'`) so wide desktop does not full-bleed.
- [ ] **Step 2:** `cd cloudflare/frontend && npm run build` → 0 errors.
- [ ] **Step 3:** Smoke Memories, Inbox, Milestones at ~390px and ~1280px — coherent header, hairline rows, dye dots, legible, centred column on desktop.
- [ ] **Step 4:** Commit `feat(rooms): Thread/List anchor sweep`.

### Task 12: Reading-room anchor sweep

**Screens:** LetterRoom, VoiceRoom, ReadingRoom, Echo, Weft, TiedOff, StoryView, CardView, MemoryRoom, Today.

- [ ] **Step 1:** Single immersive entry: `RoomHeader` (eyebrow = mono date/author stamp), narrow measure (`maxWidth: '64ch'`, centred), 3px left dye margin on the prose column (`borderLeft: '3px solid var(--dye-<dye>, var(--warm))'`, `paddingLeft`). Body prose in `hl-serif` at reading size. Preserve each room's existing content/data.
- [ ] **Step 2:** `npm run build` → 0 errors.
- [ ] **Step 3:** Smoke LetterRoom, VoiceRoom, Weft at both widths — one calm column, dye margin, measure capped, immersive.
- [ ] **Step 4:** Commit `feat(rooms): Reading-room anchor sweep`.

### Task 13: Artifact-builder anchor sweep

**Screens:** BookBuilder, BookPage, Wrapped, ExportPage.

- [ ] **Step 1:** Preview-forward: `RoomHeader`, a centred preview region, quiet `RoomSection` control rows (hairline-separated, mono micro-labels), exactly one warm CTA (`hl-btn`). No second warm element.
- [ ] **Step 2:** `npm run build` → 0 errors.
- [ ] **Step 3:** Smoke BookBuilder + Wrapped at both widths — preview centred, one warm CTA, controls quiet.
- [ ] **Step 4:** Commit `feat(rooms): Artifact-builder anchor sweep`.

### Task 14: Capture / Entity / Form anchor sweep

**Screens:** Compose, DailySentence, PhotoQuick, ThreadCompose, ComposeLetter, FutureLetter, InterviewMode, Family, FamilyDetail, PersonPage, ThreadDetail, Onboarding, QuickWizard, Join, Invite, Settings, Billing, Login, Signup, Forgot/Reset, VerifyEmail, all Gift/*.

- [ ] **Step 1:** `RoomHeader` for the title block; forms as `RoomSection` groups with hairline rows and inline controls (no cards, no boxes); capture screens use `CapturePills` where Write/Speak both apply. Compose already wires `VoiceRefine` — leave its logic, only normalise header/section styling. Family list uses `RoomRow` with the member dye (no avatar circles). Settings = mono section labels + hairline rows + inline controls. One question per view for Onboarding/wizard.
- [ ] **Step 2:** `npm run build` → 0 errors.
- [ ] **Step 3:** Smoke Compose, Family, Settings, Onboarding, Login at both widths.
- [ ] **Step 4:** Commit `feat(rooms): Capture/Entity/Form anchor sweep`.

### Task 15: Ask / Search / MemoryMap distinct heroes

**Screens:** Ask (QandA chat), Search, MemoryMap.

- [ ] **Step 1:** Ask — `RoomHeader` (eyebrow `ask the bloodline`), a single underlined question input, serif answer with faint mono woven-from citations. Search — one underlined field, results grouped under `RoomSection` labels (Memories / Letters / Voices) with `RoomRow`. MemoryMap — `RoomHeader` + the existing map, restyled labels/place rows to the system. Preserve all query logic.
- [ ] **Step 2:** `npm run build` → 0 errors.
- [ ] **Step 3:** Smoke Ask, Search, MemoryMap at both widths.
- [ ] **Step 4:** Commit `feat(rooms): Ask/Search/MemoryMap heroes`.

---

## Phase 4 — Marketing / status text-layout pass

**Screens:** Landing, Pricing, Founder, Showcase, /for/*, FoundersWall, LegacyPlan, Help, Contact, Privacy, Terms, public Memorials; Offline, NotFound, *Success, *Redeem, Threshold, Unlock, Admin.

Primitives/legibility only — no structural redesign of marketing/legal pages. Apply `RoomHeader` for titles, the type scale + tokens, and the veil `room` mode (already automatic from Task 6). Ensure each is legible at ~390px and ~1280px.

### Task 16: Marketing + status pass

- [ ] **Step 1:** Apply `RoomHeader` + token/type normalisation to each listed screen. Landing keeps its hero composition; only ensure type scale, one warm accent, and negative space comply. Legal pages: reading measure capped (`maxWidth: '68ch'`), `hl-serif` body.
- [ ] **Step 2:** `npm run build` → 0 errors.
- [ ] **Step 3:** Smoke Landing, Pricing, Privacy, NotFound, Offline at both widths.
- [ ] **Step 4:** Commit `feat(rooms): marketing + status text-layout pass`.

---

## Phase 5 — Responsive/desktop verification + final deploy

### Task 17: Desktop/responsive audit

- [ ] **Step 1:** At ~1280px, verify each anchor: Capture/home centred max-width column; Thread/List lists capped (no full-bleed rows); Reading-room measure ≤64ch centred; Artifact-builder preview centred. 60–70% negative space preserved. Fix any anchor that full-bleeds or breaks the measure.
- [ ] **Step 2:** At ~390px (PWA), re-verify the same anchors read correctly (phone-first renders are the reference).
- [ ] **Step 3:** `npm run build` → 0 errors. Commit any fixes `fix(rooms): responsive/desktop measure + max-width`.

### Task 18: Final deploy gate

- [ ] **Step 1:** Full `npm run build` → 0 errors.
- [ ] **Step 2:** Bump `public/sw.js` `CACHE` to the next version.
- [ ] **Step 3:** Push branch + open PR (on user request). PR body summarises the design-system pass, the four anchors, the veil fix, the capture redesign, and the Record transcription wiring.
- [ ] **Step 4:** After merge/deploy, smoke live `heirloom.blue`: hard-reload to pick up the new SW; spot-check one screen per anchor + `/loom/pwa` + Record transcription, on phone and desktop widths.

---

## Self-Review

**Spec coverage:** veil-per-route (Task 6) ✓ · Room primitives — Header/Section/CapturePills/Row (Tasks 1–5) ✓ · four anchors mapped to all 89 screens (Tasks 11–16) ✓ · `/loom/pwa` capture redesign layout C (Task 8) ✓ · Listener rotation every open + reroll (Task 7) ✓ · voice→text on Speak/Record (Task 9) ✓ · Write/Compose already wired — left intact (Task 14 note) ✓ · web+desktop responsive (Task 17) ✓ · no worker/DB schema changes ✓ · SW cache bump on deploy (Tasks 10, 18) ✓.

**Placeholder scan:** Net-new code (Tasks 1–9) is complete and concrete. The anchor sweep (Tasks 11–16) is a documented mechanical transform with a worked before/after example rather than 89 full screen rewrites — this is deliberate: the screens differ only in their existing data/content, which must be preserved verbatim, so the instruction is "apply this exact transform, change nothing else." Per-group build + smoke gates catch regressions.

**Type consistency:** `useListener()` returns `{ prompt, reroll }` (Task 7) — Task 8 destructures it and threads `reroll` into `AuthHome`; all other call sites updated in Task 7 Step 4. `RoomRow` prop is `dye?: string` (key, not resolved color) — consumers pass `e.dye`. `CapturePills` href props default to `/compose` and `/record`. `RoomHeader` title/eyebrow/lede are `ReactNode`. Primitive names match across barrel (Task 5) and all consumers.

**Testing-gap note:** No component test runner exists in this tree; per-task gate is `npm run build` (strict tsc + vite) + manual smoke, plus a pure-logic Node assertion for the one piece of non-trivial logic (Listener rotation, Task 7). Stated up front in the header.
