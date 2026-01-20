/**
 * OnboardingFlow Component
 * Guided onboarding experience for first-time users
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
}

// Default onboarding illustrations
const WelcomeIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="welcomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c9a959" />
        <stop offset="100%" stopColor="#e8d5a3" />
      </linearGradient>
    </defs>
    <motion.path
      d="M130 80c20 0 20 30 0 30-20 0-28-30-48-30-18 0-18 30 0 30 20 0 28-30 48-30z"
      stroke="url(#welcomeGradient)"
      strokeWidth="4"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
    />
    {[
      { cx: 50, cy: 40, r: 3 },
      { cx: 150, cy: 40, r: 2.5 },
      { cx: 100, cy: 30, r: 3.5 },
      { cx: 70, cy: 130, r: 2 },
      { cx: 130, cy: 130, r: 2.5 },
    ].map((star, i) => (
      <motion.circle
        key={i}
        cx={star.cx}
        cy={star.cy}
        r={star.r}
        fill="#c9a959"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
      />
    ))}
  </svg>
);

const MemoriesIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.rect
      x="50" y="40" width="100" height="80" rx="4"
      stroke="#c9a959" strokeWidth="2" fill="rgba(201, 169, 89, 0.1)"
      animate={{ y: [40, 35, 40] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <motion.rect
      x="60" y="50" width="80" height="60" rx="2"
      fill="rgba(201, 169, 89, 0.2)"
    />
    <circle cx="80" cy="70" r="8" fill="rgba(201, 169, 89, 0.4)" />
    <path d="M60 100 L85 80 L105 90 L140 65 L140 110 L60 110 Z" fill="rgba(201, 169, 89, 0.3)" />
  </svg>
);

const LettersIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.rect
      x="40" y="50" width="120" height="80" rx="4"
      stroke="#c9a959" strokeWidth="2" fill="rgba(201, 169, 89, 0.1)"
      animate={{ y: [50, 45, 50] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <path d="M40 50 L100 90 L160 50" stroke="#c9a959" strokeWidth="2" fill="none" />
    <motion.circle
      cx="100" cy="90" r="15"
      fill="#8b2942"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <path d="M108 90c3 0 3 5 0 5-3 0-4-5-7-5-2.5 0-2.5 5 0 5 3 0 4-5 7-5z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
  </svg>
);

const FamilyIllustration = () => (
  <svg viewBox="0 0 200 160" className="w-48 h-40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 130 L100 90 M100 90 L70 60 M100 90 L130 60" stroke="#c9a959" strokeWidth="3" strokeLinecap="round" />
    <motion.circle cx="100" cy="90" r="12" fill="#c9a959" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} />
    <motion.circle cx="70" cy="60" r="10" fill="rgba(201, 169, 89, 0.7)" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
    <motion.circle cx="130" cy="60" r="10" fill="rgba(201, 169, 89, 0.7)" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
  </svg>
);

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Heirloom',
    description: 'Your sanctuary for preserving precious memories and heartfelt messages for generations to come.',
    illustration: <WelcomeIllustration />,
  },
  {
    id: 'memories',
    title: 'Capture Your Memories',
    description: 'Upload photos, write stories, and preserve the moments that matter most to your family.',
    illustration: <MemoriesIllustration />,
  },
  {
    id: 'letters',
    title: 'Write Timeless Letters',
    description: 'Compose heartfelt letters to be delivered to your loved ones at the perfect moment.',
    illustration: <LettersIllustration />,
  },
  {
    id: 'family',
    title: 'Build Your Family Tree',
    description: 'Connect generations by adding family members and sharing your legacy with those who matter.',
    illustration: <FamilyIllustration />,
  },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  steps = defaultSteps,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/95 backdrop-blur-lg safe-area-all">
      <div className="w-full max-w-lg mx-4">
        {/* Skip button */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="absolute top-6 right-6 text-paper/50 hover:text-paper text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Skip onboarding"
          >
            Skip
          </button>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8" role="tablist" aria-label="Onboarding progress">
          {steps.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center`}
              role="tab"
              aria-selected={index === currentStep}
              aria-label={`Step ${index + 1}: ${s.title}`}
            >
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-gold w-6'
                    : index < currentStep
                    ? 'bg-gold/60'
                    : 'bg-paper/20'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Illustration */}
            <div className="flex justify-center mb-8">
              {step.illustration}
            </div>

            {/* Title */}
            <h2 className="text-3xl font-display text-paper mb-4">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-paper/70 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              {step.description}
            </p>

            {/* Step action */}
            {step.action && (
              <button
                onClick={step.action.onClick}
                className="btn btn-secondary mb-4"
              >
                {step.action.label}
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`btn btn-ghost min-h-[44px] min-w-[44px] ${
              currentStep === 0 ? 'opacity-0 pointer-events-none' : ''
            }`}
            aria-label="Previous step"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="btn btn-primary min-h-[44px] px-8"
          >
            {isLastStep ? 'Get Started' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * OnboardingTooltip - Contextual tooltip for feature discovery
 */
interface OnboardingTooltipProps {
  target: React.RefObject<HTMLElement>;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onDismiss: () => void;
  onNext?: () => void;
  step?: number;
  totalSteps?: number;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  title,
  description,
  position = 'bottom',
  onDismiss,
  onNext,
  step,
  totalSteps,
}) => {
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
      className={`absolute ${positionClasses[position]} z-50 w-64 p-4 bg-void-light border border-gold/30 rounded-xl shadow-xl`}
    >
      {/* Arrow */}
      <div
        className={`absolute w-3 h-3 bg-void-light border-gold/30 transform rotate-45 ${
          position === 'top' ? 'bottom-[-6px] border-r border-b' :
          position === 'bottom' ? 'top-[-6px] border-l border-t' :
          position === 'left' ? 'right-[-6px] border-t border-r' :
          'left-[-6px] border-b border-l'
        }`}
        style={{ left: position === 'top' || position === 'bottom' ? '50%' : undefined }}
      />

      <h4 className="text-paper font-medium mb-1">{title}</h4>
      <p className="text-paper/60 text-sm mb-3">{description}</p>

      <div className="flex items-center justify-between">
        {step && totalSteps && (
          <span className="text-paper/40 text-xs">
            {step} of {totalSteps}
          </span>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onDismiss}
            className="text-paper/50 hover:text-paper text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            Dismiss
          </button>
          {onNext && (
            <button
              onClick={onNext}
              className="text-gold hover:text-gold-bright text-sm font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
