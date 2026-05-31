import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api from '../services/api';

const CATEGORY_CONFIG: Record<string, { label: string }> = {
  PEOPLE: { label: 'People to Remember' },
  STORIES: { label: 'Stories to Tell' },
  GRATITUDE: { label: 'Gratitude & Love' },
  PRACTICAL: { label: 'Practical Matters' },
  WISDOM: { label: 'Wisdom to Share' },
};

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

/* ─── Inline shuttle loader ─────────────────────────────────── */
function LoomShuttle({ label }: { label: string }) {
  return (
    <div style={{ padding: '40px 0' }}>
      <div
        style={{
          height: 1,
          background: 'var(--loom-rule)',
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
            background: 'var(--loom-warm)',
            animation: 'loom-shuttle 1.4s var(--loom-ease) infinite',
          }}
        />
      </div>
      <p
        className="loom-mono"
        style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 10, letterSpacing: '0.1em' }}
      >
        {label}
      </p>
    </div>
  );
}

export function LegacyPlan() {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['PEOPLE', 'STORIES']));
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { isOpen: isOnboardingOpen, completeOnboarding, dismissOnboarding, openOnboarding } = useFeatureOnboarding('legacy-plan');

  const { data, isLoading } = useQuery<LegacyPlan>({
    queryKey: ['legacy-plan'],
    queryFn: () => api.get('/api/legacy-plan').then((r: { data: LegacyPlan }) => r.data),
  });

  const toggleItemMutation = useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      api.patch(`/api/legacy-plan/items/${itemId}`, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legacy-plan'] }),
  });

  const addItemMutation = useMutation({
    mutationFn: (data: { category: string; title: string; description?: string }) =>
      api.post('/api/legacy-plan/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legacy-plan'] });
      setShowAddItem(null);
      setNewItemTitle('');
      setNewItemDescription('');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/api/legacy-plan/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['legacy-plan'] }),
  });

  const toggleShareMutation = useMutation({
    mutationFn: (shareProgress: boolean) => api.patch('/api/legacy-plan/share', { shareProgress }),
    onSuccess: (response: { data: { shareUrl?: string } }) => {
      queryClient.invalidateQueries({ queryKey: ['legacy-plan'] });
      if (response.data.shareUrl) {
        setShareUrl(`${window.location.origin}${response.data.shareUrl}`);
      }
    },
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddItem = (category: string) => {
    if (!newItemTitle.trim()) return;
    addItemMutation.mutate({
      category,
      title: newItemTitle.trim(),
      description: newItemDescription.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <AppFrame>
        <LoomShuttle label="loading…" />
      </AppFrame>
    );
  }

  const plan = data?.plan;
  const itemsByCategory = data?.itemsByCategory || {};

  return (
    <AppFrame>
      {/* Header */}
      <div style={{ marginBottom: 56 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 16 }}>thread plan</p>
        <h1
          className="loom-h2"
          style={{
            fontSize: 'clamp(36px,5vw,56px)',
            fontWeight: 300,
            fontStyle: 'italic',
            margin: '0 0 16px',
          }}
        >
          What to weave first.
        </h1>
        <p
          className="loom-body"
          style={{ color: 'var(--loom-bone-dim)', maxWidth: 560, fontSize: 16, lineHeight: 1.7 }}
        >
          A quiet guide for what to put into your family thread first. Work through these so the people
          who come after you have something to read.
        </p>
      </div>

      {/* Progress summary */}
      <div
        style={{
          borderTop: '1px solid var(--loom-rule)',
          borderBottom: '1px solid var(--loom-rule)',
          padding: '24px 0',
          marginBottom: 48,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="loom-eyebrow" style={{ marginBottom: 8 }}>progress</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span
              className="loom-h2"
              style={{ fontSize: 32, fontStyle: 'italic', color: 'var(--loom-warm)', fontWeight: 300 }}
            >
              {plan?.progressPercent || 0}%
            </span>
            <span
              className="loom-mono"
              style={{ fontSize: 11, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}
            >
              {plan?.completedItems || 0} / {plan?.totalItems || 0} threads woven
            </span>
          </div>
          <div
            style={{
              marginTop: 12,
              height: 1,
              background: 'var(--loom-rule)',
              position: 'relative',
              maxWidth: 240,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${plan?.progressPercent || 0}%`,
                background: 'var(--loom-warm)',
                transition: 'width 720ms var(--loom-ease)',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button
            onClick={() => toggleShareMutation.mutate(!(plan?.share_progress === 1))}
            className={plan?.share_progress === 1 ? 'loom-btn' : 'loom-btn-ghost'}
            style={{ fontSize: 10 }}
          >
            {plan?.share_progress === 1 ? 'sharing on' : 'share progress'}
          </button>
          {shareUrl && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span
                className="loom-mono"
                style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {shareUrl}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="loom-mono"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--loom-warm)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: 0,
                }}
              >
                copy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: 'grid', gap: 0 }}>
        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
          const items = itemsByCategory[category] || [];
          const completedCount = items.filter(i => i.completed === 1).length;
          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category}>
              {/* Category row */}
              <button
                onClick={() => toggleCategory(category)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '16px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--loom-rule)',
                  cursor: 'pointer',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
                  <span
                    className="loom-body"
                    style={{ fontSize: 16, color: 'var(--loom-bone)' }}
                  >
                    {config.label}
                  </span>
                  <span
                    className="loom-mono"
                    style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}
                  >
                    {completedCount}/{items.length}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Mini track */}
                  <div
                    style={{
                      width: 64,
                      height: 1,
                      background: 'var(--loom-rule)',
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
                        background: 'var(--loom-warm)',
                        transition: 'width 360ms var(--loom-ease)',
                      }}
                    />
                  </div>
                  <span
                    className="loom-mono"
                    style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}
                    aria-hidden
                  >
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>
              </button>

              {/* Items */}
              {isExpanded && (
                <div
                  style={{
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--loom-rule)',
                  }}
                >
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 16,
                        padding: '10px 0',
                        borderBottom: '1px solid var(--loom-rule)',
                      }}
                    >
                      {/* Toggle: warm text vs faint — no icon/checkmark */}
                      <button
                        onClick={() => toggleItemMutation.mutate({
                          itemId: item.id,
                          completed: item.completed !== 1
                        })}
                        aria-label={item.completed === 1 ? 'Mark incomplete' : 'Mark complete'}
                        className="loom-mono"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: item.completed === 1 ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
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

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="loom-body"
                          style={{
                            fontSize: 15,
                            color: item.completed === 1 ? 'var(--loom-bone-faint)' : 'var(--loom-bone)',
                            margin: 0,
                            textDecoration: item.completed === 1 ? 'line-through' : 'none',
                          }}
                        >
                          {item.title}
                        </p>
                        {item.description && (
                          <p
                            className="loom-mono"
                            style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 3, letterSpacing: '0.04em' }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        aria-label="Remove item"
                        className="loom-mono"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--loom-bone-faint)',
                          fontSize: 9,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          padding: 0,
                          flexShrink: 0,
                          transition: 'color 180ms var(--loom-ease)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#c25a5a')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--loom-bone-faint)')}
                      >
                        remove
                      </button>
                    </div>
                  ))}

                  {/* Add item form */}
                  {showAddItem === category ? (
                    <div style={{ paddingTop: 16, display: 'grid', gap: 12 }}>
                      <input
                        type="text"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder="What do you want to accomplish?"
                        autoFocus
                        style={{
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid var(--loom-rule)',
                          color: 'var(--loom-bone)',
                          fontFamily: "'Source Serif 4', serif",
                          fontVariationSettings: "'opsz' 14",
                          fontSize: 15,
                          padding: '8px 0',
                          outline: 'none',
                          caretColor: 'var(--loom-warm)',
                        }}
                        onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--loom-warm)')}
                        onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--loom-rule)')}
                      />
                      <input
                        type="text"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        placeholder="Description (optional)"
                        style={{
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid var(--loom-rule)',
                          color: 'var(--loom-bone-dim)',
                          fontFamily: "'Source Serif 4', serif",
                          fontVariationSettings: "'opsz' 14",
                          fontSize: 13,
                          padding: '8px 0',
                          outline: 'none',
                          caretColor: 'var(--loom-warm)',
                        }}
                        onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--loom-warm)')}
                        onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--loom-rule)')}
                      />
                      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
                        <button
                          onClick={() => handleAddItem(category)}
                          disabled={!newItemTitle.trim() || addItemMutation.isPending}
                          className="loom-btn"
                          style={{ fontSize: 10, padding: '9px 18px', opacity: !newItemTitle.trim() || addItemMutation.isPending ? 0.5 : 1 }}
                        >
                          add thread
                        </button>
                        <button
                          onClick={() => {
                            setShowAddItem(null);
                            setNewItemTitle('');
                            setNewItemDescription('');
                          }}
                          className="loom-btn-ghost"
                          style={{ fontSize: 10, padding: '9px 18px' }}
                        >
                          cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddItem(category)}
                      className="loom-mono"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '14px 0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--loom-bone-faint)',
                        fontSize: 10,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        transition: 'color 180ms var(--loom-ease)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--loom-bone-dim)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--loom-bone-faint)')}
                    >
                      + add thread
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div style={{ marginTop: 56, borderTop: '1px solid var(--loom-rule)', paddingTop: 32 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 20 }}>weave now</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 0 }}>
          {[
            { href: '/record', label: 'record a story' },
            { href: '/compose', label: 'write a letter' },
            { href: '/memories', label: 'add photographs' },
            { href: '/family', label: 'add bloodline' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="loom-mono"
              style={{
                display: 'block',
                padding: '14px 0',
                borderRight: '1px solid var(--loom-rule)',
                color: 'var(--loom-bone-faint)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'color 180ms var(--loom-ease)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--loom-bone)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--loom-bone-faint)')}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Help */}
      <OnboardingHelpButton onClick={openOnboarding} />

      <FeatureOnboarding
        featureKey="legacy-plan"
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />
    </AppFrame>
  );
}

export default LegacyPlan;
