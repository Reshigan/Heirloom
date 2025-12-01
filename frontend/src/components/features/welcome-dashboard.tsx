"use client"

import { motion } from "framer-motion"
import { Suspense } from "react"
import { ThreeBackground } from "@/components/ui/three-background"
import { ParticleSystem } from "@/components/ui/particle-system"
import { RevolutionaryHero } from "@/components/ui/revolutionary-hero"
import { MemoryCard } from "@/components/ui/memory-card"
import { FloatingNavigation } from "@/components/ui/floating-navigation"

// Revolutionary mock data
const revolutionaryMemories = [
  {
    title: "Summer Family Reunion",
    description: "Three generations gathered at Grandma's house for our annual summer celebration. The laughter echoed through the old oak trees as we shared stories and created new memories together.",
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop",
    date: "July 15, 2023",
    people: ["Sarah Johnson", "Michael Johnson", "Emma Johnson", "Grandma Rose", "Uncle Tom"],
    reactions: { likes: 42, hearts: 28, comments: 15 },
    tags: ["family", "reunion", "summer", "celebration", "traditions"]
  },
  {
    title: "Dad's Workshop Legacy",
    description: "Found this treasured photo of Dad teaching me woodworking when I was eight. His patient hands guiding mine, showing me how to create something beautiful from raw wood.",
    imageUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&h=400&fit=crop",
    date: "April 22, 1995",
    people: ["Robert Johnson", "Young Sarah"],
    reactions: { likes: 67, hearts: 89, comments: 23 },
    tags: ["father", "workshop", "childhood", "learning", "craftsmanship"]
  },
  {
    title: "Emma's First Steps",
    description: "The moment we've all been waiting for - Emma took her first steps today! Her determined little face as she wobbled toward us, arms outstretched, pure joy in her eyes.",
    imageUrl: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=600&h=400&fit=crop",
    date: "March 10, 2024",
    people: ["Emma Johnson", "Sarah Johnson", "Michael Johnson"],
    reactions: { likes: 156, hearts: 203, comments: 47 },
    tags: ["milestone", "baby", "first-steps", "joy", "growth"]
  },
  {
    title: "Grandma's Secret Recipe",
    description: "Finally convinced Grandma to share her famous apple pie recipe. Four generations of women gathered in the kitchen, flour everywhere, laughter filling the air.",
    imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=400&fit=crop",
    date: "November 28, 2023",
    people: ["Grandma Rose", "Sarah Johnson", "Emma Johnson", "Aunt Mary"],
    reactions: { likes: 78, hearts: 92, comments: 31 },
    tags: ["recipe", "tradition", "cooking", "generations", "thanksgiving"]
  },
  {
    title: "Wedding Day Magic",
    description: "Sarah and Michael's wedding day - a perfect blend of tradition and modern love. The way they looked at each other during their vows still gives me chills.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop",
    date: "June 12, 2018",
    people: ["Sarah Johnson", "Michael Johnson", "Wedding Party"],
    reactions: { likes: 234, hearts: 312, comments: 89 },
    tags: ["wedding", "love", "celebration", "vows", "family"]
  },
  {
    title: "Christmas Morning Magic",
    description: "Emma's first Christmas morning - the wonder in her eyes as she discovered the twinkling lights and colorful packages. Pure childhood magic captured forever.",
    imageUrl: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=600&h=400&fit=crop",
    date: "December 25, 2023",
    people: ["Emma Johnson", "Sarah Johnson", "Michael Johnson", "Santa"],
    reactions: { likes: 189, hearts: 267, comments: 52 },
    tags: ["christmas", "childhood", "wonder", "family", "traditions"]
  }
]

interface WelcomeDashboardProps {
  onOpenModal?: (modalType: string) => void;
}

export function WelcomeDashboard({ onOpenModal }: WelcomeDashboardProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Revolutionary Background Systems */}
      <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-br from-obsidian-900 to-black" />}>
        <ThreeBackground />
      </Suspense>
      <ParticleSystem />
      
      {/* Main Content */}
      <main className="relative z-10">
        {/* Revolutionary Hero Section */}
        <RevolutionaryHero 
          userName="Sarah"
          memoryCount={1247}
          yearSpan="1952-2024"
        />
        
        {/* Memory Showcase Section */}
        <section className="relative py-20 px-6">
          <motion.div
            className="max-w-7xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
          >
            {/* Section Header */}
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.8 }}
            >
              <h2 
                className="text-5xl md:text-7xl font-bold mb-6 gradient-text"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Your Memory Universe
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Explore the constellation of moments that define your family&apos;s journey through time
              </p>
            </motion.div>

            {/* Revolutionary Memory Grid */}
            <motion.div
              className="memory-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 1 }}
            >
              {revolutionaryMemories.map((memory, index) => (
                <motion.div
                  key={memory.title}
                  initial={{ opacity: 0, y: 100, rotateX: -30 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ 
                    delay: 3.2 + index * 0.2, 
                    duration: 0.8,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  <MemoryCard
                    {...memory}
                    onExplore={() => console.log(`Exploring: ${memory.title}`)}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Call to Action Section */}
            <motion.div
              className="text-center mt-20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 4, duration: 0.8 }}
            >
              <motion.div
                className="glass-morphism rounded-3xl p-12 max-w-4xl mx-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <h3 
                  className="text-4xl md:text-5xl font-bold mb-6 gradient-text"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Ready to Create Magic?
                </h3>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                  Every moment is a story waiting to be told. Start building your family&apos;s digital legacy today.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <motion.button
                    onClick={() => onOpenModal?.('upload')}
                    className="group relative px-10 py-4 text-lg font-semibold text-black rounded-2xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative z-10">✨ Add Your First Memory</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => onOpenModal?.('family-tree')}
                    className="px-10 py-4 text-lg font-semibold text-gold rounded-2xl glass-morphism hover-glow border border-gold-500/30"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🌳 Family Tree
                  </motion.button>
                  
                  <motion.button
                    onClick={() => onOpenModal?.('profile')}
                    className="px-10 py-4 text-lg font-semibold text-gold rounded-2xl glass-morphism hover-glow border border-gold-500/30"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    👤 Your Profile
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Revolutionary Navigation */}
      <FloatingNavigation />
    </div>
  )
}