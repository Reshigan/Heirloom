import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressHair } from '../components/ui/ProgressHair';
import api from '../services/api';

interface StoryData {
  artifact: {
    title: string;
    description: string;
    theme: string;
    backgroundMusic: string | null;
    outputUrl: string | null;
    creatorName: string;
  };
  memories: Array<{
    id: string;
    title: string;
    fileUrl: string;
    thumbnailUrl: string | null;
  }>;
}

export function StoryView() {
  const { token } = useParams<{ token: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const { data, isLoading, error } = useQuery<StoryData>({
    queryKey: ['story-view', token],
    queryFn: () => api.get(`/api/story-artifacts/view/${token}`).then((r: { data: StoryData }) => r.data),
    enabled: !!token,
  });

  useEffect(() => {
    if (!isPlaying || !data?.memories.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= data.memories.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, data?.memories.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <ProgressHair label="loading…" width={180} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-body font-light text-paper mb-2">Story Not Found</h1>
          <p className="text-paper-60">This story may have expired or the link may be invalid.</p>
        </div>
      </div>
    );
  }

  const { artifact, memories } = data;
  const currentMemory = memories[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(memories.length - 1, prev + 1));
  };

  const togglePlayback = () => {
    if (currentIndex >= memories.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-void text-paper flex flex-col">
      <header className="p-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-body font-light text-3xl md:text-4xl text-gold mb-2 tracking-[-0.014em]"
        >
          {artifact.title}
        </motion.h1>
        {artifact.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-paper-60 max-w-xl mx-auto"
          >
            {artifact.description}
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-paper-50 text-sm mt-2"
        >
          Created by {artifact.creatorName}
        </motion.p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {memories.length > 0 ? (
          <>
            <div className="relative w-full max-w-4xl aspect-video rounded-[4px] overflow-hidden border border-paper-15">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <img
                    src={currentMemory?.fileUrl}
                    alt={currentMemory?.title || 'Memory'}
                    className="w-full h-full object-contain bg-void"
                  />
                  {currentMemory?.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-void/80">
                      <p className="text-paper text-lg">{currentMemory.title}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[2px] bg-void/70 flex items-center justify-center text-paper text-2xl hover:bg-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span aria-hidden>‹</span>
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex === memories.length - 1}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[2px] bg-void/70 flex items-center justify-center text-paper text-2xl hover:bg-void transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span aria-hidden>›</span>
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={togglePlayback}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="px-6 h-12 rounded-[2px] bg-gold text-void font-mono text-sm uppercase tracking-[0.18em] flex items-center justify-center hover:bg-gold-bright transition-colors"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="px-4 h-10 rounded-[2px] bg-void-surface border border-paper-15 text-paper-70 font-mono text-xs uppercase tracking-[0.18em] flex items-center justify-center hover:text-paper transition-colors"
              >
                {isMuted ? 'Muted' : 'Sound'}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {memories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to photo ${index + 1}`}
                  className={`h-1 rounded-[2px] transition-all ${
                    index === currentIndex ? 'bg-gold w-6' : 'bg-paper-30 w-2 hover:bg-paper-50'
                  }`}
                />
              ))}
            </div>

            <p className="mt-4 text-paper-50 text-sm">
              {currentIndex + 1} of {memories.length}
            </p>
          </>
        ) : (
          <div className="text-center">
            <p className="text-paper-50">No photos in this story yet.</p>
          </div>
        )}
      </main>

      <footer className="p-6 text-center">
        <p className="text-paper-30 text-sm">
          Powered by <a href="https://heirloom.blue" className="text-gold hover:text-gold-bright transition-colors">Heirloom</a>
        </p>
      </footer>
    </div>
  );
}

export default StoryView;
