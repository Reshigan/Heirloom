# Wave 1 Nav Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5-item bottom nav (cloth | compose | ∞ | letters | listen) with (cloth | memory | ∞ | letter | voice), routing "letter" to a new LetterRoom page and "voice" to a new VoiceRoom page with inline playback. Authors can always edit their letters and voice threads regardless of sealed status.

**Architecture:** Six independent changes applied in order — one worker edit, one nav relabel, one ComposeLetter edit-mode addition, two new loom pages (LetterRoom + VoiceRoom), and one App.tsx route registration. Each step compiles clean before moving to the next.

**Tech Stack:** React 18, TypeScript, Vite, React Query (`@tanstack/react-query`), Zustand authStore, Cloudflare Worker (Hono), D1 SQL. CSS via inline styles following existing loom patterns (0px radius, no icon libs, dye left-border only).

---

## File Map

| Action | File |
|---|---|
| Modify | `cloudflare/worker/src/routes/letters.ts` |
| Modify | `cloudflare/frontend/src/loom/components/BottomNav.tsx` |
| Modify | `cloudflare/frontend/src/pages/ComposeLetter.tsx` |
| Create | `cloudflare/frontend/src/loom/pages/LetterRoom.tsx` |
| Create | `cloudflare/frontend/src/loom/pages/VoiceRoom.tsx` |
| Modify | `cloudflare/frontend/src/App.tsx` |

---

## Task 1: Worker — allow author edits on sealed letters

**Files:**
- Modify: `cloudflare/worker/src/routes/letters.ts:315-317`

Background: The PATCH `/:id` route currently returns 403 if the letter is sealed (`if (existing.sealed_at)`). Per product spec, the author owns the letter permanently — "sealed" is a delivery constraint for the recipient, not an edit lock for the author.

- [ ] **Step 1: Remove the sealed-letter guard**

Open `cloudflare/worker/src/routes/letters.ts`. Find and delete lines 315–317 (the sealed check):

```typescript
// REMOVE these three lines:
  if (existing.sealed_at) {
    return c.json({ error: 'Cannot edit a sealed letter' }, 403);
  }
```

The file around that area should now read:

```typescript
lettersRoutes.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const letterId = c.req.param('id');
  const body = await c.req.json();
  
  // Verify ownership (a soft-deleted letter is also un-editable)
  const existing = await c.env.DB.prepare(`
    SELECT * FROM letters WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `).bind(letterId, userId).first();

  if (!existing) {
    return c.json({ error: 'Letter not found' }, 404);
  }

  // Note: sealed_at check intentionally removed — authors can always edit their letters.
  // Sealed status controls RECIPIENT access, not author write access.

  const { title, salutation, body: letterBody, signature, deliveryTrigger, scheduledDate, recipientIds, encrypted, encryption_iv } = body;
```

- [ ] **Step 2: Commit**

```bash
git add cloudflare/worker/src/routes/letters.ts
git commit -m "fix(worker): allow author edits on sealed letters

Sealed status is a delivery constraint, not an edit lock. Authors
can always update their own letters regardless of seal state."
```

---

## Task 2: BottomNav — rename labels and update routes

**Files:**
- Modify: `cloudflare/frontend/src/loom/components/BottomNav.tsx:7,14-19`

- [ ] **Step 1: Update the NAV array and comment**

Replace the entire top section of the file (`BottomNav.tsx`) from the comment through the NAV constant:

```typescript
/**
 * BottomNav — the persistent 5-item typographic bar at the foot of the
 * authenticated loom PWA shell.
 *
 * Five destinations: cloth · memory · ∞ (home) · letter · voice.
 * The ∞ center item is the only mark — no icons, per §2.6.
 * Anchored above the iPhone home indicator via env(safe-area-inset-bottom).
 * Active route: bone. Inactive: bone at 32% opacity.
 * Center ∞: warm when active, warm at 50% opacity when inactive.
 */

const NAV = [
  { label: 'cloth',  href: '/loom/weft' },
  { label: 'memory', href: '/loom/compose' },
  { label: '∞',      href: '/loom/pwa',    center: true },
  { label: 'letter', href: '/loom/letter' },
  { label: 'voice',  href: '/loom/voice' },
] as const;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd cloudflare/frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/components/BottomNav.tsx
git commit -m "feat(nav): rename compose→memory, letters→letter, listen→voice

Clarifies creation intent in nav labels. letter/voice now route to
new room pages (tasks 4–5). /loom/echo remains accessible via Today."
```

---

## Task 3: ComposeLetter — add edit mode via `?id=` URL param

**Files:**
- Modify: `cloudflare/frontend/src/pages/ComposeLetter.tsx`

Background: ComposeLetter currently only creates new letters. The LetterRoom will navigate to `/loom/compose-letter?id=:letterId` to edit. This task wires that up.

- [ ] **Step 1: Add `useSearchParams` to imports**

At the top of `ComposeLetter.tsx`, the import from `react-router-dom` currently reads:
```typescript
import { useNavigate } from 'react-router-dom';
```

Change it to:
```typescript
import { useNavigate, useSearchParams } from 'react-router-dom';
```

- [ ] **Step 2: Extract `letterId` from URL + load existing letter**

After the `const queryClient = useQueryClient();` line, add:

```typescript
  const [searchParams] = useSearchParams();
  const letterId = searchParams.get('id');
```

Then add a query to load the existing letter when editing (place after the `members` derivation, before `sealedUntil`):

```typescript
  const { data: existingLetter } = useQuery({
    queryKey: ['letter', letterId],
    queryFn: () => lettersApi.getOne(letterId!).then((r) => r.data),
    enabled: !!letterId,
  });
```

- [ ] **Step 3: Populate state from existing letter**

After the `const [error, setError] = useState<string | null>(null);` line, add a `useEffect` that seeds state when the existing letter loads. Add the `useEffect` import to the existing React import if not already present:

```typescript
// Add useEffect to the React import line if missing:
import { useMemo, useState, useEffect } from 'react';
```

Then add:

```typescript
  useEffect(() => {
    if (!existingLetter) return;
    if (existingLetter.salutation) setSalutation(existingLetter.salutation);
    if (existingLetter.body) setBody(existingLetter.body);
    if (existingLetter.signature) setSignature(existingLetter.signature);
    if (existingLetter.scheduledDate) setScheduledDate(existingLetter.scheduledDate);
    const trigger = existingLetter.deliveryTrigger;
    if (trigger === 'SCHEDULED') setDeliveryTrigger('date');
    else if (trigger === 'AFTER_DEATH') setDeliveryTrigger('death');
    else if (trigger === 'MILESTONE') setDeliveryTrigger('milestone');
    else setDeliveryTrigger('now');
    // Select recipient by ID match
    if (existingLetter.recipients?.[0]?.id && members.length > 0) {
      const idx = members.findIndex((m: FamilyMember) => m.id === existingLetter.recipients[0].id);
      if (idx !== -1) setRecipientIdx(idx);
    }
  }, [existingLetter, members]);
```

- [ ] **Step 4: Update `persist()` to use update when editing**

Find the `persist` function. It currently calls `lettersApi.create(...)`. Change it to:

```typescript
  const persist = async (seal: boolean) => {
    const trigger =
      deliveryTrigger === 'date' && scheduledDate
        ? 'SCHEDULED'
        : deliveryTrigger === 'death'
          ? 'AFTER_DEATH'
          : deliveryTrigger === 'milestone'
            ? 'MILESTONE'
            : 'IMMEDIATE';
    const payload = {
      title: salutation.trim() || 'A letter',
      salutation: salutation.trim() || null,
      body: body.trim(),
      signature: signature.trim() || null,
      deliveryTrigger: trigger,
      scheduledDate: trigger === 'SCHEDULED' ? scheduledDate : null,
      recipientIds: recipient ? [recipient.id] : [],
    };
    let data: any;
    if (letterId) {
      const res = await lettersApi.update(letterId, payload);
      data = res.data;
      // Only seal if not already sealed
      if (seal && !existingLetter?.sealedAt) {
        await lettersApi.seal(letterId);
      }
    } else {
      const res = await lettersApi.create(payload);
      data = res.data;
      if (seal && data?.id) {
        await lettersApi.seal(data.id);
      }
    }
    return data;
  };
```

- [ ] **Step 5: Update post-save navigation to go to /loom/letter**

Find the `draft` mutation's `onSuccess` and the `seal` mutation's `onSuccess`. Both currently call `navigate('/letters')`. Change both to `navigate('/loom/letter')`.

The `draft` mutation becomes:
```typescript
  const draft = useMutation({
    mutationFn: () => persist(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-user-check-letters'] });
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
      navigate('/loom/letter');
    },
    onError: (e: any) =>
      setError(e?.response?.data?.error ?? 'Could not save the letter.'),
  });
```

The `seal` mutation `onSuccess` similarly:
```typescript
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-user-check-letters'] });
      queryClient.invalidateQueries({ queryKey: ['letters'] });
      queryClient.invalidateQueries({ queryKey: ['weft-letters'] });
      navigate('/loom/letter');
    },
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd cloudflare/frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add cloudflare/frontend/src/pages/ComposeLetter.tsx
git commit -m "feat(compose-letter): add edit mode via ?id= URL param

Loads existing letter, populates fields, calls update instead of
create. Post-save navigates to /loom/letter (the new Letter Room)."
```

---

## Task 4: Create LetterRoom page

**Files:**
- Create: `cloudflare/frontend/src/loom/pages/LetterRoom.tsx`

This page lists the authenticated user's letters (all authored by them — sealed, draft, delivered) with inline read expansion and an edit link. A CTA at top navigates to ComposeLetter.

- [ ] **Step 1: Create the file**

Create `cloudflare/frontend/src/loom/pages/LetterRoom.tsx` with the following content:

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../components/ClothShell';
import { lettersApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const DYE_HEX: Record<string, string> = {
  madder: '#c0614a', indigo: '#3d5a8a', weld: '#d4a843',
  saffron: '#e8a825', kermes: '#9e3a5a', walnut: '#7a5c3a',
  oakgall: '#5a4a3a', woad: '#5b7fa6', cochineal: '#b84060', iron: '#4a4a4a',
};
const DYE_KEYS = Object.keys(DYE_HEX);

function dyeFor(id: string): string {
  const h = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  return DYE_HEX[DYE_KEYS[Math.abs(h) % DYE_KEYS.length]];
}

function statusLabel(letter: Letter): string {
  if (!letter.sealedAt) return 'draft';
  return 'sealed';
}

interface Letter {
  id: string;
  title: string;
  salutation: string | null;
  bodyPreview: string;
  signature: string | null;
  deliveryTrigger: string;
  scheduledDate: string | null;
  sealedAt: string | null;
  recipients: Array<{ id: string; name: string; relationship: string }>;
  createdAt: string;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

export function LetterRoom() {
  const { isAuthenticated } = useAuthStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () => lettersApi.getAll({ limit: 200 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const letters: Letter[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray(data)
    ? (data as any)
    : [];

  const topbarLeft = (
    <Link
      to="/loom/weft"
      style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none',
      }}
    >
      ← cloth
    </Link>
  );

  return (
    <ClothShell topbarLeft={topbarLeft} topbarCenter="letters">
      {/* Hairline loading bar */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--warm)', opacity: isLoading ? 0.6 : 0,
          transition: 'opacity 360ms', zIndex: 30, pointerEvents: 'none',
        }}
      />

      <div style={{ padding: 'clamp(24px, 5vw, 48px)', paddingBottom: 120, maxWidth: 680 }}>
        {/* CTA */}
        <Link
          to="/loom/compose-letter"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderLeft: '2px solid var(--warm)', padding: '10px 14px',
            marginBottom: 28, textDecoration: 'none',
          }}
        >
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--warm)',
          }}>
            seal a new letter
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)' }}>→</span>
        </Link>

        {/* Empty state */}
        {!isLoading && letters.length === 0 && (
          <div style={{ paddingTop: 40 }}>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: '0 0 4px',
            }}>
              There is someone who needs to read this.
            </p>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0,
            }}>
              Just not yet.
            </p>
          </div>
        )}

        {/* Letter list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {letters.map((letter) => {
            const dye = dyeFor(letter.id);
            const recipientName = letter.recipients?.[0]?.name ?? null;
            const isExpanded = expandedId === letter.id;
            const status = statusLabel(letter);

            return (
              <div
                key={letter.id}
                style={{
                  borderLeft: `3px solid ${dye}`,
                  borderBottom: '1px solid rgba(244,236,216,0.06)',
                  padding: '10px 14px',
                  transition: `background 180ms ${EASE}`,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'rgba(244,236,216,0.35)',
                  }}>
                    {recipientName ? `to: ${recipientName}` : 'no recipient'} · {status}
                  </span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : letter.id)}
                      style={{
                        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase', color: 'rgba(244,236,216,0.4)',
                        borderBottom: '1px solid rgba(244,236,216,0.15)',
                      }}
                    >
                      {isExpanded ? 'close' : 'read'}
                    </button>
                    <Link
                      to={`/loom/compose-letter?id=${letter.id}`}
                      style={{
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase', color: 'rgba(176,122,74,0.7)',
                        textDecoration: 'none', borderBottom: '1px solid rgba(176,122,74,0.25)',
                      }}
                    >
                      edit
                    </Link>
                  </div>
                </div>

                {/* Title */}
                <p style={{
                  fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                  fontWeight: 300, color: 'rgba(244,236,216,0.55)', lineHeight: 1.5, margin: '4px 0 0',
                }}>
                  {letter.salutation || letter.title}
                </p>

                {/* Delivery metadata */}
                {letter.scheduledDate && (
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'rgba(244,236,216,0.2)',
                    display: 'block', marginTop: 3,
                  }}>
                    delivery: {new Date(letter.scheduledDate).toLocaleDateString()}
                  </span>
                )}

                {/* Expanded body */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 12, paddingTop: 12,
                      borderTop: '1px solid rgba(244,236,216,0.08)',
                      animation: `hl-fade-in 360ms ${EASE}`,
                    }}
                  >
                    <p style={{
                      fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 300,
                      color: 'var(--bone-dim)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap',
                    }}>
                      {letter.bodyPreview}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ClothShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd cloudflare/frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/LetterRoom.tsx
git commit -m "feat(loom): add LetterRoom page

Lists authored letters with inline read expand and edit link.
CTA routes to /loom/compose-letter (new letter) or ?id= (edit).
Replaces reading-room as the 'letter' nav destination."
```

---

## Task 5: Create VoiceRoom page

**Files:**
- Create: `cloudflare/frontend/src/loom/pages/VoiceRoom.tsx`

Lists voice recordings with inline HTML5 playback and inline title editing. CTA navigates to `/record`.

Note on voice response shape (from `voiceApi.getAll()`):
- `data.data[]` — array of recordings
- Each recording: `{ id, title, description, fileUrl, duration, transcript, createdAt, updatedAt }`
- `fileUrl` is the playable audio URL (authenticated via worker `/api/voice/file/...`)
- `duration` is in seconds (number or null)

- [ ] **Step 1: Create the file**

Create `cloudflare/frontend/src/loom/pages/VoiceRoom.tsx` with the following content:

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../components/ClothShell';
import { voiceApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

const DYE_HEX: Record<string, string> = {
  madder: '#c0614a', indigo: '#3d5a8a', weld: '#d4a843',
  saffron: '#e8a825', kermes: '#9e3a5a', walnut: '#7a5c3a',
  oakgall: '#5a4a3a', woad: '#5b7fa6', cochineal: '#b84060', iron: '#4a4a4a',
};
const DYE_KEYS = Object.keys(DYE_HEX);

function dyeFor(id: string): string {
  const h = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  return DYE_HEX[DYE_KEYS[Math.abs(h) % DYE_KEYS.length]];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

interface VoiceRecording {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  duration: number | null;
  transcript: string | null;
  createdAt: string;
}

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

// Abstract waveform bars (deterministic visual texture, not real audio data)
const WAVEFORM_HEIGHTS = [4, 7, 10, 8, 11, 9, 6, 8, 10, 5, 4, 7];

export function VoiceRoom() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['voice'],
    queryFn: () => voiceApi.getAll({ limit: 200 }).then((r) => r.data),
    enabled: isAuthenticated,
  });

  const recordings: VoiceRecording[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray(data)
    ? (data as any)
    : [];

  const updateTitle = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      voiceApi.update(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice'] });
      setEditingId(null);
    },
  });

  const topbarLeft = (
    <Link
      to="/loom/weft"
      style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none',
      }}
    >
      ← cloth
    </Link>
  );

  return (
    <ClothShell topbarLeft={topbarLeft} topbarCenter="voice">
      {/* Hairline loading bar */}
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 1,
          background: 'var(--warm)', opacity: isLoading ? 0.6 : 0,
          transition: 'opacity 360ms', zIndex: 30, pointerEvents: 'none',
        }}
      />

      <div style={{ padding: 'clamp(24px, 5vw, 48px)', paddingBottom: 120, maxWidth: 680 }}>
        {/* CTA */}
        <Link
          to="/record"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderLeft: '2px solid var(--warm)', padding: '10px 14px',
            marginBottom: 28, textDecoration: 'none',
          }}
        >
          <span style={{
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--warm)',
          }}>
            record a voice thread
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)' }}>→</span>
        </Link>

        {/* Empty state */}
        {!isLoading && recordings.length === 0 && (
          <div style={{ paddingTop: 40 }}>
            <p style={{
              fontFamily: 'var(--serif)', fontSize: 17, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--bone-faint)', lineHeight: 1.7, margin: 0,
            }}>
              Record your voice. Your family will hear it long after you're gone.
            </p>
          </div>
        )}

        {/* Recording list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recordings.map((rec) => {
            const dye = dyeFor(rec.id);
            const isPlaying = playingId === rec.id;
            const isEditing = editingId === rec.id;

            return (
              <div
                key={rec.id}
                style={{
                  borderLeft: `3px solid ${dye}`,
                  borderBottom: '1px solid rgba(244,236,216,0.06)',
                  padding: '10px 14px',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'rgba(244,236,216,0.35)',
                  }}>
                    you · {formatDuration(rec.duration)}
                  </span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Play/stop toggle */}
                    <button
                      type="button"
                      onClick={() => setPlayingId(isPlaying ? null : rec.id)}
                      aria-label={isPlaying ? 'stop' : 'play'}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(244,236,216,0.2)',
                        padding: '2px 7px', cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontSize: 9,
                        color: 'rgba(244,236,216,0.5)',
                      }}
                    >
                      {isPlaying ? '■' : '▶'}
                    </button>
                    {/* Edit title */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(rec.id);
                        setEditTitle(rec.title);
                      }}
                      style={{
                        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                        textTransform: 'uppercase', color: 'rgba(176,122,74,0.7)',
                        borderBottom: '1px solid rgba(176,122,74,0.25)',
                      }}
                    >
                      edit
                    </button>
                  </div>
                </div>

                {/* Title or inline edit */}
                {isEditing ? (
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateTitle.mutate({ id: rec.id, title: editTitle });
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      style={{
                        background: 'transparent', border: 0,
                        borderBottom: '1px solid rgba(244,236,216,0.2)',
                        fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                        color: 'var(--bone)', outline: 'none', flex: 1, padding: '2px 0',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => updateTitle.mutate({ id: rec.id, title: editTitle })}
                      style={{
                        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--warm)',
                      }}
                    >
                      save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      style={{
                        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(244,236,216,0.35)',
                      }}
                    >
                      cancel
                    </button>
                  </div>
                ) : (
                  <p style={{
                    fontFamily: 'var(--serif)', fontSize: 13, fontStyle: 'italic',
                    fontWeight: 300, color: 'rgba(244,236,216,0.55)', lineHeight: 1.5,
                    margin: '4px 0 0',
                  }}>
                    {rec.title}
                  </p>
                )}

                {/* Abstract waveform */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 8, height: 14 }}>
                  {WAVEFORM_HEIGHTS.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: 2, height: h,
                        background: isPlaying ? 'var(--warm)' : `rgba(244,236,216,0.18)`,
                        transition: `background 360ms ${EASE}`,
                      }}
                    />
                  ))}
                </div>

                {/* Inline audio player (shown when playing) */}
                {isPlaying && rec.fileUrl && (
                  <audio
                    src={rec.fileUrl}
                    autoPlay
                    controls
                    onEnded={() => setPlayingId(null)}
                    style={{
                      width: '100%', marginTop: 10, height: 32,
                      filter: 'invert(1) hue-rotate(180deg)',
                    }}
                  />
                )}

                {/* Transcript excerpt if available */}
                {rec.transcript && (
                  <p style={{
                    fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em',
                    color: 'rgba(244,236,216,0.25)', lineHeight: 1.6, margin: '6px 0 0',
                    fontStyle: 'italic',
                  }}>
                    {rec.transcript.slice(0, 120)}{rec.transcript.length > 120 ? '…' : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ClothShell>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd cloudflare/frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add cloudflare/frontend/src/loom/pages/VoiceRoom.tsx
git commit -m "feat(loom): add VoiceRoom page

Lists voice recordings with inline ▶ playback (HTML5 audio) and
inline title editing. CTA routes to /record for new recordings.
Waveform is visual texture only (fixed heights, not real data)."
```

---

## Task 6: Wire routes in App.tsx

**Files:**
- Modify: `cloudflare/frontend/src/App.tsx`

- [ ] **Step 1: Add lazy imports**

Find the block of loom lazy imports around line 98–104. After `LoomReadingRoom` import, add:

```typescript
const LoomLetterRoom = lazy(() => import('./loom/pages/LetterRoom').then(m => ({ default: m.LetterRoom })));
const LoomVoiceRoom  = lazy(() => import('./loom/pages/VoiceRoom').then(m => ({ default: m.VoiceRoom })));
```

Also add a lazy import for ComposeLetter (it is NOT yet imported in App.tsx):

```typescript
const LoomComposeLetter = lazy(() => import('./pages/ComposeLetter').then(m => ({ default: m.ComposeLetter })));
```

- [ ] **Step 2: Add routes**

Find the loom routes section around line 516–526. After the existing `/loom/read` route, add the three new routes:

```typescript
          <Route path="/loom/letter"         element={<ProtectedRoute><LoomLetterRoom /></ProtectedRoute>} />
          <Route path="/loom/voice"          element={<ProtectedRoute><LoomVoiceRoom /></ProtectedRoute>} />
          <Route path="/loom/compose-letter" element={<ProtectedRoute><LoomComposeLetter /></ProtectedRoute>} />
```

Replace `LoomComposeLetter` with whatever name you used for the ComposeLetter import in Step 1.

- [ ] **Step 3: Build to verify no errors**

```bash
cd cloudflare/frontend && npm run build
```

Expected: tsc + vite build completes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add cloudflare/frontend/src/App.tsx
git commit -m "feat(routes): add /loom/letter, /loom/voice, /loom/compose-letter routes

Wires LetterRoom, VoiceRoom, and ComposeLetter (edit mode) into the
loom routing tree. BottomNav already points to these destinations."
```

---

## Task 7: End-to-end visual verification

- [ ] **Step 1: Start the dev server**

```bash
cd cloudflare/frontend && npm run dev
```

Navigate to `http://localhost:5173/loom/pwa` and log in if needed.

- [ ] **Step 2: Verify nav labels**

The bottom nav should show: `cloth` · `memory` · `∞` · `letter` · `voice`.

If you still see `compose`, `letters`, or `listen` — check BottomNav.tsx was saved correctly.

- [ ] **Step 3: Verify Letter Room**

Tap `letter` in the nav. Expect:
- `← cloth` in topbar left, `letters` in topbar center
- Warm-border CTA: `seal a new letter →`
- If letters exist: list rows with dye left-borders, `read` + `edit` affordances
- Tapping `read` expands inline body preview
- Tapping `edit` navigates to `/loom/compose-letter?id=:letterId`
- If no letters: italic serif empty state copy

- [ ] **Step 4: Verify Voice Room**

Tap `voice` in the nav. Expect:
- `← cloth` in topbar left, `voice` in topbar center
- Warm-border CTA: `record a voice thread →`
- If recordings exist: rows with dye borders, `▶` + `edit` buttons
- Tapping `▶` shows an `<audio>` element below the row and plays
- Tapping `edit` shows inline input with `save` / `cancel` — saving calls the API
- If no recordings: italic serif empty state copy

- [ ] **Step 5: Verify ComposeLetter edit mode**

From a Letter Room row, tap `edit`. Expect:
- ComposeLetter loads with pre-populated fields from the existing letter
- Saving calls PATCH (not POST) — verify in browser DevTools network tab
- After save, navigates back to `/loom/letter`

- [ ] **Step 6: Final build check**

```bash
cd cloudflare/frontend && npm run build
```

Expected: 0 errors.

---

## Scope note: received letters

`lettersApi.getAll()` returns only letters authored by the current user (the worker filters by `user_id`). Letters received from other family members (e.g. "from: Nana · received") require a backend endpoint that doesn't exist yet — a query on `letter_recipients` joined against the current user's family member IDs. This is out of scope for Wave 1. The LetterRoom currently shows authored letters only. Add a `// TODO: received letters — needs GET /letters/received endpoint` comment in LetterRoom.tsx if desired.
