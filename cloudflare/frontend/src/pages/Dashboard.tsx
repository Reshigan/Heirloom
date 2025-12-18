import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, Settings, Shield, Clock, Crown,
  ChevronRight, X, Check, Loader2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { billingApi, memoriesApi, familyApi, deadmanApi } from '../services/api';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const deskRef = useRef<HTMLDivElement>(null);
  
  const [showTrialWarning, setShowTrialWarning] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Mouse tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-300, 300], [2, -2]);
  const rotateY = useTransform(mouseX, [-500, 500], [-3, 3]);
  
  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 30 });

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

  const isTrialing = subscription?.status === 'TRIALING';
  const trialDaysLeft = subscription?.trialDaysRemaining || 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      {/* Floating dust particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold/20"
            style={{
              width: Math.random() > 0.7 ? 3 : 2,
              height: Math.random() > 0.7 ? 3 : 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -150, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 15,
              repeat: Infinity,
              delay: Math.random() * 15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Ambient warm light from top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none">
        <div className="w-full h-full bg-gradient-radial from-amber-500/10 via-transparent to-transparent blur-3xl" />
      </div>

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

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 px-6 md:px-12 py-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.02 }}
          >
            <motion.span 
              className="text-3xl text-gold"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              ∞
            </motion.span>
            <span className="text-xl tracking-[0.15em] text-paper/80">HEIRLOOM</span>
          </motion.div>

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
                className="w-10 h-10 rounded-full glass flex items-center justify-center text-paper/60 hover:text-gold transition-colors relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell size={20} />
                {isTrialing && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blood rounded-full" />
                )}
              </motion.button>
            </div>

            {/* Settings */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-paper/60 hover:text-gold transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={20} />
            </motion.button>

            {/* User avatar */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void font-medium relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <span className="relative">{user?.firstName?.[0] || 'U'}</span>
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
            className="relative z-10 px-6 md:px-12"
          >
            <div className="max-w-7xl mx-auto">
              <div className="glass border border-gold/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Clock size={20} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {trialDaysLeft} days left in your trial
                    </p>
                    <p className="text-sm text-paper/50">
                      Upgrade now to keep your memories forever
                    </p>
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
      <main className="relative z-10 px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-light mb-2">
              Welcome back, <em className="text-gold">{user?.firstName || 'Friend'}</em>
            </h1>
            <p className="text-paper/50">Your sanctuary awaits</p>
          </motion.div>

          {/* 3D Desk with Objects */}
          <motion.div
            ref={deskRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mb-12"
            style={{
              perspective: '1500px',
            }}
          >
            <motion.div
              style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Desk Surface */}
              <div 
                className="relative rounded-2xl p-8 md:p-12 min-h-[500px]"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(60,45,30,0.95) 0%, 
                      rgba(45,35,25,0.95) 25%,
                      rgba(35,28,20,0.95) 50%,
                      rgba(40,32,22,0.95) 75%,
                      rgba(50,40,28,0.95) 100%
                    )
                  `,
                  boxShadow: `
                    0 50px 100px -20px rgba(0,0,0,0.8),
                    0 30px 60px -30px rgba(0,0,0,0.6),
                    inset 0 1px 0 rgba(255,255,255,0.05),
                    inset 0 -2px 0 rgba(0,0,0,0.3)
                  `,
                }}
              >
                {/* Wood grain texture overlay */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        90deg,
                        transparent 0px,
                        rgba(0,0,0,0.03) 1px,
                        transparent 2px,
                        transparent 20px
                      ),
                      repeating-linear-gradient(
                        0deg,
                        transparent 0px,
                        rgba(139,90,43,0.05) 100px,
                        transparent 200px
                      )
                    `,
                  }}
                />

                {/* Desk edge highlight */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-600/20 to-transparent" />

                {/* Desk Objects Container */}
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                  
                  {/* Photo Stack - Memories */}
                  <motion.button
                    onClick={() => navigate('/memories')}
                    className="group relative"
                    whileHover={{ scale: 1.05, y: -10 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="relative w-full aspect-[4/5]">
                      {/* Stacked photos effect */}
                      {[2, 1, 0].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-lg"
                          style={{
                            transform: `rotate(${(i - 1) * 6}deg) translateZ(${i * 4}px)`,
                            background: 'linear-gradient(145deg, #f5f0e6 0%, #e8e0d0 100%)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                          }}
                          animate={i === 0 ? { rotate: [0, 2, 0] } : {}}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          {/* Photo content area */}
                          <div className="absolute inset-3 rounded bg-gradient-to-br from-amber-100 to-amber-200/50 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-blood/10" />
                            {/* Simulated image */}
                            <div className="absolute inset-4 bg-gradient-to-br from-amber-800/30 to-amber-900/20 rounded" />
                          </div>
                          {/* Frame edge */}
                          <div className="absolute inset-0 rounded-lg border border-amber-200/30" />
                        </motion.div>
                      ))}
                      
                      {/* Glass reflection */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" style={{ transform: 'translateZ(12px)' }} />
                    </div>
                    
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium group-hover:text-gold transition-colors">Memories</h3>
                      <p className="text-sm text-paper/50">{stats?.totalMemories || 0} captured</p>
                    </div>
                    
                    {/* Hover glow */}
                    <div className="absolute -inset-4 rounded-2xl bg-gold/0 group-hover:bg-gold/5 transition-colors blur-xl pointer-events-none" />
                  </motion.button>

                  {/* Letter with Pen - Compose */}
                  <motion.button
                    onClick={() => navigate('/compose')}
                    className="group relative"
                    whileHover={{ scale: 1.05, y: -10 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="relative w-full aspect-[4/5]">
                      {/* Paper */}
                      <motion.div
                        className="absolute inset-0 rounded-sm"
                        style={{
                          background: 'linear-gradient(180deg, #faf8f3 0%, #f5f0e6 50%, #ebe5d9 100%)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
                          transform: 'rotate(-2deg)',
                        }}
                      >
                        {/* Paper texture */}
                        <div className="absolute inset-0 opacity-50" style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        }} />
                        
                        {/* Writing lines */}
                        <div className="absolute inset-6 space-y-3">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-px bg-blue-200/30" />
                          ))}
                        </div>
                        
                        {/* Handwritten text simulation */}
                        <div className="absolute inset-6 pt-2">
                          <div className="h-1 w-16 bg-amber-900/20 rounded mb-3" />
                          <div className="h-0.5 w-24 bg-amber-900/15 rounded mb-2" />
                          <div className="h-0.5 w-20 bg-amber-900/15 rounded mb-2" />
                          <div className="h-0.5 w-28 bg-amber-900/10 rounded" />
                        </div>
                      </motion.div>
                      
                      {/* Fountain Pen */}
                      <motion.div
                        className="absolute -right-4 top-1/2"
                        style={{
                          width: '120px',
                          height: '16px',
                          background: 'linear-gradient(90deg, #1a1a2e 0%, #2d2d44 50%, #1a1a2e 100%)',
                          borderRadius: '2px 8px 8px 2px',
                          transform: 'rotate(35deg) translateY(-50%)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}
                        animate={{ rotate: [35, 37, 35] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {/* Pen nib */}
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
                          style={{
                            width: '20px',
                            height: '8px',
                            background: 'linear-gradient(90deg, #c9a959 0%, #a08335 100%)',
                            clipPath: 'polygon(100% 0%, 100% 100%, 0% 50%)',
                          }}
                        />
                        {/* Gold band */}
                        <div className="absolute right-8 top-0 bottom-0 w-4 bg-gradient-to-b from-gold via-gold-dim to-gold rounded-sm" />
                        {/* Clip */}
                        <div 
                          className="absolute right-2 -top-2 w-1 h-6 bg-gradient-to-b from-gold to-gold-dim rounded-full"
                          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                        />
                      </motion.div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium group-hover:text-gold transition-colors">Write Letter</h3>
                      <p className="text-sm text-paper/50">{stats?.totalLetters || 0} written</p>
                    </div>
                    
                    <div className="absolute -inset-4 rounded-2xl bg-gold/0 group-hover:bg-gold/5 transition-colors blur-xl pointer-events-none" />
                  </motion.button>

                  {/* Family Frame */}
                  <motion.button
                    onClick={() => navigate('/family')}
                    className="group relative"
                    whileHover={{ scale: 1.05, y: -10 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="relative w-full aspect-[4/5]">
                      {/* Ornate Frame */}
                      <div 
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: 'linear-gradient(135deg, #8b7355 0%, #6b5344 25%, #5a4636 50%, #6b5344 75%, #8b7355 100%)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.1), inset 0 -2px 0 rgba(0,0,0,0.3)',
                          padding: '12px',
                        }}
                      >
                        {/* Inner frame shadow */}
                        <div 
                          className="absolute inset-3 rounded"
                          style={{
                            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.4)',
                            background: 'linear-gradient(180deg, #1a1510 0%, #2a2520 100%)',
                          }}
                        >
                          {/* Family members preview */}
                          <div className="absolute inset-2 flex flex-wrap items-center justify-center gap-2 p-2">
                            {family?.slice(0, 4).map((member: any, i: number) => (
                              <motion.div
                                key={member.id}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/80 to-gold-dim flex items-center justify-center text-xs text-void font-medium"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                {member.name[0]}
                              </motion.div>
                            ))}
                            {(!family || family.length === 0) && (
                              <div className="text-paper/30 text-xs text-center">
                                Add family
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Frame decorations */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-gradient-to-b from-gold/30 to-transparent" />
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-gradient-to-t from-gold/30 to-transparent" />
                      </div>
                      
                      {/* Glass reflection */}
                      <div className="absolute inset-3 rounded bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                    </div>
                    
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-medium group-hover:text-gold transition-colors">Family</h3>
                      <p className="text-sm text-paper/50">{family?.length || 0} members</p>
                    </div>
                    
                    <div className="absolute -inset-4 rounded-2xl bg-gold/0 group-hover:bg-gold/5 transition-colors blur-xl pointer-events-none" />
                  </motion.button>
                </div>

                {/* Decorative Objects */}
                
                {/* Ink Bottle */}
                <motion.div
                  className="absolute bottom-8 left-8 w-12 h-16"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div 
                    className="w-full h-full rounded-b-lg rounded-t-sm"
                    style={{
                      background: 'linear-gradient(180deg, rgba(20,20,30,0.9) 0%, rgba(10,10,20,0.95) 100%)',
                      boxShadow: 'inset 0 -8px 16px rgba(201,169,89,0.2), 0 4px 8px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Ink level */}
                    <div className="absolute bottom-0 left-1 right-1 h-1/2 rounded-b-md bg-gradient-to-t from-gold/30 to-transparent" />
                    {/* Glass shine */}
                    <div className="absolute inset-0 rounded-b-lg bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  {/* Cap */}
                  <div 
                    className="absolute -top-3 left-1 right-1 h-4 rounded-t-full"
                    style={{
                      background: 'linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 100%)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </motion.div>

                {/* Candle */}
                <motion.div
                  className="absolute top-4 right-8 w-6"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Flame glow */}
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,180,50,0.3) 0%, transparent 70%)',
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  {/* Flame */}
                  <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2"
                    animate={{
                      scaleY: [1, 1.2, 0.9, 1.1, 1],
                      scaleX: [1, 0.9, 1.1, 0.95, 1],
                    }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                  >
                    <div 
                      className="w-3 h-6"
                      style={{
                        background: 'linear-gradient(0deg, #ff6b00 0%, #ffcc00 50%, #fff 100%)',
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                        filter: 'blur(1px)',
                      }}
                    />
                  </motion.div>
                  {/* Candle body */}
                  <div 
                    className="w-6 h-20 rounded-sm"
                    style={{
                      background: 'linear-gradient(180deg, #f5f0e0 0%, #e8e0d0 50%, #ddd5c5 100%)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset -2px 0 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {/* Dripping wax */}
                    <div className="absolute top-0 -left-1 w-2 h-8 bg-gradient-to-b from-white to-transparent rounded-full opacity-50" />
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Storage */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-paper/70">Storage Used</h3>
                <span className="badge badge-gold">{subscription?.tier || 'Trial'}</span>
              </div>
              <div className="progress-bar mb-2">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${limits?.storageUsedPercent || 0}%` }} 
                />
              </div>
              <div className="flex justify-between text-sm text-paper/50">
                <span>{limits?.storageUsedMB || 0} MB used</span>
                <span>{limits?.storageLimitMB || 100} MB limit</span>
              </div>
            </div>

            {/* Dead Man's Switch */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-paper/70">Protection Status</h3>
                <Shield size={20} className={deadmanStatus?.enabled ? 'text-green-400' : 'text-paper/30'} />
              </div>
              {deadmanStatus?.enabled ? (
                <>
                  <p className="text-green-400 mb-2">Active</p>
                  <p className="text-sm text-paper/50">
                    Next check-in: {deadmanStatus.nextCheckIn ? new Date(deadmanStatus.nextCheckIn).toLocaleDateString() : 'N/A'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-paper/50 mb-2">Not configured</p>
                  <button
                    onClick={() => navigate('/settings?tab=deadman')}
                    className="text-sm text-gold hover:text-gold-bright transition-colors flex items-center gap-1"
                  >
                    Set up protection <ChevronRight size={14} />
                  </button>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-paper/70 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/compose')}
                  className="w-full text-left px-4 py-3 rounded-lg glass hover:bg-white/5 transition-all flex items-center justify-between group"
                >
                  <span>Write a letter</span>
                  <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
                </button>
                <button
                  onClick={() => navigate('/record')}
                  className="w-full text-left px-4 py-3 rounded-lg glass hover:bg-white/5 transition-all flex items-center justify-between group"
                >
                  <span>Record your voice</span>
                  <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
