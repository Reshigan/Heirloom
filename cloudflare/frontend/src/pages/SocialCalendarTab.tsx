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

const STATUS_TOKENS: Record<string, { border: string; color: string; label: string }> = {
  scheduled: { border: 'var(--rule)', color: 'var(--bone-dim)', label: 'Scheduled' },
  publishing: { border: 'var(--rule-warm)', color: 'var(--warm)', label: 'Publishing' },
  published:  { border: 'var(--rule-warm)', color: 'var(--warm)', label: 'Published' },
  failed:     { border: 'rgba(194,90,90,0.35)', color: '#c25a5a', label: 'Failed' },
  skipped:    { border: 'var(--rule)', color: 'var(--bone-faint)', label: 'Skipped' },
};

const selectStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--rule)',
  color: 'var(--bone)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.04em',
  padding: '6px 10px',
  outline: 'none',
  borderRadius: 0,
  cursor: 'pointer',
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
    <div style={{ color: 'var(--bone)' }}>
      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, marginBottom: 32 }}>
        <StatCell label="Total" value={socialStats.total} />
        <StatCell label="Published" value={socialStats.published} warm />
        <StatCell label="Scheduled" value={socialStats.scheduled} />
        <StatCell label="Failed" value={socialStats.failed} error />
        <StatCell label="Skipped" value={socialStats.skipped} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>Week</span>
          <select
            value={selectedWeek || ''}
            onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : undefined)}
            style={selectStyle}
          >
            <option value="">All</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Week {i + 1}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>Status</span>
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            style={selectStyle}
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Posts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {isLoading ? (
          <div style={{ padding: '40px 0' }}>
            <ProgressHair label="Loading posts…" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ border: '1px solid var(--rule)', padding: '48px 24px', textAlign: 'center' }}>
            <p className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)', marginBottom: 6 }}>No posts found.</p>
            <p className="loom-mono" style={{ fontSize: 11, color: 'var(--bone-faint)' }}>Use the bulk-load API to add content for a week.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostRow
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

/* ── StatCell ───────────────────────────────────────────────────── */
function StatCell({ label, value, warm, error }: { label: string; value: number; warm?: boolean; error?: boolean }) {
  const valColor = error ? '#c25a5a' : warm ? 'var(--warm)' : 'var(--bone)';
  return (
    <div style={{ border: '1px solid var(--rule)', padding: '20px 16px', textAlign: 'center' }}>
      <div className="loom-mono" style={{ fontSize: 28, fontWeight: 300, color: valColor, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div className="loom-eyebrow" style={{ fontSize: 9 }}>{label}</div>
    </div>
  );
}

/* ── PostRow ────────────────────────────────────────────────────── */
function PostRow({ post, onPause, onRetry, onDelete }: {
  post: SocialPost;
  onPause: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const tok = STATUS_TOKENS[post.status] || STATUS_TOKENS.scheduled;
  const contentText = post.content?.text || post.content?.hook || 'No content';

  return (
    <div style={{ border: '1px solid var(--rule)', padding: '16px 20px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Status / pillar / week */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="loom-mono" style={{ fontSize: 10, padding: '2px 7px', border: `1px solid ${tok.border}`, color: tok.color }}>
            {tok.label}
          </span>
          {post.pillar && (
            <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>{post.pillar}</span>
          )}
          {post.campaign_week && (
            <span className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>Week {post.campaign_week}</span>
          )}
        </div>

        {/* Content preview */}
        <p style={{ color: 'var(--bone)', fontSize: 14, lineHeight: 1.6, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {contentText}
        </p>

        {/* Platforms */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {post.platforms.map((p) => (
            <span key={p} className="loom-mono" style={{ fontSize: 9, padding: '2px 6px', border: '1px solid var(--rule)', color: 'var(--bone-faint)' }}>
              {PLATFORM_LABELS[p] || p}
            </span>
          ))}
        </div>

        {/* Schedule time */}
        <div className="loom-mono" style={{ fontSize: 10, color: 'var(--bone-faint)' }}>
          {post.published_at
            ? `Published ${new Date(post.published_at).toLocaleString()}`
            : `Scheduled ${new Date(post.scheduled_at).toLocaleString()}`}
        </div>

        {/* Error */}
        {post.error && (
          <div className="loom-mono" style={{ marginTop: 8, padding: '8px 10px', border: '1px solid rgba(194,90,90,0.35)', color: '#c25a5a', fontSize: 11 }}>
            {post.error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        {post.status === 'scheduled' && (
          <button
            onClick={onPause}
            aria-label="Skip this post"
            className="loom-btn-ghost"
            style={{ fontSize: 10, padding: '4px 10px' }}
          >
            Skip
          </button>
        )}
        {(post.status === 'failed' || post.status === 'skipped') && (
          <button
            onClick={onRetry}
            aria-label="Retry or reschedule post"
            className="loom-btn-ghost"
            style={{ fontSize: 10, padding: '4px 10px' }}
          >
            Retry
          </button>
        )}
        {post.status !== 'published' && (
          <button
            onClick={onDelete}
            aria-label="Delete post"
            style={{ background: 'none', border: 'none', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.04em', color: 'var(--bone-faint)', cursor: 'pointer', padding: '4px 10px', transition: 'color 180ms var(--loom-ease)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c25a5a')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
          >
            Delete
          </button>
        )}
        {post.status === 'published' && (
          <span className="loom-mono" style={{ fontSize: 10, color: 'var(--warm)', padding: '4px 10px' }}>Live</span>
        )}
      </div>
    </div>
  );
}

export default SocialCalendarTab;
