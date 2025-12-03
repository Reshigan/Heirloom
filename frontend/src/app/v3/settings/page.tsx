'use client'

import React from 'react'
import { Settings as SettingsIcon, User, Bell, Globe } from 'lucide-react'

/**
 * V3 Settings Page - Account and preferences
 */

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-divider bg-white">
        <div className="max-w-reading mx-auto px-6 py-8">
          <h1 className="font-serif text-3xl text-navy-500 mb-2">Settings</h1>
          <p className="text-ink/60">Manage your account and preferences</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-reading mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-lg border border-divider p-6">
          <h2 className="font-medium text-ink mb-4">Account Settings</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 border border-divider rounded-lg hover:border-navy-500 transition-colors text-left">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-navy-500" strokeWidth={1.5} />
                <div>
                  <p className="font-medium text-ink">Profile</p>
                  <p className="text-sm text-ink/60">Update your name and email</p>
                </div>
              </div>
              <span className="text-navy-500">→</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 border border-divider rounded-lg hover:border-navy-500 transition-colors text-left">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-navy-500" strokeWidth={1.5} />
                <div>
                  <p className="font-medium text-ink">Notifications</p>
                  <p className="text-sm text-ink/60">Configure email and SMS alerts</p>
                </div>
              </div>
              <span className="text-navy-500">→</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 border border-divider rounded-lg hover:border-navy-500 transition-colors text-left">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-navy-500" strokeWidth={1.5} />
                <div>
                  <p className="font-medium text-ink">Language & Region</p>
                  <p className="text-sm text-ink/60">Set your preferred language</p>
                </div>
              </div>
              <span className="text-navy-500">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
