import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { VaultModal } from '../components/VaultModal';

/**
 * Signup — Loom-native rewrite.
 *
 * Same business logic as before (form validation, register, vault
 * setup on success). Cosmetic shell only: a Source Serif 4 heading,
 * hairline-bordered fields, a warm primary button. No sanctuary
 * background, no particles.
 */
export function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuthStore();
  const redirectUrl = searchParams.get('redirect');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
    marketingConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVaultSetup, setShowVaultSetup] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Invalid email';
    if (form.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    if (!form.acceptedTerms)
      newErrors.acceptedTerms = 'You must accept the Terms of Service';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      await register(form.email, form.password, form.firstName, form.lastName, {
        acceptedTerms: form.acceptedTerms,
        acceptedTermsAt: new Date().toISOString(),
        marketingConsent: form.marketingConsent,
        marketingConsentAt: form.marketingConsent ? new Date().toISOString() : null,
      });
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

      <main style={{ display: 'grid', placeItems: 'start center', padding: '60px 24px 100px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div className="loom-eyebrow" style={{ marginBottom: 24 }}>
            ∞ &nbsp; begin a thread
          </div>
          <h1
            className="loom-h2"
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontStyle: 'italic',
              fontWeight: 300,
              margin: '0 0 16px',
            }}
          >
            every life is a single thread.
          </h1>
          <p
            className="loom-body"
            style={{
              fontSize: 18,
              fontStyle: 'italic',
              color: 'var(--loom-bone-dim)',
              margin: '0 0 40px',
              lineHeight: 1.55,
            }}
          >
            yours runs through the ones before you, and into the ones who come after.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Field
                label="first name"
                id="s-first"
                value={form.firstName}
                onChange={(v) => setForm({ ...form, firstName: v })}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <Field
                label="last name"
                id="s-last"
                value={form.lastName}
                onChange={(v) => setForm({ ...form, lastName: v })}
                error={errors.lastName}
                autoComplete="family-name"
              />
            </div>

            <Field
              label="email"
              id="s-email"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              error={errors.email}
              autoComplete="email"
            />

            <Field
              label="password"
              id="s-pw"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              error={errors.password}
              hint="at least 8 characters"
              autoComplete="new-password"
            />

            <Field
              label="confirm password"
              id="s-pw2"
              type="password"
              value={form.confirmPassword}
              onChange={(v) => setForm({ ...form, confirmPassword: v })}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={(e) => setForm({ ...form, acceptedTerms: e.target.checked })}
                style={{ accentColor: 'var(--loom-warm)', marginTop: 4 }}
              />
              <span
                className="loom-body"
                style={{ fontSize: 14, color: 'var(--loom-bone-dim)', lineHeight: 1.6 }}
              >
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
            {errors.acceptedTerms ? (
              <p
                role="alert"
                className="loom-body"
                style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 13, margin: 0 }}
              >
                {errors.acceptedTerms}
              </p>
            ) : null}

            {errors.submit ? (
              <p
                role="alert"
                className="loom-body"
                style={{ fontStyle: 'italic', color: '#c25a5a', fontSize: 14, margin: 0 }}
              >
                {errors.submit}
              </p>
            ) : null}

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 16,
              }}
            >
              <button type="submit" disabled={isLoading} className="loom-btn" style={{ opacity: isLoading ? 0.5 : 1 }}>
                {isLoading ? 'beginning…' : 'begin your thread'}
              </button>
            </div>
          </form>

          <div
            className="loom-mono"
            style={{
              marginTop: 56,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              textAlign: 'center',
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

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="loom-eyebrow" style={{ display: 'block', marginBottom: 8, fontSize: 10 }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && !error ? (
        <p
          className="loom-mono"
          style={{
            margin: '6px 0 0',
            fontSize: 10,
            color: 'var(--loom-bone-faint)',
            letterSpacing: '0.06em',
          }}
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="loom-body"
          style={{ margin: '6px 0 0', fontSize: 13, fontStyle: 'italic', color: '#c25a5a' }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
