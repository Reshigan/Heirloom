import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { threadsApi, memoriesApi, type UpcomingUnlock, type ThreadLockType } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';

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
        .then((r) => r.data.upcoming),
  });
  const recentQ = useQuery({
    queryKey: ['inbox', 'recent'],
    queryFn: () =>
      threadsApi
        .recentUnlocks(180)
        .then((r) => (r.data.recent as RecentUnlock[]) ?? []),
  });

  const receivedQ = useQuery({
    queryKey: ['inbox', 'received'],
    queryFn: () =>
      memoriesApi
        .received()
        .then((r) => (r.data as any).received ?? []),
  });

  const sealed = upcomingQ.data ?? [];
  const opened = recentQ.data ?? [];
  const received: { id: string; title: string; type: string; createdAt: string; from: string; metadata: any }[] = receivedQ.data ?? [];
  const loading = upcomingQ.isLoading || recentQ.isLoading;
  const hasError = upcomingQ.isError || recentQ.isError || receivedQ.isError;

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'today', to: '/loom/today' }, { label: 'inbox' }]} />}
    >
      {/* scrollable content column */}
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x)',
          paddingBottom: 'var(--page-clear)',
          overflowX: 'hidden',
          maxWidth: 'min(100%, 560px)',
          margin: '0 auto',
        }}
      >
        {/* ── masthead ── */}
        <header style={{ textAlign: 'center', marginBottom: 72 }}>
          <p
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.42em',
              color: 'var(--bone-faint)',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            the inbox
          </p>
          <h1
            className="hl-serif"
            style={{
              fontSize: 'clamp(40px, 11vw, 64px)',
              fontWeight: 400,
              lineHeight: 1,
              color: 'var(--bone)',
              margin: 0,
            }}
          >
            Inbox
          </h1>
        </header>

        {hasError && (
          <p
            className="hl-mono"
            style={{ color: 'var(--danger)', fontSize: 11, margin: '0 0 28px', letterSpacing: '0.14em', textAlign: 'center' }}
          >
            could not load inbox
          </p>
        )}

        {loading && received.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <ProgressHair width={80} />
          </div>
        ) : received.length === 0 && sealed.length === 0 && opened.length === 0 ? (
          <EmptyState />
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: '1px solid var(--rule)' }}>
            {/* ── for you (received) ── */}
            {received.map((m) => (
              <ReceivedRow key={m.id} item={m} />
            ))}

            {/* ── still sealed ── */}
            {sealed.map((u) => (
              <SealedRow key={u.unlock_id} item={u} />
            ))}

            {/* ── already opened ── */}
            {opened.map((u) => (
              <OpenedRow key={u.unlock_id} item={u} />
            ))}
          </ul>
        )}
      </div>
    </ClothShell>
  );
}

/* ── Shared list-row shell ──────────────────────────────────────────────────
 * A calm archival row: warm unread dot | (serif primary + dim secondary) | mono date.
 */
function InboxRow({
  to,
  unread,
  dye,
  primary,
  primaryColor = 'var(--bone)',
  primaryItalic = false,
  secondary,
  date,
  dateColor = 'var(--bone-faint)',
}: {
  to?: string;
  unread: boolean;
  dye?: string | null;
  primary: ReactNode;
  primaryColor?: string;
  primaryItalic?: boolean;
  secondary?: ReactNode;
  date: string;
  dateColor?: string;
}) {
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '14px 1fr auto',
    alignItems: 'baseline',
    columnGap: 14,
    padding: '20px 0',
    textDecoration: 'none',
  };
  const body = (
    <>
        {/* col 1: unread dot + dye signal */}
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, alignSelf: 'center' }}>
          <span
            aria-hidden
            style={{
              display: 'block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: unread ? 'var(--warm)' : 'transparent',
              boxShadow: unread ? '0 0 8px var(--warm-glow)' : 'none',
            }}
          />
          <DyeSwatch dye={dye} />
        </span>

        {/* col 2: primary serif line + dim secondary */}
        <span style={{ minWidth: 0 }}>
          <span
            className="hl-serif"
            style={{
              display: 'block',
              fontSize: 17,
              fontWeight: 400,
              lineHeight: 1.3,
              color: primaryColor,
              fontStyle: primaryItalic ? 'italic' : 'normal',
            }}
          >
            {primary}
          </span>
          {secondary != null && (
            <span
              className="hl-serif"
              style={{
                display: 'block',
                fontSize: 13.5,
                lineHeight: 1.45,
                color: 'var(--bone-dim)',
                fontStyle: 'italic',
                marginTop: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {secondary}
            </span>
          )}
        </span>

        {/* col 3: mono date */}
        <span
          className="hl-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: dateColor,
            whiteSpace: 'nowrap',
            alignSelf: 'center',
          }}
        >
          {date}
        </span>
    </>
  );

  return (
    <li style={{ borderBottom: '1px solid var(--rule)' }}>
      {to ? (
        <Link to={to} className="hl-link" style={gridStyle}>
          {body}
        </Link>
      ) : (
        <div style={gridStyle}>{body}</div>
      )}
    </li>
  );
}

/* ── For-you (received) row ─────────────────────────────────────────────── */
function ReceivedRow({
  item,
}: {
  item: { id: string; title: string; type: string; createdAt: string; from: string; metadata: any };
}) {
  return (
    <InboxRow
      to={`/loom/read?entry=${item.id}`}
      unread
      primary={item.title}
      primaryColor="var(--warm)"
      secondary={`from ${item.from || 'a family member'}`}
      date={formatDate(item.createdAt)}
    />
  );
}

/* ── Already-opened row ─────────────────────────────────────────────────── */
function OpenedRow({ item }: { item: RecentUnlock }) {
  const secondary = [item.thread_name, item.resolution_note].filter(Boolean).join(' · ');
  return (
    <InboxRow
      to={`/loom/read?entry=${item.entry_id}`}
      unread={false}
      dye={item.dye}
      primary={item.entry_title ?? 'An entry has opened'}
      secondary={secondary || undefined}
      date={formatDate(item.resolved_at)}
    />
  );
}

/* ── Still-sealed row ───────────────────────────────────────────────────── */
function SealedRow({ item }: { item: UpcomingUnlock }) {
  const itemWithDye = item as UpcomingUnlock & { dye?: string | null };
  const unlockLabel = sealedUntilLabel(item);
  const secondary = [item.thread_name, item.target_name ?? lockKindLabel(item.lock_type)]
    .filter(Boolean)
    .join(' · ');
  return (
    <InboxRow
      unread={false}
      dye={itemWithDye.dye}
      primary={
        <>
          <span aria-hidden style={{ color: 'var(--warm)', fontWeight: 300, marginRight: 8 }}>∞</span>
          {item.entry_title ?? 'A sealed note'}
        </>
      }
      primaryColor="var(--bone-dim)"
      primaryItalic={!!item.entry_title}
      secondary={secondary || undefined}
      date={`unlocks ${unlockLabel}`}
      dateColor="var(--warm)"
    />
  );
}

/* ── Empty state ────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{ marginTop: 40, textAlign: 'center' }}>
      <p
        className="hl-serif"
        style={{
          fontStyle: 'italic',
          color: 'var(--bone-faint)',
          marginBottom: 8,
        }}
      >
        Nothing is waiting.
      </p>
      <p
        className="hl-serif"
        style={{
          fontStyle: 'italic',
          color: 'var(--bone-faint)',
          fontSize: 14,
          marginBottom: 24,
        }}
      >
        Seal a letter or lock a memory to start the wait.
      </p>
      <Link
        to="/letters/new"
        className="hl-link warm"
        style={{ fontSize: 14 }}
      >
        seal a letter →
      </Link>
    </div>
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
