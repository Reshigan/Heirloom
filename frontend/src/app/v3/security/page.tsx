'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Users, Key, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * V3 Security Page - Encryption, trusted contacts, and security settings
 */

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-divider bg-white">
        <div className="max-w-reading mx-auto px-6 py-8">
          <h1 className="font-serif text-3xl text-navy-500 mb-2">Security</h1>
          <p className="text-ink/60">Your vault's encryption and security configuration</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-reading mx-auto px-6 py-8 space-y-6">
        {/* Encryption Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-sage-500 to-sage-600 rounded-lg p-8 text-white"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-lg">
              <Shield className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-serif text-2xl mb-2">End-to-End Encrypted</h2>
              <p className="text-white/80">
                Your vault contents are encrypted with AES-256-GCM. Only you can decrypt your data.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Encryption</p>
              <p className="font-medium">AES-256-GCM</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Key Derivation</p>
              <p className="font-medium">PBKDF2-HMAC-SHA256</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-1">Secret Sharing</p>
              <p className="font-medium">Shamir 2-of-3</p>
            </div>
          </div>
        </motion.div>

        {/* Trusted Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-divider p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-medium text-ink mb-1">Trusted Contacts (2-of-3)</h2>
              <p className="text-sm text-ink/60">
                These people can verify your death and help unlock your vault for recipients.
              </p>
            </div>
            <button className="text-sm text-navy-500 hover:underline">
              Manage →
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Setup Required</p>
              <p>You need to add at least 2 verified trusted contacts to enable posthumous vault unlock.</p>
            </div>
          </div>
        </motion.div>

        {/* How Encryption Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-divider p-6"
        >
          <h2 className="font-medium text-ink mb-4">How Your Data is Protected</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-navy-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-ink mb-1">Local Encryption</p>
                <p className="text-sm text-ink/60">
                  All encryption happens in your browser. Your password never leaves your device, and we cannot access your data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Key className="w-4 h-4 text-navy-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-ink mb-1">Shamir Secret Sharing</p>
                <p className="text-sm text-ink/60">
                  Your master key is split into 3 shares using Shamir's algorithm. Any 2 shares can reconstruct the key after your death.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-navy-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-medium text-ink mb-1">Trusted Verification</p>
                <p className="text-sm text-ink/60">
                  After your death is verified by 2 trusted contacts, recipients receive secure magic links to access their designated content.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-divider p-6"
        >
          <h2 className="font-medium text-ink mb-4">Security Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 border border-divider rounded-lg hover:border-navy-500 transition-colors text-left">
              <div>
                <p className="font-medium text-ink mb-1">Change Password</p>
                <p className="text-sm text-ink/60">Update your vault password</p>
              </div>
              <span className="text-navy-500">→</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 border border-divider rounded-lg hover:border-navy-500 transition-colors text-left">
              <div>
                <p className="font-medium text-ink mb-1">Clear Keys Now</p>
                <p className="text-sm text-ink/60">Lock your vault on this device immediately</p>
              </div>
              <span className="text-navy-500">→</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 border border-divider rounded-lg hover:border-navy-500 transition-colors text-left">
              <div>
                <p className="font-medium text-ink mb-1">View Activity Log</p>
                <p className="text-sm text-ink/60">See all security-related events</p>
              </div>
              <span className="text-navy-500">→</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
