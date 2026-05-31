import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '../services/api';

/**
 * AdminLogin — Loom-native reskin.
 *
 * Standalone centred column on var(--loom-ink). No app nav.
 * Same business logic: adminApi.login → localStorage → /admin/dashboard.
 * Aesthetic: "the loom-keeper's reverse" — same type system, more utilitarian.
 */
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--loom-ink)',
        color: 'var(--loom-bone)',
        display: 'grid',
        gridTemplateRows: '60px 1fr',
      }}
    >
      {/* Topbar — same pattern as loom-topbar but stripped to mark only */}
      <header
        style={{
          borderBottom: '1px solid var(--loom-rule)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="loom-mark">
          <span className="infmark">∞</span>heirloom
        </span>
        <Link
          to="/"
          className="loom-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--loom-bone-faint)',
            textDecoration: 'none',
          }}
        >
          back to main site
        </Link>
      </header>

      {/* Centred form column */}
      <main
        style={{
          display: 'grid',
          placeItems: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          <p className="loom-eyebrow" style={{ marginBottom: 8 }}>
            the ledger
          </p>
          <p
            className="loom-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--loom-bone-faint)',
              marginBottom: 28,
            }}
          >
            loom-keeper's console · zero-knowledge · metadata only
          </p>

          <h1
            className="loom-h2"
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 300,
              fontStyle: 'italic',
              margin: '0 0 36px',
            }}
          >
            Sign in.
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
            <div>
              <label
                htmlFor="admin-email"
                className="loom-eyebrow"
                style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
              >
                email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@heirloom.blue"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="loom-eyebrow"
                style={{ display: 'block', marginBottom: 8, fontSize: 10 }}
              >
                password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="loom-body"
                style={{
                  fontStyle: 'italic',
                  color: '#c25a5a',
                  fontSize: 14,
                  margin: 0,
                }}
              >
                {error}
              </p>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="submit"
                disabled={loginMutation.isPending || !email.trim() || !password.trim()}
                className="loom-btn"
                style={{
                  opacity: loginMutation.isPending || !email.trim() || !password.trim() ? 0.5 : 1,
                }}
              >
                {loginMutation.isPending ? 'signing in…' : 'sign in'}
              </button>
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
              textAlign: 'center',
            }}
          >
            ∞ &nbsp; admin sees metadata only · entries are sealed
          </div>
        </div>
      </main>
    </div>
  );
}
