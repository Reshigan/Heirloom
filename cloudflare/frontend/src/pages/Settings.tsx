import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { settingsApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, padding: '18px 0', borderTop: '1px solid var(--rule)', alignItems: 'baseline' }}>
      <div className="hl-mono" style={{ fontSize: 10.5, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>{label}</div>
      <div>
        <div className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 400 }}>{children}</div>
        {hint && <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--bone-dim)', marginTop: 4, fontWeight: 400 }}>{hint}</div>}
      </div>
    </div>
  );
}

export function Settings() {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  const save = useMutation({
    mutationFn: () => settingsApi.updateProfile({ firstName, lastName }).then((r) => r.data),
    onSuccess: () => {
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    },
  });

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications', 'prefs'],
    queryFn: () => settingsApi.getNotifications().then((r) => r.data).catch(() => null),
  });

  const updateNotif = useMutation({
    mutationFn: (patch: Record<string, boolean>) => settingsApi.updateNotifications(patch),
    onSuccess: () => refetchNotifs(),
  });

  const prefs = (notifData ?? {}) as Record<string, boolean>;
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user?.email || '';

  return (
    <div className="hl-screen" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div className="hl-topbar">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
          <Link to="/loom" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <HLogo size={18} wordmark />
          </Link>
          <span style={{ color: 'var(--bone-low)' }}>·</span>
          <span>settings{displayName ? ` · ${displayName}` : ''}</span>
        </span>
        <span className="hl-counter" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          account settings
        </span>
        <Link to="/loom" className="hl-link warm">back to the cloth →</Link>
      </div>

      <div style={{ position: 'absolute', top: 80, bottom: 36, left: 56, right: 56, overflowY: 'auto' }}>
        <h1 className="hl-serif hl-tight" style={{ fontSize: 36, fontWeight: 300, margin: 0, letterSpacing: '-0.018em' }}>Settings</h1>

        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56 }}>

          {/* left: the thread + encryption */}
          <div>
            <div className="hl-eyebrow" style={{ marginBottom: 18, color: 'var(--warm)' }}>the thread</div>

            <Row label="thread name">
              The {[firstName, lastName].filter(Boolean).join(' ') || 'Family'} Thread
            </Row>
            <Row label="email" hint="cannot be changed · primary identifier">
              {user?.email ?? '—'}
            </Row>
            <Row label="successors" hint="ordered · cascade on triggered switch">
              <Link to="/threads" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
                manage successors per thread →
              </Link>
            </Row>
            <Row label="dead-man's switch" hint="warns at 7 days · triggers at 14 days past · 48h cancel window">
              armed · check-in every 90 days
            </Row>
            <Row label="export" hint="updated nightly · downloadable any time">
              <a style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer' }}>
                download full archive →
              </a>
            </Row>

            <div className="hl-eyebrow" style={{ margin: '36px 0 18px', color: 'var(--warm)' }}>encryption</div>
            <Row label="key escrow" hint="shamir-split · zero-knowledge to platform">
              enabled · 3 trusted, 2 required
            </Row>
            <Row label="recovery passphrase" hint="print and store offline">
              four words · configure in onboarding
            </Row>
          </div>

          {/* right: you + listener */}
          <div>
            <div className="hl-eyebrow" style={{ marginBottom: 18, color: 'var(--warm)' }}>you</div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, padding: '18px 0', borderTop: '1px solid var(--rule)', alignItems: 'baseline' }}>
              <div className="hl-mono" style={{ fontSize: 10.5, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>first name</div>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, padding: '18px 0', borderTop: '1px solid var(--rule)', alignItems: 'baseline' }}>
              <div className="hl-mono" style={{ fontSize: 10.5, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>last name</div>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
              />
            </div>
            <div style={{ padding: '14px 0', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 18 }}>
              <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="hl-btn" style={{ fontSize: 11, padding: '10px 20px' }}>
                {save.isPending ? 'saving…' : 'save name'}
              </button>
              {savedFlash ? (
                <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)' }}>∞ saved</span>
              ) : null}
            </div>

            <div className="hl-eyebrow" style={{ margin: '36px 0 18px', color: 'var(--warm)' }}>the listener</div>

            {([
              { key: 'weeklyDigest',       label: 'weekly digest',      hint: 'family entries since last week' },
              { key: 'reminderEmails',     label: 'quarterly check-in', hint: 'gentle prompt to add a thread' },
              { key: 'pushNotifications',  label: 'locks opening',      hint: 'when sealed entries unlock' },
              { key: 'emailNotifications', label: 'receipts + letters', hint: 'transactional only' },
              { key: 'marketingEmails',    label: 'product updates',    hint: 'occasional · unsubscribe any time' },
            ] as const).map((item) => (
              <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '240px 1fr auto', gap: 24, padding: '14px 0', borderTop: '1px solid var(--rule)', alignItems: 'center' }}>
                <div className="hl-mono" style={{ fontSize: 10.5, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>{item.label}</div>
                <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--bone-dim)', fontWeight: 400 }}>{item.hint}</div>
                <input
                  type="checkbox"
                  checked={!!prefs[item.key]}
                  onChange={(e) => updateNotif.mutate({ [item.key]: e.target.checked })}
                  style={{ accentColor: 'var(--warm)', width: 14, height: 14, cursor: 'pointer' }}
                />
              </div>
            ))}

            <div className="hl-eyebrow" style={{ margin: '36px 0 18px', color: 'var(--warm)' }}>support</div>
            <Row label="write to us" hint="we respond within two business days">
              <a href="mailto:support@heirloom.blue" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
                support@heirloom.blue →
              </a>
            </Row>
          </div>
        </div>
      </div>

      <TapestryEdge nowFrac={0.95} />
    </div>
  );
}
