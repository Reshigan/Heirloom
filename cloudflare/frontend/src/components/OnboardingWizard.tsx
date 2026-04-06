import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mic, Clock, Sparkles, ArrowRight, ArrowLeft, Check, Users, X } from './Icons';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: 'who',
    title: 'Who is this legacy for?',
    subtitle: 'Every great legacy begins with the people you love',
    icon: Users,
  },
  {
    id: 'record',
    title: 'Record your first message',
    subtitle: 'Your voice is the most personal gift you can leave behind',
    icon: Mic,
  },
  {
    id: 'delivery',
    title: 'When should they receive it?',
    subtitle: 'Choose the perfect moment for your memories to arrive',
    icon: Clock,
  },
  {
    id: 'celebrate',
    title: 'Your sanctuary is ready',
    subtitle: 'You\'ve taken the first step in preserving what matters most',
    icon: Sparkles,
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
    { id: 'children', label: 'My Children', icon: '👶' },
    { id: 'partner', label: 'My Partner', icon: '💑' },
    { id: 'parents', label: 'My Parents', icon: '👨‍👩‍👦' },
    { id: 'grandchildren', label: 'Future Grandchildren', icon: '🌱' },
    { id: 'friends', label: 'Close Friends', icon: '🤝' },
    { id: 'everyone', label: 'Everyone I Love', icon: '❤️' },
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
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-void/95 backdrop-blur-xl"
    >
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-6 right-6 text-paper/70 hover:text-paper/70 transition-colors flex items-center gap-2 text-sm"
      >
        Skip for now
        <X size={16} />
      </button>

      {/* Progress bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i <= currentStep ? 'w-12 bg-gold' : 'w-8 bg-paper/10'
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
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center"
            >
              <step.icon size={36} className="text-gold" />
            </motion.div>

            {/* Title */}
            <h2 className="font-serif text-3xl md:text-4xl text-paper mb-3">
              {step.title}
            </h2>
            <p className="text-paper/65 font-serif text-lg mb-10">
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
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedRecipients.includes(option.id)
                        ? 'border-gold/50 bg-gold/10 text-gold'
                        : 'border-paper/10 bg-paper/5 text-paper/70 hover:border-paper/20'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step.id === 'record' && (
              <div className="space-y-4 max-w-md mx-auto">
                <motion.button
                  onClick={() => navigate('/record')}
                  className="w-full p-6 rounded-xl border border-gold/30 bg-gold/10 hover:bg-gold/15 transition-all flex items-center gap-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Mic size={24} className="text-gold" />
                  </div>
                  <div className="text-left">
                    <p className="font-serif text-lg text-paper">Record a voice message</p>
                    <p className="text-sm text-paper/65">Just 30 seconds to start your legacy</p>
                  </div>
                </motion.button>

                <button
                  onClick={handleNext}
                  className="text-paper/70 hover:text-paper/70 text-sm transition-colors"
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
                    className={`w-full p-4 rounded-xl border transition-all text-left ${
                      deliveryTiming === option.id
                        ? 'border-gold/50 bg-gold/10'
                        : 'border-paper/10 bg-paper/5 hover:border-paper/20'
                    }`}
                  >
                    <p className={`font-medium ${deliveryTiming === option.id ? 'text-gold' : 'text-paper/80'}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-paper/70 mt-1">{option.description}</p>
                  </button>
                ))}
              </div>
            )}

            {step.id === 'celebrate' && (
              <div className="max-w-md mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center"
                >
                  <Check size={40} className="text-gold" />
                </motion.div>
                <p className="text-paper/70 font-serif text-lg mb-4">
                  Every memory you save becomes a gift that lasts forever.
                </p>
                <div className="flex items-center justify-center gap-6 text-sm text-paper/70">
                  <span className="flex items-center gap-2">
                    <Heart size={14} className="text-blood" />
                    Encrypted & Private
                  </span>
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} className="text-gold" />
                    AI-Enhanced
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-12">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 text-paper/70 hover:text-paper/70 transition-colors ${
              currentStep === 0 ? 'invisible' : ''
            }`}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <motion.button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-gold to-gold-dim text-void font-medium transition-all hover:shadow-lg hover:shadow-gold/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLastStep ? 'Enter Your Sanctuary' : 'Continue'}
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
