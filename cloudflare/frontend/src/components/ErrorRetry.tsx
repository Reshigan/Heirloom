import { AlertCircle, RefreshCw } from './Icons';

interface ErrorRetryProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorRetry({ message = 'Something went wrong', onRetry, isRetrying = false }: ErrorRetryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-blood/10 flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-blood" />
      </div>
      <p className="text-paper/70 mb-4">{message}</p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="btn btn-secondary inline-flex items-center gap-2"
      >
        <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
        {isRetrying ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  );
}
