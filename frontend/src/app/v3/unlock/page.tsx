'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { useVault } from '@/contexts/VaultContext'
import { useAuth } from '@/contexts/AuthContext'

/**
 * V3 Unlock Page - Dignified vault unlock
 * 
 * Design: Bank-like security sheet with plain-language messaging
 * - No spinning rings or decorative animations
 * - Clear security information
 * - Single primary CTA
 */

export default function UnlockPage() {
  const router = useRouter()
  const { isUnlocked } = usePrivacy()
  const { initializeVault } = useVault()
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (isUnlocked) {
      router.push('/v3/dashboard')
    }
  }, [isUnlocked, router])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!user?.email) {
        setError('User not authenticated. Please log in again.')
        return
      }
      
      await initializeVault(password, user.email)
      router.push('/v3/dashboard')
    } catch (err) {
      setError('Incorrect password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Lock Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-navy-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-navy-500 mb-2">Vault is Locked</h1>
          <p className="text-ink/60">
            Enter your password to access your private vault
          </p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="bg-white rounded-lg border border-divider p-6 mb-6">
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                placeholder="Enter your password"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/60"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-6 py-3 bg-navy-500 text-white rounded-lg font-medium hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Unlocking...' : 'Unlock Vault'}
          </button>
        </form>

        {/* Security Information */}
        <div className="bg-sage-50 border border-sage-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-ink mb-1">Your Data is Encrypted</h3>
              <p className="text-sm text-ink/70">
                Your vault contents are encrypted with end-to-end encryption. Your password never leaves this device, and we cannot access your data.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-ink/70">
            <p>• Encryption happens locally in your browser</p>
            <p>• Your password is never sent to our servers</p>
            <p>• Only you can decrypt your vault contents</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/v3/dashboard')}
            className="text-sm text-navy-500 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  )
}
