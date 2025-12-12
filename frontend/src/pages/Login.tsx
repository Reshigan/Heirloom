import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuthStore } from '../stores/authStore';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-void">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201, 169, 89, 0.15) 0%, transparent 70%)', top: '20%', left: '30%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size="lg" />
          <div>
            <h1 className="text-5xl font-light mb-4">Welcome <em className="text-gold">back</em></h1>
            <p className="text-paper/50 text-lg max-w-md">Your memories are waiting. Continue preserving what matters most.</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] p-6 max-w-md">
            <p className="text-paper/60 italic mb-4">"Heirloom gave me the peace of knowing my stories will live on forever."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/20" />
              <div>
                <div className="text-paper text-sm">Margaret H.</div>
                <div className="text-paper/40 text-xs">Family Legacy Plan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-void-light">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size="md" /></div>
          <h2 className="text-3xl font-light mb-2">Sign in</h2>
          <p className="text-paper/50 mb-8">Enter your credentials to access your vault</p>
          
          {error && <div className="mb-6 p-4 bg-blood/10 border border-blood/30 text-blood text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-paper/50 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-sm text-paper/50 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-12" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-paper/30 hover:text-gold">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-paper/50">
                <input type="checkbox" className="w-4 h-4 bg-transparent border border-white/10" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-gold hover:text-gold-bright">Forgot password?</Link>
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn btn-primary disabled:opacity-50">
              {isLoading ? <span className="spinner mx-auto" /> : 'Sign In'}
            </button>
          </form>
          
          <p className="mt-8 text-center text-paper/50">
            Don't have an account? <Link to="/signup" className="text-gold hover:text-gold-bright">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
