import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { ProgressHair } from '../components/ui/ProgressHair';
import { capsulesApi, threadsApi } from '../services/api';

type CapsuleStatus = 'open' | 'sealed' | 'unlocked';

/** Quiet banner linking to the thread compose flow when a thread exists. */
function ThreadComposeBanner() {
  const { data } = useQuery({
    queryKey: ['threads', 'list'],
    queryFn: () => threadsApi.list().then((r) => r.data).catch(() => null),
  });
  const featured = data?.threads?.[0];
  if (!featured) return null;
  return (
    <div
      style={{
        marginBottom: 32,
        border: '1px solid var(--loom-rule-warm)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div>
        <p className="loom-eyebrow" style={{ color: 'var(--loom-warm)', marginBottom: 6 }}>
          Now part of your family thread
        </p>
        <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
          Time-locked entries are now first-class on the thread. New writes go there alongside everything else;
          existing capsules keep working below.
        </p>
      </div>
      <Link
        to={`/threads/${featured.id}/compose`}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--loom-warm)',
          textDecoration: 'none',
          flexShrink: 0,
          alignSelf: 'center',
        }}
      >
        Write a locked entry →
      </Link>
    </div>
  );
}

interface Capsule {
  id: string;
  title: string;
  description: string;
  unlock_date: string;
  sealed_at: string | null;
  opened_at: string | null;
  cover_style: string;
  contributor_count: number;
  item_count: number;
  created_at: string;
}

function CapsuleRow({ capsule, onClick, isSelected }: { capsule: Capsule; onClick: () => void; isSelected?: boolean }) {
  const status: CapsuleStatus = capsule.opened_at ? 'unlocked' : capsule.sealed_at ? 'sealed' : 'open';
  const unlockDate = new Date(capsule.unlock_date);
  const daysUntilUnlock = Math.ceil((unlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const canOpen = status === 'sealed' && daysUntilUnlock <= 0;

  const statusColor = status === 'sealed' ? 'var(--loom-warm)' : 'var(--loom-bone-faint)';

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '100%',
          background: isSelected ? 'rgba(176,122,74,0.04)' : 'transparent',
          border: 0,
          borderBottom: '1px solid var(--loom-rule)',
          padding: '24px 0',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'grid',
          gridTemplateColumns: '160px 1fr auto',
          gap: 28,
          alignItems: 'baseline',
          transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Left rail — status */}
        <div>
          <p
            className="loom-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: statusColor,
              margin: 0,
            }}
          >
            {status === 'unlocked' ? '∞ opened' : status === 'sealed' ? '∞ sealed' : 'open'}
          </p>
          <p
            className="loom-mono"
            style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: '6px 0 0', letterSpacing: '0.06em' }}
          >
            {unlockDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Title + description */}
        <div>
          <h3
            className="loom-serif"
            style={{
              fontSize: 20,
              fontWeight: 300,
              color: 'var(--loom-bone)',
              margin: '0 0 6px',
              lineHeight: 1.25,
            }}
          >
            {capsule.title}
          </h3>
          {capsule.description && (
            <p
              className="loom-body"
              style={{
                fontSize: 14,
                color: 'var(--loom-bone-dim)',
                margin: '0 0 8px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {capsule.description}
            </p>
          )}
          <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: 0, letterSpacing: '0.06em' }}>
            {capsule.contributor_count} contributors · {capsule.item_count} items
          </p>
        </div>

        {/* Right — open state badge */}
        {canOpen && (
          <span
            className="loom-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--loom-warm)',
              border: '1px solid var(--loom-rule-warm)',
              padding: '4px 10px',
              flexShrink: 0,
            }}
          >
            Ready to open
          </span>
        )}
        {!canOpen && status === 'sealed' && daysUntilUnlock > 0 && (
          <span
            className="loom-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.16em',
              color: 'var(--loom-bone-faint)',
              flexShrink: 0,
            }}
          >
            {daysUntilUnlock}d
          </span>
        )}
      </button>
    </li>
  );
}

const COVER_STYLES = [
  { id: 'classic', label: 'Classic Gold' },
  { id: 'midnight', label: 'Midnight Blue' },
  { id: 'rose', label: 'Rose Garden' },
  { id: 'emerald', label: 'Emerald' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  padding: '10px 14px',
  color: 'var(--loom-bone)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 15,
  lineHeight: 1.7,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
};

export function TimeCapsule() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<string | null>(null);
  const [newCapsule, setNewCapsule] = useState({
    title: '',
    description: '',
    unlock_date: '',
    cover_style: 'classic',
  });

  const { data: capsules, isLoading } = useQuery({
    queryKey: ['capsules'],
    queryFn: () => capsulesApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newCapsule) => capsulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capsules'] });
      setShowCreateModal(false);
      setNewCapsule({ title: '', description: '', unlock_date: '', cover_style: 'classic' });
    },
  });

  return (
    <AppFrame>
      <ThreadComposeBanner />

      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 40,
        }}
      >
        <div>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Time Capsules</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            Sealed against time.
          </h1>
          <p
            className="loom-body"
            style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 540, lineHeight: 1.6 }}
          >
            Seal memories today; open them when the time is right. The cloth remembers.
          </p>
        </div>
        <button type="button" onClick={() => setShowCreateModal(true)} className="loom-btn">
          New capsule
        </button>
      </header>

      {/* Capsule list */}
      {isLoading ? (
        <div style={{ padding: '64px 0', display: 'flex', justifyContent: 'center' }}>
          <ProgressHair label="loading…" width={200} />
        </div>
      ) : !capsules?.length ? (
        <div style={{ border: '1px solid var(--loom-rule)', padding: '72px 36px', textAlign: 'center' }}>
          <p className="loom-eyebrow" style={{ marginBottom: 16 }}>No capsules yet</p>
          <h3 className="loom-serif" style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 16px' }}>
            The best time to seal a memory was years ago.
          </h3>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-dim)', margin: '0 auto 28px', maxWidth: 400 }}>
            Create your first time capsule and fill it with memories, messages, and photos.
          </p>
          <button type="button" onClick={() => setShowCreateModal(true)} className="loom-btn">
            Create time capsule
          </button>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {capsules.map((capsule: Capsule) => (
            <CapsuleRow
              key={capsule.id}
              capsule={capsule}
              isSelected={selectedCapsule === capsule.id}
              onClick={() => setSelectedCapsule(capsule.id)}
            />
          ))}
        </ul>
      )}

      {/* Create overlay */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(14,14,12,0.82)',
            padding: 24,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'var(--loom-ink)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
              <h2 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, margin: 0 }}>
                Create Time Capsule
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: 'var(--loom-bone-faint)',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Capsule name</label>
                <input
                  type="text"
                  value={newCapsule.title}
                  onChange={(e) => setNewCapsule((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Family Christmas 2025"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Description (optional)</label>
                <textarea
                  value={newCapsule.description}
                  onChange={(e) => setNewCapsule((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="A collection of memories from this special year…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Unlock date</label>
                <input
                  type="date"
                  value={newCapsule.unlock_date}
                  onChange={(e) => setNewCapsule((prev) => ({ ...prev, unlock_date: e.target.value }))}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
                />
              </div>

              <div>
                <label className="loom-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Cover style</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {COVER_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setNewCapsule((prev) => ({ ...prev, cover_style: style.id }))}
                      style={{
                        background: newCapsule.cover_style === style.id ? 'rgba(176,122,74,0.06)' : 'transparent',
                        border: `1px solid ${newCapsule.cover_style === style.id ? 'var(--loom-rule-warm)' : 'var(--loom-rule)'}`,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      <span
                        className="loom-serif"
                        style={{
                          fontSize: 14,
                          fontWeight: 300,
                          color: newCapsule.cover_style === style.id ? 'var(--loom-warm)' : 'var(--loom-bone)',
                        }}
                      >
                        {style.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28 }}>
              <button type="button" onClick={() => setShowCreateModal(false)} className="loom-btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createMutation.mutate(newCapsule)}
                disabled={!newCapsule.title || !newCapsule.unlock_date || createMutation.isPending}
                className="loom-btn"
                style={{ opacity: !newCapsule.title || !newCapsule.unlock_date || createMutation.isPending ? 0.45 : 1 }}
              >
                {createMutation.isPending ? (
                  <span style={{ fontStyle: 'italic' }}>Creating…</span>
                ) : (
                  'Create capsule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppFrame>
  );
}

export default TimeCapsule;
