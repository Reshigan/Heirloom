'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Mail, 
  User, 
  Edit2, 
  Trash2, 
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { apiClient, Recipient } from '@/lib/api-client'

interface RecipientManagementProps {
  onClose: () => void
}

export default function RecipientManagement({ onClose }: RecipientManagementProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null)

  useEffect(() => {
    fetchRecipients()
  }, [])

  const fetchRecipients = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getRecipients()
      setRecipients(data.recipients)
    } catch (error) {
      console.error('Failed to fetch recipients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRecipients = recipients.filter(recipient =>
    recipient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipient.relationship?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddSuccess = () => {
    setShowAddModal(false)
    fetchRecipients()
  }

  const handleEditSuccess = () => {
    setEditingRecipient(null)
    fetchRecipients()
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
        className="relative w-full max-w-4xl bg-gradient-to-br from-charcoal/95 via-obsidian/95 to-charcoal/95 backdrop-blur-2xl border border-gold-500/30 rounded-2xl shadow-2xl shadow-gold-400/10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gold-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-gold-400 tracking-wide">Recipients</h2>
                <p className="text-sm text-gold-200/70 mt-1">
                  Manage who will receive your vault contents
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold-500/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Add */}
        <div className="px-6 py-4 border-b border-gold-500/20">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400/50" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipients..."
                className="w-full pl-10 pr-4 py-2 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all text-sm uppercase tracking-[0.15em] shadow-lg shadow-gold-400/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Recipient
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gold-400/30 mx-auto mb-4" />
              <p className="text-gold-400/70 mb-2">
                {searchQuery ? 'No recipients found' : 'No recipients yet'}
              </p>
              <p className="text-sm text-gold-200/50">
                {searchQuery ? 'Try a different search term' : 'Add recipients who will receive your vault contents'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRecipients.map((recipient) => (
                <RecipientCard
                  key={recipient.id}
                  recipient={recipient}
                  onEdit={() => setEditingRecipient(recipient)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gold-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gold-200/50">
              {recipients.length} {recipients.length === 1 ? 'recipient' : 'recipients'} total
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold-500/10 transition-all text-sm uppercase tracking-[0.15em]"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>

      {/* Add Recipient Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddRecipientModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddSuccess}
          />
        )}
      </AnimatePresence>

      {/* Edit Recipient Modal */}
      <AnimatePresence>
        {editingRecipient && (
          <EditRecipientModal
            recipient={editingRecipient}
            onClose={() => setEditingRecipient(null)}
            onSuccess={handleEditSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface RecipientCardProps {
  recipient: Recipient
  onEdit: () => void
}

function RecipientCard({ recipient, onEdit }: RecipientCardProps) {
  const getAccessLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'full':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'limited':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      default:
        return 'text-gold-400 bg-gold-400/10 border-gold-400/30'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-obsidian-800/60 border border-gold-500/20 rounded-xl hover:border-gold-500/40 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gold-400 truncate">
                {recipient.name || recipient.email}
              </h3>
              <span className={`px-2 py-0.5 rounded text-xs border ${getAccessLevelColor(recipient.accessLevel)}`}>
                {recipient.accessLevel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gold-200/70 mb-2">
              <Mail className="w-3 h-3" />
              <span className="truncate">{recipient.email}</span>
            </div>
            {recipient.relationship && (
              <p className="text-xs text-gold-200/50">
                Relationship: {recipient.relationship}
              </p>
            )}
            <p className="text-xs text-gold-200/30 mt-2">
              Added {new Date(recipient.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg border border-gold-500/30 flex items-center justify-center text-gold-400 hover:border-gold-400 hover:bg-gold-500/10 transition-all flex-shrink-0 ml-2"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface AddRecipientModalProps {
  onClose: () => void
  onSuccess: () => void
}

function AddRecipientModal({ onClose, onSuccess }: AddRecipientModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [accessLevel, setAccessLevel] = useState('full')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Email is required')
      return
    }

    try {
      setIsSubmitting(true)
      await apiClient.addRecipient({
        email,
        name: name || undefined,
        relationship: relationship || undefined,
        accessLevel,
      })
      onSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to add recipient')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-gradient-to-br from-charcoal/95 via-obsidian/95 to-charcoal/95 backdrop-blur-2xl border border-gold-500/30 rounded-2xl shadow-2xl shadow-gold-400/10 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gold-500/20">
          <h3 className="font-serif text-xl text-gold-400 tracking-wide">Add Recipient</h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-gold-200/70 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-3 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-gold-200/70 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-gold-200/70 mb-2">
                Relationship
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Son, Daughter, Friend, etc."
                className="w-full px-4 py-3 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.15em] text-gold-200/70 mb-2">
                Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="w-full px-4 py-3 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-400 transition-all"
                disabled={isSubmitting}
              >
                <option value="full">Full Access</option>
                <option value="limited">Limited Access</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-[0.15em]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-[0.15em] shadow-lg shadow-gold-400/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Recipient'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

interface EditRecipientModalProps {
  recipient: Recipient
  onClose: () => void
  onSuccess: () => void
}

function EditRecipientModal({ recipient, onClose, onSuccess }: EditRecipientModalProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-gradient-to-br from-charcoal/95 via-obsidian/95 to-charcoal/95 backdrop-blur-2xl border border-gold-500/30 rounded-2xl shadow-2xl shadow-gold-400/10 overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gold-500/20">
          <h3 className="font-serif text-xl text-gold-400 tracking-wide">Edit Recipient</h3>
        </div>

        <div className="px-6 py-6">
          <p className="text-gold-200/70 mb-4">
            Editing functionality coming soon. For now, you can only view recipient details.
          </p>
          <div className="space-y-3 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-gold-200/50 mb-1">Email</p>
              <p className="text-gold-400">{recipient.email}</p>
            </div>
            {recipient.name && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-gold-200/50 mb-1">Name</p>
                <p className="text-gold-400">{recipient.name}</p>
              </div>
            )}
            {recipient.relationship && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-gold-200/50 mb-1">Relationship</p>
                <p className="text-gold-400">{recipient.relationship}</p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-gold-200/50 mb-1">Access Level</p>
              <p className="text-gold-400">{recipient.accessLevel}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold-500/10 transition-all text-sm uppercase tracking-[0.15em]"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
