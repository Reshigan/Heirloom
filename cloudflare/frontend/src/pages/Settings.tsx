import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { settingsApi } from '../services/api';
import { Frame } from '../loom/components/Frame';

const RESPONSIVE_CSS = `
.hl-setting-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px 20px;
  padding: 14px 0;
  border-top: 1px solid var(--rule);
  align-items: baseline;
}
@media (max-width: 639px) {
  .hl-setting-row { grid-template-columns: 1fr; gap: 4px; padding: 12px 0; }
}
.hl-notif-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--rule);
  align-items: center;
}
`;

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="hl-setting-row">
      <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase', paddingTop: 2 }}>{label}</div>
      <div>
        <div className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)', fontWeight: 400 }}>{children}</div>
        {hint && <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-dim)', marginTop: 2, fontWeight: 400, lineHeight: 1.5 }}>{hint}</div>}
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

  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm' | 'password'>('idle');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: () => settingsApi.deleteAccount(deletePassword),
    onSuccess: async () => { await logout(); navigate('/', { replace: true }); },
    onError: (err: any) => { setDeleteError(err?.response?.data?.error ?? 'Incorrect password.'); },
  });

  const save = useMutation({
    mutationFn: () => settingsApi.updateProfile({ firstName, lastName }).then((r) => r.data),
    onSuccess: () => { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2000); },
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

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <Frame left="settings" right={<Link to="/loom" className="hl-link warm" style={{ fontSize: 12 }}>back →</Link>}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 40px) 80px' }}>

          <h1 className="hl-serif hl-tight" style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 300, margin: '0 0 28px', letterSpacing: '-0.016em' }}>
            Settings
          </h1>

          {/* ── Your name ─────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ marginBottom: 14, color: 'var(--warm)' }}>you</div>

          <div className="hl-setting-row">
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>first name</div>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
            />
          </div>
          <div className="hl-setting-row">
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>last name</div>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
            />
          </div>
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="hl-btn" style={{ fontSize: 11, padding: '9px 18px' }}>
              {save.isPending ? 'saving…' : 'save name'}
            </button>
            {savedFlash && (
              <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)' }}>∞ saved</span>
            )}
          </div>

          <Row label="email" hint="primary identifier · cannot be changed">{user?.email ?? '—'}</Row>

          {/* ── The thread ────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--warm)' }}>the thread</div>

          <Row label="successors" hint="ordered · cascade on triggered switch">
            <Link to="/threads" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
              manage →
            </Link>
          </Row>
          <Row label="dead-man's switch" hint="warns at 7 days · triggers at 14 days">
            armed · check-in every 90 days
          </Row>
          <Row label="export" hint="updated nightly · downloadable any time">
            <a style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer' }}>
              download archive →
            </a>
          </Row>

          {/* ── Encryption ───────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--warm)' }}>encryption</div>
          <Row label="key escrow" hint="shamir-split · zero-knowledge to platform">enabled · 3 trusted, 2 required</Row>
          <Row label="recovery phrase" hint="print and store offline">four words · configure in onboarding</Row>

          {/* ── Notifications ────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--warm)' }}>the listener</div>

          {([
            { key: 'weeklyDigest',       label: 'weekly digest',   hint: 'family entries since last week' },
            { key: 'reminderEmails',     label: 'quarterly',       hint: 'gentle prompt to add a thread' },
            { key: 'pushNotifications',  label: 'locks opening',   hint: 'when sealed entries unlock' },
            { key: 'emailNotifications', label: 'receipts',        hint: 'transactional only' },
            { key: 'marketingEmails',    label: 'product updates', hint: 'occasional · unsubscribe any time' },
          ] as const).map((item) => (
            <div key={item.key} className="hl-notif-row">
              <div>
                <div className="hl-mono" style={{ fontSize: 10.5, color: 'var(--bone-dim)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{item.label}</div>
                <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-faint)', fontWeight: 400, marginTop: 2 }}>{item.hint}</div>
              </div>
              <input
                type="checkbox"
                checked={!!prefs[item.key]}
                onChange={(e) => updateNotif.mutate({ [item.key]: e.target.checked })}
                style={{ accentColor: 'var(--warm)', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
              />
            </div>
          ))}

          {/* ── Support ──────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--warm)' }}>support</div>
          <Row label="write to us" hint="we respond within two business days">
            <a href="mailto:support@heirloom.blue" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
              support@heirloom.blue →
            </a>
          </Row>

          {/* ── Danger ───────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--dye-madder)' }}>danger</div>
          <div style={{ padding: '14px 0', borderTop: '1px solid var(--rule)' }}>
            <button
              type="button"
              onClick={() => setDeleteStage('confirm')}
              style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--dye-madder)' }}
            >
              delete account →
            </button>
            <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-dim)', marginTop: 4, fontWeight: 400 }}>
              permanent · all data erased
            </div>
          </div>

        </div>
      </Frame>

      {/* Delete account modal */}
      {deleteStage !== 'idle' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,14,12,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '0 16px' }}>
          <div style={{ background: 'var(--ink)', border: '1px solid var(--rule)', padding: 'clamp(24px, 5vw, 40px) clamp(20px, 5vw, 40px)', maxWidth: 440, width: '100%' }}>
            {deleteStage === 'confirm' ? (
              <>
                <div className="hl-eyebrow" style={{ color: 'var(--dye-madder)', marginBottom: 14 }}>delete account</div>
                <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: '0 0 24px' }}>
                  This permanently deletes your thread, all entries, letters, and voice recordings. It cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setDeleteStage('password')}
                    style={{ background: 'transparent', border: '1px solid var(--dye-madder)', color: 'var(--dye-madder)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer' }}>
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
                <div className="hl-eyebrow" style={{ color: 'var(--dye-madder)', marginBottom: 14 }}>confirm password</div>
                <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 18px', lineHeight: 1.6 }}>
                  Enter your password to permanently delete your account.
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && deletePassword && deleteMutation.mutate()}
                  placeholder="your password"
                  autoFocus
                  style={{ width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8 }}
                />
                {deleteError && (
                  <p className="hl-mono" style={{ fontSize: 10, color: 'var(--dye-madder)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => deleteMutation.mutate()} disabled={!deletePassword || deleteMutation.isPending}
                    style={{ background: 'var(--dye-madder)', border: 0, color: 'var(--bone)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer', opacity: (!deletePassword || deleteMutation.isPending) ? 0.5 : 1 }}>
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
    </>
  );
}
