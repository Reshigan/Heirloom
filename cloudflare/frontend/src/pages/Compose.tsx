import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memoriesApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

/**
 * Compose — Loom-native rewrite.
 *
 * The page is a single Newsreader column. Title, mono date stamp, body
 * textarea, and a quiet save bar. Same memoriesApi.create call as before;
 * we save type=TEXT by default. Locks and recipients land later via
 * /threads/:id/compose; this surface keeps the daily-write fast.
 */
export function Compose() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const stamp = `${today
    .toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '·')} · ${today
    .toLocaleDateString(undefined, { weekday: 'long' })
    .toLowerCase()}`;

  const save = useMutation({
    mutationFn: () =>
      memoriesApi
        .create({
          type: 'TEXT',
          title: title.trim() || 'untitled',
          description: body.trim(),
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
    <AppFrame>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p className="loom-eyebrow" style={{ marginBottom: 22, color: 'var(--loom-warm)' }}>
          ∞ &nbsp; entry · in your own hand
        </p>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A title — or leave it"
          style={{
            border: 0,
            background: 'transparent',
            color: 'var(--loom-bone)',
            fontFamily: "'Newsreader', serif",
            fontVariationSettings: "'opsz' 28",
            fontSize: 30,
            fontWeight: 300,
            letterSpacing: '-0.008em',
            width: '100%',
            outline: 'none',
            padding: 0,
            marginBottom: 14,
            lineHeight: 1.2,
          }}
        />

        <p
          className="loom-mono"
          style={{ fontSize: 11, color: 'var(--loom-bone-faint)', marginBottom: 36 }}
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
            borderBottom: 0,
            background: 'transparent',
            fontFamily: "'Newsreader', serif",
            fontSize: 19,
            lineHeight: 1.85,
            color: 'var(--loom-bone)',
            minHeight: 360,
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

        <div
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: '1px solid var(--loom-rule)',
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
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              maxWidth: 480,
            }}
          >
            unsaved · encrypted in browser · once saved, the entry becomes immutable in 30 days
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
    </AppFrame>
  );
}
