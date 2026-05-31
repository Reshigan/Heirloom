import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { threadsApi, type UpcomingUnlock, type ThreadLockType } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

/**
 * Inbox — Loom-native "Inbox (time-locked)".
 *
 * The surface where entries and letters addressed to you that are
 * still sealed appear: who sealed them, for whom, and when they
 * unlock — the ∞ sealed mark + the unlock date — without ever
 * exposing the sealed body. Already-unlocked items appear above,
 * openable.
 *
 * Real data:
 *   - threadsApi.upcomingUnlocks()  → entry_unlocks resolving in the
 *     window, scoped to the caller (the locked rows). Metadata only;
 *     the worker never returns the ciphertext body here.
 *   - threadsApi.recentUnlocks()    → locks that have already opened,
 *     openable by linking through to the entry on its thread.
 *
 * §1.5(B) the append-only counter / §6 the Sealed Note: locked items
 * show metadata + unlock date only, never the sealed body.
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

/**
 * The natural-dye palette (§2.7) — the only place a dye color is allowed.
 * We map a real `dye` value coming off an item to its CSS var; we NEVER
 * invent one. If an item carries no dye (the current API does not surface
 * one on sealed/recent unlocks), the lead cell renders empty — honest blank
 * rather than a fabricated stripe.
 */
const DYE_VARS: Record<string, string> = {
  madder: 'var(--dye-madder)',
  cochineal: 'var(--dye-cochineal)',
  kermes: 'var(--dye-kermes)',
  saffron: 'var(--dye-saffron)',
  weld: 'var(--dye-weld)',
  walnut: 'var(--dye-walnut)',
  oakgall: 'var(--dye-oakgall)',
  woad: 'var(--dye-woad)',
  indigo: 'var(--dye-indigo)',
  iron: 'var(--dye-iron)',
};

/** A 14×2 dye swatch — rendered ONLY when a real dye value is present. */
function DyeSwatch({ dye }: { dye?: string | null }) {
  const color = dye ? DYE_VARS[dye.toLowerCase()] : undefined;
  return (
    <span
      aria-hidden
      style={{ width: 14, height: 2, alignSelf: 'center', background: color ?? 'transparent' }}
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

  const sealed = upcomingQ.data ?? [];
  const opened = recentQ.data ?? [];
  const loading = upcomingQ.isLoading || recentQ.isLoading;

  const eyebrow = loading
    ? 'Inbox · time-locked'
    : `Inbox · ${sealed.length} sealed · ${opened.length} unlocked`;

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          {eyebrow}
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          What is waiting.
        </h1>
        <p
          className="loom-body"
          style={{
            fontSize: 17,
            color: 'var(--loom-bone-dim)',
            margin: '14px 0 0',
            maxWidth: 640,
            lineHeight: 1.6,
          }}
        >
          Notes and letters addressed to you, sealed until a moment that has not yet come. The name
          and the date are visible. The words stay closed until the lock resolves.
        </p>
      </header>

      {loading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : sealed.length === 0 && opened.length === 0 ? (
        <Empty />
      ) : (
        <>
          {opened.length > 0 && (
            <section style={{ marginBottom: 44 }}>
              <p className="loom-eyebrow" style={{ marginBottom: 18 }}>
                Unlocked · open now
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {opened.map((u, i) => (
                  <OpenedRow key={u.unlock_id} item={u} first={i === 0} />
                ))}
              </ul>
            </section>
          )}

          {sealed.length > 0 && (
            <section>
              <p className="loom-eyebrow" style={{ marginBottom: 18 }}>
                Sealed · waiting
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sealed.map((u, i) => (
                  <SealedRow key={u.unlock_id} item={u} first={i === 0} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </AppFrame>
  );
}

/* ── An already-opened item: metadata + a link through to the entry ── */
function OpenedRow({ item, first }: { item: RecentUnlock; first: boolean }) {
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 44px 1fr 200px',
        gap: 24,
        padding: '22px 0',
        alignItems: 'baseline',
        borderTop: first ? '1px solid var(--loom-rule)' : 0,
        borderBottom: '1px solid var(--loom-rule)',
      }}
    >
      <DyeSwatch dye={item.dye} />
      <span
        aria-hidden
        className="loom-serif"
        style={{ color: 'var(--loom-warm)', fontSize: 24, lineHeight: 1, fontWeight: 300 }}
      >
        ∞
      </span>
      <div>
        <p
          className="loom-mono"
          style={{
            margin: '0 0 6px',
            fontSize: 9.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
          }}
        >
          {item.thread_name}
        </p>
        <Link
          to={`/threads/${item.thread_id}`}
          className="loom-serif"
          style={{
            fontSize: 18,
            color: 'var(--loom-warm)',
            fontWeight: 400,
            textDecoration: 'none',
          }}
        >
          {item.entry_title ?? 'An entry has opened'}
        </Link>
        {item.resolution_note ? (
          <p
            className="loom-serif"
            style={{
              margin: '4px 0 0',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--loom-bone-dim)',
              fontWeight: 400,
            }}
          >
            {item.resolution_note}
          </p>
        ) : null}
      </div>
      <div style={{ textAlign: 'right' }}>
        <p
          className="loom-mono"
          style={{
            margin: '0 0 6px',
            fontSize: 9.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
          }}
        >
          Unlocked
        </p>
        <p
          className="loom-mono"
          style={{ margin: 0, fontSize: 12, letterSpacing: '0.06em', color: 'var(--loom-warm)' }}
        >
          {formatDate(item.resolved_at)}
        </p>
        <Link
          to={`/threads/${item.thread_id}`}
          className="loom-mono"
          style={{
            display: 'inline-block',
            marginTop: 8,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-dim)',
            textDecoration: 'none',
          }}
        >
          open →
        </Link>
      </div>
    </li>
  );
}

/* ── A sealed item: ∞ + recipient + unlock date. Never the body. ── */
function SealedRow({ item, first }: { item: UpcomingUnlock; first: boolean }) {
  const unlockLabel = sealedUntilLabel(item);
  const relative = relativeLabel(item);
  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 44px 1fr 1fr 1.1fr',
        gap: 24,
        padding: '22px 0',
        alignItems: 'baseline',
        borderTop: first ? '1px solid var(--loom-rule)' : 0,
        borderBottom: '1px solid var(--loom-rule)',
      }}
    >
      <DyeSwatch dye={(item as UpcomingUnlock & { dye?: string | null }).dye} />
      <span
        aria-hidden
        className="loom-serif"
        style={{ color: 'var(--loom-bone-dim)', fontSize: 24, lineHeight: 1, fontWeight: 300 }}
      >
        ∞
      </span>

      {/* thread + entry title (the public face of a sealed note) */}
      <div>
        <p
          className="loom-mono"
          style={{
            margin: '0 0 6px',
            fontSize: 9.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
          }}
        >
          On
        </p>
        <p
          className="loom-serif"
          style={{ margin: 0, fontSize: 16, color: 'var(--loom-bone)', fontWeight: 400 }}
        >
          {item.thread_name}
        </p>
        {item.entry_title ? (
          <p
            className="loom-serif"
            style={{
              margin: '4px 0 0',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--loom-bone-dim)',
              fontWeight: 400,
            }}
          >
            {item.entry_title}
          </p>
        ) : null}
      </div>

      {/* for whom */}
      <div>
        <p
          className="loom-mono"
          style={{
            margin: '0 0 6px',
            fontSize: 9.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
          }}
        >
          For
        </p>
        <p
          className="loom-serif"
          style={{ margin: 0, fontSize: 17, color: 'var(--loom-bone)', fontWeight: 400 }}
        >
          {item.target_name ?? lockKindLabel(item.lock_type)}
        </p>
      </div>

      {/* when it unlocks */}
      <div style={{ textAlign: 'right' }}>
        <p
          className="loom-mono"
          style={{
            margin: '0 0 6px',
            fontSize: 9.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
          }}
        >
          Sealed until
        </p>
        <p
          className="loom-mono"
          style={{ margin: 0, fontSize: 12, letterSpacing: '0.06em', color: 'var(--loom-bone)' }}
        >
          {unlockLabel}
        </p>
        {relative ? (
          <p
            className="loom-mono"
            style={{
              margin: '4px 0 0',
              fontSize: 10,
              letterSpacing: '0.06em',
              color: 'var(--loom-bone-faint)',
            }}
          >
            {relative}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function Empty() {
  return (
    <div style={{ padding: '60px 36px', border: '1px solid var(--loom-rule)', textAlign: 'center' }}>
      <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
        Nothing is waiting
      </p>
      <h2
        className="loom-serif"
        style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 18px' }}
      >
        No one has sealed a note for you yet.
      </h2>
      <p
        className="loom-body"
        style={{ fontSize: 15, color: 'var(--loom-bone-dim)', maxWidth: 520, margin: '0 auto 22px' }}
      >
        When a member of one of your threads seals a letter or entry addressed to you, it appears
        here — closed, with only the name and the date showing — until its lock resolves.
      </p>
      <Link to="/letters/new" className="loom-btn" style={{ textDecoration: 'none' }}>
        seal one yourself
      </Link>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function lockKindLabel(lock: ThreadLockType): string {
  switch (lock) {
    case 'GENERATION':
      return 'a future generation';
    case 'AUTHOR_DEATH':
      return 'after the author';
    case 'RECIPIENT_EVENT':
      return 'an occasion to come';
    case 'AGE':
      return 'a coming birthday';
    default:
      return 'you';
  }
}

/** The human "sealed until" line — date for DATE locks, an age/event for the rest. */
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
  if (item.lock_type === 'AUTHOR_DEATH') return 'after the author';
  if (item.lock_type === 'GENERATION') return 'a future generation';
  if (item.lock_type === 'RECIPIENT_EVENT') return 'an occasion to come';
  return '—';
}

/** Relative "· in 2 yrs 7 mo" line, computed from whichever date we can resolve. */
function relativeLabel(item: UpcomingUnlock): string | null {
  let target: Date | null = null;
  if (item.lock_type === 'DATE' && item.unlock_date) {
    target = new Date(item.unlock_date);
  } else if (item.lock_type === 'AGE') {
    target = ageUnlockDate(item);
  }
  if (!target || Number.isNaN(target.getTime())) return null;

  const now = new Date();
  let months =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  if (months < 0) return null;
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (yrs === 0 && mo === 0) return 'this month';
  const parts: string[] = [];
  if (yrs > 0) parts.push(`${yrs} yr${yrs === 1 ? '' : 's'}`);
  if (mo > 0) parts.push(`${mo} mo`);
  return `in ${parts.join(' ')}`;
}

/** For an AGE lock, the date the target reaches age_years. */
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
