// FamilyFeed page
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Image, Mic, Pen, Heart, Clock, Users } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { EmptyState } from '../components/EmptyState';
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

  const typeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    memory: Image,
    voice: Mic,
    letter: Pen,
  };

  const typeLabels: Record<string, string> = {
    memory: 'shared a memory',
    voice: 'recorded a message',
    letter: 'wrote a letter',
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
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-paper mb-2">Family Feed</h1>
          <p className="text-paper/50 font-serif">See what your family has been preserving</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="text-gold animate-spin" />
          </div>
        ) : !items.length ? (
          <EmptyState
            icon={Users}
            title="Your family feed is quiet"
            subtitle="When your family members add memories, voice recordings, or letters, they'll appear here. Invite your family to start building your legacy together."
            actionLabel="Invite Family"
            onAction={() => navigate('/family')}
          />
        ) : (
          <div className="space-y-4">
            {items.map((item, i) => {
              const Icon = typeIcons[item.type] || Image;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl border border-paper/10 p-5"
                >
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/40 to-gold-dim/40 flex items-center justify-center text-void-abyss text-xs font-medium">
                      {item.author_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <span className="text-paper/80 text-sm font-medium">{item.author_name}</span>
                      <span className="text-paper/30 text-sm"> {typeLabels[item.type]}</span>
                    </div>
                    <span className="ml-auto text-paper/30 text-xs flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-gold/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-paper font-serif text-lg mb-1">{item.title}</p>
                      {item.preview && (
                        <p className="text-paper/40 text-sm line-clamp-2">{item.preview}</p>
                      )}
                    </div>
                  </div>

                  {/* Reactions */}
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-paper/5">
                    <button className="flex items-center gap-1.5 text-paper/30 hover:text-blood text-xs transition-colors">
                      <Heart size={14} />
                      {item.reactions > 0 && item.reactions}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default FamilyFeed;
