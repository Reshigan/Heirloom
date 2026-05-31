import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../components/ui/ProgressHair';
import { Navigation } from '../components/Navigation';
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

  const typeLabels: Record<string, string> = {
    memory: 'Memory',
    voice: 'Voice',
    letter: 'Letter',
  };

  return (
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-32 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">On This Day</p>
          <h1 className="font-body font-light text-3xl md:text-4xl text-paper mb-2 tracking-[-0.014em]">On This Day</h1>
          <p className="text-paper-65 font-body text-lg">{dateStr}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <ProgressHair label="loading…" width={180} />
          </div>
        ) : !memories.length ? (
          <div className="border border-paper-15 bg-void-surface p-10 text-center">
            <h3 className="font-body font-light text-2xl text-paper mb-2 tracking-[-0.014em]">No memories on this day yet</h3>
            <p className="text-paper-65 max-w-prose mx-auto leading-relaxed">
              As your thread accumulates over the years, entries written on this date in earlier years will surface here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {memories.map((memory) => {
              return (
                <div
                  key={memory.id}
                  className="bg-void-surface border border-paper-15 p-6 animate-fade-in"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gold font-body text-sm">
                      {memory.years_ago === 1 ? '1 year ago' : `${memory.years_ago} years ago`}
                    </span>
                    <span className="text-paper-30">&middot;</span>
                    <span className="text-paper-65 text-sm">
                      {new Date(memory.created_at).toLocaleDateString('en-US', { year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {memory.thumbnail_url ? (
                      <img
                        src={memory.thumbnail_url}
                        alt=""
                        className="w-20 h-20 rounded-[2px] object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-[2px] bg-void border border-paper-15 flex items-center justify-center flex-shrink-0">
                        <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-paper-50">{typeLabels[memory.type] || 'Entry'}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body text-xl text-paper mb-1">{memory.title}</h3>
                      {memory.preview && (
                        <p className="text-paper-70 text-sm line-clamp-3">{memory.preview}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-4 pt-3 border-t border-paper-15">
                    <button className="text-paper-65 hover:text-gold text-xs transition-colors">
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
