'use client'

import React from 'react'
import { CreditCard, CheckCircle2 } from 'lucide-react'

/**
 * V3 Billing Page - Subscription management
 */

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-divider bg-white">
        <div className="max-w-reading mx-auto px-6 py-8">
          <h1 className="font-serif text-3xl text-navy-500 mb-2">Billing</h1>
          <p className="text-ink/60">Manage your subscription and payment method</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-reading mx-auto px-6 py-8 space-y-6">
        {/* Current Plan */}
        <div className="bg-white rounded-lg border border-divider p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-medium text-ink mb-1">Current Plan</h2>
              <p className="text-sm text-ink/60">Starter Plan - $2.50/month</p>
            </div>
            <span className="px-3 py-1 bg-sage-50 text-sage-600 text-sm font-medium rounded-full">
              Active
            </span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-ink/70">
              <CheckCircle2 className="w-4 h-4 text-sage-600" strokeWidth={2} />
              <span>3 uploads per week</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink/70">
              <CheckCircle2 className="w-4 h-4 text-sage-600" strokeWidth={2} />
              <span>10GB storage</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink/70">
              <CheckCircle2 className="w-4 h-4 text-sage-600" strokeWidth={2} />
              <span>Unlimited recipients</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink/70">
              <CheckCircle2 className="w-4 h-4 text-sage-600" strokeWidth={2} />
              <span>End-to-end encryption</span>
            </div>
          </div>

          <button className="w-full px-6 py-3 border border-navy-500 text-navy-500 rounded-lg font-medium hover:bg-navy-50 transition-colors">
            Upgrade Plan
          </button>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg border border-divider p-6">
          <h2 className="font-medium text-ink mb-4">Payment Method</h2>
          <div className="flex items-center gap-4 p-4 border border-divider rounded-lg">
            <CreditCard className="w-6 h-6 text-navy-500" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="font-medium text-ink">•••• •••• •••• 4242</p>
              <p className="text-sm text-ink/60">Expires 12/2026</p>
            </div>
            <button className="text-sm text-navy-500 hover:underline">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
