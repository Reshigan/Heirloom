'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TierLimitBannerProps {
  currentUsage: number
  limit: number
  period: string
  tier: string
}

export function TierLimitBanner({ currentUsage, limit, period, tier }: TierLimitBannerProps) {
  const router = useRouter()
  const percentage = (currentUsage / limit) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = currentUsage >= limit

  if (!isNearLimit) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 p-4 rounded-lg border ${
        isAtLimit
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-yellow-500/10 border-yellow-500/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          isAtLimit ? 'text-red-400' : 'text-yellow-400'
        }`} />
        <div className="flex-1">
          <h4 className={`font-medium ${
            isAtLimit ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {isAtLimit ? 'Upload Limit Reached' : 'Approaching Upload Limit'}
          </h4>
          <p className="text-sm text-gold-200/70 mt-1">
            You've used {currentUsage} of {limit} uploads this {period} on the {tier} tier.
          </p>
          <div className="mt-3 h-2 bg-obsidian-800/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full ${
                isAtLimit
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
              }`}
            />
          </div>
          {tier === 'free' && (
            <button
              onClick={() => router.push('/billing')}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all text-sm shadow-lg shadow-gold-400/20"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Premium
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
