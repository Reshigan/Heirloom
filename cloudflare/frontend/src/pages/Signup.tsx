import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { VaultModal } from '../components/VaultModal';
import { threadsApi } from '../services/api';

// Signup — Loom 3 single calm centered column (matches cosmic-signin mockup,
// adapted for CREATE ACCOUNT). Underlined fields, mono micro-labels, one warm
// primary action, quiet "sign in" link. All data/auth/validation logic preserved.
// step one · the thread's name · step two · you · step three · how to begin

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

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

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
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 'clamp(40px,8vh,96px) clamp(20px,6vw,40px) 80px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
        {/* Wordmark — infinity mark over serif name */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px,7vh,72px)' }}>
          <div
            aria-hidden
            className="hl-serif"
            style={{
              fontSize: 26,
              color: 'var(--bone)',
              lineHeight: 1,
              marginBottom: 18,
              fontWeight: 300,
            }}
          >
            ∞
          </div>
          <h1
            className="hl-serif"
            style={{
              fontSize: 'clamp(34px,8vw,44px)',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              margin: 0,
              color: 'var(--bone)',
              fontVariationSettings: '"opsz" 40',
            }}
          >
            Heirloom
          </h1>
          <div
            className="hl-mono"
            style={{
              marginTop: 22,
              fontSize: 10,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
            }}
          >
            begin a thread
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* step one · the thread's name */}
          <StepEyebrow>step one · the thread's name</StepEyebrow>
          <Field
            label="what does your family call itself?"
            id="s-thread"
            value={form.threadName}
            onChange={(v) => set({ threadName: v })}
            placeholder="The Vance-Okonkwo Thread"
            error={errors.threadName}
          />
          <Helper>It can be changed later. The thread takes your name unless you give it its own.</Helper>

          {/* step two · you */}
          <div style={{ marginTop: 44 }}>
            <StepEyebrow>step two · you</StepEyebrow>
            <Row>
              <Field
                label="your name"
                id="s-first"
                value={form.firstName}
                onChange={(v) => set({ firstName: v })}
                autoComplete="given-name"
                error={errors.firstName}
              />
              <Field
                label="last name"
                id="s-last"
                value={form.lastName}
                onChange={(v) => set({ lastName: v })}
                autoComplete="family-name"
                error={errors.lastName}
              />
            </Row>
            <div style={{ marginTop: 28 }}>
              <Field
                label="year you were born"
                id="s-birth"
                value={form.birthYear}
                onChange={(v) => set({ birthYear: v })}
                placeholder="1978"
                inputMode="numeric"
                maxLength={4}
                error={errors.birthYear}
              />
            </div>
            <div style={{ marginTop: 28 }}>
              <Field
                label="email"
                id="s-email"
                type="email"
                value={form.email}
                onChange={(v) => set({ email: v })}
                autoComplete="email"
                error={errors.email}
              />
            </div>
            <Row style={{ marginTop: 28 }}>
              <Field
                label="password"
                id="s-pw"
                type="password"
                value={form.password}
                onChange={(v) => set({ password: v })}
                autoComplete="new-password"
                error={errors.password}
              />
              <Field
                label="confirm"
                id="s-pw2"
                type="password"
                value={form.confirmPassword}
                onChange={(v) => set({ confirmPassword: v })}
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
            </Row>
          </div>

          {/* step three · how to begin */}
          <div style={{ marginTop: 44 }}>
            <StepEyebrow>step three · how to begin</StepEyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
              <CycleTab active={cycle !== 'annual'} warm={false} onClick={() => setCycle('monthly')}>
                monthly
              </CycleTab>
              <CycleTab active={cycle === 'annual'} warm onClick={() => setCycle('annual')}>
                annually · 2 months free
              </CycleTab>
            </div>
            <div
              role="radiogroup"
              aria-label="how to begin"
              style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--rule)' }}
            >
              {TIERS.map((t) => {
                const selected = tier === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    role="radio"
                    aria-checked={selected}
                    style={{
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '18px 0',
                      background: 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--rule)',
                      borderLeft: selected ? '2px solid var(--warm)' : '2px solid transparent',
                      paddingLeft: 14,
                      transition: `border-color 180ms ${EASE}`,
                      color: 'var(--bone)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.3em',
                          textTransform: 'uppercase',
                          color: selected ? 'var(--warm)' : 'var(--bone-faint)',
                          transition: `color 180ms ${EASE}`,
                        }}
                      >
                        {t.name}
                        {selected ? ' · chosen' : ''}
                      </div>
                      <div
                        className="hl-serif"
                        style={{
                          fontSize: 13.5,
                          lineHeight: 1.5,
                          color: 'var(--bone-dim)',
                          marginTop: 7,
                          fontWeight: 400,
                        }}
                      >
                        {t.body}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        className="hl-serif"
                        style={{ fontSize: 26, fontWeight: 300, letterSpacing: '-0.018em', lineHeight: 1, color: 'var(--bone)' }}
                      >
                        {t.id === 'family' && cycle === 'annual' ? '$99' : t.price}
                      </div>
                      <div
                        className="hl-mono"
                        style={{
                          fontSize: 9,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: 'var(--bone-faint)',
                          marginTop: 6,
                        }}
                      >
                        {t.id === 'family' && cycle === 'annual' ? '/ year · 2 mo free' : t.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* terms */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginTop: 32 }}>
            <input
              type="checkbox"
              checked={form.acceptedTerms}
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
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(e) => set({ marketingConsent: e.target.checked })}
              style={{ accentColor: 'var(--warm)', marginTop: 4 }}
            />
            <span className="hl-serif" style={{ fontSize: 13, color: 'var(--bone-dim)', lineHeight: 1.6, fontWeight: 400 }}>
              I'm happy to receive occasional updates and prompts from Heirloom (optional).
            </span>
          </label>

          {errors.submit ? <FieldError>{errors.submit}</FieldError> : null}
          {threadError && (
            <p
              className="hl-mono"
              style={{ fontSize: 11, color: 'var(--bone-dim)', letterSpacing: '0.16em', margin: '16px 0 0', textTransform: 'uppercase' }}
            >
              {threadError}
            </p>
          )}

          {/* warm primary action — full-width, mirrors CONTINUE in mockup */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 36,
              width: '100%',
              cursor: isLoading ? 'default' : 'pointer',
              background: 'var(--warm)',
              border: 0,
              color: 'var(--ink)',
              padding: '16px 24px',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              opacity: isLoading ? 0.5 : 1,
              transition: `opacity 180ms ${EASE}, background 180ms ${EASE}`,
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = 'var(--warm-bright)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--warm)'; }}
          >
            {isLoading
              ? 'beginning…'
              : tier === 'family'
                ? 'continue · 30-day trial of family'
                : 'begin your thread'}
          </button>
          <p
            className="hl-italic"
            style={{ textAlign: 'center', fontSize: 13, color: 'var(--bone-faint)', marginTop: 16, fontWeight: 400 }}
          >
            no card on file · switches to free if not upgraded
          </p>
        </form>

        {/* quiet secondary link — "sign in" in place of "create a thread" */}
        <div style={{ textAlign: 'center', marginTop: 'clamp(40px,7vh,64px)' }}>
          <Link
            to="/login"
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--rule-strong)',
              paddingBottom: 4,
            }}
          >
            sign in
          </Link>
        </div>

        <div
          className="hl-mono"
          style={{
            marginTop: 40,
            textAlign: 'center',
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          ∞ &nbsp; encrypted in browser · key escrow · 2 of 3 contacts
        </div>
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
    </div>
  );
}

function StepEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="hl-mono"
      style={{
        fontSize: 10,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--bone-faint)',
        marginBottom: 22,
      }}
    >
      {children}
    </div>
  );
}

function Row({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
        gap: 28,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="hl-italic"
      style={{ fontSize: 13, color: 'var(--bone-faint)', marginTop: 12, lineHeight: 1.55, fontWeight: 400 }}
    >
      {children}
    </p>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="hl-italic" style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--danger)' }}>
      {children}
    </p>
  );
}

function CycleTab({
  active,
  warm,
  onClick,
  children,
}: {
  active: boolean;
  warm: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        padding: '4px 0',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: active ? 'var(--bone)' : 'var(--bone-faint)',
        borderBottom: active ? `1px solid ${warm ? 'var(--warm)' : 'var(--bone)'}` : '1px solid transparent',
        transition: `color 180ms ${EASE}`,
      }}
    >
      {children}
    </button>
  );
}

// Underlined field with mono micro-label — the mockup's core field idiom.
function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  error,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'numeric';
  maxLength?: number;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="hl-mono"
        style={{
          display: 'block',
          fontSize: 9,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          marginBottom: 10,
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 0,
          borderBottom: `1px solid ${error ? 'var(--danger)' : 'var(--rule-strong)'}`,
          padding: '8px 0',
          color: 'var(--bone)',
          fontFamily: 'var(--serif)',
          fontSize: 17,
          outline: 'none',
          borderRadius: 0,
          transition: `border-color 180ms ${EASE}`,
        }}
        onFocus={(e) => { if (!error) e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
        onBlur={(e) => { if (!error) e.currentTarget.style.borderBottomColor = 'var(--rule-strong)'; }}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
