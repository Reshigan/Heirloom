
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, Heart, Sparkles, TrendingUp, Filter, Grid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

interface MemoryTimelineProps {
  memories: Memory[];
  onMemorySelect: (memory: Memory) => void;
  onFilterChange: (filter: { year?: number; month?: number; emotion?: string }) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MemoryTimeline({ memories, onMemorySelect, onFilterChange }: MemoryTimelineProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'grid'>('timeline');
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return memories.length > 0 
      ? new Date(memories[0].createdAt).getFullYear()
      : new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Get timeline statistics
  const stats = useMemo(() => {
    const totalMemories = memories.length;
    const photos = memories.filter(m => m.type === 'PHOTO').length;
    const videos = memories.filter(m => m.type === 'VIDEO').length;
    const sharedMemories = memories.filter(m => m.recipients.length > 0).length;
    
    // Get most active month
    const monthCounts: Record<number, number> = {};
    memories.forEach(memory => {
      const month = new Date(memory.createdAt).getMonth();
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    
    const mostActiveMonth = Object.keys(monthCounts).length > 0 
      ? MONTHS[parseInt(Object.entries(monthCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0])]
      : 'None';

    return {
      totalMemories,
      photos,
      videos,
      sharedMemories,
      mostActiveMonth,
      memoryPerMonth: totalMemories > 0 ? Math.round(totalMemories / Object.keys(monthCounts).length) : 0
    };
  }, [memories]);

  // Group memories by year and month
  const timelineData = useMemo(() => {
    const grouped: Record<number, Record<number, Memory[]>> = {};
    
    memories.forEach(memory => {
      const date = new Date(memory.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(memory);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([year, months]) => ({
        year: parseInt(year),
        months: Object.entries(months)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([month, memories]) => ({
            month: parseInt(month),
            monthName: MONTHS[parseInt(month)],
            memories,
            count: memories.length
          }))
      }));
  }, [memories]);

  // Filter memories based on selected year and month
  const filteredMemories = useMemo(() => {
    if (!selectedMonth && memories.length > 0) {
      return memories.filter(m => new Date(m.createdAt).getFullYear() === selectedYear);
    }
    return memories.filter(m => 
      new Date(m.createdAt).getFullYear() === selectedYear && 
      new Date(m.createdAt).getMonth() === selectedMonth
    );
  }, [memories, selectedYear, selectedMonth]);

  const availableYears = useMemo(() => {
    const years = new Set(memories.map(m => new Date(m.createdAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [memories]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    onFilterChange({ year });
  };

  const handleMonthChange = (month: number | null) => {
    setSelectedMonth(month);
    onFilterChange({ year: selectedYear, month: month || undefined });
  };

  if (memories.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={48} className="text-paper/20 mx-auto mb-4" />
        <h3 className="text-xl text-paper/50 mb-2">{t('timeline.noMemories') || 'No memories yet'}</h3>
        <p className="text-paper/30">{t('timeline.startAdding') || 'Start adding memories to see your timeline'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 rounded-xl text-center"
        >
          <Calendar size={20} className="text-gold mx-auto mb-2" />
          <div className="text-2xl font-light">{stats.totalMemories}</div>
          <div className="text-paper/50 text-sm">{t('timeline.totalMemories') || 'Total Memories'}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 rounded-xl text-center"
        >
          <Users size={20} className="text-gold mx-auto mb-2" />
          <div className="text-2xl font-light">{stats.sharedMemories}</div>
          <div className="text-paper/50 text-sm">{t('timeline.sharedMemories') || 'Shared Memories'}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-4 rounded-xl text-center"
        >
          <Sparkles size={20} className="text-gold mx-auto mb-2" />
          <div className="text-2xl font-light">{stats.mostActiveMonth}</div>
          <div className="text-paper/50 text-sm">{t('timeline.mostActive') || 'Most Active Month'}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-4 rounded-xl text-center"
        >
          <TrendingUp size={20} className="text-gold mx-auto mb-2" />
          <div className="text-2xl font-light">{stats.memoryPerMonth}</div>
          <div className="text-paper/50 text-sm">{t('timeline.avgPerMonth') || 'Avg/Month'}</div>
        </motion.div>
      </div>

      {/* View Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center gap-2"
      >
        {['timeline', 'calendar', 'grid'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-4 py-2 rounded-full transition-all ${
              viewMode === mode ? 'bg-gold text-void' : 'glass text-paper/60 hover:text-paper'
            }`}
          >
            {mode === 'timeline' && <Clock size={16} className="inline mr-2" />}
            {mode === 'calendar' && <Calendar size={16} className="inline mr-2" />}
            {mode === 'grid' && <Grid size={16} className="inline mr-2" />}
            {t(`timeline.${mode}`) || mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
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
              handleYearChange(availableYears[idx + 1]);
            }
          }}
          disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
          className="p-3 glass rounded-full text-paper/50 hover:text-gold disabled:opacity-30"
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
              handleYearChange(availableYears[idx - 1]);
            }
          }}
          disabled={availableYears.indexOf(selectedYear) === 0}
          className="p-3 glass rounded-full text-paper/50 hover:text-gold disabled:opacity-30"
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
          onClick={() => handleMonthChange(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedMonth === null ? 'bg-gold text-void' : 'glass text-paper/60 hover:text-paper'
          }`}
        >
          {t('timeline.allMonths') || 'All Months'}
        </button>
        {MONTHS.map((month, index) => {
          const monthMemories = memories.filter(m => 
            new Date(m.createdAt).getFullYear() === selectedYear && 
            new Date(m.createdAt).getMonth() === index
          );
          
          return (
            <button
              key={month}
              onClick={() => handleMonthChange(selectedMonth === index ? null : index)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all relative ${
                selectedMonth === index ? 'bg-gold text-void' : 'glass text-paper/60 hover:text-paper'
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

      {/* Timeline Visualization */}
      <AnimatePresence mode="wait">
        {viewMode === 'timeline' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gold/20 h-full z-0" />
            
            <div className="space-y-8 relative z-10">
              {timelineData
                .filter(yearData => yearData.year === selectedYear)
                .flatMap(yearData => yearData.months)
                .map((monthData, index) => (
                  <motion.div
                    key={`${monthData.month}`}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
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
                    </div>
                    
                    {/* Month card */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`flex-1 glass p-6 rounded-xl cursor-pointer ${
                        selectedMonth === monthData.month ? 'ring-2 ring-gold/50' : ''
                      }`}
                      onClick={() => handleMonthChange(monthData.month)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-light">{monthData.monthName}</h3>
                        <span className="text-gold font-medium">{monthData.count} memories</span>
                      </div>
                      
                      {/* Memory preview grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {monthData.memories.slice(0, 3).map((memory, idx) => (
                          <div key={memory.id} className="aspect-square rounded-lg overflow-hidden bg-void-light">
                            {memory.fileUrl ? (
                              <img
                                src={memory.fileUrl}
                                alt={memory.title}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => onMemorySelect(memory)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-paper/30 text-sm">
                                  {memory.type === 'VIDEO' ? 'Video' : 'Photo'}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                        {monthData.count > 3 && (
                          <div className="aspect-square rounded-lg glass flex items-center justify-center">
                            <span className="text-paper/40 text-sm">+{monthData.count - 3} more</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid View */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {filteredMemories.map((memory, index) => (
              <motion.button
                key={memory.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onMemorySelect(memory)}
                className="aspect-square rounded-xl overflow-hidden glass group relative"
              >
                {memory.fileUrl ? (
                  <img
                    src={memory.fileUrl}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-paper/30">{memory.type}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-void/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="text-paper text-sm truncate">{memory.title}</div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
