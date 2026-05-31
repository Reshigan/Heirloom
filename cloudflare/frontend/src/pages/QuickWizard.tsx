import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { familyApi } from '../services/api';

// Template options for quick start
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
    description: 'Words of comfort for when you\'re gone',
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
    name: 'Why I\'m Proud of You',
    description: 'Celebrate who they are',
    defaultPrompt: 'I want you to know how proud I am of you because…',
  },
];

// @ts-ignore - Vite env types
const API_URL = import.meta.env?.VITE_API_URL || 'https://api.heirloom.blue';

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

/* ─── Hairline progress track ──────────────────────────────── */
function StepTrack({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <p
        className="loom-mono"
        style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', marginBottom: 10 }}
      >
        step {current} of {total}
      </p>
      <div style={{ height: 1, background: 'var(--loom-rule)', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${(current / total) * 100}%`,
            background: 'var(--loom-warm)',
            transition: 'width 360ms var(--loom-ease)',
          }}
        />
      </div>
    </div>
  );
}

/* ─── Selection row ─────────────────────────────────────────── */
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
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 0',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--loom-rule)',
        cursor: 'pointer',
        textAlign: 'left',
        gap: 16,
      }}
    >
      <span>
        <span
          className="loom-body"
          style={{
            fontSize: 16,
            color: selected ? 'var(--loom-warm)' : 'var(--loom-bone)',
            display: 'block',
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            className="loom-mono"
            style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em', display: 'block', marginTop: 3 }}
          >
            {sub}
          </span>
        )}
      </span>
      {selected && (
        <span
          className="loom-mono"
          style={{ fontSize: 10, color: 'var(--loom-warm)', letterSpacing: '0.16em', flexShrink: 0 }}
        >
          selected
        </span>
      )}
    </button>
  );
}

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

  const preselectedPersonId = searchParams.get('for');
  const preselectedPrompt = searchParams.get('prompt');

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
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
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/ai/person-prompts/${selectedPerson.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
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

  const stepNumber = {
    person: 1,
    template: 2,
    type: 3,
    prompt: 4,
    create: 5,
    preview: 5,
  };

  const familyMembers = Array.isArray(family) ? family : [];

  return (
    <AppFrame>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <StepTrack current={stepNumber[step]} total={5} />

        {/* Step 1: Select Person */}
        {step === 'person' && (
          <div>
            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>begin a thread</p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}
            >
              Who is this for?
            </h1>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', marginBottom: 48, maxWidth: 440 }}>
              Choose the person you want to leave a thread for.
            </p>

            {familyLoading ? (
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
                <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 10, letterSpacing: '0.1em' }}>
                  loading…
                </p>
              </div>
            ) : familyMembers.length === 0 ? (
              <div style={{ paddingTop: 40 }}>
                <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', marginBottom: 24 }}>
                  No bloodline members yet.
                </p>
                <button
                  onClick={() => navigate('/family')}
                  className="loom-btn"
                >
                  add family member
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 0 }}>
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
          </div>
        )}

        {/* Step 2: Select Template */}
        {step === 'template' && (
          <div>
            <button
              onClick={goBack}
              className="loom-mono"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--loom-bone-faint)',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 32,
                padding: 0,
              }}
            >
              ← back
            </button>

            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>
              for {selectedPerson?.name}
            </p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}
            >
              What would you like to say?
            </h1>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', marginBottom: 48, maxWidth: 440 }}>
              Pick a thread to get started quickly.
            </p>

            <div style={{ display: 'grid', gap: 0 }}>
              {TEMPLATES.map((template) => (
                <SelectRow
                  key={template.id}
                  label={template.name}
                  sub={template.description}
                  onClick={() => handleTemplateSelect(template)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Type */}
        {step === 'type' && (
          <div>
            <button
              onClick={goBack}
              className="loom-mono"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--loom-bone-faint)',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 32,
                padding: 0,
              }}
            >
              ← back
            </button>

            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>
              for {selectedPerson?.name}
            </p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}
            >
              How do you want to weave it?
            </h1>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', marginBottom: 48, maxWidth: 440 }}>
              Choose your medium.
            </p>

            <div style={{ display: 'grid', gap: 0 }}>
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
          </div>
        )}

        {/* Step 4: Select Prompt */}
        {step === 'prompt' && (
          <div>
            <button
              onClick={goBack}
              className="loom-mono"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--loom-bone-faint)',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 32,
                padding: 0,
              }}
            >
              ← back
            </button>

            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>suggested beginnings</p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}
            >
              Where to begin?
            </h1>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', marginBottom: 48, maxWidth: 440 }}>
              Pick a prompt or write your own.
            </p>

            {loadingPrompts ? (
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
                <p className="loom-mono" style={{ fontSize: 10, color: 'var(--loom-bone-faint)', marginTop: 10, letterSpacing: '0.1em' }}>
                  the Listener is thinking…
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 0 }}>
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptSelect(prompt.prompt)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '14px 0',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--loom-rule)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      className="loom-body"
                      style={{ fontStyle: 'italic', color: 'var(--loom-bone-dim)', fontSize: 15 }}
                    >
                      "{prompt.prompt}"
                    </span>
                    <span
                      className="loom-mono"
                      style={{ display: 'block', fontSize: 9, color: 'var(--loom-bone-faint)', letterSpacing: '0.14em', marginTop: 4 }}
                    >
                      {prompt.category}
                    </span>
                  </button>
                ))}

                <button
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
                    className="loom-body"
                    style={{ color: 'var(--loom-bone-faint)', fontSize: 15 }}
                  >
                    I'll write my own thread
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Preview & Create */}
        {step === 'preview' && (
          <div>
            <button
              onClick={goBack}
              className="loom-mono"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--loom-bone-faint)',
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 32,
                padding: 0,
              }}
            >
              ← back
            </button>

            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>ready to weave</p>
            <h1
              className="loom-h2"
              style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 300, fontStyle: 'italic', margin: '0 0 12px' }}
            >
              Your thread is ready.
            </h1>
            <p className="loom-body" style={{ color: 'var(--loom-bone-dim)', marginBottom: 48, maxWidth: 440 }}>
              Here is what {selectedPerson?.name} will receive.
            </p>

            {/* Summary */}
            <div style={{ borderTop: '1px solid var(--loom-rule)', paddingTop: 24, marginBottom: 40 }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
                  <span className="loom-eyebrow" style={{ minWidth: 80 }}>for</span>
                  <span className="loom-body" style={{ color: 'var(--loom-bone)' }}>
                    {selectedPerson?.name}
                    {selectedPerson?.relationship && (
                      <span style={{ color: 'var(--loom-bone-faint)', marginLeft: 8 }}>
                        · {selectedPerson.relationship}
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ height: 1, background: 'var(--loom-rule)' }} />
                <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
                  <span className="loom-eyebrow" style={{ minWidth: 80 }}>medium</span>
                  <span className="loom-body" style={{ color: 'var(--loom-bone)' }}>
                    {contentType === 'voice' ? 'voice recording' : 'written letter'}
                  </span>
                </div>
                {selectedPrompt && (
                  <>
                    <div style={{ height: 1, background: 'var(--loom-rule)' }} />
                    <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
                      <span className="loom-eyebrow" style={{ minWidth: 80 }}>prompt</span>
                      <span
                        className="loom-body"
                        style={{ fontStyle: 'italic', color: 'var(--loom-bone-dim)' }}
                      >
                        "{selectedPrompt}"
                      </span>
                    </div>
                  </>
                )}
                <div style={{ height: 1, background: 'var(--loom-rule)' }} />
                <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
                  <span className="loom-eyebrow" style={{ minWidth: 80 }}>reply</span>
                  <span className="loom-body" style={{ color: 'var(--loom-bone-dim)', fontSize: 14 }}>
                    {selectedPerson?.name} can respond after viewing
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={handleCreate} className="loom-btn" style={{ alignSelf: 'flex-start' }}>
                {contentType === 'voice' ? 'start recording' : 'start writing'}
              </button>
              <button
                onClick={() => navigate('/life-events')}
                className="loom-btn-ghost"
                style={{ alignSelf: 'flex-start' }}
              >
                schedule for a milestone instead
              </button>
            </div>
          </div>
        )}
      </div>
    </AppFrame>
  );
}
