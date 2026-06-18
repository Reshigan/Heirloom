import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { type FamilyMember } from '../types';
import { UserMenu } from '../loom/components/Frame';
import { HLogo } from '../loom/components/HLogo';
import { familyApi } from '../services/api';
import api from '../services/api';
import { CosmicHeader, WarmDot, WaxSeal } from '../loom/cosmic/CosmicUI';

// ── Template options ────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'birthday',
    name: 'Birthday Message',
    description: 'A heartfelt message for their special day',
    defaultPrompt: 'What I want you to know on your birthday…',
  },
  {
    id: 'if-not-here',
    name: "If I'm Not Here",
    description: "Words of comfort for when you're gone",
    defaultPrompt: "If I'm not there to tell you this in person…",
  },
  {
    id: 'story',
    name: 'A Story You Should Know',
    description: 'Share a memory or life lesson',
    defaultPrompt: "There's a story I've never told you…",
  },
  {
    id: 'proud',
    name: "Why I'm Proud of You",
    description: 'Celebrate who they are',
    defaultPrompt: 'I want you to know how proud I am of you because…',
  },
];


interface PersonPrompt {
  id: string;
  prompt: string;
  category: string;
}

type WizardStep = 'person' | 'template' | 'type' | 'prompt' | 'create' | 'preview';
type ContentType = 'voice' | 'letter';

// ── Step metadata ───────────────────────────────────────────────────────────
const STEP_NUMBER: Record<WizardStep, number> = {
  person:   1,
  template: 2,
  type:     3,
  prompt:   4,
  create:   5,
  preview:  5,
};

const TOTAL_STEPS = 5;

// ── Step config (eyebrow + question + description) ─────────────────────────
function stepConfig(
  step: WizardStep,
  selectedPerson: FamilyMember | null,
): { eyebrow: string; question: string; description: string } {
  switch (step) {
    case 'person':
      return {
        eyebrow: 'who it is for',
        question: 'Who is this for?',
        description: 'Choose the person you want to leave a thread for.',
      };
    case 'template':
      return {
        eyebrow: 'the opening',
        question: 'What would you like to say?',
        description: `Pick a thread to get started quickly${selectedPerson ? ` for ${selectedPerson.name}` : ''}.`,
      };
    case 'type':
      return {
        eyebrow: 'the medium',
        question: 'How do you want to weave it?',
        description: 'Choose your medium.',
      };
    case 'prompt':
      return {
        eyebrow: 'the first line',
        question: 'Where to begin?',
        description: 'Pick a suggested beginning or write your own.',
      };
    case 'preview':
    case 'create':
      return {
        eyebrow: 'the review',
        question: 'Your thread is ready.',
        description: selectedPerson
          ? `Here is what ${selectedPerson.name} will receive.`
          : 'Review your thread before weaving.',
      };
  }
}

// ── Voice rings placeholder ─────────────────────────────────────────────────
function VoiceRings() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64 }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: 12 + i * 10,
            background: 'var(--bone-faint)',
            borderRadius: 0,
            animation: `hl-waveform 1400ms var(--ease) ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ── Hairline step progress (no spinner; mono caption optional) ──────────────
function StepProgress({ current, total, label }: { current: number; total: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, current / total)) * 100;
  return (
    <div style={{ marginBottom: 26 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {Array.from({ length: total }).map((_, i) => (
            <WarmDot
              key={i}
              size={5}
              filled={i < current}
              color={i < current ? 'var(--warm)' : 'var(--bone-faint)'}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--bone-faint)',
          }}
        >
          {label ?? `step ${current} of ${total}`}
        </span>
      </div>
      <div style={{ height: 1, background: 'var(--rule)', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${pct}%`,
            background: 'var(--warm)',
            transition: 'width 360ms var(--ease)',
          }}
        />
      </div>
    </div>
  );
}

// ── Hairline indeterminate bar (loading; never a spinner) ───────────────────
function LoadingBar({ label }: { label?: string }) {
  return (
    <div style={{ paddingTop: 28 }}>
      <div
        style={{
          height: 1,
          background: 'var(--rule)',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: 160,
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
            animation: 'loom-shuttle var(--dur-ceremony) var(--ease) infinite',
          }}
        />
      </div>
      {label && (
        <p
          className="hl-mono"
          style={{ fontSize: 10, color: 'var(--bone-dim)', marginTop: 10, letterSpacing: '0.1em' }}
        >
          {label}
        </p>
      )}
    </div>
  );
}

// ── Selection row (composer idiom — flat, hairline-ruled, serif label) ──────
function SelectRow({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        width: '100%',
        padding: '15px 0',
        minHeight: 44,
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--rule)',
        cursor: 'pointer',
        textAlign: 'left',
        gap: 16,
      }}
    >
      <span>
        <span
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 19,
            lineHeight: 1.3,
            color: selected ? 'var(--warm)' : 'var(--bone)',
            display: 'block',
            fontWeight: 400,
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 13,
              color: 'var(--bone-dim)',
              display: 'block',
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {sub}
          </span>
        )}
      </span>
      {selected && (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--warm)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          selected
        </span>
      )}
    </button>
  );
}

// ── Preview summary row ─────────────────────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 24, alignItems: 'baseline', padding: '12px 0' }}>
        <span
          className="hl-mono"
          style={{ fontSize: 10, color: 'var(--bone-dim)', letterSpacing: '0.22em', textTransform: 'uppercase', minWidth: 72 }}
        >
          {label}
        </span>
        <span className="hl-serif" style={{ fontSize: 15, color: 'var(--bone)', fontWeight: 400 }}>
          {value}
        </span>
      </div>
      <hr className="hl-rule" />
    </>
  );
}

// ── Mono warm pill / mono text action (composer action bar) ─────────────────
function ActionPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--warm)',
        background: 'transparent',
        border: '1px solid var(--warm)',
        borderRadius: 0,
        padding: '13px 26px',
        minHeight: 44,
        cursor: 'pointer',
        transition: 'color 180ms var(--ease), border-color 180ms var(--ease)',
      }}
    >
      {label}
    </button>
  );
}

function MonoTextAction({ label, onClick, color = 'var(--bone-faint)' }: { label: string; onClick: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color,
        background: 'none',
        border: 'none',
        padding: 0,
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function QuickWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<WizardStep>('person');
  const [selectedPerson, setSelectedPerson] = useState<FamilyMember | null>(null);
  const [_selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  void _selectedTemplate;
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<PersonPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const preselectedPersonId = searchParams.get('for');
  const preselectedPrompt = searchParams.get('prompt');

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then((r) => r.data),
  });

  useEffect(() => {
    if (family && preselectedPersonId) {
      const person = family.find((m: FamilyMember) => m.id === preselectedPersonId);
      if (person) {
        setSelectedPerson(person);
        if (preselectedPrompt) {
          setSelectedPrompt(decodeURIComponent(preselectedPrompt));
          setStep('type');
        } else {
          setStep('type');
        }
      }
    }
  }, [family, preselectedPersonId, preselectedPrompt]);

  useEffect(() => {
    if (selectedPerson && step === 'prompt') {
      fetchPrompts();
    }
  }, [selectedPerson, step]);

  const fetchPrompts = async () => {
    if (!selectedPerson) return;
    setLoadingPrompts(true);
    setPromptError(null);
    try {
      const response = await api.get(`/ai/person-prompts/${selectedPerson.id}`);
      setPrompts(response.data.prompts || []);
    } catch {
      setPromptError('Could not load suggested beginnings. You can still write your own.');
    }
    setLoadingPrompts(false);
  };

  const handlePersonSelect = (person: FamilyMember) => {
    setSelectedPerson(person);
    setStep('template');
  };

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setSelectedPrompt(template.defaultPrompt);
    setStep('type');
  };

  const handleTypeSelect = (type: ContentType) => {
    setContentType(type);
    if (selectedPrompt) {
      setStep('preview');
    } else {
      setStep('prompt');
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt);
    setStep('preview');
  };

  const handleCreate = () => {
    if (!selectedPerson || !contentType) return;
    const params = new URLSearchParams();
    if (selectedPrompt) params.set('prompt', selectedPrompt);
    // Both Record and Compose read `recipientId`; Compose also reads `forName`.
    // (Emitting `for` left the recipient unset on the voice path.)
    params.set('recipientId', selectedPerson.id);
    params.set('forName', selectedPerson.name);
    if (contentType === 'voice') {
      navigate(`/record?${params.toString()}`);
    } else {
      navigate(`/compose?${params.toString()}`);
    }
  };

  const goBack = () => {
    switch (step) {
      case 'template':
        setStep('person');
        setSelectedPerson(null);
        break;
      case 'type':
        setStep('template');
        setSelectedTemplate(null);
        break;
      case 'prompt':
        setStep('type');
        setContentType(null);
        break;
      case 'preview':
        if (selectedPrompt && !preselectedPrompt) {
          setStep('prompt');
          setSelectedPrompt(null);
        } else {
          setStep('type');
          setContentType(null);
        }
        break;
    }
  };

  const currentStep = STEP_NUMBER[step];
  const { eyebrow, question, description } = stepConfig(step, selectedPerson);
  const familyMembers = Array.isArray(family) ? family : [];
  const canGoBack = step !== 'person';
  const isReview = step === 'preview' || step === 'create';

  return (
    <ClothShell
      topbarLeft={<HLogo size="sm" wordmark />}
      topbarCenter="quick start"
      topbarRight={<UserMenu />}
    >
      {/* ── Centered content area ───────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)',
          overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: 'var(--page-max-focus)', width: '100%' }}>

          {/* Hairline step progress — the wizard's only progress mechanism */}
          <StepProgress current={currentStep} total={TOTAL_STEPS} />

          {/* Step prompt — mono eyebrow (step context) + giant serif prompt */}
          <CosmicHeader eyebrow={eyebrow} title={question} sub={description} />

          {/* ── Input area ─────────────────────────────────────────────── */}
          <div style={{ marginTop: 4 }}>

            {/* Step 1: person */}
            {step === 'person' && (
              <>
                {familyLoading ? (
                  <LoadingBar label="loading…" />
                ) : familyMembers.length === 0 ? (
                  <div style={{ paddingTop: 20 }}>
                    <p
                      style={{
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 16,
                        color: 'var(--bone-dim)',
                        marginBottom: 22,
                        lineHeight: 1.55,
                      }}
                    >
                      No bloodline members yet.
                    </p>
                    <ActionPill label="add family member →" onClick={() => navigate('/family')} />
                  </div>
                ) : (
                  <div style={{ textAlign: 'left' }}>
                    {familyMembers.map((person: FamilyMember) => (
                      <SelectRow
                        key={person.id}
                        label={person.name}
                        sub={person.relationship ?? undefined}
                        onClick={() => handlePersonSelect(person)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 2: template */}
            {step === 'template' && (
              <div style={{ textAlign: 'left' }}>
                {TEMPLATES.map((template) => (
                  <SelectRow
                    key={template.id}
                    label={template.name}
                    sub={template.description}
                    onClick={() => handleTemplateSelect(template)}
                  />
                ))}
              </div>
            )}

            {/* Step 3: type (voice / letter) */}
            {step === 'type' && (
              <div style={{ textAlign: 'left' }}>
                <SelectRow
                  label="Voice"
                  sub="a personal recording — ≈ 60 seconds"
                  selected={contentType === 'voice'}
                  onClick={() => handleTypeSelect('voice')}
                />
                <SelectRow
                  label="Written letter"
                  sub="a composed thread — ≈ 5 minutes"
                  selected={contentType === 'letter'}
                  onClick={() => handleTypeSelect('letter')}
                />
              </div>
            )}

            {/* Step 4: prompt */}
            {step === 'prompt' && (
              <>
                {loadingPrompts ? (
                  <LoadingBar label="the Listener is thinking…" />
                ) : (
                  <>
                    {/* Prompt fetch error — inline mono line, never red/toast */}
                    {promptError && (
                      <p
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          color: 'var(--warm)',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          marginBottom: 16,
                        }}
                      >
                        {promptError}
                      </p>
                    )}

                    {/* Voice rings if voice type */}
                    {contentType === 'voice' && (
                      <div style={{ marginBottom: 24 }}>
                        <VoiceRings />
                      </div>
                    )}

                    {/* Flat serif input for custom prompt (letter type) */}
                    {contentType === 'letter' && (
                      <input
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="write your own beginning…"
                        aria-label="Your own beginning"
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--rule)',
                          outline: 'none',
                          fontSize: 'clamp(20px, 3.4vw, 26px)',
                          fontWeight: 400,
                          color: 'var(--bone)',
                          caretColor: 'var(--warm)',
                          padding: '10px 0',
                          fontFamily: 'var(--serif)',
                          lineHeight: 1.3,
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customPrompt.trim()) {
                            handlePromptSelect(customPrompt.trim());
                          }
                        }}
                      />
                    )}

                    {/* Suggested beginnings */}
                    {prompts.length > 0 && (
                      <div style={{ marginTop: 24, textAlign: 'left' }}>
                        <p
                          className="hl-mono"
                          style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', marginBottom: 8, textTransform: 'uppercase' }}
                        >
                          suggested beginnings
                        </p>
                        {prompts.map((prompt) => (
                          <button
                            key={prompt.id}
                            type="button"
                            onClick={() => handlePromptSelect(prompt.prompt)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '14px 0',
                              minHeight: 44,
                              background: 'none',
                              border: 'none',
                              borderBottom: '1px solid var(--rule)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <span
                              style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--bone-dim)', fontSize: 17, fontWeight: 400, lineHeight: 1.45 }}
                            >
                              “{prompt.prompt}”
                            </span>
                            <span
                              className="hl-mono"
                              style={{
                                display: 'block',
                                fontSize: 9,
                                color: 'var(--bone-faint)',
                                letterSpacing: '0.14em',
                                marginTop: 4,
                                textTransform: 'uppercase',
                              }}
                            >
                              {prompt.category}
                            </span>
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => handlePromptSelect('')}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '14px 0',
                            minHeight: 44,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            style={{ fontFamily: 'var(--serif)', color: 'var(--bone-faint)', fontSize: 17, fontWeight: 400 }}
                          >
                            I'll write my own thread
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Action bar: NEXT for custom prompt (letter) */}
                    {contentType === 'letter' && customPrompt.trim() && (
                      <div style={{ marginTop: 26 }}>
                        <ActionPill label="next →" onClick={() => handlePromptSelect(customPrompt.trim())} />
                      </div>
                    )}

                    {/* Action bar: NEXT for voice (proceed without custom text) */}
                    {contentType === 'voice' && (
                      <div style={{ marginTop: 26 }}>
                        <ActionPill label="next →" onClick={() => handlePromptSelect('')} />
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Step 5: review / preview */}
            {isReview && (
              <div style={{ textAlign: 'left' }}>
                <hr className="hl-rule" />
                {selectedPerson && (
                  <SummaryRow
                    label="for"
                    value={
                      <>
                        {selectedPerson.name}
                        {selectedPerson.relationship && (
                          <span style={{ color: 'var(--bone-faint)', marginLeft: 8 }}>
                            · {selectedPerson.relationship}
                          </span>
                        )}
                      </>
                    }
                  />
                )}
                <SummaryRow
                  label="medium"
                  value={contentType === 'voice' ? 'voice recording' : 'written letter'}
                />
                {selectedPrompt && (
                  <SummaryRow
                    label="prompt"
                    value={
                      <span style={{ fontStyle: 'italic', color: 'var(--bone-dim)' }}>
                        “{selectedPrompt}”
                      </span>
                    }
                  />
                )}
                {selectedPerson && (
                  <SummaryRow
                    label="reply"
                    value={
                      <span style={{ color: 'var(--bone-dim)', fontSize: 13 }}>
                        {selectedPerson.name} can respond after viewing
                      </span>
                    }
                  />
                )}

                {/* Action bar: FINISH → record / write */}
                <div style={{ marginTop: 26 }}>
                  <ActionPill
                    label={contentType === 'voice' ? 'start recording →' : 'start writing →'}
                    onClick={handleCreate}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <MonoTextAction
                    label="schedule for a milestone instead →"
                    onClick={() => navigate('/life-events')}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Bottom action bar: BACK (mono text) ──────────────────────── */}
          {canGoBack && (
            <div style={{ marginTop: 22 }}>
              <MonoTextAction label="← back" onClick={goBack} />
            </div>
          )}

          {/* The ∞ rests warm at the foot of the review page */}
          {isReview && (
            <div style={{ marginTop: 44 }}>
              <WaxSeal size={26} />
            </div>
          )}
        </div>
      </div>

    </ClothShell>
  );
}
