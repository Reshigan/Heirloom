'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar,
  Loader2,
  Activity
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface CheckInManagementProps {
  onClose: () => void
}

interface CheckInStatus {
  status: string
  nextCheckIn: string
  intervalDays: number
  missedCount: number
  recentCheckIns: Array<{
    sentAt: string
    respondedAt?: string
    missed: boolean
  }>
}

interface UnlockRequest {
  id: string
  status: string
  createdAt: string
  gracePeriodEnd: string
  confirmationCount: number
}

export default function CheckInManagement({ onClose }: CheckInManagementProps) {
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null)
  const [unlockRequests, setUnlockRequests] = useState<UnlockRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCancelling, setIsCancelling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCheckInStatus()
    fetchUnlockRequests()
  }, [])

  const fetchCheckInStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiClient.getCheckInStatus()
      setCheckInStatus(data)
    } catch (error: any) {
      console.error('Failed to fetch check-in status:', error)
      setError(error.message || 'Failed to load check-in status')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnlockRequests = async () => {
    try {
      const data = await apiClient.getUnlockRequests()
      setUnlockRequests(data.requests.filter((r: any) => r.status === 'pending' || r.status === 'grace_period'))
    } catch (error: any) {
      console.error('Failed to fetch unlock requests:', error)
    }
  }

  const handleManualCheckIn = async () => {
    try {
      setIsCheckingIn(true)
      setError(null)
      await apiClient.performCheckIn()
      await fetchCheckInStatus()
      await fetchUnlockRequests()
    } catch (error: any) {
      setError(error.message || 'Failed to perform check-in')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCancelUnlock = async (requestId: string) => {
    try {
      setIsCancelling(requestId)
      setError(null)
      await apiClient.cancelUnlockRequest(requestId, 'User cancelled during grace period')
      await fetchCheckInStatus()
      await fetchUnlockRequests()
    } catch (error: any) {
      setError(error.message || 'Failed to cancel unlock request')
    } finally {
      setIsCancelling(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'grace_period':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'missed':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      default:
        return 'text-gold-400 bg-gold-400/10 border-gold-400/30'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Active'
      case 'grace_period':
        return 'Grace Period'
      case 'missed':
        return 'Missed Check-in'
      default:
        return status
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-gradient-to-br from-charcoal/95 via-obsidian/95 to-charcoal/95 backdrop-blur-2xl border border-gold-500/30 rounded-2xl shadow-2xl shadow-gold-400/10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gold-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-gold-400 tracking-wide">Check-in Status</h2>
                <p className="text-sm text-gold-200/70 mt-1">
                  Stay connected to keep your vault secure
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium">Error Loading Status</p>
                <p className="text-xs text-red-300/70 mt-1">{error}</p>
              </div>
              <button
                onClick={fetchCheckInStatus}
                className="px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:border-red-400 hover:bg-red/10 transition-all text-xs uppercase tracking-wider"
              >
                Retry
              </button>
            </div>
          ) : checkInStatus ? (
            <div className="space-y-6">
              {/* Current Status Card */}
              <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-gold-400" />
                    <div>
                      <h3 className="font-medium text-gold-400 mb-1">Current Status</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm border ${getStatusColor(checkInStatus.status)}`}>
                        {getStatusLabel(checkInStatus.status)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleManualCheckIn}
                    disabled={isCheckingIn}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider shadow-lg shadow-gold-400/20 flex items-center gap-2"
                  >
                    {isCheckingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking In...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Check In Now
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-obsidian-900/60 border border-gold-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gold-400/70" />
                      <p className="text-xs uppercase tracking-wider text-gold-200/50">Next Check-in</p>
                    </div>
                    <p className="text-gold-400 font-medium">
                      {new Date(checkInStatus.nextCheckIn).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gold-200/50 mt-1">
                      {new Date(checkInStatus.nextCheckIn).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="p-4 bg-obsidian-900/60 border border-gold-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gold-400/70" />
                      <p className="text-xs uppercase tracking-wider text-gold-200/50">Interval</p>
                    </div>
                    <p className="text-gold-400 font-medium">
                      Every {checkInStatus.intervalDays} days
                    </p>
                    <p className="text-xs text-gold-200/50 mt-1">
                      Configurable in settings
                    </p>
                  </div>

                  <div className="p-4 bg-obsidian-900/60 border border-gold-500/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-gold-400/70" />
                      <p className="text-xs uppercase tracking-wider text-gold-200/50">Missed Count</p>
                    </div>
                    <p className={`font-medium ${checkInStatus.missedCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {checkInStatus.missedCount}
                    </p>
                    <p className="text-xs text-gold-200/50 mt-1">
                      {checkInStatus.missedCount === 0 ? 'All good!' : 'Check in soon'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Unlock Requests (Grace Period) */}
              {unlockRequests.length > 0 && (
                <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <div>
                      <h3 className="font-medium text-red-400">Grace Period Active</h3>
                      <p className="text-sm text-red-300/70 mt-1">
                        Your vault unlock process has been initiated. Cancel it if you're still alive.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {unlockRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 bg-obsidian-900/60 border border-red-500/20 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-red-400">
                                Unlock Request #{request.id.slice(0, 8)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs bg-red-400/10 border border-red-400/30 text-red-400">
                                {request.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs text-gold-200/70">
                              <p>
                                <strong className="text-gold-400">Created:</strong>{' '}
                                {new Date(request.createdAt).toLocaleString()}
                              </p>
                              {request.gracePeriodEnd && (
                                <p>
                                  <strong className="text-gold-400">Grace Period Ends:</strong>{' '}
                                  {new Date(request.gracePeriodEnd).toLocaleString()}
                                </p>
                              )}
                              <p>
                                <strong className="text-gold-400">Confirmations:</strong>{' '}
                                {request.confirmationCount} / 2
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelUnlock(request.id)}
                            disabled={isCancelling === request.id}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider shadow-lg shadow-red-400/20 flex items-center gap-2 whitespace-nowrap"
                          >
                            {isCancelling === request.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4" />
                                Cancel Unlock
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-300/90">
                      <strong>Important:</strong> If you're seeing this, your trusted contacts may have been notified. 
                      Cancel this request immediately if you're still alive to prevent your vault from being unlocked.
                    </p>
                  </div>
                </div>
              )}

              {/* How It Works */}
              <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                <h3 className="font-medium text-gold-400 mb-4">How Check-ins Work</h3>
                <div className="space-y-3 text-sm text-gold-200/70">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0 text-xs">
                      1
                    </div>
                    <p>
                      You'll receive a check-in reminder every <strong className="text-gold-400">{checkInStatus.intervalDays} days</strong> via email
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0 text-xs">
                      2
                    </div>
                    <p>
                      If you miss a check-in, a <strong className="text-gold-400">30-day grace period</strong> begins
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0 text-xs">
                      3
                    </div>
                    <p>
                      After the grace period, your <strong className="text-gold-400">trusted contacts</strong> are notified to verify
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0 text-xs">
                      4
                    </div>
                    <p>
                      If <strong className="text-gold-400">2 out of 3</strong> trusted contacts confirm, your vault unlocks for recipients
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Check-ins */}
              {checkInStatus.recentCheckIns && checkInStatus.recentCheckIns.length > 0 && (
                <div className="p-6 bg-obsidian-800/60 border border-gold-500/20 rounded-xl">
                  <h3 className="font-medium text-gold-400 mb-4">Recent Check-ins</h3>
                  <div className="space-y-3">
                    {checkInStatus.recentCheckIns.map((checkIn, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-obsidian-900/60 border border-gold-500/10 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {checkIn.missed ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          <div>
                            <p className="text-sm text-gold-400">
                              {new Date(checkIn.sentAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gold-200/50">
                              Sent at {new Date(checkIn.sentAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {checkIn.missed ? (
                            <span className="text-xs text-red-400">Missed</span>
                          ) : checkIn.respondedAt ? (
                            <div>
                              <span className="text-xs text-green-400">Responded</span>
                              <p className="text-xs text-gold-200/50 mt-0.5">
                                {new Date(checkIn.respondedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-yellow-400">Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gold-400/30 mx-auto mb-4" />
              <p className="text-gold-400/70 mb-2">No check-in data available</p>
              <p className="text-sm text-gold-200/50">Check-in system will activate once configured</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gold-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gold-200/50">
              Check-ins help ensure your vault reaches the right people
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all text-sm uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
