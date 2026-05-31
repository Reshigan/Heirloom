import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '../services/api';

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
      setError(err.response?.data?.error || 'Invalid credentials');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-void text-paper antialiased flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <span className="font-body text-5xl text-gold block mb-5" aria-hidden>∞</span>
          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Admin</p>
          <h1 className="font-body font-light text-3xl tracking-[-0.014em] text-paper">Admin Portal</h1>
          <p className="text-paper-60 mt-3">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-void-surface border border-paper-15 rounded-[2px] p-8 space-y-6">
          {error && (
            <p role="alert" className="text-blood text-sm">{error}</p>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
              placeholder="admin@heirloom.blue"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="btn btn-primary w-full"
          >
            {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-paper-50 text-sm mt-6">
          <a href="/" className="hover:text-gold transition-colors">Back to main site</a>
        </p>
      </div>
    </div>
  );
}
