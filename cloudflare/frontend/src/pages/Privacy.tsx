import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';

function MktBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 56px', borderBottom: '1px solid var(--parchment-rule)' }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <HLogo size={20} wordmark mono color="var(--parchment-ink)" wordColor="#1a1916" />
      </Link>
      <span style={{ display: 'flex', gap: 32, fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--parchment-dim)' }}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>see the cloth</Link>
        <Link to="/founder" style={{ color: 'inherit', textDecoration: 'none' }}>founder</Link>
        <Link to="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>pricing</Link>
        <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>sign in</Link>
      </span>
    </div>
  );
}

const SECTIONS = [
  {
    n: 'one',
    h: 'We cannot read your entries.',
    b: 'The architecture forbids it. Entry content is end-to-end encrypted with keys held by your thread — not by us. Our administrators see metadata and account state, never prose. If we are subpoenaed, we hand over what we have, which is account-level metadata. Not your stories.',
  },
  {
    n: 'two',
    h: 'The thread outlives the company.',
    b: 'A successor non-profit is named in our bylaws and funded by Founder-tier payments. If Heirloom ends, the IPFS archive continues, and the family export tooling is open-sourced on day one of any wind-down.',
  },
  {
    n: 'three',
    h: 'You can always download everything.',
    b: 'Full export in plain text + original photographs + voice WAV files. No proprietary format. Updated nightly. Free at all tiers. You own this.',
  },
  {
    n: 'four',
    h: 'We never sell, share, or advertise.',
    b: 'No third-party trackers, no ad pixels, no analytics that identify individuals. Aggregate metrics only, in service of operating the platform. Pinky promise, codified in the bylaws.',
  },
  {
    n: 'five',
    h: 'Time-locked entries stay locked.',
    b: 'Even from us. The cryptographic keys to a sealed note are released only when the release-condition is met — a date, a member\'s verified age, an author\'s verified death. We cannot peek.',
  },
  {
    n: 'six',
    h: 'You can ask us to forget you.',
    b: 'A request to delete the account erases personal identifiers within 30 days. Content remains in the thread under whatever recipient grants you set. The 30-day grace exists because grief sometimes asks for things grief later regrets.',
  },
];

export function Privacy() {
  return (
    <div className="hl-screen parchment" style={{ overflow: 'auto' }}>
      <MktBar />
      <div style={{ padding: '64px 88px 80px', maxWidth: 920, margin: '0 auto' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 18 }}>privacy · plain words version</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 52, lineHeight: 1.06, fontWeight: 300, margin: 0, letterSpacing: '-0.022em', color: 'var(--parchment-ink)' }}>
          Six things you should know.
        </h1>

        {SECTIONS.map((s) => (
          <div key={s.n} style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'min(100px, 22%) 1fr', gap: 'clamp(16px, 3vw, 32px)', borderTop: '1px solid var(--parchment-rule)', paddingTop: 28 }}>
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.32em', textTransform: 'uppercase' }}>{s.n}</div>
            <div>
              <h2 className="hl-serif hl-tight" style={{ fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: '-0.012em', color: 'var(--parchment-ink)' }}>{s.h}</h2>
              <p className="hl-prose dark" style={{ fontSize: 17, lineHeight: 1.8, marginTop: 14, color: 'var(--parchment-ink)' }}>{s.b}</p>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 64, paddingTop: 36, borderTop: '1px solid var(--parchment-rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--parchment-dim)', fontWeight: 400 }}>
            The legal-formal version is below. We promise it says the same thing in more words.
          </div>
          <div className="hl-mono" style={{ fontSize: 10, color: 'var(--parchment-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', flexShrink: 0, marginLeft: 32 }}>
            last updated · 14 nov 2025 · v 3.2
          </div>
        </div>

        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid var(--parchment-rule)', display: 'flex', gap: 28, alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <HLogo size={14} wordmark mono color="var(--parchment-faint)" wordColor="var(--parchment-faint)" />
          </Link>
          <Link to="/terms" className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-faint)', textDecoration: 'none' }}>
            Terms
          </Link>
          <a href="mailto:support@heirloom.blue" className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-faint)', textDecoration: 'none' }}>
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}
