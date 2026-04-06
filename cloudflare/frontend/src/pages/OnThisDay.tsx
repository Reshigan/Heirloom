import { useQuery } from '@tanstack/react-query';
import { Loader2, Image, Mic, Pen, Calendar, Heart } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { EmptyState } from '../components/EmptyState';
import { engagementApi } from '../services/api';

interface OnThisDayMemory {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  preview: string;
  thumbnail_url?: string;
  created_at: string;
  years_ago: number;
}

export function OnThisDay() {

  const { data, isLoading } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: () => engagementApi.getOnThisDay().then((r) => r.data),
  });

  const memories: OnThisDayMemory[] = data?.memories || [];
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const typeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    memory: Image,
    voice: Mic,
    letter: Pen,
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-32 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
            <Calendar size={28} className="text-gold" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-paper mb-2">On This Day</h1>
          <p className="text-paper/65 font-serif text-lg">{dateStr}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="text-gold animate-spin" />
          </div>
        ) : !memories.length ? (
          <EmptyState
            icon={Calendar}
            title="No memories on this day yet"
            subtitle="As you build your legacy over time, you'll see your memories from previous years appear here on the same date."
          />
        ) : (
          <div className="space-y-6">
            {memories.map((memory) => {
              const Icon = typeIcons[memory.type] || Image;
              return (
                <div
                  key={memory.id}
                  className="glass rounded-2xl border border-paper/10 p-6 animate-fade-in"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gold font-serif text-sm">
                      {memory.years_ago === 1 ? '1 year ago' : `${memory.years_ago} years ago`}
                    </span>
                    <span className="text-paper/20">&middot;</span>
                    <span className="text-paper/65 text-sm">
                      {new Date(memory.created_at).toLocaleDateString('en-US', { year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {memory.thumbnail_url ? (
                      <img
                        src={memory.thumbnail_url}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={24} className="text-gold/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-xl text-paper mb-1">{memory.title}</h3>
                      {memory.preview && (
                        <p className="text-paper/70 text-sm line-clamp-3">{memory.preview}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-4 pt-3 border-t border-paper/5">
                    <button className="flex items-center gap-1.5 text-paper/65 hover:text-blood text-xs transition-colors">
                      <Heart size={14} />
                      Remember
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default OnThisDay;
