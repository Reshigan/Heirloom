import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lettersApi } from '../services/api';
import { Frame } from '../loom/components/Frame';

interface Letter {
  id: string;
  title?: string | null;
  salutation?: string | null;
  bodyPreview?: string | null;
  deliveryTrigger?: string;
  scheduledDate?: string | null;
  sealedAt?: string | null;
  createdAt: string;
}

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

/**
 * Letters — Loom 3 rewrite (§6.x).
 *
 * Two-column layout: left = list, right = sticky CTA.
 * Letter rows: date | title + recipient | dye swatch.
 * Sealed letters carry the ∞ warm prefix; drafts show a
 * hl-mono 9px uppercase draft tag.
 */
export function Letters() {
  const { data, isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () =>
      lettersApi.getAll({ limit: 200 }).then((r) => r.data).catch(() => null),
  });

  const letters: Letter[] = Array.isArray((data as any)?.data)
    ? (data as any).data
    : Array.isArray(data)
    ? (data as any)
    : [];

  return (
    <Frame
      left="letters"
      right={<Link to="/letters/new" className="hl-link warm">write a letter →</Link>}
    >
      <div
        style={{
          padding: 'clamp(24px, 5vw, 56px)',
          paddingBottom: 80,
          minHeight: '100%',
        }}
      >
        <style>{`
          .letters-grid { grid-template-columns: clamp(280px, 55%, 660px) minmax(0, 1fr); }
          @media (max-width: 680px) { .letters-grid { grid-template-columns: 1fr; } .letters-cta { display: none; } }
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
              <p
                className="hl-serif"
                style={{ fontStyle: 'italic', color: 'var(--bone-faint)' }}
              >
                Loading…
              </p>
            ) : letters.length === 0 ? (
              <p
                className="hl-serif"
                style={{ fontStyle: 'italic', color: 'var(--bone-faint)' }}
              >
                No letters yet. The future is still unwritten.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {letters.map((l) => (
                  <LetterRow key={l.id} letter={l} />
                ))}
              </ul>
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
              Write a letter →
            </Link>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LetterRow({ letter }: { letter: Letter }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sealed = !!letter.sealedAt;
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMut = useMutation({
    mutationFn: () => lettersApi.delete(letter.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['letters'] }),
  });

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
      navigate(`/letters/new?id=${letter.id}`);
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
            <span className="hl-mono" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--bone-low)', border: '1px solid var(--rule)', padding: '1px 6px', display: 'inline-block', marginTop: 6 }}>
              draft
            </span>
          ) : null}
        </div>

        {/* dye swatch + expand indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span aria-hidden style={{ display: 'block', width: 12, height: 2, background: dyeFor(letter.id), marginTop: 8, flexShrink: 0 }} />
          {sealed && (
            <span className="hl-mono" style={{ fontSize: 9, color: 'var(--bone-faint)', letterSpacing: '0.14em' }}>
              {expanded ? '↑' : '↓'}
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
            {letter.scheduledDate
              ? `sealed · opens ${formatDate(letter.scheduledDate)}`
              : letter.deliveryTrigger
              ? `sealed · opens on ${letter.deliveryTrigger.toLowerCase().replace('_', ' ')}`
              : 'sealed · time-locked'}
          </div>
        </div>
      )}

      {/* Delete control — drafts only (sealed letters are permanent) */}
      {!sealed && !confirmDelete && (
        <div style={{ paddingBottom: 14, paddingLeft: 96, display: 'flex', gap: 20 }}>
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="hl-mono"
            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dye-madder)', opacity: 0.7 }}>
            delete draft
          </button>
        </div>
      )}
      {confirmDelete && (
        <div style={{ paddingBottom: 14, paddingLeft: 96, display: 'flex', gap: 16, alignItems: 'center' }}>
          <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>Delete this draft?</span>
          <button type="button" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
            style={{ background: 'transparent', border: '1px solid var(--dye-madder)', borderRadius: 0, padding: '5px 12px', cursor: deleteMut.isPending ? 'wait' : 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--dye-madder)', opacity: deleteMut.isPending ? 0.6 : 1 }}>
            {deleteMut.isPending ? 'deleting…' : 'confirm'}
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)}
            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
            cancel
          </button>
        </div>
      )}
    </li>
  );
}
