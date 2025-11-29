'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Plus, 
  Mail, 
  User, 
  Phone,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Search
} from 'lucide-react'
import { apiClient, TrustedContact } from '@/lib/api-client'

interface TrustedContactsProps {
  onClose: () => void
}

export default function TrustedContacts({ onClose }: TrustedContactsProps) {
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getTrustedContacts()
      setContacts(data.contacts)
    } catch (error) {
      console.error('Failed to fetch trusted contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddSuccess = () => {
    setShowAddModal(false)
    fetchContacts()
  }

  const getVerificationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'expired':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      default:
        return 'text-gold-400 bg-gold-400/10 border-gold-400/30'
    }
  }

  const getVerificationStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'Verified'
      case 'pending':
        return 'Pending Verification'
      case 'expired':
        return 'Verification Expired'
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
        className="relative w-full max-w-4xl bg-gradient-to-br from-charcoal/95 via-obsidian/95 to-charcoal/95 backdrop-blur-2xl border border-gold-500/30 rounded-2xl shadow-2xl shadow-gold-400/10 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gold-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-gold-400 tracking-wide">Trusted Contacts</h2>
                <p className="text-sm text-gold-200/70 mt-1">
                  2 of 3 contacts must verify to unlock your vault
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

        {/* Info Banner */}
        <div className="px-6 py-4 bg-gold-400/5 border-b border-gold-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gold-400 font-medium mb-1">
                Important: Add exactly 3 trusted contacts
              </p>
              <p className="text-xs text-gold-200/70">
                These contacts will be asked to verify your passing if you miss check-ins. 
                Choose people you trust who will be reachable in the future.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Add */}
        <div className="px-6 py-4 border-b border-gold-500/20">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trusted contacts..."
                className="w-full pl-10 pr-4 py-2 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={contacts.length >= 3}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider shadow-lg shadow-gold-400/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>
          {contacts.length >= 3 && (
            <p className="text-xs text-yellow-400 mt-2">
              Maximum of 3 trusted contacts reached
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gold-400/30 mx-auto mb-4" />
              <p className="text-gold-400/70 mb-2">
                {searchQuery ? 'No contacts found' : 'No trusted contacts yet'}
              </p>
              <p className="text-sm text-gold-200/50 mb-4">
                {searchQuery ? 'Try a different search term' : 'Add 3 trusted contacts who can verify your passing'}
              </p>
              {!searchQuery && contacts.length < 3 && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all text-sm uppercase tracking-wider shadow-lg shadow-gold-400/20"
                >
                  Add Your First Contact
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredContacts.map((contact) => (
                <TrustedContactCard
                  key={contact.id}
                  contact={contact}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gold-500/20">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gold-200/50">
              {contacts.length} of 3 trusted contacts added
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

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddContactModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

interface TrustedContactCardProps {
  contact: TrustedContact
}

function TrustedContactCard({ contact }: TrustedContactCardProps) {
  const getVerificationStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'expired':
        return 'text-red-400 bg-red-400/10 border-red-400/30'
      default:
        return 'text-gold-400 bg-gold-400/10 border-gold-400/30'
    }
  }

  const getVerificationStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'Verified'
      case 'pending':
        return 'Pending Verification'
      case 'expired':
        return 'Verification Expired'
      default:
        return status
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
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gold-400 truncate">
                {contact.name || contact.email}
              </h3>
              <span className={`px-2 py-0.5 rounded text-xs border ${getVerificationStatusColor(contact.verificationStatus)}`}>
                {getVerificationStatusLabel(contact.verificationStatus)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gold-200/70 mb-2">
              <Mail className="w-3 h-3" />
              <span className="truncate">{contact.email}</span>
            </div>
            <p className="text-xs text-gold-200/30 mt-2">
              Added {new Date(contact.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {contact.verificationStatus.toLowerCase() === 'verified' && (
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" />
        )}
        {contact.verificationStatus.toLowerCase() === 'pending' && (
          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 ml-2" />
        )}
      </div>
    </motion.div>
  )
}

interface AddContactModalProps {
  onClose: () => void
  onSuccess: () => void
}

function AddContactModal({ onClose, onSuccess }: AddContactModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
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
      const result = await apiClient.addTrustedContact({
        email,
        name: name || undefined,
        phone: phone || undefined,
        shamirShareEncrypted: 'placeholder_encrypted_share',
      })
      
      const contactId = result.contact.id
      const shamirShare = await generateShamirShare(email, 1)
      
      await apiClient.post(`/trusted-contacts/${contactId}/share`, {
        shareCiphertext: shamirShare,
        algorithm: 'shamir-2-of-3',
        shareIndex: 1
      })
      
      onSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to add trusted contact')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const generateShamirShare = async (email: string, shareIndex: number): Promise<string> => {
    const mockVmkSecret = 'mock_vault_master_key_for_demo'
    const shareData = {
      email,
      shareIndex,
      secret: mockVmkSecret,
      timestamp: new Date().toISOString()
    }
    return btoa(JSON.stringify(shareData))
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
          <h3 className="font-serif text-xl text-gold-400 tracking-wide">Add Trusted Contact</h3>
          <p className="text-xs text-gold-200/70 mt-1">
            This person will help verify your passing
          </p>
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
              <label className="block text-xs uppercase tracking-wider text-gold-200/70 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-4 py-3 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-gold-200/70 mb-2">
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
              <label className="block text-xs uppercase tracking-wider text-gold-200/70 mb-2">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 bg-obsidian-800/40 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-200/30 focus:outline-none focus:border-gold-400 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gold-400/5 border border-gold-500/20 rounded-lg">
            <p className="text-xs text-gold-200/70">
              A verification email will be sent to this contact. They must verify within 7 days.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gold-500/30 text-gold-400 hover:border-gold-400 hover:bg-gold/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-gold-400 to-gold-500 text-obsidian-900 font-medium hover:from-gold-500 hover:to-gold-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider shadow-lg shadow-gold-400/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Contact'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
