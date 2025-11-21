'use client'

import React from 'react'
import { cn } from '../../lib/utils'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12'
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  className,
  padding = 'md'
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br from-charcoal/60 via-charcoal/50 to-obsidian/60',
        'backdrop-blur-2xl',
        'border border-gold/20',
        'shadow-2xl shadow-obsidian/80',
        paddingClasses[padding],
        className
      )}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
      </div>
      
      {/* Radial gold gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
