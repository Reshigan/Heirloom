import { useCallback, useEffect, useRef, useState } from 'react';
import { lettersApi, aiApi } from '../../services/api';
import { DYES, dyeVar, DYE_MOTIF, type Dye } from '../dye';

/**
 * ComposerChrome — shared primitives for the two Composer surfaces
 * (Paper / Letter). Speak is its own dedicated route (/record).
 *
 * The Composer is one instrument with two written modes. These pieces —
 * the mode switcher, the Listener (invariant C: one ambient line, never a
 * chatbot), and the bottom control rail (visibility · lock · dye) — are the
 * design's signature chrome, recreated as real, wired controls.
 */

/* ─── Natural-dye palette (§2.7) ───────────────────────────────────────────
 * Identity colours come ONLY from the canonical src/loom/dye.ts. The Composer's
 * picker walks the dyes in a curated mood order; tokens (dyeVar) and motif words
 * (DYE_MOTIF) are derived from the single source. Every entry is typed `Dye`
 * (`as const satisfies readonly Dye[]`), so a dye rename in dye.ts breaks this
 * literal at compile time — the exact drift this refactor closes. */
const DYE_ORDER = [
  'weld', 'walnut', 'saffron', 'woad', 'madder',
  'kermes', 'cochineal', 'indigo', 'oakgall', 'iron',
] as const satisfies readonly Dye[];

/* Runtime guard against a dye being ADDED or REMOVED in dye.ts (a count change
 * can't be a literal-type mismatch since DYES is a Dye[]): keep the picker in
 * lockstep with the canonical palette so no dye silently vanishes from the UI. */
if (
  import.meta.env.DEV &&
  (DYE_ORDER.length !== DYES.length ||
    !DYES.every((d) => (DYE_ORDER as readonly Dye[]).includes(d)))
) {
  console.error(
    '[ComposerChrome] DYE_ORDER drifted from the canonical DYES in dye.ts — ' +
      'add/remove the dye to keep the picker in lockstep.',
  );
}

export const VISIBILITIES = ['private', 'family', 'descendants', 'historian'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

const railWrap: React.CSSProperties = {
  marginTop: 40,
  paddingTop: 16,
  borderTop: '1px solid var(--rule)',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  letterSpacing: '0.06em',
  color: 'var(--bone-dim)',
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 16,
  alignItems: 'baseline',
};

const sep = (
  <span style={{ margin: '0 6px', color: 'var(--bone-faint)' }}>/</span>
);

/* ─── AI Listener hook — ambient writing companion ────────────────────── */
export function useListenerAI(body: string, to?: string) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBodyRef = useRef('');

  const fetch = useCallback(async (text: string, recipient?: string) => {
    if (text.length < 80) { setSuggestion(null); return; }
    setLoading(true);
    try {
      const res = await lettersApi.aiSuggest({
        body: text,
        recipientNames: recipient || undefined,
      });
      const s = (res.data as any)?.suggestion;
      if (s) setSuggestion(s);
    } catch {
      // Listener stays quiet on failure — never interrupt writing
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetch(lastBodyRef.current, to);
  }, [fetch, to]);

  useEffect(() => {
    lastBodyRef.current = body;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (body.length < 80) { setSuggestion(null); return; }
    timerRef.current = setTimeout(() => fetch(body, to), 900);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [body, to, fetch]);

  return { suggestion, loading, refresh };
}

/* ─── The Listener — ambient AI companion in the right margin ─────────── */
export function ListenerLine({
  text,
  loading,
  onRefresh,
}: {
  text: string | null;
  loading?: boolean;
  onRefresh?: () => void;
}) {
  if (!text && !loading) return null;
  return (
    <aside
      aria-live="polite"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 12,
        lineHeight: 1.75,
        letterSpacing: '0.03em',
        color: 'var(--bone-dim)',
        maxWidth: '40ch',
        borderLeft: '1px solid var(--rule)',
        paddingLeft: 'clamp(14px, 2.5vw, 22px)',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--warm-dim)',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 5,
            height: 5,
            borderRadius: 0,
            // DOT pattern: warm/active = 1px copper stroke, transparent fill;
            // neutral/idle = filled var(--bone-dim) square. Never a copper fill.
            background: loading ? 'transparent' : 'var(--bone-dim)',
            border: loading ? '1px solid var(--warm)' : '0',
            boxSizing: 'border-box',
          }}
        />
        the listener offers
      </span>
      {loading ? (
        <span style={{ color: 'var(--bone-faint)', fontStyle: 'italic' }}>listening…</span>
      ) : (
        <span style={{ color: 'var(--bone)', fontStyle: 'italic', fontSize: 'clamp(15px, 1.6vw, 17px)', fontFamily: 'var(--serif)', fontWeight: 300, lineHeight: 1.62 }}>
          "{text}"
        </span>
      )}
      {onRefresh && text && !loading && (
        <button
          type="button"
          onClick={onRefresh}
          style={{
            display: 'block',
            marginTop: 10,
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            transition: 'color 180ms var(--ease)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
        >
          another →
        </button>
      )}
    </aside>
  );
}

/* ─── Visibility control ──────────────────────────────────────────────── */
export function VisibilityControl({
  value,
  onChange,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (i: number, dir: 1 | -1) => {
    const next = (i + dir + VISIBILITIES.length) % VISIBILITIES.length;
    onChange(VISIBILITIES[next]);
    refs.current[next]?.focus();
  };
  return (
    <span role="radiogroup" aria-label="visibility">
      <span style={{ color: 'var(--bone-faint)' }}>visibility ·</span>{' '}
      {VISIBILITIES.map((v, i) => {
        const selected = v === value;
        return (
          <span key={v}>
            {i > 0 && sep}
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              ref={el => { refs.current[i] = el; }}
              onClick={() => onChange(v)}
              onKeyDown={e => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i, 1); }
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i, -1); }
              }}
              style={{
                background: 'transparent',
                border: 0,
                padding: '2px 0',
                cursor: 'pointer',
                font: 'inherit',
                letterSpacing: 'inherit',
                color: selected ? 'var(--warm)' : 'var(--bone-dim)',
                // non-color selected cue
                textDecoration: selected ? 'underline' : 'none',
                textUnderlineOffset: 3,
                transition: 'color 180ms var(--ease)',
              }}
            >
              {v}
            </button>
          </span>
        );
      })}
    </span>
  );
}

/* ─── Dye control — swatch + name · motif, cycles the palette ────────── */
export function DyeControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const dye: Dye = (DYE_ORDER as readonly string[]).includes(value)
    ? (value as Dye)
    : DYE_ORDER[0];
  const cycle = () => {
    const idx = DYE_ORDER.indexOf(dye);
    onChange(DYE_ORDER[(idx + 1) % DYE_ORDER.length]);
  };
  return (
    <button
      type="button"
      onClick={cycle}
      title="cycle the entry's dye"
      style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        font: 'inherit',
        letterSpacing: 'inherit',
        color: 'var(--bone-dim)',
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 0,
      }}
    >
      <span style={{ color: 'var(--bone-faint)' }}>dye ·</span>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 9,
          height: 9,
          background: dyeVar(dye),
          margin: '0 6px',
          alignSelf: 'center',
        }}
      />
      <span style={{ color: 'var(--bone-dim)' }}>
        {dye} · {DYE_MOTIF[dye]}
      </span>
    </button>
  );
}

/* ─── AI dye suggest button ──────────────────────────────────────────── */
export function DyeSuggestButton({
  body,
  onSuggest,
}: {
  body: string;
  onSuggest: (dye: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const suggest = async () => {
    if (body.length < 20 || loading) return;
    setLoading(true);
    try {
      const res = await aiApi.suggestDye(body);
      const dye = (res.data as any)?.dye as string | undefined;
      if (dye) onSuggest(dye);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={suggest}
      disabled={loading || body.length < 20}
      style={{
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: body.length < 20 ? 'default' : 'pointer',
        font: 'inherit',
        letterSpacing: 'inherit',
        color: loading ? 'var(--bone-faint)' : 'var(--warm)',
        opacity: body.length < 20 ? 0.35 : 1,
        transition: 'color 180ms var(--ease), opacity 180ms var(--ease)',
      }}
    >
      {loading ? 'reading…' : 'suggest →'}
    </button>
  );
}

/* ─── Bottom rail wrapper ────────────────────────────────────────────── */
export function ComposerRail({ children }: { children: React.ReactNode }) {
  return <div style={railWrap}>{children}</div>;
}

export const railSep = sep;
