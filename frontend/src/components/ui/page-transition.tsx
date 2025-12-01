'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
  transitionKey?: string | number
  variant?: 'fade' | 'warp' | 'slide' | 'scale' | 'blur'
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
  delay?: number
}

// Warp flash effect component
const WarpFlash = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.5 }}
        exit={{ opacity: 0, scale: 2 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.4) 0%, transparent 70%)'
        }}
      />
    )}
  </AnimatePresence>
)

// Speed lines for warp effect
const SpeedLines = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <div className="fixed inset-0 z-[9998] pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent"
            style={{
              top: `${Math.random() * 100}%`,
              left: '-10%',
              width: '120%',
              transform: `rotate(${Math.random() * 10 - 5}deg)`
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 1, 0], scaleX: [0, 1.5, 2] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: Math.random() * 0.1,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    )}
  </AnimatePresence>
)

// Define animation variants for each transition type
const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  warp: {
    initial: { 
      opacity: 0, 
      scale: 0.9,
      filter: 'blur(10px)'
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      filter: 'blur(0px)'
    },
    exit: { 
      opacity: 0, 
      scale: 1.1,
      filter: 'blur(10px)'
    }
  },
  slide: {
    up: {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -40 }
    },
    down: {
      initial: { opacity: 0, y: -40 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 40 }
    },
    left: {
      initial: { opacity: 0, x: 40 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -40 }
    },
    right: {
      initial: { opacity: 0, x: -40 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 40 }
    }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(20px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(20px)' }
  }
}

export function PageTransition({
  children,
  className = '',
  transitionKey,
  variant = 'warp',
  direction = 'up',
  duration = 0.5,
  delay = 0
}: PageTransitionProps) {
  const [showWarpFlash, setShowWarpFlash] = useState(false)
  const [showSpeedLines, setShowSpeedLines] = useState(false)

  // Trigger warp effects when key changes
  useEffect(() => {
    if (variant === 'warp' && transitionKey !== undefined) {
      setShowSpeedLines(true)
      setTimeout(() => {
        setShowWarpFlash(true)
        setTimeout(() => setShowWarpFlash(false), 150)
      }, 200)
      setTimeout(() => setShowSpeedLines(false), 400)
    }
  }, [transitionKey, variant])

  // Get the appropriate variant
  const getVariant = () => {
    if (variant === 'slide') {
      return variants.slide[direction]
    }
    return variants[variant]
  }

  const currentVariant = getVariant()

  return (
    <>
      {/* Warp effects */}
      {variant === 'warp' && (
        <>
          <WarpFlash show={showWarpFlash} />
          <SpeedLines active={showSpeedLines} />
        </>
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={transitionKey}
          initial={currentVariant.initial}
          animate={currentVariant.animate}
          exit={currentVariant.exit}
          transition={{
            duration,
            delay,
            ease: [0.16, 1, 0.3, 1]
          }}
          className={className}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

// Staggered children animation wrapper
interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  initialDelay?: number
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1,
  initialDelay = 0
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: initialDelay,
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

// Individual stagger item
interface StaggerItemProps {
  children: React.ReactNode
  className?: string
  variant?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'blur'
}

const staggerItemVariants = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  fadeDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  },
  fadeLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  },
  fadeRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(10px)' },
    visible: { opacity: 1, filter: 'blur(0px)' }
  }
}

export function StaggerItem({
  children,
  className = '',
  variant = 'fadeUp'
}: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={staggerItemVariants[variant]}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {children}
    </motion.div>
  )
}

// View wrapper with consistent enter/exit animations
interface ViewWrapperProps {
  children: React.ReactNode
  className?: string
}

export function ViewWrapper({ children, className = '' }: ViewWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Modal/Overlay transition
interface ModalTransitionProps {
  children: React.ReactNode
  isOpen: boolean
  onClose?: () => void
  className?: string
}

export function ModalTransition({
  children,
  isOpen,
  onClose,
  className = ''
}: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-obsidian-900/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1]
            }}
            className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${className}`}
          >
            <div className="pointer-events-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default PageTransition
