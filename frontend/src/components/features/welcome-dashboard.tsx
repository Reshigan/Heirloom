"use client"

import * as React from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Heart, Users, Calendar, Sparkles, TreePine, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MemoryCard } from "@/components/ui/memory-card"
import { createGentleReveal } from "@/lib/utils"

// Mock data for demonstration
const mockMemories = [
  {
    id: "1",
    title: "Summer Family Reunion",
    description: "Three generations gathered at Grandma's house for our annual summer celebration",
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop",
    date: new Date(2023, 6, 15),
    people: [
      { id: "1", name: "Sarah Johnson" },
      { id: "2", name: "Michael Johnson" },
      { id: "3", name: "Emma Johnson" },
      { id: "4", name: "Grandma Rose" },
    ],
    reactions: [
      { type: 'heart' as const, count: 12 },
      { type: 'smile' as const, count: 8 },
    ],
    comments: 5,
    context: 'celebration' as const,
  },
  {
    id: "2",
    title: "Dad's Workshop",
    description: "Found this old photo of Dad teaching me woodworking when I was eight",
    imageUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop",
    date: new Date(1995, 3, 22),
    people: [
      { id: "5", name: "Robert Johnson" },
      { id: "6", name: "Young Sarah" },
    ],
    reactions: [
      { type: 'heart' as const, count: 15 },
      { type: 'tear' as const, count: 3 },
    ],
    comments: 8,
    context: 'nostalgic' as const,
  },
  {
    id: "3",
    title: "Emma's First Steps",
    description: "The moment we've all been waiting for - Emma took her first steps today!",
    imageUrl: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop",
    date: new Date(2024, 2, 10),
    people: [
      { id: "3", name: "Emma Johnson" },
      { id: "1", name: "Sarah Johnson" },
      { id: "2", name: "Michael Johnson" },
    ],
    reactions: [
      { type: 'heart' as const, count: 25 },
      { type: 'smile' as const, count: 18 },
    ],
    comments: 12,
    context: 'celebration' as const,
  },
]

const mockActivities = [
  {
    id: "1",
    type: "memory_added",
    user: "Michael",
    content: "added 5 new photos from Emma's birthday party",
    time: "2 hours ago",
    icon: <Heart className="w-4 h-4 text-emotion-love" />,
  },
  {
    id: "2",
    type: "story_created",
    user: "Grandma Rose",
    content: "shared the story behind the old family recipe",
    time: "1 day ago",
    icon: <Sparkles className="w-4 h-4 text-warmth-gold" />,
  },
  {
    id: "3",
    type: "connection_discovered",
    user: "Heirloom AI",
    content: "found that Emma has the same smile as Great-Grandma Mary",
    time: "2 days ago",
    icon: <TreePine className="w-4 h-4 text-depth-forest" />,
  },
]

const ActivityRiver: React.FC<{ activities: typeof mockActivities }> = ({ activities }) => {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          {...createGentleReveal(index * 0.1)}
          className="flex items-start space-x-3 p-4 bg-white/50 rounded-2xl border border-warmth-gold/20"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-warmth-cream rounded-full flex items-center justify-center">
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-story text-depth-navy">
              <span className="font-medium">{activity.user}</span> {activity.content}
            </p>
            <p className="text-sm text-depth-navy/60 font-timestamp mt-1">
              {activity.time}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

const MemorySpotlight: React.FC<{ memory: typeof mockMemories[0] }> = ({ memory }) => {
  return (
    <motion.div
      {...createGentleReveal()}
      className="flex flex-col md:flex-row gap-6 items-center"
    >
      <div className="w-full md:w-1/2 relative">
        <Image
          src={memory.imageUrl}
          alt={memory.title}
          width={400}
          height={320}
          className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-memory"
        />
      </div>
      <div className="w-full md:w-1/2 space-y-4">
        <div>
          <h3 className="font-serif text-2xl text-depth-navy mb-2">
            {memory.title}
          </h3>
          <p className="font-story text-depth-navy/80 leading-relaxed">
            {memory.description}
          </p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-depth-navy/60">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span className="font-timestamp">
              {memory.date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{memory.people.length} people</span>
          </div>
        </div>
        <Button context="discovery" size="lg">
          Explore This Memory
        </Button>
      </div>
    </motion.div>
  )
}

export const WelcomeDashboard: React.FC = () => {
  const userName = "Sarah" // This would come from user context
  const memoryCount = 1247 // This would come from API
  const yearSpan = "1952-2024" // This would be calculated
  const dailyDiscovery = mockMemories[1] // This would be selected by AI

  return (
    <div className="min-h-screen bg-gradient-to-b from-warmth-cream to-white">
      {/* Personalized Greeting */}
      <motion.header 
        {...createGentleReveal()}
        className="text-center py-12 px-4"
      >
        <h1 className="font-serif text-4xl md:text-5xl text-depth-mahogany mb-4">
          Welcome home, {userName}
        </h1>
        <p className="text-xl text-depth-navy/70 font-story max-w-2xl mx-auto">
          Your family has <span className="font-medium text-warmth-gold">{memoryCount.toLocaleString()}</span> memories 
          spanning <span className="font-medium text-warmth-gold">{yearSpan}</span>
        </p>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 pb-12 space-y-12">
        {/* Today's Discovery */}
        <motion.section {...createGentleReveal(0.2)}>
          <Card variant="default" className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-6 h-6 text-warmth-gold" />
                <CardTitle className="text-depth-navy">Today&apos;s Discovery</CardTitle>
              </div>
              <CardDescription>
                A memory that deserves to be remembered today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemorySpotlight memory={dailyDiscovery} />
            </CardContent>
          </Card>
        </motion.section>

        {/* Family Activity River */}
        <motion.section {...createGentleReveal(0.4)}>
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-depth-navy mb-2 flex items-center space-x-2">
              <Clock className="w-6 h-6 text-warmth-gold" />
              <span>Your Family&apos;s Story Continues...</span>
            </h2>
            <p className="font-story text-depth-navy/70">
              Recent moments and discoveries from your family
            </p>
          </div>
          <ActivityRiver activities={mockActivities} />
        </motion.section>

        {/* Memory Garden Preview */}
        <motion.section {...createGentleReveal(0.6)}>
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-depth-navy mb-2 flex items-center space-x-2">
              <TreePine className="w-6 h-6 text-depth-forest" />
              <span>Memory Garden</span>
            </h2>
            <p className="font-story text-depth-navy/70">
              Where your memories bloom and grow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockMemories.map((memory, index) => (
              <motion.div
                key={memory.id}
                {...createGentleReveal(0.8 + index * 0.1)}
              >
                <MemoryCard
                  memory={memory}
                  size="medium"
                  onMemoryClick={(memory) => {
                    console.log("Opening memory:", memory.title)
                    // This would navigate to the memory detail page
                  }}
                />
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            {...createGentleReveal(1.2)}
            className="text-center mt-8"
          >
            <Button variant="ghost" size="lg" className="text-warmth-gold hover:text-warmth-amber">
              Explore All Memories →
            </Button>
          </motion.div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section {...createGentleReveal(1.4)}>
          <Card variant="everyday" className="text-center">
            <CardContent className="py-8">
              <h3 className="font-serif text-xl text-depth-navy mb-4">
                Ready to add to your family&apos;s story?
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button context="celebration" size="lg">
                  <Heart className="w-4 h-4 mr-2" />
                  Add Memory
                </Button>
                <Button variant="ghost" size="lg">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Family
                </Button>
                <Button variant="ghost" size="lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Story
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  )
}