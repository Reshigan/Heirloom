'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { GoldCard, GoldCardHeader, GoldCardTitle, GoldCardContent, GoldButton } from '@/components/gold-card'
import { apiClient } from '@/lib/api-client'

export default function CheckInPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getCheckInStatus()
      setStatus(data)
    } catch (error) {
      console.error('Failed to load check-in status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setChecking(true)
      await apiClient.performCheckIn()
      await loadStatus()
    } catch (error) {
      console.error('Failed to perform check-in:', error)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-serif font-light text-gold-primary mb-4 tracking-wide">
          Check-In
        </h1>
        <p className="text-xl text-pearl/70">
          Let us know you're okay
        </p>
      </motion.div>

      {loading ? (
        <GoldCard>
          <div className="text-center py-12 text-pearl/50">Loading status...</div>
        </GoldCard>
      ) : (
        <>
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <GoldCard>
              <GoldCardHeader>
                <div className="flex items-center justify-between">
                  <GoldCardTitle>Current Status</GoldCardTitle>
                  <div className={`px-4 py-2 rounded-full ${
                    status?.status === 'active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {status?.status === 'active' ? (
                      <CheckCircle className="inline-block mr-2" size={16} />
                    ) : (
                      <AlertCircle className="inline-block mr-2" size={16} />
                    )}
                    {status?.status || 'Unknown'}
                  </div>
                </div>
              </GoldCardHeader>
              <GoldCardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-pearl/50 mb-2">Next Check-In</p>
                    <p className="text-lg text-pearl">
                      {status?.nextCheckIn 
                        ? new Date(status.nextCheckIn).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-pearl/50 mb-2">Check-In Interval</p>
                    <p className="text-lg text-pearl">
                      Every {status?.intervalDays || 0} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-pearl/50 mb-2">Missed Check-Ins</p>
                    <p className="text-lg text-pearl">
                      {status?.missedCount || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-8">
                  <GoldButton
                    onClick={handleCheckIn}
                    variant="primary"
                    disabled={checking}
                    className="w-full md:w-auto"
                    data-testid="check-in-now-button"
                  >
                    <Heart className="inline-block mr-2" size={20} />
                    {checking ? 'Checking In...' : 'Check In Now'}
                  </GoldButton>
                </div>
              </GoldCardContent>
            </GoldCard>
          </motion.div>

          {/* Recent Check-Ins */}
          {status?.recentCheckIns && status.recentCheckIns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <GoldCard>
                <GoldCardHeader>
                  <GoldCardTitle>Recent Check-Ins</GoldCardTitle>
                </GoldCardHeader>
                <GoldCardContent>
                  <div className="space-y-4">
                    {status.recentCheckIns.map((checkIn: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 border-b border-gold-primary/10 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="text-gold-primary/50" size={20} />
                          <div>
                            <p className="text-pearl">
                              {new Date(checkIn.sentAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            {checkIn.respondedAt && (
                              <p className="text-sm text-pearl/50">
                                Responded: {new Date(checkIn.respondedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          {checkIn.missed ? (
                            <span className="text-red-400 text-sm">Missed</span>
                          ) : (
                            <CheckCircle className="text-green-400" size={20} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </GoldCardContent>
              </GoldCard>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
