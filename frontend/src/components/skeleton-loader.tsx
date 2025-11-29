import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gradient-to-r from-obsidian-800/50 via-gold-500/10 to-obsidian-800/50'
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  )
}

export const MemoryCardSkeleton: React.FC = () => (
  <div className="bg-obsidian-900/50 border border-gold-500/20 rounded-lg p-4 space-y-3">
    <Skeleton variant="rectangular" height={200} className="w-full" />
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="60%" />
    <div className="flex gap-2">
      <Skeleton variant="text" width={80} />
      <Skeleton variant="text" width={100} />
    </div>
  </div>
)

export const TimelineItemSkeleton: React.FC = () => (
  <div className="flex gap-4 p-4 bg-obsidian-900/50 border border-gold-500/20 rounded-lg">
    <Skeleton variant="circular" width={60} height={60} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="40%" />
    </div>
  </div>
)

export const NotificationSkeleton: React.FC = () => (
  <div className="flex items-start gap-3 p-3 border-b border-gold-500/10">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="30%" />
    </div>
  </div>
)

export const SearchResultSkeleton: React.FC = () => (
  <div className="p-4 border-b border-gold-500/10 space-y-2">
    <div className="flex items-center gap-3">
      <Skeleton variant="rectangular" width={80} height={80} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="50%" />
      </div>
    </div>
  </div>
)
