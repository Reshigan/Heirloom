import { useNavigate } from 'react-router-dom';

/**
 * ComposerChrome — shared primitives for the three Composer surfaces
 * (Paper / Letter / Speak), faithful to the Claude Design handoff
 * (loom3 · heirloom-product.jsx → ComposerPaper / ComposerLetter / ComposerSpeak).
 *
 * The Composer is one instrument with three modes. These pieces — the mode
 * switcher, the Listener line (invariant C: one typographic line, never a
 * chatbot), and the bottom control rail (visibility · lock · dye) — are the
 * design's signature chrome, recreated as real, wired controls.
 */

/* ─── The natural-dye palette (§2.7) — only surfaced inside the cloth.
   The Composer dye control is the one place a writer assigns a thread its
   colour. Tokens live in styles/globals.css (--dye-*). ─────────────────── */
export const DYES: { key: string; token: string; motif: string }[] = [
  { key: 'weld', token: 'var(--dye-weld)', motif: 'daily' },
  { key: 'walnut', token: 'var(--dye-walnut)', motif: 'travel' },
  { key: 'saffron', token: 'var(--dye-saffron)', motif: 'achievement' },
  { key: 'woad', token: 'var(--dye-woad)', motif: 'contemplation' },
  { key: 'madder', token: 'var(--dye-madder)', motif: 'joy' },
  { key: 'kermes', token: 'var(--dye-kermes)', motif: 'love' },
  { key: 'cochineal', token: 'var(--dye-cochineal)', motif: 'grief' },
  { key: 'indigo', token: 'var(--dye-indigo)', motif: 'reflection' },
  { key: 'oakgall', token: 'var(--dye-oakgall)', motif: 'record' },
  { key: 'iron', token: 'var(--dye-iron)', motif: 'ending' },
];

export const VISIBILITIES = ['private', 'family', 'descendants', 'historian'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

const railWrap: React.CSSProperties = {
  marginTop: 48,
  paddingTop: 18,
  borderTop: '1px solid var(--rule)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10.5,
  letterSpacing: '0.06em',
  color: 'var(--bone-dim)',
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 18,
  alignItems: 'baseline',
};

const sep = (
  <span style={{ margin: '0 6px', color: 'var(--bone-faint)' }}>/</span>
);

/* ─── Composer mode switcher ────────────────────────────────────────────── */
export function ComposerModes({ active }: { active: 'paper' | 'letter' | 'speak' }) {
  const navigate = useNavigate();
  const modes: { key: 'paper' | 'letter' | 'speak'; label: string; to: string }[] = [
    { key: 'paper', label: 'paper', to: '/compose' },
    { key: 'letter', label: 'letter', to: '/letters/new' },
    { key: 'speak', label: 'speak', to: '/record' },
  ];
  return (
    <div
      className="loom-mono"
      style={{
        display: 'inline-flex',
        gap: 0,
        fontSize: 10.5,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        marginBottom: 22,
      }}
    >
      {modes.map((m, i) => (
        <span key={m.key} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
          {i > 0 && <span style={{ color: 'var(--bone-low)', margin: '0 12px' }}>·</span>}
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
  );
}

/* ─── The Listener — one ambient line in the right margin (invariant C) ──── */
export function ListenerLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <aside
      aria-live="polite"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5,
        lineHeight: 1.7,
        letterSpacing: '0.04em',
        color: 'var(--bone-dim)',
        maxWidth: '30ch',
      }}
    >
      <span
        style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
        }}
      >
        the listener offers
      </span>
      <span style={{ color: 'var(--bone)', fontStyle: 'normal' }}>{text}</span>
    </aside>
  );
}

/* ─── Visibility control — four states, the active one warm ──────────────── */
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
              padding: 0,
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

/* ─── Dye control — swatch + name · motif, cycles the palette ────────────── */
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
      <span style={{ color: 'var(--bone-faint)' }}>dye ·</span>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          background: dye.token,
          margin: '0 5px',
          alignSelf: 'center',
        }}
      />
      <span style={{ color: 'var(--warm)' }}>
        {dye.key} · {dye.motif}
      </span>
    </button>
  );
}

/* ─── The bottom rail wrapper — same geometry across modes ───────────────── */
export function ComposerRail({ children }: { children: React.ReactNode }) {
  return <div style={railWrap}>{children}</div>;
}

export const railSep = sep;

/**
 * The Listener heuristic — a genuinely local, no-network read of the draft.
 * Surfaces a capitalised given-name used mid-sentence (i.e. not a sentence
 * opener and not a common word) as "a name not yet on the thread". Honest:
 * it never claims more than it sees, and returns null when it sees nothing.
 */
const COMMON = new Set([
  'I', 'I’m', "I'm", 'A', 'An', 'The', 'He', 'She', 'They', 'We', 'You', 'It',
  'My', 'His', 'Her', 'Our', 'Their', 'Your', 'God', 'Mum', 'Mom', 'Dad',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'And', 'But', 'When', 'Then',
  'That', 'This', 'There', 'Here', 'So', 'If', 'As', 'At', 'On', 'In', 'Of',
]);

export function listenerFor(body: string): string | null {
  if (body.trim().length < 40) return null;
  // Split into sentences; ignore the first word of each (legitimately capitalised).
  const sentences = body.split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    const words = s.trim().split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const raw = words[i].replace(/[^\p{L}’']/gu, '');
      if (raw.length < 3) continue;
      if (!/^[A-Z][a-z’']+$/u.test(raw)) continue;
      if (COMMON.has(raw)) continue;
      return `you mentioned a name not yet on the thread — ${raw}.`;
    }
  }
  return null;
}
