'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Users, 
  Shield, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  PenLine,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { useAuth } from '@/contexts/AuthContext'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { apiClient } from '@/lib/api-client'

/**
 * V3 Dashboard - Privacy Vault Status Overview
 * 
 * Shows:
 * - Next check-in status
 * - Trusted contacts setup (2-of-3)
 * - Recipients configuration
 * - Vault statistics
 * - Quick actions
 */

interface DashboardStats {
  nextCheckIn: string | null
  checkInStatus: 'alive' | 'missed_one' | 'missed_two' | 'escalation'
  trustedContactsCount: number
  trustedContactsVerified: number
  recipientsCount: number
  itemsCount: number
  storageUsed: number
  storageLimit: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { isUnlocked } = usePrivacy()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    nextCheckIn: null,
    checkInStatus: 'alive',
    trustedContactsCount: 0,
    trustedContactsVerified: 0,
    recipientsCount: 0,
    itemsCount: 0,
    storageUsed: 0,
    storageLimit: 10737418240, // 10GB
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        const vaultStats = await apiClient.getVaultStats()
        
        setStats(prev => ({
          ...prev,
          itemsCount: vaultStats.items?.total || 0,
          storageUsed: vaultStats.storage?.used || 0,
          storageLimit: vaultStats.storage?.limit || 10737418240,
        }))
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const getCheckInStatusColor = (status: string) => {
    switch (status) {
      case 'alive': return 'text-sage-600 bg-sage-50'
      case 'missed_one': return 'text-yellow-600 bg-yellow-50'
      case 'missed_two': return 'text-orange-600 bg-orange-50'
      case 'escalation': return 'text-red-600 bg-red-50'
      default: return 'text-ink/60 bg-paper'
    }
  }

  const getCheckInStatusText = (status: string) => {
    switch (status) {
      case 'alive': return 'Active'
      case 'missed_one': return 'Missed 1 check-in'
      case 'missed_two': return 'Missed 2 check-ins'
      case 'escalation': return 'Escalation in progress'
      default: return 'Unknown'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const storagePercent = (stats.storageUsed / stats.storageLimit) * 100

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-divider bg-white">
        <div className="max-w-wide mx-auto px-6 py-8">
          <h1 className="font-serif text-3xl text-navy-500 mb-2">Dashboard</h1>
          <p className="text-ink/60">Your vault status and next actions</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-wide mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-navy-500 to-navy-600 rounded-lg p-8 text-white"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-2xl mb-2">Compose a Letter</h2>
                  <p className="text-white/80 mb-6 max-w-md">
                    Write a message, record a memory, or create a letter for your loved ones to receive after you're gone.
                  </p>
                  <button
                    onClick={() => router.push('/v3/compose')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-navy-500 rounded-lg font-medium hover:bg-white/90 transition-colors"
                  >
                    <PenLine className="w-5 h-5" />
                    <span>Start Writing</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <PenLine className="w-16 h-16 text-white/20" strokeWidth={1} />
              </div>
            </motion.div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Check-in Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg border border-divider p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${getCheckInStatusColor(stats.checkInStatus)}`}>
                    <Calendar className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCheckInStatusColor(stats.checkInStatus)}`}>
                    {getCheckInStatusText(stats.checkInStatus)}
                  </span>
                </div>
                <h3 className="font-medium text-ink mb-1">Next Check-in</h3>
                <p className="text-2xl font-serif text-navy-500 mb-2">
                  {stats.nextCheckIn ? new Date(stats.nextCheckIn).toLocaleDateString() : '90 days'}
                </p>
                <button
                  onClick={() => router.push('/v3/check-in')}
                  className="text-sm text-navy-500 hover:underline"
                >
                  Configure →
                </button>
              </motion.div>

              {/* Trusted Contacts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg border border-divider p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${
                    stats.trustedContactsVerified >= 2 ? 'bg-sage-50 text-sage-600' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    <Shield className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  {stats.trustedContactsVerified >= 2 ? (
                    <CheckCircle2 className="w-5 h-5 text-sage-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <h3 className="font-medium text-ink mb-1">Trusted Contacts</h3>
                <p className="text-2xl font-serif text-navy-500 mb-2">
                  {stats.trustedContactsVerified} of 3 verified
                </p>
                <button
                  onClick={() => router.push('/v3/security')}
                  className="text-sm text-navy-500 hover:underline"
                >
                  {stats.trustedContactsVerified < 2 ? 'Set up now →' : 'Manage →'}
                </button>
              </motion.div>

              {/* Recipients */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg border border-divider p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${
                    stats.recipientsCount > 0 ? 'bg-sage-50 text-sage-600' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    <Users className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  {stats.recipientsCount > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-sage-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <h3 className="font-medium text-ink mb-1">Recipients</h3>
                <p className="text-2xl font-serif text-navy-500 mb-2">
                  {stats.recipientsCount} {stats.recipientsCount === 1 ? 'person' : 'people'}
                </p>
                <button
                  onClick={() => router.push('/v3/recipients')}
                  className="text-sm text-navy-500 hover:underline"
                >
                  {stats.recipientsCount === 0 ? 'Add recipients →' : 'Manage →'}
                </button>
              </motion.div>
            </div>

            {/* Vault Statistics */}
            <PrivacyGate>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg border border-divider p-6"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-medium text-ink mb-1">Vault Contents</h3>
                    <p className="text-sm text-ink/60">Your stored memories and letters</p>
                  </div>
                  <FileText className="w-6 h-6 text-navy-500/20" strokeWidth={1.5} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Items Count */}
                  <div>
                    <p className="text-sm text-ink/60 mb-1">Total Items</p>
                    <p className="text-3xl font-serif text-navy-500">{stats.itemsCount}</p>
                  </div>

                  {/* Storage */}
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <p className="text-sm text-ink/60">Storage Used</p>
                      <p className="text-sm font-medium text-ink">
                        {formatBytes(stats.storageUsed)} / {formatBytes(stats.storageLimit)}
                      </p>
                    </div>
                    <div className="w-full bg-paper rounded-full h-2">
                      <div
                        className="bg-navy-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(storagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/v3/vault')}
                  className="mt-6 text-sm text-navy-500 hover:underline"
                >
                  View all items →
                </button>
              </motion.div>
            </PrivacyGate>

            {/* Setup Checklist */}
            {(stats.trustedContactsVerified < 2 || stats.recipientsCount === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-ink mb-2">Complete Your Setup</h3>
                    <p className="text-sm text-ink/70 mb-4">
                      To ensure your vault can be unlocked after you're gone, please complete these steps:
                    </p>
                    <ul className="space-y-2">
                      {stats.trustedContactsVerified < 2 && (
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full border-2 border-yellow-600 flex items-center justify-center">
                            <Clock className="w-3 h-3 text-yellow-600" />
                          </div>
                          <span>Set up at least 2 verified trusted contacts</span>
                        </li>
                      )}
                      {stats.recipientsCount === 0 && (
                        <li className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full border-2 border-yellow-600 flex items-center justify-center">
                            <Clock className="w-3 h-3 text-yellow-600" />
                          </div>
                          <span>Add at least one recipient to receive your vault</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
