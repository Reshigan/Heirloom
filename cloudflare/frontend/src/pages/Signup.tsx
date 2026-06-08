import { useState, lazy, Suspense } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { VaultModal } from '../components/VaultModal';
import { threadsApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { ClothShell } from '../loom/components/ClothShell';

const ClothCanvas3D = lazy(() =>
  import('../loom/components/ClothCanvas3D').then(m => ({ default: m.ClothCanvas3D }))
);

// Signup — Loom 3 three-step inline parchment flow (heirloom-auth.jsx §Signup).
// step one · the thread's name   — what the family calls itself
// step two · you                 — name + birth year + email + passphrase
// step three · how to begin      — Free / Family / Founder (Family pre-selected)

export const SIGNUP_INTENT_KEY = 'heirloom_signup_intent';

type Tier = 'free' | 'family' | 'founder';

interface SignupErrors {
  threadName?: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptedTerms?: string;
  submit?: string;
}

interface SignupIntent {
  threadName: string;
  birthYear: string;
  tier: Tier;
  cycle: 'monthly' | 'annual';
}

const TIERS: {
  id: Tier;
  name: string;
  price: string;
  sub: string;
  body: string;
}[] = [
  { id: 'free', name: 'Free', price: 'free', sub: 'forever', body: '1 thread · 30 entries / yr · read everything' },
  { id: 'family', name: 'Family', price: '$6.99', sub: '/ month', body: 'unlimited · all members · voice · sealed notes' },
  { id: 'founder', name: 'Founder', price: '$249', sub: 'once · lifetime', body: 'family forever · name in continuity record' },
];

export function Signup() {
  usePageMeta('Start your thread', "Begin your family's thousand-year thread. Free to start.");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, updateUser } = useAuthStore();
  const redirectUrl = searchParams.get('redirect');
  const [cycle, setCycle] = useState<'monthly' | 'annual'>(() =>
    searchParams.get('cycle') === 'annual' ? 'annual' : 'monthly'
  );

  const [form, setForm] = useState({
    threadName: '',
    firstName: '',
    lastName: '',
    birthYear: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
    marketingConsent: false,
  });
  const [tier, setTier] = useState<Tier>('family');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showVaultSetup, setShowVaultSetup] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const e: SignupErrors = {};
    if (!form.threadName.trim()) e.threadName = 'Give your thread a name';
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (form.birthYear.trim()) {
      const y = Number(form.birthYear);
      if (!/^\d{4}$/.test(form.birthYear) || y < 1900 || y > new Date().getFullYear())
        e.birthYear = 'Enter a four-digit year';
    }
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.acceptedTerms) e.acceptedTerms = 'You must accept the Terms of Service';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const intent: SignupIntent = {
        threadName: form.threadName.trim(),
        birthYear: form.birthYear.trim(),
        tier,
        cycle,
      };
      try {
        sessionStorage.setItem(SIGNUP_INTENT_KEY, JSON.stringify(intent));
      } catch {
        /* sessionStorage may be unavailable — signup still proceeds */
      }

      await register(form.email, form.password, form.firstName, form.lastName, {
        acceptedTerms: form.acceptedTerms,
        acceptedTermsAt: new Date().toISOString(),
        marketingConsent: form.marketingConsent,
        marketingConsentAt: form.marketingConsent ? new Date().toISOString() : null,
      });
      if (intent.threadName) {
        try {
          const { threads } = (await threadsApi.list()).data;
          // Persist the default thread id so Today / Reading Room / Constellation
          // can fetch this user's entries immediately after signup (without it,
          // those thread-keyed views render empty until the next /me refresh).
          const threadId = threads.length === 0
            ? (await threadsApi.create({ name: intent.threadName })).data.thread.id
            : threads[0].id;
          if (threadId) updateUser({ defaultThreadId: threadId });
        } catch {
          setThreadError('Account created — thread setup will complete on first login.');
        }
      }
      setShowVaultSetup(true);
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Failed to create account' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClothShell
      topbarLeft={<HLogo />}
      topbarCenter="begin a thread"
      topbarRight={
        <Link to="/login" style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-faint)', textDecoration: 'none' }}>
          sign in →
        </Link>
      }
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
        minHeight: '100%',
      }}>
      <main style={{ padding: 'clamp(24px,5vw,48px)', overflow: 'auto' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div className="hl-eyebrow dark" style={{ marginBottom: 18 }}>
            begin · this takes about 90 seconds
          </div>
          <h1 className="hl-serif hl-tight" style={{
            fontSize: 'clamp(40px, 5.5vw, 60px)',
            fontWeight: 300, lineHeight: 1.06, letterSpacing: '-0.022em',
            margin: 0, maxWidth: '16ch',
            color: 'var(--bone)',
            fontVariationSettings: '"opsz" 40',
          }}>
            Name your thread.{' '}
            <span className="hl-italic" style={{ color: 'var(--warm)' }}>Name yourself.</span>
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: 56, marginTop: 56,
            }}>
              {/* step one */}
              <section>
                <StepEyebrow>step one · the thread's name</StepEyebrow>
                <FieldLabel htmlFor="s-thread">what does your family call itself?</FieldLabel>
                <PInput
                  id="s-thread" value={form.threadName}
                  onChange={(v) => set({ threadName: v })}
                  placeholder="The Vance-Okonkwo Thread" serif
                />
                {errors.threadName ? <FieldError>{errors.threadName}</FieldError> : null}
                <Helper>
                  Hyphenate, combine, invent. It can be changed later. The thread takes your name
                  unless you give it its own.
                </Helper>
              </section>

              {/* step two */}
              <section>
                <StepEyebrow>step two · you</StepEyebrow>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 24 }}>
                  <div>
                    <FieldLabel htmlFor="s-first">your name</FieldLabel>
                    <PInput id="s-first" value={form.firstName} onChange={(v) => set({ firstName: v })} autoComplete="given-name" />
                    {errors.firstName ? <FieldError>{errors.firstName}</FieldError> : null}
                  </div>
                  <div>
                    <FieldLabel htmlFor="s-birth">year you were born</FieldLabel>
                    <PInput id="s-birth" value={form.birthYear} onChange={(v) => set({ birthYear: v })} placeholder="1978" inputMode="numeric" maxLength={4} />
                    {errors.birthYear ? <FieldError>{errors.birthYear}</FieldError> : null}
                  </div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <FieldLabel htmlFor="s-last">last name</FieldLabel>
                  <PInput id="s-last" value={form.lastName} onChange={(v) => set({ lastName: v })} autoComplete="family-name" />
                  {errors.lastName ? <FieldError>{errors.lastName}</FieldError> : null}
                </div>
                <div style={{ marginTop: 24 }}>
                  <FieldLabel htmlFor="s-email">email</FieldLabel>
                  <PInput id="s-email" type="email" value={form.email} onChange={(v) => set({ email: v })} autoComplete="email" />
                  {errors.email ? <FieldError>{errors.email}</FieldError> : null}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 20, marginTop: 20 }}>
                  <div>
                    <FieldLabel htmlFor="s-pw">password</FieldLabel>
                    <PInput id="s-pw" type="password" value={form.password} onChange={(v) => set({ password: v })} autoComplete="new-password" />
                    {errors.password ? <FieldError>{errors.password}</FieldError> : null}
                  </div>
                  <div>
                    <FieldLabel htmlFor="s-pw2">confirm</FieldLabel>
                    <PInput id="s-pw2" type="password" value={form.confirmPassword} onChange={(v) => set({ confirmPassword: v })} autoComplete="new-password" />
                    {errors.confirmPassword ? <FieldError>{errors.confirmPassword}</FieldError> : null}
                  </div>
                </div>
              </section>
            </div>

            {/* step three — tier */}
            <div style={{ marginTop: 64, maxWidth: 980 }}>
              <StepEyebrow>step three · how to begin</StepEyebrow>
              {/* billing cycle toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setCycle('monthly')}
                  style={{
                    background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 0',
                    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: cycle !== 'annual' ? 'var(--bone)' : 'var(--bone-faint)',
                    borderBottom: cycle !== 'annual' ? '1px solid var(--bone)' : '1px solid transparent',
                  }}
                >
                  monthly
                </button>
                <button
                  type="button"
                  onClick={() => setCycle('annual')}
                  style={{
                    background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 0',
                    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: cycle === 'annual' ? 'var(--bone)' : 'var(--bone-faint)',
                    borderBottom: cycle === 'annual' ? '1px solid var(--warm)' : '1px solid transparent',
                  }}
                >
                  annually · 2 months free
                </button>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                borderTop: '1px solid var(--rule)',
                borderBottom: '1px solid var(--rule)',
              }}>
                {TIERS.map((t, i) => {
                  const selected = tier === t.id;
                  return (
                    <button
                      type="button" key={t.id}
                      onClick={() => setTier(t.id)}
                      aria-pressed={selected}
                      style={{
                        textAlign: 'left', cursor: 'pointer',
                        padding: '24px 24px 22px',
                        borderRight: i < TIERS.length - 1 ? '1px solid var(--rule)' : 0,
                        borderTop: 0, borderBottom: 0, borderLeft: 0,
                        background: selected ? 'var(--ink)' : 'transparent',
                        color: selected ? 'var(--bone)' : 'var(--bone)',
                        transition: 'background 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      <div className="hl-mono" style={{
                        fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
                        color: selected ? 'var(--bone-faint)' : 'var(--bone-faint)',
                      }}>
                        {t.name}
                        {selected && <span style={{ color: 'var(--warm)' }}> · chosen</span>}
                      </div>
                      <div className="hl-serif" style={{
                        fontSize: 36, fontWeight: 300, marginTop: 12,
                        letterSpacing: '-0.018em', lineHeight: 1,
                      }}>
                        {t.id === 'family' && cycle === 'annual' ? '$99' : t.price}
                      </div>
                      <div className="hl-mono" style={{
                        fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: selected ? 'var(--bone-faint)' : 'var(--bone-faint)', marginTop: 6,
                      }}>
                        {t.id === 'family' && cycle === 'annual' ? '/ year · 2 months free' : t.sub}
                      </div>
                      <div className="hl-serif" style={{
                        fontSize: 13.5, lineHeight: 1.55,
                        color: selected ? 'var(--bone-dim)' : 'var(--bone-dim)',
                        marginTop: 12, fontWeight: 400,
                      }}>
                        {t.body}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginTop: 28 }}>
              <input
                type="checkbox" checked={form.acceptedTerms}
                onChange={(e) => set({ acceptedTerms: e.target.checked })}
                style={{ accentColor: 'var(--warm)', marginTop: 4 }}
              />
              <span className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', lineHeight: 1.6, fontWeight: 400 }}>
                I accept the{' '}
                <Link to="/terms" style={{ color: 'var(--warm)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>terms</Link>
                {' '}and the{' '}
                <Link to="/privacy" style={{ color: 'var(--warm)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>privacy notice</Link>.
              </span>
            </label>
            {errors.acceptedTerms ? <FieldError>{errors.acceptedTerms}</FieldError> : null}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginTop: 14 }}>
              <input
                type="checkbox" checked={form.marketingConsent}
                onChange={(e) => set({ marketingConsent: e.target.checked })}
                style={{ accentColor: 'var(--warm)', marginTop: 4 }}
              />
              <span className="hl-serif" style={{ fontSize: 13, color: 'var(--bone-dim)', lineHeight: 1.6, fontWeight: 400 }}>
                I'm happy to receive occasional updates and prompts from Heirloom (optional).
              </span>
            </label>

            {errors.submit ? <FieldError>{errors.submit}</FieldError> : null}
            {threadError && (
              <p className="hl-mono" style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.16em', margin: '16px 0 0', textTransform: 'uppercase' }}>
                {threadError}
              </p>
            )}

            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <button type="submit" disabled={isLoading} className="hl-btn" style={{ opacity: isLoading ? 0.5 : 1 }}>
                {isLoading
                  ? 'beginning…'
                  : tier === 'family'
                    ? 'Begin · 30-day trial of Family'
                    : 'begin your thread →'}
              </button>
              <span className="hl-italic" style={{ fontSize: 14, color: 'var(--bone-dim)', fontWeight: 400 }}>
                no card on file · switches to free if not upgraded
              </span>
            </div>
          </form>

          <div className="hl-mono" style={{
            marginTop: 48, fontSize: 10, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--bone-faint)',
          }}>
            ∞ &nbsp; encrypted in browser · key escrow · 2 of 3 contacts
          </div>
        </div>
      </main>

        {/* Right: 3D cloth canvas on ink */}
        <aside
          aria-hidden
          style={{
            background: 'var(--ink)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: 'min(360px, 40vh)',
          }}
        >
          <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: 'var(--ink)' }} />}>
            <ClothCanvas3D entries={REGISTER_3D_ENTRIES} />
          </Suspense>
          <div className="hl-mono" style={{
            position: 'absolute', left: 24, bottom: 24,
            fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--bone-faint)',
            pointerEvents: 'none',
          }}>
            specimen · 70 years · 4,318 entries
          </div>
        </aside>
      </div>

      {showVaultSetup ? (
        <VaultModal
          isOpen={showVaultSetup}
          mode="setup"
          onComplete={() => {
            setShowVaultSetup(false);
            // Fresh signup → product tour + first-entry onboarding (unless a
            // deep-link redirect was requested, which takes precedence).
            navigate(redirectUrl || '/onboarding');
          }}
          onSkip={() => {
            setShowVaultSetup(false);
            navigate(redirectUrl || '/onboarding');
          }}
        />
      ) : null}
    </ClothShell>
  );
}

function StepEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="hl-mono" style={{
      fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase',
      color: 'var(--bone-faint)', marginBottom: 22,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="hl-mono" style={{
      display: 'block', fontSize: 10,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: 'var(--bone-faint)', marginBottom: 8,
    }}>
      {children}
    </label>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <p className="hl-italic" style={{
      fontSize: 13.5, color: 'var(--bone-faint)', marginTop: 12,
      lineHeight: 1.55, fontWeight: 400, maxWidth: '46ch',
    }}>
      {children}
    </p>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="hl-italic" style={{
      margin: '8px 0 0', fontSize: 13, color: 'var(--danger)',
    }}>
      {children}
    </p>
  );
}

function PInput({
  id, value, onChange, type = 'text',
  placeholder, autoComplete, inputMode, maxLength,
}: {
  id: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; autoComplete?: string;
  inputMode?: 'numeric'; maxLength?: number; serif?: boolean;
}) {
  return (
    <input
      id={id} type={type} value={value}
      placeholder={placeholder} autoComplete={autoComplete}
      inputMode={inputMode} maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      className="hl-input"
    />
  );
}

// Pre-generated 3D cloth entries — deterministic, no Math.random()
// Offset seed differs from Login (i * 13 + 7 vs i * 17 + 1) for visual variety
const REGISTER_DYE_KEYS = ['madder','cochineal','kermes','saffron','weld','walnut','oakgall','woad','indigo','iron'] as const;
function registerHash(n: number): number {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const REGISTER_3D_ENTRIES = Array.from({ length: 80 }, (_, i) => ({
  date: new Date(1960 + Math.floor(registerHash(i * 13 + 7) * 70), 0, 1),
  dye: REGISTER_DYE_KEYS[i % REGISTER_DYE_KEYS.length] as typeof REGISTER_DYE_KEYS[number],
  locked: i % 5 === 0,
}));
