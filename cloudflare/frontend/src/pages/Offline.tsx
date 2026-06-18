import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { memoriesApi, voiceApi, getAuthHeaders } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { listVoice, removeVoice, countVoice, type HeldVoice } from '../lib/voiceOfflineQueue';

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
 * On-brand: ∞ is the only mark, Spectral (.loom-serif) is the
 * hero, Space Mono (.loom-mono) for archival labels, ink/bone/warm
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
  const [voiceCount, setVoiceCount] = useState(0);

  // How many voice recordings are holding in IndexedDB. Refresh on mount —
  // the count is set elsewhere (Record.tsx) and only ever shrinks here, since
  // this page can't record. Never throws (countVoice degrades to 0).
  useEffect(() => {
    let alive = true;
    void countVoice().then((n) => { if (alive) setVoiceCount(n); });
    return () => { alive = false; };
  }, []);

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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ink)',
        color: 'var(--bone)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
      }}
    >
      {/* UTILITY archetype: centered, vast air, ∞ mark, serif headline, dim italic, mono warm affordances */}
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '0 22px',
          marginTop: 'clamp(72px, 14vh, 120px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* ∞ mark */}
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(40px, 10vw, 64px)',
            color: 'var(--warm)',
            lineHeight: 1,
            marginBottom: 32,
            display: 'block',
          }}
        >
          ∞
        </span>

        {/* Display headline — Cormorant, hero role (>=24px) */}
        <h1
          style={{
            fontFamily: 'var(--serif-display)',
            fontSize: 'clamp(26px, 6vw, 38px)',
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.016em',
            margin: '0 0 16px',
            color: 'var(--bone)',
          }}
        >
          {PROMPT}
        </h1>

        {/* Serif-italic dim line */}
        <p
          className="loom-serif"
          style={{
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--bone-dim)',
            lineHeight: 1.65,
            margin: '0 0 40px',
            fontWeight: 400,
          }}
        >
          You're offline. Write anyway. The thread holds it here until you reconnect.
        </p>

        {/* Composer — textarea + hold button */}
        <div style={{ width: '100%', textAlign: 'left' }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write it down…"
            rows={3}
            aria-label="Write tonight's entry"
            className="loom-serif"
            style={{
              width: '100%',
              background: 'transparent',
              color: 'var(--bone)',
              border: 0,
              borderBottom: '1px solid var(--rule)',
              borderRadius: 0,
              padding: '10px 0',
              fontSize: 16,
              lineHeight: 1.65,
              resize: 'none',
              outline: 'none',
              caretColor: 'var(--warm)',
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={hold}
              disabled={!draft.trim()}
              className="loom-mono"
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: draft.trim() ? 'pointer' : 'default',
                fontSize: 10,
                color: draft.trim() ? 'var(--warm)' : 'var(--bone-faint)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: draft.trim() ? 1 : 0.5,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              hold it offline →
            </button>
            <span
              className="loom-mono"
              style={{
                fontSize: 9,
                color: 'var(--bone-faint)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {queue.length > 0
                ? `${queue.length} ${queue.length === 1 ? 'entry' : 'entries'} holding`
                : 'not sent until reconnect'}
              {voiceCount > 0
                ? ` · ${voiceCount} ${voiceCount === 1 ? 'voice' : 'voices'} holding`
                : ''}
            </span>
          </div>
        </div>

        {/* Holding queue — only when non-empty */}
        {queue.length > 0 && (
          <div style={{ width: '100%', marginTop: 40, textAlign: 'left' }}>
            <div
              className="loom-mono"
              style={{
                fontSize: 9,
                color: 'var(--bone-faint)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              holding offline · {queue.length}
            </div>
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
                <span
                  style={{
                    width: 12,
                    height: 2,
                    background: `var(--dye-${r.dye})`,
                    alignSelf: 'center',
                  }}
                  aria-hidden
                />
                <span
                  className="loom-serif"
                  style={{
                    fontSize: 14,
                    color: 'var(--bone)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                  }}
                >
                  {r.text}
                </span>
                <span
                  className="loom-mono"
                  style={{
                    fontSize: 9,
                    color: 'var(--bone-faint)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  holding
                </span>
              </div>
            ))}
            <div
              className="loom-mono"
              style={{
                fontSize: 9,
                color: 'var(--bone-faint)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginTop: 14,
              }}
            >
              will sync when connected · no data sent until then
            </div>
          </div>
        )}

        {/* Still available offline */}
        <div style={{ width: '100%', marginTop: 48, textAlign: 'left' }}>
          <div
            className="loom-mono"
            style={{
              fontSize: 9,
              color: 'var(--bone-faint)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            still available · offline
          </div>
          <div
            className="loom-serif"
            style={{
              fontSize: 14,
              lineHeight: 1.85,
              color: 'var(--bone-dim)',
              fontWeight: 400,
            }}
          >
            <div>· write entries (held here until you reconnect)</div>
            <div>· read the last days of the cloth already loaded</div>
            <div>· read every letter you have already opened</div>
            <div>· the listener is silent until reconnect</div>
          </div>
        </div>

        {/* Mono warm home/retry link */}
        <div style={{ marginTop: 56 }}>
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
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            sync · when ready →
          </button>
        </div>

        {/* Offline-since status — mono dim, centered */}
        <div
          className="loom-mono"
          style={{
            marginTop: 10,
            fontSize: 9,
            color: 'var(--bone-faint)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          offline · since {clockTime(since)}
        </div>
      </div>
    </div>
  );
}

export default Offline;

const BATCH_SIZE = 3;

/**
 * uploadHeldVoice — replay the exact Record.tsx upload sequence for one held
 * recording: getUploadUrl → PUT the blob → voiceApi.create (carrying
 * title/transcript/metadata/legacyRecipientIds). On success the caller drops
 * it from the queue; a throw here leaves it queued for the next reconnect.
 */
async function uploadHeldVoice(item: HeldVoice): Promise<void> {
  const { data: upload } = await voiceApi.getUploadUrl({
    filename: item.filename,
    contentType: item.contentType,
  });
  const uploadResponse = await fetch(upload.uploadUrl ?? upload.url, {
    method: 'PUT',
    body: item.blob,
    headers: { 'Content-Type': item.contentType, ...getAuthHeaders() },
  });
  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.status}`);
  }
  await voiceApi.create({
    title: item.title,
    transcript: item.transcript,
    fileKey: upload.fileKey ?? upload.key,
    fileUrl: upload.publicUrl ?? upload.url,
    duration: item.duration,
    fileSize: item.blob.size,
    legacyRecipientIds: item.legacyRecipientIds,
    clientKey: item.clientKey,
    metadata: item.metadata,
  });
}

/**
 * drainVoiceQueue — upload every held recording, removing each on success and
 * leaving failures queued. Sequential (one upload at a time) since each PUTs a
 * blob; no need to hammer S3. Returns the count successfully drained so the
 * caller can invalidate the voice views. Never throws.
 */
async function drainVoiceQueue(active: { current: boolean }): Promise<number> {
  let items: HeldVoice[];
  try {
    items = await listVoice();
  } catch {
    return 0;
  }
  let drained = 0;
  for (const item of items) {
    if (!active.current) break;
    try {
      await uploadHeldVoice(item);
      await removeVoice(item.id);
      drained += 1;
    } catch {
      // Leave it queued — a later reconnect retries.
    }
  }
  return drained;
}

/**
 * useSyncHoldingQueue — when the device transitions from offline → online,
 * drain the holding queue by posting entries to the API in batches of 3.
 * Entries that succeed are removed from localStorage; failed ones stay
 * so they retry on the next reconnect.
 *
 * Returns a triggerSync callback so external callers (e.g. the SW message
 * handler) can force a sync attempt without waiting for an online transition.
 */
function useSyncHoldingQueue(online: boolean): { triggerSync: () => void } {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const wasOfflineRef = useRef(false);
  const isSyncingRef = useRef(false);

  // [SW3] On mount, if the user is authenticated and the queue is non-empty,
  // mark wasOfflineRef so the next online=true effect fires a sync. This
  // recovers entries that were stranded by a 401/token-expiry during a prior
  // offline period — after the user logs back in, the queue will sync.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (readQueue().length > 0) {
      wasOfflineRef.current = true;
      return;
    }
    // Held voice recordings can also be stranded by a 401/token-expiry — once
    // re-authed, mark so the next online effect drains them too.
    let alive = true;
    void countVoice().then((n) => {
      if (alive && n > 0) wasOfflineRef.current = true;
    });
    return () => { alive = false; };
  }, [isAuthenticated]);

  const runSync = useCallback(async (active: { current: boolean }) => {
    if (!isAuthenticated || isSyncingRef.current) return;

    const queue = readQueue();
    const heldVoiceCount = await countVoice();
    if (queue.length === 0 && heldVoiceCount === 0) {
      wasOfflineRef.current = false;
      return;
    }

    isSyncingRef.current = true;

    // [SW1] A queued offline note is freeform text, so it syncs as type: 'TEXT'
    // (a valid memories.type per the DB CHECK + the worker's VALID_TYPES gate).
    // The old 'LETTER' value was rejected by that gate, so offline notes never
    // synced. Identify offline-originated entries via metadata.offline === true.
    const results: PromiseSettledResult<string>[] = [];
    for (let i = 0; i < queue.length; i += BATCH_SIZE) {
      // [SW4] Process in batches of 3 to avoid hammering the API
      const batch = queue.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (entry) => {
          await memoriesApi.create({
            type: 'TEXT',
            title: 'offline note',
            description: entry.text,
            metadata: { offline: true, offlineAt: entry.at, dye: entry.dye },
          });
          return entry.id;
        })
      );
      results.push(...batchResults);
      if (!active.current) break;
    }

    const synced = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value);
    if (synced.length > 0) {
      writeQueue(readQueue().filter((e) => !synced.includes(e.id)));
    }

    // Parallel voice drain — held recordings (IndexedDB blobs) upload via the
    // same getUploadUrl → PUT → create sequence. Runs under the same syncing
    // guard so a single reconnect drains both queues.
    const voiceDrained = active.current ? await drainVoiceQueue(active) : 0;

    isSyncingRef.current = false;
    wasOfflineRef.current = false;

    if (!active.current) return;

    if (synced.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      queryClient.invalidateQueries({ queryKey: ['weft-memories'] });
      queryClient.invalidateQueries({ queryKey: ['new-user-check-memories'] });
    }
    if (voiceDrained > 0) {
      queryClient.invalidateQueries({ queryKey: ['memories-mosaic'] });
      queryClient.invalidateQueries({ queryKey: ['weft-voice'] });
      queryClient.invalidateQueries({ queryKey: ['new-user-check-voice'] });
    }
  }, [isAuthenticated, queryClient]);

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
      return;
    }
    // Guard: only sync on the offline→online transition, and only once at a time
    if (!wasOfflineRef.current || !isAuthenticated || isSyncingRef.current) return;

    const active = { current: true };
    runSync(active);
    return () => { active.current = false; };
  }, [online, isAuthenticated, runSync]);

  // Expose a callback so the SW message handler can force a sync attempt
  const triggerSync = useCallback(() => {
    wasOfflineRef.current = true;
    if (online && isAuthenticated && !isSyncingRef.current) {
      const active = { current: true };
      runSync(active);
    }
  }, [online, isAuthenticated, runSync]);

  return { triggerSync };
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
  const { triggerSync } = useSyncHoldingQueue(online);

  // [SW2] Listen for PROCESS_OFFLINE_QUEUE messages from the service worker.
  // The SW sends this message when the 'hl-queue-sync' background sync fires,
  // relaying it to open clients so the app can drain the queue.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PROCESS_OFFLINE_QUEUE') {
        triggerSync();
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, [triggerSync]);

  if (online) return <>{children}</>;
  return <Offline />;
}
