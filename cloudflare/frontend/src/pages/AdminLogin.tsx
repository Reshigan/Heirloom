import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '../services/api';
import { HLogo } from '../loom/components/HLogo';
import { TapestryEdge } from '../loom/components/Frame';

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
      className="hl-screen"
      style={{
        background: 'var(--ink)',
        color: 'var(--bone)',
      }}
    >
      {/* Topbar */}
      <header className="hl-topbar">
        <HLogo size={18} wordmark />
      </header>

      {/* Centred content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
        }}
      >
        <div style={{ maxWidth: 400, width: '100%' }}>
          <h1
            className="hl-serif"
            style={{
              fontSize: 40,
              fontWeight: 300,
              letterSpacing: '-0.02em',
              margin: '0 0 28px',
              color: 'var(--bone)',
            }}
          >
            Admin.
          </h1>

          <form onSubmit={handleSubmit}>
            {/* Username / email input */}
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="hl-serif"
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--rule)',
                color: 'var(--bone)',
                fontSize: 17,
                padding: '8px 0',
                marginBottom: 18,
                outline: 'none',
                caretColor: 'var(--warm)',
                borderRadius: 0,
              }}
            />

            {/* Password input */}
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="hl-serif"
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--rule)',
                color: 'var(--bone)',
                fontSize: 17,
                padding: '8px 0',
                marginBottom: 24,
                outline: 'none',
                caretColor: 'var(--warm)',
                borderRadius: 0,
              }}
            />

            <button
              type="submit"
              disabled={loginMutation.isPending || !email.trim() || !password.trim()}
              className="hl-btn"
              style={{
                width: '100%',
                opacity: loginMutation.isPending || !email.trim() || !password.trim() ? 0.5 : 1,
                cursor: loginMutation.isPending ? 'wait' : 'pointer',
              }}
            >
              {loginMutation.isPending ? 'Signing in…' : 'Sign in →'}
            </button>

            {error && (
              <p
                role="alert"
                className="hl-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--warm)',
                  margin: '12px 0 0',
                  letterSpacing: '0.04em',
                }}
              >
                {error}
              </p>
            )}
          </form>
        </div>
      </div>

      <TapestryEdge />
    </div>
  );
}
