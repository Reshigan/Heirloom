import { useState, useEffect, useCallback } from 'react';
import type { ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Image, Mic, Mail, Users, Shield, Check } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  image?: string;
  highlight?: string;
  features?: string[];
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Heirloom',
    description: 'Your sanctuary for preserving what matters most. Let us show you around your new digital legacy vault.',
    icon: Check,
    features: [
      'Military-grade encryption for all your memories',
      '14-day free trial, no credit card required',
      'Your data, your control—always',
    ],
  },
  {
    id: 'memories',
    title: 'Memory Vault',
    description: 'Upload photos and videos with rich context. Add stories, dates, and locations so future generations understand not just what happened, but why it mattered.',
    icon: Image,
    highlight: 'memories',
    features: [
      'Drag and drop or click to upload',
      'Add stories and context to every memory',
      'Organize by collections and dates',
      'Share specific memories with family members',
    ],
  },
  {
    id: 'voice',
    title: 'Voice Stories',
    description: 'Record your voice with guided prompts. Capture the stories only you can tell—your laugh, your advice, the way you say "I love you."',
    icon: Mic,
    highlight: 'record',
    features: [
      'Guided prompts to inspire storytelling',
      'High-quality audio recording',
      'Organize recordings by topic or recipient',
      'Your voice, preserved forever',
    ],
  },
  {
    id: 'letters',
    title: 'Time-Capsule Letters',
    description: 'Write letters to be delivered on special occasions—birthdays, weddings, graduations—or when you\'re no longer here. Sealed with encryption until the right moment.',
    icon: Mail,
    highlight: 'compose',
    features: [
      'Schedule delivery for future dates',
      'Posthumous delivery options',
      'Rich text formatting',
      'Sealed and encrypted until delivery',
    ],
  },
  {
    id: 'family',
    title: 'Family Constellation',
    description: 'Map your family tree and designate who receives what. Your constellation connects the stars in your life and ensures memories reach the right people.',
    icon: Users,
    highlight: 'family',
    features: [
      'Visual family tree mapping',
      'Designate recipients for specific content',
      'Multiple contact methods per person',
      'Privacy controls for each connection',
    ],
  },
  {
    id: 'protection',
    title: 'Dead Man\'s Switch',
    description: 'Our gentle verification system ensures your legacy reaches loved ones at the right time. No morbid reminders—just quiet assurance that your wishes are protected.',
    icon: Shield,
    highlight: 'settings',
    features: [
      'Configurable check-in intervals',
      'Multi-contact verification before release',
      'Gradual notification system',
      'Emergency bypass options',
    ],
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Your sanctuary is ready. Start by uploading a memory, recording a voice message, or writing your first letter. Your legacy begins now.',
    icon: Check,
    features: [
      'Begin with what feels right for you',
      'Everything auto-saves as you go',
      'Your privacy is our priority',
      'Need help? We\'re always here',
    ],
  },
];

interface PlatformTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function PlatformTour({ isOpen, onClose, onComplete }: PlatformTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  const goToNext = useCallback(() => {
    if (!isLast) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.();
      onClose();
    }
  }, [isLast, onClose, onComplete]);

  const goToPrev = useCallback(() => {
    if (!isFirst) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirst]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setDirection(0);
    }
  }, [isOpen]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const Icon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(5, 6, 8, 0.9)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl pointer-events-auto"
              style={{
                background: 'linear-gradient(180deg, rgba(18, 21, 28, 0.98) 0%, rgba(10, 12, 16, 0.98) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(201, 169, 89, 0.2)',
                boxShadow: '0 40px 80px rgba(0, 0, 0, 0.6), 0 0 80px rgba(201, 169, 89, 0.1)',
              }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-paper/40 hover:text-paper hover:bg-white/5 transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="absolute top-0 left-0 right-0 h-1 bg-void-light rounded-t-3xl overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{ background: 'linear-gradient(90deg, #c9a959 0%, #e8d5a3 100%)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-8 pt-12 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center relative"
                      style={{
                        background: 'linear-gradient(135deg, rgba(201, 169, 89, 0.2) 0%, rgba(201, 169, 89, 0.05) 100%)',
                        border: '1px solid rgba(201, 169, 89, 0.3)',
                      }}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Icon size={36} className="text-gold" />
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: 'radial-gradient(circle, rgba(201, 169, 89, 0.2) 0%, transparent 70%)',
                          filter: 'blur(10px)',
                        }}
                      />
                    </motion.div>

                    <div className="text-center mb-2">
                      <span className="text-gold/60 text-sm tracking-wider">
                        Step {currentStep + 1} of {tourSteps.length}
                      </span>
                    </div>

                    <h2 className="text-3xl font-light text-center text-paper mb-4">
                      {step.title}
                    </h2>

                    <p className="text-paper/60 text-center text-lg mb-8 max-w-md mx-auto leading-relaxed">
                      {step.description}
                    </p>

                    {step.features && (
                      <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                        {step.features.map((feature, index) => (
                          <motion.div
                            key={feature}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-xl"
                            style={{ background: 'rgba(201, 169, 89, 0.05)' }}
                          >
                            <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check size={12} className="text-gold" />
                            </div>
                            <span className="text-paper/70 text-sm">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="px-8 pb-8 flex items-center justify-between">
                <div className="flex gap-2">
                  {tourSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setDirection(index > currentStep ? 1 : -1);
                        setCurrentStep(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'w-6 bg-gold'
                          : index < currentStep
                          ? 'bg-gold/50'
                          : 'bg-paper/20'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  {!isFirst && (
                    <motion.button
                      onClick={goToPrev}
                      className="px-5 py-2.5 rounded-xl flex items-center gap-2 text-paper/60 hover:text-paper transition-colors"
                      style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ChevronLeft size={18} />
                      Back
                    </motion.button>
                  )}
                  <motion.button
                    onClick={goToNext}
                    className="px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium"
                    style={{
                      background: 'linear-gradient(135deg, #c9a959 0%, #a08335 100%)',
                      color: '#0a0c10',
                      boxShadow: '0 4px 15px rgba(201, 169, 89, 0.3)',
                    }}
                    whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(201, 169, 89, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLast ? 'Get Started' : 'Next'}
                    {!isLast && <ChevronRight size={18} />}
                  </motion.button>
                </div>
              </div>

              {!isLast && (
                <div className="text-center pb-6">
                  <button
                    onClick={onClose}
                    className="text-sm text-paper/40 hover:text-paper/60 transition-colors"
                  >
                    Skip tour
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-gold/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.1, 0.6, 0.1],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

const TOUR_STORAGE_KEY = 'heirloom_tour_completed';

export function usePlatformTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  });

  const openTour = useCallback(() => setIsOpen(true), []);
  const closeTour = useCallback(() => setIsOpen(false), []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setHasCompletedTour(true);
    setIsOpen(false);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setHasCompletedTour(false);
  }, []);

  return {
    isOpen,
    hasCompletedTour,
    openTour,
    closeTour,
    completeTour,
    resetTour,
  };
}

export default PlatformTour;
