import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { TapestryEdge } from '../loom/components/Frame';
import { WaxSeal } from '../loom/cosmic/CosmicUI';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => adminApi.login({ email, password }),
    onSuccess: (res) => {
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data.admin));
      navigate('/admin/dashboard');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'invalid credentials');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    background: 'transparent',
    border: 0,
    borderBottom: '1px solid var(--rule)',
    color: 'var(--bone)',
    fontFamily: 'var(--serif)',
    fontSize: 18,
    padding: '10px 0',
    marginBottom: 28,
    caretColor: 'var(--warm)',
    borderRadius: 0,
    textAlign: 'center',
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--ink)',
        color: 'var(--bone)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        position: 'relative',
      }}
    >
      {/* Mono eyebrow */}
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--bone-faint)',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        Restricted Access
      </div>

      {/* Giant display headline — Cormorant, >=24px */}
      <h1
        style={{
          fontFamily: 'var(--serif-display)',
          fontSize: 'clamp(40px, 9vw, 72px)',
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: '-0.015em',
          color: 'var(--bone)',
          margin: '0 0 48px',
          textAlign: 'center',
        }}
      >
        Admin
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: 360 }}
      >
        <input
          type="email"
          required
          autoComplete="email"
          aria-label="Email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'admin-login-error' : undefined}
          style={{
            ...inputStyle,
            // focus style applied via CSS pseudo-class via inline workaround:
            // we rely on :focus-within at parent level; use data-focused for warm border
          }}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
        />

        <input
          type="password"
          required
          autoComplete="current-password"
          aria-label="Password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'admin-login-error' : undefined}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--warm)'; }}
          onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--rule)'; }}
        />

        {/* Error — inline mono in warm, role=alert, never a toast */}
        {error && (
          <p
            role="alert"
            id="admin-login-error"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
              margin: '0 0 20px',
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        )}

        {/* Primary CTA — mono uppercase warm pill */}
        <button
          type="submit"
          disabled={loginMutation.isPending || !email.trim() || !password.trim()}
          style={{
            display: 'block',
            width: '100%',
            background: 'transparent',
            border: '1px solid var(--warm)',
            borderRadius: 0,
            color: 'var(--warm)',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            padding: '14px 0',
            minHeight: 44,
            cursor: loginMutation.isPending ? 'wait' : 'pointer',
            opacity: loginMutation.isPending || !email.trim() || !password.trim() ? 0.4 : 1,
            transition: 'opacity 180ms var(--ease)',
          }}
        >
          {loginMutation.isPending ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>

      {/* Serif-italic sub in bone-dim */}
      <p
        style={{
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 15,
          color: 'var(--bone-dim)',
          marginTop: 40,
          textAlign: 'center',
        }}
      >
        For bloodline stewards only.
      </p>

      {/* Ceremony foot */}
      <div style={{ marginTop: 56 }}>
        <WaxSeal size={28} />
      </div>

      <TapestryEdge />
    </div>
  );
}
