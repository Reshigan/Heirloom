'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, PanInfo } from 'framer-motion'
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { LockedImage } from '@/components/privacy/LockedPlaceholder'
import { usePrivacy } from '@/contexts/PrivacyContext'
import { gestures } from '@/lib/design-tokens'
import { apiClient } from '@/lib/api-client'

interface Reel {
  id: string
  title: string
  description: string
  category: 'joy' | 'lesson' | 'truth' | 'advice'
  timestamp: string
  mediaType: 'photo' | 'video'
  duration?: number
}

const mockReels: Reel[] = [
  {
    id: '1',
    title: 'Summer Vacation 2024',
    description: 'The best summer with family at the beach',
    category: 'joy',
    timestamp: '2024-08-15T10:30:00Z',
    mediaType: 'photo',
  },
  {
    id: '2',
    title: 'Wisdom from Dad',
    description: 'Life lessons I want to pass down',
    category: 'lesson',
    timestamp: '2024-09-20T14:20:00Z',
    mediaType: 'video',
    duration: 45,
  },
  {
    id: '3',
    title: 'My Journey',
    description: 'The truth about overcoming challenges',
    category: 'truth',
    timestamp: '2024-10-05T16:45:00Z',
    mediaType: 'video',
    duration: 120,
  },
]

/**
 * Reels Viewer - Vertical swipeable full-screen memory viewer
 * World-first UX: TikTok-style interaction for private legacy content
 */
export default function ReelsPage() {
  const { isUnlocked } = usePrivacy()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const y = useMotionValue(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isUnlocked) {
      setReels([])
      setLoading(false)
      return
    }

    const fetchReels = async () => {
      try {
        setLoading(true)
        const items = await apiClient.getMemories()
        
        const transformedReels: Reel[] = items
          .filter(item => item.type === 'photo' || item.type === 'video')
          .map(item => ({
            id: item.id,
            title: item.title || 'Untitled Memory',
            description: item.description || '',
            category: (item.emotion || 'joy') as 'joy' | 'lesson' | 'truth' | 'advice',
            timestamp: item.date || new Date().toISOString(),
            mediaType: item.type as 'photo' | 'video',
            duration: item.type === 'video' ? 60 : undefined,
          }))
        
        setReels(transformedReels)
      } catch (error) {
        console.error('Failed to fetch reels:', error)
        setReels([])
      } finally {
        setLoading(false)
      }
    }

    fetchReels()
  }, [isUnlocked])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y
    const offset = info.offset.y

    if (velocity < -gestures.swipeVelocity || offset < -gestures.swipeDistance) {
      if (currentIndex < reels.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }
    else if (velocity > gestures.swipeVelocity || offset > gestures.swipeDistance) {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
    }

    y.set(0)
  }

  if (loading) {
    return (
      <PrivacyGate>
        <div className="fixed inset-0 bg-obsidian-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gold-200/70">Loading reels...</p>
          </div>
        </div>
      </PrivacyGate>
    )
  }

  if (reels.length === 0) {
    return (
      <PrivacyGate>
        <div className="fixed inset-0 bg-obsidian-900 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-16 h-16 bg-gold-400/10 border-2 border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-gold-400" />
            </div>
            <h3 className="font-serif text-2xl text-gold-400 mb-2">No Reels Yet</h3>
            <p className="text-gold-200/70">Upload photos or videos to see them here</p>
          </div>
        </div>
      </PrivacyGate>
    )
  }

  return (
    <PrivacyGate>
      <div
        ref={containerRef}
        className="fixed inset-0 bg-obsidian-900 overflow-hidden"
        style={{ paddingTop: '64px', paddingBottom: '80px' }}
      >
        {/* Reels container */}
        <div className="relative h-full">
          {reels.map((reel, index) => {
            const isActive = index === currentIndex
            const offset = (index - currentIndex) * 100

            return (
              <motion.div
                key={reel.id}
                className="absolute inset-0"
                initial={false}
                animate={{
                  y: `${offset}%`,
                  opacity: isActive ? 1 : 0.3,
                  scale: isActive ? 1 : 0.9,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                drag={isActive ? 'y' : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ y: isActive ? y : 0 }}
              >
                <ReelCard
                  reel={reel}
                  isActive={isActive}
                  isPlaying={isPlaying}
                  isMuted={isMuted}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onToggleMute={() => setIsMuted(!isMuted)}
                />
              </motion.div>
            )
          })}
        </div>

        {/* Progress indicator */}
        <div className="absolute top-20 right-4 flex flex-col gap-1">
          {reels.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-8 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-gold-400'
                  : index < currentIndex
                  ? 'bg-gold-400/50'
                  : 'bg-gold-400/20'
              }`}
            />
          ))}
        </div>
      </div>
    </PrivacyGate>
  )
}

function ReelCard({
  reel,
  isActive,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
}: {
  reel: Reel
  isActive: boolean
  isPlaying: boolean
  isMuted: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
}) {
  const [isLiked, setIsLiked] = useState(false)

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Background media */}
      <div className="absolute inset-0">
        <LockedImage className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-obsidian-900/80" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 w-full h-full flex flex-col justify-end p-6 pb-8">
        {/* Category badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
          className="mb-4"
        >
          <span className="inline-block px-3 py-1 bg-gold-400/20 border border-gold-500/40 rounded-full text-xs text-gold-400 uppercase tracking-wider backdrop-blur-sm">
            {reel.category}
          </span>
        </motion.div>

        {/* Title and description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="font-serif text-3xl text-pearl mb-2 leading-tight">
            {reel.title}
          </h2>
          <p className="text-gold-200/80 leading-relaxed max-w-md">
            {reel.description}
          </p>
          <p className="text-xs text-gold-200/50 mt-2">
            {new Date(reel.timestamp).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-6"
        >
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 bg-obsidian-900/50 backdrop-blur-sm border border-gold-500/30 rounded-full flex items-center justify-center hover:bg-gold-400/20 transition-all">
              <Heart
                className={`w-6 h-6 ${
                  isLiked ? 'fill-gold-400 text-gold-400' : 'text-pearl'
                }`}
              />
            </div>
            <span className="text-xs text-pearl">Favorite</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-obsidian-900/50 backdrop-blur-sm border border-gold-500/30 rounded-full flex items-center justify-center hover:bg-gold-400/20 transition-all">
              <MessageCircle className="w-6 h-6 text-pearl" />
            </div>
            <span className="text-xs text-pearl">Reflect</span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-obsidian-900/50 backdrop-blur-sm border border-gold-500/30 rounded-full flex items-center justify-center hover:bg-gold-400/20 transition-all">
              <Share2 className="w-6 h-6 text-pearl" />
            </div>
            <span className="text-xs text-pearl">Share</span>
          </button>
        </motion.div>
      </div>

      {/* Media controls (for videos) */}
      {reel.mediaType === 'video' && isActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button
            onClick={onTogglePlay}
            className="w-16 h-16 bg-obsidian-900/70 backdrop-blur-sm border-2 border-gold-500/50 rounded-full flex items-center justify-center hover:bg-obsidian-900/90 transition-all"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-gold-400" />
            ) : (
              <Play className="w-8 h-8 text-gold-400 ml-1" />
            )}
          </button>
        </div>
      )}

      {/* Volume control */}
      {reel.mediaType === 'video' && isActive && (
        <button
          onClick={onToggleMute}
          className="absolute top-24 left-4 z-20 w-10 h-10 bg-obsidian-900/50 backdrop-blur-sm border border-gold-500/30 rounded-full flex items-center justify-center hover:bg-gold-400/20 transition-all"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-pearl" />
          ) : (
            <Volume2 className="w-5 h-5 text-pearl" />
          )}
        </button>
      )}
    </div>
  )
}
