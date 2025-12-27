import { useState, useEffect, useCallback, useRef } from 'react';

interface DraftData {
  [key: string]: unknown;
}

interface UseDraftAutosaveOptions {
  key: string;
  debounceMs?: number;
  onRestore?: (data: DraftData) => void;
}

interface UseDraftAutosaveReturn {
  saveDraft: (data: DraftData) => void;
  clearDraft: () => void;
  hasDraft: boolean;
  lastSaved: Date | null;
  restoreDraft: () => DraftData | null;
  isRestoring: boolean;
}

const STORAGE_PREFIX = 'heirloom_draft_';

export function useDraftAutosave({
  key,
  debounceMs = 2000,
  onRestore,
}: UseDraftAutosaveOptions): UseDraftAutosaveReturn {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `${STORAGE_PREFIX}${key}`;

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHasDraft(true);
        setLastSaved(parsed.savedAt ? new Date(parsed.savedAt) : null);
        
        // Auto-restore if callback provided
        if (onRestore && parsed.data) {
          setIsRestoring(true);
          onRestore(parsed.data);
          setTimeout(() => setIsRestoring(false), 500);
        }
      }
    } catch (error) {
      console.error('Failed to check for draft:', error);
    }
  }, [storageKey, onRestore]);

  // Save draft with debounce
  const saveDraft = useCallback((data: DraftData) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const toStore = {
          data,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(toStore));
        setHasDraft(true);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }, debounceMs);
  }, [storageKey, debounceMs]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [storageKey]);

  // Manually restore draft
  const restoreDraft = useCallback((): DraftData | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data || null;
      }
    } catch (error) {
      console.error('Failed to restore draft:', error);
    }
    return null;
  }, [storageKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    clearDraft,
    hasDraft,
    lastSaved,
    restoreDraft,
    isRestoring,
  };
}

// Helper component to show draft status
export function DraftIndicator({ 
  lastSaved, 
  isRestoring 
}: { 
  lastSaved: Date | null; 
  isRestoring: boolean;
}) {
  if (isRestoring) {
    return (
      <span className="text-xs text-gold animate-pulse">
        Restoring draft...
      </span>
    );
  }

  if (!lastSaved) return null;

  const timeAgo = getTimeAgo(lastSaved);
  
  return (
    <span className="text-xs text-paper/40">
      Draft saved {timeAgo}
    </span>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1 minute ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return '1 hour ago';
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return 'yesterday';
}
