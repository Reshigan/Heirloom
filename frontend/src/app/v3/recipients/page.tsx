'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Mail, Trash2, Edit2 } from 'lucide-react'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'

/**
 * V3 Recipients Page - Manage who receives vault contents
 */

interface Recipient {
  id: string
  name: string
  email: string
  relationship: string
  accessLevel: 'full' | 'specific'
}

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <PrivacyGate>
      <div className="min-h-screen bg-paper">
        {/* Header */}
        <div className="border-b border-divider bg-white">
          <div className="max-w-wide mx-auto px-6 py-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-serif text-3xl text-navy-500 mb-2">Recipients</h1>
                <p className="text-ink/60">People who will receive your vault contents after you're gone</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Recipient</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-wide mx-auto px-6 py-8">
          {recipients.length === 0 ? (
            <div className="bg-white rounded-lg border border-divider p-12 text-center">
              <Users className="w-16 h-16 text-navy-500/20 mx-auto mb-4" strokeWidth={1} />
              <h3 className="font-serif text-2xl text-navy-500 mb-2">No Recipients Yet</h3>
              <p className="text-ink/60 mb-6 max-w-md mx-auto">
                Add people who should receive your vault contents after you're gone. You can specify what each person receives.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Recipient</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recipients.map((recipient) => (
                <motion.div
                  key={recipient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-divider p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-navy-500" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-medium text-ink mb-1">{recipient.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-ink/60 mb-2">
                          <Mail className="w-4 h-4" />
                          <span>{recipient.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-sage-50 text-sage-600 rounded-full">
                            {recipient.relationship}
                          </span>
                          <span className="text-xs px-2 py-1 bg-navy-50 text-navy-500 rounded-full">
                            {recipient.accessLevel === 'full' ? 'Full Access' : 'Specific Items'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-ink/60 hover:text-navy-500 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-ink/60 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PrivacyGate>
  )
}
