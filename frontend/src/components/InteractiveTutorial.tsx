


import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  X, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,  
  HelpCircle,
  Sparkles
} from 'lucide-react';

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  videoUrl?: string;
  actionLabel?: string;
  onAction?: () => void;
};

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Heirloom',
    description: 'Preserve and share your precious memories with loved ones. This tour will guide you through the main features.',
    videoUrl: '/videos/tutorial/welcome.mp4',
    actionLabel: 'Start Tour'
  },
  {
    id: 'dashboard',
    title: 'Your Legacy Dashboard',
    description: 'Track your legacy health score and see your setup progress. This is your home base for managing everything.',
    targetSelector: '.dashboard-section',
    position: 'bottom',
    actionLabel: 'Next: Upload Memories'
  },
  {
    id: 'upload',
    title: 'Upload Your First Memory',
    description: 'Click the upload button to add photos and videos. Each memory becomes part of your digital legacy.',
    targetSelector: '.upload-button',
    position: 'right',
    actionLabel: 'Next: Organize Memories'
  },
  {
    id: 'timeline',
    title: 'Timeline View',
    description: 'View your memories chronologically. Filter by year, month, or emotion to find specific moments.',
    targetSelector: '.timeline-section',
    position: 'left',
    actionLabel: 'Next: Share Memories'
  },
  {
    id: 'sharing',
    title: 'Share with Family',
    description: 'Select family members to share memories with. They\'ll receive these precious moments according to your plan.',
    targetSelector: '.sharing-section',
    position: 'top',
    actionLabel: 'Next: Security Settings'
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Configure who can access your legacy and when. Your memories are protected with bank-level security.',
    targetSelector: '.security-section',
    position: 'bottom',
    actionLabel: 'Complete Setup'
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    description: 'Your digital legacy is now active. Continue adding memories and stories to enrich your family\'s history.',
    actionLabel: 'Start Using Heirloom'
  }
];

export function InteractiveTutorial({ isOpen, onClose, onComplete }: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHighlights, setShowHighlights] = useState(true);

  const currentStepData = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && showHighlights) {
      // Highlight the target element
      const targetElement = currentStepData.targetSelector 
        ? document.querySelector(currentStepData.targetSelector)
        : null;
      
      if (targetElement) {
        targetElement.classList.add('tutorial-highlight');
        return () => targetElement.classList.remove('tutorial-highlight');
      }
    }
  }, [currentStep, isOpen, showHighlights]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Tutorial Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl max-w-md w-full relative z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <Sparkles size={16} className="text-gold" />
              </div>
              <div>
                <h2 className="text-paper font-medium">Interactive Tutorial</h2>
                <div className="flex items-center gap-2 text-paper/50 text-sm">
                  <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
                  <span>•</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 text-paper/50 hover:text-paper transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={handleSkip}
                className="p-2 text-paper/50 hover:text-paper transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-void-light">
            <div 
              className="h-full bg-gold transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-light text-paper">{currentStepData.title}</h3>
                <p className="text-paper/70 leading-relaxed">{currentStepData.description}</p>
                
                {/* Video Placeholder */}
                {currentStepData.videoUrl && (
                  <div className="aspect-video bg-void-light rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                        <Play size={24} className="text-gold" />
                      </div>
                      <p className="text-paper/50 text-sm">Tutorial Video</p>
                    </div>
                  </div>
                )}

                {/* Step-specific content */}
                {currentStepData.id === 'completion' && (
                  <div className="text-center py-4">
                    <CheckCircle size={48} className="text-gold mx-auto mb-4" />
                    <p className="text-paper/60">You've completed the tour! Ready to start preserving your legacy.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="p-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentStep === 0 
                    ? 'text-paper/30 cursor-not-allowed' 
                    : 'text-paper/70 hover:text-paper hover:bg-white/5'
                }`}
              >
                <ArrowLeft size={16} />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHighlights(!showHighlights)}
                  className="p-2 text-paper/50 hover:text-paper transition-colors"
                  title={showHighlights ? 'Hide highlights' : 'Show highlights'}
                >
                  <HelpCircle size={16} />
                </button>
                
                <button
                  onClick={handleNext}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {currentStepData.actionLabel}
                  {currentStep < TUTORIAL_STEPS.length - 1 ? (
                    <ArrowRight size={16} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CSS for highlighting */}
      <style>{`
        .tutorial-highlight {
          box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.5) !important;
          position: relative;
          z-index: 40;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0.3); }
          100% { box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.5); }
        }
      `}</style>
    </div>
  );
}

// Hook for managing tutorial state
export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(() => {
    return localStorage.getItem('heirloom_tutorial_completed') === 'true';
  });

  const startTutorial = () => {
    setShowTutorial(true);
  };

  const completeTutorial = () => {
    setTutorialCompleted(true);
    setShowTutorial(false);
    localStorage.setItem('heirloom_tutorial_completed', 'true');
  };

  const resetTutorial = () => {
    setTutorialCompleted(false);
    localStorage.removeItem('heirloom_tutorial_completed');
  };

  return {
    showTutorial,
    tutorialCompleted,
    startTutorial,
    completeTutorial,
    resetTutorial
  };
}

// Quick Guide Component for feature explanations
interface QuickGuideProps {
  feature: string;
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_GUIDES = {
  timeline: {
    title: 'Timeline View',
    description: 'Organize your memories chronologically with visual timeline. Filter by date range and emotions.',
    tips: [
      'Use the year/month selectors to navigate through time',
      'Hover over timeline nodes to see memory previews',
      'Click on any memory to view details and share options'
    ]
  },
  search: {
    title: 'Smart Search',
    description: 'AI-powered search that understands your memories content and context.',
    tips: [
      'Search by people, places, emotions, or events',
      'Use filters to narrow down results by type and date',
      'Save frequent searches for quick access'
    ]
  },
  sharing: {
    title: 'Memory Sharing',
    description: 'Securely share memories with designated family members.',
    tips: [
      'Select multiple family members to share with',
      'Set different access levels for each recipient',
      'Track who has viewed your shared memories'
    ]
  },
  security: {
    title: 'Security Features',
    description: 'Bank-level security to protect your precious memories.',
    tips: [
      'Enable two-factor authentication for extra security',
      'Review access logs regularly',
      'Set up emergency contacts for account recovery'
    ]
  }
};

export function QuickGuide({ feature, isOpen, onClose }: QuickGuideProps) {
  const guide = FEATURE_GUIDES[feature as keyof typeof FEATURE_GUIDES];
  
  if (!isOpen || !guide) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-xl max-w-sm w-full relative z-10"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-light text-paper">{guide.title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-paper/50 hover:text-paper"
            >
              <X size={16} />
            </button>
          </div>
          
          <p className="text-paper/70 mb-4">{guide.description}</p>
          
          <div className="space-y-3">
            <h4 className="text-paper/50 text-sm font-medium">Quick Tips:</h4>
            <ul className="space-y-2">
              {guide.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-paper/70 text-sm">
                  <span className="text-gold mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="btn btn-primary w-full"
          >
            Got it!
          </button>
        </div>
      </motion.div>
      
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
    </div>
  );
}


