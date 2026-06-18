/**
 * Feature Onboarding Component
 * Provides guided walkthroughs for advanced features with emotional appeal
 * explaining "why" users should use each feature and "how" to get started
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../lib/useFocusTrap';
import { EASE_ARRAY } from '../loom/motion';

interface OnboardingStep {
  title: string;
  description: string;
  whyItMatters: string;
  howToStart: string;
}

interface FeatureOnboardingProps {
  featureKey: 'legacy-plan' | 'story-artifacts' | 'life-events' | 'recipient-experience';
  onComplete: () => void;
  onDismiss: () => void;
  isOpen: boolean;
}

const FEATURE_CONFIGS: Record<string, {
  title: string;
  subtitle: string;
  steps: OnboardingStep[];
}> = {
  'legacy-plan': {
    title: 'Legacy Playbook',
    subtitle: 'Your personal guide to preserving what matters most',
    steps: [
      {
        title: 'Why This Matters',
        description: 'One day, the people you love will wish they had more of your stories. This playbook helps you capture them before they fade.',
        whyItMatters: 'Most families lose 90% of their stories within two generations. Your grandchildren may never know the moments that shaped you.',
        howToStart: 'Think of one person you love. What do they not know about you that they should?',
      },
      {
        title: 'People to Remember',
        description: 'Start with the people who matter most. Who should receive your stories?',
        whyItMatters: 'When you name specific people, your stories become gifts rather than archives. A letter to your daughter hits differently than a letter to "my family."',
        howToStart: 'Add 1-3 people. For each, think: "What do I want them to know about me?"',
      },
      {
        title: 'Stories to Tell',
        description: 'The moments that shaped who you are deserve to be remembered.',
        whyItMatters: 'Your struggles, victories, and ordinary days contain wisdom your family will need. The story of how you met your partner, survived a hard year, or learned a lesson.',
        howToStart: 'Pick one story from your childhood, one from adulthood, and one lesson you learned the hard way.',
      },
      {
        title: 'Track Your Progress',
        description: 'Check off items as you complete them. Share your progress with family if you want accountability.',
        whyItMatters: 'Legacy building is a journey, not a task. Seeing your progress keeps you motivated and shows your family you care.',
        howToStart: 'Aim to complete one item per week. In a few months, you\'ll have a meaningful collection.',
      },
    ],
  },
  'story-artifacts': {
    title: 'Story Artifacts',
    subtitle: 'Turn your memories into something they can rewatch',
    steps: [
      {
        title: 'Why This Matters',
        description: 'Photos in a folder get forgotten. A curated story with your voice becomes a treasure.',
        whyItMatters: 'Your family doesn\'t just want your photos - they want to know what those moments meant to you. A slideshow with your narration is worth more than a thousand unlabeled images.',
        howToStart: 'Think of a theme: "Our first year together," "Lessons from Dad," or "The house I grew up in."',
      },
      {
        title: 'Choose Your Photos',
        description: 'Select 5-10 photos that tell a story together.',
        whyItMatters: 'Curation is love. Choosing which moments to include shows your family what mattered to you.',
        howToStart: 'Start with photos that make you feel something. If you smile or tear up looking at it, include it.',
      },
      {
        title: 'Add Your Voice',
        description: 'Record a narration to accompany your photos.',
        whyItMatters: 'Your voice is irreplaceable. Years from now, hearing you tell the story will mean everything.',
        howToStart: 'Don\'t script it. Just look at each photo and say what comes to mind. "This was the day..." or "I remember feeling..."',
      },
      {
        title: 'Share Your Story',
        description: 'Generate a shareable link to send to family.',
        whyItMatters: 'Stories are meant to be shared. Sending this to your family says "I made this for you."',
        howToStart: 'Send it to one person first. Their reaction will motivate you to create more.',
      },
    ],
  },
  'life-events': {
    title: 'Life Event Triggers',
    subtitle: 'Be present for milestones - even years from now',
    steps: [
      {
        title: 'Why This Matters',
        description: 'You can\'t predict when life\'s big moments will happen, but your love can still arrive on time.',
        whyItMatters: 'Imagine your child opening a letter from you on their wedding day, or your grandchild hearing your voice when they graduate. These moments become sacred.',
        howToStart: 'Think of one milestone someone you love will experience. What would you want to say to them?',
      },
      {
        title: 'Choose the Moment',
        description: 'Select from common milestones or create your own.',
        whyItMatters: 'Graduations, weddings, first children, hard days - these are the moments when your words will matter most.',
        howToStart: 'Start with something certain: a graduation date, a milestone birthday, or a wedding you know is coming.',
      },
      {
        title: 'Create Your Message',
        description: 'Write a letter, record a video, or attach memories.',
        whyItMatters: 'This isn\'t a generic card. It\'s a message from you, written with full knowledge of who they are and what they\'re about to experience.',
        howToStart: 'Write as if you\'re sitting with them. "I know today is big for you..." or "I\'ve been thinking about this day..."',
      },
      {
        title: 'Set the Trigger',
        description: 'Choose when and how your message gets delivered.',
        whyItMatters: 'You control the timing. Manual triggers let you send when you\'re ready. Scheduled triggers ensure delivery even if you\'re not here.',
        howToStart: 'For your first trigger, use manual delivery so you can see how it works.',
      },
    ],
  },
  'recipient-experience': {
    title: 'Recipient Experience',
    subtitle: 'Invite family to help you remember',
    steps: [
      {
        title: 'Why This Matters',
        description: 'Your story isn\'t just yours. The people who love you carry pieces of it too.',
        whyItMatters: 'Your children remember moments you\'ve forgotten. Your siblings know stories you never heard. Together, you can preserve more than any one person could alone.',
        howToStart: 'Think of one person who knows stories about you that you don\'t have recorded.',
      },
      {
        title: 'Staged Releases',
        description: 'Control how your legacy is revealed over time.',
        whyItMatters: 'Grief is a journey. Releasing everything at once can overwhelm. Staged releases give your family comfort when they need it and deeper reflections over time.',
        howToStart: 'Review the default stages. They\'re designed by grief counselors to support healthy processing.',
      },
      {
        title: 'Family Memory Room',
        description: 'Create a shared space where family can contribute.',
        whyItMatters: 'When family members add their own photos and stories, your legacy becomes richer. It\'s no longer just your perspective - it\'s a family portrait.',
        howToStart: 'Enable the memory room and send the link to one family member you trust.',
      },
      {
        title: 'Moderation & Privacy',
        description: 'You control what gets added and who can see it.',
        whyItMatters: 'This is your legacy. You decide what belongs and what doesn\'t. Moderation ensures only meaningful contributions are included.',
        howToStart: 'Enable moderation to review contributions before they\'re added. You can always change this later.',
      },
    ],
  },
};

export function FeatureOnboarding({ featureKey, onComplete, onDismiss, isOpen }: FeatureOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const config = FEATURE_CONFIGS[featureKey];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useFocusTrap(dialogRef, onDismiss, isOpen);

  if (!config) return null;

  const step = config.steps[currentStep];
  const isLastStep = currentStep === config.steps.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.36, ease: EASE_ARRAY }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'var(--ink-translucent)' }}
          onClick={onDismiss}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-onboarding-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.36, ease: EASE_ARRAY }}
            className="rounded-none p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--ink-card)', border: '1px solid var(--rule)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-6">
              <div>
                <p className="loom-mono text-[0.7rem] tracking-[0.32em] uppercase mb-2" style={{ color: 'var(--copper-label)' }}>Walkthrough</p>
                <h2 id="feature-onboarding-title" className="font-body font-light text-xl md:text-2xl tracking-[-0.014em]">{config.title}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--bone-dim)' }}>{config.subtitle}</p>
              </div>
              <button
                onClick={onDismiss}
                className="transition-colors duration-fast ease-out text-sm shrink-0"
                style={{ color: 'var(--bone-faint)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
                aria-label="Close walkthrough"
              >
                Close
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {config.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  aria-label={`Go to step ${index + 1}`}
                  className={`h-[2px] rounded-none transition-all duration-fast ease-out ${
                    index === currentStep ? 'w-10' : 'w-6'
                  }`}
                  style={
                    index <= currentStep
                      ? { backgroundColor: 'var(--warm)', opacity: index === currentStep ? 1 : 0.5 }
                      : { backgroundColor: 'var(--bone-ghost)' }
                  }
                />
              ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.36, ease: EASE_ARRAY }}
                className="space-y-6"
              >
                <div>
                  {/* hl-serif keeps this 18px title in Spectral — without it the
                      .loom h1–h6 Cormorant !important rule renders the display
                      face below its 24px legibility floor (the heading trap). */}
                  <h3 className="hl-serif font-body text-lg mb-2" style={{ color: 'var(--bone)' }}>{step.title}</h3>
                  <p className="leading-relaxed" style={{ color: 'var(--bone-dim)' }}>{step.description}</p>
                </div>

                <div className="p-4 rounded-none" style={{ background: 'var(--ink-card)', border: '1px solid var(--rule-warm)' }}>
                  <p className="loom-mono text-[0.65rem] uppercase tracking-[0.22em] mb-1.5" style={{ color: 'var(--copper-label)' }}>Why this matters</p>
                  <p className="leading-relaxed" style={{ color: 'var(--bone-dim)' }}>{step.whyItMatters}</p>
                </div>

                <div className="p-4 rounded-none" style={{ background: 'var(--ink-card)', border: '1px solid var(--rule)' }}>
                  <p className="loom-mono text-[0.65rem] uppercase tracking-[0.22em] mb-1.5" style={{ color: 'var(--bone-faint)' }}>How to start</p>
                  <p className="leading-relaxed" style={{ color: 'var(--bone-dim)' }}>{step.howToStart}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--rule)' }}>
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`hl-btn ${currentStep === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>

              {isLastStep ? (
                <button onClick={onComplete} className="hl-btn">
                  Got it, let's start
                </button>
              ) : (
                <button onClick={() => setCurrentStep(currentStep + 1)} className="hl-btn">
                  Next
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage onboarding state with localStorage persistence
export function useFeatureOnboarding(featureKey: string) {
  const storageKey = `heirloom-onboarding-${featureKey}`;
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(storageKey) === 'true';
  });
  const [isOpen, setIsOpen] = useState(false);

  // Show onboarding automatically on first visit
  useEffect(() => {
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasSeenOnboarding]);

  const completeOnboarding = () => {
    localStorage.setItem(storageKey, 'true');
    setHasSeenOnboarding(true);
    setIsOpen(false);
  };

  const dismissOnboarding = () => {
    setIsOpen(false);
  };

  const openOnboarding = () => {
    setIsOpen(true);
  };

  return {
    isOpen,
    hasSeenOnboarding,
    completeOnboarding,
    dismissOnboarding,
    openOnboarding,
  };
}

// Help button component for reopening onboarding
export function OnboardingHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-6 right-6 z-40 px-4 py-2.5 rounded-none transition-colors duration-fast ease-out text-[0.7rem] loom-mono uppercase tracking-[0.22em]"
      style={{ background: 'var(--ink-card)', border: '1px solid var(--rule-warm)', color: 'var(--warm)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm-bright)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--warm)')}
      title="How does this work?"
      aria-label="How does this work?"
    >
      How does this work?
    </button>
  );
}

export default FeatureOnboarding;
