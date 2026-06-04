import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { threadsApi, memoriesApi, type UpcomingUnlock, type ThreadLockType } from '../services/api';
import { Frame, TapestryEdge } from '../loom/components/Frame';

/**
 * Inbox — Loom 3 native "What is waiting."
 *
 * §1.5(B) / §6 the Sealed Note: locked items expose metadata + unlock date
 * only — never the ciphertext body.
 *
 * Data:
 *   threadsApi.upcomingUnlocks()  → sealed rows (still locked)
 *   threadsApi.recentUnlocks()    → opened rows (lock resolved, linkable)
 */

interface RecentUnlock {
  unlock_id: string;
  lock_type: ThreadLockType;
  resolved_at: string;
  resolution_note: string | null;
  entry_id: string;
  entry_title: string | null;
  thread_id: string;
  entry_created_at: string;
  thread_name: string;
  dye?: string | null;
}

const DYE_VARS: Record<string, string> = {
  madder:    'var(--dye-madder)',
  cochineal: 'var(--dye-cochineal)',
  kermes:    'var(--dye-kermes)',
  saffron:   'var(--dye-saffron)',
  weld:      'var(--dye-weld)',
  walnut:    'var(--dye-walnut)',
  oakgall:   'var(--dye-oakgall)',
  woad:      'var(--dye-woad)',
  indigo:    'var(--dye-indigo)',
  iron:      'var(--dye-iron)',
};

/** 14×2 dye swatch — only rendered when a real dye value is present. */
function DyeSwatch({ dye }: { dye?: string | null }) {
  const color = dye ? DYE_VARS[dye.toLowerCase()] : undefined;
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width: 14,
        height: 2,
        alignSelf: 'center',
        background: color ?? 'transparent',
      }}
    />
  );
}


export function Inbox() {
  const upcomingQ = useQuery({
    queryKey: ['inbox', 'upcoming'],
    queryFn: () =>
      threadsApi
        .upcomingUnlocks(365)
        .then((r) => r.data.upcoming)
        .catch(() => [] as UpcomingUnlock[]),
  });
  const recentQ = useQuery({
    queryKey: ['inbox', 'recent'],
    queryFn: () =>
      threadsApi
        .recentUnlocks(180)
        .then((r) => (r.data.recent as RecentUnlock[]) ?? [])
        .catch(() => [] as RecentUnlock[]),
  });

  const receivedQ = useQuery({
    queryKey: ['inbox', 'received'],
    queryFn: () =>
      memoriesApi
        .received()
        .then((r) => (r.data as any).received ?? [])
        .catch(() => []),
  });

  const sealed = upcomingQ.data ?? [];
  const opened = recentQ.data ?? [];
  const received: { id: string; title: string; type: string; createdAt: string; from: string; metadata: any }[] = receivedQ.data ?? [];
  const loading = upcomingQ.isLoading || recentQ.isLoading;

  return (
    <Frame left="inbox">
      {/* scrollable content column */}
      <div
        style={{
          padding: 'clamp(16px, 4vw, 56px)',
          paddingBottom: 80,
          overflowX: 'hidden',
        }}
      >
        <style>{`
          .inbox-row { grid-template-columns: 14px minmax(0,56px) 1fr 1fr 1.1fr; }
          @media (max-width: 600px) {
            .inbox-row { grid-template-columns: 14px 1fr auto; }
            .inbox-col-hide { display: none; }
          }
        `}</style>
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 'clamp(28px, 6vw, 44px)',
            fontWeight: 300,
            margin: '0 0 40px',
            color: 'var(--bone)',
          }}
        >
          What is waiting.
        </h1>

        {/* ── for you ── */}
        {received.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <p className="hl-eyebrow" style={{ marginBottom: 14, color: 'var(--warm)' }}>
              for you
            </p>
            {received.map((m) => (
              <Link
                key={m.id}
                to={`/memories/${m.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    borderBottom: '1px solid var(--rule)',
                    padding: '14px 0',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 12,
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    <div className="hl-serif" style={{ fontSize: 15, color: 'var(--warm)', fontWeight: 400 }}>
                      {m.title}
                    </div>
                    <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em', marginTop: 3 }}>
                      from {m.from || 'a family member'}
                    </div>
                  </div>
                  <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}

        {loading ? (
          <div style={{ height: 1, background: 'var(--warm)', width: 80, opacity: 0.4, marginTop: 40 }} />
        ) : sealed.length === 0 && opened.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── already opened ── */}
            {opened.length > 0 && (
              <section>
                <p className="hl-eyebrow" style={{ marginBottom: 14 }}>
                  already opened
                </p>
                {opened.map((u) => (
                  <OpenedRow key={u.unlock_id} item={u} />
                ))}
              </section>
            )}

            {opened.length > 0 && sealed.length > 0 && (
              <hr
                className="hl-rule"
                style={{ margin: '32px 0', border: 0, borderTop: '1px solid var(--rule)' }}
              />
            )}

            {/* ── still sealed ── */}
            {sealed.length > 0 && (
              <section>
                <p className="hl-eyebrow" style={{ marginBottom: 14 }}>
                  still sealed
                </p>
                {sealed.map((u) => (
                  <SealedRow key={u.unlock_id} item={u} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </Frame>
  );
}

/* ── Already-opened row ─────────────────────────────────────────────────── */
function OpenedRow({ item }: { item: RecentUnlock }) {
  return (
    <div
      className="inbox-row"
      style={{
        display: 'grid',
        alignItems: 'center',
        borderBottom: '1px solid var(--rule)',
        paddingTop: 14,
        paddingBottom: 14,
        gap: 0,
      }}
    >
      {/* col 1: dye swatch */}
      <DyeSwatch dye={item.dye} />

      {/* col 2: entry title link (warm serif 15px) */}
      <Link
        to={`/threads/${item.thread_id}`}
        className="hl-serif hl-link warm"
        style={{
          fontSize: 15,
          color: 'var(--warm)',
          textDecoration: 'none',
          paddingLeft: 0,
          paddingRight: 12,
        }}
      >
        {item.entry_title ?? 'An entry has opened'}
      </Link>

      {/* col 3: thread name */}
      <span
        className="hl-serif inbox-col-hide"
        style={{ fontSize: 14, color: 'var(--bone-dim)', paddingRight: 12 }}
      >
        {item.thread_name}
      </span>

      {/* col 4: from / resolution note (italic dim) */}
      <span
        className="hl-serif inbox-col-hide"
        style={{
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--bone-dim)',
          paddingRight: 12,
        }}
      >
        {item.resolution_note ?? '—'}
      </span>

      {/* col 5: resolved date (mono 10px bone-faint) */}
      <span
        className="hl-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'var(--bone-faint)',
          textAlign: 'right',
        }}
      >
        {formatDate(item.resolved_at)}
      </span>
    </div>
  );
}

/* ── Still-sealed row ───────────────────────────────────────────────────── */
function SealedRow({ item }: { item: UpcomingUnlock }) {
  const itemWithDye = item as UpcomingUnlock & { dye?: string | null };
  const unlockLabel = sealedUntilLabel(item);
  return (
    <div
      className="inbox-row"
      style={{
        display: 'grid',
        alignItems: 'center',
        borderBottom: '1px solid var(--rule)',
        paddingTop: 14,
        paddingBottom: 14,
        gap: 0,
      }}
    >
      {/* col 1: dye swatch */}
      <DyeSwatch dye={itemWithDye.dye} />

      {/* col 2: ∞ warm 18px serif + sealed title dim */}
      <span style={{ display: 'flex', flexDirection: 'column', paddingRight: 12, gap: 2 }}>
        <span
          aria-hidden
          className="hl-serif"
          style={{ color: 'var(--warm)', fontSize: 18, lineHeight: 1, fontWeight: 300 }}
        >
          ∞
        </span>
        {item.entry_title ? (
          <span
            className="hl-serif"
            style={{
              fontSize: 12,
              color: 'var(--bone-dim)',
              fontStyle: 'italic',
              lineHeight: 1.3,
            }}
          >
            {item.entry_title}
          </span>
        ) : null}
      </span>

      {/* col 3: thread name */}
      <span
        className="hl-serif inbox-col-hide"
        style={{ fontSize: 14, color: 'var(--bone-dim)', paddingRight: 12 }}
      >
        {item.thread_name}
      </span>

      {/* col 4: from (target / lock kind) */}
      <span
        className="hl-serif inbox-col-hide"
        style={{
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--bone-dim)',
          paddingRight: 12,
        }}
      >
        {item.target_name ?? lockKindLabel(item.lock_type)}
      </span>

      {/* col 5: "unlocks {date}" mono warm */}
      <span
        className="hl-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.06em',
          color: 'var(--warm)',
          textAlign: 'right',
        }}
      >
        unlocks {unlockLabel}
      </span>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <p
      className="hl-serif"
      style={{
        fontStyle: 'italic',
        color: 'var(--bone-faint)',
        marginTop: 40,
        textAlign: 'center',
      }}
    >
      Nothing is waiting.
    </p>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function lockKindLabel(lock: ThreadLockType): string {
  switch (lock) {
    case 'GENERATION':    return 'a future generation';
    case 'AUTHOR_DEATH':  return 'after the author';
    case 'RECIPIENT_EVENT': return 'an occasion to come';
    case 'AGE':           return 'a coming birthday';
    default:              return 'you';
  }
}

function sealedUntilLabel(item: UpcomingUnlock): string {
  if (item.lock_type === 'DATE' && item.unlock_date) {
    return formatDate(item.unlock_date);
  }
  if (item.lock_type === 'AGE') {
    const at = ageUnlockDate(item);
    if (at) return formatDate(at.toISOString());
    if (item.age_years != null) return `turns ${item.age_years}`;
    return 'a coming birthday';
  }
  if (item.lock_type === 'AUTHOR_DEATH')    return 'after the author';
  if (item.lock_type === 'GENERATION')      return 'a future generation';
  if (item.lock_type === 'RECIPIENT_EVENT') return 'an occasion to come';
  return '—';
}

function ageUnlockDate(item: UpcomingUnlock): Date | null {
  if (item.age_years == null || !item.target_birth_date) return null;
  const birth = new Date(item.target_birth_date);
  if (Number.isNaN(birth.getTime())) return null;
  const d = new Date(birth);
  d.setFullYear(birth.getFullYear() + item.age_years);
  return d;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export { TapestryEdge };
