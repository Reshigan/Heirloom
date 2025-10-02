"use client"

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useState, useRef } from 'react'
import Image from 'next/image'

interface MemoryCardProps {
  title: string
  description: string
  imageUrl: string
  date: string
  people: string[]
  reactions: {
    likes: number
    hearts: number
    comments: number
  }
  tags?: string[]
  onExplore?: () => void
}

export function MemoryCard({
  title,
  description,
  imageUrl,
  date,
  people,
  reactions,
  tags = [],
  onExplore
}: MemoryCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]))
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]))

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    mouseX.set((e.clientX - centerX) / (rect.width / 2))
    mouseY.set((e.clientY - centerY) / (rect.height / 2))
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={cardRef}
      className="relative w-full max-w-md mx-auto perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="relative w-full h-96 preserve-3d cursor-pointer"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        animate={{
          rotateY: isFlipped ? 180 : 0
        }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front of Card */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <motion.div
            className="relative w-full h-full glass-morphism rounded-3xl overflow-hidden group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {/* Image Container */}
            <div className="relative h-48 overflow-hidden">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Floating Date Badge */}
              <motion.div
                className="absolute top-4 right-4 bg-glass-bg backdrop-blur-lg border border-gold/30 px-3 py-1 rounded-full text-sm font-medium text-gold"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                {date}
              </motion.div>

              {/* People Avatars */}
              <div className="absolute bottom-4 left-4 flex -space-x-2">
                {people.slice(0, 3).map((person, index) => (
                  <motion.div
                    key={person}
                    className="w-8 h-8 rounded-full bg-secondary-gradient flex items-center justify-center text-black text-xs font-bold border-2 border-gold/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                  >
                    {person[0]}
                  </motion.div>
                ))}
                {people.length > 3 && (
                  <motion.div
                    className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold border-2 border-gold/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    +{people.length - 3}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <motion.h3
                className="text-xl font-bold text-gold line-clamp-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {title}
              </motion.h3>
              
              <motion.p
                className="text-gold/80 text-sm line-clamp-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {description}
              </motion.p>

              {/* Tags */}
              {tags.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full bg-gold/20 text-gold/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* Reactions */}
              <motion.div
                className="flex items-center justify-between pt-2 border-t border-gold/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center space-x-4 text-sm text-gold/70">
                  <span className="flex items-center space-x-1">
                    <span>👍</span>
                    <span>{reactions.likes}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>❤️</span>
                    <span>{reactions.hearts}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>💬</span>
                    <span>{reactions.comments}</span>
                  </span>
                </div>
                
                <motion.button
                  className="text-xs font-medium text-white/80 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onExplore?.()
                  }}
                >
                  Explore →
                </motion.button>
              </motion.div>
            </div>

            {/* Hover Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                boxShadow: '0 0 40px rgba(102, 126, 234, 0.3)'
              }}
            />
          </motion.div>
        </motion.div>

        {/* Back of Card */}
        <motion.div
          className="absolute inset-0 w-full h-full backface-hidden"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="w-full h-full glass-morphism rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-6">
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-2xl">🎭</span>
            </motion.div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white">Memory Details</h4>
              <p className="text-white/80 text-sm">{description}</p>
              
              <div className="space-y-2">
                <p className="text-white/70 text-xs">People in this memory:</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {people.map((person) => (
                    <span
                      key={person}
                      className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/70"
                    >
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <motion.button
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                onExplore?.()
              }}
            >
              View Full Story
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default MemoryCard