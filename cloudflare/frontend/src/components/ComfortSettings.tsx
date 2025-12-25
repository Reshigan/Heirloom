import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pen, Sun, Moon, Zap, Eye, Check } from './Icons';

export interface ComfortPreferences {
  textSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
}

const DEFAULT_PREFERENCES: ComfortPreferences = {
  textSize: 'normal',
  highContrast: false,
  reducedMotion: false,
};

const STORAGE_KEY = 'heirloom-comfort-preferences';

export function getComfortPreferences(): ComfortPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load comfort preferences:', e);
  }
  return DEFAULT_PREFERENCES;
}

export function saveComfortPreferences(prefs: ComfortPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save comfort preferences:', e);
  }
}

export function applyComfortPreferences(prefs: ComfortPreferences): void {
  const root = document.documentElement;
  
  // Apply text size
  root.classList.remove('text-size-normal', 'text-size-large', 'text-size-extra-large');
  root.classList.add(`text-size-${prefs.textSize}`);
  
  // Apply high contrast
  if (prefs.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  // Apply reduced motion
  if (prefs.reducedMotion) {
    root.classList.add('reduced-motion');
  } else {
    root.classList.remove('reduced-motion');
  }
}

interface ComfortSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComfortSettings({ isOpen, onClose }: ComfortSettingsProps) {
  const [preferences, setPreferences] = useState<ComfortPreferences>(getComfortPreferences);
  
  // Apply preferences whenever they change
  useEffect(() => {
    applyComfortPreferences(preferences);
    saveComfortPreferences(preferences);
  }, [preferences]);
  
  const updatePreference = <K extends keyof ComfortPreferences>(
    key: K,
    value: ComfortPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };
  
  const textSizeOptions: { value: ComfortPreferences['textSize']; label: string; description: string }[] = [
    { value: 'normal', label: 'Normal', description: 'Default text size' },
    { value: 'large', label: 'Large', description: 'Easier to read' },
    { value: 'extra-large', label: 'Extra Large', description: 'Maximum readability' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50"
          />
          
          {/* Panel - slides up on mobile, slides in from right on desktop */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-0 md:left-auto md:right-0 md:h-full md:w-96 z-50"
          >
            <div className="bg-void-surface border-t md:border-l md:border-t-0 border-paper/10 rounded-t-2xl md:rounded-none md:rounded-l-2xl max-h-[85vh] md:max-h-full md:h-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-paper/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <Eye size={20} className="text-gold" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-medium text-paper">Comfort Settings</h2>
                    <p className="text-sm text-paper/50">Customize your experience</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-paper/5 hover:bg-paper/10 flex items-center justify-center transition-colors touch-target"
                  aria-label="Close settings"
                >
                  <X size={20} className="text-paper/60" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {/* Text Size */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Pen size={18} className="text-gold" />
                    <span className="font-medium text-paper">Text Size</span>
                  </div>
                  <p className="text-sm text-paper/50 mb-3">
                    Choose a text size that's comfortable for you
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {textSizeOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => updatePreference('textSize', option.value)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all touch-target ${
                          preferences.textSize === option.value
                            ? 'border-gold bg-gold/10'
                            : 'border-paper/10 hover:border-paper/20 bg-paper/5'
                        }`}
                      >
                        <div className="text-left">
                          <span className={`block font-medium ${
                            option.value === 'normal' ? 'text-base' :
                            option.value === 'large' ? 'text-lg' : 'text-xl'
                          }`}>
                            {option.label}
                          </span>
                          <span className="text-sm text-paper/50">{option.description}</span>
                        </div>
                        {preferences.textSize === option.value && (
                          <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                            <Check size={14} className="text-void" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* High Contrast */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun size={18} className="text-gold" />
                    <span className="font-medium text-paper">High Contrast</span>
                  </div>
                  <p className="text-sm text-paper/50 mb-3">
                    Increase contrast for better visibility
                  </p>
                  <button
                    onClick={() => updatePreference('highContrast', !preferences.highContrast)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all touch-target ${
                      preferences.highContrast
                        ? 'border-gold bg-gold/10'
                        : 'border-paper/10 hover:border-paper/20 bg-paper/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {preferences.highContrast ? (
                        <Sun size={20} className="text-gold" />
                      ) : (
                        <Moon size={20} className="text-paper/50" />
                      )}
                      <span className="font-medium">
                        {preferences.highContrast ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div className={`w-12 h-7 rounded-full transition-colors relative ${
                      preferences.highContrast ? 'bg-gold' : 'bg-paper/20'
                    }`}>
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </button>
                </div>
                
                {/* Reduced Motion */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={18} className="text-gold" />
                    <span className="font-medium text-paper">Reduced Motion</span>
                  </div>
                  <p className="text-sm text-paper/50 mb-3">
                    Minimize animations for a calmer experience
                  </p>
                  <button
                    onClick={() => updatePreference('reducedMotion', !preferences.reducedMotion)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all touch-target ${
                      preferences.reducedMotion
                        ? 'border-gold bg-gold/10'
                        : 'border-paper/10 hover:border-paper/20 bg-paper/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Zap size={20} className={preferences.reducedMotion ? 'text-gold' : 'text-paper/50'} />
                      <span className="font-medium">
                        {preferences.reducedMotion ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div className={`w-12 h-7 rounded-full transition-colors relative ${
                      preferences.reducedMotion ? 'bg-gold' : 'bg-paper/20'
                    }`}>
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </button>
                </div>
                
                {/* Preview */}
                <div className="mt-6 p-4 rounded-xl bg-paper/5 border border-paper/10">
                  <p className="text-sm text-paper/50 mb-2">Preview</p>
                  <p className="text-paper leading-relaxed">
                    This is how your text will appear throughout Heirloom. 
                    Your memories deserve to be read comfortably.
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-paper/10">
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-xl bg-gold text-void font-medium hover:bg-gold-light transition-colors touch-target"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Floating button to open comfort settings
interface ComfortSettingsButtonProps {
  onClick: () => void;
}

export function ComfortSettingsButton({ onClick }: ComfortSettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-14 md:h-14 rounded-full bg-void-surface border border-paper/10 shadow-lg flex items-center justify-center hover:border-gold/30 hover:bg-gold/5 transition-all z-40 touch-target group"
      aria-label="Open comfort settings"
      title="Comfort Settings"
    >
      <Eye size={20} className="text-paper/60 group-hover:text-gold transition-colors" />
    </button>
  );
}
