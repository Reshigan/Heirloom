'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Zap, ArrowUpRight } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import Link from 'next/link'

interface UsageData {
  tier: string
  tierDisplayName: string
  monthlyMemories: number
  monthlyLimit: number
  monthlyPercentage: number
  monthlyRemaining: number
  weeklyMemories: number
  weeklyLimit: number
  weeklyPercentage: number
  weeklyRemaining: number
  storageUsedGB: string
  storageLimitGB: number
  storagePercentage: number
  totalMemories: number
  daysSinceLastPost: number | null
  approachingMonthlyLimit: boolean
  monthlyLimitReached: boolean
  approachingWeeklyLimit: boolean
  weeklyLimitReached: boolean
  features: {
    aiEnhancement: boolean
    storyReels: boolean
    memorialPages: boolean
    prioritySupport: boolean
  }
}

interface UsageMeterProps {
  compact?: boolean
  showUpgrade?: boolean
}

export function UsageMeter({ compact = false, showUpgrade = true }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    try {
      const response = await apiClient.get('/usage/current')
      setUsage(response.data)
    } catch (error) {
      console.error('Failed to load usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-obsidian-light/50 rounded w-3/4 mb-2" />
        <div className="h-2 bg-obsidian-light/50 rounded w-full" />
      </div>
    )
  }

  if (!usage) {
    return null
  }

  const getProgressColor = (percentage: number, limitReached: boolean) => {
    if (limitReached) return 'from-red-500 to-red-600'
    if (percentage >= 80) return 'from-orange-400 to-orange-500'
    return 'from-gold-primary to-gold-secondary'
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-pearl/70">Monthly Memories</span>
            <span className="text-sm font-medium text-pearl">
              {usage.monthlyMemories} / {usage.monthlyLimit}
            </span>
          </div>
          <div className="h-2 bg-obsidian-light/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usage.monthlyPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${getProgressColor(
                usage.monthlyPercentage,
                usage.monthlyLimitReached
              )}`}
            />
          </div>
        </div>

        {usage.monthlyLimitReached && showUpgrade && (
          <Link
            href="/billing?upgrade=true"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-primary to-gold-secondary text-obsidian text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-gold-primary/20 transition-all"
          >
            <Zap size={16} />
            Upgrade for More
            <ArrowUpRight size={14} />
          </Link>
        )}

        {usage.approachingMonthlyLimit && !usage.monthlyLimitReached && showUpgrade && (
          <Link
            href="/billing?upgrade=true"
            className="text-sm text-gold-primary hover:text-gold-secondary transition-colors flex items-center gap-1"
          >
            Approaching limit - Upgrade
            <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-serif text-pearl mb-1">
            {usage.tierDisplayName} Plan
          </h3>
          <p className="text-sm text-pearl/50">
            {usage.totalMemories} total memories preserved
          </p>
        </div>
        {showUpgrade && usage.tier !== 'lifetime' && (
          <Link
            href="/billing?upgrade=true"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-primary to-gold-secondary text-obsidian font-medium rounded-lg hover:shadow-lg hover:shadow-gold-primary/20 transition-all"
          >
            <TrendingUp size={18} />
            Upgrade
          </Link>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-medium text-pearl">Monthly Memories</span>
              {usage.monthlyLimitReached && (
                <span className="ml-2 text-xs text-red-400 font-medium">LIMIT REACHED</span>
              )}
              {usage.approachingMonthlyLimit && !usage.monthlyLimitReached && (
                <span className="ml-2 text-xs text-orange-400 font-medium">APPROACHING LIMIT</span>
              )}
            </div>
            <span className="text-lg font-medium text-pearl">
              {usage.monthlyMemories} / {usage.monthlyLimit}
            </span>
          </div>
          <div className="h-3 bg-obsidian-light/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usage.monthlyPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${getProgressColor(
                usage.monthlyPercentage,
                usage.monthlyLimitReached
              )}`}
            />
          </div>
          <p className="text-sm text-pearl/50 mt-2">
            {usage.monthlyRemaining > 0
              ? `${usage.monthlyRemaining} memories remaining this month`
              : 'Monthly limit reached - Resets on the 1st'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-medium text-pearl">Weekly Uploads</span>
              {usage.weeklyLimitReached && (
                <span className="ml-2 text-xs text-red-400 font-medium">LIMIT REACHED</span>
              )}
            </div>
            <span className="text-lg font-medium text-pearl">
              {usage.weeklyMemories} / {usage.weeklyLimit}
            </span>
          </div>
          <div className="h-3 bg-obsidian-light/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usage.weeklyPercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              className={`h-full bg-gradient-to-r ${getProgressColor(
                usage.weeklyPercentage,
                usage.weeklyLimitReached
              )}`}
            />
          </div>
          <p className="text-sm text-pearl/50 mt-2">
            {usage.weeklyRemaining > 0
              ? `${usage.weeklyRemaining} uploads remaining this week`
              : 'Weekly limit reached - Resets on Monday'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-medium text-pearl">Storage Used</span>
            <span className="text-lg font-medium text-pearl">
              {usage.storageUsedGB} / {usage.storageLimitGB} GB
            </span>
          </div>
          <div className="h-3 bg-obsidian-light/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usage.storagePercentage, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className={`h-full bg-gradient-to-r ${getProgressColor(
                usage.storagePercentage,
                usage.storagePercentage >= 100
              )}`}
            />
          </div>
          <p className="text-sm text-pearl/50 mt-2">
            {usage.storagePercentage < 100
              ? `${(100 - usage.storagePercentage).toFixed(1)}% storage available`
              : 'Storage limit reached'}
          </p>
        </div>
      </div>

      {usage.daysSinceLastPost !== null && usage.daysSinceLastPost > 7 && (
        <div className="bg-gold-primary/10 border border-gold-primary/20 rounded-lg p-4">
          <p className="text-sm text-pearl/70">
            It's been <strong className="text-gold-primary">{usage.daysSinceLastPost} days</strong> since your last memory.
            <br />
            <Link href="/app" className="text-gold-primary hover:text-gold-secondary transition-colors">
              Add a memory today →
            </Link>
          </p>
        </div>
      )}

      {(usage.monthlyLimitReached || usage.approachingMonthlyLimit) && showUpgrade && (
        <div className="bg-gradient-to-r from-gold-primary/10 to-gold-secondary/10 border border-gold-primary/30 rounded-lg p-6">
          <h4 className="text-xl font-serif text-gold-primary mb-2">
            {usage.monthlyLimitReached ? 'Upgrade to Continue' : 'Upgrade for More Capacity'}
          </h4>
          <p className="text-sm text-pearl/70 mb-4">
            {usage.monthlyLimitReached
              ? "You've reached your monthly limit. Upgrade to keep preserving your precious memories!"
              : "You're approaching your monthly limit. Upgrade now to ensure you never miss capturing a moment."}
          </p>
          <Link
            href="/billing?upgrade=true"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-primary to-gold-secondary text-obsidian font-medium rounded-lg hover:shadow-lg hover:shadow-gold-primary/20 transition-all"
          >
            <Zap size={18} />
            View Upgrade Options
            <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}
