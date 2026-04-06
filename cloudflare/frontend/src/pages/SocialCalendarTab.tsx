/**
 * Social Calendar Tab - Admin panel for managing the Social Posting Engine
 * Shows scheduled/published/failed posts with pause/retry/skip controls
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, AlertTriangle, CheckCircle, Pause, Play, Trash2, RefreshCw, Send } from '../components/Icons';
import { socialApi } from '../services/api';

interface SocialPost {
  id: string;
  platforms: string[];
  content: { text?: string; hook?: string; videoKey?: string; hashtags?: string[] };
  scheduled_at: string;
  published_at: string | null;
  campaign_week: number;
  pillar: string;
  status: string;
  error: string | null;
  retry_count: number;
}

interface SocialStats {
  total: number;
  published: number;
  scheduled: number;
  failed: number;
  skipped: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'X/Twitter',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  threads: 'Threads',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Scheduled' },
  publishing: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Publishing' },
  published: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Published' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
  skipped: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Skipped' },
};

const PILLAR_COLORS: Record<string, string> = {
  educational: 'text-blue-300',
  emotional: 'text-pink-300',
  demo: 'text-purple-300',
  engagement: 'text-yellow-300',
  viral: 'text-green-300',
  general: 'text-paper/70',
};

export function SocialCalendarTab() {
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: stats } = useQuery({
    queryKey: ['social-stats'],
    queryFn: () => socialApi.getStats().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: calendar, isLoading } = useQuery({
    queryKey: ['social-calendar', selectedWeek, statusFilter],
    queryFn: () => socialApi.getCalendar({ week: selectedWeek, status: statusFilter }).then(r => r.data),
    refetchInterval: 30000,
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => socialApi.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['social-stats'] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => socialApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['social-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['social-stats'] });
    },
  });

  const posts: SocialPost[] = calendar?.posts || [];
  const socialStats: SocialStats = stats || { total: 0, published: 0, scheduled: 0, failed: 0, skipped: 0 };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBox label="Total Posts" value={socialStats.total} icon={<Calendar size={18} />} />
        <StatBox label="Published" value={socialStats.published} icon={<CheckCircle size={18} />} color="text-green-400" />
        <StatBox label="Scheduled" value={socialStats.scheduled} icon={<Clock size={18} />} color="text-blue-400" />
        <StatBox label="Failed" value={socialStats.failed} icon={<AlertTriangle size={18} />} color="text-red-400" />
        <StatBox label="Skipped" value={socialStats.skipped} icon={<Pause size={18} />} color="text-gray-400" />
      </div>

      {/* Filters */}
      <div className="glass p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-paper/65 text-sm">Week:</label>
          <select
            value={selectedWeek || ''}
            onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-void-2 border border-white/10 text-paper text-sm px-3 py-1.5 rounded"
          >
            <option value="">All Weeks</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Week {i + 1}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-paper/65 text-sm">Status:</label>
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="bg-void-2 border border-white/10 text-paper text-sm px-3 py-1.5 rounded"
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="glass p-8 text-center text-paper/65">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="glass p-8 text-center">
            <Send size={32} className="mx-auto mb-3 text-paper/65" />
            <p className="text-paper/65">No social posts found</p>
            <p className="text-paper/65 text-sm mt-1">Use the bulk-load API to add content for a week</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPause={() => pauseMutation.mutate(post.id)}
              onRetry={() => retryMutation.mutate(post.id)}
              onDelete={() => deleteMutation.mutate(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="glass p-4 text-center">
      <div className={`flex items-center justify-center gap-2 mb-1 ${color || 'text-gold'}`}>
        {icon}
        <span className="text-2xl font-light">{value}</span>
      </div>
      <p className="text-paper/65 text-xs">{label}</p>
    </div>
  );
}

function PostCard({ post, onPause, onRetry, onDelete }: {
  post: SocialPost;
  onPause: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.scheduled;
  const pillarColor = PILLAR_COLORS[post.pillar] || PILLAR_COLORS.general;
  const contentText = post.content?.text || post.content?.hook || 'No content';

  return (
    <div className="glass p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Status + Pillar + Week */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs rounded ${statusStyle.bg} ${statusStyle.text}`}>
              {statusStyle.label}
            </span>
            {post.pillar && (
              <span className={`text-xs ${pillarColor}`}>
                {post.pillar}
              </span>
            )}
            {post.campaign_week && (
              <span className="text-xs text-paper/70">
                Week {post.campaign_week}
              </span>
            )}
          </div>

          {/* Content preview */}
          <p className="text-paper text-sm line-clamp-2 mb-2">{contentText}</p>

          {/* Platforms */}
          <div className="flex flex-wrap gap-1 mb-2">
            {post.platforms.map((p) => (
              <span key={p} className="px-1.5 py-0.5 bg-white/5 text-paper/70 text-xs rounded">
                {PLATFORM_LABELS[p] || p}
              </span>
            ))}
          </div>

          {/* Schedule time */}
          <div className="flex items-center gap-1 text-paper/70 text-xs">
            <Clock size={12} />
            <span>
              {post.published_at
                ? `Published: ${new Date(post.published_at).toLocaleString()}`
                : `Scheduled: ${new Date(post.scheduled_at).toLocaleString()}`}
            </span>
          </div>

          {/* Error message */}
          {post.error && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
              {post.error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {post.status === 'scheduled' && (
            <button
              onClick={onPause}
              className="p-1.5 hover:bg-white/10 rounded text-paper/65 hover:text-yellow-400 transition-colors"
              title="Skip this post"
            >
              <Pause size={16} />
            </button>
          )}
          {(post.status === 'failed' || post.status === 'skipped') && (
            <button
              onClick={onRetry}
              className="p-1.5 hover:bg-white/10 rounded text-paper/65 hover:text-blue-400 transition-colors"
              title="Retry / Reschedule"
            >
              <RefreshCw size={16} />
            </button>
          )}
          {post.status !== 'published' && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-white/10 rounded text-paper/65 hover:text-red-400 transition-colors"
              title="Delete post"
            >
              <Trash2 size={16} />
            </button>
          )}
          {post.status === 'published' && (
            <span className="p-1.5 text-green-400">
              <Play size={16} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialCalendarTab;
