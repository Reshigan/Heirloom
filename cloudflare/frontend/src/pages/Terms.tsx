import { Link } from 'react-router-dom';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';
import { usePageMeta } from '../lib/usePageMeta';

const SECTIONS = [
  {
    n: 'i',
    h: 'You write. We hold it.',
    b: 'Your entries are yours. You grant Heirloom only the technical permission needed to store, encrypt, replicate, and present them back to the people you\'ve authorized. We claim no rights beyond that.',
  },
  {
    n: 'ii',
    h: 'Append-only, with grace.',
    b: 'Entries cannot be silently edited. Amendments are visible. There is a 30-day delete grace window for the original author only. After 30 days, the entry is immutable until the thread\'s end-of-time.',
  },
  {
    n: 'iii',
    h: 'Members and successors.',
    b: 'You may invite members and designate successors. Roles are granular: author, reader, future-member, legacy contact, successor. The succession order is binding and visible in the audit log.',
  },
  {
    n: 'iv',
    h: 'The dead-man\'s switch.',
    b: 'You may arm a check-in interval. Missed check-ins issue a warning, then a 48-hour cancel window, then a trigger. On trigger, your designated successor inherits administrative authority over the thread. Time-locked entries with "on death" conditions release.',
  },
  {
    n: 'v',
    h: 'Payment and continuity.',
    b: 'Subscription fees keep the platform running. Founder-tier payments fund the successor non-profit named in the bylaws. We do not promise immortality. We promise reasonable, codified provisions for what happens if we cease.',
  },
  {
    n: 'vi',
    h: 'Conduct.',
    b: 'Threads are private by default. We do not moderate private prose. We do moderate public-historian opt-in entries for the usual reasons (illegality, abuse). We reserve the right to suspend accounts that publish abusive material to the open archive.',
  },
  {
    n: 'vii',
    h: 'Disputes and venue.',
    b: 'Governed by the laws of the State of Delaware, USA. Disputes are arbitrated. Class actions are not waived; we do not believe in those waivers.',
  },
];

export function Terms() {
  usePageMeta('Terms', 'Terms of use for Heirloom.');
  return (
    <ClothShell
      topbarLeft={<HLogo />}
      topbarCenter="terms"
      topbarRight={<Link to="/privacy">privacy →</Link>}
    >
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 'clamp(24px,5vw,48px)' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 18 }}>terms · plain words version</div>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 52, lineHeight: 1.06, fontWeight: 300, margin: 0, letterSpacing: '-0.022em', color: 'var(--bone)' }}>
          What we owe each other.
        </h1>

        {SECTIONS.map((s) => (
          <div key={s.n} style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'min(80px, 20%) 1fr', gap: 'clamp(16px, 3vw, 32px)', borderTop: '1px solid var(--rule)', paddingTop: 24 }}>
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.32em', textTransform: 'uppercase' }}>{s.n}</div>
            <div>
              <h2 className="hl-serif hl-tight" style={{ fontSize: 24, fontWeight: 400, margin: 0, letterSpacing: '-0.012em', color: 'var(--bone)' }}>{s.h}</h2>
              <p className="hl-prose" style={{ fontSize: 16, lineHeight: 1.75, marginTop: 10, color: 'var(--bone)' }}>{s.b}</p>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '1px solid var(--rule)', display: 'flex', gap: 28, alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <HLogo size={14} wordmark mono />
          </Link>
          <Link to="/privacy" className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none' }}>
            Privacy
          </Link>
          <a href="mailto:support@heirloom.blue" className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none' }}>
            Contact
          </a>
        </div>
      </div>
    </ClothShell>
  );
}
