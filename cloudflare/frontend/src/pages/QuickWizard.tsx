import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { UserMenu } from '../loom/components/Frame';
import { HLogo } from '../loom/components/HLogo';
import { familyApi } from '../services/api';
import api from '../services/api';

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


interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  avatarUrl?: string;
}

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

// ── Step config (question + description) ───────────────────────────────────
function stepConfig(
  step: WizardStep,
  selectedPerson: FamilyMember | null,
): { question: string; description: string } {
  switch (step) {
    case 'person':
      return {
        question: 'Who is this for?',
        description: 'Choose the person you want to leave a thread for.',
      };
    case 'template':
      return {
        question: 'What would you like to say?',
        description: `Pick a thread to get started quickly${selectedPerson ? ` for ${selectedPerson.name}` : ''}.`,
      };
    case 'type':
      return {
        question: 'How do you want to weave it?',
        description: 'Choose your medium.',
      };
    case 'prompt':
      return {
        question: 'Where to begin?',
        description: 'Pick a suggested beginning or write your own.',
      };
    case 'preview':
    case 'create':
      return {
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
            animation: `hl-waveform 1400ms cubic-bezier(0.16,1,0.3,1) ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ── Hairline loading bar ────────────────────────────────────────────────────
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
            animation: 'loom-shuttle 1.4s cubic-bezier(0.16,1,0.3,1) infinite',
          }}
        />
      </div>
      {label && (
        <p
          className="hl-mono"
          style={{ fontSize: 10, color: 'var(--bone-faint)', marginTop: 10, letterSpacing: '0.1em' }}
        >
          {label}
        </p>
      )}
    </div>
  );
}

// ── Selection row ───────────────────────────────────────────────────────────
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
        padding: '14px 0',
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
          className="hl-serif"
          style={{
            fontSize: 16,
            color: selected ? 'var(--warm)' : 'var(--bone)',
            display: 'block',
            fontWeight: 400,
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            className="hl-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.06em',
              display: 'block',
              marginTop: 3,
            }}
          >
            {sub}
          </span>
        )}
      </span>
      {selected && (
        <span
          className="hl-mono"
          style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.16em', flexShrink: 0 }}
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
          style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', textTransform: 'uppercase', minWidth: 72 }}
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
    params.set('for', selectedPerson.id);
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
  const { question, description } = stepConfig(step, selectedPerson);
  const familyMembers = Array.isArray(family) ? family : [];
  const canGoBack = step !== 'person';

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
          padding: '80px 32px',
          overflowY: 'auto',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 540, width: '100%' }}>

          {/* Step indicator */}
          <p
            className="hl-mono"
            style={{
              fontSize: 10,
              color: 'var(--bone-faint)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            step {currentStep} of {TOTAL_STEPS}
          </p>

          {/* Step question */}
          <h2
            className="hl-serif"
            style={{
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: '-0.012em',
              color: 'var(--bone)',
              margin: 0,
            }}
          >
            {question}
          </h2>

          {/* Step description */}
          <p
            className="hl-prose"
            style={{
              fontSize: 14.5,
              color: 'var(--bone-dim)',
              marginTop: 14,
              marginBottom: 0,
              lineHeight: 1.6,
              maxWidth: '100%',
            }}
          >
            {description}
          </p>

          {/* ── Input area ─────────────────────────────────────────────── */}
          <div style={{ marginTop: 28 }}>

            {/* Step 1: person */}
            {step === 'person' && (
              <>
                {familyLoading ? (
                  <LoadingBar label="loading…" />
                ) : familyMembers.length === 0 ? (
                  <div style={{ paddingTop: 20 }}>
                    <p
                      className="hl-prose"
                      style={{ fontSize: 14.5, color: 'var(--bone-dim)', marginBottom: 22 }}
                    >
                      No bloodline members yet.
                    </p>
                    <button type="button" onClick={() => navigate('/family')} className="hl-btn">
                      add family member
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'left' }}>
                    {familyMembers.map((person: FamilyMember) => (
                      <SelectRow
                        key={person.id}
                        label={person.name}
                        sub={person.relationship}
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
                    {/* Prompt fetch error */}
                    {promptError && (
                      <p
                        className="hl-mono"
                        style={{
                          fontSize: 10,
                          color: 'var(--danger)',
                          letterSpacing: '0.1em',
                          marginBottom: 16,
                          fontStyle: 'italic',
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

                    {/* Text input for custom prompt (letter type) */}
                    {contentType === 'letter' && (
                      <input
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="write your own beginning…"
                        className="hl-serif"
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--rule)',
                          outline: 'none',
                          fontSize: 20,
                          fontWeight: 400,
                          color: 'var(--bone)',
                          padding: '8px 0',
                          fontFamily: 'var(--serif)',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customPrompt.trim()) {
                            handlePromptSelect(customPrompt.trim());
                          }
                        }}
                      />
                    )}

                    {/* Progress bar placeholder */}
                    {prompts.length > 0 && (
                      <div style={{ marginTop: 24, textAlign: 'left' }}>
                        <p
                          className="hl-mono"
                          style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.22em', marginBottom: 8 }}
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
                              background: 'none',
                              border: 'none',
                              borderBottom: '1px solid var(--rule)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <span
                              className="hl-serif"
                              style={{ fontStyle: 'italic', color: 'var(--bone-dim)', fontSize: 15, fontWeight: 400 }}
                            >
                              "{prompt.prompt}"
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
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span
                            className="hl-serif"
                            style={{ color: 'var(--bone-faint)', fontSize: 15, fontWeight: 400 }}
                          >
                            I'll write my own thread
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Next button for custom prompt (letter) */}
                    {contentType === 'letter' && customPrompt.trim() && (
                      <button
                        type="button"
                        onClick={() => handlePromptSelect(customPrompt.trim())}
                        className="hl-btn"
                        style={{ marginTop: 22 }}
                      >
                        next →
                      </button>
                    )}

                    {/* Voice: proceed without custom text */}
                    {contentType === 'voice' && (
                      <button
                        type="button"
                        onClick={() => handlePromptSelect('')}
                        className="hl-btn"
                        style={{ marginTop: 22 }}
                      >
                        next →
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* Step 5: preview */}
            {(step === 'preview' || step === 'create') && (
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
                        "{selectedPrompt}"
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

                <button type="button" onClick={handleCreate} className="hl-btn" style={{ marginTop: 22 }}>
                  {contentType === 'voice' ? 'start recording →' : 'start writing →'}
                </button>

                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => navigate('/life-events')}
                    className="hl-mono"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--bone-faint)',
                      fontSize: 10,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      padding: 0,
                    }}
                  >
                    schedule for a milestone instead →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Back link ────────────────────────────────────────────────── */}
          {canGoBack && (
            <button
              type="button"
              onClick={goBack}
              className="hl-mono"
              style={{
                marginTop: 14,
                fontSize: 10,
                color: 'var(--bone-faint)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              ← back
            </button>
          )}
        </div>
      </div>

    </ClothShell>
  );
}
