import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { foundersApi, billingApi, type FounderCount } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { HLogo } from '../loom/components/HLogo';
import { PLAN_PRICE } from '../lib/plans';

const META_TITLE = 'Founder Access';
const META_DESCRIPTION = 'Permanent access to Heirloom — one lifetime fee for the whole family thread.';
const OG_IMAGE = 'https://heirloom.blue/og-image.png?v=20260615b';
const CANONICAL = 'https://heirloom.blue/founder';

const BENEFITS: { heading: string; body: string }[] = [
  {
    heading: 'Lifetime Family-tier access.',
    body: 'No subscription, no renewal. Your descendants inherit the same plan.',
  },
  {
    heading: 'Your name in the continuity record.',
    body: 'A physical document filed with the successor non-profit at incorporation — not a webpage that can be deleted.',
  },
  {
    heading: 'Quarterly call with the founder.',
    body: 'For as long as Heirloom operates. Your input shapes the roadmap.',
  },
  {
    heading: 'You fund the non-profit transition.',
    body: 'Your pledge seeds the 501(c)(3) that holds the archive if the company winds down.',
  },
  {
    heading: 'Welcome to the Opening Cohort.',
    body: 'The first hundred families. Letters and dinners where geography allows. Not a Slack.',
  },
];

// ─── shared underline-only input style (FORM archetype) ────────────────────
const inputBase: React.CSSProperties = {
  width:           '100%',
  maxWidth:        '100%',
  background:      'transparent',
  border:          0,
  borderBottom:    '1px solid var(--rule)',
  color:           'var(--bone)',
  caretColor:      'var(--warm)',
  fontFamily:      'var(--serif)',
  fontSize:        18,
  lineHeight:      1.7,
  padding:         '10px 0',
  outline:         'none',
  boxSizing:       'border-box' as const,
};

const inputFocusStyle = `
  .founder-input:focus { border-bottom-color: var(--warm) !important; }
  .founder-input::placeholder { color: var(--bone-faint); }
  .founder-textarea:focus { border-bottom-color: var(--warm) !important; }
  .founder-textarea::placeholder { color: var(--bone-faint); }
  .founder-cta:focus-visible { outline: 1px solid var(--warm); outline-offset: 2px; }
`;

const labelBase: React.CSSProperties = {
  display:       'block',
  fontFamily:    'var(--mono)',
  fontSize:      10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color:         'var(--bone-faint)',
  marginBottom:  8,
};

export function Founder() {
  const [count, setCount] = useState<FounderCount | null>(null);

  // Localized Founder one-time price for display. Falls back to "$249" until the
  // pricing endpoint resolves (or if it fails). Stripe charges the dynamic
  // price_data amount regardless — this is display source only.
  const [priceDisplay, setPriceDisplay] = useState<string>(PLAN_PRICE.FOUNDER.amount);

  // pledge form state
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [familyName, setFamilyName] = useState('');
  const [notes, setNotes]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState<{ message: string } | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    foundersApi
      .count()
      .then((r) => setCount(r.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    billingApi
      .getPricing()
      .then((r) => {
        const founder = (r.data?.tiers ?? []).find((t: any) => t.id === 'FOUNDER');
        const display = founder?.oneTime?.display;
        if (typeof display === 'string' && display) setPriceDisplay(display);
      })
      .catch(() => undefined);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await foundersApi.pledge({
        name:        name.trim(),
        email:       email.trim(),
        family_name: familyName.trim() || undefined,
        notes:       notes.trim()      || undefined,
      });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      setDone({
        message: res.data.message ?? 'Thank you. We will be in touch within two business days.',
      });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not record your pledge.');
    } finally {
      setSubmitting(false);
    }
  };

  const pledged   = count ? count.pledged   : null;
  const cap       = count ? count.cap       : 100;
  const remaining = count ? count.remaining : null;

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark href="/" />}
      topbarCenter="founders"
      topbarRight={<UserMenu />}
    >
      <Helmet>
        <title>{`${META_TITLE} · Heirloom`}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={OG_IMAGE} />
        <link rel="canonical" href={CANONICAL} />
      </Helmet>
      <style>{inputFocusStyle}</style>

      {/* ── FORM archetype: centered column, vast air ──────────────────── */}
      <div
        style={{
          position:       'absolute',
          top:             84,
          bottom:          0,
          left:            0,
          right:           0,
          overflowY:      'auto',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          padding:        'clamp(48px, 8vh, 96px) 24px 80px',
        }}
      >
        {/* ── Mono eyebrow ─────────────────────────────────────────────── */}
        <p
          style={{
            fontFamily:    'var(--mono)',
            fontSize:       10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color:         'var(--bone-faint)',
            margin:        '0 0 28px',
            textAlign:     'center',
          }}
        >
          founder · {priceDisplay} · once · lifetime
        </p>

        {/* ── Giant serif headline ──────────────────────────────────────── */}
        <h1
          style={{
            fontFamily:  'var(--serif-display)',
            fontSize:    'clamp(40px, 9vw, 72px)',
            fontWeight:   500,
            lineHeight:   1.05,
            color:       'var(--bone)',
            textAlign:   'center',
            margin:      '0 0 20px',
            maxWidth:    '16ch',
            position:    'relative',
            zIndex:       1,
          }}
        >
          Become one of{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--warm)' }}>
            the hundred.
          </em>
        </h1>

        {/* ── Serif-italic sub ─────────────────────────────────────────── */}
        <p
          style={{
            fontFamily:  'var(--serif)',
            fontStyle:   'italic',
            fontSize:    18,
            color:       'var(--bone-dim)',
            textAlign:   'center',
            margin:      '0 0 56px',
            maxWidth:    '48ch',
            lineHeight:   1.6,
          }}
        >
          One hundred families seed the successor non-profit. Your name is
          engraved in the continuity record. Your bloodline gets lifetime
          Family-tier access.
        </p>

        {/* ── Live count ───────────────────────────────────────────────── */}
        <div
          style={{
            display:        'flex',
            alignItems:     'baseline',
            gap:             12,
            marginBottom:    56,
          }}
        >
          <span
            style={{
              fontFamily:    'var(--serif-display)',
              fontSize:       40,
              fontWeight:     400,
              color:         'var(--bone)',
              lineHeight:     1,
              letterSpacing: '0.02em',
            }}
          >
            {pledged !== null ? pledged : '—'}
          </span>
          <span
            style={{
              fontFamily:    'var(--mono)',
              fontSize:       10,
              color:         'var(--bone-faint)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            / {cap} founders
          </span>
          {remaining !== null && (
            <span
              style={{
                fontFamily:    'var(--mono)',
                fontSize:       10,
                color:         'var(--warm)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginLeft:     8,
              }}
            >
              {remaining} remaining
            </span>
          )}
        </div>

        {/* ── Done state ───────────────────────────────────────────────── */}
        {done ? (
          <div
            role="status"
            style={{
              textAlign:  'center',
              maxWidth:    400,
              display:    'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap:         16,
            }}
          >
            {/* ponytail: hairline non-mark — foot WaxSeal ∞ co-renders, so this stays a rule */}
            <span
              aria-hidden
              style={{
                display:       'block',
                width:          48,
                height:         1,
                background:    'var(--rule)',
              }}
            />
            <h2
              style={{
                fontFamily:  'var(--serif-display)',
                fontSize:     30,
                fontWeight:   500,
                fontStyle:   'italic',
                margin:       0,
                color:       'var(--bone)',
              }}
            >
              Pledge received.
            </h2>
            <p
              style={{
                fontFamily:  'var(--serif)',
                fontSize:     16,
                color:       'var(--bone-dim)',
                margin:       0,
                maxWidth:    '36ch',
                lineHeight:   1.6,
              }}
            >
              {done.message}
            </p>
            <Link
              to="/"
              className="founder-cta"
              style={{
                fontFamily:     'var(--mono)',
                fontSize:        10,
                letterSpacing:  '0.18em',
                textTransform:  'uppercase',
                color:          'var(--warm)',
                textDecoration: 'none',
                marginTop:       8,
                display:        'inline-flex',
                alignItems:     'center',
                minHeight:      44,
                padding:        '12px 0',
              }}
            >
              back to heirloom →
            </Link>
          </div>
        ) : (
          /* ── Pledge form (FORM archetype) ──────────────────────────── */
          <form
            onSubmit={submit}
            aria-label="Founder pledge form"
            style={{
              display:        'flex',
              flexDirection:  'column',
              gap:             28,
              width:          '100%',
              maxWidth:        480,
            }}
          >
            {/* Name + Email side by side on wider viewports */}
            <div
              style={{
                display:             'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap:                  24,
              }}
            >
              <div>
                <label htmlFor="f-name" style={labelBase}>
                  Your name <span style={{ color: 'var(--warm)' }} aria-hidden>*</span>
                </label>
                <input
                  id="f-name"
                  className="founder-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputBase}
                />
              </div>
              <div>
                <label htmlFor="f-email" style={labelBase}>
                  Email <span style={{ color: 'var(--warm)' }} aria-hidden>*</span>
                </label>
                <input
                  id="f-email"
                  className="founder-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputBase}
                />
              </div>
            </div>

            <div>
              <label htmlFor="f-family" style={labelBase}>Family name — optional</label>
              <input
                id="f-family"
                className="founder-input"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="your family name"
                style={inputBase}
              />
            </div>

            <div>
              <label htmlFor="f-notes" style={labelBase}>Why this matters — optional</label>
              <textarea
                id="f-notes"
                className="founder-textarea"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="A few sentences. Your grandmother. The recipe nobody wrote down."
                style={{ ...inputBase, resize: 'none' }}
              />
            </div>

            {/* Inline error — mono, no toast */}
            {error && (
              <p
                role="alert"
                style={{
                  fontFamily:    'var(--mono)',
                  fontSize:       11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color:         'var(--warm)',
                  margin:         0,
                }}
              >
                {error}
              </p>
            )}

            {/* Primary CTA — mono uppercase pill, warm */}
            <button
              type="submit"
              className="founder-cta"
              disabled={submitting || !name.trim() || !email.trim()}
              style={{
                fontFamily:     'var(--mono)',
                fontSize:        11,
                letterSpacing:  '0.2em',
                textTransform:  'uppercase',
                color:          'var(--warm)',
                background:     'transparent',
                border:          '1px solid var(--warm)',
                borderRadius:    0,
                padding:        '14px 32px',
                minHeight:       44,
                cursor:          submitting || !name.trim() || !email.trim() ? 'not-allowed' : 'pointer',
                opacity:         submitting || !name.trim() || !email.trim() ? 0.45 : 1,
                alignSelf:      'flex-start',
                transition:     'opacity 180ms var(--ease)',
              }}
            >
              {submitting ? 'submitting…' : `Become a founder · ${priceDisplay} once`}
            </button>

            <Link
              to="/gift"
              className="founder-cta"
              style={{
                fontFamily:     'var(--mono)',
                fontSize:        10,
                letterSpacing:  '0.14em',
                textTransform:  'uppercase',
                color:          'var(--bone-faint)',
                textDecoration: 'none',
                marginTop:      -8,
                display:        'inline-flex',
                alignItems:     'center',
                minHeight:      44,
                padding:        '12px 0',
              }}
            >
              or gift one →
            </Link>
          </form>
        )}

        {/* ── Benefits ─────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop:  72,
            width:      '100%',
            maxWidth:    480,
          }}
        >
          {BENEFITS.map((b, i) => (
            <div
              key={b.heading}
              style={{
                display:         'grid',
                gridTemplateColumns: '14px 1fr',
                gap:              16,
                borderTop:       '1px solid var(--rule)',
                paddingTop:       14,
                paddingBottom:    14,
                alignItems:      'baseline',
              }}
            >
              {/* ponytail: index numeral non-mark — singular ∞ law (foot WaxSeal is the one mark) */}
              <span
                aria-hidden
                style={{
                  fontFamily:    'var(--mono)',
                  fontSize:       10,
                  color:         'var(--bone-faint)',
                  letterSpacing: '0.1em',
                  lineHeight:     1,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p
                  style={{
                    fontFamily:  'var(--serif)',
                    fontSize:     16,
                    color:       'var(--bone)',
                    margin:      '0 0 3px',
                    lineHeight:   1.4,
                  }}
                >
                  {b.heading}
                </p>
                <p
                  style={{
                    fontFamily:  'var(--serif)',
                    fontStyle:   'italic',
                    fontSize:     13,
                    color:       'var(--bone-dim)',
                    margin:       0,
                    lineHeight:   1.7,
                  }}
                >
                  {b.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Continuity record panel ───────────────────────────────────── */}
        <div
          style={{
            marginTop:   72,
            width:       '100%',
            maxWidth:     480,
            borderTop:   '1px solid var(--rule)',
            paddingTop:   32,
          }}
        >
          <p
            style={{
              fontFamily:    'var(--mono)',
              fontSize:       10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         'var(--bone-faint)',
              margin:        '0 0 16px',
            }}
          >
            continuity record · live
          </p>
          <p
            style={{
              fontFamily:  'var(--serif)',
              fontSize:     17,
              fontStyle:   'italic',
              color:       'var(--bone-faint)',
              margin:       0,
              lineHeight:   1.6,
            }}
          >
            pledge records are sealed until we reach the founding cohort.
          </p>
        </div>

        {/* ── WaxSeal foot ─────────────────────────────────────────────── */}
        <div style={{ marginTop: 80, textAlign: 'center' }}>
          <span
            aria-hidden
            style={{
              fontFamily:  'var(--serif)',
              fontSize:    'clamp(32px,6vw,48px)',
              color:       'var(--warm)',
              lineHeight:   1,
            }}
          >
            ∞
          </span>
        </div>
      </div>
    </ClothShell>
  );
}
