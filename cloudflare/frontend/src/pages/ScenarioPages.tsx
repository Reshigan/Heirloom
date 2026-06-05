import { Link } from 'react-router-dom';

interface ScenarioProps {
  eyebrow: string;
  headline: string;
  subhead: string;
  sealedLabel: string;
  sealedTo: string;
  sealedTrigger: string;
  ctaLabel?: string;
}

function ScenarioPage({ eyebrow, headline, subhead, sealedLabel, sealedTo, sealedTrigger, ctaLabel = 'Write this letter now →' }: ScenarioProps) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--ink)',
      color: 'var(--bone)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Minimal header */}
      <div style={{
        padding: 'max(env(safe-area-inset-top, 0px), 20px) clamp(20px, 5vw, 48px) 20px',
        borderBottom: '1px solid var(--rule)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Link to="/" style={{
          fontFamily: 'var(--mono)',
          fontSize: 13,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--warm)',
          textDecoration: 'none',
        }}>
          heirloom
        </Link>
        <Link to="/login" style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          textDecoration: 'none',
          borderBottom: '1px solid var(--rule)',
          paddingBottom: 1,
        }}>
          sign in
        </Link>
      </div>

      {/* Hero */}
      <div style={{
        flex: 1,
        padding: 'clamp(52px, 10vw, 96px) clamp(20px, 6vw, 64px)',
        maxWidth: 680,
      }}>
        <div className="hl-eyebrow" style={{ marginBottom: 20, color: 'var(--warm)' }}>
          {eyebrow}
        </div>

        <h1 className="hl-serif hl-tight" style={{
          fontSize: 'clamp(26px, 4.5vw, 52px)',
          fontWeight: 300,
          lineHeight: 1.1,
          margin: '0 0 22px',
          color: 'var(--bone)',
          fontVariationSettings: '"opsz" 44',
          letterSpacing: '-0.016em',
        }}>
          {headline}
        </h1>

        <p className="hl-serif" style={{
          fontSize: 'clamp(15px, 1.8vw, 19px)',
          fontWeight: 300,
          color: 'var(--bone-dim)',
          lineHeight: 1.68,
          margin: '0 0 40px',
          maxWidth: '46ch',
        }}>
          {subhead}
        </p>

        {/* Sealed letter preview */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '14px 18px 14px 20px',
          border: '1px solid rgba(244,236,216,0.10)',
          borderLeft: '2px solid rgba(176,122,74,0.55)',
          marginBottom: 36,
          maxWidth: 420,
        }}>
          <div className="hl-mono" style={{
            fontSize: 8.5,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}>
            {sealedLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="hl-serif" style={{ fontSize: 22, fontWeight: 300, color: 'var(--warm)', lineHeight: 1 }}>∞</span>
            <span className="hl-serif" style={{ fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--bone-dim)' }}>
              a letter {sealedTo}
            </span>
          </div>
          <div className="hl-mono" style={{
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(176,122,74,0.65)',
          }}>
            {sealedTrigger}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
          <Link to="/signup" className="hl-btn">{ctaLabel}</Link>
          <Link to="/login" style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            textDecoration: 'none',
            borderBottom: '1px solid var(--rule)',
            paddingBottom: 1,
          }}>
            already have an account →
          </Link>
        </div>

        {/* How it works */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 36 }}>
          <div className="hl-eyebrow" style={{ marginBottom: 20 }}>how it works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['write it today', 'Write the letter now, while you know what you want to say. Seal it.'],
              ['set the trigger', 'Choose when it opens: a date, a milestone, your death, or a named event.'],
              ['it finds them', 'When the moment arrives — years or decades from now — the letter is delivered. No account required on their end.'],
            ].map(([step, desc], i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 20,
                padding: '14px 0',
                borderBottom: i < 2 ? '1px solid var(--rule)' : 'none',
              }}>
                <div className="hl-mono" style={{
                  fontSize: 9,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  flexShrink: 0,
                  paddingTop: 2,
                  minWidth: 90,
                }}>
                  {step}
                </div>
                <p className="hl-serif" style={{
                  fontSize: 14,
                  fontWeight: 300,
                  color: 'var(--bone-dim)',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScenarioWeddingDay() {
  return (
    <ScenarioPage
      eyebrow="sealed letter"
      headline="Write her the letter she will read on her wedding day."
      subhead="You know things she doesn't yet. About love, about time, about what matters. Write it now. It will find her the moment she needs it."
      sealedLabel="sealed · for your daughter · opens: her wedding day"
      sealedTo="from you — written years before"
      sealedTrigger="awaiting · trigger: her wedding day"
      ctaLabel="Write the letter →"
    />
  );
}

export function ScenarioEighteenthBirthday() {
  return (
    <ScenarioPage
      eyebrow="sealed letter"
      headline="Write the letter your child will read on their eighteenth birthday."
      subhead="They are small now. The person they become will be someone you could never predict. Write to that person anyway."
      sealedLabel="sealed · opens: their 18th birthday"
      sealedTo="from their parent — written today"
      sealedTrigger="awaiting · trigger: 18th birthday"
      ctaLabel="Write this letter →"
    />
  );
}

export function ScenarioAfterIGo() {
  return (
    <ScenarioPage
      eyebrow="sealed letter"
      headline="Write the letter they will read after you are gone."
      subhead="There are things you've never said — because there hasn't been a reason, or the moment never came. Write them now. Seal them. They will be there when they need them."
      sealedLabel="sealed · delivery: after my death"
      sealedTo="for the people I loved"
      sealedTrigger="awaiting · trigger: upon passing"
      ctaLabel="Write it now →"
    />
  );
}

export function ScenarioFutureGrandchildren() {
  return (
    <ScenarioPage
      eyebrow="sealed letter"
      headline="Write to the grandchildren who haven't been born yet."
      subhead="You may never meet them. They will spend their whole lives not knowing who you were. Write to them anyway. Leave something in their future."
      sealedLabel="sealed · for my grandchildren · whenever they are born"
      sealedTo="from their grandparent — written today"
      sealedTrigger="awaiting · trigger: family choice"
      ctaLabel="Write the letter →"
    />
  );
}

export function ScenarioVoiceForTheUnborn() {
  return (
    <ScenarioPage
      eyebrow="voice memo"
      headline="Record your voice for the child who hasn't arrived yet."
      subhead="They will never hear you say their name for the first time. But they can hear you now — your accent, your laugh, the way you pause before you say something true. Record it before it changes. Before you do."
      sealedLabel="sealed · a voice note · for when they are old enough"
      sealedTo="from the one who waited for you — recorded today"
      sealedTrigger="awaiting · trigger: their birth · or your choice"
      ctaLabel="Record your voice →"
    />
  );
}
