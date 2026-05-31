import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { VaultModal } from '../components/VaultModal';
import { threadsApi } from '../services/api';

/**
 * Signup — Loom-native three-step inline flow (artboard: heirloom-auth.jsx).
 *
 * step one · the thread's name   — what the family calls itself
 * step two · you                 — name + birth year + email + passphrase
 * step three · how to begin      — Free / Family / Founder (Family pre-selected)
 *
 * The working signup is preserved: register() still receives
 * (email, password, firstName, lastName, consent). The thread name, birth
 * year, and chosen tier are *additional captured state*; since the auth API
 * does not yet take them, they are stashed (sessionStorage SIGNUP_INTENT_KEY)
 * so the coordinator can wire them to family-creation / billing after signup.
 * No charge happens here — the tier is carried, not billed.
 */

export const SIGNUP_INTENT_KEY = 'heirloom_signup_intent';

type Tier = 'free' | 'family' | 'founder';

interface SignupIntent {
  threadName: string;
  birthYear: string;
  tier: Tier;
}

const TIERS: {
  id: Tier;
  name: string;
  price: string;
  sub: string;
  body: string;
}[] = [
  { id: 'free', name: 'Free', price: 'free', sub: 'forever', body: '1 thread · 30 entries / yr · read everything' },
  { id: 'family', name: 'Family', price: '$15', sub: 'per month', body: 'unlimited · all members · voice · sealed notes' },
  { id: 'founder', name: 'Founder', price: '$999', sub: 'once · lifetime', body: 'family forever · name in continuity record' },
];

export function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuthStore();
  const redirectUrl = searchParams.get('redirect');

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVaultSetup, setShowVaultSetup] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const e: Record<string, string> = {};
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
      // Carry the thread name + birth year + chosen tier through to the
      // post-signup steps (family-creation / billing) without charging here.
      const intent: SignupIntent = {
        threadName: form.threadName.trim(),
        birthYear: form.birthYear.trim(),
        tier,
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
      // Honor the "name your thread" step. The backend lazy-bootstraps a
      // generically named default thread on first /me; claim the chosen name
      // now while none exists yet (duplicate-safe — getOrCreateDefaultThread
      // adopts the oldest FOUNDER thread, which will be this one).
      if (intent.threadName) {
        try {
          const { threads } = (await threadsApi.list()).data;
          if (threads.length === 0) await threadsApi.create({ name: intent.threadName });
        } catch {
          /* non-fatal — the default thread still bootstraps on /me */
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
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: '68px 1fr' }}>
      <header
        style={{
          borderBottom: '1px solid var(--loom-rule)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" className="loom-mark" style={{ textDecoration: 'none' }}>
          <span className="infmark">∞</span>heirloom
        </Link>
        <Link
          to="/login"
          className="loom-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-dim)',
            textDecoration: 'none',
          }}
        >
          have an account? sign in
        </Link>
      </header>

      <main style={{ padding: '52px 40px 100px', overflow: 'auto' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div className="loom-eyebrow" style={{ marginBottom: 18 }}>
            begin · this takes about 90 seconds
          </div>
          <h1
            className="loom-h2"
            style={{
              fontSize: 'clamp(36px, 5vw, 52px)',
              fontWeight: 300,
              lineHeight: 1.06,
              letterSpacing: '-0.022em',
              margin: 0,
              maxWidth: '18ch',
            }}
          >
            Name your thread. Name{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--loom-warm)' }}>yourself.</span>
          </h1>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
                gap: 48,
                marginTop: 48,
              }}
            >
              {/* step one · the thread's name */}
              <section>
                <StepEyebrow>step one · the thread's name</StepEyebrow>
                <FieldLabel htmlFor="s-thread">what does your family call itself?</FieldLabel>
                <Input
                  id="s-thread"
                  value={form.threadName}
                  onChange={(v) => set({ threadName: v })}
                  placeholder="The Vance-Okonkwo Thread"
                  serif
                />
                {errors.threadName ? <FieldError>{errors.threadName}</FieldError> : null}
                <Helper>
                  Hyphenate, combine, invent. It can be changed later. The thread takes your name
                  unless you give it its own.
                </Helper>
              </section>

              {/* step two · you */}
              <section>
                <StepEyebrow>step two · you</StepEyebrow>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <FieldLabel htmlFor="s-first">first name</FieldLabel>
                    <Input
                      id="s-first"
                      value={form.firstName}
                      onChange={(v) => set({ firstName: v })}
                      autoComplete="given-name"
                    />
                    {errors.firstName ? <FieldError>{errors.firstName}</FieldError> : null}
                  </div>
                  <div>
                    <FieldLabel htmlFor="s-last">last name</FieldLabel>
                    <Input
                      id="s-last"
                      value={form.lastName}
                      onChange={(v) => set({ lastName: v })}
                      autoComplete="family-name"
                    />
                    {errors.lastName ? <FieldError>{errors.lastName}</FieldError> : null}
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <FieldLabel htmlFor="s-birth">year you were born</FieldLabel>
                  <Input
                    id="s-birth"
                    value={form.birthYear}
                    onChange={(v) => set({ birthYear: v })}
                    placeholder="1978"
                    inputMode="numeric"
                    maxLength={4}
                  />
                  {errors.birthYear ? <FieldError>{errors.birthYear}</FieldError> : null}
                </div>

                <div style={{ marginTop: 20 }}>
                  <FieldLabel htmlFor="s-email">email</FieldLabel>
                  <Input
                    id="s-email"
                    type="email"
                    value={form.email}
                    onChange={(v) => set({ email: v })}
                    autoComplete="email"
                  />
                  {errors.email ? <FieldError>{errors.email}</FieldError> : null}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                  <div>
                    <FieldLabel htmlFor="s-pw">password</FieldLabel>
                    <Input
                      id="s-pw"
                      type="password"
                      value={form.password}
                      onChange={(v) => set({ password: v })}
                      autoComplete="new-password"
                    />
                    {errors.password ? <FieldError>{errors.password}</FieldError> : null}
                  </div>
                  <div>
                    <FieldLabel htmlFor="s-pw2">confirm</FieldLabel>
                    <Input
                      id="s-pw2"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(v) => set({ confirmPassword: v })}
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword ? <FieldError>{errors.confirmPassword}</FieldError> : null}
                  </div>
                </div>
              </section>
            </div>

            {/* step three · how to begin (tier) */}
            <div style={{ marginTop: 56 }}>
              <StepEyebrow>step three · how to begin</StepEyebrow>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                  borderTop: '1px solid var(--loom-rule)',
                  borderBottom: '1px solid var(--loom-rule)',
                }}
              >
                {TIERS.map((t, i) => {
                  const selected = tier === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setTier(t.id)}
                      aria-pressed={selected}
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        padding: '24px 24px 22px',
                        borderRight: i < TIERS.length - 1 ? '1px solid var(--loom-rule)' : 0,
                        borderTop: 0,
                        borderBottom: 0,
                        borderLeft: 0,
                        background: selected ? 'var(--loom-ink-card)' : 'transparent',
                        boxShadow: selected ? 'inset 0 2px 0 var(--loom-warm)' : 'none',
                        color: 'var(--loom-bone)',
                        transition: 'background var(--loom-dur-fast) var(--loom-ease)',
                      }}
                    >
                      <div
                        className="loom-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.32em',
                          textTransform: 'uppercase',
                          color: 'var(--loom-bone-faint)',
                        }}
                      >
                        {t.name}
                        {selected ? <span style={{ color: 'var(--loom-warm)' }}> · chosen</span> : null}
                      </div>
                      <div
                        className="loom-serif"
                        style={{ fontSize: 34, fontWeight: 300, marginTop: 12, letterSpacing: '-0.018em', lineHeight: 1 }}
                      >
                        {t.price}
                      </div>
                      <div
                        className="loom-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--loom-bone-faint)',
                          marginTop: 6,
                        }}
                      >
                        {t.sub}
                      </div>
                      <div
                        className="loom-body"
                        style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--loom-bone-dim)', marginTop: 12 }}
                      >
                        {t.body}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* terms */}
            <label
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginTop: 28 }}
            >
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={(e) => set({ acceptedTerms: e.target.checked })}
                style={{ accentColor: 'var(--loom-warm)', marginTop: 4 }}
              />
              <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', lineHeight: 1.6 }}>
                I accept the{' '}
                <Link to="/terms" style={{ color: 'var(--loom-warm)' }}>
                  terms
                </Link>{' '}
                and the{' '}
                <Link to="/privacy" style={{ color: 'var(--loom-warm)' }}>
                  privacy notice
                </Link>
                .
              </span>
            </label>
            {errors.acceptedTerms ? <FieldError>{errors.acceptedTerms}</FieldError> : null}
            {errors.submit ? <FieldError>{errors.submit}</FieldError> : null}

            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <button type="submit" disabled={isLoading} className="loom-btn" style={{ opacity: isLoading ? 0.5 : 1 }}>
                {isLoading
                  ? 'beginning…'
                  : tier === 'family'
                    ? 'Begin · 14-day trial of Family'
                    : 'begin your thread →'}
              </button>
              <span className="loom-body" style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                no card on file · switches to free if not upgraded
              </span>
            </div>
          </form>

          <div
            className="loom-mono"
            style={{
              marginTop: 48,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
            }}
          >
            ∞ &nbsp; encrypted in browser · key escrow · 2 of 3 contacts
          </div>
        </div>
      </main>

      {showVaultSetup ? (
        <VaultModal
          isOpen={showVaultSetup}
          mode="setup"
          onComplete={() => {
            setShowVaultSetup(false);
            navigate(redirectUrl || '/dashboard');
          }}
          onSkip={() => {
            setShowVaultSetup(false);
            navigate(redirectUrl || '/dashboard');
          }}
        />
      ) : null}
    </div>
  );
}

function StepEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="loom-mono"
      style={{
        fontSize: 10,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 22,
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="loom-mono"
      style={{
        display: 'block',
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--loom-bone-faint)',
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="loom-body"
      style={{ fontStyle: 'italic', fontSize: 13.5, color: 'var(--loom-bone-faint)', marginTop: 12, lineHeight: 1.55, maxWidth: '46ch' }}
    >
      {children}
    </p>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="loom-body" style={{ margin: '8px 0 0', fontSize: 13, fontStyle: 'italic', color: 'var(--loom-warm)' }}>
      {children}
    </p>
  );
}

function Input({
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  serif,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'numeric';
  maxLength?: number;
  serif?: boolean;
}) {
  return (
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
        background: 'var(--loom-ink)',
        border: '1px solid var(--loom-rule)',
        borderRadius: 2,
        color: 'var(--loom-bone)',
        padding: '11px 14px',
        fontFamily: serif ? "'Source Serif 4', serif" : "'Inter', sans-serif",
        fontSize: serif ? 19 : 16,
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  );
}
