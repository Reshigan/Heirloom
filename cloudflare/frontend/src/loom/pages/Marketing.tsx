import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TapestryCanvas } from '../components/TapestryCanvas';
import { HLogo } from '../components/HLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { SecurityDot } from '../components/Frame';
import { useListener } from '../../hooks/useListener';
import { getDeferredPrompt, isIOS, isStandalone, onInstallStateChange, promptInstall, wasInstalled } from '../../lib/pwa';

function MktTopbar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'calc(clamp(16px, 2.5vh, 24px) + env(safe-area-inset-top, 0px)) clamp(16px, 5vw, 56px) clamp(16px, 2.5vh, 24px)',
      borderBottom: '1px solid var(--parchment-rule)',
      fontFamily: 'var(--mono)',
      fontSize: 10.5, letterSpacing: '0.32em', textTransform: 'uppercase',
    }}>
      <HLogo size={20} wordmark wordColor="var(--parchment-ink)" />
      <span style={{ display: 'flex', gap: 'clamp(14px, 3vw, 28px)', alignItems: 'center', color: 'var(--parchment-dim)' }}>
        <Link to="/loom/weft" className="mkt-nav-hide-sm" style={{ color: 'inherit', textDecoration: 'none' }}>see the cloth</Link>
        <Link to="/founder" className="mkt-nav-hide-sm" style={{ color: 'inherit', textDecoration: 'none' }}>founder</Link>
        <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>pricing</Link>
        <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>sign in</Link>
        <span className="mkt-nav-hide-sm"><ThemeToggle /></span>
        <SecurityDot size={7} />
      </span>
    </div>
  );
}

function useInstallState() {
  const [tick, setTick] = useState(0);
  useEffect(() => onInstallStateChange(() => setTick((t) => t + 1)), []);
  if (typeof window === 'undefined') return { mode: 'none' as const };
  if (isStandalone() || wasInstalled()) return { mode: 'none' as const };
  if (getDeferredPrompt()) return { mode: 'prompt' as const, tick };
  if (isIOS()) return { mode: 'ios' as const, tick };
  return { mode: 'none' as const, tick };
}

export function Marketing() {
  const prompt = useListener();
  const install = useInstallState();

  // Demo entries for the specimen cloth
  const demoEntries = Array.from({ length: 120 }, (_, i) => ({
    date: new Date(1948 + Math.floor(i * 0.65), (i * 3) % 12, 1),
    n: i,
    dye: ['madder','indigo','saffron','weld','woad','cochineal'][i % 6],
    tier: 'family' as const,
  }));

  return (
    <div className="hl-screen parchment" style={{ overflowY: 'auto', minHeight: '100vh' }}>
      <MktTopbar />

      {/* hero */}
      <div style={{ padding: 'clamp(36px, 5vh, 64px) clamp(16px, 5vw, 56px) 0' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 24 }}>Heirloom · The Family Thread</div>
        <h1
          className="hl-serif hl-tight"
          style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            lineHeight: 1.04, fontWeight: 300, margin: 0,
            color: 'var(--parchment-ink)',
            fontVariationSettings: '"opsz" 60',
            maxWidth: '18ch',
          }}
        >
          {prompt}
        </h1>
        <p className="hl-serif" style={{ fontSize: 19, lineHeight: 1.55, maxWidth: '52ch', color: 'var(--parchment-dim)', fontWeight: 400, marginTop: 32 }}>
          Write today. Lock entries for descendants who don't exist yet. Read what came before. The thread continues after you.
        </p>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 40, flexWrap: 'wrap' }}>
          <Link to="/signup" className="hl-btn">Begin your thread — free</Link>
          {install.mode === 'prompt' ? (
            <button
              type="button"
              onClick={async () => { await promptInstall(); }}
              className="hl-btn ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              ↓ Install app
            </button>
          ) : install.mode === 'ios' ? (
            <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--parchment-faint)', borderBottom: '1px dashed var(--parchment-rule)', paddingBottom: 1 }}>
              Share → Add to Home Screen
            </span>
          ) : null}
          <Link
            to="/loom/weft"
            style={{ color: 'var(--parchment-ink)', borderBottom: '1px solid currentColor', paddingBottom: 1, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}
          >
            See the cloth →
          </Link>
        </div>
      </div>

      {/* specimen cloth */}
      <div style={{ marginTop: 72, background: 'var(--ink)', position: 'relative' }}>
        <TapestryCanvas
          width={typeof window !== 'undefined' ? window.innerWidth : 1280}
          height={360}
          entries={demoEntries}
          kind="specimen"
          animate
          opts={{
            tStart: new Date(1948, 0, 1),
            tEnd: new Date(2026, 0, 1),
            nowFrac: 0.93,
            showFraySelvedge: true,
            showWarpHair: true,
            background: '#0e0e0c',
            warpEvery: 9,
          }}
        />
        <div style={{ position: 'absolute', left: 'clamp(16px, 5vw, 56px)', top: 24, fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(244,236,216,0.4)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          specimen · the Okonkwo family thread · 1948 – today · entry 4,318
        </div>
      </div>

      {/* five pillars */}
      <div style={{ padding: 'clamp(56px, 7vh, 96px) clamp(16px, 5vw, 56px) clamp(36px, 4vh, 56px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'clamp(32px, 5vh, 56px) clamp(36px, 6vw, 96px)' }}>
        {[
          ['Perpetual', 'A 1,000-year horizon, not a season.'],
          ['Append-only', 'Edits append. Nothing is silently rewritten.'],
          ['Time-locked', 'Release entries on a date, an age, a death.'],
          ['Outlives us', 'IPFS pinning, successor non-profit, family export.'],
          ['Private by default', 'Zero-knowledge. We cannot read your entries.'],
        ].map(([title, body]) => (
          <div key={title}>
            <div className="hl-eyebrow dark" style={{ marginBottom: 10 }}>{title}</div>
            <p className="hl-prose dark" style={{ marginTop: 0 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* privacy & compliance */}
      <div style={{ padding: 'clamp(36px, 4vh, 56px) clamp(16px, 5vw, 56px)', borderTop: '1px solid var(--parchment-rule)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="hl-eyebrow dark">Protected by design · globally compliant</div>
          <SecurityDot size={8} />
        </div>
        <p className="hl-prose dark" style={{ maxWidth: '60ch', marginTop: 0, marginBottom: 40 }}>
          Your family's story is the most sensitive information there is. We treat it that way — by architecture, by law, and by principle.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'clamp(20px, 3vh, 32px) clamp(24px, 4vw, 56px)' }}>
          {([
            ['AES-256 encrypted', 'Each entry is encrypted at rest with AES-256-GCM before it touches disk. Keys are derived per-family. We cannot read your memories.'],
            ['GDPR compliant', 'Full compliance with the EU General Data Protection Regulation — right to access, right to erasure, right to portability, lawful basis documented.'],
            ['POPIA compliant', 'South Africa\'s Protection of Personal Information Act — responsible party obligations, data subject rights, and retention limits honored.'],
            ['CCPA / CPRA compliant', 'California Consumer Privacy Act — we do not sell personal data. Opt-out rights honored. No third-party data brokers.'],
            ['PIPEDA compliant', 'Canada\'s federal private-sector privacy law. Consent-based processing, purpose limitation, and safeguard obligations met.'],
            ['HTTPS everywhere', 'All traffic encrypted in transit via TLS 1.3. Cloudflare edge enforces HSTS. No plaintext transmission, ever.'],
            ['Right to erasure', 'Delete your account and all personal data is permanently purged within 30 days. Export your full archive at any time.'],
            ['No third-party tracking', 'We do not embed ad pixels, social trackers, or analytics that share your data with third parties. Your family stays yours.'],
          ] as [string, string][]).map(([title, body]) => (
            <div key={title}>
              <div className="hl-eyebrow dark" style={{ marginBottom: 8 }}>{title}</div>
              <p className="hl-prose dark" style={{ marginTop: 0, fontSize: 13, lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--parchment-rule)', display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/privacy" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-dim)', textDecoration: 'none', borderBottom: '1px solid var(--parchment-rule)', paddingBottom: 2 }}>Privacy policy →</Link>
          <Link to="/terms" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-dim)', textDecoration: 'none', borderBottom: '1px solid var(--parchment-rule)', paddingBottom: 2 }}>Terms of service →</Link>
          <Link to="/security" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-dim)', textDecoration: 'none', borderBottom: '1px solid var(--parchment-rule)', paddingBottom: 2 }}>Security →</Link>
        </div>
      </div>

      {/* pricing callout */}
      <div style={{ padding: '0 clamp(16px, 5vw, 56px) clamp(56px, 7vh, 96px)', borderTop: '1px solid var(--parchment-rule)', paddingTop: 'clamp(36px, 4vh, 56px)' }}>
        <div className="hl-eyebrow dark" style={{ marginBottom: 24 }}>Start free. No credit card.</div>
        <Link to="/pricing" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--parchment-ink)', textDecoration: 'none', borderBottom: '1px solid var(--parchment-rule)', paddingBottom: 2 }}>
          See all plans →
        </Link>
      </div>
    </div>
  );
}
