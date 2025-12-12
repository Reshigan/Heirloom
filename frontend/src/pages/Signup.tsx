import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuthStore } from '../stores/authStore';

export function Signup() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const passwordChecks = [
    { label: 'At least 8 characters', valid: form.password.length >= 8 },
    { label: 'Contains a number', valid: /\d/.test(form.password) },
    { label: 'Contains uppercase', valid: /[A-Z]/.test(form.password) },
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!passwordChecks.every(c => c.valid)) {
      setError('Please meet all password requirements');
      return;
    }
    try {
      await register(form.email, form.password, form.firstName, form.lastName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-void">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201, 169, 89, 0.15) 0%, transparent 70%)', top: '10%', left: '20%' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size="lg" />
          <div>
            <h1 className="text-5xl font-light mb-4">Begin your <em className="text-gold">legacy</em></h1>
            <p className="text-paper/50 text-lg max-w-md">Create lasting memories that transcend time. Your stories deserve to live forever.</p>
          </div>
          <div className="space-y-4 max-w-md">
            {['Unlimited photo & video storage', 'Voice recordings with transcription', 'Scheduled letter delivery', 'Legacy contact verification'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-paper/60">
                <div className="w-5 h-5 rounded-full border border-gold/50 flex items-center justify-center">
                  <Check size={12} className="text-gold" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-void-light">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size="md" /></div>
          <h2 className="text-3xl font-light mb-2">Create account</h2>
          <p className="text-paper/50 mb-8">Start preserving your most precious memories</p>
          
          {error && <div className="mb-6 p-4 bg-blood/10 border border-blood/30 text-blood text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-paper/50 mb-2">First name</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm text-paper/50 mb-2">Last name</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-paper/50 mb-2">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-sm text-paper/50 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-paper/30 hover:text-gold">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="mt-3 space-y-1">
                {passwordChecks.map((check, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${check.valid ? 'text-gold' : 'text-paper/30'}`}>
                    <Check size={12} />
                    {check.label}
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn btn-primary disabled:opacity-50">
              {isLoading ? <span className="spinner mx-auto" /> : 'Create Account'}
            </button>
          </form>
          
          <p className="mt-6 text-xs text-paper/30 text-center">
            By creating an account, you agree to our <Link to="/terms" className="text-gold">Terms</Link> and <Link to="/privacy" className="text-gold">Privacy Policy</Link>
          </p>
          <p className="mt-4 text-center text-paper/50">
            Already have an account? <Link to="/login" className="text-gold hover:text-gold-bright">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
