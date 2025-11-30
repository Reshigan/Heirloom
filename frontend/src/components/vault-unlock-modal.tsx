'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, AlertCircle, Loader2 } from 'lucide-react'

interface VaultUnlockModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlock: (password: string) => Promise<void>
}

export function VaultUnlockModal({ isOpen, onClose, onUnlock }: VaultUnlockModalProps) {
  if (!isOpen) return null
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Password is required')
      return
    }

    try {
      setIsUnlocking(true)
      setError('')
      await onUnlock(password)
    } catch (err: any) {
      setError(err.message || 'Failed to unlock vault')
    } finally {
      setIsUnlocking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-gradient-to-br from-charcoal/95 via-obsidian/95 to-charcoal/95 backdrop-blur-2xl border border-gold-500/30 rounded-2xl shadow-2xl shadow-gold-400/10 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gold-500/20">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-gold-400" />
            <div>
              <h3 className="font-serif text-xl text-gold-400 tracking-wide">Unlock Vault</h3>
              <p className="text-xs text-gold-200/70 mt-1">
                Enter your password to access encrypted vault
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-gold-200/70 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all"
                disabled={isUnlocking}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gold-400/5 border border-gold-500/20 rounded-lg">
            <p className="text-xs text-gold-200/70">
              Your password is used to derive encryption keys locally. It never leaves your device.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isUnlocking}
              className="flex-1 px-4 py-2 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUnlocking || !password}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider shadow-lg shadow-gold-400/20 flex items-center justify-center gap-2"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Unlock
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
