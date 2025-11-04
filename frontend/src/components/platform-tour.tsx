'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  targetSelector: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Heirloom',
    description: 'Your private posthumous vault platform. Your memories remain sealed during your lifetime and are only accessible after death via Legacy Token redemption.',
    targetSelector: '[data-tour="logo"]',
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'Access all vault features from this navigation bar: Memories, Timeline, Family Tree, Vault Health, Executors, AI Features, and more.',
    targetSelector: '[data-tour="navigation"]',
    position: 'bottom'
  },
  {
    id: 'constellation',
    title: 'Memory Constellation',
    description: 'Your private memories displayed as floating orbs. Add photos, videos, audio, documents, and legacy video messages. All content is encrypted and sealed until token redemption.',
    targetSelector: '[data-tour="constellation"]',
    position: 'top'
  },
  {
    id: 'timeline',
    title: 'Timeline View',
    description: 'Navigate through your memories chronologically. Filter by emotion (Joy, Love, Nostalgia, etc.), type, and significance.',
    targetSelector: '[data-tour="timeline-nav"]',
    position: 'bottom'
  },
  {
    id: 'family',
    title: 'Family Tree',
    description: 'Visualize your family relationships. When someone passes and their vault is unsealed via token, their memories integrate into the family tree.',
    targetSelector: '[data-tour="family-nav"]',
    position: 'bottom'
  },
  {
    id: 'legacy',
    title: 'Legacy Tokens',
    description: 'Generate secure tokens (HLM_LEG_*) that unlock your vault after death. Tokens can be redeemed multiple times and regenerated if needed.',
    targetSelector: '[data-tour="legacy-nav"]',
    position: 'bottom'
  },
  {
    id: 'health',
    title: 'Vault Health Monitor',
    description: 'Track your vault completion percentage, missing metadata (emotions, locations, dates), and get suggestions to improve your vault.',
    targetSelector: '[data-tour="health-nav"]',
    position: 'bottom'
  },
  {
    id: 'executors',
    title: 'Executors & Guardians',
    description: 'Designate trusted people to manage your vault after death. They can approve token redemptions and handle administrative tasks.',
    targetSelector: '[data-tour="executors-nav"]',
    position: 'bottom'
  },
  {
    id: 'ai',
    title: 'AI Features',
    description: 'Auto-detect emotions from photos, generate memory books, enhance images, and create voice clones for legacy messages. All processing is private.',
    targetSelector: '[data-tour="ai-nav"]',
    position: 'bottom'
  },
  {
    id: 'privacy',
    title: 'Privacy Levels',
    description: 'Set privacy levels for each memory: Public (all token redeemers), Private (only you), or Restricted (specific people). You can also time-lock memories for future dates.',
    targetSelector: '[data-tour="constellation"]',
    position: 'top'
  }
]

interface PlatformTourProps {
  onComplete: () => void
  onSkip: () => void
}

export default function PlatformTour({ onComplete, onSkip }: PlatformTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetPosition, setTargetPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })

  useEffect(() => {
    updateTargetPosition()
    window.addEventListener('resize', updateTargetPosition)
    return () => window.removeEventListener('resize', updateTargetPosition)
  }, [currentStep])

  const updateTargetPosition = () => {
    const step = tourSteps[currentStep]
    const element = document.querySelector(step.targetSelector)
    
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      })
    }
  }

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('heirloom-tour-completed', 'true')
    onComplete()
  }

  const handleSkipTour = () => {
    localStorage.setItem('heirloom-tour-completed', 'true')
    onSkip()
  }

  const step = tourSteps[currentStep]
  const tooltipPosition = getTooltipPosition()

  function getTooltipPosition() {
    const padding = 20
    let top = targetPosition.top
    let left = targetPosition.left

    switch (step.position) {
      case 'top':
        top = targetPosition.top - 200 - padding
        left = targetPosition.left + targetPosition.width / 2
        break
      case 'bottom':
        top = targetPosition.top + targetPosition.height + padding
        left = targetPosition.left + targetPosition.width / 2
        break
      case 'left':
        top = targetPosition.top + targetPosition.height / 2
        left = targetPosition.left - 350 - padding
        break
      case 'right':
        top = targetPosition.top + targetPosition.height / 2
        left = targetPosition.left + targetPosition.width + padding
        break
    }

    return { top, left }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Overlay with spotlight effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 pointer-events-auto"
          onClick={handleSkipTour}
        />

        {/* Spotlight highlight */}
        <motion.div
          className="absolute border-2 border-gold-500 rounded-lg pointer-events-none"
          animate={{
            top: targetPosition.top - 8,
            left: targetPosition.left - 8,
            width: targetPosition.width + 16,
            height: targetPosition.height + 16,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 40px rgba(212, 175, 55, 0.5)'
          }}
        />

        {/* Tooltip */}
        <motion.div
          className="absolute glass-card pointer-events-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            width: '350px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gold-500 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-pearl/60">
                  Step {currentStep + 1} of {tourSteps.length}
                </p>
              </div>
              <button
                onClick={handleSkipTour}
                className="glass-icon-button p-2"
                aria-label="Close tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-pearl/80 mb-6 leading-relaxed">
              {step.description}
            </p>

            {/* Progress bar */}
            <div className="glass-progress-track mb-6">
              <div 
                className="glass-progress-fill"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="glass-button flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={handleSkipTour}
                className="glass-button text-pearl/60 hover:text-pearl"
              >
                Skip Tour
              </button>

              <button
                onClick={handleNext}
                className="glass-button-primary flex items-center gap-2"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
