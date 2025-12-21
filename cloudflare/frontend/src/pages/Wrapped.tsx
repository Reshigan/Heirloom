import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { wrappedApi } from '../services/api';
import { ChevronLeft, ChevronRight, Calendar, Play, Pause, Volume2, VolumeX } from '../components/Icons';

// Types for wrapped data
interface WrappedStats {
  totalMemories: number;
  totalVoiceStories: number;
  totalLetters: number;
  totalMinutesRecorded: number;
  familyMembersConnected: number;
  memoriesShared: number;
  topEmotions: EmotionData[];
  monthlyActivity: MonthlyData[];
  mostActiveDay: string;
  longestStreak: number;
  milestones: Milestone[];
  topRecipients: Recipient[];
  wordCloud: WordCloudItem[];
  yearHighlights: Highlight[];
}

interface EmotionData {
  emotion: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

interface MonthlyData {
  month: string;
  memories: number;
  voices: number;
  letters: number;
}

interface Milestone {
  date: string;
  title: string;
  description: string;
  type: 'memory' | 'voice' | 'letter' | 'family' | 'streak';
}

interface Recipient {
  name: string;
  relationship: string;
  itemsShared: number;
  avatar?: string;
}

interface WordCloudItem {
  word: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface Highlight {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  date: string;
  emotion: string;
  preview?: string;
}

// Default stats when API data is loading or unavailable
const getDefaultStats = (): WrappedStats => ({
  totalMemories: 0,
  totalVoiceStories: 0,
  totalLetters: 0,
  totalMinutesRecorded: 0,
  familyMembersConnected: 0,
  memoriesShared: 0,
  topEmotions: [],
  monthlyActivity: [
    { month: 'Jan', memories: 0, voices: 0, letters: 0 },
    { month: 'Feb', memories: 0, voices: 0, letters: 0 },
    { month: 'Mar', memories: 0, voices: 0, letters: 0 },
    { month: 'Apr', memories: 0, voices: 0, letters: 0 },
    { month: 'May', memories: 0, voices: 0, letters: 0 },
    { month: 'Jun', memories: 0, voices: 0, letters: 0 },
    { month: 'Jul', memories: 0, voices: 0, letters: 0 },
    { month: 'Aug', memories: 0, voices: 0, letters: 0 },
    { month: 'Sep', memories: 0, voices: 0, letters: 0 },
    { month: 'Oct', memories: 0, voices: 0, letters: 0 },
    { month: 'Nov', memories: 0, voices: 0, letters: 0 },
    { month: 'Dec', memories: 0, voices: 0, letters: 0 },
  ],
  mostActiveDay: 'Sunday',
  longestStreak: 0,
  milestones: [],
  topRecipients: [],
  wordCloud: [],
  yearHighlights: [],
});

// Transform API response to WrappedStats format
const transformApiResponse = (data: any): WrappedStats => ({
  totalMemories: data.totalMemories || 0,
  totalVoiceStories: data.totalVoiceStories || 0,
  totalLetters: data.totalLetters || 0,
  totalMinutesRecorded: data.totalMinutesRecorded || 0,
  familyMembersConnected: data.familyMembersConnected || 0,
  memoriesShared: data.memoriesShared || 0,
  topEmotions: data.topEmotions || [],
  monthlyActivity: data.monthlyActivity || getDefaultStats().monthlyActivity,
  mostActiveDay: data.mostActiveDay || 'Sunday',
  longestStreak: data.longestStreak || 0,
  milestones: data.milestones || [],
  topRecipients: data.topRecipients || [],
  wordCloud: data.wordCloud || [],
  yearHighlights: data.yearHighlights || [],
});

// Slide components
const IntroSlide: React.FC<{ year: number }> = ({ year }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full text-center px-8"
  >
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', duration: 1.5 }}
      className="text-8xl mb-8"
    >
      ∞
    </motion.div>
    <motion.h1
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-5xl md:text-7xl font-display text-paper mb-4"
    >
      Your {year}
    </motion.h1>
    <motion.p
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-2xl text-paper/60 font-body"
    >
      Wrapped in memories
    </motion.p>
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.2, type: 'spring' }}
      className="mt-12 flex items-center gap-2 text-gold"
    >
      <span className="text-sm uppercase tracking-widest">Tap to continue</span>
      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        ▶
      </motion.span>
    </motion.div>
  </motion.div>
);

const TotalMemoriesSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full text-center px-8"
  >
    <motion.p
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-xl text-paper/60 mb-4"
    >
      This year, you preserved
    </motion.p>
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.3 }}
      className="relative"
    >
      <span className="text-6xl sm:text-8xl md:text-[12rem] font-display text-gold">
        {stats.totalMemories}
      </span>
      <motion.div
        className="absolute -inset-8 bg-gold/10 rounded-full blur-3xl -z-10"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
    </motion.div>
    <motion.p
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-3xl text-paper mt-4"
    >
      precious memories
    </motion.p>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-lg text-paper/40 mt-8"
    >
      That's more than {Math.round(stats.totalMemories / 12)} memories per month
    </motion.p>
  </motion.div>
);

const VoiceStoriesSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full text-center px-8"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring' }}
      className="mb-8"
    >
      {/* Animated waveform */}
      <div className="flex items-center justify-center gap-1 h-24">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-blood to-gold rounded-full"
            animate={{
              height: [20, 40 + Math.random() * 60, 20],
            }}
            transition={{
              repeat: Infinity,
              duration: 0.5 + Math.random() * 0.5,
              delay: i * 0.05,
            }}
          />
        ))}
      </div>
    </motion.div>
    <motion.p
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-xl text-paper/60 mb-2"
    >
      Your voice echoed through
    </motion.p>
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      className="flex items-baseline gap-4"
    >
      <span className="text-5xl sm:text-7xl md:text-8xl font-display text-gold">{stats.totalVoiceStories}</span>
      <span className="text-3xl text-paper">stories</span>
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-lg text-paper/40 mt-8"
    >
      {stats.totalMinutesRecorded} minutes of your voice, preserved forever
    </motion.p>
  </motion.div>
);

const EmotionsSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => {
  // Safely handle undefined or empty topEmotions
  const topEmotions = stats.topEmotions || [];
  
  return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full px-8"
  >
    <motion.p
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-xl text-paper/60 mb-8 text-center"
    >
      The emotions that colored your year
    </motion.p>
    {topEmotions.length === 0 ? (
      <div className="text-center text-paper/50">
        <p className="text-lg mb-2">No emotion data yet</p>
        <p className="text-sm">Start adding memories to see your emotional journey</p>
      </div>
    ) : (
    <div className="w-full max-w-md space-y-4">
      {topEmotions.map((emotion, index) => (
        <motion.div
          key={emotion.emotion}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.15 }}
          className="flex items-center gap-4"
        >
          <span className="text-3xl w-12">{emotion.icon}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-paper font-medium">{emotion.emotion}</span>
              <span className="text-paper/60">{emotion.percentage}%</span>
            </div>
            <div className="h-3 bg-void-elevated rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${emotion.percentage}%` }}
                transition={{ delay: 0.5 + index * 0.15, duration: 0.8 }}
                className="h-full rounded-full"
                style={{ backgroundColor: emotion.color }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
    )}
    {topEmotions.length > 0 && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-lg text-gold mt-8 text-center"
      >
        {topEmotions[0].emotion} was your dominant feeling ✨
      </motion.p>
    )}
  </motion.div>
  );
};

const FamilySlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full px-8"
  >
    <motion.p
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-xl text-paper/60 mb-8 text-center"
    >
      Your constellation grew to
    </motion.p>
    
    {/* Animated constellation */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.3 }}
      className="relative w-64 h-64 mb-8"
    >
      {/* Center star (you) */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gold rounded-full flex items-center justify-center"
        animate={{ boxShadow: ['0 0 20px rgba(201,169,89,0.5)', '0 0 40px rgba(201,169,89,0.8)', '0 0 20px rgba(201,169,89,0.5)'] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <span className="text-void-deep font-bold">You</span>
      </motion.div>
      
      {/* Family member stars */}
      {stats.topRecipients.map((recipient, i) => {
        const angle = (i * 360) / stats.topRecipients.length;
        const x = Math.cos((angle * Math.PI) / 180) * 90;
        const y = Math.sin((angle * Math.PI) / 180) * 90;
        return (
          <motion.div
            key={recipient.name}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.2 }}
            className="absolute w-12 h-12 bg-gold/80 rounded-full flex items-center justify-center text-xs text-void-deep font-medium"
            style={{
              left: `calc(50% + ${x}px - 24px)`,
              top: `calc(50% + ${y}px - 24px)`,
            }}
          >
            {recipient.name}
          </motion.div>
        );
      })}
      
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        {stats.topRecipients.map((_, i) => {
          const angle = (i * 360) / stats.topRecipients.length;
          const x = Math.cos((angle * Math.PI) / 180) * 90 + 128;
          const y = Math.sin((angle * Math.PI) / 180) * 90 + 128;
          return (
            <motion.line
              key={i}
              x1="128"
              y1="128"
              x2={x}
              y2={y}
              stroke="rgba(201,169,89,0.3)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            />
          );
        })}
      </svg>
    </motion.div>
    
    <motion.p
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1 }}
      className="text-6xl font-display text-gold"
    >
      {stats.familyMembersConnected}
    </motion.p>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="text-2xl text-paper mt-2"
    >
      stars in your sky
    </motion.p>
  </motion.div>
);

const StreakSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full px-8 text-center"
  >
    <motion.div
      initial={{ rotate: -180, scale: 0 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 1 }}
      className="text-5xl sm:text-7xl md:text-8xl mb-8"
    >
      🔥
    </motion.div>
    <motion.p
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-xl text-paper/60 mb-4"
    >
      Your longest streak was
    </motion.p>
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.5 }}
      className="flex items-baseline gap-2"
    >
      <span className="text-5xl sm:text-7xl md:text-8xl font-display text-gold">{stats.longestStreak}</span>
      <span className="text-3xl text-paper">days</span>
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-lg text-paper/40 mt-8"
    >
      You were most active on <span className="text-gold">{stats.mostActiveDay}s</span>
    </motion.p>
  </motion.div>
);

const WordCloudSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full px-8"
  >
    <motion.p
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-xl text-paper/60 mb-8 text-center"
    >
      Words that defined your year
    </motion.p>
    <div className="flex flex-wrap justify-center gap-4 max-w-lg">
      {stats.wordCloud.map((item, index) => (
        <motion.span
          key={item.word}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1, type: 'spring' }}
          className="px-4 py-2 rounded-full"
          style={{
            fontSize: `${Math.max(14, item.count / 3)}px`,
            backgroundColor: item.sentiment === 'positive' ? 'rgba(201,169,89,0.2)' : 'rgba(255,255,255,0.1)',
            color: item.sentiment === 'positive' ? '#c9a959' : '#f5f3ee',
          }}
        >
          {item.word}
        </motion.span>
      ))}
    </div>
  </motion.div>
);

const LettersSlide: React.FC<{ stats: WrappedStats }> = ({ stats }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full px-8 text-center"
  >
    <motion.div
      initial={{ y: -50, rotateX: 90 }}
      animate={{ y: 0, rotateX: 0 }}
      transition={{ type: 'spring', delay: 0.2 }}
      className="relative mb-8"
    >
      {/* Envelope animation */}
      <div className="w-48 h-32 bg-paper-warm rounded-lg relative overflow-hidden">
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: '20%' }}
          transition={{ delay: 0.8 }}
          className="absolute inset-x-4 bottom-0 h-24 bg-paper rounded-t-lg shadow-lg"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl text-blood">∞</span>
        </div>
      </div>
    </motion.div>
    <motion.p
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-xl text-paper/60 mb-4"
    >
      You wrote
    </motion.p>
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.5 }}
      className="flex items-baseline gap-2"
    >
      <span className="text-5xl sm:text-7xl md:text-8xl font-display text-gold">{stats.totalLetters}</span>
      <span className="text-3xl text-paper">letters</span>
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-lg text-paper/40 mt-8"
    >
      Messages waiting to be discovered
    </motion.p>
  </motion.div>
);

const SummarySlide: React.FC<{ stats: WrappedStats; year: number }> = ({ stats, year }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center h-full px-8 text-center"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring' }}
      className="text-6xl mb-6"
    >
      ∞
    </motion.div>
    <motion.h2
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-4xl font-display text-paper mb-8"
    >
      Your {year} Legacy
    </motion.h2>
    
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="grid grid-cols-2 gap-6 mb-8"
    >
      <div className="text-center">
        <p className="text-4xl font-display text-gold">{stats.totalMemories}</p>
        <p className="text-sm text-paper/60">Memories</p>
      </div>
      <div className="text-center">
        <p className="text-4xl font-display text-gold">{stats.totalVoiceStories}</p>
        <p className="text-sm text-paper/60">Voice Stories</p>
      </div>
      <div className="text-center">
        <p className="text-4xl font-display text-gold">{stats.totalLetters}</p>
        <p className="text-sm text-paper/60">Letters</p>
      </div>
      <div className="text-center">
        <p className="text-4xl font-display text-gold">{stats.familyMembersConnected}</p>
        <p className="text-sm text-paper/60">Family</p>
      </div>
    </motion.div>
    
    {stats.topEmotions && stats.topEmotions.length > 0 && (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-lg text-paper/60 mb-8"
    >
      Dominant emotion: <span className="text-gold">{stats.topEmotions[0].emotion}</span>
    </motion.p>
    )}
    
    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-8 py-3 bg-gold text-void-deep rounded-full font-semibold tracking-wide"
    >
      Share Your Wrapped
    </motion.button>
  </motion.div>
);

// Slide duration in milliseconds (like Spotify stories)
const SLIDE_DURATION = 6000;

// Main Wrapped component
const Wrapped: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Fetch available years from API
  const { data: yearsData } = useQuery({
    queryKey: ['wrapped-years'],
    queryFn: async () => {
      const response = await wrappedApi.getYears();
      return response.data;
    },
  });

  // Get available years (default to current year if no data)
  const availableYears = useMemo(() => {
    if (yearsData?.years && yearsData.years.length > 0) {
      return yearsData.years.sort((a: number, b: number) => b - a);
    }
    // Default to last 5 years if no data
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [yearsData, currentYear]);

  // Fetch wrapped data from API for selected year
  const { data: apiData } = useQuery({
    queryKey: ['wrapped', selectedYear],
    queryFn: async () => {
      if (selectedYear === currentYear) {
        const response = await wrappedApi.getCurrent();
        return response.data;
      } else {
        const response = await wrappedApi.getYear(selectedYear);
        return response.data;
      }
    },
  });

  // Transform API data or use defaults
  const stats: WrappedStats = apiData ? transformApiResponse(apiData) : getDefaultStats();
  const year = selectedYear;

  const slides = [
    <IntroSlide key="intro" year={year} />,
    <TotalMemoriesSlide key="memories" stats={stats} />,
    <VoiceStoriesSlide key="voices" stats={stats} />,
    <EmotionsSlide key="emotions" stats={stats} />,
    <FamilySlide key="family" stats={stats} />,
    <StreakSlide key="streak" stats={stats} />,
    <WordCloudSlide key="words" stats={stats} />,
    <LettersSlide key="letters" stats={stats} />,
    <SummarySlide key="summary" stats={stats} year={year} />,
  ];

  // Progress bar and auto-advance logic (Spotify-style)
  useEffect(() => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (!isAutoPlaying) {
      return;
    }

    // Reset progress when slide changes
    setProgress(0);

    // Update progress every 50ms for smooth animation
    const progressStep = (50 / SLIDE_DURATION) * 100;
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next slide when progress completes
          setCurrentSlide((currentSlide) => {
            if (currentSlide < slides.length - 1) {
              return currentSlide + 1;
            }
            // Stop auto-play at the end
            setIsAutoPlaying(false);
            return currentSlide;
          });
          return 0;
        }
        return prev + progressStep;
      });
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isAutoPlaying, currentSlide, slides.length]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  // Touch/swipe handling
  const x = useMotionValue(0);
  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -50 && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setIsAutoPlaying(false);
    } else if (info.offset.x > 50 && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setIsAutoPlaying(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
        setIsAutoPlaying(false);
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
        setIsAutoPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slides.length]);

  // Background gradient based on slide
  const bgGradients = [
    'from-void-deep via-sanctuary-blue to-void-deep',
    'from-void-deep via-gold/20 to-void-deep',
    'from-void-deep via-blood/20 to-void-deep',
    'from-void-deep via-sanctuary-teal to-void-deep',
    'from-void-deep via-gold/10 to-void-deep',
    'from-void-deep via-blood/10 to-void-deep',
    'from-void-deep via-sanctuary-blue to-void-deep',
    'from-void-deep via-gold/20 to-void-deep',
    'from-void-deep via-sanctuary-teal to-void-deep',
  ];

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 bg-gradient-to-b ${bgGradients[currentSlide]} transition-all duration-1000 overflow-hidden`}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gold rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * -200],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Year Slider - positioned below progress dots on mobile */}
      <div className="absolute top-20 sm:top-8 left-4 sm:left-8 flex items-center gap-2 sm:gap-3 z-50">
        <button
          onClick={() => {
            const idx = availableYears.indexOf(selectedYear);
            if (idx < availableYears.length - 1) {
              setSelectedYear(availableYears[idx + 1]);
              setCurrentSlide(0);
            }
          }}
          disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
          className="p-2 rounded-full border border-paper/30 text-paper/50 hover:text-gold hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-paper/30 bg-void-deep/50 backdrop-blur-sm">
          <Calendar size={16} className="text-gold" />
          <span className="text-xl font-display text-gold">{selectedYear}</span>
        </div>
        <button
          onClick={() => {
            const idx = availableYears.indexOf(selectedYear);
            if (idx > 0) {
              setSelectedYear(availableYears[idx - 1]);
              setCurrentSlide(0);
            }
          }}
          disabled={availableYears.indexOf(selectedYear) === 0}
          className="p-2 rounded-full border border-paper/30 text-paper/50 hover:text-gold hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Spotify-style progress bars */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-50 px-4 max-w-md w-full">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index);
              setProgress(0);
              setIsAutoPlaying(true);
            }}
            className="flex-1 h-1 bg-paper/20 rounded-full overflow-hidden relative"
          >
            <div
              className="absolute inset-y-0 left-0 bg-gold rounded-full transition-all duration-75"
              style={{
                width: index < currentSlide 
                  ? '100%' 
                  : index === currentSlide 
                    ? `${progress}%` 
                    : '0%'
              }}
            />
          </button>
        ))}
      </div>

      {/* Slide content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="h-full"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            {slides[currentSlide]}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Spotify-style controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4 z-50">
        {/* Previous button */}
        <button
          onClick={() => {
            if (currentSlide > 0) {
              setCurrentSlide(currentSlide - 1);
              setProgress(0);
            }
          }}
          disabled={currentSlide === 0}
          className={`p-3 rounded-full border transition-all ${
            currentSlide === 0
              ? 'border-paper/10 text-paper/20'
              : 'border-paper/30 text-paper hover:bg-paper/10'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Play/Pause button (center, larger) */}
        <button
          onClick={togglePlayPause}
          className="p-4 rounded-full bg-gold text-void-deep hover:bg-gold-bright transition-all shadow-lg"
        >
          {isAutoPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
        </button>

        {/* Next button */}
        <button
          onClick={() => {
            if (currentSlide < slides.length - 1) {
              setCurrentSlide(currentSlide + 1);
              setProgress(0);
            }
          }}
          disabled={currentSlide === slides.length - 1}
          className={`p-3 rounded-full border transition-all ${
            currentSlide === slides.length - 1
              ? 'border-paper/10 text-paper/20'
              : 'border-paper/30 text-paper hover:bg-paper/10'
          }`}
        >
          <ChevronRight size={20} />
        </button>

        {/* Mute button (for future audio support) */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full border border-paper/20 text-paper/50 hover:text-paper hover:border-paper/40 transition-all ml-4"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-8 right-8 p-2 text-paper/60 hover:text-paper transition-colors z-50"
      >
        ✕
      </button>
    </div>
  );
};

export default Wrapped;
