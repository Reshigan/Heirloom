import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { safeRedirect } from '../lib/safeRedirect';
import { threadsApi, billingApi } from '../services/api';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';
import { PLAN_PRICE, PLAN_STORAGE } from '../lib/plans';
import { handleRadioArrowKeys } from '../hooks/useRadioArrowKeys';
import { signupSource } from '../lib/attribution';

// Signup — FORM archetype. Underlined fields, mono micro-labels, giant serif
// headline, one warm primary CTA, WaxSeal foot. All data/auth/validation preserved.
// step one · the thread's name · step two · you · step three · how to begin

export const SIGNUP_INTENT_KEY = 'heirloom_signup_intent';

type Tier = 'free' | 'family' | 'deep';

interface SignupErrors {
  threadName?: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string;
  email?: string;
  password?: string;
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
  { id: 'free', name: 'Free', price: PLAN_PRICE.FREE.amount, sub: PLAN_PRICE.FREE.cycle, body: '1 bloodline · 50 MB · try every feature' },
  { id: 'family', name: 'Family', price: PLAN_PRICE.FAMILY.monthly, sub: PLAN_PRICE.FAMILY.perMonth, body: 'unlimited entries · up to 5 members · voice · sealed notes' },
  { id: 'deep', name: 'Deep', price: PLAN_PRICE.DEEP.monthly, sub: PLAN_PRICE.DEEP.perMonth, body: 'everything in Family · unlimited members · 250 GB · priority' },
];

import { EASE } from '../loom/motion';
import { useOpenWaterBloom } from '../loom/water/useOpenWater';

export function Signup() {
  // open water: visible drift + the memories-bloom, randomized per arrival
  useOpenWaterBloom();
  usePageMeta('Begin your family\'s Deep', "Let the first entry settle into the Deep. Free to start.");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, updateUser } = useAuthStore();
  const redirectUrl = searchParams.get('redirect');
  const [cycle, setCycle] = useState<'monthly' | 'annual'>(() =>
    searchParams.get('cycle') === 'annual' ? 'annual' : 'monthly'
  );
  // Annual-only regions (deepest-PPP markets) — the worker suppresses monthly
  // billing there. Fetch the server flag on mount and force annual so a tier4
  // visitor can never pick monthly and hit the /checkout 400.
  const [annualOnly, setAnnualOnly] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    billingApi.getPricing().then((r: any) => {
      if (controller.signal.aborted) return;
      const d = r.data ?? r;
      if (d?.isAnnualOnly) {
        setAnnualOnly(true);
        setCycle('annual');
      }
    }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (annualOnly && cycle !== 'annual') setCycle('annual');
  }, [annualOnly, cycle]);

  const [form, setForm] = useState({
    threadName: '',
    firstName: '',
    lastName: '',
    birthYear: '',
    email: '',
    password: '',
    acceptedTerms: false,
    marketingConsent: false,
  });
  const [tier, setTier] = useState<Tier>(() => {
    const t = searchParams.get('tier')?.toLowerCase();
    // Default to FREE — the free tier is the acquisition door. Paid (Family or
    // Deep) only when an explicit ?tier=family|deep CTA (e.g. Pricing) asks.
    return t === 'free' || t === 'family' || t === 'deep' ? t : 'free';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const [threadError, setThreadError] = useState<string | null>(null);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const e: SignupErrors = {};
    if (!form.threadName.trim()) e.threadName = 'Give your Deep a name';
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
        source: signupSource(),
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
          setThreadError('Account created — your Deep will finish setting up on first login.');
        }
      }
      // Server-held AES-GCM: entries are encrypted at rest with a platform-held
      // key, so signup provisions NO client passphrase vault. Route straight on.
      // Every tier runs the First Thread ceremony (/begin), which hands off into
      // the product tour + first-entry onboarding. A deep-link redirect wins.
      //
      // Honor the chosen plan: a Family-picker self-selected paid, so route them
      // to Stripe checkout (mirrors Billing.tsx). A deep-link redirect (invite,
      // etc.) still wins over checkout; if checkout can't start, fall through to
      // the ceremony — never trap the user at a dead end.
      if (!redirectUrl && (intent.tier === 'family' || intent.tier === 'deep')) {
        try {
          const billingCycle = intent.cycle === 'annual' ? 'yearly' : 'monthly';
          const apiTier = intent.tier === 'deep' ? 'DEEP' : 'FAMILY';
          const { url } = (await billingApi.checkout({ tier: apiTier, billingCycle })).data;
          if (url) {
            window.location.href = url;
            return;
          }
        } catch {
          /* checkout couldn't start — fall through to the ceremony */
        }
      }
      navigate(safeRedirect(redirectUrl, '/begin'));
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Failed to create account' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 'clamp(48px,9vh,100px) clamp(20px,6vw,40px) 100px',
      }}
    >
      {/* Deep-water legibility veil behind the form (see .auth-scrim, globals.css) */}
      <div aria-hidden className="auth-scrim" />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, margin: '0 auto' }}>

        {/* FORM archetype header — mono eyebrow + giant centered serif headline.
            The headline IS the hero (matches the go-live ceremony intro). */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(48px,8vh,80px)' }}>
          <div
            className="hl-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.34em',
              textTransform: 'uppercase',
              color: 'var(--copper-label)',
              marginBottom: 28,
            }}
          >
            begin your family's deep
          </div>
          <h1
            className="hl-tight"
            style={{
              fontFamily: 'var(--serif-display)',
              fontSize: 'clamp(34px,8vw,56px)',
              fontWeight: 300,
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              margin: 0,
              color: 'var(--bone)',
            }}
          >
            Some things <span style={{ color: 'var(--bone-dim)' }}>only get deeper.</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* step one · the thread's name */}
          <StepEyebrow>step one · name your deep</StepEyebrow>
          <Field
            label="what does your family call itself?"
            id="s-thread"
            value={form.threadName}
            onChange={(v) => set({ threadName: v })}
            placeholder="e.g. The Smith Family Deep"
            error={errors.threadName}
          />
          <Helper>It can be changed later. The Deep takes your name unless you give it its own.</Helper>

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
                label="year you were born · optional"
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
            <div style={{ marginTop: 28 }}>
              <Field
                label="password"
                id="s-pw"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(v) => set({ password: v })}
                autoComplete="new-password"
                error={errors.password}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="hl-mono"
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      padding: '8px 0',
                      minHeight: 44,
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
                      transition: `color 180ms ${EASE}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--bone-dim)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--bone-faint)'; }}
                  >
                    {showPassword ? 'hide' : 'show'}
                  </button>
                }
              />
            </div>
          </div>

          {/* step three · how to begin */}
          <div style={{ marginTop: 44 }}>
            <StepEyebrow>step three · how to begin</StepEyebrow>
            <div role="radiogroup" aria-label="billing cycle" style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
              {!annualOnly && (
                <CycleTab
                  active={cycle !== 'annual'}
                  warm={false}
                  onClick={() => setCycle('monthly')}
                  onArrow={(e) => handleRadioArrowKeys(e, 0, 2, (n) => setCycle(n === 1 ? 'annual' : 'monthly'))}
                >
                  monthly
                </CycleTab>
              )}
              <CycleTab
                active={cycle === 'annual'}
                warm
                onClick={() => setCycle('annual')}
                onArrow={(e) => handleRadioArrowKeys(e, annualOnly ? 0 : 1, annualOnly ? 1 : 2, () => setCycle('annual'))}
              >
                {annualOnly ? 'annual · the only cadence here' : 'annually · 2 months free'}
              </CycleTab>
            </div>
            <div
              role="radiogroup"
              aria-label="how to begin"
              style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--rule)' }}
            >
              {TIERS.map((t, i) => {
                const selected = tier === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    onKeyDown={(e) =>
                      handleRadioArrowKeys(e, i, TIERS.length, (next) => setTier(TIERS[next].id))
                    }
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
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
                      borderLeft: selected ? '1px solid var(--warm)' : '1px solid transparent',
                      paddingLeft: 15,
                      transition: `border-color 180ms ${EASE}`,
                      color: 'var(--bone)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.2em',
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
                        style={{ fontFamily: 'var(--serif-display)', fontSize: 26, fontWeight: 300, letterSpacing: '-0.018em', lineHeight: 1, color: 'var(--bone)' }}
                      >
                        {t.id === 'family' && cycle === 'annual' ? PLAN_PRICE.FAMILY.annual
                          : t.id === 'deep' && cycle === 'annual' ? PLAN_PRICE.DEEP.annual
                          : t.price}
                      </div>
                      <div
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: 'var(--bone-faint)',
                          marginTop: 6,
                        }}
                      >
                        {t.id === 'family' && cycle === 'annual' ? `${PLAN_PRICE.FAMILY.perYear} · 2 mo free`
                          : t.id === 'deep' && cycle === 'annual' ? `${PLAN_PRICE.DEEP.perYear} · 2 mo free`
                          : t.sub}
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
              id="signup-terms"
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(e) => set({ acceptedTerms: e.target.checked })}
              aria-invalid={!!errors.acceptedTerms}
              aria-describedby={errors.acceptedTerms ? 'signup-terms-err' : undefined}
              style={{ marginTop: 4 }}
            />
            <span className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', lineHeight: 1.6, fontWeight: 400 }}>
              I accept the{' '}
              <Link to="/terms" style={{ color: 'var(--warm)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>terms</Link>
              {' '}and the{' '}
              <Link to="/privacy" style={{ color: 'var(--warm)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>privacy notice</Link>.
            </span>
          </label>
          {errors.acceptedTerms ? <FieldError id="signup-terms-err">{errors.acceptedTerms}</FieldError> : null}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginTop: 14 }}>
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(e) => set({ marketingConsent: e.target.checked })}
              style={{ marginTop: 4 }}
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

          {/* the first drop — the drop-verb submit (mirrors Login's enter) */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 36,
              display: 'inline-flex', alignItems: 'center', gap: 16,
              minHeight: 44,
              cursor: isLoading ? 'default' : 'pointer',
              background: 'transparent', border: 0, padding: '8px 0',
              opacity: isLoading ? 0.5 : 1,
              transition: `opacity 360ms ${EASE}`,
            }}
          >
            <span aria-hidden className="hl-drop-breathe" style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--warm)', flex: 'none' }} />
            <span style={{ fontFamily: 'var(--serif-display)', fontStyle: 'italic', fontWeight: 360, fontSize: 24, lineHeight: 1.2, color: 'var(--warm)' }}>
              {isLoading ? 'beginning…' : 'begin'}
            </span>
          </button>

          {/* isLoading: the sanctioned animated hairline (no spinner). Register
              takes several seconds server-side (bcrypt + D1), so an indeterminate
              sweeping ProgressHair reassures the wait instead of a frozen 1px bar. */}
          {isLoading && (
            <div style={{ marginTop: 12 }}>
              <ProgressHair label="lowering your first entry in…" />
            </div>
          )}

          <p
            className="hl-serif"
            style={{ textAlign: 'center', fontSize: 13, fontStyle: 'italic', color: 'var(--bone-faint)', marginTop: 16, fontWeight: 300 }}
          >
            {tier === 'family'
              ? 'next: set up Family at checkout · cancel anytime · your archive always exports free'
              : tier === 'deep'
              ? 'next: set up Deep at checkout · unlimited bloodline · cancel anytime'
              : `no card on file · you begin free — 1 bloodline, ${PLAN_STORAGE.STARTER}, free forever · upgrade whenever you’re ready`}
          </p>
        </form>

        {/* quiet secondary link — already in the water? · sign in */}
        <div
          className="hl-mono"
          style={{
            textAlign: 'center',
            marginTop: 'clamp(40px,7vh,64px)',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          already in the water?&nbsp;·&nbsp;
          <Link
            to="/login"
            style={{
              color: 'var(--bone-dim)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--rule-strong)',
              paddingBottom: 4,
            }}
          >
            sign in
          </Link>
        </div>

        {/* WaxSeal — the ∞ resting warm at the page foot */}
        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <WaxSeal size={22} />
          <div
            className="hl-mono"
            style={{
              marginTop: 14,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
            }}
          >
            encrypted at rest · server-held aes-gcm · access through your account
          </div>
        </div>
      </div>
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
        color: 'var(--bone-dim)',
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
      className="hl-serif"
      style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--bone-faint)', marginTop: 12, lineHeight: 1.55, fontWeight: 300 }}
    >
      {children}
    </p>
  );
}

// Inline mono error line in --warm per FORM archetype spec
function FieldError({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="hl-mono"
      style={{ margin: '8px 0 0', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--warm)' }}
    >
      {children}
    </p>
  );
}

function CycleTab({
  active,
  warm,
  onClick,
  onArrow,
  children,
}: {
  active: boolean;
  warm: boolean;
  onClick: () => void;
  onArrow: (e: React.KeyboardEvent<HTMLElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onArrow}
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      style={{
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        padding: '12px 0',
        minHeight: 44,
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

// Underlined field with mono micro-label — the FORM archetype's core field idiom.
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
  trailing,
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
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <label
          htmlFor={id}
          className="hl-mono"
          style={{
            display: 'block',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-dim)',
          }}
        >
          {label}
        </label>
        {trailing ?? null}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        style={{
          width: '100%',
          background: 'transparent',
          border: 0,
          borderBottom: `1px solid ${error ? 'var(--warm)' : 'var(--rule)'}`,
          padding: '8px 0',
          color: 'var(--bone)',
          fontFamily: 'var(--serif)',
          fontSize: 17,
          outline: 'none',
          borderRadius: 0,
          caretColor: 'var(--warm)',
          transition: `border-color 180ms ${EASE}`,
        }}
        onFocus={(e) => { if (!error) e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
        onBlur={(e) => { if (!error) e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
      />
      {error ? <FieldError id={`${id}-err`}>{error}</FieldError> : null}
    </div>
  );
}
