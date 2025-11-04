'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Key, Unlock, CheckCircle, AlertTriangle, User, Calendar } from 'lucide-react'
import { LuxCard, LuxButton } from './lux'

interface TokenRedemptionModalProps {
  onClose: () => void
  onRedeem: (token: string) => Promise<{ success: boolean; owner?: { name: string; avatar: string; birthDate: string; deathDate: string }; error?: string }>
}

export default function TokenRedemptionModal({ onClose, onRedeem }: TokenRedemptionModalProps) {
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [redemptionState, setRedemptionState] = useState<'input' | 'confirm' | 'success' | 'error'>('input')
  const [ownerInfo, setOwnerInfo] = useState<{ name: string; avatar: string; birthDate: string; deathDate: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const handleValidate = async () => {
    if (!token.trim()) return

    setIsValidating(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const result = await onRedeem(token)
    
    if (result.success && result.owner) {
      setOwnerInfo(result.owner)
      setRedemptionState('confirm')
    } else {
      setErrorMessage(result.error || 'Invalid token. Please check and try again.')
      setRedemptionState('error')
    }
    
    setIsValidating(false)
  }

  const handleConfirmRedemption = async () => {
    setIsValidating(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRedemptionState('success')
    setIsValidating(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-modal max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-gold-400">Redeem Legacy Token</h2>
          <button
            onClick={onClose}
            className="glass-icon-button p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {redemptionState === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <p className="text-pearl/70 text-sm mb-4">
                  Enter the Legacy Token to unlock a family member's vault and access their memories.
                </p>
                
                <div className="glass-input-container">
                  <Key className="w-5 h-5 text-gold-400" />
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="HLM_LEG_XXXXXXXXXXXXXXXX"
                    className="glass-input"
                    disabled={isValidating}
                  />
                </div>
              </div>

              <button
                onClick={handleValidate}
                disabled={!token.trim() || isValidating}
                className="glass-button-primary w-full"
              >
                {isValidating ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Key className="w-5 h-5" />
                    </motion.div>
                    Validating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Unlock className="w-5 h-5" />
                    Validate Token
                  </span>
                )}
              </button>
            </motion.div>
          )}

          {redemptionState === 'confirm' && ownerInfo && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4 p-4 glass-card">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 flex items-center justify-center text-2xl border border-gold-500/30">
                    {ownerInfo.avatar || '👤'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gold-400">{ownerInfo.name}</h3>
                    <p className="text-sm text-pearl/60 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(ownerInfo.birthDate).getFullYear()} - {new Date(ownerInfo.deathDate).getFullYear()}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-200 font-medium mb-1">Important</p>
                      <p className="text-xs text-amber-200/80">
                        This will unseal {ownerInfo.name}'s vault and add their memories to your family tree. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRedemptionState('input')}
                  className="glass-button flex-1"
                  disabled={isValidating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedemption}
                  className="glass-button-primary flex-1"
                  disabled={isValidating}
                >
                  {isValidating ? 'Unsealing...' : 'Confirm & Unseal'}
                </button>
              </div>
            </motion.div>
          )}

          {redemptionState === 'success' && ownerInfo && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30"
              >
                <CheckCircle className="w-10 h-10 text-green-400" />
              </motion.div>

              <h3 className="text-xl font-semibold text-gold-400 mb-2">Vault Unsealed!</h3>
              <p className="text-pearl/70 text-sm mb-6">
                {ownerInfo.name}'s memories are now accessible in your family tree.
              </p>

              <button
                onClick={onClose}
                className="glass-button-primary w-full"
              >
                View Family Tree
              </button>
            </motion.div>
          )}

          {redemptionState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center border border-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Validation Failed</h3>
                <p className="text-pearl/70 text-sm">{errorMessage}</p>
              </div>

              <button
                onClick={() => {
                  setRedemptionState('input')
                  setToken('')
                  setErrorMessage('')
                }}
                className="glass-button-primary w-full"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
