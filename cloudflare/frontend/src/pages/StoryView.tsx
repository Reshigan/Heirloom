import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
    file_url: string;
    thumbnail_url: string | null;
  }>;
}

const THEME_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  classic: { bg: 'from-[#0a0c10] to-[#12151c]', text: 'text-[#f5f0e8]', accent: 'text-[#c9a959]' },
  warm: { bg: 'from-[#2d1f1a] to-[#1a1210]', text: 'text-[#f5e6d3]', accent: 'text-[#d4a574]' },
  modern: { bg: 'from-[#1a1a2e] to-[#16213e]', text: 'text-white', accent: 'text-[#e94560]' },
  vintage: { bg: 'from-[#2c2416] to-[#1a1610]', text: 'text-[#e8dcc8]', accent: 'text-[#b8860b]' },
};

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
      <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#12151c] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#c9a959] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#12151c] flex items-center justify-center p-6">
        <div className="text-center">
          <Film size={64} className="mx-auto text-[#f5f0e8]/20 mb-4" />
          <h1 className="text-2xl font-serif text-[#f5f0e8] mb-2">Story Not Found</h1>
          <p className="text-[#f5f0e8]/60">This story may have expired or the link may be invalid.</p>
        </div>
      </div>
    );
  }

  const { artifact, memories } = data;
  const theme = THEME_STYLES[artifact.theme] || THEME_STYLES.classic;
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
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex flex-col`}>
      <header className="p-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-serif text-3xl md:text-4xl ${theme.accent} mb-2`}
        >
          {artifact.title}
        </motion.h1>
        {artifact.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`${theme.text} opacity-60 max-w-xl mx-auto`}
          >
            {artifact.description}
          </motion.p>
        )}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`${theme.text} opacity-40 text-sm mt-2`}
        >
          Created by {artifact.creatorName}
        </motion.p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {memories.length > 0 ? (
          <>
            <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
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
                    src={currentMemory?.file_url}
                    alt={currentMemory?.title || 'Memory'}
                    className="w-full h-full object-contain bg-black"
                  />
                  {currentMemory?.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                      <p className={`${theme.text} text-lg font-medium`}>{currentMemory.title}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex === memories.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={togglePlayback}
                className={`w-14 h-14 rounded-full bg-gradient-to-r from-[#c9a959] to-[#a08335] flex items-center justify-center text-[#0a0c10] hover:opacity-90 transition-opacity`}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ${theme.text} hover:bg-white/20 transition-colors`}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {memories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-[#c9a959] w-6' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>

            <p className={`mt-4 ${theme.text} opacity-40 text-sm`}>
              {currentIndex + 1} of {memories.length}
            </p>
          </>
        ) : (
          <div className="text-center">
            <Film size={64} className={`mx-auto ${theme.text} opacity-20 mb-4`} />
            <p className={`${theme.text} opacity-50`}>No photos in this story yet.</p>
          </div>
        )}
      </main>

      <footer className="p-6 text-center">
        <p className={`${theme.text} opacity-30 text-sm`}>
          Powered by <a href="https://heirloom.blue" className={`${theme.accent} hover:underline`}>Heirloom</a>
        </p>
      </footer>
    </div>
  );
}

export default StoryView;
