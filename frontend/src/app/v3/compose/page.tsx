'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, Users, Calendar, Check, ArrowLeft, ArrowRight, Save, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'

/**
 * V3 Compose Page - Letter/Memory Wizard
 * 
 * Design: Distraction-free editor with guided wizard flow
 * Steps:
 * 1. Write (editor with prompts)
 * 2. Recipients (select who receives this)
 * 3. Release (when to deliver)
 * 4. Confirm (review and save)
 */

type Step = 'write' | 'recipients' | 'release' | 'confirm'

export default function ComposePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('write')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [releaseType, setReleaseType] = useState<'death' | 'scheduled'>('death')
  const [scheduledDate, setScheduledDate] = useState('')
  const [saving, setSaving] = useState(false)

  const steps: { id: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'write', label: 'Write', icon: PenLine },
    { id: 'recipients', label: 'Recipients', icon: Users },
    { id: 'release', label: 'Release', icon: Calendar },
    { id: 'confirm', label: 'Confirm', icon: Check },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    router.push('/v3/vault')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'write':
        return title.trim() && content.trim()
      case 'recipients':
        return selectedRecipients.length > 0
      case 'release':
        return releaseType === 'death' || (releaseType === 'scheduled' && scheduledDate)
      case 'confirm':
        return true
      default:
        return false
    }
  }

  return (
    <PrivacyGate>
      <div className="min-h-screen bg-paper">
        {/* Header with Progress */}
        <div className="border-b border-divider bg-white sticky top-0 z-10">
          <div className="max-w-reading mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/v3/dashboard')}
                className="flex items-center gap-2 text-ink/60 hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Cancel</span>
              </button>
              <h1 className="font-serif text-2xl text-navy-500">Compose Letter</h1>
              <div className="w-20" /> {/* Spacer for centering */}
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = step.id === currentStep
                const isCompleted = index < currentStepIndex

                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-navy-500 text-white'
                            : isCompleted
                            ? 'bg-sage-500 text-white'
                            : 'bg-paper text-ink/40'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          isActive ? 'text-navy-500' : isCompleted ? 'text-sage-600' : 'text-ink/40'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 h-0.5 mb-6 transition-colors ${
                          isCompleted ? 'bg-sage-500' : 'bg-divider'
                        }`}
                      />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-reading mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Write */}
            {currentStep === 'write' && (
              <motion.div
                key="write"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif text-2xl text-navy-500 mb-2">Write Your Letter</h2>
                  <p className="text-ink/60">Share a memory, write a letter, or record your thoughts for the future.</p>
                </div>

                <div className="bg-white rounded-lg border border-divider p-6 space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-ink mb-2">
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      placeholder="Give your letter a title..."
                      autoFocus
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-ink mb-2">
                      Content
                    </label>
                    <textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent resize-none font-body text-md leading-relaxed"
                      placeholder="Start writing..."
                    />
                    <p className="text-xs text-ink/40 mt-2">
                      Your content is encrypted locally before upload. We cannot read your letters.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Recipients */}
            {currentStep === 'recipients' && (
              <motion.div
                key="recipients"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif text-2xl text-navy-500 mb-2">Choose Recipients</h2>
                  <p className="text-ink/60">Who should receive this letter after you're gone?</p>
                </div>

                <div className="bg-white rounded-lg border border-divider p-6">
                  <p className="text-sm text-ink/60 mb-4">
                    You haven't added any recipients yet. Add recipients in your{' '}
                    <button
                      onClick={() => router.push('/v3/recipients')}
                      className="text-navy-500 hover:underline"
                    >
                      Recipients settings
                    </button>
                    .
                  </p>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">No recipients configured</p>
                      <p>Add at least one recipient to continue.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Release */}
            {currentStep === 'release' && (
              <motion.div
                key="release"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif text-2xl text-navy-500 mb-2">Release Plan</h2>
                  <p className="text-ink/60">When should this letter be delivered?</p>
                </div>

                <div className="bg-white rounded-lg border border-divider p-6 space-y-4">
                  <label className="flex items-start gap-4 p-4 border-2 border-divider rounded-lg cursor-pointer hover:border-navy-500 transition-colors">
                    <input
                      type="radio"
                      name="release"
                      checked={releaseType === 'death'}
                      onChange={() => setReleaseType('death')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-ink mb-1">After I'm gone (Default)</p>
                      <p className="text-sm text-ink/60">
                        This letter will be delivered to recipients after your death is verified by trusted contacts.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 p-4 border-2 border-divider rounded-lg cursor-pointer hover:border-navy-500 transition-colors">
                    <input
                      type="radio"
                      name="release"
                      checked={releaseType === 'scheduled'}
                      onChange={() => setReleaseType('scheduled')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-ink mb-1">Scheduled date</p>
                      <p className="text-sm text-ink/60 mb-3">
                        Deliver this letter on a specific date (birthday, anniversary, etc.)
                      </p>
                      {releaseType === 'scheduled' && (
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="px-4 py-2 border border-divider rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      )}
                    </div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirm */}
            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-serif text-2xl text-navy-500 mb-2">Review & Save</h2>
                  <p className="text-ink/60">Review your letter before saving to your vault.</p>
                </div>

                <div className="bg-white rounded-lg border border-divider p-6 space-y-6">
                  <div>
                    <p className="text-sm font-medium text-ink/60 mb-1">Title</p>
                    <p className="text-lg font-serif text-navy-500">{title}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink/60 mb-2">Content Preview</p>
                    <div className="p-4 bg-paper rounded-lg">
                      <p className="text-ink/80 whitespace-pre-wrap line-clamp-6">{content}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink/60 mb-1">Recipients</p>
                    <p className="text-ink">
                      {selectedRecipients.length > 0
                        ? `${selectedRecipients.length} recipient(s)`
                        : 'No recipients selected'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink/60 mb-1">Release</p>
                    <p className="text-ink">
                      {releaseType === 'death'
                        ? 'After death verification'
                        : `Scheduled for ${new Date(scheduledDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                <div className="bg-sage-50 border border-sage-200 rounded-lg p-4 flex items-start gap-3">
                  <Check className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-sage-800">
                    <p className="font-medium mb-1">Encrypted & Secure</p>
                    <p>Your letter will be encrypted locally before being saved to your vault.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-divider">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-6 py-3 text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep === 'confirm' ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-navy-500 text-white rounded-lg font-medium hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save to Vault'}</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-navy-500 text-white rounded-lg font-medium hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </PrivacyGate>
  )
}
