import { useState, useEffect, useMemo } from 'react';
import { Lightbulb, RefreshCw, X, ChevronDown, ChevronUp } from './Icons';

interface InspirationPromptProps {
  prompts: string[];
  storageKey: string;
  onUsePrompt?: (prompt: string) => void;
  className?: string;
}

// Number of prompts to show at once
const PROMPTS_TO_SHOW = 3;

export function InspirationPrompt({ prompts, storageKey, onUsePrompt, className = '' }: InspirationPromptProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  // Get a shuffled subset of prompts
  const displayPrompts = useMemo(() => {
    if (prompts.length === 0) return [];
    const shuffled = [...prompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(PROMPTS_TO_SHOW, prompts.length));
  }, [prompts, shuffleKey]);

  useEffect(() => {
    const dismissed = localStorage.getItem(`${storageKey}_dismissed`);
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`${storageKey}_dismissed`, 'true');
  };

  const handleRefresh = () => {
    setShuffleKey(prev => prev + 1);
  };

  const handleUse = (prompt: string) => {
    if (onUsePrompt) {
      onUsePrompt(prompt);
    }
  };

  if (!isVisible || prompts.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-r from-gold/5 to-purple-500/5 border border-gold/20 rounded-xl transition-all duration-300 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div 
            className="flex items-center gap-2 text-gold/70 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Lightbulb size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Inspiration</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="p-1.5 text-paper/40 hover:text-gold transition-colors rounded-lg hover:bg-white/5"
              title="Get new suggestions"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-paper/40 hover:text-paper/60 transition-colors rounded-lg hover:bg-white/5"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Prompts - show multiple suggestions */}
        <div className={`space-y-2 ${isExpanded ? '' : 'max-h-24 overflow-hidden'}`}>
          {displayPrompts.map((prompt, index) => (
            <div 
              key={`${shuffleKey}-${index}`}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <p className="flex-1 text-paper/70 text-sm italic leading-relaxed">
                "{prompt}"
              </p>
              {onUsePrompt && (
                <button
                  onClick={() => handleUse(prompt)}
                  className="px-3 py-1 text-xs bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  Try this
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Show more indicator */}
        {!isExpanded && prompts.length > PROMPTS_TO_SHOW && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="mt-2 text-xs text-paper/40 hover:text-gold transition-colors"
          >
            + {prompts.length - PROMPTS_TO_SHOW} more suggestions
          </button>
        )}
      </div>
    </div>
  );
}
