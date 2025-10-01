'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Camera, Clock, Heart, X, Sparkles, Music, Video,
  FileText, Mic, Users, Play, Share2
} from 'lucide-react';

interface MobileConstellationProps {
  onNavigate?: (section: string) => void;
  onClose?: () => void;
}

export default function MobileConstellation({ onClose }: MobileConstellationProps) {
  const [activeView, setActiveView] = useState<'constellation' | 'grid' | 'timeline'>('constellation');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  
  const panelRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { id: 'photo', icon: <Camera className="w-6 h-6" />, label: 'Photo', color: '#FFD700' },
    { id: 'video', icon: <Video className="w-6 h-6" />, label: 'Video', color: '#FF6B6B' },
    { id: 'voice', icon: <Mic className="w-6 h-6" />, label: 'Voice', color: '#4ECDC4' },
    { id: 'story', icon: <FileText className="w-6 h-6" />, label: 'Story', color: '#45B7D1' }
  ];

  const memoryTypes = [
    { id: 'recent', icon: <Clock className="w-8 h-8" />, label: 'Recent', count: 24 },
    { id: 'favorites', icon: <Heart className="w-8 h-8" />, label: 'Favorites', count: 12 },
    { id: 'family', icon: <Users className="w-8 h-8" />, label: 'Family', count: 156 },
    { id: 'moments', icon: <Sparkles className="w-8 h-8" />, label: 'Moments', count: 89 }
  ];

  const constellationNodes = [
    { id: '1', x: 50, y: 30, size: 'large', type: 'photo', color: '#FFD700' },
    { id: '2', x: 75, y: 45, size: 'medium', type: 'video', color: '#FF6B6B' },
    { id: '3', x: 80, y: 70, size: 'small', type: 'audio', color: '#4ECDC4' },
    { id: '4', x: 50, y: 80, size: 'medium', type: 'story', color: '#45B7D1' },
    { id: '5', x: 25, y: 70, size: 'small', type: 'voice', color: '#96CEB4' },
    { id: '6', x: 20, y: 45, size: 'large', type: 'moment', color: '#FECA57' }
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // Swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right
        handleSwipeRight();
      } else {
        // Swipe left
        handleSwipeLeft();
      }
    } else if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        // Swipe down
        handleSwipeDown();
      } else {
        // Swipe up
        handleSwipeUp();
      }
    }
  };

  const handleSwipeRight = () => {
    const views = ['constellation', 'grid', 'timeline'];
    const currentIndex = views.indexOf(activeView);
    const nextIndex = (currentIndex + 1) % views.length;
    setActiveView(views[nextIndex] as 'constellation' | 'grid' | 'timeline');
  };

  const handleSwipeLeft = () => {
    const views = ['constellation', 'grid', 'timeline'];
    const currentIndex = views.indexOf(activeView);
    const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
    setActiveView(views[prevIndex] as 'constellation' | 'grid' | 'timeline');
  };

  const handleSwipeUp = () => {
    setPanelHeight(window.innerHeight * 0.7);
  };

  const handleSwipeDown = () => {
    setPanelHeight(0);
    setSelectedNode(null);
  };

  const getNodeSize = (size: string) => {
    switch (size) {
      case 'small': return 'w-12 h-12';
      case 'medium': return 'w-16 h-16';
      case 'large': return 'w-20 h-20';
      default: return 'w-16 h-16';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'audio': return <Music className="w-6 h-6" />;
      case 'story': return <FileText className="w-6 h-6" />;
      case 'voice': return <Mic className="w-6 h-6" />;
      case 'moment': return <Heart className="w-6 h-6" />;
      default: return <Sparkles className="w-6 h-6" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent z-50 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
          <span className="text-gold/70 text-xs">Heirloom</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1 h-1 bg-gold/50 rounded-full" />
          <div className="w-1 h-1 bg-gold/50 rounded-full" />
          <div className="w-1 h-1 bg-gold rounded-full" />
        </div>
      </div>

      {/* View Indicator */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex items-center space-x-2 bg-glass-bg backdrop-blur-lg border border-gold/20 rounded-full px-4 py-2">
          {['constellation', 'grid', 'timeline'].map((view, index) => (
            <motion.div
              key={view}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                activeView === view ? 'bg-gold' : 'bg-gold/30'
              }`}
              whileTap={{ scale: 0.8 }}
              onClick={() => setActiveView(view as 'constellation' | 'grid' | 'timeline')}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-20 pb-32 h-full" ref={constraintsRef}>
        <AnimatePresence mode="wait">
          {/* Constellation View */}
          {activeView === 'constellation' && (
            <motion.div
              key="constellation"
              className="relative w-full h-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Central Core */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-secondary-gradient rounded-full shadow-2xl"
                whileTap={{ scale: 0.9 }}
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255, 215, 0, 0.4)',
                    '0 0 40px rgba(255, 215, 0, 0.6)',
                    '0 0 20px rgba(255, 215, 0, 0.4)'
                  ]
                }}
                transition={{
                  boxShadow: { duration: 2, repeat: Infinity }
                }}
              >
                <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gold" />
                </div>
              </motion.div>

              {/* Constellation Nodes */}
              {constellationNodes.map((node, index) => (
                <motion.div
                  key={node.id}
                  className={`absolute ${getNodeSize(node.size)} bg-glass-bg backdrop-blur-lg border border-gold/30 rounded-full flex items-center justify-center`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileTap={{ scale: 0.8 }}
                  drag
                  dragConstraints={constraintsRef}
                  dragElastic={0.2}
                  onTap={() => {
                    setSelectedNode(node.id);
                    setPanelHeight(window.innerHeight * 0.4);
                  }}
                >
                  <div className="text-gold">
                    {getNodeIcon(node.type)}
                  </div>
                  
                  {/* Connection Line to Center */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${50 - node.x + 50}%`}
                      y2={`${50 - node.y + 50}%`}
                      stroke="rgba(255, 215, 0, 0.2)"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  </svg>
                  
                  {/* Floating Animation */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      y: [0, -5, 0],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{
                      duration: 3 + index,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              ))}

              {/* Orbital Ring */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-gold/10 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute w-3 h-3 bg-gold/50 rounded-full -top-1.5 left-1/2 transform -translate-x-1/2" />
              </motion.div>
            </motion.div>
          )}

          {/* Grid View */}
          {activeView === 'grid' && (
            <motion.div
              key="grid"
              className="px-4 h-full overflow-y-auto"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-2 gap-4">
                {memoryTypes.map((type, index) => (
                  <motion.div
                    key={type.id}
                    className="bg-glass-bg backdrop-blur-lg border border-gold/20 rounded-2xl p-6 aspect-square flex flex-col items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                    onTap={() => {
                      setSelectedNode(type.id);
                      setPanelHeight(window.innerHeight * 0.6);
                    }}
                  >
                    <div className="text-gold mb-3">
                      {type.icon}
                    </div>
                    <h3 className="text-gold font-medium text-lg mb-1">{type.label}</h3>
                    <p className="text-gold/60 text-sm">{type.count} items</p>
                    
                    {/* Glow Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gold/5 rounded-2xl"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Timeline View */}
          {activeView === 'timeline' && (
            <motion.div
              key="timeline"
              className="px-4 h-full overflow-y-auto"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {[2024, 2023, 2022, 2021, 2020].map((year, index) => (
                  <motion.div
                    key={year}
                    className="relative"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-secondary-gradient rounded-full flex items-center justify-center mr-4">
                        <span className="text-black font-bold text-sm">{year}</span>
                      </div>
                      <div className="flex-1 h-px bg-gold/20" />
                    </div>
                    
                    <div className="ml-16 space-y-3">
                      {[1, 2, 3].map((item) => (
                        <motion.div
                          key={item}
                          className="bg-glass-bg backdrop-blur-lg border border-gold/20 rounded-xl p-4"
                          whileTap={{ scale: 0.98 }}
                          onTap={() => {
                            setSelectedNode(`${year}-${item}`);
                            setPanelHeight(window.innerHeight * 0.5);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
                              <Camera className="w-5 h-5 text-gold" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-gold font-medium">Memory Title {item}</h4>
                              <p className="text-gold/60 text-sm">March {item * 5}, {year}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions Bar */}
      <motion.div
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-glass-bg backdrop-blur-xl border border-gold/20 rounded-full p-2"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center space-x-2">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              className="w-12 h-12 bg-glass-bg border border-gold/30 rounded-full flex items-center justify-center text-gold"
              whileTap={{ scale: 0.8 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              onTap={() => {
                if (action.id === 'voice') {
                  setIsRecording(!isRecording);
                }
              }}
            >
              {action.icon}
              {action.id === 'voice' && isRecording && (
                <motion.div
                  className="absolute inset-0 border-2 border-red-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Bottom Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            ref={panelRef}
            className="absolute bottom-0 left-0 right-0 bg-glass-bg backdrop-blur-xl border-t border-gold/20 rounded-t-3xl overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: `${100 - (panelHeight / window.innerHeight) * 100}%` }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info: PanInfo) => {
              if (info.velocity.y > 500 || info.offset.y > 100) {
                handleSwipeDown();
              } else if (info.velocity.y < -500 || info.offset.y < -100) {
                handleSwipeUp();
              }
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gold/30 rounded-full" />
            </div>

            <div className="px-6 pb-8">
              <h3 className="text-xl font-display font-bold text-gold mb-4">Memory Details</h3>
              
              <div className="space-y-4">
                <div className="aspect-video bg-black/50 rounded-xl flex items-center justify-center">
                  <Play className="w-12 h-12 text-gold/50" />
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gold mb-2">Beautiful Sunset</h4>
                  <p className="text-gold/70 text-sm mb-4">
                    A magical evening captured during our family vacation. The colors were absolutely breathtaking.
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gold/60">
                    <span>March 15, 2024</span>
                    <span>•</span>
                    <span>3 people</span>
                    <span>•</span>
                    <span>12 reactions</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    className="flex-1 bg-secondary-gradient text-black py-3 rounded-xl font-medium"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Heart className="w-5 h-5 inline mr-2" />
                    Love
                  </motion.button>
                  <motion.button
                    className="flex-1 border border-gold/30 text-gold py-3 rounded-xl font-medium"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Share2 className="w-5 h-5 inline mr-2" />
                    Share
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-glass-bg backdrop-blur-lg border border-gold/30 rounded-full flex items-center justify-center text-gold z-50"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Haptic Feedback Indicator */}
      <motion.div
        className="absolute bottom-4 left-4 text-xs text-gold/40"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Swipe to navigate • Tap to interact
      </motion.div>
    </div>
  );
}