import { Link } from 'react-router-dom';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

interface ScenarioProps {
  eyebrow: string;
  headline: string;
  subhead: string;
  sealedLabel: string;
  sealedTo: string;
  sealedTrigger: string;
  ctaLabel?: string;
}

const HOW_IT_WORKS: [string, string][] = [
  ['write it today', 'Write the letter now, while you know what you want to say. Seal it.'],
  ['set the trigger', 'Choose when it opens: a date, a milestone, your death, or a named event.'],
  ['it finds them', 'When the moment arrives — years or decades from now — the letter is delivered. No account required on their end.'],
];

function ScenarioPage({
  eyebrow,
  headline,
  subhead,
  sealedLabel,
  sealedTo,
  sealedTrigger,
  ctaLabel = 'Write this letter now →',
}: ScenarioProps) {
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
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--copper-label)',
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

      {/* Ledger body */}
      <div style={{
        flex: 1,
        padding: 'clamp(52px, 10vw, 96px) clamp(20px, 6vw, 64px)',
        maxWidth: 680,
      }}>
        {/* CosmicHeader — mono eyebrow + giant serif headline */}
        <CosmicHeader
          eyebrow={eyebrow}
          title={headline}
          sub={subhead}
        />

        {/* Sealed entry row */}
        <SectionLabel>the sealed letter</SectionLabel>

        {/* Sealed letter preview as a ledger entry row (static, no onClick) */}
        <div className="scenario-sealed-row" style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 20,
          width: '100%',
          padding: '15px 0',
          borderBottom: '1px solid var(--rule)',
        }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 19,
              lineHeight: 1.3,
              color: 'var(--bone)',
              display: 'block',
            }}>
              a letter {sealedTo}
            </span>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              display: 'block',
              marginTop: 5,
            }}>
              {sealedTrigger}
            </span>
          </span>
          <span className="scenario-sealed-label" style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            flex: '0 0 auto',
          }}>
            {sealedLabel}
          </span>
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', margin: '36px 0 64px' }}>
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

        {/* How it works — SectionLabel + ledger rows */}
        <SectionLabel>how it works</SectionLabel>

        {HOW_IT_WORKS.map(([step, desc], i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 20,
            padding: '15px 0',
            borderBottom: i < HOW_IT_WORKS.length - 1 ? '1px solid var(--rule)' : 'none',
          }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              flexShrink: 0,
              paddingTop: 3,
              minWidth: 90,
            }}>
              {step}
            </span>
            <p style={{
              fontFamily: 'var(--serif)',
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

        {/* WaxSeal foot */}
        <div style={{ paddingTop: 64 }}>
          <WaxSeal />
        </div>
      </div>

      <style>{`
        .scenario-sealed-label { white-space: nowrap; }
        @media (max-width: 520px) {
          .scenario-sealed-row { flex-direction: column; gap: 8px; }
          .scenario-sealed-label { white-space: normal; }
        }
      `}</style>
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
