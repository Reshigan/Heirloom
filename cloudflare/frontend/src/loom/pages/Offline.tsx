import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { memoriesApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

/**
 * Offline — the in-app offline experience, matching the PwaOffline
 * artboard (heirloom-pwa.jsx). Rendered by the shell when
 * `navigator.onLine` is false (see App.tsx wiring note).
 *
 * What it does, honestly:
 *   · shows tonight's prompt and lets you write anyway
 *   · the line you write joins a "holding offline · N" queue persisted
 *     to localStorage — it is NOT sent anywhere while offline, and we
 *     never claim it synced. When the connection returns the shell
 *     swaps back to the live app; a future sync pass (server-driven)
 *     would drain this queue, but this page does not fake that.
 *   · lists what is genuinely still available offline (read from the
 *     SW cache by the rest of the app)
 *   · a status bar showing offline-since + a "sync when ready" hint
 *
 * On-brand: ∞ is the only mark, Source Serif 4 (.loom-serif) is the
 * hero, JetBrains Mono (.loom-mono) for archival labels, ink/bone/warm
 * tokens only, 1px hairlines, 0 radius.
 */

const QUEUE_KEY = 'heirloom-offline-holding';
const SINCE_KEY = 'heirloom-offline-since';

interface HoldingEntry {
  id: string;
  text: string;
  at: number; // epoch ms
  dye: string; // a dye token name, for the leading tick
}

const DYES = ['walnut', 'weld', 'saffron', 'woad', 'madder'] as const;

function readQueue(): HoldingEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(q: HoldingEntry[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* quota / private mode — the line stays in component state regardless */
  }
}

function readSince(): number {
  try {
    const raw = localStorage.getItem(SINCE_KEY);
    if (raw) return Number(raw) || Date.now();
  } catch {
    /* ignore */
  }
  const now = Date.now();
  try {
    localStorage.setItem(SINCE_KEY, String(now));
  } catch {
    /* ignore */
  }
  return now;
}

function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const PROMPT = 'What did you almost forget to write down today?';

export function Offline() {
  const [queue, setQueue] = useState<HoldingEntry[]>(() => readQueue());
  const [draft, setDraft] = useState('');
  const [since] = useState<number>(() => readSince());

  // Clear the offline-since stamp once we're back online so the next
  // outage starts a fresh clock. The shell handles unmounting us.
  useEffect(() => {
    const clearSince = () => {
      try {
        localStorage.removeItem(SINCE_KEY);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('online', clearSince);
    return () => window.removeEventListener('online', clearSince);
  }, []);

  const hold = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const entry: HoldingEntry = {
      id: `h_${Date.now().toString(36)}`,
      text,
      at: Date.now(),
      dye: DYES[queue.length % DYES.length],
    };
    const next = [entry, ...queue];
    setQueue(next);
    writeQueue(next);
    setDraft('');
  }, [draft, queue]);

  const label = (s: string) => (
    <div className="loom-eyebrow" style={{ marginBottom: 12 }}>
      {s}
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--bone)',
        position: 'relative',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
      }}
    >
      {/* header */}
      <div
        style={{
          padding: '24px 22px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span className="loom-serif" style={{ fontSize: 16, color: 'var(--warm)', fontWeight: 300, lineHeight: 1 }} aria-hidden>
            ∞
          </span>
          <span className="loom-mono" style={{ fontSize: 9, color: 'var(--bone-dim)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            offline
          </span>
        </span>
        <span className="loom-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          {queue.length} {queue.length === 1 ? 'entry' : 'entries'} holding
        </span>
      </div>

      {/* tonight's prompt — still writable */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 22px 0' }}>
        {label('tonight · 8 pm')}
        <h1
          className="loom-serif"
          style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 300, margin: 0, letterSpacing: '-0.016em' }}
        >
          {PROMPT}
        </h1>
        <p className="loom-serif" style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--bone-dim)', marginTop: 20, fontWeight: 400, lineHeight: 1.6 }}>
          You're offline. Write anyway. The thread holds it here until you reconnect.
        </p>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write it down…"
          rows={3}
          aria-label="Write tonight's entry"
          className="loom-serif"
          style={{
            width: '100%',
            marginTop: 16,
            background: 'var(--ink-card)',
            color: 'var(--bone)',
            border: '1px solid var(--rule)',
            borderRadius: 0,
            padding: '12px 14px',
            fontSize: 16,
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
          }}
        />
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 18 }}>
          <button type="button" onClick={hold} disabled={!draft.trim()} className="loom-btn" style={{ opacity: draft.trim() ? 1 : 0.5 }}>
            hold it offline <span aria-hidden>→</span>
          </button>
          <span className="loom-mono" style={{ fontSize: 9.5, color: 'var(--bone-faint)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            not sent until you reconnect
          </span>
        </div>
      </div>

      {/* holding queue */}
      {queue.length > 0 && (
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 22px 0' }}>
          {label(`holding offline · ${queue.length}`)}
          {queue.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '12px 1fr auto',
                gap: 10,
                padding: '11px 0',
                borderTop: i === 0 ? '1px solid var(--rule)' : 0,
                borderBottom: '1px solid var(--rule)',
                alignItems: 'baseline',
              }}
            >
              <span style={{ width: 12, height: 2, background: `var(--dye-${r.dye})`, alignSelf: 'center' }} aria-hidden />
              <span className="loom-serif" style={{ fontSize: 14, color: 'var(--bone)', fontWeight: 400, fontStyle: 'italic' }}>
                {r.text}
              </span>
              <span className="loom-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                holding
              </span>
            </div>
          ))}
          <div className="loom-mono" style={{ fontSize: 9.5, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 14 }}>
            will sync when connected · no data sent until then
          </div>
        </div>
      )}

      {/* still available offline */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 22px 0' }}>
        {label('still available · offline')}
        <div className="loom-serif" style={{ fontSize: 13.5, lineHeight: 1.85, color: 'var(--bone-dim)', fontWeight: 400 }}>
          <div>· write entries (held here until you reconnect)</div>
          <div>· read the last days of the cloth already loaded</div>
          <div>· read every letter you have already opened</div>
          <div>· the listener is silent until reconnect</div>
        </div>
      </div>

      {/* status bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 'calc(28px + env(safe-area-inset-bottom))',
          left: 22,
          right: 22,
          maxWidth: 560,
          margin: '0 auto',
          paddingTop: 16,
          borderTop: '1px solid var(--rule)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-dim)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          offline · since {clockTime(since)}
        </span>
        <button
          type="button"
          onClick={() => location.reload()}
          className="loom-mono"
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            fontSize: 10,
            color: 'var(--warm)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          sync · when ready →
        </button>
      </div>
    </div>
  );
}

export default Offline;

/**
 * useSyncHoldingQueue — when the device transitions from offline → online,
 * drain the in-memory holding queue by posting entries to the API.
 * Entries that succeed are removed from localStorage; failed ones stay
 * so they retry on the next reconnect.
 */
function useSyncHoldingQueue(online: boolean): void {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const wasOfflineRef = useRef(false);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
      return;
    }
    // Guard: only sync on the offline→online transition, and only once at a time
    if (!wasOfflineRef.current || !isAuthenticated || isSyncingRef.current) return;

    const queue = readQueue();
    if (queue.length === 0) {
      wasOfflineRef.current = false;
      return;
    }

    let active = true;
    isSyncingRef.current = true;

    Promise.allSettled(
      queue.map(async (entry) => {
        await memoriesApi.create({
          type: 'LETTER',
          title: 'offline note',
          description: entry.text,
          metadata: { offline: true, offlineAt: entry.at, dye: entry.dye },
        });
        return entry.id;
      })
    ).then((results) => {
      // Only update state if the component is still mounted
      isSyncingRef.current = false;
      wasOfflineRef.current = false;
      if (!active) return;
      const synced = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map((r) => r.value);
      if (synced.length > 0) {
        writeQueue(readQueue().filter((e) => !synced.includes(e.id)));
        queryClient.invalidateQueries({ queryKey: ['memories'] });
        queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
        queryClient.invalidateQueries({ queryKey: ['weft-memories'] });
      }
    });

    return () => { active = false; };
  }, [online, isAuthenticated, queryClient]);
}

/**
 * useOnline — tracks navigator.onLine across the connection events.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/**
 * OfflineGate — wrap the app's routed content with this. When the
 * browser goes offline it renders <Offline /> in place of `children`;
 * when the connection returns it renders `children` again. This keeps
 * the offline experience an in-app surface (no full reload needed) and
 * never blocks the online app.
 *
 * Mount it INSIDE the router/shell, wrapping <Routes /> (see App.tsx
 * wiring note). It is itself just a conditional, so it is safe around
 * the whole route tree.
 */
export function OfflineGate({ children }: { children: ReactNode }) {
  const online = useOnline();
  useSyncHoldingQueue(online);
  if (online) return <>{children}</>;
  return <Offline />;
}
