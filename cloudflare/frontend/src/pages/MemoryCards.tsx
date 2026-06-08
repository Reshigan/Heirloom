import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoryCardsApi, memoriesApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';

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

// Dye palette — 10 natural stops, cycles deterministically by index
const DYE_VARS = [
  'var(--dye-madder)',
  'var(--dye-cochineal)',
  'var(--dye-kermes)',
  'var(--dye-saffron)',
  'var(--dye-weld)',
  'var(--dye-walnut)',
  'var(--dye-oakgall)',
  'var(--dye-woad)',
  'var(--dye-indigo)',
  'var(--dye-iron)',
];

function dyeFor(index: number): string {
  return DYE_VARS[index % DYE_VARS.length];
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
  const [genError, setGenError] = useState<string | null>(null);
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
      setGenError(null);
      queryClient.invalidateQueries({ queryKey: ['my-memory-cards'] });
    },
    onError: () => setGenError('Card generation failed. Please try again.'),
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
  const memories: any[] = Array.isArray((memoriesData as any)?.data)
    ? (memoriesData as any).data
    : Array.isArray(memoriesData)
    ? (memoriesData as any)
    : [];
  const cards = cardsData?.cards || [];
  const onThisDay = onThisDayData || {
    memoriesFromThisDay: [],
    createdOnThisDay: [],
    hasMemories: false,
    displayDate: '',
  };

  const backLink = (
    <Link to="/loom" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', color: 'var(--bone-faint)', textDecoration: 'none', textTransform: 'uppercase' }}>← heirloom</Link>
  );

  return (
    <ClothShell topbarLeft={backLink} topbarCenter="memory cards">
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '48px 32px 64px',
        }}
      >
        {/* H1 */}
        <h1
          className="hl-serif"
          style={{
            fontSize: 36,
            fontWeight: 300,
            color: 'var(--bone)',
            margin: '0 0 28px',
          }}
        >
          Cards from the cloth.
        </h1>

        {/* Tab row */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            paddingBottom: 14,
            marginBottom: 36,
            borderBottom: '1px solid var(--rule)',
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
                borderBottom: '1px solid',
                borderColor: activeTab === t.value ? 'var(--warm)' : 'transparent',
                padding: '0 0 6px',
                cursor: 'pointer',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: activeTab === t.value ? 'var(--warm)' : 'var(--bone-faint)',
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => navigate('/loom/index')}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--warm)',
            }}
          >
            view the thread →
          </button>
        </div>

        {/* ── Create tab ── */}
        {activeTab === 'create' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 48,
              alignItems: 'start',
            }}
          >
            {/* Left — controls */}
            <div style={{ display: 'grid', gap: 32 }}>
              {/* Memory selection */}
              <section>
                <p
                  className="hl-eyebrow"
                  style={{ marginBottom: 16 }}
                >
                  1 — select a memory
                </p>
                <div style={{ maxHeight: 300, overflowY: 'auto', display: 'grid', gap: 1 }}>
                  {memories.length === 0 ? (
                    <p
                      className="hl-serif"
                      style={{ fontSize: 15, color: 'var(--bone-faint)', fontStyle: 'italic' }}
                    >
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
                          borderBottom: '1px solid var(--rule)',
                          padding: '14px 0',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'grid',
                          gap: 4,
                        }}
                      >
                        <span
                          className="hl-serif"
                          style={{
                            fontSize: 17,
                            fontWeight: 300,
                            color: selectedMemory === memory.id ? 'var(--warm)' : 'var(--bone)',
                            transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                          }}
                        >
                          {memory.title || 'Untitled Memory'}
                        </span>
                        {memory.description && (
                          <span
                            style={{
                              fontFamily: 'var(--serif)',
                              fontSize: 13,
                              color: 'var(--bone-dim)',
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
                <p className="hl-eyebrow" style={{ marginBottom: 16 }}>2 — choose a style</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {styles.map((style: CardStyle) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        padding: '12px 14px',
                        border: `1px solid ${selectedStyle === style.id ? 'var(--warm)' : 'var(--rule)'}`,
                        background: selectedStyle === style.id ? 'rgba(176,122,74,0.06)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                      }}
                    >
                      <p
                        className="hl-mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: selectedStyle === style.id ? 'var(--warm)' : 'var(--bone)',
                          margin: '0 0 4px',
                        }}
                      >
                        {style.name}
                      </p>
                      <p style={{ fontFamily: 'var(--serif)', fontSize: 12, color: 'var(--bone-faint)', margin: 0 }}>
                        {style.description}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Customize */}
              <section>
                <p className="hl-eyebrow" style={{ marginBottom: 16 }}>3 — customize</p>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label
                      className="hl-eyebrow"
                      style={{ display: 'block', marginBottom: 10, color: 'var(--bone-faint)' }}
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
                        border: '1px solid var(--rule)',
                        borderRadius: 2,
                        padding: '10px 14px',
                        color: 'var(--bone)',
                        fontFamily: 'var(--serif)',
                        fontSize: 15,
                        lineHeight: 1.7,
                        minHeight: 80,
                        resize: 'none',
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
                      style={{ width: 14, height: 14, accentColor: 'var(--warm)', cursor: 'pointer' }}
                    />
                    <span
                      className="hl-serif"
                      style={{ fontSize: 14, color: 'var(--bone-dim)' }}
                    >
                      Include photo if available
                    </span>
                  </label>
                </div>
              </section>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedMemory || generateMutation.isPending}
                className="hl-btn"
                style={{ opacity: !selectedMemory || generateMutation.isPending ? 0.45 : 1 }}
              >
                {generateMutation.isPending ? (
                  <span style={{ fontStyle: 'italic' }}>Weaving…</span>
                ) : (
                  'Generate card'
                )}
              </button>
            </div>

            {/* Right — preview */}
            <div>
              {genError && (
                <p style={{ color: 'var(--danger)', fontFamily: 'var(--mono)', fontSize: 11, margin: '8px 0' }}>
                  {genError}
                </p>
              )}
              {generatedCard ? (
                <div>
                  <p className="hl-eyebrow" style={{ marginBottom: 18 }}>Your card</p>

                  <div
                    style={{
                      border: '1px solid var(--rule)',
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
                          loading="lazy"
                          style={{ width: '100%', height: 192, objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    )}
                    <blockquote
                      style={{
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 19,
                        lineHeight: 1.6,
                        margin: '0 0 18px',
                        borderLeft: '2px solid var(--warm)',
                        paddingLeft: 16,
                      }}
                    >
                      "{generatedCard.quote}"
                    </blockquote>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 13, opacity: 0.7, margin: 0 }}>
                      — {generatedCard.authorName}
                      {generatedCard.memoryDate && <span> · {generatedCard.memoryDate}</span>}
                    </p>
                    <p
                      className="hl-mono"
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
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--rule)',
                        padding: '10px 18px',
                        cursor: 'pointer',
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-dim)',
                        transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1), color 180ms',
                      }}
                    >
                      {copied ? 'Link copied' : 'Copy share link'}
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(['twitter', 'facebook', 'whatsapp', 'linkedin'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleSocialShare(p, generatedCard.socialShareUrls[p])}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--rule)',
                            padding: '10px 18px',
                            cursor: 'pointer',
                            fontFamily: 'var(--mono)',
                            fontSize: 11,
                            letterSpacing: '0.12em',
                            textTransform: 'capitalize',
                            color: 'var(--bone-dim)',
                            transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                          }}
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
                    border: '1px solid var(--rule)',
                    padding: '64px 32px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    className="hl-serif"
                    style={{
                      fontSize: 28,
                      color: 'var(--warm)',
                      marginBottom: 14,
                    }}
                  >
                    ∞
                  </p>
                  <p
                    className="hl-serif"
                    style={{ fontSize: 15, color: 'var(--bone-faint)', fontStyle: 'italic' }}
                  >
                    Select a memory and style to generate your card.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Gallery tab ── */}
        {activeTab === 'gallery' && (
          <div>
            {cards.length === 0 ? (
              <div style={{ border: '1px solid var(--rule)', padding: '64px 32px', textAlign: 'center' }}>
                <p className="hl-eyebrow" style={{ marginBottom: 14 }}>No cards yet</p>
                <h2
                  className="hl-serif"
                  style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 24px', color: 'var(--bone)' }}
                >
                  Every thread has a quotable line. Find yours.
                </h2>
                <button type="button" onClick={() => setActiveTab('create')} className="hl-btn">
                  Create your first card
                </button>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cards.map((card: any, i: number) => (
                  <li
                    key={card.id}
                    style={{
                      borderTop: '1px solid var(--rule-strong)',
                      paddingTop: 22,
                      paddingBottom: 22,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {/* Dye swatch */}
                    <div
                      aria-hidden
                      style={{
                        width: 24,
                        height: 3,
                        background: dyeFor(i),
                      }}
                    />
                    {/* Entry */}
                    <p
                      className="hl-serif"
                      style={{
                        fontSize: 17,
                        fontWeight: 400,
                        fontStyle: 'italic',
                        color: 'var(--bone)',
                        margin: 0,
                      }}
                    >
                      {card.quote || card.memoryTitle || 'Untitled'}
                    </p>
                    {/* Date */}
                    {card.memoryDate && (
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.08em' }}
                      >
                        {card.memoryDate}
                      </span>
                    )}
                    {/* Author */}
                    {card.authorName && (
                      <span
                        className="hl-mono"
                        style={{ fontSize: 10, color: 'var(--bone-dim)', letterSpacing: '0.08em' }}
                      >
                        {card.authorName}
                      </span>
                    )}
                    {/* Print / share */}
                    <a
                      href={card.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hl-link warm"
                      style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}
                    >
                      print / share →
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── On This Day tab ── */}
        {activeTab === 'onthisday' && (
          <div>
            {onThisDay.displayDate && (
              <p
                className="hl-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'var(--warm)',
                  marginBottom: 32,
                }}
              >
                {onThisDay.displayDate}
              </p>
            )}

            {!onThisDay.hasMemories ? (
              <div style={{ border: '1px solid var(--rule)', padding: '64px 32px', textAlign: 'center' }}>
                <p className="hl-eyebrow" style={{ marginBottom: 14 }}>Nothing from this day yet</p>
                <h2
                  className="hl-serif"
                  style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: 0, color: 'var(--bone-dim)' }}
                >
                  Keep weaving. The anniversaries will come.
                </h2>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 48 }}>
                {onThisDay.memoriesFromThisDay.length > 0 && (
                  <section>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                      <span className="hl-eyebrow">From this day</span>
                      <hr
                        style={{
                          flex: 1,
                          border: 0,
                          borderTop: '1px solid var(--rule)',
                          margin: 0,
                        }}
                      />
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {onThisDay.memoriesFromThisDay.map((memory: OnThisDayMemory, i: number) => (
                        <li
                          key={memory.id}
                          style={{
                            borderTop: '1px solid var(--rule-strong)',
                            paddingTop: 22,
                            paddingBottom: 22,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          {/* Dye swatch */}
                          <div
                            aria-hidden
                            style={{ width: 24, height: 3, background: dyeFor(i) }}
                          />
                          {/* Entry */}
                          <p
                            className="hl-serif"
                            style={{
                              fontSize: 17,
                              fontWeight: 400,
                              fontStyle: 'italic',
                              color: 'var(--bone)',
                              margin: 0,
                            }}
                          >
                            {memory.title || 'Untitled Memory'}
                          </p>
                          {/* Date */}
                          <span
                            className="hl-mono"
                            style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.08em' }}
                          >
                            {memory.year} — {memory.yearsAgo}y ago
                          </span>
                          {/* Author / description as dim mono */}
                          {memory.description && (
                            <span
                              className="hl-mono"
                              style={{ fontSize: 10, color: 'var(--bone-dim)', letterSpacing: '0.04em' }}
                            >
                              {memory.description}
                            </span>
                          )}
                          {memory.photoUrl && (
                            <div
                              style={{ border: '1px solid var(--rule)', overflow: 'hidden', marginTop: 4 }}
                            >
                              <img
                                src={memory.photoUrl}
                                alt={memory.title}
                                loading="lazy"
                                style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                          )}
                          {/* Print / share */}
                          <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => { setSelectedMemory(memory.id); setActiveTab('create'); }}
                              className="hl-link warm"
                              style={{
                                background: 'transparent',
                                border: 0,
                                padding: 0,
                                cursor: 'pointer',
                                fontSize: 11,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                              }}
                            >
                              create card →
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/loom/read?entry=${memory.id}`)}
                              className="hl-link warm"
                              style={{
                                background: 'transparent',
                                border: 0,
                                padding: 0,
                                cursor: 'pointer',
                                fontSize: 11,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                              }}
                            >
                              view memory →
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {onThisDay.createdOnThisDay.length > 0 && (
                  <section>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                      <span className="hl-eyebrow">Created on this day</span>
                      <hr
                        style={{
                          flex: 1,
                          border: 0,
                          borderTop: '1px solid var(--rule)',
                          margin: 0,
                        }}
                      />
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {onThisDay.createdOnThisDay.map((memory: OnThisDayMemory, i: number) => (
                        <li
                          key={memory.id}
                          style={{
                            borderTop: '1px solid var(--rule-strong)',
                            paddingTop: 22,
                            paddingBottom: 22,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          {/* Dye swatch */}
                          <div
                            aria-hidden
                            style={{ width: 24, height: 3, background: dyeFor(i + 5) }}
                          />
                          {/* Entry */}
                          <p
                            className="hl-serif"
                            style={{
                              fontSize: 17,
                              fontWeight: 400,
                              fontStyle: 'italic',
                              color: 'var(--bone)',
                              margin: 0,
                            }}
                          >
                            {memory.title || 'Untitled Memory'}
                          </p>
                          {/* Date */}
                          <span
                            className="hl-mono"
                            style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.08em' }}
                          >
                            {memory.year} — {memory.yearsAgo}y ago
                          </span>
                          {/* Description */}
                          {memory.description && (
                            <span
                              className="hl-mono"
                              style={{ fontSize: 10, color: 'var(--bone-dim)', letterSpacing: '0.04em' }}
                            >
                              {memory.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ClothShell>
  );
}

export default MemoryCards;
