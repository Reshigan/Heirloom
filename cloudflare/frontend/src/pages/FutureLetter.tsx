import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { UserMenu } from '../loom/components/Frame';
import { SectionLabel } from '../loom/cosmic/CosmicUI';
import { copyToClipboard } from '../utils/clipboard';

/**
 * FutureLetter — CEREMONY archetype.
 *
 * A letter written now, sealed to open at the far end of your life — a ritual
 * of writing-to-the-future. The Listener drafts it from the values, hopes and
 * fears you note today. Distinct from the hand-written Letter composer
 * (/letters/new).
 *
 * Framed as ceremony: a glowing warm ∞ crowns the page, a serif title names the
 * recipient, and mono warm meta reads "SEALED · OPENS <year>". The compose
 * surface (every field, validation, submit/share path, and every branch) sits
 * inside one faint rounded-rect frame. No icons, no glass; ∞ is the only mark.
 */

import { EASE } from '../loom/motion';

/** the year this letter is meant to be opened — the far end of a life */
const OPEN_YEAR = (age: number) => new Date().getFullYear() + Math.max(0, 90 - age);

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
        content: response.data.letter,
        shareText: response.data.shareText,
      });
      queryClient.invalidateQueries({ queryKey: ['future-letters'] });
      setGenError(null);
    },
    onError: () => {
      // Mid-ceremony failure, in-voice — the words are never lost (every field
      // is kept), the rite simply didn't take. Invite one more attempt.
      setGenError('The seal didn’t take — your words are safe. Try sealing once more.');
    },
  });

  const [shareError, setShareError] = useState<string | null>(null);
  const shareMutation = useMutation({
    mutationFn: (id: string) => aiApi.markFutureLetterShared(id),
    onError: (err: any) => setShareError(err?.response?.data?.error ?? 'could not record share'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null); // clear a prior failure so the retry shows a clean hairline
    generateMutation.mutate();
  };

  const handleShare = async () => {
    if (!generatedLetter) return;
    copyToClipboard(generatedLetter.shareText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => { /* leave label unchanged on failure */ });
    shareMutation.mutate(generatedLetter.id);
  };

  const set = (patch: Partial<typeof formData>) => setFormData({ ...formData, ...patch });

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'future letter' }]} />} topbarRight={<UserMenu />}>
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* the sealing mark — woven seal, behind the ceremony, the ∞ rides over it */}
        <picture style={{ display: 'contents' }}>
          <source type="image/avif" srcSet="/woven/seal.avif" />
          <source type="image/webp" srcSet="/woven/seal.webp" />
          <img
            src="/woven/seal.png"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              top: 'calc(var(--page-pad-top) + 60px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'clamp(180px, 44vw, 260px)',
              opacity: 0.07,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        </picture>
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
            marginBottom: 48,
            display: 'block',
          }}
        >
          back to the thread
        </button>

        {/* the ceremony: glowing ∞, serif title, mono warm meta */}
        <header style={{ marginBottom: 40 }}>
          <div
            aria-hidden
            style={{
              color: 'var(--warm)',
              fontSize: 'clamp(40px, 10vw, 64px)',
              lineHeight: 1,
              textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)',
              marginBottom: 24,
            }}
          >
            ∞
          </div>
          <h1
            className="hl-serif"
            style={{ fontSize: 'clamp(24px, 5vw, 34px)', lineHeight: 1.15, color: 'var(--bone)', margin: 0, fontWeight: 400 }}
          >
            A letter to your future self
          </h1>
          <div
            className="hl-mono"
            style={{ fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--warm)', marginTop: 18 }}
          >
            {generatedLetter
              ? `Sealed · ${new Date().getFullYear()}`
              : `Sealed now · Opens ${OPEN_YEAR(formData.currentAge)}`}
          </div>
          <p
            className="hl-serif"
            style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--bone-dim)', margin: '14px auto 0', maxWidth: '26em' }}
          >
            {generatedLetter
              ? 'The words you set down today, kept until the far end of your life.'
              : 'Write to the self you have not yet become. Seal it across time.'}
          </p>
        </header>

        {/* the ceremony frame — the sealed writing surface */}
        <div
          style={{
            textAlign: 'left',
            borderRadius: 0,
            border: '1px solid var(--rule)',
            background: 'color-mix(in srgb, var(--bone) 3%, var(--ink))',
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
                <p className="hl-mono" style={{ fontSize: 9, color: 'var(--warm)', letterSpacing: '0.1em', margin: '0 0 12px' }}>{shareError}</p>
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
                      animation: `loom-shuttle var(--dur-ceremony) ${EASE} infinite`,
                    }}
                  />
                </div>
              ) : null}

              {genError && (
                <p
                  role="status"
                  className="hl-serif"
                  style={{ color: 'var(--bone-dim)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.5, margin: 0, textAlign: 'center' }}
                >
                  {genError}
                </p>
              )}

              {/* the rite — seal this letter (mono warm CTA) */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="hl-mono"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--warm)',
                    borderRadius: 0,
                    color: 'var(--warm)',
                    cursor: generateMutation.isPending ? 'default' : 'pointer',
                    fontSize: 11,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    padding: '13px 28px',
                    opacity: generateMutation.isPending ? 0.5 : 1,
                    transition: `opacity 180ms ${EASE}`,
                  }}
                >
                  {generateMutation.isPending ? 'sealing across time…' : genError ? 'try sealing again →' : 'seal this letter →'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* the ceremony's closing line beneath the frame */}
        <p
          className="hl-mono"
          style={{
            textAlign: 'center',
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            margin: '28px 0 0',
          }}
        >
          {generatedLetter ? 'sealed across time' : 'opens at the far end of your life'}
        </p>

        {/* previous letters — quiet hairline ledger of sealed rites */}
        {previousLetters?.letters && previousLetters.letters.length > 0 ? (
          <div style={{ textAlign: 'left', marginTop: 48 }}>
            <SectionLabel>Sealed before</SectionLabel>
            <hr className="hl-rule" style={{ marginBottom: 0 }} />
            <div>
              {previousLetters.letters.map((letter: any) => (
                <div
                  key={letter.id}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 20, borderBottom: '1px solid var(--rule)', paddingTop: 16, paddingBottom: 16 }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      className="hl-serif"
                      style={{ display: 'block', fontSize: 18, fontWeight: 400, color: 'var(--bone)', lineHeight: 1.3 }}
                    >
                      Letter from your future self
                    </span>
                    <span
                      className="hl-serif"
                      style={{ display: 'block', fontSize: 14, fontStyle: 'italic', color: 'var(--bone-dim)', marginTop: 4 }}
                    >
                      to your future self
                    </span>
                  </span>
                  <span
                    className="hl-mono"
                    style={{ flex: '0 0 auto', fontSize: 11, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                  >
                    Sealed {new Date(letter.createdAt).getFullYear()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ClothShell>
  );
}
