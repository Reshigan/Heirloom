import { useEffect, useState, useRef } from 'react';
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
          {/* Desk surface */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #2a2218, #1a1610)',
              transform: 'rotateX(55deg)',
              transformOrigin: 'center center',
              boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
            }}
          />
          
          {/* Objects on desk */}
          <div
            className="absolute inset-0"
            style={{ transform: 'rotateX(55deg)', transformOrigin: 'center center' }}
          >
            {/* Photo stack */}
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
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-24 h-28 bg-paper shadow-lg"
                    style={{
                      transform: `rotate(${-5 + i * 5}deg)`,
                      zIndex: i,
                    }}
                  >
                    <div className="absolute inset-2 bg-gradient-to-br from-gold/20 to-blood/10" />
                  </div>
                ))}
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-paper/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  Memories
                </div>
              </motion.div>
            </Link>
            
            {/* Letter */}
            <Link
              to="/compose"
              className="absolute group cursor-hover"
              style={{ top: '20%', right: '15%' }}
            >
              <motion.div
                className="relative w-32 h-40 bg-paper shadow-lg p-3"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, #e8e2d6 23px, #e8e2d6 24px)',
                }}
                whileHover={{ scale: 1.05, y: -10, rotate: 2 }}
              >
                <div className="font-handwritten text-ink/60 text-sm">
                  My dearest...
                </div>
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-paper/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  Write Letter
                </div>
              </motion.div>
            </Link>
            
            {/* Voice recorder */}
            <Link
              to="/record"
              className="absolute group cursor-hover"
              style={{ bottom: '25%', left: '25%' }}
            >
              <motion.div
                className="relative w-28 h-20 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-lg shadow-lg p-2"
                whileHover={{ scale: 1.05, y: -10 }}
              >
                {/* Reels */}
                <div className="flex justify-between px-2">
                  <motion.div
                    className="w-6 h-6 rounded-full border-2 border-gold/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="w-6 h-6 rounded-full border-2 border-gold/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <div className="flex justify-center mt-2">
                  <div className="w-4 h-4 rounded-full bg-blood animate-pulse" />
                </div>
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-paper/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  Record Voice
                </div>
              </motion.div>
            </Link>
            
            {/* Family frame */}
            <Link
              to="/family"
              className="absolute group cursor-hover"
              style={{ bottom: '20%', right: '20%' }}
            >
              <motion.div
                className="relative w-24 h-24 bg-[#3a2a1a] rounded p-1 shadow-lg"
                whileHover={{ scale: 1.05, y: -10 }}
              >
                <div className="w-full h-full bg-void/50 rounded flex flex-wrap gap-1 p-1 justify-center items-center">
                  {(family?.slice(0, 4) || []).map((member: any, i: number) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-xs text-gold"
                    >
                      {member.name[0]}
                    </div>
                  ))}
                </div>
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
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <Link
          to="/compose"
          className="flex items-center gap-2 px-6 py-3 bg-white/[0.02] border border-white/[0.06] text-paper/60 hover:border-gold/30 hover:text-gold transition-smooth"
        >
          <Pen size={18} strokeWidth={1.5} />
          <span>Write Letter</span>
        </Link>
        <Link
          to="/record"
          className="flex items-center gap-2 px-6 py-3 bg-white/[0.02] border border-white/[0.06] text-paper/60 hover:border-gold/30 hover:text-gold transition-smooth"
        >
          <Mic size={18} strokeWidth={1.5} />
          <span>Record Voice</span>
        </Link>
        <Link
          to="/memories"
          className="flex items-center gap-2 px-6 py-3 bg-white/[0.02] border border-white/[0.06] text-paper/60 hover:border-gold/30 hover:text-gold transition-smooth"
        >
          <Image size={18} strokeWidth={1.5} />
          <span>Add Memory</span>
        </Link>
      </div>
    </div>
  );
}
