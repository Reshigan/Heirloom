import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoryCardsApi, memoriesApi } from '../services/api';
import { AppFrame } from '../loom/components/AppFrame';

interface CardStyle {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

interface GeneratedCard {
  id: string;
  style: string;
  styleConfig: CardStyle;
  quote: string;
  photoUrl: string | null;
  authorName: string;
  memoryDate: string | null;
  memoryTitle: string;
  shareUrl: string;
  shareText: string;
  socialShareUrls: {
    twitter: string;
    facebook: string;
    linkedin: string;
    whatsapp: string;
  };
}

interface OnThisDayMemory {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  yearsAgo: number;
  year: string;
  type: 'memory_date' | 'created';
  date: string;
}

const TABS: { value: 'create' | 'gallery' | 'onthisday'; label: string }[] = [
  { value: 'create', label: 'Create' },
  { value: 'gallery', label: 'My cards' },
  { value: 'onthisday', label: 'On this day' },
];

export function MemoryCards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('quote');
  const [customText, setCustomText] = useState('');
  const [includePhoto, setIncludePhoto] = useState(true);
  const [generatedCard, setGeneratedCard] = useState<GeneratedCard | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'gallery' | 'onthisday'>('create');

  const { data: stylesData } = useQuery({
    queryKey: ['memory-card-styles'],
    queryFn: () => memoryCardsApi.getStyles().then(r => r.data),
  });

  const { data: memoriesData } = useQuery({
    queryKey: ['memories-for-cards'],
    queryFn: () => memoriesApi.getAll({ limit: 50 }).then(r => r.data),
  });

  const { data: cardsData } = useQuery({
    queryKey: ['my-memory-cards'],
    queryFn: () => memoryCardsApi.getAll().then(r => r.data),
    enabled: activeTab === 'gallery',
  });

  const { data: onThisDayData } = useQuery({
    queryKey: ['on-this-day'],
    queryFn: () => memoryCardsApi.getOnThisDay().then(r => r.data),
    enabled: activeTab === 'onthisday',
  });

  const generateMutation = useMutation({
    mutationFn: () => memoryCardsApi.generate({
      memoryId: selectedMemory!,
      style: selectedStyle,
      customText: customText || undefined,
      includePhoto,
    }),
    onSuccess: (response) => {
      setGeneratedCard(response.data);
      queryClient.invalidateQueries({ queryKey: ['my-memory-cards'] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: (platform: string) => memoryCardsApi.recordShare(generatedCard!.id, platform),
  });

  const handleGenerate = () => {
    if (selectedMemory) generateMutation.mutate();
  };

  const handleCopyLink = async () => {
    if (!generatedCard) return;
    try {
      await navigator.clipboard.writeText(generatedCard.shareUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = generatedCard.shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    shareMutation.mutate('copy');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = (platform: string, url: string) => {
    shareMutation.mutate(platform);
    window.open(url, '_blank', 'width=600,height=400');
  };

  const styles = stylesData?.styles || [];
  const memories = memoriesData?.memories || [];
  const cards = cardsData?.cards || [];
  const onThisDay = onThisDayData || { memoriesFromThisDay: [], createdOnThisDay: [], hasMemories: false, displayDate: '' };

  return (
    <AppFrame>
      {/* Header */}
      <header style={{ marginBottom: 40 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Memory Cards</p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          Threads made shareable.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          Pull a line from the cloth and send it forward — a single weft made into a card for
          someone who wasn't there.
        </p>
      </header>

      {/* Tab row */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          paddingBottom: 14,
          marginBottom: 36,
          borderBottom: '1px solid var(--loom-rule)',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setActiveTab(t.value)}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: activeTab === t.value ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
              borderBottom: '1px solid',
              borderColor: activeTab === t.value ? 'var(--loom-warm)' : 'transparent',
              paddingBottom: 6,
              transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigate('/memories')}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--loom-warm)',
          }}
        >
          view the thread →
        </button>
      </div>

      {/* Create tab */}
      {activeTab === 'create' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 48,
            alignItems: 'start',
          }}
        >
          {/* Left column — controls */}
          <div style={{ display: 'grid', gap: 32 }}>
            {/* Memory selection */}
            <section>
              <p className="loom-eyebrow" style={{ marginBottom: 16 }}>1 — select a memory</p>
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'grid', gap: 1 }}>
                {memories.length === 0 ? (
                  <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', fontStyle: 'italic' }}>
                    No memories yet.
                  </p>
                ) : (
                  memories.map((memory: any) => (
                    <button
                      key={memory.id}
                      type="button"
                      onClick={() => setSelectedMemory(memory.id)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        borderBottom: '1px solid var(--loom-rule)',
                        padding: '14px 0',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'grid',
                        gap: 4,
                      }}
                    >
                      <span
                        className="loom-serif"
                        style={{
                          fontSize: 17,
                          fontWeight: 300,
                          color: selectedMemory === memory.id ? 'var(--loom-warm)' : 'var(--loom-bone)',
                          transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                      >
                        {memory.title || 'Untitled Memory'}
                      </span>
                      {memory.description && (
                        <span
                          className="loom-body"
                          style={{
                            fontSize: 13,
                            color: 'var(--loom-bone-dim)',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {memory.description}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </section>

            {/* Style selection */}
            <section>
              <p className="loom-eyebrow" style={{ marginBottom: 16 }}>2 — choose a style</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {styles.map((style: CardStyle) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    style={{
                      padding: '12px 14px',
                      border: `1px solid ${selectedStyle === style.id ? 'var(--loom-warm)' : 'var(--loom-rule)'}`,
                      background: selectedStyle === style.id ? 'rgba(176,122,74,0.06)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                  >
                    <p
                      className="loom-mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: selectedStyle === style.id ? 'var(--loom-warm)' : 'var(--loom-bone)',
                        margin: '0 0 4px',
                      }}
                    >
                      {style.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--loom-bone-faint)', margin: 0 }}>{style.description}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Customize */}
            <section>
              <p className="loom-eyebrow" style={{ marginBottom: 16 }}>3 — customize</p>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label
                    className="loom-eyebrow"
                    style={{ display: 'block', marginBottom: 10, color: 'var(--loom-bone-faint)' }}
                  >
                    Custom quote — optional
                  </label>
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Leave empty to auto-extract from memory…"
                    maxLength={200}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--loom-rule)',
                      borderRadius: 2,
                      padding: '10px 14px',
                      color: 'var(--loom-bone)',
                      fontFamily: "'Source Serif 4', serif",
                      fontSize: 15,
                      lineHeight: 1.7,
                      minHeight: 80,
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includePhoto}
                    onChange={(e) => setIncludePhoto(e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: 'var(--loom-warm)', cursor: 'pointer' }}
                  />
                  <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                    Include photo if available
                  </span>
                </label>
              </div>
            </section>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedMemory || generateMutation.isPending}
              className="loom-btn"
              style={{ opacity: !selectedMemory || generateMutation.isPending ? 0.45 : 1 }}
            >
              {generateMutation.isPending ? (
                <span style={{ fontStyle: 'italic' }}>Weaving…</span>
              ) : (
                'Generate card'
              )}
            </button>
          </div>

          {/* Right column — preview */}
          <div>
            {generatedCard ? (
              <div>
                <p className="loom-eyebrow" style={{ marginBottom: 18 }}>Your card</p>

                {/* Card preview */}
                <div
                  style={{
                    border: '1px solid var(--loom-rule)',
                    padding: 32,
                    marginBottom: 24,
                    background: generatedCard.styleConfig.bgColor,
                    color: generatedCard.styleConfig.textColor,
                  }}
                >
                  {generatedCard.photoUrl && (
                    <div
                      style={{
                        border: '1px solid rgba(244,236,216,0.12)',
                        marginBottom: 20,
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={generatedCard.photoUrl}
                        alt="Memory"
                        style={{ width: '100%', height: 192, objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  )}
                  <blockquote
                    style={{
                      fontFamily: "'Source Serif 4', serif",
                      fontStyle: 'italic',
                      fontSize: 19,
                      lineHeight: 1.6,
                      margin: '0 0 18px',
                      borderLeft: '2px solid var(--loom-warm)',
                      paddingLeft: 16,
                    }}
                  >
                    "{generatedCard.quote}"
                  </blockquote>
                  <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
                    — {generatedCard.authorName}
                    {generatedCard.memoryDate && <span> · {generatedCard.memoryDate}</span>}
                  </p>
                  <p
                    className="loom-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      marginTop: 16,
                      opacity: 0.45,
                      textTransform: 'uppercase',
                    }}
                  >
                    ∞ Heirloom
                  </p>
                </div>

                {/* Share actions */}
                <div style={{ display: 'grid', gap: 8 }}>
                  <button type="button" onClick={handleCopyLink} className="loom-btn-ghost">
                    {copied ? 'Link copied' : 'Copy share link'}
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(['twitter', 'facebook', 'whatsapp', 'linkedin'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSocialShare(p, generatedCard.socialShareUrls[p])}
                        className="loom-btn-ghost"
                        style={{ fontSize: 11, textTransform: 'capitalize', letterSpacing: '0.12em' }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid var(--loom-rule)',
                  padding: '64px 32px',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: 28,
                    color: 'var(--loom-warm)',
                    marginBottom: 14,
                  }}
                >
                  ∞
                </p>
                <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', fontStyle: 'italic' }}>
                  Select a memory and style to generate your card.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gallery tab */}
      {activeTab === 'gallery' && (
        <div>
          {cards.length === 0 ? (
            <div style={{ border: '1px solid var(--loom-rule)', padding: '64px 32px', textAlign: 'center' }}>
              <p className="loom-eyebrow" style={{ marginBottom: 14 }}>No cards yet</p>
              <h2 className="loom-serif" style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 24px' }}>
                Every thread has a quotable line. Find yours.
              </h2>
              <button type="button" onClick={() => setActiveTab('create')} className="loom-btn">
                Create your first card
              </button>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {cards.map((card: any) => (
                <li key={card.id} style={{ padding: '24px 0', borderBottom: '1px solid var(--loom-rule)' }}>
                  <article style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'baseline' }}>
                    <div>
                      <p className="loom-mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', margin: '0 0 8px' }}>
                        {card.memoryTitle || 'Untitled'}
                      </p>
                      <blockquote className="loom-serif" style={{ fontSize: 18, fontWeight: 300, fontStyle: 'italic', color: 'var(--loom-bone)', margin: 0 }}>
                        "{card.quote}"
                      </blockquote>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: '0 0 8px' }}>
                        {card.shareCount || 0} shares
                      </p>
                      <a
                        href={card.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 10,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: 'var(--loom-warm)',
                          textDecoration: 'none',
                        }}
                      >
                        view →
                      </a>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* On This Day tab */}
      {activeTab === 'onthisday' && (
        <div>
          {onThisDay.displayDate && (
            <p
              className="loom-mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--loom-warm)',
                marginBottom: 32,
              }}
            >
              {onThisDay.displayDate}
            </p>
          )}

          {!onThisDay.hasMemories ? (
            <div style={{ border: '1px solid var(--loom-rule)', padding: '64px 32px', textAlign: 'center' }}>
              <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Nothing from this day yet</p>
              <h2 className="loom-serif" style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: 0, color: 'var(--loom-bone-dim)' }}>
                Keep weaving. The anniversaries will come.
              </h2>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 48 }}>
              {onThisDay.memoriesFromThisDay.length > 0 && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                    <span className="loom-eyebrow">From this day</span>
                    <hr className="loom-hairline" style={{ flex: 1 }} />
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {onThisDay.memoriesFromThisDay.map((memory: OnThisDayMemory) => (
                      <li key={memory.id} style={{ padding: '20px 0', borderBottom: '1px solid var(--loom-rule)' }}>
                        <article style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 28, alignItems: 'start' }}>
                          <div>
                            <p className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-warm)', textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0 }}>
                              {memory.yearsAgo}y ago
                            </p>
                            <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', margin: '4px 0 0' }}>
                              {memory.year}
                            </p>
                          </div>
                          <div>
                            {memory.photoUrl && (
                              <div style={{ border: '1px solid var(--loom-rule)', marginBottom: 12, overflow: 'hidden' }}>
                                <img
                                  src={memory.photoUrl}
                                  alt={memory.title}
                                  style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                                />
                              </div>
                            )}
                            <h4 className="loom-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px' }}>
                              {memory.title || 'Untitled Memory'}
                            </h4>
                            <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 14px' }}>
                              {memory.description}
                            </p>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <button
                                type="button"
                                onClick={() => { setSelectedMemory(memory.id); setActiveTab('create'); }}
                                className="loom-btn-ghost"
                                style={{ fontSize: 11, padding: '8px 16px' }}
                              >
                                Create card
                              </button>
                              <button
                                type="button"
                                onClick={() => navigate(`/memories/${memory.id}`)}
                                className="loom-btn-ghost"
                                style={{ fontSize: 11, padding: '8px 16px' }}
                              >
                                View memory
                              </button>
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {onThisDay.createdOnThisDay.length > 0 && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                    <span className="loom-eyebrow">Created on this day</span>
                    <hr className="loom-hairline" style={{ flex: 1 }} />
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {onThisDay.createdOnThisDay.map((memory: OnThisDayMemory) => (
                      <li key={memory.id} style={{ padding: '20px 0', borderBottom: '1px solid var(--loom-rule)' }}>
                        <article style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 28, alignItems: 'baseline' }}>
                          <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', textTransform: 'uppercase', letterSpacing: '0.18em', margin: 0 }}>
                            {memory.yearsAgo}y ago
                          </p>
                          <div>
                            <h4 className="loom-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 6px' }}>
                              {memory.title || 'Untitled Memory'}
                            </h4>
                            <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: 0 }}>
                              {memory.description}
                            </p>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </AppFrame>
  );
}

export default MemoryCards;
