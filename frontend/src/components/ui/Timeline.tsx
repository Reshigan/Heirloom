/**
 * Timeline Component
 * Chronological memory display with visual timeline
 */

import React from 'react';
import { motion } from 'framer-motion';

interface TimelineItem {
  id: string;
  date: Date | string;
  title: string;
  description?: string;
  type?: 'memory' | 'letter' | 'voice' | 'milestone';
  thumbnail?: string;
  onClick?: () => void;
}

interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  showYearMarkers?: boolean;
}

const typeColors = {
  memory: 'bg-gold',
  letter: 'bg-blood',
  voice: 'bg-sanctuary-teal',
  milestone: 'bg-emerald-500',
};

const typeIcons = {
  memory: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  letter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  voice: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
    </svg>
  ),
  milestone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getYear = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getFullYear();
};

export const Timeline: React.FC<TimelineProps> = ({
  items,
  orientation = 'vertical',
  showYearMarkers = true,
}) => {
  // Sort items by date
  const sortedItems = [...items].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
    const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
    return dateB.getTime() - dateA.getTime();
  });

  // Group by year for year markers
  let currentYear: number | null = null;

  if (orientation === 'horizontal') {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max px-4">
          {sortedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              {/* Date */}
              <span className="text-paper/50 text-xs mb-2">{formatDate(item.date)}</span>
              
              {/* Node */}
              <div
                className={`w-10 h-10 rounded-full ${typeColors[item.type || 'memory']} flex items-center justify-center text-void cursor-pointer hover:scale-110 transition-transform min-h-[44px] min-w-[44px]`}
                onClick={item.onClick}
              >
                {typeIcons[item.type || 'memory']}
              </div>
              
              {/* Connector line */}
              {index < sortedItems.length - 1 && (
                <div className="w-16 h-0.5 bg-glass-border mt-5 -mb-5" />
              )}
              
              {/* Title */}
              <span className="text-paper text-sm mt-2 max-w-[120px] text-center truncate">
                {item.title}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-glass-border" />

      {sortedItems.map((item, index) => {
        const itemYear = getYear(item.date);
        const showYearMarker = showYearMarkers && itemYear !== currentYear;
        currentYear = itemYear;

        return (
          <React.Fragment key={item.id}>
            {/* Year marker */}
            {showYearMarker && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 mb-4"
              >
                <div className="w-10 h-10 rounded-full bg-void-light border border-gold/30 flex items-center justify-center">
                  <span className="text-gold text-sm font-display">{itemYear}</span>
                </div>
              </motion.div>
            )}

            {/* Timeline item */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 mb-6 group"
            >
              {/* Node */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full ${typeColors[item.type || 'memory']} flex items-center justify-center text-void cursor-pointer group-hover:scale-110 transition-transform min-h-[44px] min-w-[44px]`}
                onClick={item.onClick}
              >
                {typeIcons[item.type || 'memory']}
              </div>

              {/* Content */}
              <div
                className="flex-1 p-4 bg-glass-bg backdrop-blur-glass rounded-xl border border-glass-border group-hover:border-gold/20 transition-colors cursor-pointer"
                onClick={item.onClick}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-paper font-medium truncate">{item.title}</h4>
                    {item.description && (
                      <p className="text-paper/60 text-sm mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <span className="text-paper/40 text-xs mt-2 block">{formatDate(item.date)}</span>
                  </div>
                  
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Timeline;
