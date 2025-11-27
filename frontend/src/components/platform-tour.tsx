'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface TourStep {
  target: string
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    target: '[data-testid="add-memory-btn"]',
    title: 'Upload Memories',
    description: 'Add photos, videos, and documents to your private vault. Everything is encrypted client-side before upload.',
    position: 'bottom'
  },
  {
    target: '[data-testid="nav-recipients"]',
    title: 'Manage Recipients',
    description: 'Choose who receives your memories when the time comes. Set up trusted family members and friends.',
    position: 'bottom'
  },
  {
    target: '[data-testid="nav-checkin"]',
    title: 'Check-in System',
    description: 'Regular check-ins keep your vault secure. Miss check-ins trigger the unlock process for your recipients.',
    position: 'bottom'
  },
  {
    target: '[data-testid="nav-contacts"]',
    title: 'Trusted Contacts',
    description: 'Add emergency contacts who can verify your status if you miss check-ins.',
    position: 'bottom'
  },
  {
    target: '[data-testid="nav-stats"]',
    title: 'Vault Statistics',
    description: 'Monitor your vault usage, check-in history, and recipient status at a glance.',
    position: 'bottom'
  }
]

interface PlatformTourProps {
  onComplete: () => void
  onSkip: () => void
}

export default function PlatformTour({ onComplete, onSkip }: PlatformTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsVisible(true)
      updateTargetPosition()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    updateTargetPosition()
    
    // Update position on window resize
    const handleResize = () => updateTargetPosition()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [currentStep])

  const updateTargetPosition = () => {
    const step = tourSteps[currentStep]
    const element = document.querySelector(step.target)
    
    if (element) {
      const rect = element.getBoundingClientRect()
      setTargetRect(rect)
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
    setIsVisible(false)
    setTimeout(onComplete, 300)
  }

  const handleSkipTour = () => {
    setIsVisible(false)
    setTimeout(onSkip, 300)
  }

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%' }

    const step = tourSteps[currentStep]
    const padding = 20

    switch (step.position) {
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)'
        }
      case 'top':
        return {
          top: `${targetRect.top - padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        }
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left - padding}px`,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translateY(-50%)'
        }
      default:
        return { top: '50%', left: '50%' }
    }
  }

  const getSpotlightStyle = () => {
    if (!targetRect) return {}

    return {
      top: `${targetRect.top - 8}px`,
      left: `${targetRect.left - 8}px`,
      width: `${targetRect.width + 16}px`,
      height: `${targetRect.height + 16}px`
    }
  }

  const step = tourSteps[currentStep]

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-obsidian-900/80 backdrop-blur-sm z-[9998]"
            onClick={handleSkipTour}
          />

          {/* Spotlight */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="fixed z-[9999] pointer-events-none"
              style={getSpotlightStyle()}
            >
              <div className="absolute inset-0 rounded-lg border-2 border-gold-400 shadow-[0_0_30px_rgba(212,175,55,0.5)]" />
              <div className="absolute inset-0 rounded-lg bg-gold-400/5" />
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="fixed z-[10000] max-w-sm"
            style={getTooltipPosition()}
          >
            <div className="bg-gradient-to-br from-charcoal/95 via-charcoal/90 to-obsidian/95 backdrop-blur-xl border border-gold/30 rounded-xl shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                  <h3 className="text-lg font-serif text-gold-400 tracking-wide">
                    {step.title}
                  </h3>
                </div>
                <button
                  onClick={handleSkipTour}
                  className="text-gold-200/50 hover:text-gold-400 transition-colors"
                  aria-label="Close tour"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-gold-200/80 text-sm leading-relaxed mb-6">
                {step.description}
              </p>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-4">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'bg-gold-400'
                        : index < currentStep
                        ? 'bg-gold-400/50'
                        : 'bg-gold-400/20'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gold-200/50 tracking-wider">
                  {currentStep + 1} of {tourSteps.length}
                </div>
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="px-4 py-2 rounded-lg border border-gold/30 text-gold-400 hover:bg-gold/10 transition-all text-sm flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold/30 to-gold/20 border border-gold/40 text-gold-400 hover:from-gold/40 hover:to-gold/30 transition-all text-sm flex items-center gap-2"
                  >
                    {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
                    {currentStep < tourSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
