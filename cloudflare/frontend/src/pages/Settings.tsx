import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  // delete account
  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm' | 'password'>('idle');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMutation = useMutation({
    mutationFn: () => settingsApi.deleteAccount(deletePassword),
    onSuccess: async () => {
      await logout();
      navigate('/', { replace: true });
    },
    onError: (err: any) => {
      setDeleteError(err?.response?.data?.error ?? 'Incorrect password.');
    },
  });

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

            <div className="hl-eyebrow" style={{ margin: '36px 0 18px', color: 'var(--dye-madder)' }}>danger</div>
            <div style={{ padding: '18px 0', borderTop: '1px solid var(--rule)' }}>
              <button
                type="button"
                onClick={() => setDeleteStage('confirm')}
                style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--dye-madder)' }}
              >
                delete account →
              </button>
              <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--bone-dim)', marginTop: 4, fontWeight: 400 }}>
                permanent · all data erased
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete account — password-gated, three-stage */}
      {deleteStage !== 'idle' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(14,14,12,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{ background: 'var(--ink)', border: '1px solid var(--rule)', padding: '40px 48px', maxWidth: 440, width: '100%' }}>
            {deleteStage === 'confirm' ? (
              <>
                <div className="hl-eyebrow" style={{ color: 'var(--dye-madder)', marginBottom: 16 }}>delete account</div>
                <p className="hl-serif" style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--bone-dim)', margin: '0 0 28px' }}>
                  This permanently deletes your thread, all entries, letters, and voice recordings. It cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <button type="button" onClick={() => setDeleteStage('password')}
                    style={{ background: 'transparent', border: '1px solid var(--dye-madder)', color: 'var(--dye-madder)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 20px', cursor: 'pointer' }}>
                    I understand — continue
                  </button>
                  <button type="button" onClick={() => setDeleteStage('idle')}
                    style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="hl-eyebrow" style={{ color: 'var(--dye-madder)', marginBottom: 16 }}>confirm password</div>
                <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 20px', lineHeight: 1.6 }}>
                  Enter your password to permanently delete your account.
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && deletePassword && deleteMutation.mutate()}
                  placeholder="your password"
                  autoFocus
                  style={{ width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8 }}
                />
                {deleteError && (
                  <p className="hl-mono" style={{ fontSize: 10, color: 'var(--dye-madder)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                  <button type="button" onClick={() => deleteMutation.mutate()} disabled={!deletePassword || deleteMutation.isPending}
                    style={{ background: 'var(--dye-madder)', border: 0, color: 'var(--bone)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 20px', cursor: 'pointer', opacity: (!deletePassword || deleteMutation.isPending) ? 0.5 : 1 }}>
                    {deleteMutation.isPending ? 'deleting…' : 'delete forever'}
                  </button>
                  <button type="button" onClick={() => { setDeleteStage('idle'); setDeletePassword(''); setDeleteError(null); }}
                    style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <TapestryEdge nowFrac={0.95} />
    </div>
  );
}
