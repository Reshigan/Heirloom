"use client"

import * as React from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Heart, MessageCircle, Calendar } from "lucide-react"
import { Card, CardContent } from "./card"
import { cn, formatDateHumanFriendly, createMemoryBloom, type EmotionalContext } from "@/lib/utils"

interface Person {
  id: string
  name: string
  avatar?: string
}

interface Memory {
  id: string
  title?: string
  description?: string
  imageUrl: string
  date: Date
  people: Person[]
  reactions: { type: 'heart' | 'smile' | 'tear'; count: number }[]
  comments: number
  context?: EmotionalContext
}

interface MemoryCardProps {
  memory: Memory
  size?: 'small' | 'medium' | 'large'
  interactive?: boolean
  showDetails?: boolean
  onMemoryClick?: (memory: Memory) => void
  className?: string
}

const PersonBubble: React.FC<{ person: Person; size: 'sm' | 'md' }> = ({ person, size }) => {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
  
  return (
    <div 
      className={cn(
        "rounded-full bg-warmth-gold text-depth-navy flex items-center justify-center font-medium border-2 border-white",
        sizeClasses
      )}
      title={person.name}
    >
      {person.avatar ? (
        <Image 
          src={person.avatar} 
          alt={person.name}
          width={32}
          height={32}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        person.name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

const EmotionCloud: React.FC<{ reactions: Memory['reactions'] }> = ({ reactions }) => {
  return (
    <div className="flex items-center space-x-2">
      {reactions.map((reaction, index) => (
        <div key={index} className="flex items-center space-x-1 text-xs text-depth-navy/60">
          {reaction.type === 'heart' && <Heart className="w-3 h-3 fill-emotion-love text-emotion-love" />}
          {reaction.type === 'smile' && <span className="text-emotion-joy">😊</span>}
          {reaction.type === 'tear' && <span className="text-memorial-primary">😢</span>}
          <span>{reaction.count}</span>
        </div>
      ))}
    </div>
  )
}

export const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  size = 'medium',
  interactive = true,
  showDetails = true,
  onMemoryClick,
  className
}) => {
  const [isHovered, setIsHovered] = React.useState(false)
  
  const sizeClasses = {
    small: 'w-48 h-48',
    medium: 'w-64 h-80',
    large: 'w-80 h-96'
  }
  
  const imageClasses = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64'
  }

  const handleClick = () => {
    if (onMemoryClick) {
      onMemoryClick(memory)
    }
  }

  return (
    <motion.div
      {...createMemoryBloom()}
      className={cn(sizeClasses[size], className)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        variant="memory"
        padding="none"
        interactive={interactive ? "gentle" : "none"}
        context={memory.context}
        className="h-full overflow-hidden cursor-pointer"
        onClick={handleClick}
      >
        {/* Memory Image */}
        <div className={cn("relative overflow-hidden", imageClasses[size])}>
          <motion.div
            className="w-full h-full relative overflow-hidden"
            animate={{
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Image
              src={memory.imageUrl}
              alt={memory.title || "Family memory"}
              fill
              className="object-cover"
            />
          </motion.div>
          
          {/* Gentle overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Date badge */}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
            <div className="flex items-center space-x-1 text-xs text-depth-navy">
              <Calendar className="w-3 h-3" />
              <span className="font-timestamp">
                {formatDateHumanFriendly(memory.date)}
              </span>
            </div>
          </div>
          
          {/* People present */}
          {memory.people.length > 0 && (
            <div className="absolute bottom-2 left-2 flex -space-x-1">
              {memory.people.slice(0, 3).map((person) => (
                <PersonBubble key={person.id} person={person} size="sm" />
              ))}
              {memory.people.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-depth-navy/80 text-white flex items-center justify-center text-xs font-medium border-2 border-white">
                  +{memory.people.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Memory Details */}
        {showDetails && (
          <CardContent className="p-4 flex-1 flex flex-col justify-between">
            <div>
              {memory.title && (
                <h3 className="font-serif text-lg leading-tight text-depth-navy mb-2 line-clamp-2">
                  {memory.title}
                </h3>
              )}
              
              {memory.description && (
                <p className="font-story text-sm text-depth-navy/70 line-clamp-2 mb-3">
                  {memory.description}
                </p>
              )}
            </div>
            
            {/* Interactions */}
            <div className="flex items-center justify-between pt-2 border-t border-warmth-gold/20">
              <EmotionCloud reactions={memory.reactions} />
              
              {memory.comments > 0 && (
                <div className="flex items-center space-x-1 text-xs text-depth-navy/60">
                  <MessageCircle className="w-3 h-3" />
                  <span>{memory.comments}</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  )
}

export default MemoryCard