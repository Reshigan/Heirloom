import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { settingsApi, exportApi, deadmanApi } from '../services/api';
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

  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm' | 'quote' | 'password' | 'archived'>('idle');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Change password
  const [pwStage, setPwStage] = useState<'idle' | 'form'>('idle');
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwFlash, setPwFlash] = useState(false);
  const changePw = useMutation({
    mutationFn: () => settingsApi.changePassword({ currentPassword: pwCurrent, newPassword: pwNew }),
    onSuccess: () => {
      setPwStage('idle');
      setPwCurrent(''); setPwNew(''); setPwConfirm(''); setPwError(null);
      setPwFlash(true);
    },
    onError: (err: any) => setPwError(err?.response?.data?.error ?? 'Incorrect current password.'),
  });
  const handleChangePw = () => {
    if (pwNew.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (pwNew !== pwConfirm) { setPwError('Passwords do not match.'); return; }
    setPwError(null);
    changePw.mutate();
  };

  // Dead-man's switch check-in
  const deadmanStatus = useQuery({
    queryKey: ['deadman', 'status'],
    queryFn: () => deadmanApi.getStatus().then((r) => r.data).catch(() => null),
  });
  const checkIn = useMutation({
    mutationFn: () => deadmanApi.checkIn(),
    onSuccess: () => deadmanStatus.refetch(),
  });
  const dmStatus = (deadmanStatus.data ?? {}) as any;

  const exitQuoteQ = useQuery({
    queryKey: ['exit-quote'],
    enabled: deleteStage === 'quote',
    queryFn: () => settingsApi.getExitQuote().then((r) => r.data as { totalMB: number; feeCents: number; tier: string }),
  });

  const archiveMutation = useMutation({
    mutationFn: () => settingsApi.archiveAccount(deletePassword),
    onSuccess: () => setDeleteStage('archived'),
    onError: (err: any) => { setDeleteError(err?.response?.data?.error ?? 'Incorrect password.'); },
  });

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await exportApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heirloom-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore
    } finally {
      setExportLoading(false);
    }
  };

  const save = useMutation({
    mutationFn: () => settingsApi.updateProfile({ firstName, lastName }).then((r) => r.data),
    onSuccess: () => setSavedFlash(true),
  });

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications', 'prefs'],
    queryFn: () => settingsApi.getNotifications().then((r) => r.data).catch(() => null),
  });

  const updateNotif = useMutation({
    mutationFn: (patch: Record<string, boolean>) => settingsApi.updateNotifications(patch),
    onSuccess: () => refetchNotifs(),
  });

  const prefs = ((notifData as any)?.preferences ?? {}) as Record<string, boolean>;

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
              onChange={(e) => { setFirstName(e.target.value); setSavedFlash(false); }}
              style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
            />
          </div>
          <div className="hl-setting-row">
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>last name</div>
            <input
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setSavedFlash(false); }}
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

          {/* Change password */}
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--rule)' }}>
            {pwStage === 'idle' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button type="button" onClick={() => setPwStage('form')}
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--bone-dim)', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
                  change password →
                </button>
                {pwFlash && <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)' }}>∞ updated</span>}
              </div>
            ) : (
              <div style={{ maxWidth: 360 }}>
                <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>change password</div>
                {([
                  { label: 'current', val: pwCurrent, set: setPwCurrent, type: 'password', placeholder: 'current password' },
                  { label: 'new',     val: pwNew,     set: setPwNew,     type: 'password', placeholder: 'new password (min 8)' },
                  { label: 'confirm', val: pwConfirm, set: setPwConfirm, type: 'password', placeholder: 'confirm new password' },
                ] as const).map((f) => (
                  <input
                    key={f.label}
                    type={f.type}
                    value={f.val}
                    onChange={(e) => { f.set(e.target.value); setPwError(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && pwCurrent && pwNew && pwConfirm && handleChangePw()}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--bone)', padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8, display: 'block' }}
                  />
                ))}
                {pwError && <p className="hl-mono" style={{ fontSize: 10, color: 'var(--dye-madder)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>{pwError}</p>}
                <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                  <button type="button" onClick={handleChangePw} disabled={!pwCurrent || !pwNew || !pwConfirm || changePw.isPending}
                    className="hl-btn" style={{ fontSize: 11, padding: '9px 18px', opacity: (!pwCurrent || !pwNew || !pwConfirm || changePw.isPending) ? 0.5 : 1 }}>
                    {changePw.isPending ? 'updating…' : 'update password'}
                  </button>
                  <button type="button" onClick={() => { setPwStage('idle'); setPwCurrent(''); setPwNew(''); setPwConfirm(''); setPwError(null); }}
                    style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── The thread ────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--warm)' }}>the thread</div>

          <Row label="successors" hint="ordered · cascade on triggered switch">
            <Link to="/threads" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
              manage →
            </Link>
          </Row>
          <div className="hl-setting-row">
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase', paddingTop: 2 }}>
              dead-man's switch
            </div>
            <div>
              <div className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)', fontWeight: 400, marginBottom: 6 }}>
                {dmStatus.status === 'active' ? (
                  <>armed · next check-in due <span style={{ color: 'var(--warm)' }}>{dmStatus.nextCheckInDue ? new Date(dmStatus.nextCheckInDue).toLocaleDateString() : '—'}</span></>
                ) : dmStatus.status === 'warning' ? (
                  <span style={{ color: 'var(--dye-madder)' }}>overdue — check in now</span>
                ) : deadmanStatus.isLoading ? (
                  <span style={{ color: 'var(--bone-faint)' }}>loading…</span>
                ) : (
                  'not configured'
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {(dmStatus.status === 'active' || dmStatus.status === 'warning') && (
                  <button type="button" onClick={() => checkIn.mutate()} disabled={checkIn.isPending}
                    style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--warm)', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: checkIn.isPending ? 0.5 : 1 }}>
                    {checkIn.isPending ? 'checking in…' : 'check in now →'}
                  </button>
                )}
                <Link to="/inherit" style={{ color: 'var(--bone-faint)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
                  configure →
                </Link>
              </div>
              <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-faint)', fontWeight: 400, marginTop: 3 }}>
                warns at 7 days · triggers at 14 days · thread passes to steward
              </div>
            </div>
          </div>
          <Row label="export" hint="full JSON archive of all your memories, letters, and voice">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportLoading}
              style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', opacity: exportLoading ? 0.5 : 1 }}
            >
              {exportLoading ? 'preparing…' : 'download archive →'}
            </button>
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

          {/* ── Inheritance ──────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--warm)' }}>inheritance</div>
          <Row label="thread steward" hint="takes custodianship of the thread when the dead-man's switch triggers">
            <Link to="/threads" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
              designate →
            </Link>
          </Row>
          <Row label="memorial mode" hint="read-only public archive · no new entries after 1 year of inactivity">
            auto-eligible after 12 months
          </Row>

          {/* ── Danger ───────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--dye-madder)' }}>danger</div>
          <div style={{ padding: '14px 0', borderTop: '1px solid var(--rule)' }}>
            {deleteStage === 'idle' && (
              <>
                <button
                  type="button"
                  onClick={() => setDeleteStage('confirm')}
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--dye-madder)' }}
                >
                  close account →
                </button>
                <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-dim)', marginTop: 4, fontWeight: 400 }}>
                  90-day archive window before permanent erasure
                </div>
              </>
            )}

            {deleteStage === 'confirm' && (
              <div style={{ border: '1px solid rgba(194,90,90,0.35)', padding: 'clamp(20px, 4vw, 28px)', maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--dye-madder)', marginBottom: 14 }}>close account</div>
                <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: '0 0 24px' }}>
                  Your thread will be archived for 90 days. During that window you can download a full export of everything you have ever written. After 90 days it is permanently erased.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setDeleteStage('quote')}
                    style={{ background: 'transparent', border: '1px solid var(--dye-madder)', color: 'var(--dye-madder)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer' }}>
                    continue →
                  </button>
                  <button type="button" onClick={() => setDeleteStage('idle')}
                    style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStage === 'quote' && (
              <div style={{ border: '1px solid rgba(194,90,90,0.35)', padding: 'clamp(20px, 4vw, 28px)', maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--dye-madder)', marginBottom: 14 }}>export fee</div>
                {exitQuoteQ.isLoading ? (
                  <div style={{ height: 1, background: 'var(--warm)', width: 80, opacity: 0.5, margin: '24px 0' }} />
                ) : (
                  <>
                    <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: '0 0 10px' }}>
                      Your archive is <strong style={{ color: 'var(--bone)' }}>{exitQuoteQ.data?.totalMB ?? 0} MB</strong>.
                    </p>
                    {(exitQuoteQ.data?.feeCents ?? 0) > 0 ? (
                      <p className="hl-serif" style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--bone-dim)', margin: '0 0 24px' }}>
                        A one-time export fee of <strong style={{ color: 'var(--warm)' }}>${((exitQuoteQ.data?.feeCents ?? 0) / 100).toFixed(2)}</strong> applies for archives over 100 MB. Contact <a href="mailto:support@heirloom.blue" style={{ color: 'var(--warm)' }}>support@heirloom.blue</a> to arrange payment, then return here to proceed.
                      </p>
                    ) : (
                      <p className="hl-serif" style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--bone-dim)', margin: '0 0 24px' }}>
                        Your archive is under 100 MB — no export fee applies.
                      </p>
                    )}
                  </>
                )}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setDeleteStage('password')}
                    style={{ background: 'transparent', border: '1px solid var(--dye-madder)', color: 'var(--dye-madder)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer' }}>
                    archive my account →
                  </button>
                  <button type="button" onClick={() => setDeleteStage('idle')}
                    style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStage === 'password' && (
              <div style={{ border: '1px solid rgba(194,90,90,0.35)', padding: 'clamp(20px, 4vw, 28px)', maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--dye-madder)', marginBottom: 14 }}>confirm password</div>
                <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 18px', lineHeight: 1.6 }}>
                  Enter your password to archive your account. A download link will be emailed to you.
                </p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && deletePassword && archiveMutation.mutate()}
                  placeholder="your password"
                  autoFocus
                  style={{ width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', outline: 'none', fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8 }}
                />
                {deleteError && (
                  <p className="hl-mono" style={{ fontSize: 10, color: 'var(--dye-madder)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => archiveMutation.mutate()} disabled={!deletePassword || archiveMutation.isPending}
                    style={{ background: 'var(--dye-madder)', border: 0, color: 'var(--bone)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer', opacity: (!deletePassword || archiveMutation.isPending) ? 0.5 : 1 }}>
                    {archiveMutation.isPending ? 'archiving…' : 'archive account'}
                  </button>
                  <button type="button" onClick={() => { setDeleteStage('idle'); setDeletePassword(''); setDeleteError(null); }}
                    style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStage === 'archived' && (
              <div style={{ border: '1px solid rgba(176,122,74,0.35)', padding: 'clamp(20px, 4vw, 28px)', maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--warm)', marginBottom: 14 }}>archived</div>
                <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: '0 0 24px' }}>
                  Your account has been archived. Check your email for a download link. Your thread will be permanently erased in 90 days.
                </p>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exportLoading}
                  style={{ background: 'transparent', border: '1px solid var(--warm)', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer', marginBottom: 14, opacity: exportLoading ? 0.5 : 1 }}
                >
                  {exportLoading ? 'preparing…' : 'download archive now →'}
                </button>
                <br />
                <button type="button" onClick={() => { logout(); navigate('/', { replace: true }); }}
                  style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', marginTop: 8 }}>
                  sign out
                </button>
              </div>
            )}
          </div>

        </div>
      </Frame>
    </>
  );
}
