'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const wisdomQuotes = [
  'Every memory is a thread in the tapestry of your legacy',
  'The stories we preserve today become the wisdom of tomorrow',
  'In every photograph, a moment lives forever',
  'Your family history is a constellation of precious moments',
  'Time may pass, but memories remain eternal',
]

export function LoadingExperience() {
  const [quote, setQuote] = useState(wisdomQuotes[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-obsidian flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <div className="text-center">
        <motion.div
          className="relative w-32 h-32 mx-auto mb-12"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full border border-gold/20" />
          <motion.div
            className="absolute inset-0 rounded-full border-t-2 border-gold"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="font-serif text-4xl text-gold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              H
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          className="font-serif text-3xl tracking-[0.3em] text-gold mb-8"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          HEIRLOOM
        </motion.h1>

        <motion.p
          className="text-sm text-pearl/70 italic max-w-md mx-auto px-4"
          key={quote}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6 }}
        >
          "{quote}"
        </motion.p>
      </div>
    </motion.div>
  )
}
