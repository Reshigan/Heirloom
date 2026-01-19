import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';

export function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIntro, setShowIntro] = useState(true);

  // Startup animation
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Startup Animation Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 bg-void-deep flex items-center justify-center"
          >
            {/* Animated rings */}
            <div className="relative">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border border-gold/30 rounded-full"
                  style={{
                    width: 200 + i * 60,
                    height: 200 + i * 60,
                    left: -(100 + i * 30),
                    top: -(100 + i * 30),
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1], 
                    opacity: [0, 0.8, 0.3],
                    rotate: i % 2 === 0 ? [0, 360] : [360, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.2,
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' }
                  }}
                />
              ))}
              
              {/* Center infinity logo */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative z-10 text-center"
              >
                <motion.div
                  className="text-7xl text-gold mb-4"
                  animate={{ 
                    textShadow: [
                      '0 0 20px rgba(201,169,89,0.5)',
                      '0 0 60px rgba(201,169,89,0.8)',
                      '0 0 20px rgba(201,169,89,0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ∞
                </motion.div>
                <motion.span 
                  className="text-xl tracking-[0.3em] text-paper/60"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  HEIRLOOM
                </motion.span>
              </motion.div>
            </div>

            {/* Floating golden particles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-gold"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                  y: [0, -100],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 2,
                  repeat: Infinity,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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

      {/* Login Card */}
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
                            <h1 className="text-2xl font-light text-center mb-2">{t('auth.welcomeBack')}</h1>
                            <p className="text-paper/50 text-center mb-8">{t('auth.loginSubtitle')}</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blood/10 border border-blood/30 rounded-lg text-blood text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-sm text-paper/50 mb-2">{t('auth.email')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-paper/50 mb-2">{t('auth.password')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-paper/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-12 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-paper/30 hover:text-paper transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                                <Link to="/forgot-password" className="text-sm text-gold/70 hover:text-gold transition-colors">
                                  {t('auth.forgotPassword')}
                                </Link>
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
                                      {t('auth.login')}
                                      <ArrowRight size={20} />
                                    </>
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
                            <p className="text-paper/50">
                              {t('auth.noAccount')}{' '}
                              <Link to="/signup" className="text-gold hover:text-gold-bright transition-colors">
                                {t('auth.createAccount')}
                              </Link>
                            </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
