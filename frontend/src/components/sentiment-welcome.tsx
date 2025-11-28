'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles, TrendingUp, Calendar } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface SentimentStats {
  totalMemories: number
  sentimentBreakdown: {
    [key: string]: number
  }
  emotionBreakdown: {
    [key: string]: number
  }
  recentSentiment: string | null
  daysSinceLastPost: number
}

export default function SentimentWelcome() {
  const [stats, setStats] = useState<SentimentStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSentimentStats = async () => {
      try {
        const memories = await apiClient.getMemories()
        
        const sentimentBreakdown: { [key: string]: number } = {}
        const emotionBreakdown: { [key: string]: number } = {}
        let mostRecentDate: Date | null = null
        let recentSentiment: string | null = null

        memories.forEach((memory: any) => {
          if (memory.sentimentLabel) {
            sentimentBreakdown[memory.sentimentLabel] = (sentimentBreakdown[memory.sentimentLabel] || 0) + 1
          }
          
          if (memory.emotionCategory) {
            emotionBreakdown[memory.emotionCategory] = (emotionBreakdown[memory.emotionCategory] || 0) + 1
          }

          const memoryDate = new Date(memory.createdAt)
          if (!mostRecentDate || memoryDate > mostRecentDate) {
            mostRecentDate = memoryDate
            recentSentiment = memory.sentimentLabel
          }
        })

        const daysSinceLastPost = mostRecentDate 
          ? Math.floor((Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999

        setStats({
          totalMemories: memories.length,
          sentimentBreakdown,
          emotionBreakdown,
          recentSentiment,
          daysSinceLastPost
        })
      } catch (error) {
        console.error('Failed to fetch sentiment stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSentimentStats()
  }, [])

  const getMotivationalMessage = () => {
    if (!stats) return ''

    const { daysSinceLastPost, recentSentiment, totalMemories } = stats

    if (totalMemories === 0) {
      return "Start your legacy today. Capture your first memory and begin building something eternal."
    }

    if (daysSinceLastPost <= 7) {
      if (recentSentiment === 'joyful' || recentSentiment === 'hopeful') {
        return `Your ${recentSentiment} moments are beautiful. Keep capturing the light in your life.`
      } else if (recentSentiment === 'nostalgic') {
        return "Your memories from the past are precious. What moment from today will you treasure tomorrow?"
      } else if (recentSentiment === 'loving') {
        return "The love you're preserving will echo through generations. Keep building your legacy."
      }
      return "You're building something beautiful. Every memory matters."
    }

    if (daysSinceLastPost <= 30) {
      const topSentiment = Object.entries(stats.sentimentBreakdown)
        .sort(([, a], [, b]) => b - a)[0]?.[0]
      
      if (topSentiment === 'joyful') {
        return `It's been ${daysSinceLastPost} days. Share what made you smile today.`
      } else if (topSentiment === 'nostalgic') {
        return `It's been ${daysSinceLastPost} days. What cherished moment are you remembering today?`
      } else if (topSentiment === 'loving') {
        return `It's been ${daysSinceLastPost} days. Capture another loving moment for your family.`
      }
      return `It's been ${daysSinceLastPost} days. Your legacy is waiting for the next chapter.`
    }

    return `Your memories miss you. It's been ${daysSinceLastPost} days since your last post. Come back and add to your legacy.`
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'joyful':
      case 'hopeful':
        return '✨'
      case 'loving':
        return '💛'
      case 'nostalgic':
        return '🌟'
      case 'reflective':
        return '🌙'
      default:
        return '⭐'
    }
  }

  if (isLoading) {
    return (
      <div className="sentiment-welcome loading">
        <div className="shimmer"></div>
      </div>
    )
  }

  if (!stats) return null

  const topSentiments = Object.entries(stats.sentimentBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const topEmotions = Object.entries(stats.emotionBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <motion.div 
      className="sentiment-welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="sentiment-welcome-header">
        <Sparkles className="sentiment-icon" size={24} />
        <h2 className="sentiment-title">Your Emotional Journey</h2>
      </div>

      <div className="sentiment-stats">
        <div className="stat-card">
          <Heart className="stat-icon" size={20} />
          <div className="stat-value">{stats.totalMemories}</div>
          <div className="stat-label">Memories</div>
        </div>

        {topSentiments.length > 0 && (
          <div className="stat-card">
            <span className="stat-emoji">{getSentimentIcon(topSentiments[0][0])}</span>
            <div className="stat-value">{topSentiments[0][1]}</div>
            <div className="stat-label">{topSentiments[0][0]}</div>
          </div>
        )}

        {stats.daysSinceLastPost < 999 && (
          <div className="stat-card">
            <Calendar className="stat-icon" size={20} />
            <div className="stat-value">{stats.daysSinceLastPost}</div>
            <div className="stat-label">days ago</div>
          </div>
        )}
      </div>

      {topSentiments.length > 0 && (
        <div className="sentiment-breakdown">
          <h3 className="breakdown-title">Your Emotional Palette</h3>
          <div className="sentiment-bars">
            {topSentiments.map(([sentiment, count]) => (
              <div key={sentiment} className="sentiment-bar-item">
                <div className="sentiment-bar-label">
                  <span className="sentiment-emoji">{getSentimentIcon(sentiment)}</span>
                  <span className="sentiment-name">{sentiment}</span>
                  <span className="sentiment-count">{count}</span>
                </div>
                <div className="sentiment-bar-track">
                  <motion.div 
                    className={`sentiment-bar-fill sentiment-${sentiment}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / stats.totalMemories) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.div 
        className="motivational-message"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <TrendingUp className="message-icon" size={20} />
        <p className="message-text">{getMotivationalMessage()}</p>
      </motion.div>

      <style jsx>{`
        .sentiment-welcome {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(26, 26, 26, 0.8) 100%);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 16px;
          padding: 2rem;
          margin: 2rem 0;
          backdrop-filter: blur(10px);
        }

        .sentiment-welcome.loading {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shimmer {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            rgba(212, 175, 55, 0.1) 0%, 
            rgba(212, 175, 55, 0.3) 50%, 
            rgba(212, 175, 55, 0.1) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .sentiment-welcome-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .sentiment-icon {
          color: var(--gold);
        }

        .sentiment-title {
          font-family: var(--font-serif);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--pearl);
          margin: 0;
        }

        .sentiment-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(10, 10, 10, 0.6);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 12px;
          padding: 1.25rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
        }

        .stat-icon {
          color: var(--gold);
          margin-bottom: 0.5rem;
        }

        .stat-emoji {
          font-size: 1.5rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-family: var(--font-serif);
          font-size: 2rem;
          font-weight: 700;
          color: var(--gold);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--pearl);
          opacity: 0.8;
          text-transform: capitalize;
        }

        .sentiment-breakdown {
          margin-bottom: 2rem;
        }

        .breakdown-title {
          font-family: var(--font-serif);
          font-size: 1.125rem;
          color: var(--pearl);
          margin-bottom: 1rem;
        }

        .sentiment-bars {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .sentiment-bar-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sentiment-bar-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .sentiment-emoji {
          font-size: 1.25rem;
        }

        .sentiment-name {
          color: var(--pearl);
          text-transform: capitalize;
          flex: 1;
        }

        .sentiment-count {
          color: var(--gold);
          font-weight: 600;
        }

        .sentiment-bar-track {
          height: 8px;
          background: rgba(26, 26, 26, 0.6);
          border-radius: 4px;
          overflow: hidden;
        }

        .sentiment-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--gold), var(--champagne));
        }

        .sentiment-joyful { background: linear-gradient(90deg, #FFD700, #FFA500); }
        .sentiment-hopeful { background: linear-gradient(90deg, #87CEEB, #4682B4); }
        .sentiment-loving { background: linear-gradient(90deg, #FF69B4, #FF1493); }
        .sentiment-nostalgic { background: linear-gradient(90deg, #DDA0DD, #9370DB); }
        .sentiment-reflective { background: linear-gradient(90deg, #B0C4DE, #778899); }

        .motivational-message {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(212, 175, 55, 0.1);
          border-left: 3px solid var(--gold);
          border-radius: 8px;
        }

        .message-icon {
          color: var(--gold);
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .message-text {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--pearl);
          margin: 0;
        }

        @media (max-width: 768px) {
          .sentiment-welcome {
            padding: 1.5rem;
            margin: 1rem 0;
          }

          .sentiment-title {
            font-size: 1.25rem;
          }

          .sentiment-stats {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 0.75rem;
          }

          .stat-card {
            padding: 1rem;
          }

          .stat-value {
            font-size: 1.5rem;
          }

          .motivational-message {
            padding: 1rem;
          }
        }
      `}</style>
    </motion.div>
  )
}
