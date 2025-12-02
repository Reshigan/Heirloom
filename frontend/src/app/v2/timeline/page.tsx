'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Heart, Star, Baby, GraduationCap, Briefcase, Home as HomeIcon } from 'lucide-react'
import { PrivacyGate } from '@/components/privacy/PrivacyGate'
import { LockedImage } from '@/components/privacy/LockedPlaceholder'

interface TimelineEvent {
  id: string
  year: number
  month: number
  day: number
  title: string
  description: string
  category: 'milestone' | 'memory' | 'achievement' | 'family'
  icon: 'baby' | 'graduation' | 'briefcase' | 'home' | 'heart' | 'star'
  location?: string
}

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    year: 2024,
    month: 11,
    day: 15,
    title: 'Family Reunion',
    description: 'Wonderful gathering with extended family',
    category: 'family',
    icon: 'heart',
    location: 'Cape Town, South Africa',
  },
  {
    id: '2',
    year: 2024,
    month: 6,
    day: 20,
    title: 'Career Milestone',
    description: 'Promoted to Senior Position',
    category: 'achievement',
    icon: 'briefcase',
  },
  {
    id: '3',
    year: 2023,
    month: 12,
    day: 25,
    title: 'First Home',
    description: 'Purchased our family home',
    category: 'milestone',
    icon: 'home',
    location: 'Johannesburg',
  },
]

const iconMap = {
  baby: Baby,
  graduation: GraduationCap,
  briefcase: Briefcase,
  home: HomeIcon,
  heart: Heart,
  star: Star,
}

/**
 * Timeline View - Life Story chronological view
 * World-first UX: Scroll-linked animations with year markers
 */
export default function TimelinePage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const eventsByYear = mockEvents.reduce((acc, event) => {
    if (!acc[event.year]) {
      acc[event.year] = []
    }
    acc[event.year].push(event)
    return acc
  }, {} as Record<number, TimelineEvent[]>)

  const years = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-obsidian-900">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-gradient-to-b from-obsidian-900 via-obsidian-900/95 to-transparent backdrop-blur-xl border-b border-gold-500/10 pb-4">
        <div className="px-4 pt-4">
          <h2 className="font-serif text-2xl text-gold-400 mb-2">Life Story</h2>
          <p className="text-sm text-gold-200/70">Your journey through time</p>
        </div>
      </div>

      {/* Timeline */}
      <PrivacyGate>
        <div className="relative px-4 py-8">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold-400/50 via-gold-400/30 to-transparent" />

          {/* Events grouped by year */}
          <div className="space-y-12">
            {years.map((year, yearIndex) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: yearIndex * 0.1 }}
              >
                {/* Year marker */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full flex items-center justify-center shadow-lg shadow-gold-400/20">
                      <Calendar className="w-6 h-6 text-obsidian-900" />
                    </div>
                    <div className="absolute -inset-2 bg-gold-400/20 rounded-full blur-xl -z-10" />
                  </div>
                  <h3 className="font-serif text-3xl text-gold-400">{year}</h3>
                </div>

                {/* Events for this year */}
                <div className="space-y-6 ml-16">
                  {eventsByYear[year].map((event, eventIndex) => (
                    <TimelineEventCard
                      key={event.id}
                      event={event}
                      index={eventIndex}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </PrivacyGate>
    </div>
  )
}

function TimelineEventCard({ event, index }: { event: TimelineEvent; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const Icon = iconMap[event.icon]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {/* Connecting dot */}
      <div className="absolute -left-[4.5rem] top-6 w-4 h-4 bg-gold-400 rounded-full border-4 border-obsidian-900" />

      {/* Card */}
      <motion.div
        layout
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-br from-charcoal/50 to-obsidian-800/50 backdrop-blur-xl border border-gold-500/20 rounded-2xl overflow-hidden shadow-xl cursor-pointer hover:border-gold-500/40 transition-all"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-gold-400/10 border border-gold-500/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-gold-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-serif text-lg text-gold-400 mb-1">{event.title}</h4>
              <div className="flex items-center gap-2 text-xs text-gold-200/50">
                <span>
                  {new Date(event.year, event.month - 1, event.day).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {event.location && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-gold-400/10 border border-gold-500/30 rounded-full text-gold-400 capitalize">
              {event.category}
            </span>
          </div>

          {/* Description */}
          <p className="text-gold-200/80 text-sm leading-relaxed mb-3">
            {event.description}
          </p>

          {/* Expandable content */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gold-500/10 pt-3 mt-3"
            >
              <div className="aspect-video rounded-lg overflow-hidden">
                <LockedImage className="w-full h-full" />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
