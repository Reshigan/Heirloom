import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoryCardsApi, memoriesApi } from '../services/api';
import { ClothShell } from '../loom/components/ClothShell';
import { CosmicHeader, EntryRow, SectionLabel, WaxSeal } from '../loom/cosmic/CosmicUI';
import { dyeForId } from '../loom/dye';

interface CardStyle {
  id: string;
  name: string;
  description: string;
}

interface GeneratedCard {
  id: string;
  style: string;
  quote: string;
  photoUrl: string | null;
  authorName: string;
  memoryDate: string | null;
  memoryTitle: string;
  shareUrl: string; // served woven-card image URL — the artifact, not a broadcast feed
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
  const [genError, setGenError] = useState<string | null>(null);
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

  const handleGenerate = () => {
    if (selectedMemory) generateMutation.mutate();
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
          maxWidth: 'var(--page-max-reading)',
          margin: '0 auto',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
        }}
      >
        {/* H1 */}
        <CosmicHeader
          eyebrow={`${cards.length} ${cards.length === 1 ? 'card' : 'cards'} woven`}
          title="Cards from the Deep."
        />

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
          <div
            role="tablist"
            aria-label="Memory cards views"
            style={{ display: 'flex', gap: 24 }}
            onKeyDown={(e) => {
              const i = TABS.findIndex((t) => t.value === activeTab);
              let next = i;
              if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
              else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
              else if (e.key === 'Home') next = 0;
              else if (e.key === 'End') next = TABS.length - 1;
              else return;
              e.preventDefault();
              setActiveTab(TABS[next].value);
              (document.getElementById(`tab-${TABS[next].value}`) as HTMLElement | null)?.focus();
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                id={`tab-${t.value}`}
                aria-controls={`tabpanel-${t.value}`}
                aria-selected={activeTab === t.value}
                tabIndex={activeTab === t.value ? 0 : -1}
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
                  transition: 'color 180ms var(--ease)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
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
            role="tabpanel"
            id="tabpanel-create"
            aria-labelledby="tab-create"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
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
                <div
                  role="radiogroup"
                  aria-label="Select a memory"
                  style={{ maxHeight: 300, overflowY: 'auto', display: 'grid', gap: 1 }}
                  onKeyDown={(e) => {
                    if (memories.length === 0) return;
                    const i = memories.findIndex((m: any) => m.id === selectedMemory);
                    let next = i;
                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1 + memories.length) % memories.length;
                    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + memories.length) % memories.length;
                    else if (e.key === 'Home') next = 0;
                    else if (e.key === 'End') next = memories.length - 1;
                    else return;
                    e.preventDefault();
                    setSelectedMemory(memories[next].id);
                    (document.getElementById(`mem-${memories[next].id}`) as HTMLElement | null)?.focus();
                  }}
                >
                  {memories.length === 0 ? (
                    <p
                      className="hl-serif"
                      style={{ fontSize: 15, color: 'var(--bone-faint)', fontStyle: 'italic' }}
                    >
                      No memories yet.
                    </p>
                  ) : (
                    memories.map((memory: any, mi: number) => (
                      <button
                        key={memory.id}
                        type="button"
                        id={`mem-${memory.id}`}
                        role="radio"
                        aria-checked={selectedMemory === memory.id}
                        tabIndex={selectedMemory === memory.id || (selectedMemory === null && mi === 0) ? 0 : -1}
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
                            fontWeight: selectedMemory === memory.id ? 500 : 300,
                            fontStyle: selectedMemory === memory.id ? 'italic' : 'normal',
                            color: selectedMemory === memory.id ? 'var(--warm)' : 'var(--bone)',
                            transition: 'color 180ms var(--ease)',
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
                <div
                  role="radiogroup"
                  aria-label="Choose a style"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
                  onKeyDown={(e) => {
                    if (styles.length === 0) return;
                    const i = styles.findIndex((s: CardStyle) => s.id === selectedStyle);
                    let next = i < 0 ? 0 : i;
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1 + styles.length) % styles.length;
                    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + styles.length) % styles.length;
                    else if (e.key === 'Home') next = 0;
                    else if (e.key === 'End') next = styles.length - 1;
                    else return;
                    e.preventDefault();
                    setSelectedStyle(styles[next].id);
                    (document.getElementById(`style-${styles[next].id}`) as HTMLElement | null)?.focus();
                  }}
                >
                  {styles.map((style: CardStyle, i: number) => (
                    <button
                      key={style.id}
                      type="button"
                      id={`style-${style.id}`}
                      role="radio"
                      aria-checked={selectedStyle === style.id}
                      tabIndex={selectedStyle === style.id ? 0 : (!styles.some((s: CardStyle) => s.id === selectedStyle) && i === 0 ? 0 : -1)}
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        padding: '12px 14px',
                        border: `1px solid ${selectedStyle === style.id ? 'var(--warm)' : 'var(--rule)'}`,
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 180ms var(--ease)',
                      }}
                    >
                      <p
                        className="hl-mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: selectedStyle === style.id ? 'var(--warm)' : 'var(--bone)',
                          fontWeight: selectedStyle === style.id ? 700 : 400,
                          textDecoration: selectedStyle === style.id ? 'underline' : 'none',
                          margin: '0 0 4px',
                        }}
                      >
                        {style.name}
                      </p>
                      <p style={{ fontFamily: 'var(--serif)', fontSize: 12, lineHeight: 1.45, color: 'var(--bone-dim)', margin: 0 }}>
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
                      aria-label="Custom quote"
                      placeholder="Leave empty to auto-extract from memory…"
                      maxLength={200}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid var(--rule)',
                        borderRadius: 0,
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
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {/* ponytail: custom 1px-stroke square — native checkbox painted a UA fill + checkmark glyph (no-icon/hairline law) */}
                    <input
                      type="checkbox"
                      checked={includePhoto}
                      onChange={(e) => setIncludePhoto(e.target.checked)}
                      style={{ position: 'absolute', opacity: 0, width: 14, height: 14, margin: 0, cursor: 'pointer' }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        width: 14,
                        height: 14,
                        flexShrink: 0,
                        border: '1px solid var(--bone-dim)',
                        background: includePhoto ? 'var(--bone-dim)' : 'transparent',
                        transition: 'background 180ms var(--ease)',
                      }}
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
                <p role="alert" aria-live="assertive" style={{ color: 'var(--warm)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '8px 0' }}>
                  {genError}
                </p>
              )}
              {generatedCard ? (
                <div>
                  <p className="hl-eyebrow" style={{ marginBottom: 18 }}>Your card</p>

                  {/* On-screen preview rides theme tokens so it tracks paper/vault.
                      The raw worker hex (bg/text colors) is reserved for the
                      exported/served share image only — baking it here would
                      paint a fixed-dark slab on the paper ground that never flips. */}
                  <div
                    style={{
                      border: '1px solid var(--rule)',
                      padding: 32,
                      marginBottom: 24,
                      background: 'var(--ink-card)',
                      color: 'var(--bone)',
                    }}
                  >
                    {generatedCard.photoUrl && (
                      <div
                        style={{
                          border: '1px solid var(--rule-strong)',
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
                        borderLeft: '1px solid var(--warm)',
                        paddingLeft: 16,
                      }}
                    >
                      "{generatedCard.quote}"
                    </blockquote>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: 13, color: 'var(--bone-dim)', margin: 0 }}>
                      — {generatedCard.authorName}
                      {generatedCard.memoryDate && <span> · {generatedCard.memoryDate}</span>}
                    </p>
                    <p
                      className="hl-mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        marginTop: 16,
                        color: 'var(--bone-faint)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Heirloom
                    </p>
                  </div>

                  {/* The woven card image — kept within the bloodline, not broadcast.
                      Opens the served artifact so a kin can save or print it. */}
                  <div style={{ display: 'grid', gap: 8 }}>
                    <a
                      href={generatedCard.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        border: '1px solid var(--rule)',
                        padding: '10px 18px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-dim)',
                        transition: 'border-color 180ms var(--ease), color 180ms var(--ease)',
                      }}
                    >
                      Open the card image
                    </a>
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
          <div role="tabpanel" id="tabpanel-gallery" aria-labelledby="tab-gallery">
            {cards.length === 0 ? (
              <div style={{ border: '1px solid var(--rule)', padding: '64px 32px', textAlign: 'center' }}>
                <p className="hl-eyebrow" style={{ marginBottom: 14 }}>No cards yet</p>
                <h2
                  style={{ fontFamily: 'var(--serif-display)', fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 24px', color: 'var(--bone)' }}
                >
                  Every thread has a quotable line. Find yours.
                </h2>
                <button type="button" onClick={() => setActiveTab('create')} className="hl-btn">
                  Create your first card
                </button>
              </div>
            ) : (
              <div>
                {cards.map((card: any) => (
                  <EntryRow
                    key={card.id}
                    title={card.quote || card.memoryTitle || 'Untitled'}
                    year={card.memoryDate || undefined}
                    author={card.authorName || undefined}
                    dye={dyeForId(card.id)}
                    onClick={() => window.open(card.shareUrl, '_blank', 'noopener,noreferrer')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── On This Day tab ── */}
        {activeTab === 'onthisday' && (
          <div role="tabpanel" id="tabpanel-onthisday" aria-labelledby="tab-onthisday">
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
                <p
                  className="hl-serif"
                  style={{ fontSize: 22, fontWeight: 300, fontStyle: 'italic', margin: 0, color: 'var(--bone-dim)' }}
                >
                  Keep weaving. The anniversaries will come.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 48 }}>
                {onThisDay.memoriesFromThisDay.length > 0 && (
                  <section>
                    <SectionLabel>From this day</SectionLabel>
                    <div>
                      {onThisDay.memoriesFromThisDay.map((memory: OnThisDayMemory) => (
                        <div key={memory.id}>
                          <EntryRow
                            title={memory.title || 'Untitled Memory'}
                            sub={memory.description || undefined}
                            year={`${memory.year} · ${memory.yearsAgo}y ago`}
                            dye={dyeForId(memory.id)}
                            onClick={() => navigate(`/loom/read?entry=${memory.id}`)}
                          />
                          {memory.photoUrl && (
                            <div style={{ border: '1px solid var(--rule)', overflow: 'hidden', margin: '12px 0 4px' }}>
                              <img
                                src={memory.photoUrl}
                                alt={memory.title}
                                loading="lazy"
                                style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                          )}
                          {/* Quiet mono affordances */}
                          <div style={{ display: 'flex', gap: 28, margin: '8px 0 4px' }}>
                            <button
                              type="button"
                              onClick={() => { setSelectedMemory(memory.id); setActiveTab('create'); }}
                              className="hl-link warm"
                              style={{
                                background: 'transparent',
                                border: 0,
                                padding: 0,
                                cursor: 'pointer',
                                fontFamily: 'var(--mono)',
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
                                fontFamily: 'var(--mono)',
                                fontSize: 11,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                              }}
                            >
                              view memory →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {onThisDay.createdOnThisDay.length > 0 && (
                  <section>
                    <SectionLabel>Created on this day</SectionLabel>
                    <div>
                      {onThisDay.createdOnThisDay.map((memory: OnThisDayMemory) => (
                        <EntryRow
                          key={memory.id}
                          title={memory.title || 'Untitled Memory'}
                          sub={memory.description || undefined}
                          year={`${memory.year} · ${memory.yearsAgo}y ago`}
                          dye={dyeForId(memory.id)}
                          onClick={() => navigate(`/loom/read?entry=${memory.id}`)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* The seal at the foot of the page */}
        <div style={{ marginTop: 72 }}>
          <WaxSeal />
        </div>
      </div>
    </ClothShell>
  );
}

export default MemoryCards;
