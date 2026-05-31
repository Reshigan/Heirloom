import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

/**
 * FutureLetter — Loom-native rewrite.
 *
 * A letter written from your 80-year-old self, generated from the values,
 * hopes and fears you note today. Distinct from the hand-written Letter
 * composer (/letters/new) — this one the Listener drafts for you. Reskinned
 * off the retired void/paper/gold tokens onto the loom constitution: one
 * Source Serif 4 column, ink/bone/warm, hairline progress, no chrome.
 */

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--loom-bone-faint)',
  marginBottom: 10,
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  color: 'var(--loom-bone)',
  caretColor: 'var(--loom-warm)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 16,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
};

export function FutureLetter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    currentAge: 30,
    values: '',
    hopes: '',
    fears: '',
    lovedOnes: '',
  });
  const [generatedLetter, setGeneratedLetter] = useState<{ id: string; content: string; shareText: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: previousLetters } = useQuery({
    queryKey: ['future-letters'],
    queryFn: () => aiApi.getFutureLetters().then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => aiApi.generateFutureLetter(formData),
    onSuccess: (response) => {
      setGeneratedLetter({
        id: response.data.id,
        content: response.data.letterContent,
        shareText: response.data.shareText,
      });
      queryClient.invalidateQueries({ queryKey: ['future-letters'] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: (id: string) => aiApi.markFutureLetterShared(id),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate();
  };

  const handleShare = async () => {
    if (!generatedLetter) return;
    try {
      await navigator.clipboard.writeText(generatedLetter.shareText);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = generatedLetter.shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    shareMutation.mutate(generatedLetter.id);
    setTimeout(() => setCopied(false), 2000);
  };

  const set = (patch: Partial<typeof formData>) => setFormData({ ...formData, ...patch });

  return (
    <AppFrame>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <button
          type="button"
          onClick={() => navigate('/memories')}
          className="loom-mono"
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
            marginBottom: 36,
          }}
        >
          ← back to the thread
        </button>

        <header style={{ marginBottom: 44, maxWidth: 640 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 14, color: 'var(--loom-warm)' }}>
            ∞ &nbsp; a letter across time
          </p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            Letter from your future self.
          </h1>
          <p
            className="loom-body"
            style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', lineHeight: 1.6 }}
          >
            Written from your 80-year-old self, reflecting on the values, hopes and fears you hold
            today. A quiet reminder of what truly matters — drafted by the Listener, kept by you.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 48, gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
            <h2 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>
              Tell the Listener about yourself
            </h2>

            <div>
              <label htmlFor="fl-age" style={labelStyle}>Your current age</label>
              <input
                id="fl-age"
                type="number"
                min={18}
                max={100}
                value={formData.currentAge}
                onChange={(e) => set({ currentAge: parseInt(e.target.value) || 30 })}
                style={fieldStyle}
                required
              />
            </div>

            <div>
              <label htmlFor="fl-values" style={labelStyle}>What do you value most?</label>
              <textarea
                id="fl-values"
                value={formData.values}
                onChange={(e) => set({ values: e.target.value })}
                placeholder="Family, creativity, adventure, helping others…"
                style={{ ...fieldStyle, minHeight: 84, resize: 'vertical' }}
                required
              />
            </div>

            <div>
              <label htmlFor="fl-hopes" style={labelStyle}>What are your hopes for the future?</label>
              <textarea
                id="fl-hopes"
                value={formData.hopes}
                onChange={(e) => set({ hopes: e.target.value })}
                placeholder="To see my children grow, to travel the world…"
                style={{ ...fieldStyle, minHeight: 84, resize: 'vertical' }}
                required
              />
            </div>

            <div>
              <label htmlFor="fl-fears" style={labelStyle}>What are your fears?</label>
              <textarea
                id="fl-fears"
                value={formData.fears}
                onChange={(e) => set({ fears: e.target.value })}
                placeholder="Not having enough time, losing loved ones…"
                style={{ ...fieldStyle, minHeight: 84, resize: 'vertical' }}
                required
              />
            </div>

            <div>
              <label htmlFor="fl-loved" style={labelStyle}>Who are your loved ones?</label>
              <textarea
                id="fl-loved"
                value={formData.lovedOnes}
                onChange={(e) => set({ lovedOnes: e.target.value })}
                placeholder="My partner Sarah, my kids Emma and Jack, my best friend Mike…"
                style={{ ...fieldStyle, minHeight: 84, resize: 'vertical' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="loom-btn"
              style={{ opacity: generateMutation.isPending ? 0.5 : 1, justifySelf: 'start' }}
            >
              {generateMutation.isPending ? 'writing across time…' : 'generate my letter'}
            </button>

            {generateMutation.isPending ? (
              <div style={{ height: 1, background: 'var(--loom-rule)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: '40%',
                    background: 'var(--loom-warm)',
                    animation: 'loom-shuttle 1.4s var(--loom-ease) infinite',
                  }}
                />
              </div>
            ) : null}
          </form>

          <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
            {generatedLetter ? (
              <div style={{ border: '1px solid var(--loom-rule)', borderRadius: 2, padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 className="loom-serif" style={{ fontSize: 20, fontWeight: 300, margin: 0 }}>Your letter</h2>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="loom-mono"
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: copied ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
                    }}
                  >
                    {copied ? 'copied ✓' : 'copy'}
                  </button>
                </div>
                <div
                  className="loom-body"
                  style={{ whiteSpace: 'pre-wrap', fontSize: 17, color: 'var(--loom-bone)', lineHeight: 1.85 }}
                >
                  {generatedLetter.content}
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid var(--loom-rule)',
                  borderRadius: 2,
                  textAlign: 'center',
                  padding: '64px 28px',
                }}
              >
                <p className="loom-serif" style={{ fontSize: 30, color: 'var(--loom-bone-faint)', margin: '0 0 16px' }} aria-hidden>
                  ∞
                </p>
                <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 15 }}>
                  Fill in the lines and the Listener will write you a letter from the far end of your life.
                </p>
              </div>
            )}

            {previousLetters?.letters && previousLetters.letters.length > 0 ? (
              <div style={{ border: '1px solid var(--loom-rule)', borderRadius: 2, padding: 28 }}>
                <h3 className="loom-serif" style={{ fontSize: 17, fontWeight: 300, margin: '0 0 18px' }}>
                  Previous letters
                </h3>
                <div style={{ display: 'grid', gap: 16, maxHeight: 300, overflowY: 'auto' }}>
                  {previousLetters.letters.map((letter: any) => (
                    <div key={letter.id} style={{ borderLeft: '1px solid var(--loom-rule)', paddingLeft: 16 }}>
                      <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: '0 0 6px', letterSpacing: '0.06em' }}>
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                      <p
                        className="loom-body"
                        style={{
                          color: 'var(--loom-bone-dim)',
                          fontSize: 14,
                          lineHeight: 1.7,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {letter.letterContent}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
