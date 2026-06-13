import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lettersApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
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


/**
 * Letters — Loom 3 rewrite (§6.x).
 *
 * Two-column layout: left = list, right = sticky CTA.
 * Letter rows: date | title + recipient | dye swatch.
 * Sealed letters carry the ∞ warm prefix; drafts show a
 * hl-mono 9px uppercase draft tag.
 */
export function Letters() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['letters'],
    queryFn: () =>
      lettersApi.getAll({ limit: 200 }).then((r) => r.data),
  });

  const letters: Letter[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray(data)
    ? (data as any)
    : [];

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'letters' }]} />}
      topbarCenter="letters"
      topbarRight={<Link to="/letters/new" className="hl-link warm">seal a letter →</Link>}
    >
      <div
        style={{
          padding: 'var(--page-pad-top) var(--page-pad-x)',
          paddingBottom: 'var(--page-clear)',
          minHeight: '100%',
        }}
      >
        <style>{`
          .letters-grid { grid-template-columns: clamp(280px, 55%, 660px) minmax(0, 1fr); }
          .letters-mobile-cta { display: none; }
          @media (max-width: 680px) {
            .letters-grid { grid-template-columns: 1fr; }
            .letters-cta { display: none; }
            .letters-mobile-cta { display: block; }
          }
        `}</style>
        <div
          className="letters-grid"
          style={{
            display: 'grid',
            gap: 'clamp(24px, 4vw, 56px)',
            alignItems: 'start',
          }}
        >
          {/* ── LEFT: letter list ── */}
          <div>
            <h1
              className="hl-serif hl-tight"
              style={{
                fontSize: 'clamp(24px, 5vw, 36px)',
                fontWeight: 300,
                color: 'var(--bone)',
                marginBottom: 28,
              }}
            >
              The letters you've sealed.
            </h1>

            {isLoading ? (
              <div style={{ height: 1, background: 'var(--warm)', width: 80, opacity: 0.4, marginBottom: 24 }} />
            ) : isError ? (
              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                could not load letters — try refreshing
              </p>
            ) : letters.length === 0 ? (
              <div>
                <p
                  className="hl-serif"
                  style={{ fontStyle: 'italic', color: 'var(--bone-faint)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}
                >
                  No letters sealed yet. The future waits for your words.
                </p>
                <Link
                  to="/letters/new"
                  className="hl-btn"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  Seal a letter →
                </Link>
              </div>
            ) : (
              <>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {letters.map((l) => (
                    <LetterRow key={l.id} letter={l} />
                  ))}
                </ul>
                <div className="letters-mobile-cta" style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--rule)' }}>
                  <Link
                    to="/letters/new"
                    className="hl-btn"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    Seal a letter →
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* ── RIGHT: sticky CTA ── */}
          <div className="letters-cta" style={{ position: 'sticky', top: 0 }}>
            <h3
              className="hl-serif"
              style={{
                fontSize: 28,
                fontWeight: 400,
                color: 'var(--bone)',
                marginBottom: 14,
              }}
            >
              A letter for the future.
            </h3>
            <p
              className="hl-prose"
              style={{
                fontSize: 15,
                color: 'var(--bone-dim)',
                marginBottom: 28,
              }}
            >
              Sealed entries last decades. The recipient will read your exact
              words.
            </p>
            <Link
              to="/letters/new"
              className="hl-btn"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Seal a letter →
            </Link>
          </div>
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

  function handleClick() {
    if (!sealed) {
      navigate(`/compose?id=${letter.id}`);
    } else {
      setExpanded((v) => !v);
    }
  }

  return (
    <li style={{ borderBottom: '1px solid var(--rule)' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr auto',
          paddingTop: 18,
          paddingBottom: 18,
          alignItems: 'start',
          gap: 16,
          cursor: 'pointer',
          outline: 'none',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.8'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
      >
        {/* date */}
        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', paddingTop: 2 }}>
          {dateStr}
        </span>

        {/* title + recipient + draft tag */}
        <div>
          <span className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', display: 'block', lineHeight: 1.3 }}>
            {sealed ? <span style={{ color: 'var(--warm)', marginRight: 6 }} aria-hidden>∞</span> : null}
            {title}
          </span>

          {recipient ? (
            <span className="hl-serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--bone-dim)', display: 'block', marginTop: 3 }}>
              {recipient}
            </span>
          ) : null}

          {!sealed ? (
            <span className="hl-tag" style={{ marginTop: 6 }}>draft</span>
          ) : null}
        </div>

        {/* dye swatch + expand indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span aria-hidden style={{ display: 'block', width: 24, height: 3, background: dyeFor(letter.id), marginTop: 8, flexShrink: 0 }} />
          {sealed && (
            <span className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {expanded ? 'close' : 'open'}
            </span>
          )}
        </div>
      </div>

      {/* Expanded detail for sealed letters */}
      {expanded && sealed && (
        <div style={{ paddingBottom: 20, paddingLeft: 96, borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
          {letter.bodyPreview && (
            <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--bone-dim)', margin: '0 0 14px', maxWidth: '60ch' }}>
              {letter.bodyPreview}
            </p>
          )}
          <div className="hl-mono" style={{ fontSize: 9.5, color: 'var(--bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
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
                  <p className="hl-serif" style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--bone-dim)', fontStyle: 'italic', margin: '0 0 12px', maxWidth: '52ch' }}>
                    Has this milestone arrived? Release the letter to deliver it to {recipient || 'the recipient'} by email. This can't be undone.
                  </p>
                  <button type="button" onClick={() => setConfirmRelease(true)} className="hl-btn" style={{ cursor: 'pointer' }}>
                    Release this letter →
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--warm)' }}>
                    Deliver now?
                  </span>
                  <button type="button" onClick={() => releaseMut.mutate()} disabled={releaseMut.isPending}
                    style={{ background: 'transparent', border: '1px solid var(--warm)', borderRadius: 0, padding: '5px 12px', cursor: releaseMut.isPending ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--warm)', opacity: releaseMut.isPending ? 0.6 : 1 }}>
                    {releaseMut.isPending ? 'releasing…' : 'confirm release'}
                  </button>
                  <button type="button" onClick={() => setConfirmRelease(false)} disabled={releaseMut.isPending}
                    style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                    not yet
                  </button>
                  {releaseMut.isError && (
                    <span className="hl-mono" style={{ fontSize: 9.5, color: 'var(--danger)', letterSpacing: '0.1em' }}>could not release — try again</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit + delete controls — drafts only (sealed letters are permanent) */}
      {!sealed && !confirmDelete && (
        <div style={{ paddingBottom: 14, paddingLeft: 96, display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link
            to={`/compose?id=${letter.id}`}
            className="hl-mono"
            style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--warm)', textDecoration: 'none' }}
          >
            edit draft →
          </Link>
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="hl-mono"
            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', opacity: 0.7 }}>
            delete
          </button>
        </div>
      )}
      {confirmDelete && (
        <div style={{ paddingBottom: 14, paddingLeft: 96, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>Delete this draft?</span>
          <button type="button" onClick={() => { setDeleteError(null); deleteMut.mutate(); }} disabled={deleteMut.isPending}
            style={{ background: 'transparent', border: '1px solid var(--danger)', borderRadius: 0, padding: '5px 12px', cursor: deleteMut.isPending ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', opacity: deleteMut.isPending ? 0.6 : 1 }}>
            {deleteMut.isPending ? 'deleting…' : 'confirm'}
          </button>
          <button type="button" onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
            cancel
          </button>
          {deleteError && (
            <span className="hl-mono" style={{ fontSize: 9.5, color: 'var(--danger)', letterSpacing: '0.1em' }}>{deleteError}</span>
          )}
        </div>
      )}
    </li>
  );
}
