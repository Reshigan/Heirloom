import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '../components/Navigation';
import { ProgressHair } from '../components/ui/ProgressHair';
import { familyApi } from '../services/api';

// Template options for quick start
const TEMPLATES = [
  {
    id: 'birthday',
    name: 'Birthday Message',
    description: 'A heartfelt message for their special day',
    defaultPrompt: 'What I want you to know on your birthday...',
  },
  {
    id: 'if-not-here',
    name: 'If I\'m Not Here',
    description: 'Words of comfort for when you\'re gone',
    defaultPrompt: 'If I\'m not there to tell you this in person...',
  },
  {
    id: 'story',
    name: 'A Story You Should Know',
    description: 'Share a memory or life lesson',
    defaultPrompt: 'There\'s a story I\'ve never told you...',
  },
  {
    id: 'proud',
    name: 'Why I\'m Proud of You',
    description: 'Celebrate who they are',
    defaultPrompt: 'I want you to know how proud I am of you because...',
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

export function QuickWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<WizardStep>('person');
  const [selectedPerson, setSelectedPerson] = useState<FamilyMember | null>(null);
  const [_selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  void _selectedTemplate; // Used for future template display in preview
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<PersonPrompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  // Pre-select person if coming from PersonPage
  const preselectedPersonId = searchParams.get('for');
  const preselectedPrompt = searchParams.get('prompt');

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

  // Handle preselection
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

  // Fetch prompts when person is selected
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
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-12 max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[0.65rem] tracking-[0.24em] uppercase text-paper-50">Step {stepNumber[step]} of 5</span>
            <span className="font-mono text-[0.65rem] tracking-[0.24em] uppercase text-paper-50">~3 minutes</span>
          </div>
          <div className="h-px bg-paper-15 overflow-hidden">
            <motion.div
              className="h-full bg-gold"
              initial={{ width: 0 }}
              animate={{ width: `${(stepNumber[step] / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Person */}
          {step === 'person' && (
            <motion.div
              key="person"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h1 className="font-body font-light text-2xl md:text-3xl mb-2 tracking-[-0.014em]">
                  Who is this message for?
                </h1>
                <p className="text-paper-65">
                  Choose the person you want to leave a message for
                </p>
              </div>

              {familyLoading ? (
                <div className="flex justify-center py-12">
                  <ProgressHair label="loading…" width={180} />
                </div>
              ) : familyMembers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-paper-65 mb-4">No family members added yet</p>
                  <button
                    onClick={() => navigate('/family')}
                    className="btn btn-primary"
                  >
                    Add Family Member
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {familyMembers.map((person: FamilyMember) => (
                    <button
                      key={person.id}
                      onClick={() => handlePersonSelect(person)}
                      className="bg-void-surface border border-paper-15 text-center py-6 hover:border-gold-40 transition-colors group"
                    >
                      {person.avatarUrl ? (
                        <div className="w-16 h-16 rounded-[2px] mx-auto mb-3 overflow-hidden">
                          <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-[2px] mx-auto mb-3 bg-void border border-paper-15 flex items-center justify-center text-gold font-body text-xl">
                          {person.name[0]}
                        </div>
                      )}
                      <h3 className="font-body group-hover:text-gold transition-colors">{person.name}</h3>
                      <p className="text-sm text-paper-65">{person.relationship}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Select Template */}
          {step === 'template' && (
            <motion.div
              key="template"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 text-paper-65 hover:text-gold transition-colors mb-6"
              >
                <span aria-hidden>←</span>
                Back
              </button>

              <div className="text-center mb-8">
                {selectedPerson?.avatarUrl ? (
                  <div className="w-16 h-16 rounded-[2px] mx-auto mb-4 overflow-hidden">
                    <img src={selectedPerson.avatarUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-[2px] mx-auto mb-4 bg-void-surface border border-paper-15 flex items-center justify-center text-gold font-body text-xl">
                    {selectedPerson?.name[0]}
                  </div>
                )}
                <h1 className="font-body font-light text-2xl md:text-3xl mb-2 tracking-[-0.014em]">
                  What would you like to tell <span className="text-gold">{selectedPerson?.name}</span>?
                </h1>
                <p className="text-paper-65">
                  Pick a template to get started quickly
                </p>
              </div>

              <div className="space-y-3">
                {TEMPLATES.map((template) => {
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full p-4 rounded-[2px] border border-paper-15 bg-void-surface hover:border-gold-40 transition-colors flex items-center gap-4 text-left group"
                    >
                      <div className="flex-1">
                        <h3 className="font-body mb-0.5 text-paper group-hover:text-gold transition-colors">{template.name}</h3>
                        <p className="text-sm text-paper-65">{template.description}</p>
                      </div>
                      <span aria-hidden className="text-paper-50 group-hover:text-gold transition-colors">→</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-void-surface border border-paper-15 text-sm">
                <p className="text-paper-70">
                  Each template includes suggested prompts to help you express what matters most. You can always customize or write your own.
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Select Type */}
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 text-paper-65 hover:text-gold transition-colors mb-6"
              >
                <span aria-hidden>←</span>
                Back
              </button>

              <div className="text-center mb-8">
                {selectedPerson?.avatarUrl ? (
                  <div className="w-16 h-16 rounded-[2px] mx-auto mb-4 overflow-hidden">
                    <img src={selectedPerson.avatarUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-[2px] mx-auto mb-4 bg-void-surface border border-paper-15 flex items-center justify-center text-gold font-body text-xl">
                    {selectedPerson?.name[0]}
                  </div>
                )}
                <h1 className="font-body font-light text-2xl md:text-3xl mb-2 tracking-[-0.014em]">
                  How do you want to share with <span className="text-gold">{selectedPerson?.name}</span>?
                </h1>
                <p className="text-paper-65">
                  Choose how you'd like to leave your message
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleTypeSelect('voice')}
                  className="bg-void-surface border border-paper-15 py-8 text-center hover:border-gold-40 transition-colors group"
                >
                  <p className="font-mono text-[0.6rem] tracking-[0.24em] uppercase text-gold mb-4">Voice</p>
                  <h3 className="font-body text-lg mb-1 group-hover:text-gold transition-colors">Voice Message</h3>
                  <p className="text-sm text-paper-65">Record your voice</p>
                  <p className="text-xs text-paper-65 mt-2">~60 seconds</p>
                </button>

                <button
                  onClick={() => handleTypeSelect('letter')}
                  className="bg-void-surface border border-paper-15 py-8 text-center hover:border-gold-40 transition-colors group"
                >
                  <p className="font-mono text-[0.6rem] tracking-[0.24em] uppercase text-gold mb-4">Letter</p>
                  <h3 className="font-body text-lg mb-1 group-hover:text-gold transition-colors">Written Letter</h3>
                  <p className="text-sm text-paper-65">Write a letter</p>
                  <p className="text-xs text-paper-65 mt-2">~5 minutes</p>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Select Prompt */}
          {step === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 text-paper-65 hover:text-gold transition-colors mb-6"
              >
                <span aria-hidden>←</span>
                Back
              </button>

              <div className="text-center mb-8">
                <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Suggested Prompts</p>
                <h1 className="font-body font-light text-2xl md:text-3xl mb-2 tracking-[-0.014em]">
                  What would you like to tell <span className="text-gold">{selectedPerson?.name}</span>?
                </h1>
                <p className="text-paper-65">
                  Pick a prompt or write your own
                </p>
              </div>

              {loadingPrompts ? (
                <div className="flex justify-center py-12">
                  <ProgressHair label="loading…" width={180} />
                </div>
              ) : (
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handlePromptSelect(prompt.prompt)}
                      className="w-full p-4 bg-void-surface border border-paper-15 text-left hover:border-gold-40 transition-colors group"
                    >
                      <p className="text-paper group-hover:text-gold transition-colors">
                        "{prompt.prompt}"
                      </p>
                      <span className="text-xs text-paper-70 mt-2 block">{prompt.category}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => handlePromptSelect('')}
                    className="w-full p-4 bg-void-surface border border-dashed border-paper-15 text-left hover:border-paper-15 transition-colors"
                  >
                    <p className="text-paper-70">
                      I'll write my own message
                    </p>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Preview & Create */}
          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 text-paper-65 hover:text-gold transition-colors mb-6"
              >
                <span aria-hidden>←</span>
                Back
              </button>

              <div className="text-center mb-8">
                <h1 className="font-body font-light text-2xl md:text-3xl mb-2 tracking-[-0.014em]">
                  Ready to create your message
                </h1>
                <p className="text-paper-65">
                  Here's what {selectedPerson?.name} will receive
                </p>
              </div>

              {/* Delivery Preview */}
              <div className="bg-void-surface border border-paper-15 mb-8 overflow-hidden">
                <div className="p-4 border-b border-paper-15">
                  <div className="flex items-center gap-3">
                    {selectedPerson?.avatarUrl ? (
                      <div className="w-10 h-10 rounded-[2px] overflow-hidden">
                        <img src={selectedPerson.avatarUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-[2px] bg-void border border-paper-15 flex items-center justify-center text-gold font-body">
                        {selectedPerson?.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-body">For {selectedPerson?.name}</p>
                      <p className="text-xs text-paper-65">{selectedPerson?.relationship}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {contentType === 'voice' ? (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-[2px] bg-void border border-paper-15 flex items-center justify-center font-mono text-[0.55rem] tracking-[0.18em] uppercase text-gold">
                        Voice
                      </div>
                      <div>
                        <p className="font-body">Voice Message</p>
                        <p className="text-sm text-paper-65">A personal recording from you</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-[2px] bg-void border border-paper-15 flex items-center justify-center font-mono text-[0.55rem] tracking-[0.18em] uppercase text-gold">
                        Letter
                      </div>
                      <div>
                        <p className="font-body">Written Letter</p>
                        <p className="text-sm text-paper-65">A heartfelt letter from you</p>
                      </div>
                    </div>
                  )}

                  {selectedPrompt && (
                    <div className="mt-4 p-4 bg-void border border-paper-15 rounded-[2px]">
                      <p className="text-sm text-paper-70 italic">"{selectedPrompt}"</p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-paper-15">
                  <p className="text-paper-65 text-sm">
                    {selectedPerson?.name} can send you a note back after viewing
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCreate}
                  className="btn btn-primary w-full justify-center"
                >
                  {contentType === 'voice' ? 'Start Recording' : 'Start Writing'}
                  <span aria-hidden>→</span>
                </button>

                <button
                  onClick={() => navigate('/life-events')}
                  className="btn btn-ghost w-full justify-center"
                >
                  Schedule for a milestone instead
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
