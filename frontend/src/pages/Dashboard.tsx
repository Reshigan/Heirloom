import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Pen, Mic, Image } from 'lucide-react';
import { memoriesApi, familyApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export function Dashboard() {
  const { user } = useAuthStore();
  const deskRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  
  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['memories-stats'],
    queryFn: () => memoriesApi.getStats().then(r => r.data),
  });
  
  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });
  
  // Mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!deskRef.current) return;
      const rect = deskRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);
  
  const rotateX = useTransform(mouseY, [0, 1], [5, -5]);
  const rotateY = useTransform(mouseX, [0, 1], [-10, 10]);
  
  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating dust particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-gold/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 15,
            }}
          />
        ))}
      </div>
      
      {/* Stats whisper - left side */}
      <div className="fixed left-12 top-1/2 -translate-y-1/2 space-y-6 hidden lg:block">
        <div className="text-right">
          <div className="text-3xl text-gold">{stats?.totalMemories || 0}</div>
          <div className="text-xs text-paper/30 tracking-widest">MEMORIES</div>
        </div>
        <div className="text-right">
          <div className="text-3xl text-gold">{stats?.byType?.VOICE || 0}</div>
          <div className="text-xs text-paper/30 tracking-widest">RECORDINGS</div>
        </div>
        <div className="text-right">
          <div className="text-3xl text-gold">{stats?.byType?.LETTER || 0}</div>
          <div className="text-xs text-paper/30 tracking-widest">LETTERS</div>
        </div>
      </div>
      
      {/* Greeting - right side */}
      <div className="fixed right-12 top-1/2 -translate-y-1/2 text-right hidden lg:block">
        <div className="text-sm text-paper/30 tracking-widest mb-2">{greeting}</div>
        <div className="text-2xl text-paper">{user?.firstName}</div>
      </div>
      
      {/* 3D Desk */}
      <div
        ref={deskRef}
        className="min-h-screen flex items-center justify-center px-6"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{
            width: 'min(900px, 90vw)',
            height: 'min(600px, 60vh)',
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Desk surface - realistic wood texture */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{
              transform: 'rotateX(55deg)',
              transformOrigin: 'center center',
              boxShadow: '0 50px 100px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.05)',
            }}
          >
            {/* Wood base with grain texture */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(90deg, 
                    rgba(62, 45, 30, 0.3) 0%, 
                    rgba(82, 60, 40, 0.2) 20%, 
                    rgba(62, 45, 30, 0.3) 40%,
                    rgba(72, 52, 35, 0.2) 60%,
                    rgba(62, 45, 30, 0.3) 80%,
                    rgba(82, 60, 40, 0.2) 100%
                  ),
                  linear-gradient(180deg, #3e2d1e 0%, #2a1f14 50%, #1a1610 100%)
                `,
              }}
            />
            {/* Wood grain lines */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    95deg,
                    transparent,
                    transparent 30px,
                    rgba(139, 90, 43, 0.15) 30px,
                    rgba(139, 90, 43, 0.15) 31px,
                    transparent 31px,
                    transparent 60px
                  ),
                  repeating-linear-gradient(
                    92deg,
                    transparent,
                    transparent 80px,
                    rgba(101, 67, 33, 0.1) 80px,
                    rgba(101, 67, 33, 0.1) 82px,
                    transparent 82px,
                    transparent 150px
                  )
                `,
              }}
            />
            {/* Desk edge highlight */}
            <div
              className="absolute top-0 left-0 right-0 h-3"
              style={{
                background: 'linear-gradient(180deg, rgba(139, 90, 43, 0.4) 0%, transparent 100%)',
                borderRadius: '8px 8px 0 0',
              }}
            />
            {/* Subtle varnish reflection */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
              }}
            />
          </div>
          
          {/* Objects on desk */}
          <div
            className="absolute inset-0"
            style={{ transform: 'rotateX(55deg)', transformOrigin: 'center center' }}
          >
            {/* Photo stack - realistic polaroid-style photos */}
            <Link
              to="/memories"
              className="absolute group cursor-hover"
              style={{ top: '15%', left: '10%' }}
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05, y: -10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {[
                  { rotate: -8, image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=200&q=60' },
                  { rotate: -2, image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&q=60' },
                  { rotate: 5, image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&q=60' },
                ].map((photo, i) => (
                  <div
                    key={i}
                    className="absolute w-24 h-28 bg-[#f5f5f0] shadow-lg"
                    style={{
                      transform: `rotate(${photo.rotate}deg)`,
                      zIndex: i,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {/* Photo border (polaroid style) */}
                    <div className="absolute inset-0 p-1.5 pb-4">
                      <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ 
                          backgroundImage: `url(${photo.image})`,
                          filter: 'saturate(0.9) contrast(1.05)',
                        }}
                      />
                    </div>
                    {/* Slight aging effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100/10 to-transparent pointer-events-none" />
                  </div>
                ))}
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-paper/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  Memories
                </div>
              </motion.div>
            </Link>
            
            {/* Letter - realistic aged paper with handwriting */}
            <Link
              to="/compose"
              className="absolute group cursor-hover"
              style={{ top: '20%', right: '15%' }}
            >
              <motion.div
                className="relative w-32 h-40 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #f5f0e6 0%, #ebe5d8 50%, #e8e2d6 100%)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25), 2px 2px 4px rgba(0,0,0,0.1)',
                }}
                whileHover={{ scale: 1.05, y: -10, rotate: 2 }}
              >
                {/* Paper texture overlay */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />
                {/* Lined paper effect */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 18px, #c9b99a 18px, #c9b99a 19px)',
                    backgroundPosition: '0 24px',
                  }}
                />
                {/* Red margin line */}
                <div className="absolute top-0 bottom-0 left-6 w-px bg-[#e8a0a0]/40" />
                {/* Handwritten text */}
                <div className="relative p-3 pt-7 pl-8">
                  <div className="font-handwritten text-[#2a2520] text-xs leading-[19px] opacity-70">
                    My dearest Emma<br/>
                    and Michael,<br/>
                    <span className="opacity-50">If you're reading</span><br/>
                    <span className="opacity-40">this, it means...</span>
                  </div>
                </div>
                {/* Slight fold/crease effect */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/5 to-transparent" />
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-paper/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  Write Letter
                </div>
              </motion.div>
            </Link>
            
            {/* Voice recorder - vintage cassette recorder style */}
            <Link
              to="/record"
              className="absolute group cursor-hover"
              style={{ bottom: '25%', left: '25%' }}
            >
              <motion.div
                className="relative w-32 h-24 rounded-lg shadow-lg overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #3a3632 0%, #2a2826 40%, #1a1816 100%)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
                }}
                whileHover={{ scale: 1.05, y: -10 }}
              >
                {/* Metal plate texture */}
                <div className="absolute inset-1 rounded border border-white/5" />
                {/* Cassette window */}
                <div 
                  className="absolute top-2 left-3 right-3 h-10 rounded-sm"
                  style={{
                    background: 'linear-gradient(180deg, #1a1816 0%, #0a0806 100%)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Tape reels */}
                  <div className="flex justify-between items-center h-full px-2">
                    <motion.div
                      className="w-7 h-7 rounded-full"
                      style={{
                        background: 'conic-gradient(from 0deg, #2a2520, #4a4540, #2a2520, #4a4540, #2a2520)',
                        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <div className="absolute inset-2 rounded-full bg-[#1a1816] border border-gold/20" />
                    </motion.div>
                    {/* Tape between reels */}
                    <div className="flex-1 h-1 mx-1 bg-gradient-to-r from-amber-900/60 via-amber-800/40 to-amber-900/60" />
                    <motion.div
                      className="w-7 h-7 rounded-full"
                      style={{
                        background: 'conic-gradient(from 45deg, #2a2520, #4a4540, #2a2520, #4a4540, #2a2520)',
                        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <div className="absolute inset-2 rounded-full bg-[#1a1816] border border-gold/20" />
                    </motion.div>
                  </div>
                </div>
                {/* Control buttons */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#2a2826] border border-white/10" />
                  <div className="w-3 h-3 rounded-full bg-blood animate-pulse shadow-[0_0_8px_rgba(180,30,30,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-[#2a2826] border border-white/10" />
                </div>
                {/* Brand label */}
                <div className="absolute top-1 right-2 text-[6px] text-gold/30 font-mono tracking-wider">HEIRLOOM</div>
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-paper/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  Record Voice
                </div>
              </motion.div>
            </Link>
            
            {/* Family frame - ornate wooden picture frame */}
            <Link
              to="/family"
              className="absolute group cursor-hover"
              style={{ bottom: '20%', right: '20%' }}
            >
              <motion.div
                className="relative w-28 h-28"
                whileHover={{ scale: 1.05, y: -10 }}
              >
                {/* Outer frame with wood grain */}
                <div 
                  className="absolute inset-0 rounded"
                  style={{
                    background: 'linear-gradient(135deg, #5a4530 0%, #3a2a1a 50%, #2a1a10 100%)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
                  }}
                />
                {/* Inner gold trim */}
                <div 
                  className="absolute inset-1.5 rounded-sm"
                  style={{
                    background: 'linear-gradient(135deg, #c9a959 0%, #8b7355 50%, #c9a959 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                  }}
                />
                {/* Photo area with family silhouettes */}
                <div 
                  className="absolute inset-3 rounded-sm overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, #2a2520 0%, #1a1510 100%)',
                  }}
                >
                  {/* Sepia-toned family photo placeholder */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{
                      backgroundImage: 'url(https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&q=60)',
                      filter: 'sepia(0.4) contrast(1.1)',
                    }}
                  />
                  {/* Family member initials overlay */}
                  <div className="absolute inset-0 flex flex-wrap gap-0.5 p-1 justify-center items-center bg-black/30">
                    {(family?.slice(0, 4) || []).map((member: any, i: number) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm border border-gold/40 flex items-center justify-center text-[10px] text-gold font-medium"
                      >
                        {member.name[0]}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Frame corner accents */}
                <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-gold/30" />
                <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-gold/30" />
                <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-gold/30" />
                <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b border-r border-gold/30" />
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-paper/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  Family
                </div>
              </motion.div>
            </Link>
            
            {/* Inkwell */}
            <div
              className="absolute w-10 h-12 rounded-b-full"
              style={{
                bottom: '30%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)',
                boxShadow: 'inset 0 -10px 20px rgba(201, 169, 89, 0.3)',
              }}
            >
              <motion.div
                className="absolute inset-1 rounded-b-full"
                style={{ background: 'radial-gradient(ellipse at top, var(--gold), transparent)' }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Quick actions bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 glass-panel rounded-lg p-2">
        <Link
          to="/compose"
          className="flex items-center gap-2 px-5 py-2.5 glass-button rounded text-paper/60 hover:text-gold transition-smooth"
        >
          <Pen size={18} strokeWidth={1.5} />
          <span>Write Letter</span>
        </Link>
        <Link
          to="/record"
          className="flex items-center gap-2 px-5 py-2.5 glass-button rounded text-paper/60 hover:text-gold transition-smooth"
        >
          <Mic size={18} strokeWidth={1.5} />
          <span>Record Voice</span>
        </Link>
        <Link
          to="/memories"
          className="flex items-center gap-2 px-5 py-2.5 glass-button rounded text-paper/60 hover:text-gold transition-smooth"
        >
          <Image size={18} strokeWidth={1.5} />
          <span>Add Memory</span>
        </Link>
      </div>
    </div>
  );
}
