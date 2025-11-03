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
    description: 'Your family heritage preservation platform. Let\'s take a quick tour of the key features.',
    targetSelector: '[data-tour="logo"]',
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'Access all major features from this navigation bar: Memories, Timeline, Family Tree, and more.',
    targetSelector: '[data-tour="navigation"]',
    position: 'bottom'
  },
  {
    id: 'constellation',
    title: 'Memory Constellation',
    description: 'Your memories displayed as floating orbs around a central showcase. Hover over orbs to explore, click to view details.',
    targetSelector: '[data-tour="constellation"]',
    position: 'top'
  },
  {
    id: 'timeline',
    title: 'Timeline View',
    description: 'Navigate through your family history chronologically. Filter by era, type, and significance.',
    targetSelector: '[data-tour="timeline-nav"]',
    position: 'bottom'
  },
  {
    id: 'family',
    title: 'Family Tree',
    description: 'Visualize your family relationships across generations with an interactive tree diagram.',
    targetSelector: '[data-tour="family-nav"]',
    position: 'bottom'
  },
  {
    id: 'legacy',
    title: 'Legacy Tokens',
    description: 'Create secure access tokens for posthumous memory access and digital inheritance.',
    targetSelector: '[data-tour="legacy-nav"]',
    position: 'bottom'
  },
  {
    id: 'storage',
    title: 'Storage Optimizer',
    description: 'Manage your media files with intelligent compression and storage analytics.',
    targetSelector: '[data-tour="storage-nav"]',
    position: 'bottom'
  },
  {
    id: 'share',
    title: 'Share & Invite',
    description: 'Invite family members and control access to your shared memories.',
    targetSelector: '[data-tour="share-nav"]',
    position: 'bottom'
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
