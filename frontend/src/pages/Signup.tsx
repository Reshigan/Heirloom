import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

export function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register } = useAuthStore();
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordChecks = [
    { label: 'At least 8 characters', valid: form.password.length >= 8 },
    { label: 'Contains a number', valid: /\d/.test(form.password) },
    { label: 'Contains uppercase', valid: /[A-Z]/.test(form.password) },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      await register(form.email, form.password, form.firstName, form.lastName);
      // First action after signup is opening the family thread, not the
      // dashboard. Encryption setup, dead-man's-switch, etc., are surfaced
      // later as nudges from settings — they shouldn't block first value.
      navigate('/threads');
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Failed to create account' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void text-paper px-6 py-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex flex-col items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 rounded">
            <span className="font-serif text-4xl text-gold leading-none">∞</span>
            <span className="text-[0.7rem] tracking-[0.34em] uppercase text-paper/55 group-hover:text-paper transition-colors">Heirloom</span>
          </Link>
        </div>

        <div className="border border-rule rounded-xl p-8 md:p-10">
          <div className="mb-8">
            <h1 className="font-serif font-light text-3xl mb-3 leading-tight">{t('auth.createAccount')}</h1>
            <p className="text-paper/55 text-[15px] leading-relaxed">{t('auth.signupSubtitle')}</p>
          </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blood/10 border border-blood/30 rounded-lg text-blood text-sm text-center"
                >
                  {errors.submit}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-paper/50 mb-2">{t('auth.firstName')}</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      placeholder="John"
                      className={`input pl-12 ${errors.firstName ? 'border-blood' : ''}`}
                    />
                  </div>
                  {errors.firstName && <p className="text-blood text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm text-paper/50 mb-2">{t('auth.lastName')}</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe"
                    className={`input ${errors.lastName ? 'border-blood' : ''}`}
                  />
                  {errors.lastName && <p className="text-blood text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

                            <div>
                              <label className="block text-sm text-paper/50 mb-2">{t('auth.email')}</label>
                              <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                                <input
                                  type="email"
                                  value={form.email}
                                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                                  placeholder="you@example.com"
                                  className={`input pl-12 ${errors.email ? 'border-blood' : ''}`}
                                />
                              </div>
                              {errors.email && <p className="text-blood text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div>
                              <label className="block text-sm text-paper/50 mb-2">{t('auth.password')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className={`input pl-12 pr-12 ${errors.password ? 'border-blood' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-paper/30 hover:text-paper transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-blood text-xs mt-1">{errors.password}</p>}
                
                {/* Password strength indicators */}
                <div className="mt-3 space-y-1">
                  {passwordChecks.map(({ label, valid }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${valid ? 'bg-green-500' : 'bg-paper/10'}`}>
                        {valid && <Check size={8} className="text-void" />}
                      </div>
                      <span className={valid ? 'text-green-400' : 'text-paper/40'}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-paper/50 mb-2">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className={`input pl-12 ${errors.confirmPassword ? 'border-blood' : ''}`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-blood text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-4 text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                                    <>
                                      {t('auth.signup')}
                                      <ArrowRight size={20} />
                                    </>
                )}
              </motion.button>

              <p className="text-xs text-paper/40 text-center">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-gold/70 hover:text-gold">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-gold/70 hover:text-gold">Privacy Policy</Link>
              </p>
            </form>

          <div className="mt-8 pt-6 border-t border-rule text-center">
            <p className="text-paper/55 text-sm">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-gold hover:text-gold-bright transition-colors">
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
