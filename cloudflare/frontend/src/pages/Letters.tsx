import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { lettersApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

interface Letter {
  id: string;
  title?: string | null;
  salutation?: string | null;
  body: string;
  delivery_trigger?: string;
  scheduled_date?: string | null;
  sealed_at?: string | null;
  created_at: string;
}

/**
 * Letters — Loom-native rewrite.
 *
 * A list of sealed and unsealed letters. Sealed letters carry the ∞
 * mark and the open date in the left rail; unsealed (drafts) show a
 * "draft" small-caps tag. Body excerpt only when not sealed.
 */
export function Letters() {
  const { data, isLoading } = useQuery({
    queryKey: ['letters'],
    queryFn: () => lettersApi.getAll({ limit: 200 }).then((r) => r.data).catch(() => null),
  });
  const letters: Letter[] = (data?.letters ?? data ?? []) as Letter[];

  return (
    <AppFrame>
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          Letters · {letters.length} {letters.length === 1 ? 'letter' : 'letters'}
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Sealed against time.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          Letters are entries with a future open. Body encrypted at rest; the recipient and the
          date are public; the rest opens when the lock resolves.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 24, paddingBottom: 14, marginBottom: 28, borderBottom: '1px solid var(--loom-rule)' }}>
        <span style={{ flex: 1 }} />
        <Link
          to="/letters/new"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-warm)',
            textDecoration: 'none',
          }}
        >
          write a letter →
        </Link>
      </div>

      {isLoading ? (
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      ) : letters.length === 0 ? (
        <Empty />
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {letters.map((l) => (
            <LetterRow key={l.id} letter={l} />
          ))}
        </ul>
      )}
    </AppFrame>
  );
}

function LetterRow({ letter }: { letter: Letter }) {
  const sealed = !!letter.sealed_at;
  const opens =
    letter.scheduled_date ?? letter.sealed_at ?? letter.created_at;
  return (
    <li style={{ padding: '24px 0', borderBottom: '1px solid var(--loom-rule)' }}>
      <article style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, alignItems: 'baseline' }}>
        <div>
          <p
            className="loom-mono"
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'var(--loom-warm)',
              textTransform: 'uppercase',
            }}
          >
            {sealed ? '∞ sealed' : 'draft'}
          </p>
          <p
            className="loom-mono"
            style={{
              margin: '6px 0 0',
              fontSize: 11,
              letterSpacing: '0.04em',
              color: 'var(--loom-bone-faint)',
            }}
          >
            {opens ? formatDate(opens) : ''}
          </p>
        </div>
        <div>
          <h3
            className="loom-serif"
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: 'var(--loom-bone)',
              margin: '0 0 6px',
              lineHeight: 1.25,
            }}
          >
            {sealed ? <span style={{ color: 'var(--loom-warm)', marginRight: 8 }} aria-hidden>∞</span> : null}
            {letter.title ?? letter.salutation ?? 'Untitled letter'}
          </h3>
          {!sealed && letter.body ? (
            <p
              className="loom-body"
              style={{
                fontSize: 15,
                color: 'var(--loom-bone-dim)',
                margin: 0,
                lineHeight: 1.7,
                fontStyle: 'italic',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {letter.body}
            </p>
          ) : null}
          {sealed ? (
            <p
              className="loom-body"
              style={{ margin: 0, fontSize: 14, fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}
            >
              Sealed. Will open on the date you set.
            </p>
          ) : null}
        </div>
      </article>
    </li>
  );
}

function Empty() {
  return (
    <div style={{ padding: '60px 36px', border: '1px solid var(--loom-rule)', textAlign: 'center' }}>
      <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
        No letters yet
      </p>
      <h2
        className="loom-serif"
        style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 18px' }}
      >
        The best letters are written for someone you'll never meet.
      </h2>
      <Link to="/compose" className="loom-btn" style={{ textDecoration: 'none' }}>
        write a letter
      </Link>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
