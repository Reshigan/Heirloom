import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Loader2, Eye, EyeOff, ArrowRight, Check } from '../components/Icons';
import { useAuthStore } from '../stores/authStore';

export function Signup() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
    marketingConsent: false,
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
    if (!form.acceptedTerms) newErrors.acceptedTerms = 'You must accept the Terms of Service';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      // Pass consent data with registration
      await register(form.email, form.password, form.firstName, form.lastName, {
        acceptedTerms: form.acceptedTerms,
        acceptedTermsAt: new Date().toISOString(),
        marketingConsent: form.marketingConsent,
        marketingConsentAt: form.marketingConsent ? new Date().toISOString() : null,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.error || 'Failed to create account' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>

      {/* Signup Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card glow */}
        <div className="absolute -inset-4 bg-gold/5 blur-3xl rounded-full" />
        
        <div className="card glass-strong relative">
          {/* Glass shine */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.08] to-transparent rounded-t-2xl pointer-events-none" />
          
          <div className="relative">
            {/* Logo */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link to="/" className="inline-block">
                <motion.div
                  className="text-5xl text-gold mb-2"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                >
                  ∞
                </motion.div>
                <span className="text-lg tracking-[0.2em] text-paper/60">HEIRLOOM</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-light text-center mb-2">Create your legacy</h1>
              <p className="text-paper/50 text-center mb-8">Start your 14-day free trial</p>
            </motion.div>

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
                  <label className="block text-sm text-paper/50 mb-2">First name</label>
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
                  <label className="block text-sm text-paper/50 mb-2">Last name</label>
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
                <label className="block text-sm text-paper/50 mb-2">Email</label>
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
                <label className="block text-sm text-paper/50 mb-2">Password</label>
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
                <label className="block text-sm text-paper/50 mb-2">Confirm password</label>
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

              {/* GDPR Consent Section */}
              <div className="space-y-3 pt-2">
                {/* Terms of Service - Required */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.acceptedTerms}
                      onChange={(e) => setForm({ ...form, acceptedTerms: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                      form.acceptedTerms 
                        ? 'bg-gold border-gold' 
                        : errors.acceptedTerms 
                          ? 'border-blood' 
                          : 'border-paper/30 group-hover:border-paper/50'
                    }`}>
                      {form.acceptedTerms && <Check size={12} className="text-void" />}
                    </div>
                  </div>
                  <span className="text-sm text-paper/70">
                    I agree to the{' '}
                    <Link to="/terms" className="text-gold hover:text-gold-bright underline" onClick={(e) => e.stopPropagation()}>
                      Terms of Service
                    </Link>
                    {' '}<span className="text-gold">*</span>
                  </span>
                </label>
                {errors.acceptedTerms && <p className="text-blood text-xs ml-8">{errors.acceptedTerms}</p>}

                {/* Privacy Policy Acknowledgement */}
                <p className="text-xs text-paper/50 ml-8">
                  By creating an account, you acknowledge our{' '}
                  <Link to="/privacy" className="text-gold/70 hover:text-gold underline">Privacy Policy</Link>
                  {' '}which explains how we collect, use, and protect your data.
                </p>

                {/* Marketing Consent - Optional */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.marketingConsent}
                      onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                      form.marketingConsent 
                        ? 'bg-gold border-gold' 
                        : 'border-paper/30 group-hover:border-paper/50'
                    }`}>
                      {form.marketingConsent && <Check size={12} className="text-void" />}
                    </div>
                  </div>
                  <span className="text-sm text-paper/50">
                    Send me product updates, tips, and special offers (optional)
                  </span>
                </label>
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
                    Begin Your Legacy
                    <ArrowRight size={20} />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-paper/50">
                Already have an account?{' '}
                <Link to="/login" className="text-gold hover:text-gold-bright transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
