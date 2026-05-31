import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { aiApi, engagementApi } from '../services/api';

/**
 * DailySentence — "the daily sentence · syndication" (§Pass-3, moment 03).
 *
 * A public, logged-out-reachable surface. One question a day. The question
 * travels — the answers never do. Today's prompt is pulled from the real AI
 * prompt endpoint when available; otherwise we fall back to a sensible static
 * question (never an invented family count).
 *
 * Loom-native: ink surface, Source Serif 4, hairline-framed shareable tiles
 * (IG square / newsletter / IG vertical), no icons, no spinner.
 */

const FALLBACK_QUESTION = 'What did you almost forget to write down today?';

interface PromptResponse {
  // The shape is tolerant — the worker may return any of these field names.
  id?: string;
  prompt?: string;
  prompt_text?: string;
  text?: string;
  question?: string;
}

function pickPromptText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const p = data as PromptResponse & { prompt?: PromptResponse };
  // Some endpoints nest under { prompt: { ... } }
  const node = (p.prompt && typeof p.prompt === 'object' ? p.prompt : p) as PromptResponse;
  const text = node.prompt_text || node.question || node.text || node.prompt;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

/** A single hairline-framed shareable tile. Fixed pixel sizes per the artboard. */
function Tile({
  question,
  stamp,
  audience,
  tall = false,
}: {
  question: string;
  stamp: string;
  audience: string | null;
  tall?: boolean;
}) {
  return (
    <div
      style={{
        width: tall ? 280 : 360,
        height: 360,
        background: 'var(--loom-ink)',
        border: '1px solid var(--loom-rule)',
        padding: '28px 28px 22px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <span
          className="loom-mark"
          style={{ fontSize: 14, color: 'var(--loom-bone)' }}
        >
          <span className="infmark">∞</span>heirloom
        </span>
        <span
          className="loom-mono"
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {stamp}
        </span>
      </div>

      {audience ? (
        <div
          className="loom-serif"
          style={{ fontStyle: 'italic', fontSize: 11, color: 'var(--loom-bone-dim)', marginBottom: 8 }}
        >
          {audience}
        </div>
      ) : null}

      <div
        className="loom-h2"
        style={{
          fontSize: 22,
          lineHeight: 1.18,
          fontWeight: 300,
          color: 'var(--loom-bone)',
          letterSpacing: '-0.014em',
        }}
      >
        {question}
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          borderTop: '1px solid var(--loom-rule)',
          paddingTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          className="loom-mono"
          style={{ fontSize: 9, color: 'var(--loom-bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}
        >
          the listener · daily
        </span>
        <span
          className="loom-mono"
          style={{ fontSize: 9, color: 'var(--loom-warm)', letterSpacing: '0.22em', textTransform: 'uppercase' }}
        >
          heirloom.blue
        </span>
      </div>
    </div>
  );
}

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
        const d = r.data as Record<string, unknown>;
        const raw =
          d.families_connected ??
          d.family_count ??
          d.families ??
          (typeof d.summary === 'object' && d.summary
            ? (d.summary as Record<string, unknown>).families_connected
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
  const audience = families ? `tonight, across ${families.toLocaleString()} families` : null;

  const variants: { tile: string; tall?: boolean }[] = [
    { tile: 'IG square · 1080' },
    { tile: 'Newsletter top' },
    { tile: 'IG vertical · 1080×1350', tall: true },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        boxSizing: 'border-box',
      }}
    >
      {/* minimal standalone top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '1px solid var(--loom-rule)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" className="loom-mark" style={{ textDecoration: 'none' }}>
            <span className="infmark">∞</span>heirloom
          </Link>
          <span style={{ color: 'var(--loom-bone-low)' }}>·</span>
          <span
            className="loom-mono"
            style={{ fontSize: 10.5, color: 'var(--loom-bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}
          >
            the daily sentence · syndication
          </span>
        </span>
        <span
          className="loom-mono"
          style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}
        >
          one question per day · anonymized · multi-format
        </span>
      </header>

      <main style={{ padding: '56px 56px 48px', maxWidth: 1280, margin: '0 auto' }}>
        <h2
          className="loom-h2"
          style={{ fontSize: 'clamp(26px, 3.4vw, 34px)', fontWeight: 300, margin: 0, lineHeight: 1.15, maxWidth: '36ch' }}
        >
          One question a day. The question travels —{' '}
          <span className="loom-serif" style={{ fontStyle: 'italic', color: 'var(--loom-warm)' }}>
            the answers never do.
          </span>
        </h2>
        <p
          className="loom-body"
          style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--loom-bone-dim)', marginTop: 14, maxWidth: '64ch' }}
        >
          One prompt, generated for the whole archive. Pre-rendered for Instagram (square + vertical),
          the marketing newsletter, X, and podcasts. No identifying content. The question alone, in our
          type, on our ink.
        </p>

        {/* the shareable set */}
        <div style={{ marginTop: 48, display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {variants.map((v) => (
            <div key={v.tile} style={{ flex: '0 0 auto' }}>
              <div className="loom-eyebrow" style={{ marginBottom: 10 }}>
                {v.tile}
              </div>
              <Tile question={question} stamp={stamp} audience={audience} tall={v.tall} />
            </div>
          ))}
        </div>

        {/* notes */}
        <div
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 56,
            alignItems: 'flex-end',
          }}
        >
          <p
            className="loom-serif"
            style={{ fontSize: 13.5, lineHeight: 1.7, fontStyle: 'italic', color: 'var(--loom-bone-dim)', maxWidth: '60ch', margin: 0 }}
          >
            The daily sentence is the product's only ambient surface in the open internet. It performs the
            brand without performing the family. Like a Penguin paperback ad — type, restraint, and one
            beautiful thing.
          </p>
          <p
            className="loom-mono"
            style={{
              fontSize: 10,
              color: 'var(--loom-bone-faint)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textAlign: 'right',
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {families ? `${families.toLocaleString()} families · ` : ''}one question · the answers stay home
          </p>
        </div>
      </main>
    </div>
  );
}
