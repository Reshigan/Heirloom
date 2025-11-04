'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Play, Pause, StopCircle, Calendar, User, Heart, X } from 'lucide-react'

interface LegacyVideoRecorderProps {
  onSave: (video: {
    title: string
    recipient: string
    occasion: string
    recordedAt: Date
    duration: number
  }) => void
  onClose: () => void
}

const occasionTemplates = [
  { id: 'wedding', label: 'Wedding Day', icon: '💍', prompt: 'Share your wisdom and blessings for their marriage' },
  { id: 'graduation', label: 'Graduation', icon: '🎓', prompt: 'Celebrate their achievement and offer guidance' },
  { id: 'birthday-18', label: '18th Birthday', icon: '🎂', prompt: 'Mark their transition to adulthood' },
  { id: 'birthday-21', label: '21st Birthday', icon: '🥂', prompt: 'Share life lessons and encouragement' },
  { id: 'first-child', label: 'First Child', icon: '👶', prompt: 'Welcome them to parenthood' },
  { id: 'retirement', label: 'Retirement', icon: '🌅', prompt: 'Reflect on their career and future' },
  { id: 'anniversary', label: 'Anniversary', icon: '💝', prompt: 'Celebrate their love and commitment' },
  { id: 'custom', label: 'Custom Occasion', icon: '✨', prompt: 'Create your own special message' }
]

export default function LegacyVideoRecorder({ onSave, onClose }: LegacyVideoRecorderProps) {
  const [step, setStep] = useState<'setup' | 'recording' | 'preview'>('setup')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    recipient: '',
    occasion: '',
    customOccasion: ''
  })

  const selectedOccasion = occasionTemplates.find(t => t.id === formData.occasion)

  const handleStartRecording = () => {
    setStep('recording')
    setIsRecording(true)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setStep('preview')
  }

  const handleSave = () => {
    onSave({
      title: formData.title,
      recipient: formData.recipient,
      occasion: formData.occasion === 'custom' ? formData.customOccasion : selectedOccasion?.label || '',
      recordedAt: new Date(),
      duration
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-modal max-w-2xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-gold-400 flex items-center gap-2">
            <Video className="w-6 h-6" />
            Record Legacy Video Message
          </h2>
          <button onClick={onClose} className="glass-icon-button p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="text-sm text-pearl/70 mb-2 block">Video Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="glass-input w-full"
                  placeholder="e.g., To My Daughter on Her Wedding Day"
                />
              </div>

              <div>
                <label className="text-sm text-pearl/70 mb-2 block">Recipient</label>
                <div className="glass-input-container">
                  <User className="w-5 h-5 text-gold-400" />
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="glass-input"
                    placeholder="Who is this message for?"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-pearl/70 mb-3 block">Occasion</label>
                <div className="grid grid-cols-2 gap-3">
                  {occasionTemplates.map((template) => {
                    const isSelected = formData.occasion === template.id

                    return (
                      <button
                        key={template.id}
                        onClick={() => setFormData({ ...formData, occasion: template.id })}
                        className={`glass-card p-4 text-left transition-all ${
                          isSelected ? 'border-gold-500/60' : 'border-gold-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-pearl text-sm">{template.label}</h4>
                              {isSelected && <div className="w-2 h-2 rounded-full bg-gold-400" />}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-pearl/60">{template.prompt}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {formData.occasion === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="text-sm text-pearl/70 mb-2 block">Custom Occasion</label>
                  <input
                    type="text"
                    value={formData.customOccasion}
                    onChange={(e) => setFormData({ ...formData, customOccasion: e.target.value })}
                    className="glass-input w-full"
                    placeholder="Describe the occasion"
                  />
                </motion.div>
              )}

              {selectedOccasion && (
                <div className="glass-card p-4 bg-gold-500/10 border-gold-500/30">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gold-400 mb-1">Recording Tip</h4>
                      <p className="text-xs text-pearl/80">{selectedOccasion.prompt}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartRecording}
                disabled={!formData.title || !formData.recipient || !formData.occasion}
                className="glass-button-primary w-full"
              >
                <Video className="w-5 h-5 inline mr-2" />
                Start Recording
              </button>
            </motion.div>
          )}

          {step === 'recording' && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Video Preview Area */}
              <div className="aspect-video bg-obsidian-900 rounded-lg border-2 border-gold-500/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent" />
                <div className="text-center z-10">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center mx-auto mb-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500" />
                  </motion.div>
                  <p className="text-pearl/80 text-lg font-medium">Recording...</p>
                  <p className="text-pearl/60 text-sm mt-2">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="glass-icon-button w-14 h-14"
                >
                  {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                </button>
                <button
                  onClick={handleStopRecording}
                  className="glass-button-primary px-6 py-3"
                >
                  <StopCircle className="w-5 h-5 inline mr-2" />
                  Stop Recording
                </button>
              </div>

              <div className="glass-card p-4">
                <h4 className="text-sm font-semibold text-gold-400 mb-2">
                  To: {formData.recipient}
                </h4>
                <p className="text-xs text-pearl/60">
                  {selectedOccasion?.label || formData.customOccasion}
                </p>
              </div>
            </motion.div>
          )}

          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="aspect-video bg-obsidian-900 rounded-lg border-2 border-gold-500/30 flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 text-gold-400 mx-auto mb-4" />
                  <p className="text-pearl/80">Video Preview</p>
                  <p className="text-pearl/60 text-sm mt-2">Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</p>
                </div>
              </div>

              <div className="glass-card p-4">
                <h4 className="text-lg font-semibold text-gold-400 mb-2">{formData.title}</h4>
                <div className="flex items-center gap-4 text-sm text-pearl/70">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {formData.recipient}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedOccasion?.label || formData.customOccasion}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('recording')}
                  className="glass-button flex-1"
                >
                  Re-record
                </button>
                <button
                  onClick={handleSave}
                  className="glass-button-primary flex-1"
                >
                  Save to Vault
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
