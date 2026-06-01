import { Link } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { useTapestryEntries } from '../../hooks/useTapestryEntries';
import { useListener } from '../../hooks/useListener';
import { TapestryCanvas } from '../components/TapestryCanvas';
import type { UserRole } from '../../hooks/useRole';
import type { CanvasEntry } from '../components/TapestryCanvas';

function MiniCloth({ entries }: { entries: CanvasEntry[] }) {
  return (
    <TapestryCanvas
      width={typeof window !== 'undefined' ? window.innerWidth : 390}
      height={80}
      entries={entries}
      kind="specimen"
      animate
      opts={{ tStart: new Date(2019, 0, 1), tEnd: new Date(2027, 0, 1), background: '#0a0a08', warpEvery: 7 }}
    />
  );
}

function RoleContent({ role, entries, prompt }: { role: UserRole; entries: CanvasEntry[]; prompt: string }) {
  switch (role) {
    case 'visitor':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>preview</span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 24, fontWeight: 300, color: 'var(--bone)', margin: '0 0 24px' }}>
            Start your family's thousand-year thread.
          </h2>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 32 }}>
            <Link to="/signup" className="hl-btn">Begin free →</Link>
          </div>
        </div>
      );

    case 'trial':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>trial</span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 22, fontWeight: 300, color: 'var(--bone)', margin: '0 0 16px' }}>
            {prompt}
          </h2>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/loom/compose" className="hl-btn">write now</Link>
            <Link to="/billing" className="hl-btn text" style={{ fontSize: 13 }}>upgrade →</Link>
          </div>
        </div>
      );

    case 'family':
    case 'founder':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>
            {role === 'founder' ? 'founder' : 'today'}
          </span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 22, fontWeight: 300, color: 'var(--bone)', margin: '0 0 16px' }}>
            {prompt}
          </h2>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 24 }}>
            <Link to="/loom/compose" className="hl-btn">write now</Link>
          </div>
        </div>
      );

    case 'author':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>author</span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 22, fontWeight: 300, color: 'var(--bone)', margin: '0 0 16px' }}>
            {prompt}
          </h2>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 24 }}>
            <Link to="/loom/compose" className="hl-btn">write now</Link>
          </div>
        </div>
      );

    case 'reader':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>reading</span>
          <MiniCloth entries={entries} />
          <div style={{ marginTop: 24 }}>
            <Link to="/loom/read" className="hl-btn">open the thread →</Link>
          </div>
        </div>
      );

    case 'successor':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>inheritance</span>
          <h2 className="hl-serif hl-tight" style={{ fontSize: 22, fontWeight: 300, color: 'var(--bone)', margin: '0 0 24px' }}>
            A thread has been passed to you.
          </h2>
          <Link to="/loom/weft" className="hl-btn">Open the cloth →</Link>
        </div>
      );

    case 'future_member':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>awaiting</span>
          <p className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone-dim)', lineHeight: 1.6 }}>
            A thread is being prepared for you.
          </p>
        </div>
      );

    case 'legacy':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>legacy access</span>
          <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone-dim)', lineHeight: 1.6 }}>
            Verify your identity to access the archive.
          </p>
          <Link to="/inherit" className="hl-btn ghost" style={{ marginTop: 24, display: 'inline-block' }}>
            Verify →
          </Link>
        </div>
      );

    case 'admin':
      return (
        <div style={{ padding: '32px 22px' }}>
          <span className="hl-eyebrow" style={{ display: 'block', marginBottom: 16 }}>support</span>
          <Link to="/admin" className="hl-btn">Open admin console →</Link>
        </div>
      );

    default:
      return null;
  }
}

export function PwaHome() {
  const role = useRole();
  const entries = useTapestryEntries();
  const prompt = useListener();

  return (
    <div className="hl-screen" style={{ minHeight: '100vh', position: 'relative' }}>
      <RoleContent role={role} entries={entries} prompt={prompt} />
    </div>
  );
}
