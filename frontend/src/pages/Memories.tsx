import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Image, Mic, Pen, Play, Upload } from 'lucide-react';
import { memoriesApi, familyApi } from '../services/api';
import { format } from 'date-fns';

type FilterType = 'ALL' | 'PHOTO' | 'VOICE' | 'LETTER';

export function Memories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [recipientFilter, setRecipientFilter] = useState<string | null>(null);
  
  const { data: memoriesData } = useQuery({
    queryKey: ['memories', filter, recipientFilter],
    queryFn: () => memoriesApi.getAll({
      type: filter === 'ALL' ? undefined : filter,
      recipientId: recipientFilter || undefined,
    }).then(r => r.data),
  });
  
  const { data: stats } = useQuery({
    queryKey: ['memories-stats'],
    queryFn: () => memoriesApi.getStats().then(r => r.data),
  });
  
  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });
  
  // Group memories by year
  const memoriesByYear = memoriesData?.memories?.reduce((acc: any, memory: any) => {
    const year = new Date(memory.createdAt).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(memory);
    return acc;
  }, {}) || {};
  
  const years = Object.keys(memoriesByYear).sort((a, b) => Number(b) - Number(a));
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PHOTO': return Image;
      case 'VOICE': return Mic;
      case 'LETTER': return Pen;
      default: return Image;
    }
  };
  
  return (
    <div className="min-h-screen px-6 md:px-12 py-12">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8">
        <ArrowLeft size={20} />
        Back to Vault
      </button>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-light">Your Memories</h1>
            <p className="text-paper/50 mt-1">{stats?.totalMemories || 0} total memories</p>
          </div>
          
          <button
            onClick={() => {/* TODO: Open upload modal */}}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Memory
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-12">
          {(['ALL', 'PHOTO', 'VOICE', 'LETTER'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 text-sm border transition-all ${
                filter === type
                  ? 'border-gold text-gold'
                  : 'border-white/10 text-paper/40 hover:border-gold/30'
              }`}
            >
              {type === 'ALL' ? 'All' : type === 'PHOTO' ? 'Photos' : type === 'VOICE' ? 'Voice' : 'Letters'}
            </button>
          ))}
          
          <div className="h-8 w-px bg-white/10 mx-2" />
          
          {family?.slice(0, 4).map((member: any) => (
            <button
              key={member.id}
              onClick={() => setRecipientFilter(recipientFilter === member.id ? null : member.id)}
              className={`px-4 py-2 text-sm border transition-all ${
                recipientFilter === member.id
                  ? 'border-gold text-gold'
                  : 'border-white/10 text-paper/40 hover:border-gold/30'
              }`}
            >
              For {member.name}
            </button>
          ))}
        </div>
        
        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/50 to-transparent" />
          
          {years.map((year) => (
            <div key={year} className="mb-16">
              {/* Year marker */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                  <div className="w-2 h-2 bg-void rounded-full" />
                </div>
                <h2 className="text-2xl text-gold">{year}</h2>
              </div>
              
              {/* Memories grid */}
              <div className="ml-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memoriesByYear[year].map((memory: any, i: number) => {
                  const Icon = getTypeIcon(memory.type);
                  
                  return (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="card group cursor-pointer hover:border-gold/30"
                      onClick={() => {/* TODO: Open detail modal */}}
                    >
                      {/* Preview */}
                      <div className="h-40 bg-void-light mb-4 rounded relative overflow-hidden">
                        {memory.type === 'PHOTO' && (
                          <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-blood/10" />
                        )}
                        {memory.type === 'VOICE' && (
                          <div className="absolute inset-0 flex items-center justify-center gap-1">
                            {[...Array(8)].map((_, j) => (
                              <motion.div
                                key={j}
                                className="w-1 bg-gold/30"
                                animate={{ height: [20, 40, 20] }}
                                transition={{ duration: 1, repeat: Infinity, delay: j * 0.1 }}
                              />
                            ))}
                          </div>
                        )}
                        {memory.type === 'LETTER' && (
                          <div className="absolute inset-4 bg-paper/10 p-3 font-handwritten text-paper/40 text-sm overflow-hidden">
                            {memory.description || 'A heartfelt letter...'}
                          </div>
                        )}
                        
                        <div className="absolute top-2 right-2 w-8 h-8 bg-void/50 rounded-full flex items-center justify-center">
                          <Icon size={14} className="text-gold" />
                        </div>
                      </div>
                      
                      {/* Info */}
                      <h3 className="text-paper group-hover:text-gold transition-colors">{memory.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-paper/40 text-sm">
                          {format(new Date(memory.createdAt), 'MMM d, yyyy')}
                        </span>
                        {memory.recipients?.length > 0 && (
                          <div className="flex -space-x-2">
                            {memory.recipients.slice(0, 3).map((r: any) => (
                              <div
                                key={r.id}
                                className="w-6 h-6 rounded-full bg-gold/20 border border-void flex items-center justify-center text-xs text-gold"
                              >
                                {r.name[0]}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Empty state */}
          {years.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mx-auto mb-6">
                <Image size={32} className="text-paper/20" />
              </div>
              <h3 className="text-xl mb-2">No memories yet</h3>
              <p className="text-paper/50 mb-6">Start preserving your most precious moments</p>
              <button className="btn btn-primary">Add Your First Memory</button>
            </div>
          )}
        </div>
      </div>
      
      {/* FAB */}
      <motion.button
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center shadow-lg shadow-gold/20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus size={24} className="text-void" />
      </motion.button>
    </div>
  );
}
