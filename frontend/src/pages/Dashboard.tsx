import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, Settings, Shield, Clock, Crown, ChevronRight, X, Check, Loader2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { billingApi, memoriesApi, familyApi, deadmanApi } from '../services/api';
import { PlatformTour, usePlatformTour } from '../components/PlatformTour';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const deskRef = useRef<HTMLDivElement>(null);
  
  const [showTrialWarning, setShowTrialWarning] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const { isOpen: isTourOpen, hasCompletedTour, openTour, closeTour, completeTour } = usePlatformTour();
  
  // Mouse tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-300, 300], [3, -3]);
  const rotateY = useTransform(mouseX, [-500, 500], [-4, 4]);
  
  const springConfig = { stiffness: 80, damping: 25 };
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  // Queries
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(r => r.data),
  });

  const { data: limits } = useQuery({
    queryKey: ['limits'],
    queryFn: () => billingApi.getLimits().then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['memories-stats'],
    queryFn: () => memoriesApi.getStats().then(r => r.data),
  });

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

  const { data: deadmanStatus } = useQuery({
    queryKey: ['deadman-status'],
    queryFn: () => deadmanApi.getStatus().then(r => r.data),
  });

  const { data: recentPhotos } = useQuery({
    queryKey: ['recent-photos'],
    queryFn: () => memoriesApi.getAll({ type: 'PHOTO', limit: 3 }).then(r => r.data),
  });

  const checkInMutation= useMutation({
    mutationFn: () => deadmanApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadman-status'] });
      showToastMessage('Check-in successful', 'success');
    },
  });

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Mouse move handler for desk parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!deskRef.current) return;
      const rect = deskRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isTrialing = subscription?.isTrialing;
  const trialDaysLeft = subscription?.trialDaysLeft || 0;

  useEffect(() => {
    if (!hasCompletedTour && user?.email !== 'demo@heirloom.app') {
      openTour();
    }
  }, [hasCompletedTour, openTour, user?.email]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <PlatformTour 
        isOpen={isTourOpen} 
        onClose={closeTour} 
        onComplete={completeTour} 
      />

      {/* Sanctuary Background with Constellation Effect */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      {/* Floating constellation particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() > 0.8 ? 3 : Math.random() > 0.5 ? 2 : 1,
              height: Math.random() > 0.8 ? 3 : Math.random() > 0.5 ? 2 : 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, rgba(201,169,89,${0.3 + Math.random() * 0.5}) 0%, transparent 70%)`,
            }}
            animate={{
              y: [0, -80 - Math.random() * 80, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 10 + Math.random() * 15,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Ambient desk lamp glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none">
        <div 
          className="w-full h-full rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,180,80,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl flex items-center gap-3 ${
              toast.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
            }`}
            style={{
              background: 'rgba(18, 21, 28, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            {toast.type === 'success' ? <Check className="text-green-400" size={20} /> : <X className="text-red-400" size={20} />}
            <span className="text-paper">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 px-6 md:px-12 py-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              <span className="text-4xl text-gold" style={{ textShadow: '0 0 20px rgba(201,169,89,0.5)' }}>∞</span>
            </motion.div>
            <div>
              <span className="text-xl tracking-[0.2em] text-paper/90 font-light">HEIRLOOM</span>
              <div className="text-xs text-gold/60 tracking-widest">SANCTUARY</div>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            {/* Dead Man's Switch Status */}
            {deadmanStatus?.enabled && (
              <motion.button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition-all ${
                  deadmanStatus.needsCheckIn 
                    ? 'bg-blood/20 border border-blood/40 text-blood' 
                    : 'bg-green-500/10 border border-green-500/30 text-green-400'
                }`}
                style={{ backdropFilter: 'blur(10px)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {checkInMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shield size={16} />
                )}
                <span className="hidden sm:inline">
                  {deadmanStatus.needsCheckIn ? 'Check In' : 'Protected'}
                </span>
              </motion.button>
            )}

            {/* Notifications */}
            <motion.button
              className="w-11 h-11 rounded-xl flex items-center justify-center text-paper/60 hover:text-gold transition-colors relative"
              style={{ background: 'rgba(18,21,28,0.6)', backdropFilter: 'blur(10px)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={20} />
              {isTrialing && (
                <motion.span 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>

            {/* Settings */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-paper/60 hover:text-gold transition-colors"
              style={{ background: 'rgba(18,21,28,0.6)', backdropFilter: 'blur(10px)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={20} />
            </motion.button>

            {/* User avatar */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="w-11 h-11 rounded-xl flex items-center justify-center font-medium relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #c9a959 0%, #8b7355 100%)',
                boxShadow: '0 4px 15px rgba(201,169,89,0.3)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <span className="relative text-void font-semibold">{user?.firstName?.[0] || 'U'}</span>
            </motion.button>
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
            className="relative z-10 px-6 md:px-12 pb-4"
          >
            <div className="max-w-7xl mx-auto">
              <motion.div 
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,169,89,0.1) 0%, rgba(201,169,89,0.05) 100%)',
                  border: '1px solid rgba(201,169,89,0.2)',
                  backdropFilter: 'blur(10px)',
                }}
                initial={{ x: -20 }}
                animate={{ x: 0 }}
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(201,169,89,0.2)' }}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Clock size={22} className="text-gold" />
                  </motion.div>
                  <div>
                    <p className="font-medium text-paper">
                      {trialDaysLeft} days remaining in your trial
                    </p>
                    <p className="text-sm text-paper/50">
                      Upgrade to keep your memories forever
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => navigate('/settings?tab=subscription')}
                    className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #c9a959 0%, #a08335 100%)',
                      color: '#0a0c10',
                      boxShadow: '0 4px 15px rgba(201,169,89,0.3)',
                    }}
                    whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(201,169,89,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Crown size={16} />
                    Upgrade
                  </motion.button>
                  <button
                    onClick={() => setShowTrialWarning(false)}
                    className="p-2 text-paper/40 hover:text-paper transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light mb-3">
              Welcome back, <em className="text-gold not-italic">{user?.firstName || 'Friend'}</em>
            </h1>
            <p className="text-paper/50 text-lg">Your sanctuary awaits</p>
          </motion.div>

          {/* 3D Desk with Realistic Objects */}
          <motion.div
            ref={deskRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mb-12"
            style={{ perspective: '2000px' }}
          >
            <motion.div
              style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Realistic Wooden Desk Surface */}
              <div 
                className="relative rounded-3xl overflow-hidden"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(75,55,35,0.98) 0%, 
                      rgba(55,42,28,0.98) 20%,
                      rgba(45,35,24,0.98) 40%,
                      rgba(50,38,26,0.98) 60%,
                      rgba(60,45,30,0.98) 80%,
                      rgba(70,52,32,0.98) 100%
                    )
                  `,
                  boxShadow: `
                    0 60px 120px -30px rgba(0,0,0,0.8),
                    0 30px 60px -20px rgba(0,0,0,0.5),
                    inset 0 2px 0 rgba(255,255,255,0.05),
                    inset 0 -3px 0 rgba(0,0,0,0.4)
                  `,
                  padding: '2rem',
                  minHeight: '450px',
                }}
              >
                {/* Wood grain texture */}
                <div 
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        87deg,
                        transparent 0px,
                        rgba(0,0,0,0.02) 1px,
                        transparent 2px,
                        transparent 15px
                      ),
                      repeating-linear-gradient(
                        3deg,
                        transparent 0px,
                        rgba(100,70,40,0.03) 80px,
                        transparent 160px
                      )
                    `,
                  }}
                />

                {/* Desk edge polish highlight */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" />
                
                {/* Leather desk pad */}
                <div 
                  className="absolute inset-8 rounded-2xl"
                  style={{
                    background: 'linear-gradient(180deg, #1a1510 0%, #12100c 100%)',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(201,169,89,0.1)',
                  }}
                >
                  {/* Leather stitching */}
                  <div className="absolute inset-3 rounded-xl border border-dashed border-gold/10" />
                </div>

                {/* Main Interactive Objects Grid */}
                <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 p-4 lg:p-8">
                  
                  {/* Photo Stack - Memories */}
                  <motion.button
                    onClick={() => navigate('/memories')}
                    onMouseEnter={() => setHoveredItem('memories')}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="group relative aspect-[3/4]"
                    whileHover={{ scale: 1.03, y: -8, rotateY: 5 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Stacked polaroid photos */}
                    {[3, 2, 1, 0].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0"
                        style={{
                          transform: `rotate(${(i - 1.5) * 8}deg) translateZ(${i * 6}px)`,
                          transformStyle: 'preserve-3d',
                        }}
                        animate={hoveredItem === 'memories' && i === 0 ? { rotate: [-4, 0, -4] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {/* Polaroid frame */}
                        <div 
                          className="w-full h-full rounded-sm"
                          style={{
                            background: 'linear-gradient(180deg, #fefefe 0%, #f8f5f0 50%, #f0ebe3 100%)',
                            boxShadow: i === 0 
                              ? '0 8px 25px rgba(0,0,0,0.4), 0 3px 10px rgba(0,0,0,0.3)'
                              : '0 4px 15px rgba(0,0,0,0.3)',
                            padding: '8%',
                            paddingBottom: '20%',
                          }}
                        >
                          {/* Photo area */}
                          <div 
                            className="w-full h-full rounded-sm overflow-hidden relative"
                            style={{
                              background: 'linear-gradient(135deg, #d4c4a8 0%, #c9b896 50%, #bea882 100%)',
                            }}
                          >
                            {i === 0 && recentPhotos?.memories?.[0] ? (
                              <img 
                                src={recentPhotos.memories[0].metadata?.thumbnailUrl || recentPhotos.memories[0].fileUrl} 
                                alt={recentPhotos.memories[0].title}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <>
                                {/* Simulated photo content */}
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-orange-300/20" />
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
                              </>
                            )}
                            {/* Photo highlight */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Label */}
                    <div className="absolute -bottom-12 left-0 right-0 text-center">
                      <h3 className="text-lg font-medium text-paper group-hover:text-gold transition-colors">Memory Vault</h3>
                      <p className="text-sm text-paper/40">{stats?.totalMemories || 0} treasures</p>
                    </div>
                    
                    {/* Hover glow */}
                    <motion.div 
                      className="absolute -inset-4 rounded-2xl pointer-events-none"
                      animate={{ opacity: hoveredItem === 'memories' ? 0.15 : 0 }}
                      style={{ background: 'radial-gradient(circle, #c9a959 0%, transparent 70%)' }}
                    />
                  </motion.button>

                  {/* Vintage Tape Recorder - Voice */}
                  <motion.button
                    onClick={() => navigate('/record')}
                    onMouseEnter={() => setHoveredItem('record')}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="group relative aspect-[3/4]"
                    whileHover={{ scale: 1.03, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Recorder body */}
                    <div 
                      className="w-full h-full rounded-xl relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(180deg, #2d2825 0%, #1f1c19 40%, #151311 100%)',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.4)',
                      }}
                    >
                      {/* Brushed metal top */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1/6"
                        style={{
                          background: 'linear-gradient(180deg, #3a3632 0%, #2d2a26 100%)',
                          borderBottom: '1px solid rgba(0,0,0,0.3)',
                        }}
                      >
                        <div className="absolute inset-0 opacity-30"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
                          }}
                        />
                      </div>

                      {/* Tape reels */}
                      <div className="absolute top-1/6 left-0 right-0 flex justify-center gap-4 p-4">
                        {[0, 1].map((i) => (
                          <motion.div
                            key={i}
                            className="relative"
                            animate={hoveredItem === 'record' ? { rotate: 360 } : { rotate: 0 }}
                            transition={{ duration: 2, repeat: hoveredItem === 'record' ? Infinity : 0, ease: 'linear' }}
                          >
                            <div 
                              className="w-14 h-14 rounded-full"
                              style={{
                                background: 'radial-gradient(circle at 35% 35%, #4a4540 0%, #2a2520 40%, #1a1510 100%)',
                                boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.3)',
                              }}
                            >
                              {/* Reel spokes */}
                              {[0, 60, 120, 180, 240, 300].map((deg) => (
                                <div
                                  key={deg}
                                  className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-gold/15 origin-left"
                                  style={{ transform: `rotate(${deg}deg)` }}
                                />
                              ))}
                              {/* Center hub */}
                              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-gold/20 to-transparent" />
                              <div className="absolute inset-5 rounded-full bg-void" />
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* VU Meter display */}
                      <div 
                        className="absolute bottom-1/4 left-4 right-4 h-12 rounded"
                        style={{
                          background: '#0a0908',
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
                        }}
                      >
                        <div className="absolute inset-1 flex items-end justify-center gap-0.5 px-2">
                          {[...Array(16)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 rounded-sm"
                              style={{
                                background: i < 10 ? '#22c55e' : i < 13 ? '#eab308' : '#ef4444',
                              }}
                              animate={{
                                height: hoveredItem === 'record' 
                                  ? `${20 + Math.random() * 80}%`
                                  : '15%',
                              }}
                              transition={{ duration: 0.1, repeat: hoveredItem === 'record' ? Infinity : 0 }}
                            />
                          ))}
                        </div>
                        {/* Screen glare */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded" />
                      </div>

                      {/* Control buttons */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <motion.div 
                          className="w-8 h-8 rounded-full"
                          style={{
                            background: 'radial-gradient(circle at 35% 35%, #a83250 0%, #8b2942 60%, #5a1a2a 100%)',
                            boxShadow: '0 3px 8px rgba(139,41,66,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                          }}
                          animate={hoveredItem === 'record' ? { scale: [1, 0.95, 1] } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                        <div 
                          className="w-8 h-8 rounded"
                          style={{
                            background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                          }}
                        />
                      </div>

                      {/* Brand emboss */}
                      <div className="absolute bottom-14 left-0 right-0 text-center">
                        <span className="text-gold/20 text-[10px] tracking-[0.3em]">HEIRLOOM</span>
                      </div>
                    </div>
                    
                    {/* Label */}
                    <div className="absolute -bottom-12 left-0 right-0 text-center">
                      <h3 className="text-lg font-medium text-paper group-hover:text-gold transition-colors">Voice Stories</h3>
                      <p className="text-sm text-paper/40">{stats?.totalVoiceMinutes || 0} minutes</p>
                    </div>
                    
                    <motion.div 
                      className="absolute -inset-4 rounded-2xl pointer-events-none"
                      animate={{ opacity: hoveredItem === 'record' ? 0.15 : 0 }}
                      style={{ background: 'radial-gradient(circle, #c9a959 0%, transparent 70%)' }}
                    />
                  </motion.button>

                  {/* Sealed Letter - Compose */}
                  <motion.button
                    onClick={() => navigate('/compose')}
                    onMouseEnter={() => setHoveredItem('compose')}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="group relative aspect-[3/4]"
                    whileHover={{ scale: 1.03, y: -8, rotateZ: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Envelope */}
                    <div 
                      className="w-full h-full relative"
                      style={{
                        background: 'linear-gradient(180deg, #f8f5ef 0%, #f0ebe3 50%, #e8e2d8 100%)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.35), 0 4px 10px rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                      }}
                    >
                      {/* Paper texture */}
                      <div className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }}
                      />

                      {/* Envelope flap */}
                      <div 
                        className="absolute top-0 left-0 right-0"
                        style={{
                          height: '45%',
                          background: 'linear-gradient(180deg, #ebe5db 0%, #e0d9ce 100%)',
                          clipPath: 'polygon(0 0, 100% 0, 100% 30%, 50% 100%, 0 30%)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      />

                      {/* Written address lines (simulated) */}
                      <div className="absolute top-1/2 left-6 right-6 space-y-2">
                        <div className="h-0.5 w-3/4 bg-amber-900/15 rounded" />
                        <div className="h-0.5 w-1/2 bg-amber-900/10 rounded" />
                      </div>

                      {/* Wax seal */}
                      <motion.div
                        className="absolute top-[35%] left-1/2 -translate-x-1/2 w-14 h-14"
                        style={{ transformStyle: 'preserve-3d' }}
                        animate={hoveredItem === 'compose' ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div 
                          className="w-full h-full rounded-full flex items-center justify-center"
                          style={{
                            background: 'radial-gradient(circle at 30% 30%, #c04060 0%, #8b2942 50%, #5a1a2a 100%)',
                            boxShadow: '0 4px 15px rgba(139,41,66,0.5), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.3)',
                          }}
                        >
                          <span className="text-paper/90 text-xl" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>∞</span>
                        </div>
                      </motion.div>

                      {/* Fountain pen */}
                      <motion.div
                        className="absolute -bottom-2 -right-4"
                        style={{
                          width: '100px',
                          height: '14px',
                          background: 'linear-gradient(90deg, #1a1a2e 0%, #2d2d44 40%, #1a1a2e 100%)',
                          borderRadius: '2px 6px 6px 2px',
                          transform: 'rotate(-30deg)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                        }}
                        animate={hoveredItem === 'compose' ? { rotate: [-30, -28, -30] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {/* Nib */}
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
                          style={{
                            width: '16px',
                            height: '6px',
                            background: 'linear-gradient(90deg, #e8d5a3 0%, #c9a959 100%)',
                            clipPath: 'polygon(100% 0%, 100% 100%, 0% 50%)',
                          }}
                        />
                        {/* Gold band */}
                        <div className="absolute right-6 top-0 bottom-0 w-3 bg-gradient-to-b from-gold via-gold-dim to-gold rounded-sm" />
                      </motion.div>
                    </div>
                    
                    {/* Label */}
                    <div className="absolute -bottom-12 left-0 right-0 text-center">
                      <h3 className="text-lg font-medium text-paper group-hover:text-gold transition-colors">Time Letters</h3>
                      <p className="text-sm text-paper/40">{stats?.totalLetters || 0} sealed</p>
                    </div>
                    
                    <motion.div 
                      className="absolute -inset-4 rounded-2xl pointer-events-none"
                      animate={{ opacity: hoveredItem === 'compose' ? 0.15 : 0 }}
                      style={{ background: 'radial-gradient(circle, #c9a959 0%, transparent 70%)' }}
                    />
                  </motion.button>

                  {/* Family Frame - Constellation */}
                  <motion.button
                    onClick={() => navigate('/family')}
                    onMouseEnter={() => setHoveredItem('family')}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="group relative aspect-[3/4]"
                    whileHover={{ scale: 1.03, y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Ornate picture frame */}
                    <div 
                      className="w-full h-full rounded-lg relative"
                      style={{
                        background: 'linear-gradient(145deg, #a08060 0%, #7a6050 20%, #5a4535 50%, #7a6050 80%, #a08060 100%)',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -2px 0 rgba(0,0,0,0.3)',
                        padding: '12px',
                      }}
                    >
                      {/* Frame inner bevel */}
                      <div 
                        className="absolute inset-2 rounded"
                        style={{
                          boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.1)',
                          background: 'linear-gradient(180deg, #1a1510 0%, #0f0d0a 100%)',
                        }}
                      >
                        {/* Constellation visualization */}
                        <div className="absolute inset-2 overflow-hidden">
                          {/* Stars (family members) */}
                          {family?.slice(0, 6).map((member: any, i: number) => {
                            const positions = [
                              { x: 50, y: 30 },
                              { x: 25, y: 50 },
                              { x: 75, y: 50 },
                              { x: 35, y: 75 },
                              { x: 65, y: 75 },
                              { x: 50, y: 55 },
                            ];
                            return (
                              <motion.div
                                key={member.id}
                                className="absolute flex items-center justify-center"
                                style={{
                                  left: `${positions[i]?.x || 50}%`,
                                  top: `${positions[i]?.y || 50}%`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <motion.div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-void"
                                  style={{
                                    background: 'radial-gradient(circle at 30% 30%, #e8d5a3 0%, #c9a959 60%, #8b7355 100%)',
                                    boxShadow: '0 0 15px rgba(201,169,89,0.6), 0 2px 4px rgba(0,0,0,0.3)',
                                  }}
                                  animate={{
                                    boxShadow: [
                                      '0 0 15px rgba(201,169,89,0.6)',
                                      '0 0 25px rgba(201,169,89,0.8)',
                                      '0 0 15px rgba(201,169,89,0.6)',
                                    ],
                                  }}
                                  transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                                >
                                  {member.name?.trim?.()?.[0] ?? '?'}
                                </motion.div>
                              </motion.div>
                            );
                          })}

                          {/* Connection lines */}
                          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                            <line x1="50%" y1="30%" x2="25%" y2="50%" stroke="#c9a959" strokeWidth="1" />
                            <line x1="50%" y1="30%" x2="75%" y2="50%" stroke="#c9a959" strokeWidth="1" />
                            <line x1="25%" y1="50%" x2="35%" y2="75%" stroke="#c9a959" strokeWidth="1" />
                            <line x1="75%" y1="50%" x2="65%" y2="75%" stroke="#c9a959" strokeWidth="1" />
                          </svg>

                          {/* Empty state */}
                          {(!family || family.length === 0) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-paper/30 text-xs text-center px-4">Add family to see your constellation</p>
                            </div>
                          )}

                          {/* Twinkling background stars */}
                          {[...Array(20)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-0.5 h-0.5 rounded-full bg-gold/40"
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                              }}
                              animate={{ opacity: [0.2, 0.8, 0.2] }}
                              transition={{ duration: 1 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Frame decorations */}
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full bg-gradient-to-b from-gold/40 to-transparent" />
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 rounded-full bg-gradient-to-t from-gold/40 to-transparent" />
                    </div>
                    
                    {/* Label */}
                    <div className="absolute -bottom-12 left-0 right-0 text-center">
                      <h3 className="text-lg font-medium text-paper group-hover:text-gold transition-colors">Constellation</h3>
                      <p className="text-sm text-paper/40">{family?.length || 0} stars</p>
                    </div>
                    
                    <motion.div 
                      className="absolute -inset-4 rounded-2xl pointer-events-none"
                      animate={{ opacity: hoveredItem === 'family' ? 0.15 : 0 }}
                      style={{ background: 'radial-gradient(circle, #c9a959 0%, transparent 70%)' }}
                    />
                  </motion.button>
                </div>

                {/* Decorative desk objects */}
                
                {/* Candle with flame */}
                <motion.div
                  className="absolute top-4 right-8 hidden lg:block"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Flame glow */}
                  <motion.div
                    className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(255,180,50,0.25) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  />
                  {/* Flame */}
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2"
                    animate={{ scaleY: [1, 1.15, 0.95, 1.1, 1], scaleX: [1, 0.92, 1.08, 0.96, 1] }}
                    transition={{ duration: 0.25, repeat: Infinity }}
                  >
                    <div 
                      className="w-4 h-7"
                      style={{
                        background: 'linear-gradient(0deg, #ff6b00 0%, #ffaa00 40%, #ffcc00 70%, #fff 100%)',
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                        filter: 'blur(0.5px)',
                      }}
                    />
                  </motion.div>
                  {/* Candle body */}
                  <div 
                    className="w-7 h-24 rounded-sm"
                    style={{
                      background: 'linear-gradient(180deg, #faf5e8 0%, #f0e8d8 50%, #e5dcc8 100%)',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.3), inset -3px 0 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Wax drip */}
                    <div className="absolute top-2 -left-1 w-3 h-10 bg-gradient-to-b from-white/80 to-transparent rounded-full" style={{ filter: 'blur(1px)' }} />
                  </div>
                </motion.div>

                {/* Ink bottle */}
                <motion.div
                  className="absolute bottom-6 left-8 w-10 h-14 hidden lg:block"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div 
                    className="w-full h-full rounded-b-lg rounded-t-sm"
                    style={{
                      background: 'linear-gradient(180deg, rgba(15,15,25,0.95) 0%, rgba(5,5,15,0.98) 100%)',
                      boxShadow: 'inset 0 -8px 16px rgba(201,169,89,0.15), 0 4px 10px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div className="absolute bottom-0 left-1 right-1 h-1/3 rounded-b-md bg-gradient-to-t from-gold/25 to-transparent" />
                    <div className="absolute inset-0 rounded-b-lg bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                  </div>
                  <div 
                    className="absolute -top-2 left-1 right-1 h-3 rounded-t-full"
                    style={{
                      background: 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </motion.div>

                {/* Wax seal stamp */}
                <motion.div
                  className="absolute bottom-6 right-8 hidden lg:block"
                  animate={{ rotate: [0, 3, 0, -3, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <div 
                    className="w-12 h-12 rounded-full"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, #a83250 0%, #8b2942 50%, #5a1a2a 100%)',
                      boxShadow: '0 4px 12px rgba(139,41,66,0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-paper/90 text-lg">∞</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Cards Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-5"
          >
            {/* Storage Card */}
            <motion.div 
              className="p-5 rounded-2xl"
              style={{
                background: 'rgba(18, 21, 28, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
              whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-paper/70 font-medium">Storage Used</h3>
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(201,169,89,0.2)', color: '#c9a959' }}
                >
                  {subscription?.tier || 'Trial'}
                </span>
              </div>
              <div 
                className="h-2 rounded-full mb-3 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <motion.div 
                  className="h-full rounded-full"
                  style={{ 
                    background: 'linear-gradient(90deg, #c9a959 0%, #e8d5a3 100%)',
                    boxShadow: '0 0 10px rgba(201,169,89,0.5)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${limits?.storageUsedPercent || 0}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-sm text-paper/50">
                <span>{limits?.storageUsedMB || 0} MB</span>
                <span>{limits?.storageLimitMB || 100} MB limit</span>
              </div>
            </motion.div>

            {/* Protection Status Card */}
            <motion.div 
              className="p-5 rounded-2xl"
              style={{
                background: 'rgba(18, 21, 28, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
              whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-paper/70 font-medium">Protection Status</h3>
                <Shield size={20} className={deadmanStatus?.enabled ? 'text-green-400' : 'text-paper/30'} />
              </div>
              {deadmanStatus?.enabled ? (
                <>
                  <p className="text-green-400 font-medium mb-2">Active & Protected</p>
                  <p className="text-sm text-paper/50">
                    Next check-in: {deadmanStatus.nextCheckIn ? new Date(deadmanStatus.nextCheckIn).toLocaleDateString() : 'N/A'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-paper/50 mb-3">Not yet configured</p>
                  <button
                    onClick={() => navigate('/settings?tab=deadman')}
                    className="text-sm text-gold hover:text-gold-bright transition-colors flex items-center gap-1"
                  >
                    Set up protection <ChevronRight size={14} />
                  </button>
                </>
              )}
            </motion.div>

            {/* Quick Actions Card */}
            <motion.div 
              className="p-5 rounded-2xl"
              style={{
                background: 'rgba(18, 21, 28, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
              whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
            >
              <h3 className="text-paper/70 font-medium mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <motion.button
                  onClick={() => navigate('/compose')}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                  whileHover={{ background: 'rgba(255,255,255,0.06)', x: 2 }}
                >
                  <span className="text-paper/80">Write a letter</span>
                  <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
                </motion.button>
                <motion.button
                  onClick={() => navigate('/record')}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                  whileHover={{ background: 'rgba(255,255,255,0.06)', x: 2 }}
                >
                  <span className="text-paper/80">Record your voice</span>
                  <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
