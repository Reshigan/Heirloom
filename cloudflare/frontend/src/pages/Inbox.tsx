import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { threadsApi, memoriesApi, type UpcomingUnlock, type ThreadLockType } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal, WarmDot } from '../loom/cosmic/CosmicUI';

/**
 * Inbox — Loom 3 native "What is waiting." LEDGER archetype.
 * CosmicHeader mono eyebrow: unread/total count.
 * EntryRow list: serif title left; mono right cluster = time + kind.
 * Unread state: WarmDot beside title.
 * Mark-read/clear: quiet mono text affordances.
 * WaxSeal foot.
 *
 * §1.5(B) / §6 the Sealed Note: locked items expose metadata + unlock date
 * only — never the ciphertext body.
 *
 * Data (every hook preserved):
 *   memoriesApi.received()        → arrived rows (for you, unread)   [filled dot]
 *   threadsApi.upcomingUnlocks()  → sealed rows (still locked)        [filled dot]
 *   threadsApi.recentUnlocks()    → opened rows (lock resolved)       [hollow dot]
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

export function Inbox() {
  const navigate = useNavigate();

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
  const loading = upcomingQ.isLoading || recentQ.isLoading || receivedQ.isLoading;
  const hasError = upcomingQ.isError || recentQ.isError || receivedQ.isError;

  const isEmpty = received.length === 0 && sealed.length === 0 && opened.length === 0;

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'today', to: '/loom/today' }, { label: 'inbox' }]} />}
    >
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'transparent',
          padding: '64px 24px 120px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          <CosmicHeader eyebrow="THE INBOX" title="Inbox" align="center" />

          {hasError && (
            <p
              style={{
                fontFamily: 'var(--mono)',
                color: 'var(--warm)',
                fontSize: 11,
                margin: '0 0 28px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              could not load inbox
            </p>
          )}

          {loading && isEmpty ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <ProgressHair width={80} />
            </div>
          ) : isEmpty ? (
            <EmptyState onSeal={() => navigate('/letters/new')} />
          ) : (
            <>
              {/* ── arrived (received, for you, unread) ── */}
              {received.length > 0 && <SectionLabel>For you</SectionLabel>}
              {received.map((m) => (
                <EntryRow
                  key={m.id}
                  filled
                  noBorder
                  titleFont="serif"
                  titleSize={16}
                  titleColor="var(--text-soft)"
                  subFont="serif"
                  subColor="var(--muted-2)"
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--warm)', boxShadow: '0 0 8px var(--warm)', flex: '0 0 auto', display: 'inline-block' }} />
                      <span>{m.title}</span>
                    </span>
                  }
                  sub={<span style={{ fontSize: 11 }}>{`from ${m.from || 'a family member'}`}</span>}
                  meta={formatDate(m.createdAt)}
                  onClick={() => navigate(`/loom/read?entry=${m.id}`)}
                />
              ))}

              {/* ── still sealed (locked, waiting) ── */}
              {sealed.length > 0 && <SectionLabel>Sealed</SectionLabel>}
              {sealed.map((u) => {
                const itemWithDye = u as UpcomingUnlock & { dye?: string | null };
                const subText = [u.thread_name, u.target_name ?? lockKindLabel(u.lock_type)]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <EntryRow
                    key={u.unlock_id}
                    italic
                    noBorder
                    titleFont="serif"
                    titleSize={16}
                    titleColor="var(--copper-label)"
                    subFont="serif"
                    subColor="var(--muted-2)"
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <picture style={{ display: 'contents' }}>
                          <source type="image/avif" srcSet="/woven/seal.avif" />
                          <source type="image/webp" srcSet="/woven/seal.webp" />
                          <img src="/woven/seal.png" width={22} alt="" aria-hidden style={{ flex: '0 0 auto', display: 'inline-block' }} />
                        </picture>
                        <span>{u.entry_title ?? 'A sealed note for the future'}</span>
                      </span>
                    }
                    sub={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                        <span aria-hidden style={{ color: 'var(--warm)', fontWeight: 300, fontSize: 12, lineHeight: 1 }}>∞</span>
                        {subText && <span>{subText}</span>}
                      </span>
                    }
                    meta={`unlocks ${sealedUntilLabel(itemWithDye)}`}
                  />
                );
              })}

              {/* ── already opened (arrived, resolved) ── */}
              {opened.length > 0 && <SectionLabel>Arrived</SectionLabel>}
              {opened.map((u) => {
                const subText = [u.thread_name, u.resolution_note].filter(Boolean).join(' · ');
                return (
                  <EntryRow
                    key={u.unlock_id}
                    filled={false}
                    noBorder
                    titleFont="serif"
                    titleSize={15}
                    titleColor="var(--text-warm)"
                    subFont="serif"
                    subColor="var(--muted-2)"
                    title={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <WarmDot filled={false} size={5} color="var(--copper-border)" />
                        <span>{u.entry_title ?? 'An entry has opened'}</span>
                      </span>
                    }
                    sub={subText ? <span style={{ fontSize: 11 }}>{subText}</span> : undefined}
                    meta={formatDate(u.resolved_at)}
                    onClick={() => navigate(`/loom/read?entry=${u.entry_id}`)}
                  />
                );
              })}
            </>
          )}

          {/* ── foot ── (EmptyState carries its own seal, so skip it here to
              avoid a stacked/duplicate ∞ in the empty body) */}
          {!loading && !isEmpty && (
            <div style={{ marginTop: 80 }}>
              <WaxSeal size={28} />
            </div>
          )}
        </div>
      </div>
    </ClothShell>
  );
}

/* ── Empty state ────────────────────────────────────────────────────────── */
function EmptyState({ onSeal }: { onSeal: () => void }) {
  return (
    <div style={{ marginTop: 56, textAlign: 'center' }}>
      <p
        style={{
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          color: 'var(--bone-faint)',
          fontSize: 18,
          lineHeight: 1.6,
          margin: '0 0 8px',
        }}
      >
        Nothing is waiting.
      </p>
      <p
        style={{
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          color: 'var(--bone-faint)',
          fontSize: 15,
          lineHeight: 1.6,
          margin: '0 0 32px',
        }}
      >
        Seal a letter or lock a memory to start the wait.
      </p>
      <button
        type="button"
        onClick={onSeal}
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--warm)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '12px 0',
          minHeight: 44,
          display: 'inline-block',
        }}
      >
        seal a letter →
      </button>
      <div style={{ marginTop: 64 }}>
        <WaxSeal size={28} />
      </div>
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
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const now = new Date();
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
    const dayDiff = Math.round((startOf(now).getTime() - startOf(d).getTime()) / 86400000);
    if (dayDiff === 0) return 'Today';
    if (dayDiff === 1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}
