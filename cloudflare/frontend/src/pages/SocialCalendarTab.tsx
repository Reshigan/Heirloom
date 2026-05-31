/**
 * Social Calendar Tab - Admin panel for managing the Social Posting Engine
 * Shows scheduled/published/failed posts with pause/retry/skip controls
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../services/api';
import { ProgressHair } from '../components/ui/ProgressHair';

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

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  scheduled: { className: 'border-paper-15 text-paper-70', label: 'Scheduled' },
  publishing: { className: 'border-gold-40 text-gold', label: 'Publishing' },
  published: { className: 'border-gold-40 text-gold', label: 'Published' },
  failed: { className: 'border-blood text-blood', label: 'Failed' },
  skipped: { className: 'border-paper-15 text-paper-50', label: 'Skipped' },
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
        <StatBox label="Total Posts" value={socialStats.total} />
        <StatBox label="Published" value={socialStats.published} accent />
        <StatBox label="Scheduled" value={socialStats.scheduled} />
        <StatBox label="Failed" value={socialStats.failed} error />
        <StatBox label="Skipped" value={socialStats.skipped} />
      </div>

      {/* Filters */}
      <div className="bg-void-surface border border-paper-15 rounded-[2px] p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-paper-65 text-sm">Week:</label>
          <select
            value={selectedWeek || ''}
            onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-void-elevated border border-paper-15 text-paper text-sm px-3 py-1.5 rounded-[2px] focus:border-gold focus:outline-none"
          >
            <option value="">All Weeks</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Week {i + 1}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-paper-65 text-sm">Status:</label>
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="bg-void-elevated border border-paper-15 text-paper text-sm px-3 py-1.5 rounded-[2px] focus:border-gold focus:outline-none"
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
          <div className="bg-void-surface border border-paper-15 rounded-[2px] p-8">
            <ProgressHair label="Loading posts…" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-void-surface border border-paper-15 rounded-[2px] p-8 text-center">
            <p className="text-paper-65">No social posts found</p>
            <p className="text-paper-50 text-sm mt-1">Use the bulk-load API to add content for a week</p>
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

function StatBox({ label, value, accent, error }: { label: string; value: number; accent?: boolean; error?: boolean }) {
  const valueColor = error ? 'text-blood' : accent ? 'text-gold' : 'text-paper';
  return (
    <div className="bg-void-surface border border-paper-15 rounded-[2px] p-4 text-center">
      <div className={`font-mono text-2xl font-light mb-1 ${valueColor}`}>{value}</div>
      <p className="text-paper-65 text-xs">{label}</p>
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
  const contentText = post.content?.text || post.content?.hook || 'No content';

  return (
    <div className="bg-void-surface border border-paper-15 rounded-[2px] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Status + Pillar + Week */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs border rounded-[2px] ${statusStyle.className}`}>
              {statusStyle.label}
            </span>
            {post.pillar && (
              <span className="text-xs text-paper-50">
                {post.pillar}
              </span>
            )}
            {post.campaign_week && (
              <span className="text-xs text-paper-50">
                Week {post.campaign_week}
              </span>
            )}
          </div>

          {/* Content preview */}
          <p className="text-paper text-sm line-clamp-2 mb-2">{contentText}</p>

          {/* Platforms */}
          <div className="flex flex-wrap gap-1 mb-2">
            {post.platforms.map((p) => (
              <span key={p} className="px-1.5 py-0.5 border border-paper-15 text-paper-70 text-xs rounded-[2px]">
                {PLATFORM_LABELS[p] || p}
              </span>
            ))}
          </div>

          {/* Schedule time */}
          <div className="text-paper-70 text-xs font-mono">
            {post.published_at
              ? `Published: ${new Date(post.published_at).toLocaleString()}`
              : `Scheduled: ${new Date(post.scheduled_at).toLocaleString()}`}
          </div>

          {/* Error message */}
          {post.error && (
            <div className="mt-2 p-2 border border-blood/40 rounded-[2px] text-blood text-xs">
              {post.error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {post.status === 'scheduled' && (
            <button
              onClick={onPause}
              className="px-2 py-1 text-xs text-paper-65 hover:text-gold transition-colors"
              title="Skip this post"
              aria-label="Skip this post"
            >
              Skip
            </button>
          )}
          {(post.status === 'failed' || post.status === 'skipped') && (
            <button
              onClick={onRetry}
              className="px-2 py-1 text-xs text-paper-65 hover:text-gold transition-colors"
              title="Retry / Reschedule"
              aria-label="Retry or reschedule post"
            >
              Retry
            </button>
          )}
          {post.status !== 'published' && (
            <button
              onClick={onDelete}
              className="px-2 py-1 text-xs text-paper-65 hover:text-blood transition-colors"
              title="Delete post"
              aria-label="Delete post"
            >
              Delete
            </button>
          )}
          {post.status === 'published' && (
            <span className="px-2 py-1 text-xs text-gold" aria-label="Published">Live</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialCalendarTab;
