import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
import { ClothShell } from '../loom/components/ClothShell';
import { RoomHeader } from '../loom/components/room';
import { UserMenu } from '../loom/components/Frame';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

// ── Types (all preserved) ─────────────────────────────────────────────────────
interface PlanItem {
  id: string;
  category: string;
  title: string;
  description: string;
  completed: number;
  completed_at: string | null;
  linked_type: string | null;
  linked_id: string | null;
}

interface LegacyPlan {
  plan: {
    id: string;
    share_token: string;
    share_progress: number;
    totalItems: number;
    completedItems: number;
    progressPercent: number;
  };
  items: PlanItem[];
  itemsByCategory: Record<string, PlanItem[]>;
}

// ── Inline hairline progress loader ──────────────────────────────────────────
function HairlineLoader() {
  return (
    <div style={{ padding: '80px 0 40px' }}>
      <div
        style={{
          height: 1,
          background: 'var(--rule)',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: 180,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: '40%',
            background: 'var(--warm)',
            animation: 'loom-shuttle 1.4s cubic-bezier(0.16,1,0.3,1) infinite',
          }}
        />
      </div>
    </div>
  );
}

// ── LegacyPlan ────────────────────────────────────────────────────────────────
export function LegacyPlan() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['PEOPLE', 'STORIES']));
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const { isOpen: isOnboardingOpen, completeOnboarding, dismissOnboarding, openOnboarding } = useFeatureOnboarding('legacy-plan');

  // ── API ─────────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery<LegacyPlan>({
    queryKey: ['legacy-plan'],
    queryFn: () => api.get('/legacy-plan').then((r: { data: LegacyPlan }) => r.data),
  });

  const toggleItemMutation = useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      api.patch(`/legacy-plan/items/${itemId}`, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legacy-plan'] }),
  });

  const addItemMutation = useMutation({
    mutationFn: (data: { category: string; title: string; description?: string }) =>
      api.post('/legacy-plan/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legacy-plan'] });
      setShowAddItem(null);
      setNewItemTitle('');
      setNewItemDescription('');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/legacy-plan/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legacy-plan'] }),
  });

  const toggleShareMutation = useMutation({
    mutationFn: (shareProgress: boolean) => api.patch('/legacy-plan/share', { shareProgress }),
    onSuccess: (response: { data: { shareUrl?: string } }) => {
      queryClient.invalidateQueries({ queryKey: ['legacy-plan'] });
      if (response.data.shareUrl) {
        setShareUrl(`${window.location.origin}${response.data.shareUrl}`);
      }
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const toggleCategory = (category: string) => {
    const next = new Set(expandedCategories);
    if (next.has(category)) { next.delete(category); } else { next.add(category); }
    setExpandedCategories(next);
  };

  const handleAddItem = (category: string) => {
    if (!newItemTitle.trim()) return;
    addItemMutation.mutate({
      category,
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || undefined,
    });
  };

  const plan = data?.plan;
  const itemsByCategory = data?.itemsByCategory || {};

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <ClothShell
        topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'legacy plan' }]} />}
        topbarCenter="legacy plan"
        topbarRight={<UserMenu />}
      >
        <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', maxWidth: 'var(--page-max-wide)', margin: '0 auto' }}>
          <HairlineLoader />
        </div>
      </ClothShell>
    );
  }

  // ── Input styles shared ───────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--rule)',
    color: 'var(--bone)',
    fontFamily: 'var(--serif)',
    fontVariationSettings: "'opsz' 14",
    fontSize: 16,
    padding: '8px 0',
    outline: 'none',
    caretColor: 'var(--warm)',
    borderRadius: 0,
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <ClothShell
      topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'legacy plan' }]} />}
      topbarCenter="legacy plan"
      topbarRight={<UserMenu />}
    >
      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', maxWidth: 'var(--page-max-wide)', margin: '0 auto' }}>

        {/* H1 */}
        <RoomHeader
          eyebrow="legacy plan"
          title="The thread continues."
          lede="Name your successors, arm the check-in, and keep an exportable copy — so the bloodline outlives any one author."
          className="hl-room-header"
        />
        <div style={{ height: 40 }} />

        {/* ── Section: Succession ─────────────────────────────────────────── */}
        <section
          style={{
            borderTop: '1px solid var(--rule)',
            paddingTop: 28,
            marginTop: 28,
          }}
        >
          <p className="hl-eyebrow dark" style={{ marginBottom: 20 }}>Succession</p>

          {/* Progress row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--rule)',
              padding: '14px 0',
              alignItems: 'center',
            }}
          >
            <div>
              <p
                className="hl-serif"
                style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 4px' }}
              >
                Thread progress
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 120,
                    height: 1,
                    background: 'var(--rule)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${plan?.progressPercent || 0}%`,
                      background: 'var(--warm)',
                      transition: 'width 720ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  />
                </div>
                <span
                  className="hl-mono"
                  style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}
                >
                  {plan?.completedItems || 0} / {plan?.totalItems || 0} woven
                </span>
              </div>
            </div>
            <span
              className="hl-serif"
              style={{
                fontSize: 28,
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'var(--warm)',
              }}
            >
              {plan?.progressPercent || 0}%
            </span>
          </div>

          {/* Share progress row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--rule)',
              padding: '14px 0',
              alignItems: 'center',
            }}
          >
            <div>
              <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 2px' }}>
                Share progress
              </p>
              {shareUrl && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                  <span
                    className="hl-mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--bone-faint)',
                      letterSpacing: '0.04em',
                      maxWidth: 320,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shareUrl}
                  </span>
                  <button
                    onClick={() => { setCopyError(null); copyToClipboard(shareUrl).catch(() => { setCopyError('copy failed — paste manually'); }); }}
                    className="hl-mono"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--warm)',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      padding: 0,
                    }}
                  >
                    copy
                  </button>
                  {copyError && (
                    <span className="hl-mono" style={{ fontSize: 9, color: 'var(--danger)', letterSpacing: '0.1em' }}>{copyError}</span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => toggleShareMutation.mutate(!(plan?.share_progress === 1))}
              className="hl-btn"
              style={{ fontSize: 10 }}
            >
              {plan?.share_progress === 1 ? 'sharing on' : 'share progress'}
            </button>
          </div>

          {/* Category rows */}
          {Object.entries({
            PEOPLE:    'People to Remember',
            STORIES:   'Stories to Tell',
            GRATITUDE: 'Gratitude & Love',
            PRACTICAL: 'Practical Matters',
            WISDOM:    'Wisdom to Share',
          }).map(([category, label]) => {
            const items = itemsByCategory[category] || [];
            const completedCount = items.filter(i => i.completed === 1).length;
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    width: '100%',
                    padding: '14px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--rule)',
                    cursor: 'pointer',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
                    <span className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)' }}>
                      {label}
                    </span>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}
                    >
                      {completedCount}/{items.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 64,
                        height: 1,
                        background: 'var(--rule)',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%`,
                          background: 'var(--warm)',
                          transition: 'width 360ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                      />
                    </div>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 11, color: 'var(--bone-faint)' }}
                      aria-hidden
                    >
                      {isExpanded ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--rule)' }}>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          alignItems: 'baseline',
                          gap: 16,
                          padding: '10px 0',
                          borderBottom: '1px solid var(--rule)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                          <button
                            onClick={() => toggleItemMutation.mutate({ itemId: item.id, completed: item.completed !== 1 })}
                            aria-label={item.completed === 1 ? 'Mark incomplete' : 'Mark complete'}
                            className="hl-mono"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: item.completed === 1 ? 'var(--warm)' : 'var(--bone-faint)',
                              fontSize: 10,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase',
                              flexShrink: 0,
                              padding: 0,
                              minWidth: 52,
                            }}
                          >
                            {item.completed === 1 ? 'woven' : 'weave'}
                          </button>
                          <div>
                            <p
                              className="hl-serif"
                              style={{
                                fontSize: 15,
                                color: item.completed === 1 ? 'var(--bone-faint)' : 'var(--bone)',
                                margin: 0,
                                textDecoration: item.completed === 1 ? 'line-through' : 'none',
                              }}
                            >
                              {item.title}
                            </p>
                            {item.description && (
                              <p
                                className="hl-mono"
                                style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 3, letterSpacing: '0.04em' }}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItemMutation.mutate(item.id)}
                          aria-label="Remove item"
                          className="hl-mono"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--bone-faint)',
                            fontSize: 9,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            padding: 0,
                            flexShrink: 0,
                            transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
                        >
                          remove
                        </button>
                      </div>
                    ))}

                    {showAddItem === category ? (
                      <div style={{ paddingTop: 16, display: 'grid', gap: 12 }}>
                        <input
                          type="text"
                          value={newItemTitle}
                          onChange={(e) => setNewItemTitle(e.target.value)}
                          placeholder="What do you want to accomplish?"
                          autoFocus
                          style={inputStyle}
                          onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--warm)')}
                          onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--rule)')}
                        />
                        <input
                          type="text"
                          value={newItemDescription}
                          onChange={(e) => setNewItemDescription(e.target.value)}
                          placeholder="Description (optional)"
                          style={{ ...inputStyle, color: 'var(--bone-dim)', fontSize: 16 }}
                          onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--warm)')}
                          onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--rule)')}
                        />
                        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                          <button
                            onClick={() => handleAddItem(category)}
                            disabled={!newItemTitle.trim() || addItemMutation.isPending}
                            className="hl-btn"
                            style={{ fontSize: 10, padding: '9px 18px', opacity: !newItemTitle.trim() || addItemMutation.isPending ? 0.5 : 1 }}
                          >
                            add thread
                          </button>
                          <button
                            onClick={() => { setShowAddItem(null); setNewItemTitle(''); setNewItemDescription(''); }}
                            className="hl-btn ghost"
                            style={{ fontSize: 10, padding: '9px 18px' }}
                          >
                            cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddItem(category)}
                        className="hl-mono"
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '14px 0',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: 'var(--bone-faint)',
                          fontSize: 10,
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone-dim)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
                      >
                        + add thread
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* ── Section: Dead-man's switch ───────────────────────────────────── */}
        <section
          style={{
            borderTop: '1px solid var(--rule)',
            paddingTop: 28,
            marginTop: 28,
          }}
        >
          <p className="hl-eyebrow dark" style={{ marginBottom: 20 }}>Dead-man's switch</p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--rule)',
              padding: '14px 0',
              alignItems: 'center',
            }}
          >
            <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', margin: 0 }}>
              Check-in interval
            </p>
            <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              not armed
            </span>
          </div>

          <p className="hl-serif" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--bone-faint)', margin: '12px 0 0', lineHeight: 1.6 }}>
            Configure your dead-man's switch in <Link to="/settings" style={{ color: 'var(--warm)', textDecoration: 'none', borderBottom: '1px solid var(--warm-dim)' }}>Settings →</Link>
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--rule)',
              padding: '14px 0',
              alignItems: 'center',
            }}
          >
            <div>
              <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 4px' }}>
                Designate successor
              </p>
              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', margin: 0, letterSpacing: '0.04em' }}>
                Administrative authority passes on trigger
              </p>
            </div>
            <button className="hl-btn" style={{ fontSize: 10 }} onClick={() => navigate('/threads')}>
              set successor
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--rule)',
              padding: '14px 0',
              alignItems: 'center',
            }}
          >
            <div>
              <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 4px' }}>
                Time-locked entries
              </p>
              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', margin: 0, letterSpacing: '0.04em' }}>
                Release on death conditions
              </p>
            </div>
            <button className="hl-btn" style={{ fontSize: 10 }} onClick={() => navigate('/loom/tied')}>
              configure
            </button>
          </div>
        </section>

        {/* ── Section: Export ──────────────────────────────────────────────── */}
        <section
          style={{
            borderTop: '1px solid var(--rule)',
            paddingTop: 28,
            marginTop: 28,
          }}
        >
          <p className="hl-eyebrow dark" style={{ marginBottom: 20 }}>Export</p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--rule)',
              padding: '14px 0',
              alignItems: 'center',
            }}
          >
            <div>
              <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 4px' }}>
                Full archive export
              </p>
              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', margin: 0, letterSpacing: '0.04em' }}>
                Every entry, photograph, and voice recording
              </p>
            </div>
            <button className="hl-btn" style={{ fontSize: 10 }} onClick={() => navigate('/settings')}>
              request export
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--rule)',
              padding: '14px 0',
              alignItems: 'center',
            }}
          >
            <div>
              <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 4px' }}>
                Print-ready book
              </p>
              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', margin: 0, letterSpacing: '0.04em' }}>
                Letterpress-fidelity PDF of the thread
              </p>
            </div>
            <button className="hl-btn" disabled title="Coming soon" style={{ fontSize: 10, opacity: 0.4, cursor: 'not-allowed' }}>
              generate PDF
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              borderBottom: '1px solid var(--rule)',
              padding: '14px 0',
              alignItems: 'center',
            }}
          >
            <div>
              <p className="hl-serif" style={{ fontSize: 16, color: 'var(--bone)', margin: '0 0 4px' }}>
                Textile pattern
              </p>
              <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', margin: 0, letterSpacing: '0.04em' }}>
                Your entries encoded as a woven cloth pattern
              </p>
            </div>
            <button className="hl-btn" disabled title="Coming soon" style={{ fontSize: 10, opacity: 0.4, cursor: 'not-allowed' }}>
              generate
            </button>
          </div>
        </section>

        {/* Weave-now quick links */}
        <div style={{ marginTop: 56, borderTop: '1px solid var(--rule)', paddingTop: 32 }}>
          <p className="hl-eyebrow dark" style={{ marginBottom: 20 }}>weave now</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 0,
            }}
          >
            {[
              { href: '/record',   label: 'record a story' },
              { href: '/compose',  label: 'write a letter' },
              { href: '/memories', label: 'add photographs' },
              { href: '/family',   label: 'add bloodline' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                to={href}
                className="hl-mono"
                style={{
                  display: 'block',
                  padding: '14px 0',
                  borderRight: '1px solid var(--rule)',
                  color: 'var(--bone-faint)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--bone)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ paddingBottom: 80 }} />
      </div>

      <OnboardingHelpButton onClick={openOnboarding} />

      <FeatureOnboarding
        featureKey="legacy-plan"
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />
    </ClothShell>
  );
}

export default LegacyPlan;
