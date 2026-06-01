import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memoriesApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import {
  ComposerModes,
  ComposerRail,
  DyeControl,
  ListenerLine,
  VisibilityControl,
  listenerFor,
  type Visibility,
} from '../loom/components/ComposerChrome';

/**
 * Compose — ComposerPaper (Claude Design · loom3).
 *
 * The canonical write surface: a single Source Serif 4 column on the cloth,
 * the Listener in the right margin, and the design's signature control rail
 * (visibility · lock · dye) along the bottom. Visibility and dye are real,
 * persisted selections — written into the memory's metadata. The warm caret
 * is the live cursor (caret-color), not decoration. Sealing for the future
 * lives in the Letter mode; a paper entry is open now by design.
 */
export function Compose() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('family');
  const [dye, setDye] = useState('walnut');
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const stamp = `${today
    .toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '·')} · ${today
    .toLocaleDateString(undefined, { weekday: 'long' })
    .toLowerCase()}`;

  const listener = useMemo(() => listenerFor(body), [body]);

  const save = useMutation({
    mutationFn: () =>
      memoriesApi
        .create({
          type: 'TEXT',
          title: title.trim() || 'untitled',
          description: body.trim(),
          metadata: { visibility, dye, dyeMotif: dye },
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      navigate('/memories');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? 'Could not save the entry.');
    },
  });

  return (
    <div
      className="hl-screen"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--ink)', color: 'var(--bone)' }}
    >
      {/* hl-topbar */}
      <div
        className="hl-topbar"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        {/* left: logo + wordmark · compose */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <HLogo size={18} wordmark mono color="var(--bone-dim)" wordColor="var(--bone-dim)" glow={false} />
          <span style={{ color: 'var(--bone-dim)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em' }}>
            {' '}·{' '}compose
          </span>
        </span>

        {/* center: date stamp */}
        <span
          className="hl-counter"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'var(--bone-faint)',
            textTransform: 'lowercase',
            whiteSpace: 'nowrap',
          }}
        >
          {stamp}
        </span>

        {/* right: save status / back */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
          {save.isPending ? (
            <span
              className="hl-mono"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--warm)' }}
            >
              weaving…
            </span>
          ) : save.isSuccess ? (
            <span
              className="hl-mono"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--warm)' }}
            >
              woven ✓
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => navigate('/memories')}
            className="hl-link warm"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--warm)',
              padding: 0,
            }}
          >
            back →
          </button>
        </span>
      </div>

      {/* scrollable content area */}
      <div style={{ position: 'absolute', top: 56, bottom: 28, left: 0, right: 0, overflowY: 'auto', padding: '48px 32px 0' }}>
      <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
        {/* header: mode switcher (left) · the Listener (right margin) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 32,
            marginBottom: 8,
          }}
        >
          <div>
            <p
              className="loom-eyebrow"
              style={{ marginBottom: 18, color: 'var(--loom-warm)' }}
            >
              ∞ &nbsp; entry · in your own hand
            </p>
            <ComposerModes active="paper" />
          </div>
          <div style={{ textAlign: 'right', minHeight: 1 }}>
            <ListenerLine text={listener} />
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A title — or leave it"
          style={{
            border: 0,
            background: 'transparent',
            color: 'var(--loom-bone-dim)',
            caretColor: 'var(--loom-warm)',
            fontFamily: "'Source Serif 4', serif",
            fontVariationSettings: "'opsz' 28",
            fontStyle: 'italic',
            fontSize: 26,
            fontWeight: 400,
            letterSpacing: '-0.008em',
            width: '100%',
            outline: 'none',
            padding: 0,
            margin: '6px 0 14px',
            lineHeight: 1.2,
          }}
        />

        <p
          className="loom-mono"
          style={{ fontSize: 11, color: 'var(--loom-bone-faint)', marginBottom: 32 }}
        >
          {stamp}
        </p>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write to the people who will read this. The loom will tell you what it rhymes with."
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            caretColor: 'var(--loom-warm)',
            fontFamily: "'Source Serif 4', serif",
            fontSize: 20,
            lineHeight: 1.85,
            color: 'var(--loom-bone)',
            minHeight: 360,
            maxWidth: '60ch',
            outline: 'none',
            resize: 'vertical',
            padding: 0,
          }}
        />

        {error ? (
          <p
            role="alert"
            className="loom-body"
            style={{ marginTop: 24, fontStyle: 'italic', color: '#c25a5a', fontSize: 14 }}
          >
            {error}
          </p>
        ) : null}

        {/* the control rail — visibility · lock · dye · state */}
        <ComposerRail>
          <VisibilityControl value={visibility} onChange={setVisibility} />
          <span>
            <span style={{ color: 'var(--loom-bone-faint)' }}>lock ·</span>{' '}
            <span style={{ color: 'var(--loom-warm)' }}>open now</span>
          </span>
          <DyeControl value={dye} onChange={setDye} />
          <span style={{ color: 'var(--loom-bone-faint)' }}>
            {save.isPending ? 'weaving…' : 'draft · not yet woven'}
          </span>
        </ComposerRail>

        <div
          style={{
            marginTop: 28,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <p
            className="loom-mono"
            style={{
              margin: 0,
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              maxWidth: 460,
            }}
          >
            encrypted in browser · once saved, the entry becomes immutable in 30 days
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button type="button" onClick={() => navigate('/memories')} className="loom-btn-ghost">
              cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (!body.trim()) {
                  setError('Write something — even a sentence.');
                  return;
                }
                save.mutate();
              }}
              disabled={save.isPending || !body.trim()}
              className="loom-btn"
              style={{ opacity: save.isPending || !body.trim() ? 0.5 : 1 }}
            >
              {save.isPending ? 'saving…' : 'save to weft'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
