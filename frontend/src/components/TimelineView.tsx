
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, Sparkles, Trophy, Leaf, Users, Clock, TrendingUp } from 'lucide-react';

type Memory = {
  id: string;
  title: string;
  description?: string;
  type: 'PHOTO' | 'VIDEO';
  fileUrl?: string;
  emotion?: string;
  recipients: { familyMember: { id: string; name: string } }[];
  createdAt: string;
};

interface TimelineViewProps {
  memories: Memory[];
  selectedYear: number;
  selectedMonth: number | null;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number | null) => void;
  viewMode: 'timeline' | 'calendar' | 'grid';
  onViewModeChange: (mode: 'timeline' | 'calendar' | 'grid') => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function TimelineView({
  memories,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  viewMode,
  onViewModeChange
}: TimelineViewProps) {
  
  // Get timeline stats
  const timelineStats = useMemo(() => {
    const stats = {
      totalMemories: memories.length,
      photos: memories.filter(m => m.type === 'PHOTO').length,
      videos: memories.filter(m => m.type === 'VIDEO').length,
      sharedMemories: memories.filter(m => m.recipients.length > 0).length,
      monthsWithMemories: new Set(memories.map(m => new Date(m.createdAt).getMonth())).size,
      mostActiveMonth: '',
      memoryPerMonth: 0
    };

    // Calculate most active month
    const monthCounts: Record<number, number> = {};
    memories.forEach(memory => {
      const month = new Date(memory.createdAt).getMonth();
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    
    if (Object.keys(monthCounts).length > 0) {
      const maxMonth = Object.entries(monthCounts).reduce((a, b) => 
        a[1] > b[1] ? a : b
      );
      stats.mostActiveMonth = MONTHS[parseInt(maxMonth[0])];
      stats.memoryPerMonth = Math.round(stats.totalMemories / Object.keys(monthCounts).length);
    }

    return stats;
  }, [memories]);

  // Group memories by month for timeline visualization
  const timelineData = useMemo(() => {
    const grouped: Record<string, Memory[]> = {};
    
    memories.forEach(memory => {
      const date = new Date(memory.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(memory);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, memories]) => {
        const [year, month] = key.split('-');
        return {
          year: parseInt(year),
          month: parseInt(month),
          monthName: MONTHS[parseInt(month)],
          memories,
          memoryCount: memories.length
        };
      });
  }, [memories]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set(memories.map(m => new Date(m.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [memories]);

  if (memories.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="text-paper/20 mx-auto mb-4" />
        <h3 className="text-xl text-paper/50 mb-2">No memories yet</h3>
        <p className="text-paper/30">Start adding memories to see your timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Timeline Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="glass p-4 rounded-xl text-center">
          <Calendar size={20} className="text-gold mx-auto mb-2" />
          <div className="text-2xl font-light">{timelineStats.totalMemories}</div>
          <div className="text-paper/50 text-sm">Total Memories</div>
        </div>
        
        <div className="glass p-4 rounded-xl text-center">
          <Users size={20} className="text-gold mx-auto mb-2" />
          <div className="text-2xl font-light">{timelineStats.sharedMemories}</div>
          <div className="text-paper/50 text-sm">Shared Memories</div>
        </div>
        
        <div className="glass p-4 rounded-xl text-center">
          <Sparkles size={20} className="text-gold mx-auto mb-2" />
          <div className="text-2xl font-light">{timelineStats.mostActiveMonth || 'N/A'}</div>
          <div className="text-paper/50 text-sm">Most Active Month</div>
        </div>
        
        <div className="glass p-4 rounded-xl text-center">
          <TrendingUp size={20} className="text-gold mx-auto mb-2" />
          <div className="text-2xl font-light">{timelineStats.memoryPerMonth}</div>
          <div className="text-paper/50 text-sm">Avg/Month</div>
        </div>
      </motion.div>

      {/* Year Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center gap-4"
      >
        <button
          onClick={() => {
            const idx = availableYears.indexOf(selectedYear);
            if (idx < availableYears.length - 1) {
              onYearChange(availableYears[idx + 1]);
              onMonthChange(null);
            }
          }}
          disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
          className="p-3 glass rounded-full text-paper/50 hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-gold" />
          <span className="text-3xl font-light text-gold">{selectedYear}</span>
        </div>
        
        <button
          onClick={() => {
            const idx = availableYears.indexOf(selectedYear);
            if (idx > 0) {
              onYearChange(availableYears[idx - 1]);
              onMonthChange(null);
            }
          }}
          disabled={availableYears.indexOf(selectedYear) === 0}
          className="p-3 glass rounded-full text-paper/50 hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </motion.div>

      {/* Month Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap justify-center gap-2"
      >
        <button
          onClick={() => onMonthChange(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedMonth === null
              ? 'bg-gold text-void'
              : 'glass text-paper/60 hover:text-paper hover:bg-white/10'
          }`}
        >
          All Months
        </button>
        {MONTHS.map((month, index) => {
          const monthMemories = memories.filter(m => 
            new Date(m.createdAt).getFullYear() === selectedYear && 
            new Date(m.createdAt).getMonth() === index
          );
          
          return (
            <button
              key={month}
              onClick={() => onMonthChange(selectedMonth === index ? null : index)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all relative ${
                selectedMonth === index
                  ? 'bg-gold text-void'
                  : 'glass text-paper/60 hover:text-paper hover:bg-white/10'
              }`}
            >
              {month}
              {monthMemories.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center ${
                  selectedMonth === index ? 'bg-void text-gold' : 'bg-gold text-void'
                }`}>
                  {monthMemories.length}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Visual Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative"
      >
        {/* Timeline line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gold/20 h-full z-0" />
        
        <div className="space-y-8 relative z-10">
          {timelineData
            .filter(monthData => monthData.year === selectedYear)
            .map((monthData, index) => (
              <motion.div
                key={`${monthData.year}-${monthData.month}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-8 ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Timeline node */}
                <div className="relative">
                  <div className={`w-4 h-4 rounded-full ${
                    selectedMonth === monthData.month ? 'bg-gold ring-4 ring-gold/20' : 'bg-gold/50'
                  }`} />
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-4 h-4 rounded-full bg-gold/20" />
                  </div>
                </div>
                
                {/* Month card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex-1 glass p-6 rounded-xl cursor-pointer ${
                    selectedMonth === monthData.month ? 'ring-2 ring-gold/50' : ''
                  }`}
                  onClick={() => onMonthChange(monthData.month)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-light">{monthData.monthName} {monthData.year}</h3>
                    <span className="text-gold font-medium">{monthData.memoryCount} memories</span>
                  </div>
                  
                  {/* Memory preview grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {monthData.memories.slice(0, 3).map((memory, idx) => (
                      <div key={memory.id} className="aspect-square rounded-lg overflow-hidden bg-void-light">
                        {memory.fileUrl ? (
                          <img
                            src={memory.fileUrl}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {memory.type === 'VIDEO' ? (
                              <span className="text-paper/30 text-sm">Video</span>
                            ) : (
                              <span className="text-paper/30 text-sm">Photo</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {monthData.memoryCount > 3 && (
                      <div className="aspect-square rounded-lg glass flex items-center justify-center">
                        <span className="text-paper/40 text-sm">+{monthData.memoryCount - 3} more</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
        </div>
      </motion.div>

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center gap-4"
      >
        <button
          onClick={() => onViewModeChange('timeline')}
          className={`px-4 py-2 rounded-full transition-all ${
            viewMode === 'timeline' ? 'bg-gold text-void' : 'glass text-paper/60 hover:text-gaper'
          }`}
        >
          Timeline View
        </button>
        <button
          onClick={() => onViewModeChange('calendar')}
          className={`px-4 py-2 rounded-full transition-all ${
            viewMode === 'calendar' ? 'bg-gold text-void' : 'glass text-paper/60 hover:text-paper'
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => onViewModeChange('grid')}
          className={`px-4 py-2 rounded-full transition-all ${
            viewMode === 'grid' ? 'bg-gold text-void' : 'glass text-paper/60 hover:text-paper'
          }`}
        >
          Grid View
        </button>
      </motion.div>
    </div>
  );
}
