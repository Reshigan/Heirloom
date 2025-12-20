import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, Shield, Clock, Crown, X, Check, Loader2, RefreshCw, Mic, Edit3, Share2
} from '../components/Icons';
import { useAuthStore } from '../stores/authStore';
import { billingApi, memoriesApi, familyApi, deadmanApi, aiApi } from '../services/api';
import { Navigation } from '../components/Navigation';

// Sanctuary Object Icons as SVG components
const MemoriesIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
    <rect x="8" y="12" width="56" height="48" rx="4"/>
    <circle cx="24" cy="32" r="6" fill="currentColor" fillOpacity="0.3"/>
    <path d="M8 48l16-12 12 8 20-16 8 8"/>
    <rect x="4" y="16" width="56" height="48" rx="4" strokeOpacity="0.3"/>
    <rect x="12" y="8" width="56" height="48" rx="4" strokeOpacity="0.15"/>
  </svg>
);

const LettersIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
    <rect x="8" y="8" width="56" height="56" rx="4"/>
    <path d="M16 24h40M16 34h40M16 44h28" strokeOpacity="0.4"/>
    <path d="M58 52c0-12-8-16-12-16s-10 4-14 12" strokeWidth="2"/>
    <circle cx="58" cy="52" r="2" fill="currentColor"/>
  </svg>
);

const VoiceIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
    <rect x="26" y="8" width="20" height="32" rx="10"/>
    <path d="M14 32v4a22 22 0 0044 0v-4"/>
    <path d="M36 58v8M28 66h16"/>
    <path d="M20 24h8M44 24h8M20 32h8M44 32h8" strokeOpacity="0.4"/>
  </svg>
);

const FamilyIcon = () => (
  <svg viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
    <circle cx="36" cy="16" r="8"/>
    <circle cx="16" cy="52" r="7"/>
    <circle cx="36" cy="52" r="7"/>
    <circle cx="56" cy="52" r="7"/>
    <path d="M36 24v12M36 36l-20 9M36 36l20 9"/>
  </svg>
);

const CornerMark = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full" stroke="currentColor" strokeWidth="1" fill="none">
    <path d="M2 12V2h10"/>
  </svg>
);

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [showTrialWarning, setShowTrialWarning] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  // Queries
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(r => r.data),
  });

  const { data: rawStats } = useQuery({
    queryKey: ['memories-stats'],
    queryFn: () => memoriesApi.getStats().then(r => r.data),
  });

  const stats = rawStats ? {
    totalMemories: rawStats.total || 0,
    totalLetters: rawStats.byType?.letters || 0,
    totalVoiceMinutes: rawStats.byType?.voice || 0,
  } : undefined;

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

  const { data: deadmanStatus } = useQuery({
    queryKey: ['deadman-status'],
    queryFn: () => deadmanApi.getStatus().then(r => r.data),
  });

  const { data: legacyScore } = useQuery({
    queryKey: ['legacy-score'],
    queryFn: () => aiApi.getLegacyScore().then(r => r.data),
  });

  const checkInMutation = useMutation({
    mutationFn: () => deadmanApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadman-status'] });
      showToast('Check-in successful', 'success');
    },
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load AI prompt on mount
  useEffect(() => {
    const loadPrompt = async () => {
      setIsLoadingPrompt(true);
      try {
        const response = await aiApi.getPrompt();
        setAiPrompt(response.data?.prompt || "What's a childhood memory that shaped who you are today?");
      } catch {
        setAiPrompt("What's a childhood memory that shaped who you are today?");
      }
      setIsLoadingPrompt(false);
    };
    loadPrompt();
  }, []);

  const refreshPrompt = async () => {
    setIsLoadingPrompt(true);
    try {
      const response = await aiApi.getPrompt();
      setAiPrompt(response.data?.prompt || "What moment are you most grateful for this year?");
    } catch {
      setAiPrompt("What moment are you most grateful for this year?");
    }
    setIsLoadingPrompt(false);
  };

  const isTrialing = subscription?.status === 'TRIALING';
  const trialDaysLeft = subscription?.trialDaysRemaining || 0;
  const familyCount = Array.isArray(family) ? family.length : (family?.data?.length || 0);

  // Calculate legacy score percentage
  const scorePercent = legacyScore?.score || 0;
  const scoreTier = typeof legacyScore?.tier === 'object' ? legacyScore.tier.name : (legacyScore?.tier || 'Just Started');
  const scoreTierDescription = typeof legacyScore?.tier === 'object' ? legacyScore.tier.description : legacyScore?.description;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Eternal Background */}
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold/30"
            style={{
              width: 2 + Math.random() * 2,
              height: 2 + Math.random() * 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <Navigation />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl glass-strong flex items-center gap-3 ${
              toast.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="text-green-400" size={20} /> : <X className="text-red-400" size={20} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Controls */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 px-6 md:px-12 pt-20 md:pt-24"
      >
        <div className="flex items-center justify-end max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Dead Man's Switch Status */}
            {deadmanStatus?.enabled && (
              <motion.button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className={`px-4 py-2 rounded-lg glass flex items-center gap-2 text-sm transition-all ${
                  deadmanStatus.needsCheckIn ? 'border border-blood/50 text-blood' : 'text-green-400'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {checkInMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                {deadmanStatus.needsCheckIn ? 'Check In Required' : 'Protected'}
              </motion.button>
            )}

            {/* Notifications */}
            <div className="relative">
              <motion.button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-12 h-12 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper transition-colors relative border border-paper/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell size={20} />
                {isTrialing && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blood rounded-full" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Trial Warning Banner */}
      <AnimatePresence>
        {isTrialing && showTrialWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 px-6 md:px-12 mt-4"
          >
            <div className="max-w-7xl mx-auto">
              <div className="glass border border-gold/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Clock size={20} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-medium">{trialDaysLeft} days left in your trial</p>
                    <p className="text-sm text-paper/50">Upgrade now to keep your memories forever</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => navigate('/settings?tab=subscription')}
                    className="btn btn-primary btn-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Crown size={16} />
                    Upgrade
                  </motion.button>
                  <button
                    onClick={() => setShowTrialWarning(false)}
                    className="text-paper/40 hover:text-paper transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 py-8 md:py-16 max-w-[1400px] mx-auto">
        
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="text-sm tracking-[0.2em] text-paper/50 uppercase mb-4">Your Sanctuary Awaits</p>
          <h1 className="font-display text-4xl md:text-5xl font-normal tracking-wide mb-5">
            Welcome back, <em className="font-body italic text-gold">{user?.firstName || 'Friend'}</em>
          </h1>
          <p className="text-paper/50 text-lg font-light max-w-lg mx-auto">
            Every moment you preserve becomes eternal. What will you create today?
          </p>
        </motion.section>

        {/* Sanctuary Grid - Four Sacred Objects */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mb-16 md:mb-20"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Memories */}
            <motion.button
              onClick={() => navigate('/memories')}
              className="sanctuary-object group"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="sanctuary-corner sanctuary-corner--tl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--tr"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--bl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--br"><CornerMark /></div>
              <div className="sanctuary-content">
                <div className="sanctuary-symbol text-gold group-hover:scale-110 transition-transform duration-500">
                  <MemoriesIcon />
                </div>
                <h3 className="sanctuary-title group-hover:text-gold transition-colors">Memories</h3>
                <p className="sanctuary-count">{stats?.totalMemories || 0} preserved</p>
              </div>
            </motion.button>

            {/* Letters */}
            <motion.button
              onClick={() => navigate('/compose')}
              className="sanctuary-object group"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="sanctuary-corner sanctuary-corner--tl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--tr"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--bl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--br"><CornerMark /></div>
              <div className="sanctuary-content">
                <div className="sanctuary-symbol text-gold group-hover:scale-110 transition-transform duration-500">
                  <LettersIcon />
                </div>
                <h3 className="sanctuary-title group-hover:text-gold transition-colors">Letters</h3>
                <p className="sanctuary-count">{stats?.totalLetters || 0} written</p>
              </div>
            </motion.button>

            {/* Voice */}
            <motion.button
              onClick={() => navigate('/record')}
              className="sanctuary-object group"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="sanctuary-corner sanctuary-corner--tl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--tr"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--bl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--br"><CornerMark /></div>
              <div className="sanctuary-content">
                <div className="sanctuary-symbol text-gold group-hover:scale-110 transition-transform duration-500">
                  <VoiceIcon />
                </div>
                <h3 className="sanctuary-title group-hover:text-gold transition-colors">Voice</h3>
                <p className="sanctuary-count">{stats?.totalVoiceMinutes || 0} minutes</p>
              </div>
            </motion.button>

            {/* Family */}
            <motion.button
              onClick={() => navigate('/family')}
              className="sanctuary-object group"
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="sanctuary-corner sanctuary-corner--tl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--tr"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--bl"><CornerMark /></div>
              <div className="sanctuary-corner sanctuary-corner--br"><CornerMark /></div>
              <div className="sanctuary-content">
                <div className="sanctuary-symbol text-gold group-hover:scale-110 transition-transform duration-500">
                  <FamilyIcon />
                </div>
                <h3 className="sanctuary-title group-hover:text-gold transition-colors">Family</h3>
                <p className="sanctuary-count">{familyCount} connected</p>
              </div>
            </motion.button>
          </div>
        </motion.section>

        {/* Legacy Score Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="mb-16 md:mb-20"
        >
          <div className="legacy-card">
            {/* Share Button */}
            <button className="legacy-share">
              <Share2 size={18} />
            </button>

            {/* Legacy Orb with Ring */}
            <div className="legacy-orb">
              <div className="legacy-orb-glow" />
              <div className="legacy-ring-container">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8c878"/>
                      <stop offset="100%" stopColor="#9c7a3c"/>
                    </linearGradient>
                  </defs>
                  <circle 
                    cx="80" cy="80" r="70" 
                    fill="none" 
                    stroke="rgba(235, 230, 220, 0.08)" 
                    strokeWidth="3"
                  />
                  <circle 
                    cx="80" cy="80" r="70" 
                    fill="none" 
                    stroke="url(#goldGradient)" 
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="440"
                    strokeDashoffset={440 - (440 * scorePercent) / 100}
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(212, 168, 83, 0.4))' }}
                  />
                </svg>
              </div>
              <div className="legacy-value">
                <span className="font-display text-4xl md:text-5xl tracking-wide">{scorePercent}</span>
                <span className="text-xs tracking-[0.2em] text-paper/50 uppercase mt-1">Score</span>
              </div>
            </div>

            {/* Legacy Info */}
            <div className="legacy-info">
              <div className="legacy-tier">
                <div className="legacy-tier-badge">
                  <Shield size={24} />
                </div>
                <span className="legacy-tier-name">{scoreTier}</span>
              </div>
              <p className="legacy-desc">
                {scoreTierDescription || 'Continue preserving memories to build your legacy and unlock new tiers.'}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Reflection Card - AI Prompt */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          className="mb-16 md:mb-20"
        >
          <div className="reflection-card">
            {/* Decorative top line */}
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            
            <div className="reflection-header">
              <div className="reflection-icon">
                <svg viewBox="0 0 24 24" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5" fill="none">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3"/>
                </svg>
              </div>
              <div className="reflection-meta">
                <h3 className="font-display text-sm tracking-[0.12em] uppercase">Today's Reflection</h3>
                <p className="text-xs text-paper/50 mt-1">Personalized by Heirloom AI</p>
              </div>
            </div>

            <p className="reflection-prompt">
              {isLoadingPrompt ? (
                <span className="text-paper/50">Loading your personalized prompt...</span>
              ) : (
                `"${aiPrompt}"`
              )}
            </p>

            <div className="reflection-actions">
              <motion.button
                onClick={() => navigate('/record')}
                className="btn btn-record"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="pulse-dot" />
                <Mic size={16} />
                Record Answer
              </motion.button>
              <motion.button
                onClick={() => navigate('/compose')}
                className="btn btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 size={16} />
                Write Instead
              </motion.button>
              <motion.button
                onClick={refreshPrompt}
                disabled={isLoadingPrompt}
                className="btn btn-ghost"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw size={16} className={isLoadingPrompt ? 'animate-spin' : ''} />
                New Prompt
              </motion.button>
            </div>
          </div>
        </motion.section>

      </main>
    </div>
  );
}
