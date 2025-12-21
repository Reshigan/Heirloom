import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, X } from './Icons';

interface InspirationPromptProps {
  prompts: string[];
  storageKey: string;
  onUsePrompt?: (prompt: string) => void;
  className?: string;
}

export function InspirationPrompt({ prompts, storageKey, onUsePrompt, className = '' }: InspirationPromptProps) {
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`${storageKey}_dismissed`);
    if (dismissed === 'true') {
      setIsVisible(false);
    }
    
    if (prompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * prompts.length);
      setCurrentPrompt(prompts[randomIndex]);
    }
  }, [prompts, storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`${storageKey}_dismissed`, 'true');
  };

  const handleRefresh = () => {
    if (prompts.length > 0) {
      let newIndex = Math.floor(Math.random() * prompts.length);
      while (prompts.length > 1 && prompts[newIndex] === currentPrompt) {
        newIndex = Math.floor(Math.random() * prompts.length);
      }
      setCurrentPrompt(prompts[newIndex]);
    }
  };

  const handleUse = () => {
    if (onUsePrompt && currentPrompt) {
      onUsePrompt(currentPrompt);
    }
  };

  if (!isVisible || !currentPrompt || prompts.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div 
        className={`bg-gradient-to-r from-gold/5 to-purple-500/5 border border-gold/20 rounded-xl transition-all duration-300 ${
          isExpanded ? 'p-4' : 'px-4 py-2'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gold/70 shrink-0">
            <Lightbulb size={16} />
            <span className="text-xs font-medium uppercase tracking-wider">Inspiration</span>
          </div>
          
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <p className="text-paper/80 text-sm italic leading-relaxed">
                "{currentPrompt}"
              </p>
            ) : (
              <p className="text-paper/60 text-sm truncate">
                "{currentPrompt.substring(0, 60)}{currentPrompt.length > 60 ? '...' : ''}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isExpanded && onUsePrompt && (
              <button
                onClick={handleUse}
                className="px-3 py-1 text-xs bg-gold/20 text-gold rounded-lg hover:bg-gold/30 transition-colors"
              >
                Use this
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="p-1.5 text-paper/40 hover:text-gold transition-colors rounded-lg hover:bg-white/5"
              title="New prompt"
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
      </div>
    </div>
  );
}
