/**
 * LoadingState Component
 * Themed loading animations for each content type
 */

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingStateProps {
  type: 'memories' | 'letters' | 'voice' | 'family' | 'generic';
  message?: string;
}

// Memories loading: Photos materializing from particles
const MemoriesLoading = () => (
  <div className="flex flex-col items-center">
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="w-16 h-16 rounded-lg bg-gradient-to-br from-gold/5 to-gold/15 border border-gold/10"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.95, 1, 0.95],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
    <p className="text-paper/50 text-sm">Gathering your precious moments...</p>
  </div>
);

// Letters loading: Envelope seal forming
const LettersLoading = () => (
  <div className="flex flex-col items-center">
    <div className="relative w-32 h-24 mb-4">
      {/* Envelope body */}
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-gold/30 bg-void-light/50"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Envelope flap */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-12 border-l-2 border-r-2 border-t-2 border-gold/30 rounded-t-lg"
        style={{ clipPath: 'polygon(0 100%, 50% 30%, 100% 100%)' }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />
      {/* Wax seal forming */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blood/60"
        animate={{
          scale: [0.5, 1, 0.5],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
    <p className="text-paper/50 text-sm">Unsealing your letters...</p>
  </div>
);

// Voice loading: Sound wave animation
const VoiceLoading = () => (
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-1 h-16 mb-4">
      {[...Array(9)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-gradient-to-t from-gold/40 to-gold rounded-full"
          animate={{
            height: [16, 40 + Math.sin(i) * 20, 16],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
    <p className="text-paper/50 text-sm">Loading your voice recordings...</p>
  </div>
);

// Family loading: Connected nodes appearing
const FamilyLoading = () => (
  <div className="flex flex-col items-center">
    <div className="relative w-32 h-24 mb-4">
      {/* Central node */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gold/60"
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      {/* Surrounding nodes */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const x = Math.cos((angle * Math.PI) / 180) * 35;
        const y = Math.sin((angle * Math.PI) / 180) * 25;
        return (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full bg-gold/40"
            style={{
              left: `calc(50% + ${x}px - 8px)`,
              top: `calc(50% + ${y}px - 8px)`,
            }}
            animate={{
              scale: [0.5, 1, 0.5],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        );
      })}
      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const x = Math.cos((angle * Math.PI) / 180) * 35 + 64;
          const y = Math.sin((angle * Math.PI) / 180) * 25 + 48;
          return (
            <motion.line
              key={i}
              x1="64"
              y1="48"
              x2={x}
              y2={y}
              stroke="rgba(201, 169, 89, 0.3)"
              strokeWidth="1"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          );
        })}
      </svg>
    </div>
    <p className="text-paper/50 text-sm">Building your family tree...</p>
  </div>
);

// Generic loading: Infinity symbol animation
const GenericLoading = () => (
  <div className="flex flex-col items-center">
    <div className="relative w-24 h-12 mb-4">
      <motion.svg
        viewBox="0 0 100 50"
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <motion.path
          d="M70 25c10 0 10 15 0 15-10 0-14-15-24-15-9 0-9 15 0 15 10 0 14-15 24-15z"
          className="text-gold"
          animate={{
            pathLength: [0, 1],
            opacity: [0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.svg>
    </div>
    <p className="text-paper/50 text-sm">Loading...</p>
  </div>
);

const loadingComponents = {
  memories: MemoriesLoading,
  letters: LettersLoading,
  voice: VoiceLoading,
  family: FamilyLoading,
  generic: GenericLoading,
};

export const LoadingState: React.FC<LoadingStateProps> = ({ type, message }) => {
  const LoadingComponent = loadingComponents[type] || loadingComponents.generic;

  return (
    <div className="flex items-center justify-center py-16">
      <LoadingComponent />
      {message && (
        <p className="text-paper/50 text-sm mt-4">{message}</p>
      )}
    </div>
  );
};

export default LoadingState;
