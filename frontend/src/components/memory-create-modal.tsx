'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Calendar, MapPin, Users, Tag } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface MemoryCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MemoryCreateModal({ isOpen, onClose, onSuccess }: MemoryCreateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [participants, setParticipants] = useState('')
  const [tags, setTags] = useState('')
  const [type, setType] = useState('photo')
  const [significance, setSignificance] = useState('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await apiClient.createMemory({
        title,
        description,
        date,
        location: location || undefined,
        type,
        significance,
        participants: participants ? participants.split(',').map(p => p.trim()) : [],
        tags: tags ? tags.split(',').map(t => t.trim()) : []
      })
      
      setTitle('')
      setDescription('')
      setDate('')
      setLocation('')
      setParticipants('')
      setTags('')
      setType('photo')
      setSignificance('medium')
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create memory')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-gradient-to-br from-charcoal via-obsidian to-charcoal border border-gold/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
              {/* Header */}
              <div className="sticky top-0 bg-obsidian/95 backdrop-blur-xl border-b border-gold/20 p-6 flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-gold">Create Memory</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gold/10 rounded-full transition-colors"
                >
                  <X className="text-pearl" size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-pearl/80 text-sm font-medium mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-obsidian/50 border border-gold/30 rounded-lg text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors"
                    placeholder="Give your memory a title..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-pearl/80 text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-obsidian/50 border border-gold/30 rounded-lg text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors resize-none"
                    placeholder="Describe this precious moment..."
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-pearl/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-gold" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-obsidian/50 border border-gold/30 rounded-lg text-pearl focus:outline-none focus:border-gold/60 transition-colors"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-pearl/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-gold" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian/50 border border-gold/30 rounded-lg text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors"
                    placeholder="Where did this happen?"
                  />
                </div>

                {/* Type & Significance */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-pearl/80 text-sm font-medium mb-2">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-3 bg-obsidian/50 border border-gold/30 rounded-lg text-pearl focus:outline-none focus:border-gold/60 transition-colors"
                    >
                      <option value="photo">Photo</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="document">Document</option>
                      <option value="story">Story</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-pearl/80 text-sm font-medium mb-2">
                      Significance
                    </label>
                    <select
                      value={significance}
                      onChange={(e) => setSignificance(e.target.value)}
                      className="w-full px-4 py-3 bg-obsidian/50 border border-gold/30 rounded-lg text-pearl focus:outline-none focus:border-gold/60 transition-colors"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="milestone">Milestone</option>
                    </select>
                  </div>
                </div>

                {/* Participants */}
                <div>
                  <label className="block text-pearl/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Users size={16} className="text-gold" />
                    Participants
                  </label>
                  <input
                    type="text"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian/50 border border-gold/30 rounded-lg text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors"
                    placeholder="John, Mary, Sarah (comma-separated)"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-pearl/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Tag size={16} className="text-gold" />
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-3 bg-obsidian/50 border border-gold/30 rounded-lg text-pearl placeholder-pearl/40 focus:outline-none focus:border-gold/60 transition-colors"
                    placeholder="family, celebration, milestone (comma-separated)"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-gold/30 text-pearl rounded-lg hover:bg-gold/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gold to-gold/80 text-obsidian font-semibold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating...' : 'Create Memory'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
