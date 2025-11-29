"use client"

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface HeroProps {
  userName?: string
  memoryCount?: number
  yearSpan?: string
}

export function RevolutionaryHero({ 
  userName = "Sarah", 
  memoryCount = 1247, 
  yearSpan = "1952-2024" 
}: HeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        staggerChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [-1, 1, -1]
    }
  }

  return (
    <motion.section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
    >
      {/* Dynamic Background Elements */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${50 + mousePosition.x * 20}% ${50 + mousePosition.y * 20}%, rgba(102, 126, 234, 0.3) 0%, transparent 70%)`
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 1, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Geometric Shapes */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 rounded-full glass-morphism"
        variants={floatingVariants}
        animate="animate"
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))'
        }}
      />
      
      <motion.div
        className="absolute bottom-32 right-32 w-24 h-24 glass-morphism"
        variants={floatingVariants}
        animate="animate"
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2), rgba(0, 242, 254, 0.2))',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
        {/* Welcome Message */}
        <motion.div
          variants={itemVariants}
          className="mb-8"
        >
          <motion.h1 
            className="text-7xl md:text-9xl font-bold mb-6 leading-none"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #ffffff 0%, #667eea 50%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Welcome home,
          </motion.h1>
          
          <motion.div
            className="relative inline-block"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.h2 
              className="text-6xl md:text-8xl font-bold gradient-text pulse-glow"
              style={{ fontFamily: "'Playfair Display', serif" }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {userName}
            </motion.h2>
            
            {/* Decorative underline */}
            <motion.div
              className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ delay: 1.5, duration: 1 }}
            />
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          variants={itemVariants}
          className="glass-morphism rounded-3xl p-8 mb-12 hover-lift"
        >
          <motion.p 
            className="text-2xl md:text-3xl text-white/90 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            Your family has
          </motion.p>
          
          <motion.div 
            className="flex items-center justify-center gap-4 flex-wrap"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2.5, type: "spring", stiffness: 200 }}
          >
            <motion.span 
              className="text-6xl md:text-8xl font-bold gradient-text"
              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              {memoryCount.toLocaleString()}
            </motion.span>
            
            <motion.span 
              className="text-2xl md:text-3xl text-white/80"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 3 }}
            >
              memories spanning
            </motion.span>
            
            <motion.span 
              className="text-4xl md:text-6xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
              whileHover={{ scale: 1.1 }}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 3.5 }}
            >
              {yearSpan}
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <motion.button
            className="group relative px-12 py-4 text-xl font-semibold text-white rounded-2xl overflow-hidden hover-lift"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
            <span className="relative z-10">Explore Your Legacy</span>
          </motion.button>
          
          <motion.button
            className="group px-12 py-4 text-xl font-semibold text-white rounded-2xl glass-morphism hover-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Add New Memory</span>
          </motion.button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
            animate={{ borderColor: ['rgba(255,255,255,0.3)', 'rgba(102,126,234,0.8)', 'rgba(255,255,255,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}