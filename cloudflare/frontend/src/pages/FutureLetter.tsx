import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

/**
 * FutureLetter — cosmic restyle (cosmic-letter.png).
 *
 * A letter written from your 80-year-old self, generated from the values,
 * hopes and fears you note today. Distinct from the hand-written Letter
 * composer (/letters/new) — this one the Listener drafts for you.
 *
 * Visual: intimate dark-paper writing surface, tiny mono eyebrow, serif
 * recipient title, amber ∞ wax seal beside a single outlined pill, and a
 * dim mono "opens when" line. No icons, no glass, ∞ is the only mark.
 */

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

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

/** transparent, hairline-underlined serif field on the dark paper */
const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 0,
  borderBottom: '1px solid var(--rule)',
  borderRadius: 0,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--serif)',
  fontSize: 17,
  lineHeight: 1.85,
  padding: '6px 0',
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
          maxWidth: 560,
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
            marginBottom: 40,
            display: 'block',
          }}
        >
          back to the thread
        </button>

        {/* eyebrow + serif recipient */}
        <header style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            className="hl-mono"
            style={{ fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--warm)' }}
          >
            A letter to
          </div>
          <h1
            className="hl-serif"
            style={{ fontSize: 32, lineHeight: 1.15, color: 'var(--bone)', margin: '12px 0 0', fontWeight: 400 }}
          >
            your future self
          </h1>
        </header>

        {/* the dark-paper writing surface */}
        <div
          style={{
            borderRadius: 4,
            border: '1px solid color-mix(in srgb, var(--warm) 22%, transparent)',
            background: 'color-mix(in srgb, var(--bone) 3%, var(--ink))',
            boxShadow: '0 0 60px -28px color-mix(in srgb, var(--warm) 60%, transparent)',
            padding: 'clamp(24px, 6vw, 40px)',
          }}
        >
          {generatedLetter ? (
            /* the written letter, on the paper */
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
                <p
                  className="hl-serif"
                  style={{ fontSize: 17, fontStyle: 'italic', color: 'var(--bone-dim)', margin: 0 }}
                >
                  Dear younger self,
                </p>
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
                    transition: `color 180ms ${EASE}`,
                  }}
                >
                  {copied ? 'copied' : 'copy'}
                </button>
              </div>
              {shareError && (
                <p className="hl-mono" style={{ fontSize: 9, color: 'var(--danger)', letterSpacing: '0.1em', margin: '0 0 12px' }}>{shareError}</p>
              )}

              <div
                className="hl-prose"
                style={{ whiteSpace: 'pre-wrap', fontSize: 17, color: 'var(--bone)', lineHeight: 1.95, maxWidth: 'none' }}
              >
                {generatedLetter.content}
              </div>

              <p
                className="hl-serif"
                style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--bone-dim)', margin: '24px 0 0' }}
              >
                Your future self
              </p>
              <p
                className="hl-mono"
                style={{ fontSize: 10, color: 'var(--bone-faint)', margin: '8px 0 0', letterSpacing: '0.06em' }}
              >
                {new Date().toLocaleDateString()}
              </p>
            </div>
          ) : (
            /* the open writing form, on the paper */
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 22 }}>
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
                  style={{ ...fieldStyle, minHeight: 64, resize: 'none' }}
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
                  style={{ ...fieldStyle, minHeight: 64, resize: 'none' }}
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
                  style={{ ...fieldStyle, minHeight: 64, resize: 'none' }}
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
                  style={{ ...fieldStyle, minHeight: 64, resize: 'none' }}
                  required
                />
              </div>

              {/* progress hairline while writing */}
              {generateMutation.isPending ? (
                <div style={{ height: 1, background: 'var(--rule)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: '40%',
                      background: 'var(--warm)',
                      animation: `loom-shuttle 1.4s ${EASE} infinite`,
                    }}
                  />
                </div>
              ) : null}

              {genError && (
                <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 11, margin: 0, letterSpacing: '0.04em' }}>
                  {genError}
                </p>
              )}

              {/* seal + outlined pill — the seal-this-letter row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 6 }}>
                <WaxSeal size={26} />
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--warm)',
                    borderRadius: 999,
                    color: 'var(--warm)',
                    cursor: generateMutation.isPending ? 'default' : 'pointer',
                    fontSize: 11,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    padding: '12px 22px',
                    opacity: generateMutation.isPending ? 0.5 : 1,
                    transition: `opacity 180ms ${EASE}`,
                  }}
                >
                  {generateMutation.isPending ? 'writing across time…' : 'seal this letter'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* dim mono "opens when" line beneath the paper */}
        <p
          className="hl-mono"
          style={{
            textAlign: 'center',
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            margin: '24px 0 0',
          }}
        >
          {generatedLetter ? 'sealed across time' : 'opens at the far end of your life'}
        </p>

        {/* previous letters — quiet hairline list */}
        {previousLetters?.letters && previousLetters.letters.length > 0 ? (
          <div style={{ marginTop: 56 }}>
            <div
              className="hl-mono"
              style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 4 }}
            >
              Previous letters
            </div>
            <hr className="hl-rule" style={{ marginBottom: 0 }} />
            <div>
              {previousLetters.letters.map((letter: any) => (
                <div
                  key={letter.id}
                  style={{ borderBottom: '1px solid var(--rule)', paddingTop: 16, paddingBottom: 16 }}
                >
                  <p
                    className="hl-serif"
                    style={{ fontSize: 16, fontWeight: 300, color: 'var(--bone)', margin: '0 0 4px' }}
                  >
                    Letter from your future self
                  </p>
                  <p
                    className="hl-serif"
                    style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--bone-dim)', margin: '0 0 6px' }}
                  >
                    to {letter.recipientName ?? 'you'}
                  </p>
                  <p
                    className="hl-mono"
                    style={{ fontSize: 10, color: 'var(--warm)', margin: 0, letterSpacing: '0.06em' }}
                  >
                    {new Date(letter.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ClothShell>
  );
}
