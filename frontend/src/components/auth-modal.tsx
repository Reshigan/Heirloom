'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name, familyName)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setFamilyName('')
    setError('')
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    resetForm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full h-[100dvh] sm:h-auto sm:max-w-md rounded-none sm:rounded-2xl bg-gradient-to-br from-obsidian via-charcoal to-obsidian border-0 sm:border border-gold/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gold hover:text-gold/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6 mt-4 sm:mt-0">
              <h2 className="text-2xl sm:text-3xl font-serif text-pearl mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm sm:text-base text-pearl/70">
                {mode === 'login'
                  ? 'Sign in to access your family memories'
                  : 'Start preserving your family heritage'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-pearl/80 mb-2 uppercase tracking-wider text-xs">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-obsidian/50 border border-gold/30 text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-pearl/80 mb-2 uppercase tracking-wider text-xs">
                      Family Name
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-obsidian/50 border border-gold/30 text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors"
                      placeholder="The Doe Family"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-pearl/80 mb-2 uppercase tracking-wider text-xs">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-obsidian/50 border border-gold/30 text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pearl/80 mb-2 uppercase tracking-wider text-xs">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-obsidian/50 border border-gold/30 text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 sm:py-3 rounded-lg bg-gradient-to-r from-gold to-gold/80 text-obsidian font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] text-base"
              >
                {isLoading ? (
                  'Processing...'
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={switchMode}
                className="text-pearl/70 hover:text-pearl transition-colors text-sm"
              >
                {mode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
