/**
 * ProgressRing Component
 * Circular progress indicator for completion tracking
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showPercentage?: boolean;
  label?: string;
  color?: 'gold' | 'success' | 'warning' | 'error' | 'info';
  animated?: boolean;
}

const sizeConfig = {
  sm: { size: 40, fontSize: 'text-xs', strokeWidth: 3 },
  md: { size: 64, fontSize: 'text-sm', strokeWidth: 4 },
  lg: { size: 96, fontSize: 'text-lg', strokeWidth: 5 },
  xl: { size: 128, fontSize: 'text-xl', strokeWidth: 6 },
};

const colorConfig = {
  gold: { stroke: '#c9a959', bg: 'rgba(201, 169, 89, 0.1)' },
  success: { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  warning: { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  error: { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  info: { stroke: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 'md',
  strokeWidth: customStrokeWidth,
  showPercentage = true,
  label,
  color = 'gold',
  animated = true,
}) => {
  const config = sizeConfig[size];
  const colors = colorConfig[color];
  const strokeWidth = customStrokeWidth || config.strokeWidth;
  
  const radius = (config.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke={colors.bg}
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset: offset }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        
        {/* Center content */}
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className={`font-display text-paper ${config.fontSize}`}
              initial={animated ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Math.round(progress)}%
            </motion.span>
          </div>
        )}
      </div>
      
      {label && (
        <span className="text-paper/60 text-sm">{label}</span>
      )}
    </div>
  );
};

/**
 * ProgressRingGroup - Display multiple progress rings
 */
interface ProgressRingGroupProps {
  items: Array<{
    progress: number;
    label: string;
    color?: 'gold' | 'success' | 'warning' | 'error' | 'info';
  }>;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressRingGroup: React.FC<ProgressRingGroupProps> = ({
  items,
  size = 'sm',
}) => {
  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {items.map((item, index) => (
        <ProgressRing
          key={index}
          progress={item.progress}
          label={item.label}
          color={item.color}
          size={size}
        />
      ))}
    </div>
  );
};

export default ProgressRing;
