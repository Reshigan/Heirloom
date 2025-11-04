'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertCircle, CheckCircle, TrendingUp, Calendar, MapPin, Heart, Image } from 'lucide-react'

interface VaultHealthProps {
  lastUpdated: Date
  missingMetadataCount: number
  completionPercentage: number
  suggestions: string[]
  totalMemories: number
  memoriesWithEmotions: number
  memoriesWithLocations: number
  memoriesWithDates: number
}

export default function VaultHealthMonitor({
  lastUpdated,
  missingMetadataCount,
  completionPercentage,
  suggestions,
  totalMemories,
  memoriesWithEmotions,
  memoriesWithLocations,
  memoriesWithDates
}: VaultHealthProps) {
  const getHealthStatus = () => {
    if (completionPercentage >= 90) return { label: 'Excellent', color: 'from-green-500 to-emerald-500', icon: CheckCircle }
    if (completionPercentage >= 70) return { label: 'Good', color: 'from-blue-500 to-cyan-500', icon: TrendingUp }
    if (completionPercentage >= 50) return { label: 'Fair', color: 'from-amber-500 to-orange-500', icon: AlertCircle }
    return { label: 'Needs Attention', color: 'from-red-500 to-rose-500', icon: AlertCircle }
  }

  const health = getHealthStatus()
  const HealthIcon = health.icon

  const metrics = [
    {
      label: 'Emotions Tagged',
      value: memoriesWithEmotions,
      total: totalMemories,
      icon: Heart,
      color: 'text-pink-400'
    },
    {
      label: 'Locations Added',
      value: memoriesWithLocations,
      total: totalMemories,
      icon: MapPin,
      color: 'text-blue-400'
    },
    {
      label: 'Dates Recorded',
      value: memoriesWithDates,
      total: totalMemories,
      icon: Calendar,
      color: 'text-green-400'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gold-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Vault Health
            </h3>
            <p className="text-xs text-pearl/60 mt-1">
              Last updated: {lastUpdated.toLocaleDateString()}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${health.color} bg-opacity-20 flex items-center gap-2`}>
            <HealthIcon className="w-5 h-5" />
            <span className="font-semibold">{health.label}</span>
          </div>
        </div>

        {/* Progress Circle */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-pearl/10"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - completionPercentage / 100)}`}
                className="text-gold-400"
                initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - completionPercentage / 100) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-bold text-gold-400">{completionPercentage}%</span>
              <span className="text-xs text-pearl/60">Complete</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const MetricIcon = metric.icon
            const percentage = Math.round((metric.value / metric.total) * 100)

            return (
              <div key={metric.label} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <MetricIcon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div className="text-2xl font-bold text-pearl mb-1">
                  {metric.value}/{metric.total}
                </div>
                <div className="text-xs text-pearl/60 mb-2">{metric.label}</div>
                <div className="glass-progress-track h-1">
                  <motion.div
                    className="glass-progress-fill h-1"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="glass-card p-6">
          <h4 className="text-md font-semibold text-gold-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Suggestions to Improve Your Vault
          </h4>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-obsidian-800/30 border border-gold-500/10"
              >
                <div className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-gold-400">{index + 1}</span>
                </div>
                <p className="text-sm text-pearl/80">{suggestion}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Metadata Alert */}
      {missingMetadataCount > 0 && (
        <div className="glass-card p-4 border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-400 mb-1">
                {missingMetadataCount} {missingMetadataCount === 1 ? 'Memory' : 'Memories'} Need Attention
              </h4>
              <p className="text-xs text-pearl/70">
                Some memories are missing important details like emotions, locations, or dates. 
                Adding this information will help preserve context for future generations.
              </p>
              <button className="mt-3 text-xs text-gold-400 hover:text-gold-300 font-medium transition-colors">
                Review Memories →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
