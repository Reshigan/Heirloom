import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lettersApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ProgressHair } from '../loom/components/ProgressHair';
import { CosmicHeader, WarmDot, WaxSeal } from '../loom/cosmic/CosmicUI';
import { type Letter } from '../types';
import { formatDate } from '../utils/date';

// Natural-dye swatch — deterministic per letter id
const DYE_VARS = [
  '--dye-madder',
  '--dye-cochineal',
  '--dye-kermes',
  '--dye-saffron',
  '--dye-weld',
  '--dye-walnut',
  '--dye-oakgall',
  '--dye-woad',
  '--dye-indigo',
  '--dye-iron',
] as const;

function dyeFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `var(${DYE_VARS[h % DYE_VARS.length]})`;
}

type LetterFilter = 'all' | 'sealed' | 'drafts';

/**
 * Letters — Illuminated Ledger re-skin (cosmic concept "B").
 *
 * The letters collection reads as a page of the family's ledger: a mono
 * eyebrow states the count ("N LETTERS"), a giant serif headline holds the
 * top, then each letter falls beneath as a hairline-ruled EntryRow — serif
 * title left, mono right cluster distinguishing SEALED · OPENS YYYY from
 * DRAFT. The ∞ wax seal rests at the foot. A quiet mono bar filters the
 * collection by state.
 */
export function Letters() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['letters'],
    queryFn: () =>
      lettersApi.getAll({ limit: 200 }).then((r) => r.data),
  });

  const [filter, setFilter] = useState<LetterFilter>('all');

  const letters: Letter[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray(data)
    ? (data as any)
    : [];

  const visible = letters.filter((l) =>
    filter === 'sealed' ? !!l.sealedAt : filter === 'drafts' ? !l.sealedAt : true,
  );

  const filters: Array<{ key: LetterFilter; label: string }> = [
    { key: 'all', label: 'all' },
    { key: 'sealed', label: 'sealed' },
    { key: 'drafts', label: 'drafts' },
  ];

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'letters' }]} />}
      topbarRight={<Link to="/letters/new" className="hl-link warm">seal a letter →</Link>}
    >
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x)',
          paddingBottom: 'var(--page-clear)',
          minHeight: '100%',
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        <CosmicHeader
          eyebrow={`${letters.length} ${letters.length === 1 ? 'letter' : 'letters'}`}
          title="The letters you've sealed."
        />

        {/* ── Quiet mono filter bar ── */}
        {!isLoading && !isError && letters.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 22,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 14,
              paddingBottom: 16,
              borderBottom: '1px solid var(--rule)',
            }}
          >
            {filters.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: active ? 'var(--warm)' : 'var(--bone-faint)',
                    transition: 'color 180ms var(--ease)',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div style={{ marginBottom: 24 }}>
            <ProgressHair width={80} />
          </div>
        ) : isError ? (
          <p className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            could not load letters — try refreshing
          </p>
        ) : letters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p
              className="hl-serif"
              style={{ fontStyle: 'italic', color: 'var(--bone-dim)', fontSize: 18, lineHeight: 1.7, marginBottom: 24 }}
            >
              No letters sealed yet. The future waits for your words.
            </p>
            <Link
              to="/letters/new"
              className="hl-mono"
              style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none' }}
            >
              Seal a letter →
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <p
            className="hl-serif"
            style={{ fontStyle: 'italic', color: 'var(--bone-dim)', fontSize: 18, lineHeight: 1.7, padding: '32px 0', textAlign: 'center' }}
          >
            {filter === 'sealed' ? 'No sealed letters yet.' : 'No drafts in progress.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {visible.map((l) => (
              <LetterRow key={l.id} letter={l} />
            ))}
          </ul>
        )}

        <div style={{ marginTop: 64 }}>
          <WaxSeal />
        </div>
      </div>
    </ClothShell>
  );
}

function LetterRow({ letter }: { letter: Letter }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sealed = !!letter.sealedAt;
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [confirmRelease, setConfirmRelease] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMut = useMutation({
    mutationFn: () => lettersApi.delete(letter.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['letters'] }),
    onError: (err: any) => setDeleteError(err?.response?.data?.error ?? 'could not delete draft'),
  });

  const releaseMut = useMutation({
    mutationFn: () => lettersApi.release(letter.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['letters'] }),
  });

  // A milestone letter waits sealed with no date until the family judges the
  // milestone has arrived, then the author releases it (emails recipients).
  const isMilestone = !!letter.milestoneLabel && !letter.scheduledDate;
  const released = !!letter.deliveredAt;

  if (deleteMut.isSuccess) return null;

  const dateStr = letter.scheduledDate
    ? formatDate(letter.scheduledDate)
    : letter.sealedAt
    ? formatDate(letter.sealedAt)
    : formatDate(letter.createdAt);

  const title = letter.title ?? letter.salutation ?? 'Untitled letter';
  const recipient = letter.salutation && letter.title ? letter.salutation : null;
  const dye = dyeFor(letter.id);

  // The mono right cluster distinguishes a sealed letter (and when it opens)
  // from a draft.
  const rightLabel = sealed
    ? released
      ? `opened ${formatDate(letter.deliveredAt!)}`
      : isMilestone
      ? `sealed · opens ${letter.milestoneLabel}`
      : letter.scheduledDate
      ? `sealed · opens ${formatDate(letter.scheduledDate)}`
      : letter.deliveryTrigger
      ? `sealed · opens ${letter.deliveryTrigger.toLowerCase().replace('_', ' ')}`
      : 'sealed · time-locked'
    : 'draft';

  function handleClick() {
    if (!sealed) {
      navigate(`/compose?id=${letter.id}`);
    } else {
      setExpanded((v) => !v);
    }
  }

  return (
    <li style={{ borderBottom: '1px solid var(--rule)' }}>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        className="hl-ledger-row"
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 20,
          width: '100%',
          textAlign: 'left',
          padding: '15px 0',
          background: 'none',
          border: 0,
          cursor: 'pointer',
          transition: 'opacity 180ms var(--ease)',
        }}
      >
        {/* title + recipient */}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="hl-serif" style={{ fontWeight: 400, fontSize: 19, lineHeight: 1.3, color: 'var(--bone)', display: 'block' }}>
            {sealed ? <span style={{ color: 'var(--warm)', marginRight: 6 }} aria-hidden>∞</span> : null}
            {title}
          </span>
          {recipient ? (
            <span className="hl-serif" style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--bone-dim)', display: 'block', marginTop: 4, lineHeight: 1.5 }}>
              {recipient}
            </span>
          ) : null}
        </span>

        {/* mono right cluster — year · dye dot · state */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', flex: '0 0 auto', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--bone-faint)' }}>{dateStr}</span>
          <WarmDot color={dye} size={5} />
          <span style={{ color: sealed ? 'var(--warm)' : 'var(--bone-dim)', letterSpacing: '0.16em' }}>{rightLabel}</span>
        </span>
      </button>

      {/* Expanded detail for sealed letters */}
      {expanded && sealed && (
        <div style={{ paddingBottom: 20, borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
          {letter.bodyPreview && (
            <p className="hl-serif" style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--bone-dim)', margin: '0 0 14px', maxWidth: '60ch' }}>
              {letter.bodyPreview}
            </p>
          )}
          <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {released
              ? `released ${formatDate(letter.deliveredAt!)}`
              : isMilestone
              ? `sealed · opens on ${letter.milestoneLabel}`
              : letter.scheduledDate
              ? `sealed · opens ${formatDate(letter.scheduledDate)}`
              : letter.deliveryTrigger
              ? `sealed · opens on ${letter.deliveryTrigger.toLowerCase().replace('_', ' ')}`
              : 'sealed · time-locked'}
          </div>

          {/* Milestone release — the only ceremony the family controls by hand.
              Shown when the letter waits on a milestone and hasn't been released. */}
          {isMilestone && !released && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
              {!confirmRelease ? (
                <>
                  <p className="hl-serif" style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--bone-dim)', fontStyle: 'italic', margin: '0 0 12px', maxWidth: '52ch' }}>
                    Has this milestone arrived? Release the letter to deliver it to {recipient || 'the recipient'} by email. This can't be undone.
                  </p>
                  <button type="button" onClick={() => setConfirmRelease(true)} className="hl-mono" style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--warm)' }}>
                    Release this letter →
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm)' }}>
                    Deliver now?
                  </span>
                  <button type="button" onClick={() => releaseMut.mutate()} disabled={releaseMut.isPending}
                    className="hl-mono" style={{ background: 'transparent', border: 0, padding: 0, cursor: releaseMut.isPending ? 'wait' : 'pointer', opacity: releaseMut.isPending ? 0.6 : 1, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm)' }}>
                    {releaseMut.isPending ? 'releasing…' : 'confirm release'}
                  </button>
                  <button type="button" onClick={() => setConfirmRelease(false)} disabled={releaseMut.isPending}
                    className="hl-mono" style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
                    not yet
                  </button>
                  {releaseMut.isError && (
                    <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>could not release — try again</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit + delete controls — drafts only (sealed letters are permanent) */}
      {!sealed && !confirmDelete && (
        <div style={{ paddingBottom: 14, display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link
            to={`/compose?id=${letter.id}`}
            className="hl-mono"
            style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none' }}
          >
            edit draft →
          </Link>
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="hl-mono"
            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
            delete
          </button>
        </div>
      )}
      {confirmDelete && (
        <div style={{ paddingBottom: 14, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>Delete this draft?</span>
          <button type="button" onClick={() => { setDeleteError(null); deleteMut.mutate(); }} disabled={deleteMut.isPending}
            className="hl-mono" style={{ background: 'transparent', border: 0, padding: 0, cursor: deleteMut.isPending ? 'wait' : 'pointer', opacity: deleteMut.isPending ? 0.6 : 1, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--warm)' }}>
            {deleteMut.isPending ? 'deleting…' : 'confirm'}
          </button>
          <button type="button" onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
            className="hl-mono" style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-dim)' }}>
            cancel
          </button>
          {deleteError && (
            <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{deleteError}</span>
          )}
        </div>
      )}
    </li>
  );
}
