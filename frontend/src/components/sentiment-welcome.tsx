'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles, TrendingUp, Calendar } from 'lucide-react'

interface Memory {
  id: string
  title?: string
  createdAt: string
  sentimentLabel?: string
  emotionCategory?: string
  sentimentScore?: number
  keywords?: string[]
}

interface SentimentStats {
  totalMemories: number
  sentimentBreakdown: { [key: string]: number }
  emotionBreakdown: { [key: string]: number }
  recentSentiment: string | null
  daysSinceLastPost: number
}

interface SentimentWelcomeProps {
  memories: Memory[]
}

function computeSentimentStats(memories: Memory[]): SentimentStats {
  const sentimentBreakdown: { [key: string]: number } = {}
  const emotionBreakdown: { [key: string]: number } = {}
  let mostRecentDate: Date | null = null
  let recentSentiment: string | null = null

  memories.forEach(memory => {
    if (memory.sentimentLabel) {
      sentimentBreakdown[memory.sentimentLabel] = (sentimentBreakdown[memory.sentimentLabel] || 0) + 1
    }
    
    if (memory.emotionCategory) {
      emotionBreakdown[memory.emotionCategory] = (emotionBreakdown[memory.emotionCategory] || 0) + 1
    }

    const memoryDate = new Date(memory.createdAt)
    if (!mostRecentDate || memoryDate > mostRecentDate) {
      mostRecentDate = memoryDate
      recentSentiment = memory.sentimentLabel || null
    }
  })

  const daysSinceLastPost = mostRecentDate 
    ? Math.floor((Date.now() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  return {
    totalMemories: memories.length,
    sentimentBreakdown,
    emotionBreakdown,
    recentSentiment,
    daysSinceLastPost
  }
}

function getMotivationalMessage(stats: SentimentStats): string {
  const { daysSinceLastPost, recentSentiment, totalMemories, sentimentBreakdown } = stats

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
    const topSentiment = Object.entries(sentimentBreakdown)
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

function getSentimentIcon(sentiment: string): string {
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
    case 'grateful':
      return '🙏'
    case 'peaceful':
      return '☮️'
    case 'excited':
      return '🎉'
    default:
      return '⭐'
  }
}

export default function SentimentWelcome({ memories }: SentimentWelcomeProps) {
  const stats = useMemo(() => computeSentimentStats(memories), [memories])
  const motivationalMessage = useMemo(() => getMotivationalMessage(stats), [stats])

  if (stats.totalMemories === 0) {
    return null
  }

  const topSentiments = Object.entries(stats.sentimentBreakdown)
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
        <p className="message-text">{motivationalMessage}</p>
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
        .sentiment-grateful { background: linear-gradient(90deg, #98D8C8, #6BCF7F); }
        .sentiment-peaceful { background: linear-gradient(90deg, #B0E0E6, #87CEEB); }
        .sentiment-excited { background: linear-gradient(90deg, #FF6347, #FF4500); }

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
