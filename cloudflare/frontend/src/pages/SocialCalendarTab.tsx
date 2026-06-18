/**
 * Social Calendar Tab - Admin panel for managing the Social Posting Engine
 * Shows scheduled/published/failed posts with pause/retry/skip controls.
 * Re-skinned as a LEDGER: a CosmicHeader stating the stats, each post a
 * hairline-ruled entry row, controls as quiet mono text affordances, WaxSeal foot.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../services/api';
import { ProgressHair } from '../loom/components/ProgressHair';
import { CosmicHeader, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';

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

interface StatusToken { color: string; label: string }
interface StatusTokenMap {
  scheduled: StatusToken;
  publishing: StatusToken;
  published: StatusToken;
  failed: StatusToken;
  skipped: StatusToken;
}

// Status reads as mono signal text — warm for active states, bone-dim/faint
// for quiet ones. A failed post is warm (the ONE accent), never red.
const STATUS_TOKENS: StatusTokenMap = {
  scheduled: { color: 'var(--bone-dim)', label: 'Scheduled' },
  publishing: { color: 'var(--warm)', label: 'Publishing' },
  published:  { color: 'var(--warm)', label: 'Published' },
  failed:     { color: 'var(--warm)', label: 'Failed' },
  skipped:    { color: 'var(--bone-faint)', label: 'Skipped' },
};

const selectStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--rule)',
  color: 'var(--bone)',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.04em',
  padding: '6px 10px',
  outline: 'none',
  borderRadius: 0,
  cursor: 'pointer',
};

const filterLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
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

  // Mono eyebrow states the ledger at a glance.
  const eyebrow =
    `${socialStats.total} POSTS · ${socialStats.published} PUBLISHED · ` +
    `${socialStats.scheduled} SCHEDULED · ${socialStats.failed} FAILED · ${socialStats.skipped} SKIPPED`;

  return (
    <div style={{ color: 'var(--bone)' }}>
      <CosmicHeader eyebrow={eyebrow} title="The Posting Engine" />

      {/* Filter control bar — quiet mono */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="social-calendar-week" style={filterLabelStyle}>Week</label>
          <select
            id="social-calendar-week"
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
          <label htmlFor="social-calendar-status" style={filterLabelStyle}>Status</label>
          <select
            id="social-calendar-status"
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

      <SectionLabel>The Calendar</SectionLabel>

      {/* Posts ledger */}
      <div style={{ borderTop: '1px solid var(--rule)' }}>
        {isLoading ? (
          <div style={{ padding: '40px 0' }}>
            <ProgressHair label="Loading posts…" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--bone-dim)', margin: '0 0 10px' }}>
              No posts found.
            </p>
            <p style={filterLabelStyle}>Use the bulk-load API to add content for a week.</p>
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

      <div style={{ marginTop: 56 }}>
        <WaxSeal />
      </div>
    </div>
  );
}

/* ── RowAction — quiet mono text affordance (never an icon button) ── */
function RowAction({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const base = danger ? 'var(--bone-faint)' : 'var(--bone-dim)';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'none',
        border: 'none',
        padding: '2px 4px',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: base,
        cursor: 'pointer',
        transition: 'color 180ms var(--ease)',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--warm)')}
      onMouseLeave={e => (e.currentTarget.style.color = base)}
    >
      {label}
    </button>
  );
}

/* ── PostRow — a ledger entry: serif content left, mono meta + actions right ── */
function PostRow({ post, onPause, onRetry, onDelete }: {
  post: SocialPost;
  onPause: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const statusKey = post.status as keyof StatusTokenMap;
  const tok = (statusKey in STATUS_TOKENS ? STATUS_TOKENS[statusKey] : undefined) || STATUS_TOKENS.scheduled;
  const contentText = post.content?.text || post.content?.hook || 'No content';
  const platformLine = post.platforms.map((p) => PLATFORM_LABELS[p] || p).join(' · ');
  const scheduleLine = post.published_at
    ? `Published ${new Date(post.published_at).toLocaleString()}`
    : `Scheduled ${new Date(post.scheduled_at).toLocaleString()}`;

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        alignItems: 'baseline',
        padding: '18px 0',
        borderBottom: '1px solid var(--rule)',
        flexWrap: 'wrap',
      }}
    >
      {/* Left — serif content title + mono sub-meta */}
      <div style={{ flex: 1, minWidth: 240 }}>
        <p
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 19,
            fontWeight: 400,
            lineHeight: 1.35,
            color: 'var(--bone)',
            margin: '0 0 8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {contentText}
        </p>

        {/* Platforms + schedule as a quiet mono meta line */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--bone-faint)', lineHeight: 1.7 }}>
          {platformLine && <span>{platformLine}</span>}
          {platformLine && <span style={{ opacity: 0.5 }}>{'  ·  '}</span>}
          <span>{scheduleLine}</span>
        </div>

        {/* Error — inline mono, warm (never red) */}
        {post.error && (
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.04em',
              color: 'var(--warm)',
              marginTop: 8,
              paddingLeft: 12,
              borderLeft: '1px solid var(--rule-warm)',
              lineHeight: 1.5,
            }}
          >
            {post.error}
          </div>
        )}
      </div>

      {/* Right — mono cluster: pillar/week meta, status, then actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flex: '0 0 auto', textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {post.pillar && <span style={{ color: 'var(--bone-faint)' }}>{post.pillar}</span>}
          {post.campaign_week ? <span style={{ color: 'var(--bone-faint)' }}>Week {post.campaign_week}</span> : null}
          <span style={{ color: tok.color }}>{tok.label}</span>
        </div>

        {/* Action affordances */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          {post.status === 'scheduled' && (
            <RowAction label="Skip" onClick={onPause} />
          )}
          {(post.status === 'failed' || post.status === 'skipped') && (
            <RowAction label="Retry" onClick={onRetry} />
          )}
          {post.status !== 'published' && (
            <RowAction label="Delete" onClick={onDelete} danger />
          )}
          {post.status === 'published' && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--warm)' }}>Live</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialCalendarTab;
