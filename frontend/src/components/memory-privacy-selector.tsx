'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Globe, Users, Calendar } from 'lucide-react'

export type PrivacyLevel = 'public' | 'private' | 'restricted'

interface MemoryPrivacySelectorProps {
  selectedLevel: PrivacyLevel
  onLevelChange: (level: PrivacyLevel) => void
  isTimeLocked?: boolean
  unlockDate?: string
  onTimeLockToggle?: (enabled: boolean) => void
  onUnlockDateChange?: (date: string) => void
}

const privacyConfig: Record<PrivacyLevel, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  public: {
    label: 'Public',
    description: 'Visible to all family members after vault redemption',
    icon: <Globe className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-500'
  },
  private: {
    label: 'Private',
    description: 'Only visible to you during your lifetime',
    icon: <Lock className="w-5 h-5" />,
    color: 'from-red-500 to-rose-500'
  },
  restricted: {
    label: 'Restricted',
    description: 'Only visible to specific people you choose',
    icon: <Users className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-500'
  }
}

export default function MemoryPrivacySelector({
  selectedLevel,
  onLevelChange,
  isTimeLocked,
  unlockDate,
  onTimeLockToggle,
  onUnlockDateChange
}: MemoryPrivacySelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-3">
          Privacy Level
        </h3>
        <div className="grid gap-3">
          {(Object.keys(privacyConfig) as PrivacyLevel[]).map((level) => {
            const config = privacyConfig[level]
            const isSelected = selectedLevel === level

            return (
              <motion.button
                key={level}
                onClick={() => onLevelChange(level)}
                className={`glass-card p-4 text-left transition-all ${
                  isSelected ? 'border-gold-500/60 shadow-lg' : 'border-gold-500/20'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${config.color} bg-opacity-20`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-pearl">{config.label}</h4>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-gold-400" />
                      )}
                    </div>
                    <p className="text-xs text-pearl/60">{config.description}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {onTimeLockToggle && onUnlockDateChange && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-400" />
              <h4 className="text-sm font-medium text-pearl">Time Lock</h4>
            </div>
            <button
              onClick={() => onTimeLockToggle(!isTimeLocked)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isTimeLocked ? 'bg-gold-500' : 'bg-pearl/20'
              }`}
            >
              <motion.div
                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                animate={{ x: isTimeLocked ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          
          {isTimeLocked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-xs text-pearl/60 mb-2">
                This memory will only be accessible after:
              </p>
              <input
                type="date"
                value={unlockDate || ''}
                onChange={(e) => onUnlockDateChange(e.target.value)}
                className="glass-input w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
