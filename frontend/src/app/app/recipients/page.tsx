'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Mail, User, Trash2 } from 'lucide-react'
import { GoldCard, GoldCardHeader, GoldCardTitle, GoldCardContent, GoldButton, GoldInput } from '@/components/gold-card'
import { apiClient, Recipient } from '@/lib/api-client'

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newRecipient, setNewRecipient] = useState({
    email: '',
    name: '',
    relationship: '',
    accessLevel: 'POSTHUMOUS'
  })

  useEffect(() => {
    loadRecipients()
  }, [])

  const loadRecipients = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getRecipients()
      setRecipients(data.recipients)
    } catch (error) {
      console.error('Failed to load recipients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRecipient = async () => {
    if (!newRecipient.email.trim()) {
      setError('Email is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await apiClient.addRecipient(newRecipient)
      setNewRecipient({ email: '', name: '', relationship: '', accessLevel: 'POSTHUMOUS' })
      setShowAddForm(false)
      await loadRecipients()
    } catch (error: any) {
      console.error('Failed to add recipient:', error)
      setError(error.message || 'Failed to add recipient')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRecipient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipient?')) {
      return
    }

    try {
      await apiClient.deleteRecipient(id)
      await loadRecipients()
    } catch (error: any) {
      console.error('Failed to delete recipient:', error)
      alert(error.message || 'Failed to delete recipient')
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
          Recipients
        </h1>
        <p className="text-xl text-pearl/70">
          Manage who will receive your memories
        </p>
      </motion.div>

      {/* Add Recipient Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8"
      >
        <GoldButton
          onClick={() => setShowAddForm(!showAddForm)}
          variant="primary"
          data-testid="add-recipient-button"
        >
          <Plus className="inline-block mr-2" size={20} />
          Add Recipient
        </GoldButton>
      </motion.div>

      {/* Add Recipient Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <GoldCard>
            <GoldCardHeader>
              <GoldCardTitle>Add New Recipient</GoldCardTitle>
            </GoldCardHeader>
            <GoldCardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-pearl text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-pearl/70 mb-2">Email *</label>
                  <GoldInput
                    value={newRecipient.email}
                    onChange={(value) => setNewRecipient({ ...newRecipient, email: value })}
                    placeholder="recipient@example.com"
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-sm text-pearl/70 mb-2">Name</label>
                  <GoldInput
                    value={newRecipient.name}
                    onChange={(value) => setNewRecipient({ ...newRecipient, name: value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm text-pearl/70 mb-2">Relationship</label>
                  <GoldInput
                    value={newRecipient.relationship}
                    onChange={(value) => setNewRecipient({ ...newRecipient, relationship: value })}
                    placeholder="Son, Daughter, Friend, etc."
                  />
                </div>
                <div className="flex gap-4">
                  <GoldButton
                    onClick={handleAddRecipient}
                    variant="primary"
                    disabled={!newRecipient.email || submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Recipient'}
                  </GoldButton>
                  <GoldButton
                    onClick={() => {
                      setShowAddForm(false)
                      setError(null)
                    }}
                    variant="secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </GoldButton>
                </div>
              </div>
            </GoldCardContent>
          </GoldCard>
        </motion.div>
      )}

      {/* Recipients List */}
      {loading ? (
        <GoldCard>
          <div className="text-center py-12 text-pearl/50">Loading recipients...</div>
        </GoldCard>
      ) : recipients.length === 0 ? (
        <GoldCard>
          <div className="text-center py-12">
            <User className="mx-auto mb-4 text-gold-primary/50" size={48} />
            <p className="text-pearl/70">No recipients yet</p>
            <p className="text-sm text-pearl/50 mt-2">Add recipients who will receive your memories</p>
          </div>
        </GoldCard>
      ) : (
        <div className="grid gap-6">
          {recipients.map((recipient, index) => (
            <motion.div
              key={recipient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <GoldCard hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold-primary/20 flex items-center justify-center">
                      <User className="text-gold-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif text-gold-primary">
                        {recipient.name || 'Unnamed'}
                      </h3>
                      <p className="text-sm text-pearl/60 flex items-center gap-2 mt-1">
                        <Mail size={14} />
                        {recipient.email}
                      </p>
                      {recipient.relationship && (
                        <p className="text-sm text-pearl/50 mt-1">{recipient.relationship}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-pearl/50">
                      {recipient.accessLevel}
                    </span>
                    <button
                      onClick={() => handleDeleteRecipient(recipient.id)}
                      className="text-pearl/50 hover:text-red-400 transition-colors"
                      title="Delete recipient"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </GoldCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
