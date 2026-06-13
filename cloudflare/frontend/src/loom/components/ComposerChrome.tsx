import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lettersApi, aiApi } from '../../services/api';

/**
 * ComposerChrome — shared primitives for the two Composer surfaces
 * (Paper / Letter). Speak is its own dedicated route (/record).
 *
 * The Composer is one instrument with two written modes. These pieces —
 * the mode switcher, the Listener (invariant C: one ambient line, never a
 * chatbot), and the bottom control rail (visibility · lock · dye) — are the
 * design's signature chrome, recreated as real, wired controls.
 */

/* ─── Natural-dye palette (§2.7) ───────────────────────────────────────── */
export const DYES: { key: string; token: string; motif: string }[] = [
  { key: 'weld',     token: 'var(--dye-weld)',     motif: 'daily' },
  { key: 'walnut',   token: 'var(--dye-walnut)',   motif: 'travel' },
  { key: 'saffron',  token: 'var(--dye-saffron)',  motif: 'achievement' },
  { key: 'woad',     token: 'var(--dye-woad)',     motif: 'contemplation' },
  { key: 'madder',   token: 'var(--dye-madder)',   motif: 'joy' },
  { key: 'kermes',   token: 'var(--dye-kermes)',   motif: 'love' },
  { key: 'cochineal',token: 'var(--dye-cochineal)',motif: 'grief' },
  { key: 'indigo',   token: 'var(--dye-indigo)',   motif: 'reflection' },
  { key: 'oakgall',  token: 'var(--dye-oakgall)',  motif: 'record' },
  { key: 'iron',     token: 'var(--dye-iron)',     motif: 'ending' },
];

export const VISIBILITIES = ['private', 'family', 'descendants', 'historian'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

const railWrap: React.CSSProperties = {
  marginTop: 40,
  paddingTop: 16,
  borderTop: '1px solid var(--rule)',
  fontFamily: "'JetBrains Mono', monospace",
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

/* ─── Composer mode switcher — paper / letter only ───────────────────── */
export function ComposerModes({ active }: { active: 'paper' | 'letter' }) {
  const navigate = useNavigate();
  const modes: { key: 'paper' | 'letter'; label: string; to: string; hint: string }[] = [
    { key: 'paper',  label: 'paper',  to: '/compose',      hint: 'a memory, note, or thought' },
    { key: 'letter', label: 'letter', to: '/letters/new',  hint: 'addressed to someone, optionally sealed' },
  ];
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        className="loom-mono"
        style={{
          display: 'inline-flex',
          gap: 0,
          fontSize: 13,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {modes.map((m, i) => (
          <span key={m.key} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            {i > 0 && <span style={{ color: 'var(--bone-low)', margin: '0 14px' }}>·</span>}
            <button
              type="button"
              onClick={() => m.key !== active && navigate(m.to)}
              style={{
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: m.key === active ? 'default' : 'pointer',
                font: 'inherit',
                letterSpacing: 'inherit',
                textTransform: 'inherit',
                color: m.key === active ? 'var(--warm)' : 'var(--bone-faint)',
                transition: 'color 180ms var(--ease)',
              }}
            >
              {m.label}
            </button>
          </span>
        ))}
      </div>
      {/* hint for active mode */}
      <div
        className="loom-mono"
        style={{ fontSize: 11, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}
      >
        {modes.find(m => m.key === active)?.hint}
      </div>
    </div>
  );
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
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12,
        lineHeight: 1.75,
        letterSpacing: '0.03em',
        color: 'var(--bone-dim)',
        maxWidth: '40ch',
        borderLeft: '1px solid rgba(176,122,74,0.28)',
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
            borderRadius: '50%',
            background: 'var(--warm)',
            opacity: loading ? 1 : 0.55,
            animation: loading ? 'hl-listener-pulse 1400ms cubic-bezier(0.16,1,0.3,1) infinite' : 'none',
          }}
        />
        the listener offers
      </span>
      {loading ? (
        <span style={{ color: 'var(--bone-faint)', fontStyle: 'italic' }}>listening…</span>
      ) : (
        <span style={{ color: 'var(--bone)', fontStyle: 'italic', fontSize: 'clamp(15px, 1.6vw, 17px)', fontFamily: "'Source Serif 4', serif", fontWeight: 300, lineHeight: 1.62 }}>
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
            fontFamily: "'JetBrains Mono', monospace",
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
  return (
    <span>
      <span style={{ color: 'var(--bone-faint)' }}>visibility ·</span>{' '}
      {VISIBILITIES.map((v, i) => (
        <span key={v}>
          {i > 0 && sep}
          <button
            type="button"
            onClick={() => onChange(v)}
            style={{
              background: 'transparent',
              border: 0,
              padding: '2px 0',
              cursor: 'pointer',
              font: 'inherit',
              letterSpacing: 'inherit',
              color: v === value ? 'var(--warm)' : 'var(--bone-dim)',
              transition: 'color 180ms var(--ease)',
            }}
          >
            {v}
          </button>
        </span>
      ))}
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
  const dye = DYES.find((d) => d.key === value) ?? DYES[0];
  const cycle = () => {
    const idx = DYES.findIndex((d) => d.key === dye.key);
    onChange(DYES[(idx + 1) % DYES.length].key);
  };
  return (
    <button
      type="button"
      onClick={cycle}
      title="cycle the thread's dye"
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
      <span style={{ color: 'var(--bone-faint)' }}>thread ·</span>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 9,
          height: 9,
          background: dye.token,
          margin: '0 6px',
          alignSelf: 'center',
        }}
      />
      <span style={{ color: 'var(--warm)' }}>
        {dye.key} · {dye.motif}
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
        transition: 'color 180ms var(--ease), opacity 180ms',
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
