import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { settingsApi, exportApi, deadmanApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { usePageMeta } from '../lib/usePageMeta';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { useLoomTheme } from '../loom/theme';

const RESPONSIVE_CSS = `
/* Ledger row — serif label left, mono value/control right. */
.hl-ledgerrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 0;
  border-bottom: 1px solid var(--rule);
}
.hl-ledgerrow-label {
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 400;
  color: var(--bone);
  line-height: 1.3;
  min-width: 0;
}
.hl-ledgerrow-hint {
  display: block;
  font-family: var(--serif);
  font-style: italic;
  font-size: 12px;
  font-weight: 400;
  color: var(--bone-faint);
  line-height: 1.5;
  margin-top: 2px;
}
.hl-ledgerrow-value {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--bone-dim);
  white-space: nowrap;
  flex-shrink: 0;
  text-align: right;
}
.hl-ledgerrow-value--warm { color: var(--warm); }

/* Word-value action — quiet dim serif on the right (Edit / Request / Clear / Manage). */
.hl-wordaction {
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 400;
  color: var(--bone-dim);
  text-decoration: none;
  white-space: nowrap;
  line-height: 1.3;
  transition: color 360ms var(--ease, cubic-bezier(0.16,1,0.3,1));
}
.hl-wordaction:hover { color: var(--bone); }
.hl-wordaction:disabled { opacity: 0.5; cursor: default; }
.hl-wordaction--warm { color: var(--warm); }
.hl-wordaction--warm:hover { color: var(--warm-bright); }

/* Static word value — dim serif, not actionable (e.g. "Every Day", "user@example.com"). */
.hl-wordvalue {
  font-family: var(--serif);
  font-size: 17px;
  font-weight: 400;
  color: var(--bone-dim);
  white-space: nowrap;
  line-height: 1.3;
  text-align: right;
}

/* ON / OFF state word — mono caps; ON is warm, OFF is faint. */
.hl-statetoggle {
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.18em;
  color: var(--bone-faint);
  white-space: nowrap;
  transition: color 360ms var(--ease, cubic-bezier(0.16,1,0.3,1));
}
.hl-statetoggle[aria-checked="true"] { color: var(--warm); }
.hl-statetoggle:hover { color: var(--bone); }
.hl-statetoggle[aria-checked="true"]:hover { color: var(--warm-bright); }

/* Mono action — the warm right-side actionable value (VIEW / MANAGE / CHANGE). */
.hl-monoaction {
  background: transparent;
  border: 0;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--warm);
  text-decoration: none;
  white-space: nowrap;
  transition: color 360ms var(--ease, cubic-bezier(0.16,1,0.3,1));
}
.hl-monoaction:hover { color: var(--warm-bright); }
.hl-monoaction:disabled { opacity: 0.5; cursor: default; }
.hl-monoaction--quiet { color: var(--bone-dim); }
.hl-monoaction--quiet:hover { color: var(--bone); }
.hl-monoaction--danger { color: var(--warm); }

/* Field input set inside an expanded row block. */
.hl-fieldrow {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px 20px;
  padding: 14px 0;
  border-bottom: 1px solid var(--rule);
  align-items: baseline;
}
@media (max-width: 639px) {
  .hl-fieldrow { grid-template-columns: 1fr; gap: 4px; padding: 13px 0; }
  .hl-ledgerrow { gap: 16px; }
}
.hl-field-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--bone-faint);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  padding-top: 2px;
}
.hl-field-input {
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--rule);
  font-family: var(--serif);
  font-size: 16px;
  color: var(--bone);
  font-weight: 400;
  width: 100%;
  padding: 2px 0 4px;
}

.hl-signout {
  display: block;
  margin: 56px auto 40px;
  background: transparent;
  border: 0;
  padding: 22px 0;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 5px;
  text-decoration-thickness: 1px;
  color: var(--bone-dim);
  transition: color 360ms var(--ease, cubic-bezier(0.16,1,0.3,1));
}
.hl-signout:hover { color: var(--warm); }

`;

/** ON / OFF state word — mono caps, ON warm, OFF faint. The reference's toggle idiom. */
function StateToggle({ checked, onChange, ariaLabel }: { checked: boolean; onChange: (next: boolean) => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className="hl-statetoggle"
      onClick={() => onChange(!checked)}
    >
      {checked ? 'ON' : 'OFF'}
    </button>
  );
}

/**
 * Ledger row — serif label on the left, mono value/control on the right.
 * `hint` sets an italic serif sub-line under the label; `value` is the right
 * column (a static mono string, a warm action, a toggle — anything).
 */
function LedgerRow({ label, hint, value }: { label: React.ReactNode; hint?: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="hl-ledgerrow">
      <span className="hl-ledgerrow-label">
        {label}
        {hint && <span className="hl-ledgerrow-hint">{hint}</span>}
      </span>
      <span className="hl-ledgerrow-value">{value}</span>
    </div>
  );
}

const FIELD_INPUT_STYLE: React.CSSProperties = {
  background: 'transparent', border: 0, borderBottom: '1px solid var(--rule)',
  fontFamily: 'var(--serif)', fontSize: 16, color: 'var(--bone)', fontWeight: 400,
  width: '100%', padding: '2px 0 4px',
};

export function Settings() {
  usePageMeta('Settings');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, setTheme } = useLoomTheme();
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
  const [guardianOpen, setGuardianOpen] = useState(false);
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
          <SectionLabel>Account</SectionLabel>

          <div className="hl-fieldrow">
            <div className="hl-field-label">first name</div>
            <input
              aria-label="First name"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setSavedFlash(false); }}
              style={FIELD_INPUT_STYLE}
            />
          </div>
          <div className="hl-fieldrow">
            <div className="hl-field-label">last name</div>
            <input
              aria-label="Last name"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setSavedFlash(false); }}
              style={FIELD_INPUT_STYLE}
            />
          </div>
          <div className="hl-fieldrow">
            <div className="hl-field-label">date of birth</div>
            <input
              type="date"
              aria-label="Date of birth"
              value={birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => { setBirthDate(e.target.value); setSavedFlash(false); }}
              style={{ ...FIELD_INPUT_STYLE, colorScheme: 'dark' }}
            />
          </div>
          <div className="hl-fieldrow">
            <div className="hl-field-label">gender</div>
            <input
              aria-label="Gender"
              value={gender}
              placeholder="optional — e.g. woman, man, nonbinary"
              onChange={(e) => { setGender(e.target.value); setSavedFlash(false); }}
              style={FIELD_INPUT_STYLE}
            />
          </div>
          <p className="hl-serif" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--bone-faint)', margin: '10px 0 0', lineHeight: 1.6, maxWidth: '52ch' }}>
            Used only to tailor the Listener's prompts to your life — never shown to anyone, never required.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '14px 0 6px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="hl-btn" style={{ fontSize: 11, padding: '9px 18px' }}>
              {save.isPending ? 'saving…' : 'save'}
            </button>
            {savedFlash && (
              <span className="hl-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--warm)' }}>∞ saved</span>
            )}
            {saveError && (
              <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.12em' }}>{saveError}</span>
            )}
          </div>

          {/* Email — ledger row that expands to the change form */}
          {emailStage === 'idle' ? (
            <LedgerRow
              label="Email"
              hint="primary identifier"
              value={
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 16 }}>
                  <span className="hl-wordvalue">{user?.email ?? '—'}</span>
                  <button type="button" className="hl-wordaction hl-wordaction--warm" onClick={() => { setEmailStage('form'); setEmailFlash(false); }}>Change</button>
                  {emailFlash && <span className="hl-wordvalue" style={{ color: 'var(--warm)' }}>∞ updated</span>}
                </span>
              }
            />
          ) : (
            <div style={{ padding: '14px 0', borderBottom: '1px solid var(--rule)', maxWidth: 360 }}>
              <div className="hl-field-label" style={{ marginBottom: 10 }}>change email</div>
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
                  style={{ ...FIELD_INPUT_STYLE, padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8, display: 'block' }}
                />
              ))}
              {emailError && <p className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>{emailError}</p>}
              <div style={{ display: 'flex', gap: 14, marginTop: 4, alignItems: 'center' }}>
                <button type="button" onClick={handleChangeEmail} disabled={!newEmail || !emailPassword || changeEmail.isPending}
                  className="hl-monoaction" style={{ opacity: (!newEmail || !emailPassword || changeEmail.isPending) ? 0.5 : 1 }}>
                  {changeEmail.isPending ? 'updating…' : 'update email →'}
                </button>
                <button type="button" className="hl-monoaction hl-monoaction--quiet" onClick={() => { setEmailStage('idle'); setNewEmail(''); setEmailPassword(''); setEmailError(null); }}>
                  cancel
                </button>
              </div>
            </div>
          )}

          {/* Password — ledger row that expands to the change form */}
          {pwStage === 'idle' ? (
            <LedgerRow
              label="Password"
              value={
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 16 }}>
                  <span className="hl-wordvalue" style={{ letterSpacing: '0.12em' }}>••••••••</span>
                  <button type="button" className="hl-wordaction hl-wordaction--warm" onClick={() => setPwStage('form')}>Change</button>
                  {pwFlash && <span className="hl-wordvalue" style={{ color: 'var(--warm)' }}>∞ updated</span>}
                </span>
              }
            />
          ) : (
            <div style={{ padding: '14px 0', borderBottom: '1px solid var(--rule)', maxWidth: 360 }}>
              <div className="hl-field-label" style={{ marginBottom: 10 }}>change password</div>
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
                  style={{ ...FIELD_INPUT_STYLE, padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8, display: 'block' }}
                />
              ))}
              {pwError && <p className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>{pwError}</p>}
              <div style={{ display: 'flex', gap: 14, marginTop: 4, alignItems: 'center' }}>
                <button type="button" onClick={handleChangePw} disabled={!pwCurrent || !pwNew || !pwConfirm || changePw.isPending}
                  className="hl-monoaction" style={{ opacity: (!pwCurrent || !pwNew || !pwConfirm || changePw.isPending) ? 0.5 : 1 }}>
                  {changePw.isPending ? 'updating…' : 'update password →'}
                </button>
                <button type="button" className="hl-monoaction hl-monoaction--quiet" onClick={() => { setPwStage('idle'); setPwCurrent(''); setPwNew(''); setPwConfirm(''); setPwError(null); }}>
                  cancel
                </button>
              </div>
            </div>
          )}

          {/* ════════ NOTIFICATIONS ════════ */}
          <SectionLabel>Notifications</SectionLabel>

          {([
            { key: 'weeklyDigest',       label: 'Weekly digest',   hint: 'family entries since last week',      ariaLabel: 'Enable weekly digest emails' },
            { key: 'reminderEmails',     label: 'Quarterly',       hint: 'gentle prompt to add a thread',       ariaLabel: 'Enable quarterly reminder emails' },
            { key: 'pushNotifications',  label: 'Locks opening',   hint: 'when sealed entries unlock',          ariaLabel: 'Enable push notifications for sealed entry unlocks' },
            { key: 'emailNotifications', label: 'Receipts',        hint: 'transactional only',                  ariaLabel: 'Enable transactional email notifications' },
            { key: 'marketingEmails',    label: 'Product updates', hint: 'occasional · unsubscribe any time',   ariaLabel: 'Enable product update emails' },
          ] as const).map((item) => (
            <LedgerRow
              key={item.key}
              label={item.label}
              hint={item.hint}
              value={
                <StateToggle
                  ariaLabel={item.ariaLabel}
                  checked={!!prefs[item.key]}
                  onChange={(next) => updateNotif.mutate({ [item.key]: next })}
                />
              }
            />
          ))}
          {notifError && (
            <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.12em', display: 'block', paddingTop: 6 }}>{notifError}</span>
          )}

          {/* ════════ APPEARANCE ════════ */}
          <SectionLabel>Appearance</SectionLabel>

          <LedgerRow
            label="Theme"
            hint="the thread is written for the dark — but it reads in either light"
            value={
              <span style={{ display: 'inline-flex', gap: 22 }}>
                {(['dark', 'light', 'system'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTheme(opt)}
                    aria-pressed={theme === opt}
                    className="hl-monoaction"
                    style={{ color: theme === opt ? 'var(--warm)' : 'var(--bone-dim)' }}
                  >
                    {opt}
                  </button>
                ))}
              </span>
            }
          />

          {/* ════════ THE BLOODLINE ════════ */}
          <SectionLabel>The Bloodline</SectionLabel>

          <LedgerRow
            label="Successors"
            hint="ordered · cascade on triggered switch"
            value={<Link to="/threads" className="hl-wordaction hl-wordaction--warm">Manage</Link>}
          />
          <LedgerRow
            label="Thread steward"
            hint="takes custodianship when the dead-man's switch triggers"
            value={<Link to="/threads" className="hl-wordaction hl-wordaction--warm">Designate</Link>}
          />
          <LedgerRow
            label="Memorial mode"
            hint="read-only public archive · no new entries after 1 year inactive"
            value={<span className="hl-wordvalue" style={{ fontStyle: 'italic' }}>Auto · 12 months</span>}
          />

          {/* Letter guardian — ledger row that expands to the designate form */}
          {!guardianOpen ? (
            <LedgerRow
              label="Letter guardian"
              hint="ensures your sealed letters reach the people you wrote them for"
              value={
                <button type="button" className="hl-wordaction hl-wordaction--warm" onClick={() => setGuardianOpen(true)}>
                  {guardianEmail ? 'Edit' : 'Designate'}
                </button>
              }
            />
          ) : (
            <div style={{ padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
              <div className="hl-field-label" style={{ marginBottom: 6 }}>letter guardian</div>
              <p className="hl-serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--bone-faint)', lineHeight: 1.6, margin: '0 0 16px', maxWidth: '52ch' }}>
                Designate someone who ensures your sealed letters reach the people you wrote them for — even if you can no longer do it yourself.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <div className="hl-field-label" style={{ marginBottom: 6 }}>guardian name</div>
                  <input
                    aria-label="Guardian name"
                    value={guardianName}
                    onChange={e => { setGuardianName(e.target.value); setGuardianSaved(false); }}
                    placeholder="their name"
                    style={{ ...FIELD_INPUT_STYLE, fontSize: 15 }}
                  />
                </div>
                <div>
                  <div className="hl-field-label" style={{ marginBottom: 6 }}>guardian email</div>
                  <input
                    type="email"
                    aria-label="Guardian email"
                    value={guardianEmail}
                    onChange={e => { setGuardianEmail(e.target.value); setGuardianSaved(false); }}
                    placeholder="name@example.com"
                    style={{ ...FIELD_INPUT_STYLE, fontSize: 15 }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                {guardianEmailError && (
                  <span className="hl-mono" style={{ width: '100%', fontSize: 10, color: 'var(--warm)', letterSpacing: '0.12em' }}>{guardianEmailError}</span>
                )}
                <button
                  type="button"
                  className="hl-monoaction"
                  style={{ color: guardianEmail ? 'var(--warm)' : 'var(--bone-faint)', cursor: guardianEmail ? 'pointer' : 'default', opacity: saveGuardian.isPending ? 0.5 : 1 }}
                  onClick={() => {
                    if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
                      setGuardianEmailError('enter a valid email address');
                      return;
                    }
                    setGuardianEmailError(null);
                    saveGuardian.mutate();
                  }}
                  disabled={!guardianEmail || saveGuardian.isPending}
                >
                  {saveGuardian.isPending ? 'saving…' : 'designate guardian →'}
                </button>
                <button type="button" className="hl-monoaction hl-monoaction--quiet" onClick={() => setGuardianOpen(false)}>
                  close
                </button>
                {guardianSaved && (
                  <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.12em' }}>saved</span>
                )}
              </div>
              <p className="hl-serif" style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--bone-faint)', margin: '10px 0 0', lineHeight: 1.5, maxWidth: '52ch' }}>
                They receive a notification if your account goes 6+ months inactive. No access to your entries — only authority to ensure delivery.
              </p>
            </div>
          )}

          {/* ════════ PRIVACY ════════ */}
          <SectionLabel>Privacy</SectionLabel>

          {/* Dead-man's switch — status row with check-in/configure actions */}
          <div className="hl-ledgerrow" style={{ alignItems: 'flex-start' }}>
            <span className="hl-ledgerrow-label">
              Dead-man's switch
              <span className="hl-ledgerrow-hint">warns at 7 days · triggers at 14 · thread passes to steward</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <span className="hl-ledgerrow-value">
                {dmStatus.status === 'active' ? (
                  <>ARMED · DUE <span style={{ color: 'var(--warm)' }}>{dmStatus.nextCheckInDue ? new Date(dmStatus.nextCheckInDue).toLocaleDateString() : '—'}</span></>
                ) : dmStatus.status === 'warning' ? (
                  <span style={{ color: 'var(--warm)' }}>OVERDUE — CHECK IN</span>
                ) : deadmanStatus.isLoading ? (
                  <span style={{ color: 'var(--bone-faint)' }}>LOADING…</span>
                ) : (
                  'NOT CONFIGURED'
                )}
              </span>
              <span style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {(dmStatus.status === 'active' || dmStatus.status === 'warning') && (
                  <button type="button" className="hl-wordaction hl-wordaction--warm" onClick={() => checkIn.mutate()} disabled={checkIn.isPending}>
                    {checkIn.isPending ? 'Checking in…' : 'Check In'}
                  </button>
                )}
                <Link to="/threads" className="hl-wordaction">Configure</Link>
                {checkInError && (
                  <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.12em' }}>{checkInError}</span>
                )}
              </span>
            </span>
          </div>

          <LedgerRow label="Key escrow" hint="shamir-split · zero-knowledge to platform" value={<span className="hl-wordvalue" style={{ fontStyle: 'italic' }}>Enabled · 2 of 3</span>} />
          <LedgerRow label="Recovery phrase" hint="print and store offline" value={<span className="hl-wordvalue" style={{ fontStyle: 'italic' }}>Four words · in onboarding</span>} />

          {/* Data Export — ledger row with download action + error */}
          <div className="hl-ledgerrow" style={{ alignItems: 'flex-start' }}>
            <span className="hl-ledgerrow-label">
              Data Export
              <span className="hl-ledgerrow-hint">full JSON archive of all your memories, letters, and voice</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <button type="button" className="hl-wordaction hl-wordaction--warm" onClick={handleExport} disabled={exportLoading}>
                {exportLoading ? 'Preparing…' : 'Request'}
              </button>
              {exportError && (
                <span className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.12em' }}>{exportError}</span>
              )}
            </span>
          </div>

          {/* ════════ BILLING ════════ */}
          <SectionLabel>Billing</SectionLabel>

          <LedgerRow
            label="Subscription"
            hint="plan, payment, and invoices"
            value={<Link to="/billing" className="hl-wordaction hl-wordaction--warm">Manage</Link>}
          />

          {/* ════════ SUPPORT ════════ */}
          <SectionLabel>Support</SectionLabel>

          <LedgerRow
            label="Write to us"
            hint="we respond within two business days"
            value={<a href="mailto:support@heirloom.blue" className="hl-wordaction hl-wordaction--warm" style={{ letterSpacing: 0 }}>support@heirloom.blue</a>}
          />

          {/* ════════ DANGER ════════ */}
          <SectionLabel>Danger</SectionLabel>

          <div style={{ padding: '14px 0', borderBottom: '1px solid var(--rule)' }}>
            {deleteStage === 'idle' && (
              <div className="hl-ledgerrow" style={{ padding: 0, border: 0 }}>
                <span className="hl-ledgerrow-label">
                  Close account
                  <span className="hl-ledgerrow-hint">90-day archive window before permanent erasure</span>
                </span>
                <button type="button" className="hl-wordaction hl-wordaction--warm" onClick={() => setDeleteStage('confirm')}>
                  Close
                </button>
              </div>
            )}

            {deleteStage === 'confirm' && (
              <div style={{ maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--bone-dim)', marginBottom: 14 }}>close account</div>
                <p className="hl-serif" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--bone-dim)', margin: '0 0 24px' }}>
                  Your thread will be archived for 90 days. During that window you can download a full export of everything you have ever written. After 90 days it is permanently erased.
                </p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setDeleteStage('quote')}
                    style={{ background: 'transparent', border: '1px solid var(--warm)', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer' }}>
                    continue →
                  </button>
                  <button type="button" className="hl-monoaction hl-monoaction--quiet" onClick={() => setDeleteStage('idle')}>
                    cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStage === 'quote' && (
              <div style={{ maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--bone-dim)', marginBottom: 14 }}>export fee</div>
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
                    style={{ background: 'transparent', border: '1px solid var(--warm)', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer' }}>
                    archive my account →
                  </button>
                  <button type="button" className="hl-monoaction hl-monoaction--quiet" onClick={() => setDeleteStage('idle')}>
                    cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStage === 'password' && (
              <div style={{ maxWidth: 480 }}>
                <div className="hl-eyebrow" style={{ color: 'var(--bone-dim)', marginBottom: 14 }}>confirm password</div>
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
                  style={{ ...FIELD_INPUT_STYLE, fontSize: 15, padding: '6px 0 8px', boxSizing: 'border-box', marginBottom: 8 }}
                />
                {deleteError && (
                  <p className="hl-mono" style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 14px' }}>{deleteError}</p>
                )}
                <div style={{ display: 'flex', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => archiveMutation.mutate()} disabled={!deletePassword || archiveMutation.isPending}
                    style={{ background: 'transparent', border: '1px solid var(--warm)', color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 18px', cursor: 'pointer', opacity: (!deletePassword || archiveMutation.isPending) ? 0.5 : 1 }}>
                    {archiveMutation.isPending ? 'archiving…' : 'archive account'}
                  </button>
                  <button type="button" className="hl-monoaction hl-monoaction--quiet" onClick={() => { setDeleteStage('idle'); setDeletePassword(''); setDeleteError(null); }}>
                    cancel
                  </button>
                </div>
              </div>
            )}

            {deleteStage === 'archived' && (
              <div style={{ maxWidth: 480 }}>
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
                <button type="button" className="hl-monoaction hl-monoaction--quiet" style={{ marginTop: 8 }}
                  onClick={() => { logout(); navigate('/', { replace: true }); }}>
                  sign out
                </button>
              </div>
            )}
          </div>

          {/* ── Sign out ─────────────────────────────────── */}
          <button
            type="button"
            className="hl-signout"
            onClick={() => { void logout().then(() => navigate('/', { replace: true })); }}
          >
            Sign out
          </button>

          <div style={{ textAlign: 'center' }}>
            <WaxSeal size={28} />
          </div>

        </div>
    </ClothShell>
  );
}
