import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiApi, engagementApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';

/**
 * DailySentence — "the daily sentence · syndication" (§Pass-3, moment 03).
 * Loom 3 native rewrite: hl-screen dark ink, hl-topbar, TapestryEdge.
 *
 * A public, logged-out-reachable surface. One question a day. The question
 * travels — the answers never do. Today's prompt is pulled from the real AI
 * prompt endpoint when available; otherwise we fall back to a sensible static
 * question (never an invented family count).
 */

const FALLBACK_QUESTION = 'What did you almost forget to write down today?';

interface PromptResponse {
  id?: string;
  prompt?: string;
  prompt_text?: string;
  text?: string;
  question?: string;
}

function pickPromptText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const p = data as PromptResponse & { prompt?: PromptResponse };
  const node = (p.prompt && typeof p.prompt === 'object' ? p.prompt : p) as PromptResponse;
  const text = node.prompt_text || node.question || node.text || node.prompt;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

/** Hairline-framed shareable tile — fixed artboard dimensions. */
function Tile({
  question,
  stamp,
  audience,
}: {
  question: string;
  stamp: string;
  audience: string | null;
}) {
  return (
    <div
      style={{
        width: 340,
        background: 'var(--ink)',
        border: '1px solid var(--rule)',
        padding: '28px 28px 22px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* header row: logo + date */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <HLogo size={14} wordmark mono color="var(--bone)" wordColor="var(--bone)" />
        <span
          className="hl-mono"
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            color: 'var(--bone-faint)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {stamp}
        </span>
      </div>

      {/* audience line */}
      {audience ? (
        <div
          className="hl-serif"
          style={{
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--bone-dim)',
            marginBottom: 8,
          }}
        >
          {audience}
        </div>
      ) : null}

      {/* the question */}
      <div
        className="hl-serif"
        style={{
          fontSize: 22,
          lineHeight: 1.18,
          fontWeight: 300,
          color: 'var(--bone)',
          letterSpacing: '-0.014em',
          flex: 1,
        }}
      >
        {question}
      </div>

      {/* footer rule */}
      <div
        style={{
          borderTop: '1px solid var(--rule)',
          paddingTop: 12,
          marginTop: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          className="hl-mono"
          style={{
            fontSize: 9,
            color: 'var(--bone-faint)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          the listener · daily
        </span>
        <span
          className="hl-mono"
          style={{
            fontSize: 9,
            color: 'var(--warm)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          heirloom.blue
        </span>
      </div>
    </div>
  );
}

const VARIANTS: { label: string }[] = [
  { label: 'IG square · 1080' },
  { label: 'Newsletter top' },
  { label: 'IG vertical · 1080×1350' },
];

export function DailySentence() {
  const [question, setQuestion] = useState<string>(FALLBACK_QUESTION);
  const [families, setFamilies] = useState<number | null>(null);

  // Today's question from the real prompt endpoint; fall back silently.
  useEffect(() => {
    aiApi
      .getPrompt()
      .then((r) => {
        const text = pickPromptText(r.data);
        if (text) setQuestion(text);
      })
      .catch(() => undefined);
  }, []);

  // Live family count — only shown if the API actually returns one. Never invented.
  useEffect(() => {
    engagementApi
      .getFamilyFeed()
      .then((r) => {
        interface FamilyFeedData {
          families_connected?: unknown;
          family_count?: unknown;
          families?: unknown;
          summary?: { families_connected?: unknown } | unknown;
        }
        const d = r.data as FamilyFeedData;
        const raw =
          d.families_connected ??
          d.family_count ??
          d.families ??
          (typeof d.summary === 'object' && d.summary
            ? (d.summary as { families_connected?: unknown }).families_connected
            : undefined);
        const n = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isFinite(n) && n > 0) setFamilies(n);
      })
      .catch(() => undefined);
  }, []);

  const now = new Date();
  const stamp = now
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    .toLowerCase();
  const audience = families
    ? `tonight, across ${families.toLocaleString()} families`
    : null;

  return (
    <div className="hl-screen" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>

      {/* ── topbar ───────────────────────────────────────────────────── */}
      <div className="hl-topbar">
        {/* left: logo + surface label */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <HLogo size={18} wordmark />
          </Link>
          <span style={{ color: 'var(--bone-low)' }}>·</span>
          <span className="hl-mono" style={{ fontSize: 10.5, color: 'var(--bone-dim)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            the daily sentence
          </span>
        </span>

        {/* center: counter slot */}
        <span
          className="hl-counter hl-mono"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontSize: 10,
            color: 'var(--bone-faint)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          one question per day · anonymized
        </span>

      </div>

      {/* ── scrollable body ──────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          bottom: 8,
          left: 0,
          right: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* headline + lede */}
        <div
          style={{
            position: 'absolute',
            top: 78,
            left: 56,
            right: 56,
          }}
        >
          <h2
            className="hl-serif"
            style={{
              fontSize: 30,
              fontWeight: 300,
              lineHeight: 1.18,
              letterSpacing: '-0.014em',
              margin: 0,
              color: 'var(--bone)',
            }}
          >
            One question a day. The question travels —{' '}
            <em
              className="hl-italic"
              style={{ color: 'var(--warm)', fontStyle: 'italic' }}
            >
              the answers never do.
            </em>
          </h2>

          <p
            className="hl-serif hl-tight"
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontWeight: 300,
              color: 'var(--bone)',
              lineHeight: 1.2,
              margin: '28px 0 8px',
              maxWidth: '28ch',
            }}
          >
            {question}
          </p>

          <span
            className="hl-mono"
            style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em' }}
          >
            {stamp}
          </span>

          <p
            className="hl-prose"
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'var(--bone-dim)',
              marginTop: 14,
              maxWidth: '64ch',
            }}
          >
            One prompt, generated for the whole archive. Pre-rendered for Instagram (square +
            vertical), the marketing newsletter, X, and podcasts. No identifying content. The
            question alone, in our type, on our ink.
          </p>
        </div>

        {/* tile previews */}
        <div
          style={{
            position: 'absolute',
            top: 380,
            left: 56,
            right: 56,
            display: 'flex',
            gap: 40,
            alignItems: 'flex-start',
          }}
        >
          {VARIANTS.map((v) => (
            <div key={v.label} style={{ flex: '0 0 auto' }}>
              <div className="hl-eyebrow" style={{ marginBottom: 10 }}>
                {v.label}
              </div>
              <Tile question={question} stamp={stamp} audience={audience} />
            </div>
          ))}
        </div>

        {/* notes */}
        <div
          style={{
            position: 'absolute',
            top: 380 + 360 + 56,
            left: 56,
            right: 56,
          }}
        >
          <p
            className="hl-serif"
            style={{
              fontSize: 13.5,
              lineHeight: 1.7,
              fontStyle: 'italic',
              color: 'var(--bone-dim)',
              maxWidth: '60ch',
              margin: 0,
            }}
          >
            The daily sentence is the product's only ambient surface in the open internet. It
            performs the brand without performing the family. Like a Penguin paperback ad — type,
            restraint, and one beautiful thing.
          </p>
        </div>
      </div>

      <TapestryEdge />
    </div>
  );
}
