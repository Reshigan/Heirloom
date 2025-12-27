import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGetHelp?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  suggestion,
  onRetry,
  onGoBack,
  onGetHelp,
  className = '',
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-8 ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center"
      >
        <AlertCircle size={32} className="text-red-400" />
      </motion.div>
      
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-paper/60 mb-2">{message}</p>
      
      {suggestion && (
        <p className="text-sm text-paper/40 mb-6">
          <span className="text-gold">Tip:</span> {suggestion}
        </p>
      )}
      
      {(onRetry || onGoBack || onGetHelp) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-gradient-to-r from-gold to-gold/80 text-void font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          )}
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="px-6 py-3 glass text-paper/60 hover:text-paper transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          )}
          {onGetHelp && (
            <button
              onClick={onGetHelp}
              className="px-6 py-3 text-paper/40 hover:text-paper transition-colors flex items-center gap-2"
            >
              <HelpCircle size={18} />
              Get Help
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function InlineError({ 
  message, 
  suggestion,
  onRetry,
  onDismiss 
}: { 
  message: string; 
  suggestion?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-400">{message}</p>
          {suggestion && (
            <p className="text-xs text-paper/50 mt-1">{suggestion}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-gold hover:text-gold/80 transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-paper/40 hover:text-paper transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Common error messages with helpful suggestions
export const ERROR_MESSAGES = {
  NETWORK: {
    message: 'Unable to connect to the server',
    suggestion: 'Check your internet connection and try again',
  },
  UPLOAD_FAILED: {
    message: 'Failed to upload your file',
    suggestion: 'Make sure the file is under 50MB and try again',
  },
  SAVE_FAILED: {
    message: 'Failed to save your changes',
    suggestion: 'Your work is saved locally. Try again in a moment',
  },
  AUTH_EXPIRED: {
    message: 'Your session has expired',
    suggestion: 'Please log in again to continue',
  },
  NOT_FOUND: {
    message: 'Content not found',
    suggestion: 'It may have been moved or deleted',
  },
  PERMISSION_DENIED: {
    message: 'You don\'t have permission to do this',
    suggestion: 'Contact the owner if you think this is a mistake',
  },
};
