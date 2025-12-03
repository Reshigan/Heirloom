'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

/**
 * V3 Check-in Page - Dead Man's Switch configuration
 */

export default function CheckInPage() {
  const nextCheckIn = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  const checkInInterval = 90

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-divider bg-white">
        <div className="max-w-reading mx-auto px-6 py-8">
          <h1 className="font-serif text-3xl text-navy-500 mb-2">Check-in Status</h1>
          <p className="text-ink/60">Your Dead Man's Switch configuration and status</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-reading mx-auto px-6 py-8 space-y-6">
        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-divider p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-sage-50 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-sage-600" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h2 className="font-medium text-ink mb-1">Status: Active</h2>
              <p className="text-sm text-ink/60">Your check-in schedule is active and working correctly.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-ink/60 mb-1">Next Check-in</p>
              <p className="text-2xl font-serif text-navy-500">{nextCheckIn.toLocaleDateString()}</p>
              <p className="text-sm text-ink/60 mt-1">
                {Math.ceil((nextCheckIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days from now
              </p>
            </div>
            <div>
              <p className="text-sm text-ink/60 mb-1">Check-in Interval</p>
              <p className="text-2xl font-serif text-navy-500">{checkInInterval} days</p>
              <button className="text-sm text-navy-500 hover:underline mt-1">
                Change interval →
              </button>
            </div>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-divider p-6"
        >
          <h2 className="font-medium text-ink mb-4">How Check-ins Work</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-sage-50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-sage-600">1</span>
              </div>
              <div>
                <p className="font-medium text-ink mb-1">Regular Check-ins</p>
                <p className="text-sm text-ink/60">
                  We'll send you an email every {checkInInterval} days asking you to confirm you're okay. Simply click the link or sign in.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-yellow-600">2</span>
              </div>
              <div>
                <p className="font-medium text-ink mb-1">Missed Check-ins</p>
                <p className="text-sm text-ink/60">
                  If you miss 3 consecutive check-ins, we'll escalate to your trusted contacts to verify your status.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-navy-500">3</span>
              </div>
              <div>
                <p className="font-medium text-ink mb-1">Grace Period</p>
                <p className="text-sm text-ink/60">
                  After verification, there's a 30-day grace period before your vault is unlocked for recipients.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Check-in History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-divider p-6"
        >
          <h2 className="font-medium text-ink mb-4">Recent Check-ins</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-divider last:border-0">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-sage-600" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink">Responded</p>
                  <p className="text-xs text-ink/60">September 3, 2025</p>
                </div>
              </div>
              <span className="text-xs text-ink/60">via Email</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-divider last:border-0">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-sage-600" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink">Responded</p>
                  <p className="text-xs text-ink/60">June 5, 2025</p>
                </div>
              </div>
              <span className="text-xs text-ink/60">via Sign-in</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-sage-600" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink">Responded</p>
                  <p className="text-xs text-ink/60">March 7, 2025</p>
                </div>
              </div>
              <span className="text-xs text-ink/60">via Email</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
