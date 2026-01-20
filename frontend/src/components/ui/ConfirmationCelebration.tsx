/**
 * ConfirmationCelebration Component
 * Confetti/animation for milestones and achievements
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationCelebrationProps {
  isVisible: boolean;
  type?: 'confetti' | 'hearts' | 'stars' | 'seal';
  message?: string;
  subMessage?: string;
  duration?: number;
  onComplete?: () => void;
}

// Confetti particle component
const ConfettiParticle: React.FC<{ index: number; color: string }> = ({ index, color }) => {
  const randomX = Math.random() * 100;
  const randomDelay = Math.random() * 0.5;
  const randomDuration = 2 + Math.random() * 2;
  const randomRotation = Math.random() * 720 - 360;

  return (
    <motion.div
      className="absolute w-3 h-3 rounded-sm"
      style={{
        left: `${randomX}%`,
        top: '-20px',
        backgroundColor: color,
      }}
      initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
      animate={{
        y: window.innerHeight + 100,
        x: (Math.random() - 0.5) * 200,
        rotate: randomRotation,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        ease: 'easeOut',
      }}
    />
  );
};

// Heart particle component
const HeartParticle: React.FC<{ index: number }> = ({ index }) => {
  const randomX = 20 + Math.random() * 60;
  const randomDelay = Math.random() * 0.3;
  const randomScale = 0.5 + Math.random() * 0.5;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${randomX}%`,
        bottom: '20%',
      }}
      initial={{ y: 0, scale: 0, opacity: 0 }}
      animate={{
        y: -200 - Math.random() * 200,
        scale: [0, randomScale, randomScale, 0],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 2 + Math.random(),
        delay: randomDelay,
        ease: 'easeOut',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#8b2942">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </motion.div>
  );
};

// Star particle component
const StarParticle: React.FC<{ index: number }> = ({ index }) => {
  const randomX = 10 + Math.random() * 80;
  const randomY = 10 + Math.random() * 80;
  const randomDelay = Math.random() * 0.5;
  const randomScale = 0.3 + Math.random() * 0.7;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${randomX}%`,
        top: `${randomY}%`,
      }}
      initial={{ scale: 0, rotate: 0, opacity: 0 }}
      animate={{
        scale: [0, randomScale, 0],
        rotate: [0, 180],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 1.5,
        delay: randomDelay,
        ease: 'easeInOut',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#c9a959">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </motion.div>
  );
};

// Wax seal animation component
const WaxSealAnimation: React.FC = () => {
  return (
    <motion.div
      className="relative w-32 h-32"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Seal base */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blood to-red-900 shadow-xl"
        animate={{ boxShadow: ['0 0 0 0 rgba(139, 41, 66, 0.4)', '0 0 30px 10px rgba(139, 41, 66, 0)', '0 0 0 0 rgba(139, 41, 66, 0.4)'] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Inner ring */}
      <div className="absolute inset-3 rounded-full border-2 border-white/20" />
      
      {/* Infinity symbol */}
      <motion.svg
        className="absolute inset-0 w-full h-full p-8"
        viewBox="0 0 100 50"
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <motion.path
          d="M70 25c10 0 10 15 0 15-10 0-14-15-24-15-9 0-9 15 0 15 10 0 14-15 24-15z"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.svg>
      
      {/* Dripping wax effect */}
      <motion.div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-blood rounded-b-full"
        initial={{ scaleY: 0, originY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
    </motion.div>
  );
};

const confettiColors = ['#c9a959', '#8b2942', '#f5f3ee', '#e8d5a3', '#a83250'];

export const ConfirmationCelebration: React.FC<ConfirmationCelebrationProps> = ({
  isVisible,
  type = 'confetti',
  message = 'Success!',
  subMessage,
  duration = 3000,
  onComplete,
}) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate particle indices
      const count = type === 'confetti' ? 50 : type === 'hearts' ? 15 : type === 'stars' ? 20 : 0;
      setParticles(Array.from({ length: count }, (_, i) => i));

      // Call onComplete after duration
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [isVisible, type, duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-void/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {type === 'confetti' && particles.map((i) => (
              <ConfettiParticle
                key={i}
                index={i}
                color={confettiColors[i % confettiColors.length]}
              />
            ))}
            {type === 'hearts' && particles.map((i) => (
              <HeartParticle key={i} index={i} />
            ))}
            {type === 'stars' && particles.map((i) => (
              <StarParticle key={i} index={i} />
            ))}
          </div>

          {/* Center content */}
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {type === 'seal' && <WaxSealAnimation />}
            
            <motion.h2
              className="text-3xl font-display text-paper mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {message}
            </motion.h2>
            
            {subMessage && (
              <motion.p
                className="text-paper/70 mt-2 text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {subMessage}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationCelebration;
