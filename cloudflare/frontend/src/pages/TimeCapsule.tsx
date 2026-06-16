import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, SectionLabel, WarmDot, WaxSeal } from '../loom/cosmic/CosmicUI';
import { capsulesApi, threadsApi } from '../services/api';

type CapsuleStatus = 'open' | 'sealed' | 'unlocked';

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

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
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        background: isSelected ? 'rgba(176,122,74,0.04)' : 'transparent',
        border: 0,
        borderBottom: '1px solid var(--rule)',
        padding: '24px 0',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 24,
        alignItems: 'baseline',
        transition: `background 180ms ${EASE}`,
      }}
    >
      {/* Serif title + warm dye dot */}
      <span
        className="hl-serif"
        style={{
          fontSize: 'var(--type-subhead)',
          fontWeight: 300,
          color: 'var(--bone)',
          lineHeight: 1.3,
          minWidth: 0,
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {capsule.title}
        </span>
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 0,
            background: status === 'unlocked' ? 'var(--bone-faint)' : 'var(--warm)',
            display: 'inline-block',
            flexShrink: 0,
            transform: 'translateY(-2px)',
          }}
        />
      </span>

      {/* Mono unseal date — right aligned */}
      <span
        className="hl-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textAlign: 'right',
          color: status === 'unlocked' ? 'var(--bone-faint)' : 'var(--bone-dim)',
        }}
      >
        {status === 'unlocked' ? 'unlocked' : formatUnlockDate(capsule.unlock_date)}
      </span>
    </button>
  );
}

const COVER_STYLES = [
  { id: 'classic', label: 'Classic Gold' },
  { id: 'midnight', label: 'Midnight Blue' },
  { id: 'rose', label: 'Rose Garden' },
  { id: 'emerald', label: 'Emerald' },
];

/** The lock types from the mockup. Each resolves to a concrete unlock_date the API accepts. */
type LockType = 'date' | 'eighteen' | 'generation' | 'gone';

const LOCK_TYPES: { id: LockType; label: string; descriptor: string }[] = [
  { id: 'date', label: 'On a date', descriptor: 'Select a specific time and day.' },
  { id: 'eighteen', label: 'When they turn 18', descriptor: 'Automatic unlocking on birthday.' },
  { id: 'generation', label: 'A future generation', descriptor: 'Set a long-term reveal.' },
  { id: 'gone', label: 'After I am gone', descriptor: 'Release upon my passing.' },
];

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
}

/** Resolve a chosen lock type (+ explicit date / age) into the unlock_date string. */
function resolveUnlockDate(lock: LockType, dateValue: string, ageValue: string): string {
  switch (lock) {
    case 'date':
      return dateValue;
    case 'eighteen': {
      // years until the named person turns 18, from their current age
      const age = Number(ageValue);
      if (!Number.isFinite(age) || age < 0 || age >= 18) return '';
      return isoDaysFromNow(Math.round((18 - age) * 365.25));
    }
    case 'generation':
      return isoDaysFromNow(Math.round(25 * 365.25)); // a generation hence
    case 'gone':
      return isoDaysFromNow(Math.round(60 * 365.25)); // a lifetime horizon
    default:
      return '';
  }
}

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
  transition: `border-color 180ms ${EASE}`,
};

export function TimeCapsule() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [lockType, setLockType] = useState<LockType>('date');
  const [turnAge, setTurnAge] = useState('');
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
      setLockType('date');
      setTurnAge('');
      setNewCapsule({
        title: '',
        description: '',
        unlock_date: '',
        cover_style: 'classic',
      });
    },
    onError: (e: any) => setCreateError(e?.response?.data?.error ?? 'could not create capsule'),
  });

  const resolvedUnlock = resolveUnlockDate(lockType, newCapsule.unlock_date, turnAge);
  const canSeal = Boolean(newCapsule.title) && Boolean(resolvedUnlock) && !createMutation.isPending;

  function handleSeal() {
    if (!canSeal) return;
    createMutation.mutate({ ...newCapsule, unlock_date: resolvedUnlock });
  }

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

        {/* Ceremony header — glowing ∞ + eyebrow + big serif title */}
        <header style={{ marginBottom: 64 }}>
          <div
            aria-hidden
            style={{
              color: 'var(--warm)',
              fontSize: 'clamp(40px, 10vw, 64px)',
              lineHeight: 1,
              marginBottom: 28,
              textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)',
            }}
          >
            ∞
          </div>
          <CosmicHeader eyebrow="sealed until" title="Time Capsules" />
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
          <div style={{ paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
            <p
              className="hl-serif hl-italic"
              style={{
                fontSize: 19,
                fontWeight: 300,
                color: 'var(--bone-dim)',
                margin: '40px 0 40px',
                lineHeight: 1.5,
              }}
            >
              Nothing sealed yet. The cloth is waiting.
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  margin: 0,
                }}
              >
                preserve your legacy
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--rule-strong, var(--rule))',
                  cursor: 'pointer',
                  paddingBottom: 3,
                  flexShrink: 0,
                }}
              >
                seal a new capsule →
              </button>
            </div>
          </div>
        ) : (
          <>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderTop: '1px solid var(--rule)' }}>
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
                        padding: '14px 0 22px',
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
                            margin: '0 0 14px',
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

            {/* Footer — reverent label + create action */}
            <div
              style={{
                marginTop: 56,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-faint)',
                  margin: 0,
                }}
              >
                preserve your legacy
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--rule-strong, var(--rule))',
                  cursor: 'pointer',
                  paddingBottom: 3,
                  flexShrink: 0,
                }}
              >
                seal a new capsule →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create overlay — the Sealed Note: "When should this open?" */}
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
              padding: '48px 44px 40px',
              maxHeight: '92vh',
              overflowY: 'auto',
              border: '1px solid var(--rule)',
              borderRadius: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ceremony crown — glowing ∞ + serif title + mono warm meta */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div
                aria-hidden
                style={{
                  color: 'var(--warm)',
                  fontSize: 'clamp(40px, 10vw, 64px)',
                  lineHeight: 1,
                  marginBottom: 22,
                  textShadow: '0 0 32px var(--warm-glow), 0 0 12px var(--warm-glow)',
                }}
              >
                ∞
              </div>
              <h2
                className="hl-serif"
                style={{
                  fontSize: 'clamp(24px, 5vw, 34px)',
                  fontWeight: 300,
                  lineHeight: 1.08,
                  letterSpacing: '-0.01em',
                  margin: '0 0 16px',
                  color: 'var(--bone)',
                }}
              >
                When should this open?
              </h2>
              <p
                className="hl-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  margin: 0,
                }}
              >
                {resolvedUnlock
                  ? `Sealed · Opens ${formatUnlockDate(resolvedUnlock)}`
                  : 'A note for the future'}
              </p>
            </div>

            {/* Capsule name */}
            <div style={{ marginBottom: 28 }}>
              <SectionLabel>Capsule name</SectionLabel>
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

            {/* Lock-type rows — selectable dot + serif label + mono descriptor */}
            <div style={{ borderTop: '1px solid var(--rule)' }}>
              {LOCK_TYPES.map((lt) => {
                const active = lockType === lt.id;
                return (
                  <div key={lt.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                    <button
                      type="button"
                      onClick={() => setLockType(lt.id)}
                      aria-pressed={active}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 18,
                        background: 'none',
                        border: 0,
                        padding: '22px 0',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: `opacity 180ms ${EASE}`,
                      }}
                    >
                      <span style={{ marginTop: 7, transition: `transform 180ms ${EASE}` }}>
                        <WarmDot filled={active} size={9} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span
                          className="hl-serif"
                          style={{
                            display: 'block',
                            fontSize: 20,
                            fontWeight: 300,
                            lineHeight: 1.2,
                            color: active ? 'var(--bone)' : 'var(--bone-dim)',
                          }}
                        >
                          {lt.label}
                        </span>
                        <span
                          className="hl-mono"
                          style={{
                            display: 'block',
                            marginTop: 6,
                            fontSize: 11,
                            letterSpacing: '0.04em',
                            color: 'var(--bone-faint)',
                          }}
                        >
                          {lt.descriptor}
                        </span>
                      </span>
                    </button>

                    {/* Per-lock config inputs, revealed when active */}
                    {active && lt.id === 'date' && (
                      <div style={{ padding: '0 0 22px 27px' }}>
                        <input
                          type="date"
                          value={newCapsule.unlock_date}
                          onChange={(e) =>
                            setNewCapsule((prev) => ({ ...prev, unlock_date: e.target.value }))
                          }
                          min={isoDaysFromNow(1)}
                          style={{ ...inputStyle, fontFamily: 'var(--mono)', fontSize: 13 }}
                        />
                      </div>
                    )}
                    {active && lt.id === 'eighteen' && (
                      <div style={{ padding: '0 0 22px 27px' }}>
                        <input
                          type="number"
                          min={0}
                          max={17}
                          value={turnAge}
                          onChange={(e) => setTurnAge(e.target.value)}
                          placeholder="Their age today"
                          style={{ ...inputStyle, fontFamily: 'var(--mono)', fontSize: 13 }}
                        />
                      </div>
                    )}
                    {active && (lt.id === 'generation' || lt.id === 'gone') && (
                      <p
                        className="hl-mono"
                        style={{
                          margin: '0 0 22px 27px',
                          fontSize: 10,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'var(--bone-faint)',
                        }}
                      >
                        opens {formatUnlockDate(resolvedUnlock)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Description (optional) */}
            <div style={{ marginTop: 14 }}>
              <SectionLabel>Description (optional)</SectionLabel>
              <textarea
                value={newCapsule.description}
                onChange={(e) =>
                  setNewCapsule((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="A collection of memories from this special year…"
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            {/* Cover style */}
            <div style={{ marginTop: 14 }}>
              <SectionLabel>Cover style</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {COVER_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() =>
                      setNewCapsule((prev) => ({ ...prev, cover_style: style.id }))
                    }
                    style={{
                      background:
                        newCapsule.cover_style === style.id
                          ? 'rgba(176,122,74,0.06)'
                          : 'transparent',
                      border: `1px solid ${
                        newCapsule.cover_style === style.id ? 'var(--warm)' : 'var(--rule)'
                      }`,
                      borderRadius: 0,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: `border-color 180ms ${EASE}`,
                    }}
                  >
                    <span
                      className="hl-serif"
                      style={{
                        fontSize: 14,
                        fontWeight: 300,
                        color:
                          newCapsule.cover_style === style.id ? 'var(--warm)' : 'var(--bone)',
                      }}
                    >
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <p
                className="hl-mono"
                style={{
                  fontSize: 10,
                  color: 'var(--warm)',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  margin: '20px 0 0',
                }}
              >
                {createError}
              </p>
            )}

            {/* SEAL IT pill + wax ∞ */}
            <div
              style={{
                marginTop: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 22,
              }}
            >
              <button
                type="button"
                onClick={handleSeal}
                disabled={!canSeal}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  background: 'transparent',
                  border: '1px solid var(--warm)',
                  borderRadius: 999,
                  padding: '14px 34px',
                  cursor: canSeal ? 'pointer' : 'default',
                  opacity: canSeal ? 1 : 0.45,
                  transition: `opacity 180ms ${EASE}, background 360ms ${EASE}`,
                }}
              >
                {createMutation.isPending ? 'sealing…' : 'Seal it'}
              </button>
              <WaxSeal size={26} />
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: 'var(--bone-faint)',
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ClothShell>
  );
}

export default TimeCapsule;
