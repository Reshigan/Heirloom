import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../services/api';

export function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-gold" />
          </div>
                    <h1 className="text-3xl font-light text-paper">{t('common.adminPortal')}</h1>
                    <p className="text-paper/50 mt-2">{t('common.adminSignInSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="p-4 bg-blood/10 border border-blood/30 text-blood flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-paper/50 mb-2">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-paper/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="admin@heirloom.app"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-paper/50 mb-2">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-paper/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="btn btn-primary w-full"
          >
            {loginMutation.isPending ? t('common.loading') : t('auth.signIn')}
          </button>
        </form>

        <p className="text-center text-paper/30 text-sm mt-6">
          <a href="/" className="hover:text-gold transition-colors">{t('common.backToHome')}</a>
        </p>
      </div>
    </div>
  );
}
