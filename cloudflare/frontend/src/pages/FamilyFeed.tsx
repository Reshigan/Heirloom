// FamilyFeed page
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProgressHair } from '../components/ui/ProgressHair';
import { Navigation } from '../components/Navigation';
import { engagementApi } from '../services/api';

interface FeedItem {
  id: string;
  type: 'memory' | 'voice' | 'letter';
  title: string;
  preview: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  reactions: number;
}

export function FamilyFeed() {
  const navigate = useNavigate();

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['family-feed'],
    queryFn: () => engagementApi.getFamilyFeed().then((r) => r.data),
  });

  const items: FeedItem[] = feedData?.items || [];

  const typeKinds: Record<string, string> = {
    memory: 'Memory',
    voice: 'Voice',
    letter: 'Letter',
  };

  const typeLabels: Record<string, string> = {
    memory: 'shared a memory',
    voice: 'recorded a message',
    letter: 'wrote a letter',
  };

  return (
    <div className="min-h-screen bg-void text-paper">
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-32 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-body font-light text-3xl md:text-4xl text-paper mb-2 tracking-[-0.014em]">Family Feed</h1>
          <p className="text-paper-65">New entries from across your family thread</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <ProgressHair label="loading…" width={180} />
          </div>
        ) : !items.length ? (
          <div className="text-center py-16 px-6">
            <div className="text-4xl text-gold mb-6" aria-hidden>∞</div>
            <h3 className="font-body font-light text-2xl text-paper mb-2">Your family feed is quiet</h3>
            <p className="text-paper-70 max-w-md mx-auto leading-relaxed">
              When other members of your family thread add entries — memories, recordings, letters — they'll surface here. Invite them to start writing.
            </p>
            <button
              onClick={() => navigate('/family')}
              className="btn btn-primary mt-8"
            >
              Invite Family <span aria-hidden>→</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              return (
                <div
                  key={item.id}
                  className="bg-void-surface border border-paper-15 p-5 animate-fade-in"
                >
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-[2px] border border-gold-40 flex items-center justify-center text-gold text-xs font-medium">
                      {item.author_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <span className="text-paper text-sm font-medium">{item.author_name}</span>
                      <span className="text-paper-65 text-sm"> {typeLabels[item.type]}</span>
                    </div>
                    <span className="ml-auto text-paper-65 text-xs">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <div className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-gold pt-1.5 w-12 flex-shrink-0">
                      {typeKinds[item.type] || 'Memory'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-paper font-body text-lg mb-1">{item.title}</p>
                      {item.preview && (
                        <p className="text-paper-70 text-sm line-clamp-2">{item.preview}</p>
                      )}
                    </div>
                  </div>

                  {/* Reactions */}
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-paper-15">
                    <button className="flex items-center gap-1.5 text-paper-65 hover:text-gold text-xs transition-colors" aria-label="React">
                      <span aria-hidden>♡</span>
                      {item.reactions > 0 && item.reactions}
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

export default FamilyFeed;
