'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import AtmosphericBackground from './ui/atmospheric-background';
import { 
  Home, Camera, Users, Clock, Heart, MessageCircle, 
  Upload, Search, Settings, Plus, X, Play, Pause,
  Sparkles, Star, Zap, Sun, Moon, Music, Video,
  FileText, Mic, Image, Share2, Download, Edit3, User,
  Baby, GraduationCap, Circle, Lightbulb, Eye, Brain,
  Smile, Bird, BookOpen, Headphones, TreePine, Crown,
  Gem, Compass, Map, Calendar, Archive, Gift
} from 'lucide-react';
import FamilyTree from './family-tree';
import AnimatedMemoryGallery from './animated-memory-gallery';
import InteractiveTimeline from './interactive-timeline';
import AnimatedFamilyTree from './animated-family-tree';
import AnimatedUploadInterface from './animated-upload-interface';

interface RevolutionaryInterfaceProps {
  onNavigate?: (section: string) => void;
  onClose?: () => void;
}

interface MemoryNode {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'text' | 'voice';
  icon: React.ReactNode;
  position: { x: number; y: number };
  color: string;
  title: string;
}

export default function RevolutionaryInterface({ onNavigate, onClose }: RevolutionaryInterfaceProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(30);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showFamilyTree, setShowFamilyTree] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showMemoryGallery, setShowMemoryGallery] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showAnimatedFamilyTree, setShowAnimatedFamilyTree] = useState(false);
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  
  const sphereRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const rotateY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const navigationOrbs = [
    { id: 'upload', icon: <Upload className="w-6 h-6" />, label: 'Upload Memories', color: '#F59E0B' },
    { id: 'timeline', icon: <Clock className="w-6 h-6" />, label: 'Timeline View', color: '#2563EB' },
    { id: 'family-tree', icon: <TreePine className="w-6 h-6" />, label: 'Family Tree', color: '#10B981' },
    { id: 'memory-details', icon: <Archive className="w-6 h-6" />, label: 'Memory Gallery', color: '#F97316' },
    { id: 'social', icon: <MessageCircle className="w-6 h-6" />, label: 'Share & Connect', color: '#EC4899' },
    { id: 'profile', icon: <User className="w-6 h-6" />, label: 'Your Profile', color: '#7C3AED' }
  ];

  const memoryNodes: MemoryNode[] = [
    {
      id: '1',
      type: 'photo',
      icon: <Camera className="w-6 h-6" />,
      position: { x: 50, y: 20 },
      color: '#F59E0B',
      title: 'Photos'
    },
    {
      id: '2',
      type: 'video',
      icon: <Video className="w-6 h-6" />,
      position: { x: 80, y: 40 },
      color: '#2563EB',
      title: 'Videos'
    },
    {
      id: '3',
      type: 'audio',
      icon: <Music className="w-6 h-6" />,
      position: { x: 80, y: 70 },
      color: '#10B981',
      title: 'Audio'
    },
    {
      id: '4',
      type: 'text',
      icon: <FileText className="w-6 h-6" />,
      position: { x: 50, y: 85 },
      color: '#E8B4A0',
      title: 'Stories'
    },
    {
      id: '5',
      type: 'voice',
      icon: <Mic className="w-6 h-6" />,
      position: { x: 20, y: 70 },
      color: '#8B2635',
      title: 'Voice'
    },
    {
      id: '6',
      type: 'photo',
      icon: <Heart className="w-6 h-6" />,
      position: { x: 20, y: 40 },
      color: '#D4AF37',
      title: 'Moments'
    }
  ];

  const emotionCrystals = [
    { id: 'joy', icon: <Smile className="w-5 h-5" />, label: 'Joy', color: '#D4AF37' },
    { id: 'love', icon: <Heart className="w-5 h-5" />, label: 'Love', color: '#8B2635' },
    { id: 'hope', icon: <Star className="w-5 h-5" />, label: 'Hope', color: '#9CAF88' },
    { id: 'wisdom', icon: <Brain className="w-5 h-5" />, label: 'Wisdom', color: '#E8B4A0' },
    { id: 'peace', icon: <Bird className="w-5 h-5" />, label: 'Peace', color: '#9CAF88' }
  ];

  const timelineNodes = [
    { year: '1970', icon: <Baby className="w-5 h-5" />, label: 'Birth' },
    { year: '1990', icon: <GraduationCap className="w-5 h-5" />, label: 'School' },
    { year: '2010', icon: <Heart className="w-5 h-5" />, label: 'Love' },
    { year: '2024', icon: <Sparkles className="w-5 h-5" />, label: 'Now' },
    { year: 'Future', icon: <Eye className="w-5 h-5" />, label: 'Dreams' }
  ];

  useEffect(() => {
    // Loading animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Mouse tracking for 3D effect
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      mouseX.set(x);
      mouseY.set(-y);
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  const handleNodeClick = (nodeId: string) => {
    setActivePanel('memory-detail');
  };

  const handleOrbClick = (orbId: string) => {
    switch (orbId) {
      case 'upload':
        setShowUploadInterface(true);
        break;
      case 'timeline':
        setShowTimeline(true);
        break;
      case 'family-tree':
        setShowAnimatedFamilyTree(true);
        break;
      case 'memory-details':
        setShowMemoryGallery(true);
        break;
      case 'social':
        // Handle social features
        break;
      case 'profile':
        // Handle profile
        break;
      default:
        if (onNavigate) {
          onNavigate(orbId);
        }
        break;
    }
  };

  const handleTimelineNodeClick = (index: number) => {
    setTimelineProgress((index + 1) * 20);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center">
          <motion.div
            className="w-32 h-32 relative mb-8"
            animate={{ rotateY: 360, rotateX: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-16 h-1 bg-gradient-to-r from-gold to-gold/50 left-1/2 transform -translate-x-1/2 rounded-full"
                style={{ top: `${20 + i * 20}%` }}
                animate={{ scaleX: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </motion.div>
          <motion.p
            className="text-gold text-sm uppercase tracking-[3px] opacity-80"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Connecting Generations
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-modern-white overflow-hidden">
      <AtmosphericBackground />
      {/* Modern Heirloom Brand */}
      <motion.div 
        className="absolute top-6 left-6 z-[100] flex items-center space-x-4"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <motion.div 
          className="relative"
          animate={{ 
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* Modern Clean Logo */}
          <div className="w-14 h-14 relative">
            {/* Outer ring - Modern Blue */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-modern-blue via-modern-purple to-modern-coral p-0.5">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden shadow-lg">
                {/* Inner pattern */}
                <div className="absolute inset-2 rounded-full border-2 border-modern-blue/15"></div>
                <div className="absolute inset-3 rounded-full border border-modern-purple/20"></div>
                {/* Central icon - Family tree symbol */}
                <TreePine className="w-7 h-7 text-modern-blue relative z-10" />
                {/* Modern accent elements */}
                <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-modern-coral"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-modern-emerald"></div>
              </div>
            </div>
            {/* Modern glow effect */}
            <motion.div 
              className="absolute -inset-1 rounded-full bg-modern-blue/10"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
        <div className="flex flex-col">
          <motion.h1 
            className="text-2xl font-bold bg-gradient-to-r from-modern-blue via-modern-purple to-modern-coral bg-clip-text text-transparent font-serif tracking-wider"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ backgroundSize: "200% 100%" }}
          >
            HEIRLOOM
          </motion.h1>
          <motion.p 
            className="text-xs text-modern-gray-700/70 tracking-widest font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            MEMORIES • MOMENTS • LEGACY
          </motion.p>
        </div>
      </motion.div>

      {/* Particle System */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-gold rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 20
            }}
          />
        ))}
      </div>

      {/* Floating Navigation Orbs */}
      <motion.nav 
        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100]"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8">
          {navigationOrbs.map((orb, index) => (
            <motion.div
              key={orb.id}
              className="relative group cursor-pointer z-30"
              whileHover={{ 
                scale: 1.25, 
                y: -8,
                transition: { duration: 0.3, type: "spring", stiffness: 300 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOrbClick(orb.id)}
              initial={{ scale: 0, opacity: 0, y: -50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              {/* Outer Glow Ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${orb.color}40 0%, transparent 70%)`,
                  filter: 'blur(20px)'
                }}
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ 
                  scale: 2.5, 
                  opacity: 0.8,
                  transition: { duration: 0.4 }
                }}
              />
              
              {/* Ripple Effects */}
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: orb.color }}
                initial={{ scale: 1, opacity: 0 }}
                whileHover={{
                  scale: [1, 1.8, 2.5],
                  opacity: [0.8, 0.4, 0],
                  transition: { duration: 1, repeat: Infinity }
                }}
              />
              
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: orb.color }}
                initial={{ scale: 1, opacity: 0 }}
                whileHover={{
                  scale: [1, 1.5, 2],
                  opacity: [0.6, 0.3, 0],
                  transition: { duration: 0.8, repeat: Infinity, delay: 0.2 }
                }}
              />

              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 xl:w-22 xl:h-22 bg-glass-bg backdrop-blur-xl border border-gold/30 rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl">
                {/* Inner Glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${orb.color}60 0%, transparent 70%)`
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ 
                    scale: 1.2, 
                    opacity: 1,
                    transition: { duration: 0.3 }
                  }}
                />
                
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(45deg, transparent 30%, ${orb.color}40 50%, transparent 70%)`
                  }}
                  initial={{ x: '-100%' }}
                  whileHover={{
                    x: '100%',
                    transition: { duration: 0.6, ease: "easeInOut" }
                  }}
                />
                
                <motion.div 
                  className="text-gold relative z-10"
                  whileHover={{
                    color: orb.color,
                    scale: 1.2,
                    rotate: 360,
                    filter: `drop-shadow(0 0 10px ${orb.color})`,
                    transition: { duration: 0.5 }
                  }}
                >
                  {orb.icon}
                </motion.div>
                
                {/* Animated Border */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{
                    background: `linear-gradient(45deg, ${orb.color}, transparent, ${orb.color}) border-box`,
                    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'subtract'
                  }}
                  initial={{ rotate: 0 }}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 2, ease: "linear" }}
                />
              </div>
              
              {/* Enhanced Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-full blur-xl"
                style={{ backgroundColor: orb.color }}
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 2, opacity: 0.3 }}
                transition={{ duration: 0.4 }}
              />
              
              {/* Label with Enhanced Typography */}
              <motion.div
                className="absolute -bottom-8 sm:-bottom-10 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm font-medium text-gold/80 uppercase tracking-wider whitespace-nowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.7, y: 0 }}
                whileHover={{ opacity: 1, y: -2, scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {orb.label}
              </motion.div>
              
              {/* Floating Particles */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-gold rounded-full"
                    style={{
                      left: `${20 + i * 30}%`,
                      top: `${20 + i * 20}%`,
                    }}
                    animate={{
                      y: [-10, -20, -10],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.nav>

      {/* Central Memory Sphere */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div
          ref={sphereRef}
          className="relative w-[280px] h-[280px] xs:w-[320px] xs:h-[320px] sm:w-[380px] sm:h-[380px] md:w-[450px] md:h-[450px] lg:w-[520px] lg:h-[520px] xl:w-[580px] xl:h-[580px] 2xl:w-[650px] 2xl:h-[650px]"
          style={{ rotateX, rotateY }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1, type: "spring", stiffness: 100 }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {memoryNodes.map((node, index) => (
              <motion.line
                key={`line-${index}`}
                x1="50%"
                y1="50%"
                x2={`${node.position.x}%`}
                y2={`${node.position.y}%`}
                stroke="url(#connectionGradient)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 2, delay: 1.5 + index * 0.2 }}
              />
            ))}
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#FFD700" stopOpacity="0.6" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>

          {/* Energy Rings */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute border border-cosmic-blue/30 rounded-full"
                style={{
                  width: `${120 + i * 40}px`,
                  height: `${120 + i * 40}px`,
                  left: `${-60 - i * 20}px`,
                  top: `${-60 - i * 20}px`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.7, 0.3],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 4 + i * 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          {/* Particle Trails */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-cosmic-silver/60 rounded-full"
                style={{
                  left: `${Math.cos(i * Math.PI / 4) * 80}px`,
                  top: `${Math.sin(i * Math.PI / 4) * 80}px`,
                }}
                animate={{
                  x: [0, Math.cos(i * Math.PI / 4) * 20, 0],
                  y: [0, Math.sin(i * Math.PI / 4) * 20, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Core Sphere */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 bg-secondary-gradient rounded-full cursor-pointer shadow-2xl group"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(255, 215, 0, 0.4)',
                '0 0 40px rgba(255, 215, 0, 0.6)',
                '0 0 20px rgba(255, 215, 0, 0.4)'
              ]
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity },
              scale: { duration: 0.2 }
            }}
            onClick={() => setActivePanel('create')}
          >
            <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-gold" />
            </div>
            
            {/* Core Sphere Label */}
            <motion.div
              className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gold/80 uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100"
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              Create Memory
            </motion.div>
          </motion.div>

          {/* Memory Nodes */}
          {memoryNodes.map((node, index) => (
            <motion.div
              key={node.id}
              className="absolute w-16 h-16 lg:w-20 lg:h-20 bg-glass-bg backdrop-blur-xl border border-gold/30 rounded-full flex items-center justify-center cursor-pointer group"
              style={{
                left: `${node.position.x}%`,
                top: `${node.position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              whileHover={{ scale: 1.3, rotate: 360 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNodeClick(node.id)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 2 + index * 0.1 }}
            >
              <div className="text-gold group-hover:text-black transition-colors duration-300 relative z-10">
                {node.icon}
              </div>
              
              {/* Node Label */}
              <motion.div
                className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gold/70 uppercase tracking-wider whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                whileHover={{ opacity: 1, y: 0, scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {node.title}
              </motion.div>
              
              {/* Enhanced Node Glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: node.color }}
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 2, opacity: 0.3 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Pulsing Ring */}
              <motion.div
                className="absolute inset-0 border-2 rounded-full"
                style={{ borderColor: node.color }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: index * 0.5
                }}
              />
              
              {/* Floating Animation */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 3, -3, 0]
                }}
                transition={{
                  duration: 4 + index,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          ))}

          {/* Time Ring */}
          <motion.div
            className="absolute inset-0 border-2 border-gold/10 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute w-4 h-4 bg-gold rounded-full -top-2 left-1/2 transform -translate-x-1/2 shadow-lg shadow-gold/50" />
          </motion.div>
        </motion.div>
      </div>

      {/* Timeline Path */}
      <motion.div
        className="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-4/5 max-w-4xl"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
      >
        <div className="relative h-20">
          {/* Timeline Track */}
          <div className="absolute top-1/2 w-full h-0.5 bg-gold/20 transform -translate-y-1/2" />
          
          {/* Timeline Progress */}
          <motion.div
            className="absolute top-1/2 h-0.5 bg-gradient-to-r from-transparent via-gold to-gold transform -translate-y-1/2 shadow-lg shadow-gold/50"
            style={{ width: `${timelineProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Timeline Nodes */}
          <div className="absolute inset-0 flex justify-between items-center">
            {timelineNodes.map((node, index) => (
              <motion.div
                key={node.year}
                className="relative group cursor-pointer z-20"
                whileHover={{ 
                  scale: 1.3,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTimelineNodeClick(index)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 3 + index * 0.1 }}
              >
                {/* Background Glow */}
                <motion.div
                  className="absolute inset-0 bg-gold/30 rounded-full blur-xl -z-10"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 4, opacity: 0.8 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Ripple Effect */}
                <motion.div
                  className="absolute inset-0 border-2 border-gold/50 rounded-full -z-10"
                  initial={{ scale: 1, opacity: 0 }}
                  whileHover={{ 
                    scale: [1, 2.5, 4], 
                    opacity: [0.8, 0.4, 0],
                    transition: { duration: 0.8, repeat: Infinity }
                  }}
                />
                
                <motion.div 
                  className="w-12 h-12 bg-glass-bg backdrop-blur-lg border-2 border-gold/30 rounded-full flex items-center justify-center text-gold relative z-10"
                  whileHover={{
                    borderColor: 'rgba(255, 215, 0, 1)',
                    backgroundColor: 'rgba(255, 215, 0, 0.3)',
                    boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 0 20px rgba(255, 215, 0, 0.2)',
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.div
                    whileHover={{ 
                      scale: 1.2,
                      rotate: 360,
                      transition: { duration: 0.6 }
                    }}
                  >
                    {node.icon}
                  </motion.div>
                </motion.div>
                
                {/* Year Label */}
                <motion.div 
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gold/70 whitespace-nowrap font-medium"
                  whileHover={{
                    color: 'rgba(255, 215, 0, 1)',
                    scale: 1.2,
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                >
                  {node.year}
                </motion.div>
                
                {/* Particle Burst on Hover */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  whileHover={{
                    background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
                    transition: { duration: 0.3 }
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 3 }}
      >
        <motion.button
          className="w-16 h-16 bg-secondary-gradient rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFabOpen(!fabOpen)}
          animate={{ rotate: fabOpen ? 135 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Plus className="w-8 h-8 text-black" />
        </motion.button>

        {/* FAB Options */}
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              className="absolute bottom-20 right-0 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[
                { icon: <Camera className="w-5 h-5" />, label: 'Photo' },
                { icon: <Video className="w-5 h-5" />, label: 'Video' },
                { icon: <Mic className="w-5 h-5" />, label: 'Voice' }
              ].map((option, index) => (
                <motion.button
                  key={index}
                  className="w-12 h-12 bg-glass-bg backdrop-blur-lg border border-gold/30 rounded-full flex items-center justify-center text-gold hover:bg-gold/20 transition-colors duration-300"
                  initial={{ scale: 0, x: 20 }}
                  animate={{ scale: 1, x: 0 }}
                  exit={{ scale: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.icon}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Memory Creation Panel */}
      <AnimatePresence>
        {activePanel === 'create' && (
          <motion.div
            className="fixed right-0 top-0 w-full md:w-96 h-full bg-glass-bg backdrop-blur-xl border-l border-gold/20 z-40 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="p-6 space-y-6">
              {/* Close Button */}
              <button
                onClick={() => setActivePanel(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-glass-bg border border-gold/30 rounded-full flex items-center justify-center text-gold hover:bg-gold/20 transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-display font-bold text-gold mb-8">Create Memory</h2>

              {/* Holographic Input Fields */}
              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-gold/30 pb-3 text-gold placeholder-transparent focus:border-gold focus:outline-none transition-colors duration-300"
                    placeholder="Memory Title"
                    id="title"
                  />
                  <label
                    htmlFor="title"
                    className="absolute left-0 -top-3 text-sm text-gold/60 transition-all duration-300 pointer-events-none"
                  >
                    Memory Title
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-transparent border-b border-gold/30 pb-3 text-gold placeholder-transparent focus:border-gold focus:outline-none transition-colors duration-300"
                    placeholder="For Who?"
                    id="recipient"
                  />
                  <label
                    htmlFor="recipient"
                    className="absolute left-0 -top-3 text-sm text-gold/60 transition-all duration-300 pointer-events-none"
                  >
                    For Who?
                  </label>
                </div>
              </div>

              {/* Emotion Crystals */}
              <div>
                <p className="text-sm text-gold/70 mb-4">How does this make you feel?</p>
                <div className="flex justify-center space-x-3">
                  {emotionCrystals.map((crystal) => (
                    <motion.button
                      key={crystal.id}
                      className={`w-12 h-16 relative cursor-pointer transition-all duration-300 ${
                        selectedEmotion === crystal.id ? 'transform -translate-y-2' : ''
                      }`}
                      style={{
                        clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                        background: selectedEmotion === crystal.id 
                          ? `linear-gradient(135deg, ${crystal.color}, ${crystal.color}80)`
                          : 'linear-gradient(135deg, transparent, rgba(255, 215, 0, 0.2))'
                      }}
                      whileHover={{ scale: 1.1, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedEmotion(crystal.id)}
                    >
                      <div
                        className="absolute inset-1 bg-black flex items-center justify-center text-gold"
                        style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}
                      >
                        {crystal.icon}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Voice Visualizer */}
              <div className="bg-glass-bg border border-gold/20 rounded-2xl p-6 flex items-center justify-center space-x-1">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-gradient-to-t from-gold to-gold/50 rounded-full"
                    style={{ height: `${20 + Math.random() * 30}px` }}
                    animate={{
                      scaleY: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.1
                    }}
                  />
                ))}
              </div>

              {/* Create Button */}
              <motion.button
                className="w-full bg-secondary-gradient text-black py-4 rounded-2xl font-semibold text-lg hover:scale-105 transition-transform duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Lock Memory in Time
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family Tree Modal */}
      <AnimatePresence>
        {showFamilyTree && (
          <FamilyTree onClose={() => setShowFamilyTree(false)} />
        )}
      </AnimatePresence>

      {/* Animated Components */}
      <AnimatePresence>
        {showUploadInterface && (
          <AnimatedUploadInterface
            isOpen={showUploadInterface}
            onClose={() => setShowUploadInterface(false)}
            onUploadComplete={(files) => {
              console.log('Files uploaded:', files);
              setShowUploadInterface(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTimeline && (
          <InteractiveTimeline
            isOpen={showTimeline}
            onClose={() => setShowTimeline(false)}
            events={[]}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnimatedFamilyTree && (
          <AnimatedFamilyTree
            isOpen={showAnimatedFamilyTree}
            onClose={() => setShowAnimatedFamilyTree(false)}
            members={[]}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMemoryGallery && (
          <AnimatedMemoryGallery
            isOpen={showMemoryGallery}
            onClose={() => setShowMemoryGallery(false)}
            memories={[]}
          />
        )}
      </AnimatePresence>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-4 right-4 w-12 h-12 bg-glass-bg backdrop-blur-lg border border-gold/30 rounded-full flex items-center justify-center text-gold hover:bg-gold/20 transition-colors duration-300 z-50"
        >
          <X className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}