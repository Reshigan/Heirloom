import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { foundersApi, type FounderCount } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { TapestryCanvas } from '../loom/components/TapestryCanvas';

// ─── mock continuity-record rows (replace with real API when available) ───────
const MOCK_ROWS: { pledge: string; name: string; location: string }[] = [
  { pledge: '001', name: 'Yusra Al-Rashid',      location: 'Dubai · UAE'       },
  { pledge: '002', name: 'Thomas Beaumont-Carr',  location: 'Edinburgh · UK'    },
  { pledge: '003', name: '— reserved',            location: ''                  },
  { pledge: '004', name: 'Mei-Ling Sorenson',     location: 'Vancouver · CA'    },
  { pledge: '005', name: 'Rafael Mendes',         location: 'São Paulo · BR'    },
  { pledge: '006', name: '— reserved',            location: ''                  },
  { pledge: '007', name: 'Priya Nair-Holloway',   location: 'London · UK'       },
  { pledge: '008', name: 'James Okafor',          location: 'Lagos · NG'        },
  { pledge: '009', name: '— reserved',            location: ''                  },
  { pledge: '010', name: 'Ingrid Halvorsen',      location: 'Oslo · NO'         },
  { pledge: '011', name: 'David Chen-Whitfield',  location: 'Sydney · AU'       },
  { pledge: '012', name: '— reserved',            location: ''                  },
];

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

export function Founder() {
  const demoEntries = Array.from({ length: 80 }, (_, i) => ({
    date: new Date(1948 + Math.floor(i * 0.65), (i * 3) % 12, 1),
    n: i,
    dye: ['madder', 'indigo', 'saffron', 'weld', 'woad', 'cochineal'][i % 6] as string,
    tier: 'family' as const,
  }));

  const [count, setCount] = useState<FounderCount | null>(null);

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

  const pledged  = count ? count.cap - count.remaining : null;
  const cap      = count ? count.cap                   : 100;
  const remaining = count ? count.remaining            : null;

  // ─── shared input styles ────────────────────────────────────────────────────
  const inputBase: React.CSSProperties = {
    width:        '100%',
    background:   'transparent',
    border:       '1px solid var(--rule-strong)',
    borderRadius:  2,
    color:         'var(--bone)',
    caretColor:    'var(--warm)',
    fontFamily:    'var(--serif)',
    fontSize:       16,
    lineHeight:     1.7,
    padding:       '10px 14px',
    outline:       'none',
    boxSizing:     'border-box',
  };

  const labelBase: React.CSSProperties = {
    display:       'block',
    fontFamily:    'var(--mono)',
    fontSize:       10,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color:         'var(--bone-faint)',
    marginBottom:   8,
  };

  return (
    <div
      className="hl-screen"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {/* ── animated specimen cloth hero ────────────────────────────────── */}
      <div style={{ background: 'var(--ink)', marginBottom: 0, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0, pointerEvents: 'none' }}>
        <TapestryCanvas
          width={typeof window !== 'undefined' ? window.innerWidth : 1280}
          height={240}
          entries={demoEntries}
          kind="specimen"
          animate
          opts={{ tStart: new Date(1948, 0, 1), tEnd: new Date(2026, 0, 1), background: '#0e0e0c' }}
        />
      </div>

      {/* ── topbar ────────────────────────────────────────────────────────── */}
      <header
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          padding:         '24px 56px',
          fontFamily:      'var(--mono)',
          fontSize:         10.5,
          textTransform:   'uppercase',
          letterSpacing:   '0.22em',
          color:           'var(--bone-dim)',
          position:        'absolute',
          top:              240,
          left:             0,
          right:            0,
          zIndex:           10,
          flexShrink:       0,
        }}
      >
        {/* left: logo + wordmark */}
        <HLogo size={20} wordmark mono color="var(--bone-dim)" wordColor="var(--bone-dim)" />

        {/* right: nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link
            to="/loom"
            style={{
              fontFamily:     'var(--mono)',
              fontSize:        10.5,
              letterSpacing:  '0.22em',
              textTransform:  'uppercase',
              color:          'var(--bone-dim)',
              textDecoration: 'none',
            }}
          >
            see the cloth
          </Link>
          <span
            style={{
              fontFamily:    'var(--mono)',
              fontSize:       10.5,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color:         'var(--warm)',
            }}
          >
            founder
          </span>
          <Link
            to="/login"
            style={{
              fontFamily:     'var(--mono)',
              fontSize:        10.5,
              letterSpacing:  '0.22em',
              textTransform:  'uppercase',
              color:          'var(--bone-dim)',
              textDecoration: 'none',
            }}
          >
            sign in
          </Link>
        </nav>
      </header>

      {/* ── two-column body ──────────────────────────────────────────────── */}
      <div
        style={{
          position:              'absolute',
          top:                    316,
          bottom:                 0,
          left:                   0,
          right:                  0,
          display:               'grid',
          gridTemplateColumns:   'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          overflow:              'auto',
        }}
      >
        {/* ── LEFT: pitch + form ─────────────────────────────────────────── */}
        <div
          style={{
            padding:        '72px 64px 64px',
            display:        'flex',
            flexDirection:  'column',
            overflowY:      'auto',
          }}
        >
          {/* eyebrow */}
          <p
            className="hl-eyebrow"
            style={{ marginBottom: 22 }}
          >
            founder · $240 · once · lifetime
          </p>

          {/* headline */}
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize:    56,
              fontWeight:  300,
              margin:       0,
              color:       'var(--bone)',
            }}
          >
            Become one of the names{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--warm)' }}>
              in the continuity record.
            </em>
          </h1>

          {/* prose */}
          <p
            className="hl-prose"
            style={{
              fontSize:  17,
              color:     'var(--bone-dim)',
              marginTop:  28,
              maxWidth:  '52ch',
            }}
          >
            One hundred families seed the successor non-profit. Your name is
            engraved in the public continuity record. Your bloodline gets
            lifetime Family-tier access. The thread that outlives all of us
            has its first hundred names — yours among them.
          </p>

          {/* benefits */}
          <div
            style={{
              marginTop: 40,
              display:   'grid',
              gap:        0,
            }}
          >
            {BENEFITS.map((b) => (
              <div
                key={b.heading}
                style={{
                  display:             'grid',
                  gridTemplateColumns: '14px 1fr',
                  gap:                  18,
                  borderTop:           '1px solid var(--rule)',
                  paddingTop:           12,
                  paddingBottom:        12,
                  alignItems:          'baseline',
                }}
              >
                <span
                  className="hl-serif"
                  style={{ fontSize: 14, color: 'var(--warm)', lineHeight: 1 }}
                >
                  ∞
                </span>
                <div>
                  <p
                    className="hl-serif"
                    style={{
                      fontSize:     16,
                      color:        'var(--bone)',
                      margin:       '0 0 3px',
                      lineHeight:    1.4,
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

          {/* CTA */}
          <div style={{ marginTop: 40 }}>
            {done ? (
              <div
                role="status"
                style={{
                  border:      '1px solid var(--rule)',
                  padding:      40,
                  textAlign:   'center',
                }}
              >
                <p
                  className="hl-serif"
                  style={{
                    fontSize:    36,
                    color:       'var(--warm)',
                    margin:     '0 0 20px',
                    lineHeight:   1,
                  }}
                  aria-hidden
                >
                  ∞
                </p>
                <h2
                  className="hl-serif hl-tight"
                  style={{
                    fontSize:   26,
                    fontWeight: 300,
                    fontStyle: 'italic',
                    margin:    '0 0 14px',
                    color:     'var(--bone)',
                  }}
                >
                  Pledge received.
                </h2>
                <p
                  className="hl-prose"
                  style={{
                    fontSize:  15,
                    color:     'var(--bone-dim)',
                    maxWidth:  '38ch',
                    margin:   '0 auto 28px',
                  }}
                >
                  {done.message}
                </p>
                <Link
                  to="/"
                  className="hl-mono"
                  style={{
                    fontSize:       10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color:         'var(--warm)',
                    textDecoration: 'none',
                  }}
                >
                  back to heirloom →
                </Link>
              </div>
            ) : (
              <>
                <form
                  onSubmit={submit}
                  aria-label="Founder pledge form"
                  style={{ display: 'grid', gap: 20 }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 16 }}>
                    <div>
                      <label htmlFor="f-name" style={labelBase}>
                        Your name <span style={{ color: 'var(--warm)' }} aria-hidden>*</span>
                      </label>
                      <input
                        id="f-name"
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
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="A few sentences. Your grandmother. The recipe nobody wrote down."
                      style={{ ...inputBase, resize: 'vertical' }}
                    />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      style={{
                        fontFamily:  'var(--serif)',
                        fontStyle:   'italic',
                        fontSize:     14,
                        color:       'var(--warm)',
                        margin:       0,
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="hl-btn"
                    disabled={submitting || !name.trim() || !email.trim()}
                    style={{
                      opacity:    submitting || !name.trim() || !email.trim() ? 0.5 : 1,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {submitting ? 'submitting…' : 'Become a founder · $240 once'}
                  </button>
                </form>

                <p
                  className="hl-mono"
                  style={{
                    marginTop:     12,
                    fontSize:       11,
                    color:         'var(--bone-faint)',
                    letterSpacing: '0.08em',
                  }}
                >
                  or gift one →
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: continuity record ────────────────────────────────────── */}
        <div
          style={{
            background:   'var(--ink)',
            padding:      '72px 56px',
            display:      'flex',
            flexDirection: 'column',
            overflowY:    'auto',
            borderLeft:   '1px solid var(--rule)',
          }}
        >
          {/* eyebrow */}
          <p
            className="hl-eyebrow"
            style={{ marginBottom: 22 }}
          >
            the continuity record · live
          </p>

          {/* count summary */}
          <div
            style={{
              display:        'flex',
              alignItems:     'baseline',
              gap:             16,
              marginBottom:    32,
            }}
          >
            <span
              className="hl-serif"
              style={{ fontSize: 40, fontWeight: 300, color: 'var(--bone)', lineHeight: 1 }}
            >
              {pledged !== null ? pledged : '—'}
            </span>
            <span
              className="hl-mono"
              style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.14em' }}
            >
              / {cap} founders
            </span>
            {remaining !== null && (
              <span
                className="hl-mono"
                style={{
                  fontSize:       10,
                  color:         'var(--warm)',
                  letterSpacing: '0.14em',
                  marginLeft:    'auto',
                }}
              >
                {remaining} remaining
              </span>
            )}
          </div>

          {/* rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {MOCK_ROWS.map((row) => {
              const isReserved = row.name.startsWith('—');
              return (
                <div
                  key={row.pledge}
                  style={{
                    display:        'flex',
                    alignItems:     'baseline',
                    gap:             16,
                    borderBottom:   '1px solid var(--rule)',
                    paddingTop:      8,
                    paddingBottom:   8,
                  }}
                >
                  {/* pledge number */}
                  <span
                    className="hl-mono"
                    style={{
                      width:         56,
                      flexShrink:     0,
                      fontSize:       11,
                      color:         'var(--bone-faint)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {row.pledge}
                  </span>

                  {/* name */}
                  <span
                    className="hl-serif"
                    style={{
                      flex:       1,
                      fontSize:   16,
                      color:      'var(--bone)',
                      fontStyle:  isReserved ? 'italic' : 'normal',
                      opacity:    isReserved ? 0.38 : 1,
                    }}
                  >
                    {row.name}
                  </span>

                  {/* location */}
                  {row.location && (
                    <span
                      className="hl-mono"
                      style={{
                        fontSize:       9.5,
                        textTransform: 'uppercase',
                        color:         'var(--bone-faint)',
                        letterSpacing: '0.08em',
                        flexShrink:     0,
                      }}
                    >
                      {row.location}
                    </span>
                  )}
                </div>
              );
            })}

            {/* tail — remaining slots */}
            <div
              style={{
                paddingTop:  16,
                paddingBottom: 8,
              }}
            >
              <p
                className="hl-mono"
                style={{
                  fontSize:       10,
                  color:         'var(--bone-faint)',
                  letterSpacing: '0.14em',
                  margin:         0,
                }}
              >
                {remaining !== null
                  ? `${remaining} names yet to be written.`
                  : 'loading record…'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
