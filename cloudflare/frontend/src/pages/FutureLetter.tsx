import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';

/**
 * FutureLetter — Loom 3 rewrite (§6 Listener surface).
 *
 * A letter written from your 80-year-old self, generated from the values,
 * hopes and fears you note today. Distinct from the hand-written Letter
 * composer (/letters/new) — this one the Listener drafts for you.
 * No AppFrame, no icons, no glassmorphism. One column, ink ground, bone cloth.
 */

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 400,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
  marginBottom: 10,
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--rule)',
  borderRadius: 0,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--serif)',
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
  const [genError, setGenError] = useState<string | null>(null);

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
      setGenError(null);
    },
    onError: () => {
      setGenError('Generation failed. Please try again.');
    },
  });

  const [shareError, setShareError] = useState<string | null>(null);
  const shareMutation = useMutation({
    mutationFn: (id: string) => aiApi.markFutureLetterShared(id),
    onError: (err: any) => setShareError(err?.response?.data?.error ?? 'could not record share'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate();
  };

  const handleShare = async () => {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter.shareText).catch(() => {});
    setCopied(true);
    shareMutation.mutate(generatedLetter.id);
    setTimeout(() => setCopied(false), 2000);
  };

  const set = (patch: Partial<typeof formData>) => setFormData({ ...formData, ...patch });

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'future letter' }]} />} topbarCenter="future letter" topbarRight={<UserMenu />}>
      <div
        style={{
          maxWidth: 'var(--page-max-wide)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {/* back link */}
        <button
          type="button"
          onClick={() => navigate('/loom/index')}
          className="hl-mono"
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            marginBottom: 36,
            display: 'block',
          }}
        >
          back to the thread
        </button>

        {/* page heading */}
        <header style={{ marginBottom: 48, maxWidth: 640 }}>
          <p className="hl-eyebrow" style={{ marginBottom: 14, color: 'var(--warm)' }}>
            a letter across time
          </p>
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 'var(--type-display)',
              fontWeight: 300,
              margin: '0 0 28px',
              color: 'var(--bone)',
            }}
          >
            A letter from the past.
          </h1>
          <p
            className="hl-prose"
            style={{ fontSize: 17, color: 'var(--bone-dim)', margin: 0 }}
          >
            Written from your 80-year-old self, reflecting on the values, hopes and fears you hold
            today. A quiet reminder of what truly matters — drafted by the Listener, kept by you.
          </p>
        </header>

        <hr className="hl-rule" style={{ marginBottom: 48 }} />

        <div style={{ display: 'grid', gap: 64, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* left: input form */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
            <h2
              className="hl-serif"
              style={{ fontSize: 22, fontWeight: 300, margin: 0, color: 'var(--bone)' }}
            >
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
                style={{ ...fieldStyle, minHeight: 84, resize: 'none' }}
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
                style={{ ...fieldStyle, minHeight: 84, resize: 'none' }}
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
                style={{ ...fieldStyle, minHeight: 84, resize: 'none' }}
                required
              />
            </div>

            <div>
              <label htmlFor="fl-loved" style={labelStyle}>Who are your loved ones?</label>
              <textarea
                id="fl-loved"
                value={formData.lovedOnes}
                onChange={(e) => set({ lovedOnes: e.target.value })}
                placeholder="The people you love, the ones who matter most…"
                style={{ ...fieldStyle, minHeight: 84, resize: 'none' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="hl-btn"
              style={{ opacity: generateMutation.isPending ? 0.5 : 1, justifySelf: 'start' }}
            >
              {generateMutation.isPending ? 'writing across time…' : 'generate my letter'}
            </button>

            {genError && (
              <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 11, margin: '4px 0 0', letterSpacing: '0.04em' }}>
                {genError}
              </p>
            )}

            {generateMutation.isPending ? (
              <div style={{ height: 1, background: 'var(--rule)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: '40%',
                    background: 'var(--warm)',
                    animation: 'loom-shuttle 1.4s cubic-bezier(0.16,1,0.3,1) infinite',
                  }}
                />
              </div>
            ) : null}
          </form>

          {/* right: letter display + previous letters */}
          <div style={{ display: 'grid', gap: 32, alignContent: 'start' }}>
            {generatedLetter ? (
              /* inner letter card */
              <div
                style={{
                  border: '1px solid var(--rule)',
                  padding: '40px 48px',
                  maxWidth: 640,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: 28,
                  }}
                >
                  <h2
                    className="hl-serif"
                    style={{ fontSize: 18, fontWeight: 300, margin: 0, color: 'var(--bone)' }}
                  >
                    Your letter
                  </h2>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="hl-mono"
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: copied ? 'var(--warm)' : 'var(--bone-faint)',
                      padding: 0,
                    }}
                  >
                    {copied ? 'copied' : 'copy'}
                  </button>
                </div>
                {shareError && (
                  <p className="hl-mono" style={{ fontSize: 9, color: 'var(--danger)', letterSpacing: '0.1em', margin: '0 0 8px' }}>{shareError}</p>
                )}

                {/* salutation */}
                <p
                  className="hl-serif"
                  style={{
                    fontSize: 16,
                    fontStyle: 'italic',
                    color: 'var(--bone-dim)',
                    margin: '0 0 18px',
                  }}
                >
                  Dear younger self,
                </p>

                {/* body */}
                <div
                  className="hl-prose"
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: 17,
                    color: 'var(--bone-dim)',
                    lineHeight: 1.85,
                    maxWidth: 'none',
                  }}
                >
                  {generatedLetter.content}
                </div>

                {/* author */}
                <p
                  className="hl-serif"
                  style={{
                    fontSize: 16,
                    fontStyle: 'italic',
                    color: 'var(--bone-dim)',
                    marginTop: 20,
                    marginBottom: 0,
                  }}
                >
                  Your future self
                </p>

                {/* date */}
                <p
                  className="hl-mono"
                  style={{
                    fontSize: 10,
                    color: 'var(--bone-faint)',
                    marginTop: 8,
                    letterSpacing: '0.06em',
                  }}
                >
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid var(--rule)',
                  borderRadius: 0,
                  textAlign: 'center',
                  padding: '64px 28px',
                }}
              >
                <p
                  className="hl-serif"
                  style={{ fontSize: 30, color: 'var(--bone-faint)', margin: '0 0 16px' }}
                  aria-hidden
                >
                  ∞
                </p>
                <p
                  className="hl-prose"
                  style={{ color: 'var(--bone-dim)', fontSize: 15, margin: '0 auto' }}
                >
                  Fill in the lines and the Listener will write you a letter from the far end of
                  your life.
                </p>
              </div>
            )}

            {/* previous letters list */}
            {previousLetters?.letters && previousLetters.letters.length > 0 ? (
              <div>
                <h3
                  className="hl-serif"
                  style={{ fontSize: 17, fontWeight: 300, margin: '0 0 8px', color: 'var(--bone)' }}
                >
                  Previous letters
                </h3>
                <hr className="hl-rule" style={{ marginBottom: 0 }} />
                <div>
                  {previousLetters.letters.map((letter: any) => (
                    <div
                      key={letter.id}
                      style={{
                        borderBottom: '1px solid var(--rule)',
                        paddingTop: 18,
                        paddingBottom: 18,
                      }}
                    >
                      {/* title */}
                      <p
                        className="hl-serif"
                        style={{
                          fontSize: 16,
                          fontWeight: 300,
                          color: 'var(--bone)',
                          margin: '0 0 4px',
                        }}
                      >
                        Letter from your future self
                      </p>

                      {/* recipient */}
                      <p
                        className="hl-serif"
                        style={{
                          fontSize: 14,
                          fontStyle: 'italic',
                          color: 'var(--bone-dim)',
                          margin: '0 0 6px',
                        }}
                      >
                        to {letter.recipientName ?? 'you'}
                      </p>

                      {/* delivery date */}
                      <p
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          color: 'var(--warm)',
                          margin: 0,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ClothShell>
  );
}
