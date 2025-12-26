import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeft, Mic, Edit3, User, Sparkles, 
  Play, Calendar, Loader2, Heart
} from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { familyApi } from '../services/api';

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

type WizardStep = 'person' | 'type' | 'prompt' | 'create' | 'preview';
type ContentType = 'voice' | 'letter';

export function QuickWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<WizardStep>('person');
  const [selectedPerson, setSelectedPerson] = useState<FamilyMember | null>(null);
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
      case 'type':
        setStep('person');
        setSelectedPerson(null);
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
    type: 2,
    prompt: 3,
    create: 4,
    preview: 4,
  };
  
  const familyMembers = Array.isArray(family) ? family : [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>
      
      <Navigation />
      
      <main className="relative z-10 px-6 md:px-12 pt-24 pb-12 max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-paper/50">Step {stepNumber[step]} of 4</span>
            <span className="text-sm text-paper/50">60-Second Message</span>
          </div>
          <div className="h-1 bg-paper/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold"
              initial={{ width: 0 }}
              animate={{ width: `${(stepNumber[step] / 4) * 100}%` }}
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
                <h1 className="text-2xl md:text-3xl font-light mb-2">
                  Who is this message for?
                </h1>
                <p className="text-paper/50">
                  Choose the person you want to leave a message for
                </p>
              </div>
              
              {familyLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-gold" />
                </div>
              ) : familyMembers.length === 0 ? (
                <div className="text-center py-12">
                  <User size={48} className="mx-auto mb-4 text-paper/20" />
                  <p className="text-paper/50 mb-4">No family members added yet</p>
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
                    <motion.button
                      key={person.id}
                      onClick={() => handlePersonSelect(person)}
                      className="card text-center py-6 hover:border-gold/30 transition-all group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden">
                        {person.avatarUrl ? (
                          <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void text-xl font-medium">
                            {person.name[0]}
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium group-hover:text-gold transition-colors">{person.name}</h3>
                      <p className="text-sm text-paper/50">{person.relationship}</p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          
          {/* Step 2: Select Type */}
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-paper/50 hover:text-gold transition-colors mb-6"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden">
                  {selectedPerson?.avatarUrl ? (
                    <img src={selectedPerson.avatarUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void text-xl font-medium">
                      {selectedPerson?.name[0]}
                    </div>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-light mb-2">
                  How do you want to share with <span className="text-gold">{selectedPerson?.name}</span>?
                </h1>
                <p className="text-paper/50">
                  Choose how you'd like to leave your message
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => handleTypeSelect('voice')}
                  className="card py-8 text-center hover:border-purple-500/30 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Mic size={28} className="text-purple-400" />
                  </div>
                  <h3 className="font-medium text-lg mb-1 group-hover:text-purple-400 transition-colors">Voice Message</h3>
                  <p className="text-sm text-paper/50">Record your voice</p>
                  <p className="text-xs text-paper/30 mt-2">~60 seconds</p>
                </motion.button>
                
                <motion.button
                  onClick={() => handleTypeSelect('letter')}
                  className="card py-8 text-center hover:border-blue-500/30 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Edit3 size={28} className="text-blue-400" />
                  </div>
                  <h3 className="font-medium text-lg mb-1 group-hover:text-blue-400 transition-colors">Written Letter</h3>
                  <p className="text-sm text-paper/50">Write a letter</p>
                  <p className="text-xs text-paper/30 mt-2">~5 minutes</p>
                </motion.button>
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
                className="flex items-center gap-2 text-paper/50 hover:text-gold transition-colors mb-6"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles size={20} className="text-gold" />
                  <span className="text-sm text-gold">AI-Suggested Prompts</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-light mb-2">
                  What would you like to tell <span className="text-gold">{selectedPerson?.name}</span>?
                </h1>
                <p className="text-paper/50">
                  Pick a prompt or write your own
                </p>
              </div>
              
              {loadingPrompts ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-gold" />
                </div>
              ) : (
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <motion.button
                      key={prompt.id}
                      onClick={() => handlePromptSelect(prompt.prompt)}
                      className="w-full p-4 card text-left hover:border-gold/30 transition-all group"
                      whileHover={{ scale: 1.01 }}
                    >
                      <p className="text-paper/90 group-hover:text-gold transition-colors">
                        "{prompt.prompt}"
                      </p>
                      <span className="text-xs text-paper/40 mt-2 block">{prompt.category}</span>
                    </motion.button>
                  ))}
                  
                  <motion.button
                    onClick={() => handlePromptSelect('')}
                    className="w-full p-4 card text-left hover:border-paper/30 transition-all border-dashed"
                    whileHover={{ scale: 1.01 }}
                  >
                    <p className="text-paper/60">
                      I'll write my own message
                    </p>
                  </motion.button>
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
                className="flex items-center gap-2 text-paper/50 hover:text-gold transition-colors mb-6"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-light mb-2">
                  Ready to create your message
                </h1>
                <p className="text-paper/50">
                  Here's what {selectedPerson?.name} will receive
                </p>
              </div>
              
              {/* Delivery Preview */}
              <div className="card mb-8 overflow-hidden">
                <div className="bg-gradient-to-r from-gold/10 to-transparent p-4 border-b border-paper/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {selectedPerson?.avatarUrl ? (
                        <img src={selectedPerson.avatarUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void font-medium">
                          {selectedPerson?.name[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">For {selectedPerson?.name}</p>
                      <p className="text-xs text-paper/50">{selectedPerson?.relationship}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {contentType === 'voice' ? (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Play size={28} className="text-purple-400 ml-1" />
                      </div>
                      <div>
                        <p className="font-medium">Voice Message</p>
                        <p className="text-sm text-paper/50">A personal recording from you</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Edit3 size={28} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">Written Letter</p>
                        <p className="text-sm text-paper/50">A heartfelt letter from you</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedPrompt && (
                    <div className="mt-4 p-4 bg-paper/5 rounded-lg">
                      <p className="text-sm text-paper/70 italic">"{selectedPrompt}"</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-paper/5 p-4 border-t border-paper/10">
                  <div className="flex items-center gap-2 text-paper/50 text-sm">
                    <Heart size={14} className="text-pink-400" />
                    <span>{selectedPerson?.name} can send you a note back after viewing</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  onClick={handleCreate}
                  className="w-full py-4 rounded-xl bg-gold text-void font-medium flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {contentType === 'voice' ? <Mic size={20} /> : <Edit3 size={20} />}
                  {contentType === 'voice' ? 'Start Recording' : 'Start Writing'}
                </motion.button>
                
                <button
                  onClick={() => navigate('/life-events')}
                  className="w-full py-3 glass rounded-xl text-paper/60 hover:text-gold transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={18} />
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
