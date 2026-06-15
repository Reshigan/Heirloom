import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { settingsApi, exportApi, deadmanApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { usePageMeta } from '../lib/usePageMeta';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { CosmicHeader } from '../loom/cosmic/CosmicUI';
import { useLoomTheme } from '../loom/theme';

const RESPONSIVE_CSS = `
.hl-setting-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px 20px;
  padding: 18px 0;
  border-top: 1px solid var(--rule);
  align-items: baseline;
}
@media (max-width: 639px) {
  .hl-setting-row { grid-template-columns: 1fr; gap: 4px; padding: 15px 0; }
}
.hl-notif-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  padding: 16px 0;
  border-top: 1px solid var(--rule);
  align-items: center;
}
.hl-section-eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--warm);
}
.hl-signout {
  display: block;
  width: 100%;
  text-align: center;
  background: transparent;
  border: 0;
  padding: 22px 0;
  margin: 64px 0 0;
  cursor: pointer;
  font-family: var(--serif);
  font-size: 19px;
  font-weight: 400;
  color: var(--warm);
  transition: color 360ms var(--ease, cubic-bezier(0.16,1,0.3,1));
}
.hl-signout:hover { color: var(--warm-bright); }

.hl-sumrow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--rule);
  padding: 26px 2px;
  cursor: pointer;
  transition: opacity 360ms var(--ease, cubic-bezier(0.16,1,0.3,1));
}
.hl-sumrow:hover { opacity: 0.78; }
.hl-sumrow-label {
  font-family: var(--serif);
  font-size: 23px;
  font-weight: 400;
  color: var(--bone);
  line-height: 1.1;
}
.hl-sumrow-meta {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--bone-faint);
  white-space: nowrap;
  flex-shrink: 0;
}
.hl-sumrow-body {
  padding: 4px 2px 36px;
  border-bottom: 1px solid var(--rule);
}

/* slim pill toggle — track + warm dot when on (no chunky OS switch) */
.hl-toggle {
  position: relative;
  width: 34px;
  height: 16px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--rule);
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 360ms var(--ease, cubic-bezier(0.16,1,0.3,1));
}
.hl-toggle[aria-checked="true"] { border-color: var(--warm-dim); }
.hl-toggle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bone-faint);
  transform: translate(0, -50%);
  transition: transform 360ms var(--ease, cubic-bezier(0.16,1,0.3,1)), background 360ms var(--ease, cubic-bezier(0.16,1,0.3,1));
}
.hl-toggle[aria-checked="true"]::after {
  background: var(--warm);
  transform: translate(18px, -50%);
}
`;

/** Slim pill toggle — quiet track, warm dot slides on. Not a chunky OS switch. */
function PillToggle({ checked, onChange, ariaLabel }: { checked: boolean; onChange: (next: boolean) => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className="hl-toggle"
      onClick={() => onChange(!checked)}
    />
  );
}

/** Cosmic summary row — large serif label + mono meta, expands to reveal section content. */
function SummaryRow({ label, meta, open, onToggle, children }: {
  label: string;
  meta: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button type="button" className="hl-sumrow" onClick={onToggle} aria-expanded={open}>
        <span className="hl-sumrow-label">{label}</span>
        <span className="hl-sumrow-meta">{open ? 'CLOSE ×' : meta}</span>
      </button>
      {open && <div className="hl-sumrow-body">{children}</div>}
    </>
  );
}

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
  usePageMeta('Settings');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useLoomTheme();
  const [openRow, setOpenRow] = useState<null | 'account' | 'notifications' | 'theme' | 'privacy'>(null);
  const toggleRow = (r: 'account' | 'notifications' | 'theme' | 'privacy') =>
    setOpenRow((cur) => (cur === r ? null : r));
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  // Seed birth date + gender from the server profile (not held in authStore).
  // These tailor the Listener's prompts to the author's life stage.
  const { data: profileData, isError: profileLoadError } = useQuery({
    queryKey: ['settings', 'profile'],
    queryFn: () => settingsApi.getProfile().then((r) => r.data),
    retry: 1,
  });
  useEffect(() => {
    if (!profileData) return;
    setBirthDate((profileData as any).birthDate ?? '');
    setGender((profileData as any).gender ?? '');
    if ((profileData as any).guardianName) setGuardianName((profileData as any).guardianName);
    if ((profileData as any).guardianEmail) setGuardianEmail((profileData as any).guardianEmail);
  }, [profileData]);

  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [guardianEmailError, setGuardianEmailError] = useState<string | null>(null);
  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm' | 'quote' | 'password' | 'archived'>('idle');

  // Letter guardian
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianSaved, setGuardianSaved] = useState(false);
  const saveGuardian = useMutation({
    mutationFn: () => settingsApi.updateProfile({ firstName, lastName, ...(guardianEmail ? { guardianEmail, guardianName } : {}) } as any),
    onSuccess: () => { setGuardianSaved(true); setTimeout(() => setGuardianSaved(false), 3000); },
    onError: (err) => { setGuardianEmailError(err instanceof Error ? err.message : 'Failed to save guardian'); },
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Change email
  const [emailStage, setEmailStage] = useState<'idle' | 'form'>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailFlash, setEmailFlash] = useState(false);
  const changeEmail = useMutation({
    mutationFn: () => settingsApi.changeEmail({ newEmail, password: emailPassword }),
    onSuccess: () => {
      setEmailStage('idle');
      setNewEmail(''); setEmailPassword(''); setEmailError(null);
      setEmailFlash(true);
    },
    onError: (err: any) => setEmailError(err?.response?.data?.error ?? 'Incorrect password or invalid email.'),
  });
  const handleChangeEmail = () => {
    if (!newEmail.includes('@')) { setEmailError('Enter a valid email address.'); return; }
    setEmailError(null);
    changeEmail.mutate();
  };

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
    onSuccess: () => { setCheckInError(null); deadmanStatus.refetch(); },
    onError: (err: any) => setCheckInError(err?.response?.data?.error ?? 'check-in failed'),
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
    setExportError(null);
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
      setExportError('export failed — try again or contact support@heirloom.blue');
    } finally {
      setExportLoading(false);
    }
  };

  const save = useMutation({
    // Only include birthDate/gender once the profile query has seeded them —
    // otherwise a name-only save fired before the query settles would post
    // empty strings and silently clear an existing DOB/gender (worker COALESCE
    // treats '' as a real value).
    mutationFn: () => settingsApi.updateProfile({
      firstName,
      lastName,
      ...(profileData ? { birthDate, gender } : {}),
    }).then((r) => r.data),
    onSuccess: () => { setSaveError(null); setSavedFlash(true); setTimeout(() => setSavedFlash(false), 2500); },
    onError: (err: any) => setSaveError(err?.response?.data?.error ?? 'save failed'),
  });

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications', 'prefs'],
    queryFn: () => settingsApi.getNotifications().then((r) => r.data).catch(() => null),
  });

  const updateNotif = useMutation({
    mutationFn: (patch: Record<string, boolean>) => settingsApi.updateNotifications(patch),
    onSuccess: () => { setNotifError(null); refetchNotifs(); },
    onError: (err: any) => setNotifError(err?.response?.data?.error ?? 'could not update notification preference'),
  });

  const prefs = ((notifData as any)?.preferences ?? {}) as Record<string, boolean>;

  // ── Mono meta values, derived from existing data ──────────────────
  const accountMeta = (() => {
    const id = (user as any)?.id as string | undefined;
    if (id) return `USER_ID: ${id.slice(0, 8).toUpperCase()}`;
    if (user?.email) return user.email.toUpperCase();
    return 'MANAGE';
  })();
  const notifMeta = (() => {
    const on: string[] = [];
    if (prefs.pushNotifications) on.push('PUSH');
    if (prefs.emailNotifications || prefs.weeklyDigest || prefs.reminderEmails) on.push('EMAIL');
    return on.length ? `ENABLED: ${on.join(', ')}` : 'MANAGE';
  })();
  const themeMeta = `CURRENT: ${(theme === 'system' ? 'SYSTEM' : theme).toUpperCase()} MODE`;
  const privacyMeta = (() => {
    const last = (dmStatus.lastCheckIn ?? dmStatus.lastCheckInAt) as string | undefined;
    if (last) return `LAST REVIEW: ${new Date(last).toISOString().slice(0, 10)}`;
    return 'MANAGE';
  })();

  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom' }, { label: 'settings' }]} />}
    >
      <style>{RESPONSIVE_CSS}</style>
        <div style={{ maxWidth: 'var(--page-max-prose)', margin: '0 auto', padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)' }}>

          <CosmicHeader eyebrow="THE KEEPING" title="Settings" align="left" />

          {profileLoadError && !profileData && (
            <p className="hl-mono" style={{ fontSize: 11, color: 'var(--warm-dim)', letterSpacing: '0.16em', margin: '0 0 20px', textTransform: 'uppercase' }}>
              could not load settings — try refreshing
            </p>
          )}

          {/* ════════ ACCOUNT ════════ */}
          <SummaryRow label="Account" meta={accountMeta} open={openRow === 'account'} onToggle={() => toggleRow('account')}>

          {/* ── Your name ─────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '4px 0 14px', color: 'var(--warm)' }}>you</div>

          <div className="hl-setting-row">
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>first name</div>
            <input
              aria-label="First name"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setSavedFlash(false); }}
              style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
            />
          </div>
          <div className="hl-setting-row">
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>last name</div>
            <input
              aria-label="Last name"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setSavedFlash(false); }}
              style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
            />
          </div>
          <div className="hl-setting-row">
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>date of birth</div>
            <input
              type="date"
              aria-label="Date of birth"
              value={birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => { setBirthDate(e.target.value); setSavedFlash(false); }}
              style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', colorScheme: 'dark', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
            />
          </div>
          <div className="hl-setting-row">
            <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>gender</div>
            <input
              aria-label="Gender"
              value={gender}
              placeholder="optional — e.g. woman, man, nonbinary"
              onChange={(e) => { setGender(e.target.value); setSavedFlash(false); }}
              style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
            />
          </div>
          <p className="hl-serif" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--bone-faint)', margin: '4px 0 0', lineHeight: 1.6 }}>
            Used only to tailor the Listener's prompts to your life — never shown to anyone, never required.
          </p>
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="hl-btn" style={{ fontSize: 11, padding: '9px 18px' }}>
              {save.isPending ? 'saving…' : 'save'}
            </button>
            {savedFlash && (
              <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)' }}>∞ saved</span>
            )}
            {saveError && (
              <span className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.12em' }}>{saveError}</span>
            )}
          </div>

          {/* Change email */}
          <div style={{ padding: '12px 0', borderTop: '1px solid var(--rule)' }}>
            {emailStage === 'idle' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)', fontWeight: 400 }}>{user?.email ?? '—'}</span>
                  <span className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-dim)', fontWeight: 400, lineHeight: 1.5 }}>primary identifier</span>
                </div>
                <button type="button" onClick={() => { setEmailStage('form'); setEmailFlash(false); }}
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--bone-dim)', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', flexShrink: 0 }}>
                  change →
                </button>
                {emailFlash && <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)' }}>∞ updated</span>}
              </div>
            ) : (
              <div style={{ maxWidth: 360 }}>
                <div className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>change email</div>
                {([
                  { label: 'new email',         val: newEmail,       set: setNewEmail,       type: 'email',    placeholder: 'new email address',       ariaLabel: 'New email address' },
                  { label: 'current password',  val: emailPassword,  set: setEmailPassword,  type: 'password', placeholder: 'confirm your identity',    ariaLabel: 'Current password' },
                ] as const).map((f) => (
                  <input
                    key={f.label}
                    type={f.type}
                    aria-label={f.ariaLabel}
                    value={f.val}
                    onChange={(e) => { f.set(e.target.value); setEmailError(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && newEmail && emailPassword && handleChangeEmail()}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8, display: 'block' }}
                  />
                ))}
                {emailError && <p className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>{emailError}</p>}
                <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                  <button type="button" onClick={handleChangeEmail} disabled={!newEmail || !emailPassword || changeEmail.isPending}
                    className="hl-btn" style={{ fontSize: 11, padding: '9px 18px', opacity: (!newEmail || !emailPassword || changeEmail.isPending) ? 0.5 : 1 }}>
                    {changeEmail.isPending ? 'updating…' : 'update email'}
                  </button>
                  <button type="button" onClick={() => { setEmailStage('idle'); setNewEmail(''); setEmailPassword(''); setEmailError(null); }}
                    style={{ background: 'transparent', border: 0, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>

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
                  { label: 'current', val: pwCurrent, set: setPwCurrent, type: 'password', placeholder: 'current password',      ariaLabel: 'Current password' },
                  { label: 'new',     val: pwNew,     set: setPwNew,     type: 'password', placeholder: 'new password (min 8)',   ariaLabel: 'New password' },
                  { label: 'confirm', val: pwConfirm, set: setPwConfirm, type: 'password', placeholder: 'confirm new password',  ariaLabel: 'Confirm new password' },
                ] as const).map((f) => (
                  <input
                    key={f.label}
                    type={f.type}
                    aria-label={f.ariaLabel}
                    value={f.val}
                    onChange={(e) => { f.set(e.target.value); setPwError(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && pwCurrent && pwNew && pwConfirm && handleChangePw()}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8, display: 'block' }}
                  />
                ))}
                {pwError && <p className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>{pwError}</p>}
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

          </SummaryRow>

          {/* ════════ NOTIFICATIONS ════════ */}
          <SummaryRow label="Notifications" meta={notifMeta} open={openRow === 'notifications'} onToggle={() => toggleRow('notifications')}>

          {/* ── Notifications ────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '4px 0 14px', color: 'var(--warm)' }}>the listener</div>

          {([
            { key: 'weeklyDigest',       label: 'weekly digest',   hint: 'family entries since last week',      ariaLabel: 'Enable weekly digest emails' },
            { key: 'reminderEmails',     label: 'quarterly',       hint: 'gentle prompt to add a thread',       ariaLabel: 'Enable quarterly reminder emails' },
            { key: 'pushNotifications',  label: 'locks opening',   hint: 'when sealed entries unlock',          ariaLabel: 'Enable push notifications for sealed entry unlocks' },
            { key: 'emailNotifications', label: 'receipts',        hint: 'transactional only',                  ariaLabel: 'Enable transactional email notifications' },
            { key: 'marketingEmails',    label: 'product updates', hint: 'occasional · unsubscribe any time',   ariaLabel: 'Enable product update emails' },
          ] as const).map((item) => (
            <div key={item.key} className="hl-notif-row">
              <div>
                <div className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', fontWeight: 400 }}>{item.label}</div>
                <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-faint)', fontWeight: 400, marginTop: 2 }}>{item.hint}</div>
              </div>
              <PillToggle
                ariaLabel={item.ariaLabel}
                checked={!!prefs[item.key]}
                onChange={(next) => updateNotif.mutate({ [item.key]: next })}
              />
            </div>
          ))}
          {notifError && (
            <span className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.12em', display: 'block', paddingTop: 6 }}>{notifError}</span>
          )}

          </SummaryRow>

          {/* ════════ THEME ════════ */}
          <SummaryRow label="Theme" meta={themeMeta} open={openRow === 'theme'} onToggle={() => toggleRow('theme')}>

          <div className="hl-eyebrow" style={{ margin: '4px 0 14px', color: 'var(--warm)' }}>appearance</div>
          <p className="hl-serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--bone-faint)', lineHeight: 1.65, margin: '0 0 18px', maxWidth: '52ch' }}>
            The thread is written for the dark — but it reads in either light.
          </p>
          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
            {(['dark', 'light', 'system'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setTheme(opt)}
                aria-pressed={theme === opt}
                style={{
                  background: 'transparent',
                  border: 0,
                  borderBottom: theme === opt ? '1px solid var(--warm)' : '1px solid var(--rule)',
                  padding: '10px 22px 10px 0',
                  marginRight: 24,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: theme === opt ? 'var(--warm)' : 'var(--bone-dim)',
                  transition: 'color 360ms var(--ease, cubic-bezier(0.16,1,0.3,1))',
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          </SummaryRow>

          {/* ════════ PRIVACY ════════ */}
          <SummaryRow label="Privacy" meta={privacyMeta} open={openRow === 'privacy'} onToggle={() => toggleRow('privacy')}>

          {/* ── The thread ────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '4px 0 6px', color: 'var(--warm)' }}>the thread</div>
          <div style={{ marginBottom: 14 }}>
            <Link to="/billing" style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none', borderBottom: '1px solid var(--rule)' }}>manage billing →</Link>
          </div>

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
                  <span style={{ color: 'var(--danger)' }}>overdue — check in now</span>
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
                <Link to="/threads" style={{ color: 'var(--bone-faint)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
                  configure →
                </Link>
                {checkInError && (
                  <span className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.12em' }}>{checkInError}</span>
                )}
              </div>
              <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-faint)', fontWeight: 400, marginTop: 3 }}>
                warns at 7 days · triggers at 14 days · thread passes to steward
              </div>
            </div>
          </div>
          <Row label="export" hint="full JSON archive of all your memories, letters, and voice">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={handleExport}
                disabled={exportLoading}
                style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', opacity: exportLoading ? 0.5 : 1 }}
              >
                {exportLoading ? 'preparing…' : 'download archive →'}
              </button>
              {exportError && (
                <span className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.12em' }}>{exportError}</span>
              )}
            </div>
          </Row>

          {/* ── Encryption ───────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--warm)' }}>encryption</div>
          <Row label="key escrow" hint="shamir-split · zero-knowledge to platform">enabled · 3 trusted, 2 required</Row>
          <Row label="recovery phrase" hint="print and store offline">four words · configure in onboarding</Row>

          {/* ── Support ──────────────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--warm)' }}>support</div>
          <Row label="write to us" hint="we respond within two business days">
            <a href="mailto:support@heirloom.blue" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
              support@heirloom.blue →
            </a>
          </Row>

          {/* ── Letter Guardian ──────────────────────────── */}
          <div className="hl-eyebrow" style={{ margin: '28px 0 6px', color: 'var(--warm)' }}>if something happens to me</div>
          <p className="hl-serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--bone-faint)', lineHeight: 1.65, margin: '0 0 16px', maxWidth: '52ch' }}>
            Designate someone who ensures your sealed letters reach the people you wrote them for — even if you can no longer do it yourself.
          </p>
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16, marginBottom: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <div className="hl-mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 6 }}>guardian name</div>
                <input
                  aria-label="Guardian name"
                  value={guardianName}
                  onChange={e => { setGuardianName(e.target.value); setGuardianSaved(false); }}
                  placeholder="their name"
                  style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
                />
              </div>
              <div>
                <div className="hl-mono" style={{ fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginBottom: 6 }}>guardian email</div>
                <input
                  type="email"
                  aria-label="Guardian email"
                  value={guardianEmail}
                  onChange={e => { setGuardianEmail(e.target.value); setGuardianSaved(false); }}
                  placeholder="name@example.com"
                  style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', fontWeight: 400, width: '100%', padding: '2px 0 4px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              {guardianEmailError && (
                <span className="hl-mono" style={{ width: '100%', fontSize: 10, color: 'var(--danger)', letterSpacing: '0.12em' }}>{guardianEmailError}</span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
                    setGuardianEmailError('enter a valid email address');
                    return;
                  }
                  setGuardianEmailError(null);
                  saveGuardian.mutate();
                }}
                disabled={!guardianEmail || saveGuardian.isPending}
                style={{ background: 'transparent', border: 0, padding: 0, cursor: guardianEmail ? 'pointer' : 'default', fontFamily: 'var(--mono)', fontSize: 10.5, color: guardianEmail ? 'var(--warm)' : 'var(--bone-faint)', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: saveGuardian.isPending ? 0.5 : 1 }}
              >
                {saveGuardian.isPending ? 'saving…' : 'designate guardian →'}
              </button>
              {guardianSaved && (
                <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.12em' }}>saved</span>
              )}
            </div>
            <p className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-faint)', margin: '10px 0 0', lineHeight: 1.5, maxWidth: '52ch' }}>
              They receive a notification if your account goes 6+ months inactive. No access to your entries — only authority to ensure delivery.
            </p>
          </div>

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
          <div className="hl-eyebrow" style={{ margin: '28px 0 14px', color: 'var(--danger)' }}>danger</div>
          <div style={{ padding: '14px 0', borderTop: '1px solid var(--rule)' }}>
            {deleteStage === 'idle' && (
              <>
                <button
                  type="button"
                  onClick={() => setDeleteStage('confirm')}
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--danger)' }}
                >
                  close account →
                </button>
                <div className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-dim)', marginTop: 4, fontWeight: 400 }}>
                  90-day archive window before permanent erasure
                </div>
              </>
            )}

            {deleteStage === 'confirm' && (
              <div style={{ borderTop: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)', paddingTop: 'clamp(20px, 4vw, 28px)', maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--danger)', marginBottom: 14 }}>close account</div>
                <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: '0 0 24px' }}>
                  Your thread will be archived for 90 days. During that window you can download a full export of everything you have ever written. After 90 days it is permanently erased.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setDeleteStage('quote')}
                    style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer' }}>
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
              <div style={{ borderTop: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)', paddingTop: 'clamp(20px, 4vw, 28px)', maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--danger)', marginBottom: 14 }}>export fee</div>
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
                    style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer' }}>
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
              <div style={{ borderTop: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)', paddingTop: 'clamp(20px, 4vw, 28px)', maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--danger)', marginBottom: 14 }}>confirm password</div>
                <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 18px', lineHeight: 1.6 }}>
                  Enter your password to archive your account. A download link will be emailed to you.
                </p>
                <input
                  type="password"
                  aria-label="Password to confirm deletion"
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && deletePassword && archiveMutation.mutate()}
                  placeholder="your password"
                  autoFocus
                  style={{ width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)', fontFamily: 'var(--serif)', fontSize: 15, color: 'var(--bone)', padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8 }}
                />
                {deleteError && (
                  <p className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => archiveMutation.mutate()} disabled={!deletePassword || archiveMutation.isPending}
                    style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer', opacity: (!deletePassword || archiveMutation.isPending) ? 0.5 : 1 }}>
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
              <div style={{ borderTop: '1px solid color-mix(in srgb, var(--warm) 35%, transparent)', paddingTop: 'clamp(20px, 4vw, 28px)', maxWidth: 480 }}>
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

          </SummaryRow>

          {/* ── Sign out ─────────────────────────────────── */}
          <button
            type="button"
            className="hl-signout"
            onClick={() => { void logout().then(() => navigate('/', { replace: true })); }}
          >
            Sign out
          </button>

        </div>
    </ClothShell>
  );
}
