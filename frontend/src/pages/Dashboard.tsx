import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Pen, Mic, Image, Users, Settings, ChevronRight, Clock, Shield, Bell } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { billingApi, memoriesApi, familyApi, deadmanApi } from '../services/api';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showNotification, setShowNotification] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [0, 800], [8, -8]);
  const rotateY = useTransform(mouseX, [0, 1400], [-8, 8]);
  
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
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Show trial notification
  useEffect(() => {
    if (subscription?.isTrialing && subscription.trialDaysLeft <= 7) {
      setShowNotification(true);
    }
  }, [subscription]);
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  const quickActions = [
    { id: 'memory', icon: Image, label: 'Add Memory', color: 'gold', path: '/memories' },
    { id: 'letter', icon: Pen, label: 'Write Letter', color: 'gold', path: '/compose' },
    { id: 'record', icon: Mic, label: 'Record Voice', color: 'blood', path: '/record' },
    { id: 'family', icon: Users, label: 'Add Family', color: 'teal', path: '/family' },
  ];
  
  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
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
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>
      
      {/* Header */}
      <header className="relative z-20 px-6 md:px-12 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <motion.div
                className="text-3xl font-light tracking-wider text-gold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ∞
              </motion.div>
              <motion.div
                className="absolute inset-0 blur-xl bg-gold/30"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <span className="text-xl tracking-[0.2em] text-paper/80">HEIRLOOM</span>
          </motion.div>
          
          <div className="flex items-center gap-4">
            {/* Dead man's switch status */}
            {deadmanStatus?.enabled && (
              <motion.button
                onClick={() => navigate('/settings?tab=deadman')}
                className="flex items-center gap-2 px-4 py-2 glass-subtle rounded-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Shield size={16} className={deadmanStatus.status === 'ACTIVE' ? 'text-green-400' : 'text-yellow-400'} />
                <span className="text-sm text-paper/60">
                  {deadmanStatus.status === 'ACTIVE' ? 'Protected' : 'Check-in needed'}
                </span>
              </motion.button>
            )}
            
            {/* Notifications */}
            <motion.button
              onClick={() => setShowNotification(!showNotification)}
              className="relative w-10 h-10 glass-subtle rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={18} className="text-paper/60" />
              {subscription?.isTrialing && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blood rounded-full animate-pulse" />
              )}
            </motion.button>
            
            {/* Settings */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 glass-subtle rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings size={18} className="text-paper/60" />
            </motion.button>
            
            {/* Avatar */}
            <motion.button
              onClick={() => navigate('/settings')}
              className="avatar avatar-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </motion.button>
          </div>
        </div>
      </header>
      
      {/* Trial Warning Toast */}
      <AnimatePresence>
        {showNotification && subscription?.isTrialing && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="toast toast-warning"
          >
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-yellow-400" />
              <div>
                <div className="font-medium">Trial expires in {subscription.trialDaysLeft} days</div>
                <div className="text-sm text-paper/60">Upgrade to keep your memories safe</div>
              </div>
              <button
                onClick={() => navigate('/settings?tab=subscription')}
                className="btn btn-primary btn-sm ml-4"
              >
                Upgrade
              </button>
              <button onClick={() => setShowNotification(false)} className="text-paper/40 hover:text-paper ml-2">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="relative z-10 px-6 md:px-12 py-8 max-w-7xl mx-auto">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-light mb-2">
            {greeting()}, <em>{user?.firstName}</em>
          </h1>
          <p className="text-paper/50 text-lg">Your sanctuary awaits. What would you like to preserve today?</p>
        </motion.div>
        
        {/* 3D Desk with Objects */}
        <motion.div
          className="mb-12"
          style={{
            perspective: 1200,
          }}
        >
          <motion.div
            className="desk-surface wood-grain p-8 md:p-12"
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
              {/* Photo Stack */}
              <motion.button
                onClick={() => navigate('/memories')}
                className="relative group"
                whileHover={{ scale: 1.05, z: 20 }}
                whileTap={{ scale: 0.98 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="photo-frame aspect-[4/3] relative overflow-hidden">
                  <div className="absolute inset-2 bg-gradient-to-br from-gold/20 to-blood/10 rounded" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image size={32} className="text-gold/60 group-hover:text-gold transition-colors" />
                  </div>
                  <div className="photo-frame-glass" />
                </div>
                <div className="absolute -bottom-2 -right-2 photo-frame w-full aspect-[4/3] -z-10 opacity-60" style={{ transform: 'rotate(5deg)' }} />
                <div className="absolute -bottom-4 -right-4 photo-frame w-full aspect-[4/3] -z-20 opacity-30" style={{ transform: 'rotate(10deg)' }} />
                <div className="mt-3 text-center">
                  <div className="text-paper font-medium">{stats?.totalMemories || 0} Memories</div>
                  <div className="text-paper/40 text-sm">Click to view</div>
                </div>
              </motion.button>
              
              {/* Letter & Pen */}
              <motion.button
                onClick={() => navigate('/compose')}
                className="relative group candle-glow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="paper-texture rounded-sm p-6 relative" style={{ transform: 'rotate(-2deg)' }}>
                  <div className="space-y-2">
                    <div className="h-1 bg-ink/20 rounded w-3/4" />
                    <div className="h-1 bg-ink/20 rounded w-full" />
                    <div className="h-1 bg-ink/20 rounded w-5/6" />
                    <div className="h-1 bg-ink/20 rounded w-2/3" />
                  </div>
                  <Pen size={24} className="absolute -top-3 -right-3 text-gold transform rotate-45" />
                </div>
                <div className="mt-3 text-center">
                  <div className="text-paper font-medium">{stats?.totalLetters || 0} Letters</div>
                  <div className="text-paper/40 text-sm">Write new</div>
                </div>
              </motion.button>
              
              {/* Voice Recorder */}
              <motion.button
                onClick={() => navigate('/record')}
                className="relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="recorder-device">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="recorder-reel" />
                    <div className="recorder-reel" style={{ animationDirection: 'reverse' }} />
                  </div>
                  <div className="flex justify-center gap-1">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-blood rounded-full"
                        animate={{ height: [8, 20, 8] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <div className="text-paper font-medium">{stats?.totalVoiceMinutes || 0} min</div>
                  <div className="text-paper/40 text-sm">Record voice</div>
                </div>
              </motion.button>
              
              {/* Family Frame */}
              <motion.button
                onClick={() => navigate('/family')}
                className="relative group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="photo-frame aspect-square">
                  <div className="absolute inset-3 rounded bg-void-light flex items-center justify-center">
                    <div className="flex -space-x-3">
                      {(family || []).slice(0, 4).map((member: any, i: number) => (
                        <div
                          key={member.id}
                          className="avatar avatar-sm border-2 border-void"
                          style={{ zIndex: 4 - i }}
                        >
                          {member.name[0]}
                        </div>
                      ))}
                      {(!family || family.length === 0) && (
                        <Users size={32} className="text-paper/30" />
                      )}
                    </div>
                  </div>
                  <div className="photo-frame-glass" />
                </div>
                <div className="mt-3 text-center">
                  <div className="text-paper font-medium">{family?.length || 0} Family</div>
                  <div className="text-paper/40 text-sm">Manage</div>
                </div>
              </motion.button>
            </div>
            
            {/* Decorative items */}
            <div className="absolute bottom-4 right-4 ink-bottle w-12 h-16" />
            <div className="absolute top-4 right-8 wax-seal" />
          </motion.div>
        </motion.div>
        
        {/* Quick Actions & Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2"
          >
            <h3 className="text-lg text-paper/60 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="card group text-center py-8 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: action.color === 'gold' 
                        ? 'radial-gradient(circle at center, rgba(201,169,89,0.15) 0%, transparent 70%)'
                        : action.color === 'blood'
                        ? 'radial-gradient(circle at center, rgba(139,41,66,0.15) 0%, transparent 70%)'
                        : 'radial-gradient(circle at center, rgba(26,58,58,0.15) 0%, transparent 70%)'
                    }}
                  />
                  <div className="relative">
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-xl glass flex items-center justify-center group-hover:bg-${action.color}/20 transition-colors`}>
                      <action.icon size={24} className={`text-paper/60 group-hover:text-${action.color === 'gold' ? 'gold' : action.color === 'blood' ? 'blood' : 'teal-400'} transition-colors`} />
                    </div>
                    <div className="text-paper font-medium">{action.label}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
          
          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-paper/60">Your Legacy</h3>
              <span className={`badge ${subscription?.tier === 'FREE' ? 'badge-warning' : 'badge-gold'}`}>
                {subscription?.tier || 'FREE'}
              </span>
            </div>
            
            <div className="space-y-4">
              {limits && [
                { label: 'Memories', data: limits.memories, icon: Image },
                { label: 'Voice', data: limits.voice, icon: Mic, suffix: ' min' },
                { label: 'Letters', data: limits.letters, icon: Pen },
              ].map(({ label, data, icon: Icon, suffix }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2 text-paper/60">
                      <Icon size={14} />
                      {label}
                    </div>
                    <span className="text-paper">
                      {data.current}{suffix || ''} / {data.max === -1 ? '∞' : data.max + (suffix || '')}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${data.max === -1 ? 0 : Math.min(100, (data.current / data.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="divider" />
            
            <button
              onClick={() => navigate('/settings?tab=subscription')}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              {subscription?.tier === 'FREE' ? 'Upgrade Plan' : 'Manage Subscription'}
              <ChevronRight size={16} />
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
