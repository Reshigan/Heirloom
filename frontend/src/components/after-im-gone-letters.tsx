'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Plus, Send, Loader2, Heart, AlertCircle, CheckCircle2, Users } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useVault } from '@/contexts/VaultContext'
import toast from 'react-hot-toast'

interface Letter {
  id: string
  recipientId?: string
  recipientEmail: string
  recipientName?: string
  subject: string
  encryptedContent: string
  encryptedDek: string
  deliveryStatus: 'pending' | 'scheduled' | 'delivered' | 'failed'
  deliveredAt?: string
  readAt?: string
  attachedMemoryIds: string[]
  createdAt: string
  updatedAt: string
}

interface Recipient {
  id: string
  email: string
  name?: string
  relationship?: string
}

interface AfterImGoneLettersProps {
  onClose: () => void
}

export default function AfterImGoneLetters({ onClose }: AfterImGoneLettersProps) {
  const { vaultEncryption } = useVault()
  const [letters, setLetters] = useState<Letter[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)
  
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [readinessData, setReadinessData] = useState<any>(null)

  useEffect(() => {
    fetchLetters()
    fetchRecipients()
  }, [])

  const fetchLetters = async () => {
    try {
      const data = await apiClient.get('/api/after-im-gone-letters')
      setLetters(data)
    } catch (error) {
      console.error('Failed to fetch letters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecipients = async () => {
    try {
      const data = await apiClient.get('/api/recipients')
      setRecipients(data)
    } catch (error) {
      console.error('Failed to fetch recipients:', error)
    }
  }

  const handleCreateLetter = async () => {
    if (!recipientEmail || !subject || !content) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!vaultEncryption) {
      toast.error('Vault encryption not initialized')
      return
    }

    try {
      const { encryptedData, encryptedDek } = await vaultEncryption.encryptData(content)

      const newLetter = await apiClient.post('/api/after-im-gone-letters', {
        recipientEmail,
        recipientName: recipientName || undefined,
        subject,
        encryptedContent: encryptedData,
        encryptedDek,
        attachedMemoryIds: []
      })

      setLetters([newLetter, ...letters])
      setIsCreating(false)
      resetForm()
      toast.success('Letter saved successfully')
    } catch (error) {
      console.error('Failed to create letter:', error)
      toast.error('Failed to create letter')
    }
  }

  const fetchReadiness = async (letterId: string) => {
    try {
      const data = await apiClient.get(`/api/after-im-gone-letters/${letterId}/readiness`)
      setReadinessData(data)
    } catch (error) {
      console.error('Failed to fetch readiness:', error)
    }
  }

  const resetForm = () => {
    setRecipientEmail('')
    setRecipientName('')
    setSubject('')
    setContent('')
  }

  const decryptLetterContent = async (letter: Letter) => {
    if (!vaultEncryption) return null
    try {
      const decrypted = await vaultEncryption.decryptData(
        letter.encryptedContent,
        letter.encryptedDek
      )
      return decrypted
    } catch (error) {
      console.error('Failed to decrypt letter:', error)
      return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-obsidian-800 to-obsidian-900 rounded-2xl border border-gold-500/20 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gold-500/20">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-gold-400" />
            <div>
              <h2 className="text-2xl font-serif text-gold-400">After I'm Gone Letters</h2>
              <p className="text-sm text-gold-200/50 mt-1">
                Write heartfelt letters to be delivered after you pass
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {isCreating ? (
            <div className="space-y-6">
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-4 flex items-start gap-3">
                <Heart className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gold-200/70">
                  <p className="font-medium text-gold-200 mb-1">A Letter of Love</p>
                  <p>
                    Write a letter that will be delivered to your loved ones after you're gone. 
                    Share your wisdom, express your love, and leave a lasting message.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-200 mb-2">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400"
                  placeholder="sarah@example.com"
                />
                {recipients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recipients.slice(0, 5).map((recipient) => (
                      <button
                        key={recipient.id}
                        onClick={() => {
                          setRecipientEmail(recipient.email)
                          setRecipientName(recipient.name || '')
                        }}
                        className="px-3 py-1 bg-obsidian-900/50 border border-gold-500/20 rounded-full text-xs text-gold-200 hover:border-gold-400 transition-all"
                      >
                        {recipient.name || recipient.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-200 mb-2">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400"
                  placeholder="Sarah"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-200 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400"
                  placeholder="My Final Words to You"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gold-200 mb-2">
                  Letter Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-obsidian-900/50 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-500/30 focus:outline-none focus:border-gold-400 font-serif"
                  placeholder="My dearest Sarah,&#10;&#10;As I write this, I want you to know how much you've meant to me..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateLetter}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-900 rounded-lg font-medium hover:from-gold-400 hover:to-gold-500 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Save Letter
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    resetForm()
                  }}
                  className="px-6 py-3 border border-gold-500/30 text-gold-400 rounded-lg font-medium hover:border-gold-400 hover:bg-gold-500/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gold-200/70">
                    Create letters to be delivered to your loved ones after you pass
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gold-200/50">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Letters are encrypted and secure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Requires recipients & trusted contacts</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-900 rounded-lg font-medium hover:from-gold-400 hover:to-gold-500 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Letter
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
                </div>
              ) : letters.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gold-400/30 mx-auto mb-4" />
                  <p className="text-gold-200/50">No letters yet</p>
                  <p className="text-gold-200/30 text-sm mt-2">
                    Write your first letter to be delivered after you're gone
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {letters.map((letter) => (
                    <div
                      key={letter.id}
                      className="bg-obsidian-900/50 border border-gold-500/20 rounded-lg p-6 hover:border-gold-400/40 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-serif text-lg text-gold-100 mb-1">
                            {letter.subject}
                          </h3>
                          <p className="text-sm text-gold-200/50">
                            To: {letter.recipientName || letter.recipientEmail}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          letter.deliveryStatus === 'pending'
                            ? 'bg-gold-500/20 text-gold-400'
                            : letter.deliveryStatus === 'delivered'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {letter.deliveryStatus}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm text-gold-200/70">
                          <p>Created: {new Date(letter.createdAt).toLocaleDateString()}</p>
                          {letter.deliveredAt && (
                            <p>Delivered: {new Date(letter.deliveredAt).toLocaleDateString()}</p>
                          )}
                        </div>

                        <button
                          onClick={async () => {
                            await fetchReadiness(letter.id)
                            setSelectedLetter(letter)
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 text-gold-400 rounded-lg text-sm font-medium hover:from-gold-500/30 hover:to-gold-600/30 transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Readiness Modal */}
              {selectedLetter && readinessData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/60 flex items-center justify-center z-10"
                  onClick={() => {
                    setSelectedLetter(null)
                    setReadinessData(null)
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="bg-obsidian-800 border border-gold-500/30 rounded-xl p-6 max-w-md w-full mx-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-serif text-gold-400 mb-4">
                      Letter Readiness
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gold-200">Overall Progress</span>
                        <span className="text-2xl font-bold text-gold-400">
                          {readinessData.readinessPercentage}%
                        </span>
                      </div>

                      <div className="w-full bg-obsidian-900 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-gold-500 to-gold-600 h-3 rounded-full transition-all"
                          style={{ width: `${readinessData.readinessPercentage}%` }}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {readinessData.hasRecipient ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gold-400" />
                          )}
                          <span className="text-sm text-gold-200">
                            Recipient added
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {readinessData.hasTrustedContacts ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gold-400" />
                          )}
                          <span className="text-sm text-gold-200">
                            2+ trusted contacts added
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {readinessData.hasContent ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gold-400" />
                          )}
                          <span className="text-sm text-gold-200">
                            Letter content written
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedLetter(null)
                          setReadinessData(null)
                        }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-900 rounded-lg font-medium hover:from-gold-400 hover:to-gold-500 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
