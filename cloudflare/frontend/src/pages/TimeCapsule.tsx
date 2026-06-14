import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
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
        borderBottom: '1px solid var(--rule)',
        paddingBottom: 24,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div>
        <p
          className="hl-eyebrow"
          style={{ color: 'var(--warm)', marginBottom: 6 }}
        >
          Now part of your family thread
        </p>
        <p
          className="hl-prose"
          style={{
            fontSize: 14,
            color: 'var(--bone-dim)',
            margin: 0,
            maxWidth: 520,
            lineHeight: 1.6,
          }}
        >
          Time-locked entries are now first-class on the thread. New writes go
          there alongside everything else; existing capsules keep working below.
        </p>
      </div>
      <Link
        to={`/threads/${featured.id}/compose`}
        className="hl-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--warm)',
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

function formatUnlockDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function CapsuleRow({
  capsule,
  onClick,
  isSelected,
}: {
  capsule: Capsule;
  onClick: () => void;
  isSelected?: boolean;
}) {
  const status: CapsuleStatus = capsule.opened_at
    ? 'unlocked'
    : capsule.sealed_at
    ? 'sealed'
    : 'open';

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '100%',
          background: isSelected ? 'rgba(176,122,74,0.04)' : 'transparent',
          border: 0,
          borderBottom: '1px solid var(--rule)',
          padding: '22px 0',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'grid',
          gridTemplateColumns: '10px 1fr',
          gap: 16,
          alignItems: 'baseline',
          transition: 'background 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Left — dye square */}
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            background: 'var(--warm)',
            display: 'block',
            flexShrink: 0,
            transform: 'translateY(4px)',
          }}
        />

        {/* Title + meta */}
        <div style={{ minWidth: 0 }}>
          <p
            className="hl-serif"
            style={{
              fontSize: 'var(--type-subhead)',
              fontWeight: 300,
              color: 'var(--bone)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {capsule.title}
          </p>
          <span
            className="hl-mono"
            style={{
              display: 'block',
              marginTop: 6,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: status === 'unlocked' ? 'var(--bone-faint)' : 'var(--warm)',
            }}
          >
            {status === 'unlocked'
              ? 'unlocked'
              : `unlocks ${formatUnlockDate(capsule.unlock_date)}`}
          </span>
          {capsule.description && (
            <p
              className="hl-serif hl-italic"
              style={{
                fontSize: 13,
                color: 'var(--bone-dim)',
                margin: '6px 0 0',
                lineHeight: 1.5,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {capsule.description}
            </p>
          )}
        </div>
      </button>
    </>
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
  border: '1px solid var(--rule)',
  borderRadius: 2,
  padding: '10px 14px',
  color: 'var(--bone)',
  fontFamily: 'var(--serif)',
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
  const [createError, setCreateError] = useState<string | null>(null);
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
      setCreateError(null);
      setNewCapsule({
        title: '',
        description: '',
        unlock_date: '',
        cover_style: 'classic',
      });
    },
    onError: (e: any) => setCreateError(e?.response?.data?.error ?? 'could not create capsule'),
  });

  const backLink = (
    <Link
      to="/loom/index"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        color: 'var(--bone-faint)',
        textDecoration: 'none',
        textTransform: 'uppercase',
      }}
    >
      ← heirloom
    </Link>
  );

  return (
    <ClothShell topbarLeft={backLink} topbarCenter="time capsules">
      <div
        style={{
          maxWidth: 'var(--page-max-prose)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        <ThreadComposeBanner />

        {/* Header */}
        <header style={{ marginBottom: 48, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <h1
            className="hl-serif hl-tight"
            style={{
              fontSize: 'var(--type-display)',
              fontWeight: 300,
              color: 'var(--bone)',
              margin: '0 0 28px',
            }}
          >
            Entries sealed for the future.
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--bone-faint)',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid var(--rule)',
              cursor: 'pointer',
              paddingBottom: 2,
              flexShrink: 0,
              alignSelf: 'flex-start',
            }}
          >
            create capsule →
          </button>
        </header>

        {/* Capsule list */}
        {isLoading ? (
          <div
            style={{
              borderBottom: '1px solid var(--rule)',
              paddingBottom: 32,
            }}
          >
            <div
              style={{
                height: 1,
                background: 'var(--warm)',
                width: 120,
                opacity: 0.4,
              }}
            />
          </div>
        ) : !capsules?.length ? (
          <div style={{ paddingTop: 40 }}>
            <p
              className="hl-serif hl-italic"
              style={{
                fontSize: 17,
                fontWeight: 300,
                color: 'var(--bone-dim)',
                margin: '0 0 32px',
                lineHeight: 1.5,
              }}
            >
              Nothing sealed yet. The cloth is waiting.
            </p>
            <Link to="/compose" className="hl-btn">
              seal a note →
            </Link>
          </div>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px' }}>
              {capsules.map((capsule: Capsule) => (
                <li key={capsule.id}>
                  <CapsuleRow
                    capsule={capsule}
                    isSelected={selectedCapsule === capsule.id}
                    onClick={() =>
                      setSelectedCapsule(selectedCapsule === capsule.id ? null : capsule.id)
                    }
                  />
                  {selectedCapsule === capsule.id && (
                    <div
                      style={{
                        padding: '14px 0 20px 26px',
                        borderBottom: '1px solid var(--rule)',
                        marginTop: -1,
                      }}
                    >
                      {capsule.description && (
                        <p
                          className="hl-serif hl-italic"
                          style={{
                            fontSize: 14,
                            color: 'var(--bone-dim)',
                            margin: '0 0 12px',
                            lineHeight: 1.6,
                          }}
                        >
                          {capsule.description}
                        </p>
                      )}
                      <Link
                        to={`/compose?capsuleId=${capsule.id}`}
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 9,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: 'var(--warm)',
                          textDecoration: 'none',
                        }}
                      >
                        seal a note →
                      </Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Link to="/compose" className="hl-btn">
              seal a note →
            </Link>
          </>
        )}
      </div>

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
            className="cosmic-panel cosmic-panel--solid"
            style={{
              width: '100%',
              maxWidth: 520,
              padding: 40,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 28,
              }}
            >
              <h2
                className="hl-serif"
                style={{ fontSize: 22, fontWeight: 300, margin: 0, color: 'var(--bone)' }}
              >
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
                  color: 'var(--bone-faint)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  lineHeight: 1,
                  padding: 4,
                }}
              >
                close
              </button>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              <div>
                <label
                  className="hl-eyebrow"
                  style={{ display: 'block', marginBottom: 10 }}
                >
                  Capsule name
                </label>
                <input
                  type="text"
                  value={newCapsule.title}
                  onChange={(e) =>
                    setNewCapsule((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Family Christmas 2025"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  className="hl-eyebrow"
                  style={{ display: 'block', marginBottom: 10 }}
                >
                  Description (optional)
                </label>
                <textarea
                  value={newCapsule.description}
                  onChange={(e) =>
                    setNewCapsule((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="A collection of memories from this special year…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <div>
                <label
                  className="hl-eyebrow"
                  style={{ display: 'block', marginBottom: 10 }}
                >
                  Unlock date
                </label>
                <input
                  type="date"
                  value={newCapsule.unlock_date}
                  onChange={(e) =>
                    setNewCapsule((prev) => ({
                      ...prev,
                      unlock_date: e.target.value,
                    }))
                  }
                  min={
                    new Date(Date.now() + 86400000).toISOString().split('T')[0]
                  }
                  style={{
                    ...inputStyle,
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                  }}
                />
              </div>

              <div>
                <label
                  className="hl-eyebrow"
                  style={{ display: 'block', marginBottom: 12 }}
                >
                  Cover style
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                  }}
                >
                  {COVER_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        setNewCapsule((prev) => ({
                          ...prev,
                          cover_style: style.id,
                        }))
                      }
                      style={{
                        background:
                          newCapsule.cover_style === style.id
                            ? 'rgba(176,122,74,0.06)'
                            : 'transparent',
                        border: `1px solid ${
                          newCapsule.cover_style === style.id
                            ? 'var(--warm)'
                            : 'var(--rule)'
                        }`,
                        borderRadius: 0,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition:
                          'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      <span
                        className="hl-serif"
                        style={{
                          fontSize: 14,
                          fontWeight: 300,
                          color:
                            newCapsule.cover_style === style.id
                              ? 'var(--warm)'
                              : 'var(--bone)',
                        }}
                      >
                        {style.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {createError && (
              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--danger)', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '16px 0 0' }}>
                {createError}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 28,
              }}
            >
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="hl-btn"
                style={{
                  background: 'transparent',
                  color: 'var(--bone-dim)',
                  border: '1px solid var(--rule)',
                }}
              >
                cancel
              </button>
              <button
                type="button"
                onClick={() => createMutation.mutate(newCapsule)}
                disabled={
                  !newCapsule.title ||
                  !newCapsule.unlock_date ||
                  createMutation.isPending
                }
                className="hl-btn"
                style={{
                  opacity:
                    !newCapsule.title ||
                    !newCapsule.unlock_date ||
                    createMutation.isPending
                      ? 0.45
                      : 1,
                }}
              >
                {createMutation.isPending ? (
                  <span style={{ fontStyle: 'italic' }}>creating…</span>
                ) : (
                  'create capsule'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ClothShell>
  );
}

export default TimeCapsule;
