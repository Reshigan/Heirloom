import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePageMeta } from '../lib/usePageMeta';
import { safeRedirect } from '../lib/safeRedirect';
import { threadsApi } from '../services/api';
import { WaxSeal } from '../loom/cosmic/CosmicUI';
import { ProgressHair } from '../loom/components/ProgressHair';
import { PLAN_PRICE } from '../lib/plans';
import { handleRadioArrowKeys } from '../hooks/useRadioArrowKeys';

// Signup — FORM archetype. Underlined fields, mono micro-labels, giant serif
// headline, one warm primary CTA, WaxSeal foot. All data/auth/validation preserved.
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
  { id: 'free', name: 'Free', price: PLAN_PRICE.FREE.amount, sub: PLAN_PRICE.FREE.cycle, body: '1 thread · 500 MB · try every feature' },
  { id: 'family', name: 'Family', price: PLAN_PRICE.FAMILY.monthly, sub: PLAN_PRICE.FAMILY.perMonth, body: 'unlimited · up to 5 members · voice · sealed notes' },
  { id: 'founder', name: 'Founder', price: PLAN_PRICE.FOUNDER.amount, sub: PLAN_PRICE.FOUNDER.cycle, body: 'family forever · name in continuity record' },
];

import { EASE } from '../loom/motion';

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
  const [tier, setTier] = useState<Tier>(() => {
    const t = searchParams.get('tier')?.toLowerCase();
    return t === 'free' || t === 'founder' || t === 'family' ? t : 'family';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
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
      // Server-held AES-GCM: entries are encrypted at rest with a platform-held
      // key, so signup provisions NO client passphrase vault. Route straight on.
      // Founder is a one-time purchase with no trial — route to /founder to
      // complete payment. Family/Free first run the First Thread ceremony
      // (/begin), which then hands off into the product tour + first-entry
      // onboarding. A deep-link redirect always takes precedence.
      navigate(safeRedirect(redirectUrl, tier === 'founder' ? '/founder' : '/begin'));
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
      {/* WOVEN — flipped thread-band header, full width, gradient-fades to ink at its bottom edge (matches Login) */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 'clamp(180px, 32vh, 320px)',
        transform: 'scaleY(-1)',
        opacity: 0.7,
        // ink fade sits over the band; after scaleY(-1) the fade lands on the visual bottom edge
        backgroundImage: 'linear-gradient(to top, var(--ink) 0%, color-mix(in srgb, var(--ink) 0%, transparent) 62%), image-set(url("/woven/thread-band.avif") type("image/avif"), url("/woven/thread-band.webp") type("image/webp"), url("/woven/thread-band.png") type("image/png"))',
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center top',
        backgroundRepeat: 'no-repeat, no-repeat',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
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
            begin a thread
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
            Start your family's thousand-year thread.
          </h1>
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
                        style={{ fontFamily: 'var(--serif-display)', fontSize: 26, fontWeight: 300, letterSpacing: '-0.018em', lineHeight: 1, color: 'var(--bone)' }}
                      >
                        {t.id === 'family' && cycle === 'annual' ? PLAN_PRICE.FAMILY.annual : t.price}
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
                        {t.id === 'family' && cycle === 'annual' ? `${PLAN_PRICE.FAMILY.perYear} · 2 mo free` : t.sub}
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
              style={{ marginTop: 4 }}
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

          {/* outlined amber mono pill — the single accent (mirrors the Login pill) */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 36,
              width: '100%',
              minHeight: 44,
              cursor: isLoading ? 'default' : 'pointer',
              background: 'transparent',
              border: '1px solid var(--warm)',
              borderRadius: 0,
              color: 'var(--warm)',
              padding: '14px 24px',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: isLoading ? 0.5 : 1,
              transition: `opacity 360ms ${EASE}, border-color 360ms ${EASE}`,
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.borderColor = 'var(--warm-bright)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--warm)'; }}
          >
            {isLoading
              ? 'beginning…'
              : tier === 'family'
                ? 'begin the thread · 30-day family trial'
                : 'begin the thread'}
          </button>

          {/* isLoading: the sanctioned animated hairline (no spinner). Register
              takes several seconds server-side (bcrypt + D1), so an indeterminate
              sweeping ProgressHair reassures the wait instead of a frozen 1px bar. */}
          {isLoading && (
            <div style={{ marginTop: 12 }}>
              <ProgressHair label="weaving your first thread…" />
            </div>
          )}

          <p
            className="hl-serif"
            style={{ textAlign: 'center', fontSize: 13, fontStyle: 'italic', color: 'var(--bone-faint)', marginTop: 16, fontWeight: 300 }}
          >
            no card on file · switches to free if not upgraded
          </p>
        </form>

        {/* quiet secondary link — already weaving? · sign in */}
        <div
          className="hl-mono"
          style={{
            textAlign: 'center',
            marginTop: 'clamp(40px,7vh,64px)',
            fontSize: 10,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          already weaving?&nbsp;·&nbsp;
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
              fontSize: 9,
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
      className="hl-serif"
      style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--bone-faint)', marginTop: 12, lineHeight: 1.55, fontWeight: 300 }}
    >
      {children}
    </p>
  );
}

// Inline mono error line in --warm per FORM archetype spec
function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p
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
      aria-pressed={active}
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
          color: 'var(--bone-dim)',
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
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
