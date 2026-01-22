import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.heirloom.blue/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Announcement {
  id: string;
  title: string;
  summary: string;
  body: string;
  feature_type: string;
  icon: string;
  cta_text: string | null;
  cta_link: string | null;
  created_at: string;
}

export function WhatsNewNotification() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['announcements', 'unread'],
    queryFn: async () => {
      const response = await api.get('/api/announcements/unread');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const dismissMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      await api.post(`/api/announcements/${announcementId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'unread'] });
    },
  });

  const viewMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      await api.post(`/api/announcements/${announcementId}/view`);
    },
  });

  const announcements: Announcement[] = data?.announcements || [];

  useEffect(() => {
    if (announcements.length > 0 && !isOpen) {
      setIsOpen(true);
      viewMutation.mutate(announcements[0].id);
    }
  }, [announcements.length]);

  const handleDismiss = () => {
    if (announcements[currentIndex]) {
      dismissMutation.mutate(announcements[currentIndex].id);
    }
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      viewMutation.mutate(announcements[currentIndex + 1].id);
    } else {
      setIsOpen(false);
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      viewMutation.mutate(announcements[currentIndex + 1].id);
    } else {
      setIsOpen(false);
      setCurrentIndex(0);
    }
  };

  if (isLoading || announcements.length === 0 || !isOpen) {
    return null;
  }

  const announcement = announcements[currentIndex];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-gold/30 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
        
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-cream/60 hover:text-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gold/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-gold" />
            </div>
            <span className="text-gold text-sm font-semibold tracking-wide uppercase">
              What's New
            </span>
            {announcements.length > 1 && (
              <span className="ml-auto text-cream/40 text-sm">
                {currentIndex + 1} of {announcements.length}
              </span>
            )}
          </div>

          <h2 className="text-2xl font-serif text-cream mb-4">
            {announcement.title}
          </h2>

          <p className="text-cream/70 mb-6 leading-relaxed">
            {announcement.summary}
          </p>

          <div 
            className="text-cream/60 text-sm mb-6 leading-relaxed prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.body }}
          />

          <div className="flex items-center gap-4">
            {announcement.cta_link && announcement.cta_text && (
              <a
                href={announcement.cta_link}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gold text-midnight font-semibold rounded-lg hover:bg-gold/90 transition-colors"
              >
                {announcement.cta_text}
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 border border-cream/20 text-cream rounded-lg hover:bg-cream/5 transition-colors"
            >
              {currentIndex < announcements.length - 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>

        {announcements.length > 1 && (
          <div className="flex justify-center gap-2 pb-6">
            {announcements.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gold' : 'bg-cream/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
