'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 bg-gradient-to-br from-black-850 via-black-900 to-black-850 border-r border-black-500 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-gold-500/15 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center border-2 border-gold-500 rounded-full">
            <span className="font-display text-4xl text-gold-500">H</span>
          </div>
          
          <h1 className="font-display text-5xl text-gold-500 mb-4">Heirloom</h1>
          <p className="font-display text-xl italic text-cream-300 mb-8">
            "Where every memory becomes a legacy"
          </p>
          
          <div className="text-base text-black-100 leading-relaxed p-6 bg-gold-500/8 border-l-3 border-gold-500 rounded-md">
            "I started using Heirloom to leave voice messages for my grandchildren. 
            Now I've recorded over 100 stories they'll have forever."
            <br /><br />
            <strong className="text-gold-500">— Margaret, 68</strong>
          </div>
        </div>
      </div>
      
      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-black-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 flex items-center justify-center border-2 border-gold-500 rounded-full">
                <span className="font-display text-2xl text-gold-500">H</span>
              </div>
              <span className="font-display text-2xl text-gold-500">Heirloom</span>
            </div>
            
            <h2 className="font-display text-3xl text-cream-100 mb-2">Welcome Back</h2>
            <p className="text-base text-black-100">Log in to continue building your legacy</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-error-900/20 border border-error-500 rounded-md text-error-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Link href="/forgot-password" className="text-sm text-gold-500 hover:text-gold-400 block text-right mt-1">
                Forgot password?
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-[18px] h-[18px] accent-gold-500"
              />
              <label htmlFor="remember" className="text-sm text-cream-300 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-black-500" />
            <span className="text-sm text-black-200">or continue with</span>
            <div className="flex-1 h-px bg-black-500" />
          </div>
          
          <div className="space-y-3">
            <button className="flex items-center justify-center gap-3 w-full p-3 text-base font-medium text-cream-300 bg-black-700 border border-black-500 rounded-md hover:bg-black-600 hover:border-black-400 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            
            <button className="flex items-center justify-center gap-3 w-full p-3 text-base font-medium text-cream-300 bg-black-700 border border-black-500 rounded-md hover:bg-black-600 hover:border-black-400 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Continue with GitHub
            </button>
            
            <button className="flex items-center justify-center gap-3 w-full p-3 text-base font-medium text-cream-300 bg-black-700 border border-black-500 rounded-md hover:bg-black-600 hover:border-black-400 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z"/>
              </svg>
              Continue with Apple
            </button>
          </div>
          
          <div className="text-center mt-8 pt-6 border-t border-black-500">
            <p className="text-base text-black-100">
              Don't have an account? <Link href="/signup" className="text-gold-500 font-medium hover:text-gold-400">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
