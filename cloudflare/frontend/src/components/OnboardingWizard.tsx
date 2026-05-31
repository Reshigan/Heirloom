import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: 'who',
    title: 'Who is this legacy for?',
    subtitle: 'Every great legacy begins with the people you love',
  },
  {
    id: 'record',
    title: 'Record your first message',
    subtitle: 'Your voice is the most personal gift you can leave behind',
  },
  {
    id: 'delivery',
    title: 'When should they receive it?',
    subtitle: 'Choose the perfect moment for your memories to arrive',
  },
  {
    id: 'celebrate',
    title: 'Your sanctuary is ready',
    subtitle: 'You\'ve taken the first step in preserving what matters most',
  },
];

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [deliveryTiming, setDeliveryTiming] = useState<string>('');

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const recipientOptions = [
    { id: 'children', label: 'My Children' },
    { id: 'partner', label: 'My Partner' },
    { id: 'parents', label: 'My Parents' },
    { id: 'grandchildren', label: 'Future Grandchildren' },
    { id: 'friends', label: 'Close Friends' },
    { id: 'everyone', label: 'Everyone I Love' },
  ];

  const deliveryOptions = [
    { id: 'milestone', label: 'On a milestone birthday', description: 'Their 18th, 21st, or a special age' },
    { id: 'wedding', label: 'On their wedding day', description: 'A message for their new chapter' },
    { id: 'whenever', label: 'When I\'m no longer here', description: 'Delivered through Heirloom\'s Dead Man\'s Switch' },
    { id: 'now', label: 'I\'ll decide later', description: 'Start preserving and choose timing later' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-void/95"
    >
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-6 right-6 text-paper-50 hover:text-paper transition-colors text-sm"
      >
        Skip for now
      </button>

      {/* Progress bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-[2px] rounded-[2px] transition-all duration-500 ${
              i <= currentStep ? 'w-12 bg-gold' : 'w-8 bg-paper-15'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-lg mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Mark */}
            <span className="font-body text-4xl text-gold block mb-8" aria-hidden>∞</span>

            {/* Title */}
            <h2 className="font-body font-light text-3xl md:text-4xl text-paper mb-3 tracking-[-0.018em]">
              {step.title}
            </h2>
            <p className="text-paper-65 text-lg mb-10 leading-relaxed">
              {step.subtitle}
            </p>

            {/* Step content */}
            {step.id === 'who' && (
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {recipientOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedRecipients((prev) =>
                        prev.includes(option.id)
                          ? prev.filter((r) => r !== option.id)
                          : [...prev, option.id]
                      );
                    }}
                    className={`p-4 rounded-[2px] border transition-colors text-left ${
                      selectedRecipients.includes(option.id)
                        ? 'border-gold-40 bg-void-elevated text-gold'
                        : 'border-paper-15 bg-void-surface text-paper-70 hover:border-paper-15 hover:text-paper'
                    }`}
                  >
                    <span className="text-sm font-body">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step.id === 'record' && (
              <div className="space-y-4 max-w-md mx-auto">
                <button
                  onClick={() => navigate('/record')}
                  className="w-full p-6 rounded-[2px] border border-gold-40 bg-void-surface hover:bg-void-elevated transition-colors text-left"
                >
                  <p className="font-body text-lg text-paper">Record a voice message</p>
                  <p className="text-sm text-paper-65 mt-1">Just 30 seconds to start your legacy</p>
                </button>

                <button
                  onClick={handleNext}
                  className="text-paper-50 hover:text-paper text-sm transition-colors"
                >
                  I&apos;ll do this later
                </button>
              </div>
            )}

            {step.id === 'delivery' && (
              <div className="space-y-3 max-w-md mx-auto">
                {deliveryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setDeliveryTiming(option.id)}
                    className={`w-full p-4 rounded-[2px] border transition-colors text-left ${
                      deliveryTiming === option.id
                        ? 'border-gold-40 bg-void-elevated'
                        : 'border-paper-15 bg-void-surface hover:border-paper-15'
                    }`}
                  >
                    <p className={`font-body ${deliveryTiming === option.id ? 'text-gold' : 'text-paper'}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-paper-70 mt-1">{option.description}</p>
                  </button>
                ))}
              </div>
            )}

            {step.id === 'celebrate' && (
              <div className="max-w-md mx-auto">
                <p className="text-paper-70 text-lg mb-6 leading-relaxed">
                  Every memory you save becomes a gift that lasts forever.
                </p>
                <div className="flex items-center justify-center gap-7 text-sm text-paper-50">
                  <span>Encrypted &amp; Private</span>
                  <span className="text-paper-30" aria-hidden>·</span>
                  <span>AI-Enhanced</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-12">
          <button
            onClick={handleBack}
            className={`btn btn-ghost ${currentStep === 0 ? 'invisible' : ''}`}
          >
            <span aria-hidden>←</span>
            Back
          </button>

          <button onClick={handleNext} className="btn btn-primary">
            {isLastStep ? 'Enter Your Sanctuary' : 'Continue'}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
