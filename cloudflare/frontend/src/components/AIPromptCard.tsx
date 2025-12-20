import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Share2, Check, Loader2 } from './Icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/api';

interface AIPromptCardProps {
  onUsePrompt?: (prompt: string) => void;
  className?: string;
}

export function AIPromptCard({ onUsePrompt, className = '' }: AIPromptCardProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: promptData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-prompt'],
    queryFn: () => aiApi.getPrompt().then(r => r.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const markUsedMutation = useMutation({
    mutationFn: (id: string) => aiApi.markPromptUsed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompt'] });
    },
  });

  const markSharedMutation = useMutation({
    mutationFn: (id: string) => aiApi.markPromptShared(id),
  });

  const handleUsePrompt = () => {
    if (promptData?.prompt) {
      markUsedMutation.mutate(promptData.id);
      onUsePrompt?.(promptData.prompt);
    }
  };

  const handleShare = async () => {
    if (promptData?.prompt) {
      try {
        await navigator.clipboard.writeText(promptData.prompt);
        setCopied(true);
        markSharedMutation.mutate(promptData.id);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = promptData.prompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        markSharedMutation.mutate(promptData.id);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className={`card glass-strong ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card glass-strong ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-gold" />
        <h3 className="text-lg font-medium">Memory Prompt</h3>
      </div>

      <p className="text-paper/80 text-lg mb-6 leading-relaxed">
        {promptData?.prompt || 'Loading prompt...'}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={handleUsePrompt}
          disabled={markUsedMutation.isPending}
          className="btn btn-primary flex-1"
        >
          {markUsedMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            'Use This Prompt'
          )}
        </button>

        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="btn btn-secondary p-3"
          title="Get new prompt"
        >
          <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={handleShare}
          className="btn btn-secondary p-3"
          title="Copy to clipboard"
        >
          {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
        </button>
      </div>

      {promptData?.category && (
        <p className="text-paper/40 text-sm mt-4">
          Category: {promptData.category}
        </p>
      )}
    </motion.div>
  );
}
