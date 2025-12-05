'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import Link from 'next/link'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShowBanner(false)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-6xl mx-auto bg-obsidian-light/95 backdrop-blur-lg border border-gold-primary/30 rounded-lg shadow-2xl">
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <Cookie className="text-gold-primary flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-xl font-serif text-pearl mb-2">
                    We Value Your Privacy
                  </h3>
                  <p className="text-pearl/70 mb-4">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                    By clicking "Accept All", you consent to our use of cookies. You can manage your preferences 
                    or learn more in our{' '}
                    <Link href="/privacy" className="text-gold-primary hover:text-gold-secondary transition-colors">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleAccept}
                      className="px-6 py-2 bg-gradient-to-r from-gold-primary to-gold-secondary text-obsidian font-medium rounded-lg hover:shadow-lg hover:shadow-gold-primary/20 transition-all"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={handleDecline}
                      className="px-6 py-2 bg-obsidian-light border border-gold-primary/30 text-pearl font-medium rounded-lg hover:border-gold-primary/50 transition-colors"
                    >
                      Decline
                    </button>
                    <Link
                      href="/privacy"
                      className="px-6 py-2 text-pearl/70 hover:text-gold-primary transition-colors flex items-center"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
                <button
                  onClick={handleDecline}
                  className="text-pearl/50 hover:text-pearl transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
