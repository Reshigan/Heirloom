'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Modern Aurora Effect */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, rgba(37, 99, 235, 0.02) 0%, transparent 50%, rgba(249, 115, 22, 0.02) 100%)'
          }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            background: [
              'linear-gradient(45deg, rgba(37, 99, 235, 0.02) 0%, transparent 50%, rgba(249, 115, 22, 0.02) 100%)',
              'linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, transparent 50%, rgba(124, 58, 237, 0.02) 100%)',
              'linear-gradient(225deg, rgba(236, 72, 153, 0.02) 0%, transparent 50%, rgba(37, 99, 235, 0.02) 100%)',
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Modern Constellation Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-15">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.line
            key={i}
            x1={`${Math.random() * 100}%`}
            y1={`${Math.random() * 100}%`}
            x2={`${Math.random() * 100}%`}
            y2={`${Math.random() * 100}%`}
            stroke="rgba(37, 99, 235, 0.1)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 0], 
              opacity: [0, 0.6, 0] 
            }}
            transition={{
              duration: Math.random() * 8 + 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>
      
      {/* Heritage Dust */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 60 }).map((_, i) => {
          const colors = ['bg-heritage-gold/30', 'bg-heritage-sage/25', 'bg-heritage-rose/20', 'bg-heritage-burgundy/15'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          return (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 ${randomColor} rounded-full`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.1, 0.6, 0.1],
                scale: [0.3, 1, 0.3],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          );
        })}
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-xl"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 200 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${
                ['rgba(255,215,0,0.1)', 'rgba(138,43,226,0.1)', 'rgba(0,191,255,0.1)', 'rgba(255,20,147,0.1)'][
                  Math.floor(Math.random() * 4)
                ]
              } 0%, transparent 70%)`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Nebula Effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(255,215,0,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(138,43,226,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(0,191,255,0.03) 0%, transparent 60%)
          `,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Constellation Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <linearGradient id="constellationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,215,0,0.3)" />
            <stop offset="50%" stopColor="rgba(255,215,0,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.line
            key={i}
            x1={`${Math.random() * 100}%`}
            y1={`${Math.random() * 100}%`}
            x2={`${Math.random() * 100}%`}
            y2={`${Math.random() * 100}%`}
            stroke="url(#constellationGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      {/* Shooting Stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.4)',
            }}
            animate={{
              x: [0, 300],
              y: [0, 150],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: Math.random() * 10 + 5,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}