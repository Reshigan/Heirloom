import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { AddFamilyMemberModal } from '../components/AddFamilyMemberModal';
import { lettersApi, familyApi, aiApi } from '../services/api';


// Custom SVG Icons
const Icons = {
  envelope: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  waxSeal: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="white" stroke="none">∞</text>
    </svg>
  ),
  infinity: (
    <svg viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.178 2c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.873 0-4.873 8 0 8 5.606 0 7.644-8 12.74-8z" />
    </svg>
  ),
  arrowLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  loader: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-6.364l-2.828 2.828M9.464 14.536l-2.828 2.828m12.728 0l-2.828-2.828M9.464 9.464L6.636 6.636" />
    </svg>
  ),
};

interface Letter {
  id: string;
  title: string;
  body: string;
  salutation: string;
  signature: string;
  recipients: string[];
  deliveryTrigger: 'IMMEDIATE' | 'SCHEDULED' | 'POSTHUMOUS';
  scheduledDate?: string;
  sealedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
}

const deliveryOptions = [
  {
    id: 'IMMEDIATE',
    label: 'Send Now',
    description: 'Deliver immediately after sealing',
    icon: Icons.send,
  },
  {
    id: 'SCHEDULED',
    label: 'Schedule Delivery',
    description: 'Choose a specific date',
    icon: Icons.calendar,
  },
  {
    id: 'POSTHUMOUS',
    label: 'Posthumous',
    description: 'Deliver after I\'m gone',
    icon: Icons.heart,
  },
];


export function Compose() {
  const navigate = useNavigate();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [letterPrompts, setLetterPrompts] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  
  // Composer state
  const [title, setTitle] = useState('');
  const [salutation, setSalutation] = useState('My Dearest');
  const [body, setBody] = useState('');
  const [signature, setSignature] = useState('With all my love,');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [deliveryTrigger, setDeliveryTrigger] = useState<'IMMEDIATE' | 'SCHEDULED' | 'POSTHUMOUS'>('POSTHUMOUS');
  const [scheduledDate, setScheduledDate] = useState('');
        const [isSaving, setIsSaving] = useState(false);
        const [showSealConfirm, setShowSealConfirm] = useState(false);
        const [isSealing, setIsSealing] = useState(false);
        const [isAiAssisting, setIsAiAssisting] = useState(false);
        const [aiSuggestion, setAiSuggestion] = useState('');
        const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
        const [sealError, setSealError] = useState<string | null>(null);

    // AI Assist function - uses Cloudflare Workers AI backend
    const handleAiAssist = async () => {
      if (isAiAssisting) return;
    
      setIsAiAssisting(true);
      setAiSuggestion('');
    
      const recipientNames = selectedRecipients
        .map(id => familyMembers.find(m => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      try {
        const { data } = await lettersApi.aiSuggest({
          salutation,
          body,
          signature,
          recipientNames: recipientNames || undefined,
        });
        
        if (data.suggestion) {
          setAiSuggestion(data.suggestion);
        } else {
          setAiSuggestion('AI suggestion unavailable. Please try again.');
        }
      } catch {
        setAiSuggestion('AI is temporarily unavailable. Please try again in a moment.');
      } finally {
        setIsAiAssisting(false);
      }
    };

    const insertAiSuggestion = () => {
      if (aiSuggestion && !aiSuggestion.includes('unavailable') && !aiSuggestion.includes('Could not')) {
        setBody(prev => prev + (prev ? '\n\n' : '') + aiSuggestion);
        setAiSuggestion('');
      }
    };

    useEffect(() => {
    fetchLetters();
    fetchFamilyMembers();
    fetchLetterPrompts();
  }, []);

  const fetchLetterPrompts = async () => {
    setIsLoadingPrompts(true);
    try {
      const { data } = await aiApi.getPrompts(8);
      if (data.prompts && data.prompts.length > 0) {
        setLetterPrompts(data.prompts.map((p: { prompt: string }) => p.prompt));
      }
    } catch {
      // Prompts are optional, fail silently
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const fetchLetters = async () => {
    try {
      const response = await lettersApi.getAll();
      // Backend returns { data: [...], pagination: {...} }
      // Axios wraps this in response.data, so letters are at response.data.data
      const lettersData = response.data?.data || response.data?.letters || [];
      if (!Array.isArray(lettersData)) {
        console.warn('Letters data is not an array:', lettersData);
        setLetters([]);
        return;
      }
      setLetters(lettersData.map((letter: any) => ({
        id: letter.id,
        title: letter.title,
        body: letter.body || letter.content || '',
        salutation: letter.salutation || 'Dear',
        signature: letter.signature || 'With love',
        recipients: letter.recipients?.map((r: any) => r.familyMemberId || r.id) || [],
        deliveryTrigger: letter.deliveryTrigger || 'POSTHUMOUS',
        scheduledDate: letter.scheduledDate,
        createdAt: letter.createdAt,
        updatedAt: letter.updatedAt,
      })));
    } catch (error) {
      console.error('Failed to fetch letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await familyApi.getAll();
      // Backend returns array directly, not wrapped in { data: [...] }
      const membersData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || response.data?.members || []);
      if (!Array.isArray(membersData)) {
        console.warn('Family members data is not an array:', membersData);
        setFamilyMembers([]);
        return;
      }
      setFamilyMembers(membersData.map((member: any) => ({
        id: member.id,
        name: member.name,
        relationship: member.relationship,
        email: member.email || '',
      })));
    } catch (error) {
      console.error('Failed to fetch family members:', error);
    }
  };

  const handleNewLetter = () => {
    setSelectedLetter(null);
    setTitle('');
    setSalutation('My Dearest');
    setBody('');
    setSignature('With all my love,');
    setSelectedRecipients([]);
    setDeliveryTrigger('POSTHUMOUS');
    setScheduledDate('');
    setShowComposer(true);
  };

  const handleEditLetter = (letter: Letter) => {
    setSelectedLetter(letter);
    setTitle(letter.title);
    setSalutation(letter.salutation);
    setBody(letter.body);
    setSignature(letter.signature);
    setSelectedRecipients(letter.recipients);
    setDeliveryTrigger(letter.deliveryTrigger);
    setScheduledDate(letter.scheduledDate || '');
    setShowComposer(true);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const letterData = {
        title,
        salutation,
        body,
        signature,
        recipientIds: selectedRecipients,
        deliveryTrigger,
        scheduledDate: scheduledDate || undefined,
      };
      
      if (selectedLetter) {
        await lettersApi.update(selectedLetter.id, letterData);
      } else {
        await lettersApi.create(letterData);
      }
      setShowComposer(false);
      fetchLetters();
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSealLetter = async () => {
    setIsSealing(true);
    setSealError(null);
    try {
      if (selectedLetter) {
        await lettersApi.seal(selectedLetter.id);
      } else {
        const letterData = {
          title,
          salutation,
          body,
          signature,
          recipientIds: selectedRecipients,
          deliveryTrigger,
          scheduledDate: scheduledDate || undefined,
        };
        const response = await lettersApi.create(letterData);
        await lettersApi.seal(response.data.id);
      }
      setShowSealConfirm(false);
      setShowComposer(false);
      fetchLetters();
    } catch (error: any) {
      console.error('Failed to seal letter:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to seal letter. Please try again.';
      setSealError(errorMessage);
    } finally {
      setIsSealing(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const insertPrompt = (prompt: string) => {
    setBody(prev => prev + (prev ? '\n\n' : '') + prompt + '\n\n');
  };

  if (showComposer) {
    return (
      <div className="min-h-screen bg-void text-paper">
        <Navigation />
        
        <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowComposer(false)}
                className="flex items-center gap-2 text-paper/60 hover:text-gold transition-colors"
              >
                <span className="w-5 h-5">{Icons.arrowLeft}</span>
                <span>Back to Letters</span>
              </button>
              <span className="text-paper/30">|</span>
              <button
                onClick={() => navigate('/memories')}
                className="flex items-center gap-2 text-paper/60 hover:text-gold transition-colors"
              >
                <span>Back to Vault</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-void-light border border-gold/20 rounded-lg text-paper/80 hover:border-gold/40 transition-colors"
              >
                <span className="w-4 h-4">{Icons.save}</span>
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>
              
              <button
                onClick={() => setShowSealConfirm(true)}
                disabled={!body.trim() || selectedRecipients.length === 0}
                className={`flex items-center gap-2 px-5 py-2 font-semibold rounded-lg transition-all ${
                  !body.trim() || selectedRecipients.length === 0
                    ? 'bg-void-light border border-paper/20 text-paper/40 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blood to-red-800 text-paper hover:shadow-lg hover:shadow-blood/30'
                }`}
              >
                <span className="w-4 h-4 text-paper">{Icons.waxSeal}</span>
                <span>Seal Letter</span>
              </button>
            </div>
          </div>

          {/* Composer */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm text-paper/60 mb-2">Letter Title (for your reference)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., To My Children on Their Wedding Days"
                className="w-full px-4 py-3 bg-void-light border border-gold/20 rounded-xl text-paper placeholder:text-paper/30 focus:outline-none focus:border-gold/50"
              />
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-sm text-paper/60 mb-3">Recipients</label>
              <div className="flex flex-wrap gap-2">
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleRecipient(member.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      selectedRecipients.includes(member.id)
                        ? 'bg-gold/20 border-gold text-gold'
                        : 'bg-void-light border-gold/20 text-paper/60 hover:border-gold/40'
                    }`}
                  >
                    <span className="w-4 h-4">{Icons.user}</span>
                    <span>{member.name}</span>
                    {selectedRecipients.includes(member.id) && (
                      <span className="w-4 h-4">{Icons.check}</span>
                    )}
                  </button>
                ))}
                                <button
                                  onClick={() => setShowAddFamilyModal(true)}
                                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-gold/30 text-paper/40 hover:border-gold/50 hover:text-paper/60 transition-all"
                                >
                                  <span className="w-4 h-4">{Icons.plus}</span>
                                  <span>Add Family Member</span>
                                </button>
              </div>
              {/* Helper text when no recipients selected */}
              {selectedRecipients.length === 0 && (
                <p className="mt-2 text-sm text-amber-400/80 flex items-center gap-2">
                  <span className="w-4 h-4">{Icons.user}</span>
                  Add at least one recipient to seal this letter
                </p>
              )}
            </div>

                        {/* Letter Content - Handwritten Style */}
                        <div className="relative">
                          {/* Paper texture background */}
                          <div 
                            className="absolute inset-0 rounded-2xl opacity-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                            }}
                          />
              
                          <div 
                            className="relative bg-gradient-to-b from-amber-50/5 to-amber-100/5 border border-gold/30 rounded-2xl p-8 shadow-inner"
                            style={{
                              backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, rgba(201,169,89,0.1) 31px, rgba(201,169,89,0.1) 32px)`,
                              backgroundPosition: '0 24px',
                            }}
                          >
                            {/* AI Assist Button */}
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              <button
                                onClick={handleAiAssist}
                                disabled={isAiAssisting}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-gold/20 border border-gold/30 rounded-lg text-gold hover:border-gold/50 transition-all disabled:opacity-50"
                                title="Get AI writing suggestions"
                              >
                                <span className={`w-4 h-4 ${isAiAssisting ? 'animate-spin' : ''}`}>
                                  {isAiAssisting ? Icons.loader : Icons.sparkles}
                                </span>
                                <span className="text-sm">{isAiAssisting ? 'Thinking...' : 'AI Assist'}</span>
                              </button>
                            </div>

                            {/* Salutation */}
                            <input
                              type="text"
                              value={salutation}
                              onChange={(e) => setSalutation(e.target.value)}
                              placeholder="Dear..."
                              className="w-full text-2xl text-gold bg-transparent border-none focus:outline-none mb-6"
                              style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, serif" }}
                            />
                
                            {/* Body */}
                            <textarea
                              value={body}
                              onChange={(e) => setBody(e.target.value)}
                              placeholder="Write your letter here... Let your heart speak freely."
                              rows={15}
                              className="w-full bg-transparent border-none text-paper text-xl leading-loose focus:outline-none resize-none placeholder:text-paper/30"
                              style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, serif" }}
                            />

                            {/* AI Suggestion Box */}
                            {aiSuggestion && (
                              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
                                      <span className="w-4 h-4">{Icons.sparkles}</span>
                                      <span>AI Suggestion</span>
                                    </div>
                                    <p className="text-paper/80 italic" style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, serif" }}>
                                      {aiSuggestion}
                                    </p>
                                  </div>
                                  {!aiSuggestion.includes('unavailable') && !aiSuggestion.includes('Could not') && (
                                    <button
                                      onClick={insertAiSuggestion}
                                      className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors text-sm"
                                    >
                                      Insert
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                
                            {/* Signature */}
                            <div className="mt-8 pt-6 border-t border-gold/20">
                              <input
                                type="text"
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="With love..."
                                className="w-full text-xl text-paper/80 bg-transparent border-none focus:outline-none"
                                style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, serif" }}
                              />
                            </div>
                          </div>
                        </div>

            {/* Writing Prompts */}
            <div>
              <label className="block text-sm text-paper/60 mb-3">Need inspiration? Try a prompt:</label>
              <div className="flex flex-wrap gap-2">
                {isLoadingPrompts ? (
                  <div className="flex items-center gap-2 text-paper/40">
                    <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <span className="text-sm">Loading prompts...</span>
                  </div>
                ) : letterPrompts.length === 0 ? (
                  <p className="text-sm text-paper/40">No prompts available. Use the AI assist button above for suggestions.</p>
                ) : (
                  letterPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => insertPrompt(prompt)}
                      className="px-3 py-1.5 text-sm bg-void-light border border-gold/10 rounded-lg text-paper/50 hover:text-paper/80 hover:border-gold/30 transition-colors"
                    >
                      {prompt.substring(0, 40)}...
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Delivery Options */}
            <div>
              <label className="block text-sm text-paper/60 mb-3">When should this letter be delivered?</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {deliveryOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setDeliveryTrigger(option.id as typeof deliveryTrigger)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      deliveryTrigger === option.id
                        ? 'bg-gold/10 border-gold'
                        : 'bg-void-light border-gold/20 hover:border-gold/40'
                    }`}
                  >
                    <div className={`w-8 h-8 mb-3 ${deliveryTrigger === option.id ? 'text-gold' : 'text-paper/50'}`}>
                      {option.icon}
                    </div>
                    <div className={`font-medium ${deliveryTrigger === option.id ? 'text-gold' : 'text-paper'}`}>
                      {option.label}
                    </div>
                    <div className="text-sm text-paper/50 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>

              {/* Scheduled Date Picker */}
              {deliveryTrigger === 'SCHEDULED' && (
                <div className="mt-4">
                  <label className="block text-sm text-paper/60 mb-2">Delivery Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-4 py-3 bg-void-light border border-gold/20 rounded-xl text-paper focus:outline-none focus:border-gold/50"
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Seal Confirmation Modal */}
        {showSealConfirm && (
          <div className="fixed inset-0 bg-void-deep/90 flex items-center justify-center z-50 p-4">
            <div className="bg-void-light border border-gold/30 rounded-2xl p-8 max-w-md w-full text-center">
              {/* Wax Seal with Heirloom Infinity Symbol */}
              <div className="w-24 h-24 mx-auto mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <radialGradient id="heirloomSealGradient" cx="30%" cy="30%">
                      <stop offset="0%" stopColor="#c04060" />
                      <stop offset="50%" stopColor="#8b2942" />
                      <stop offset="100%" stopColor="#5a1a2a" />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="45" fill="url(#heirloomSealGradient)" />
                  {/* Proper Infinity Symbol - same as Icons.tsx Infinity */}
                  <g transform="translate(50, 50)">
                    <path 
                      d="M-18 0c0-6 3.6-9.6 8.4-9.6s8.4 3.6 6 9.6c-2.4 6-4.8 9.6-12 9.6s-9.6-3.6-7.2-9.6m14.4 0c0-6 3.6-9.6 8.4-9.6s8.4 3.6 6 9.6c-2.4 6-4.8 9.6-12 9.6s-9.6-3.6-7.2-9.6"
                      fill="none" 
                      stroke="rgba(255,255,255,0.9)" 
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </div>
              
              <h3 className="text-2xl font-serif text-paper mb-3">Seal This Letter?</h3>
              <p className="text-paper/60 mb-4">
                Once sealed, this letter cannot be edited. It will be encrypted and stored securely until delivery.
              </p>
              
              {/* Error message */}
              {sealError && (
                <div className="mb-4 p-3 bg-blood/20 border border-blood/40 rounded-lg text-blood text-sm">
                  {sealError}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSealConfirm(false)}
                  disabled={isSealing}
                  className="flex-1 px-4 py-3 bg-void border border-gold/20 rounded-xl text-paper/80 hover:border-gold/40 transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleSealLetter}
                  disabled={isSealing}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blood to-blood/80 text-paper font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {isSealing ? (
                    <span>Sealing...</span>
                  ) : (
                    <>
                      <span className="w-5 h-5">{Icons.lock}</span>
                      <span>Seal Forever</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-paper">
      <Navigation />
      
      <main className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-paper mb-2">Letters</h1>
            <p className="text-paper/60">Write messages to be delivered across time</p>
          </div>
          
          <button
            onClick={handleNewLetter}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gold to-gold-dim text-void-deep font-semibold rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all"
          >
            <span className="w-5 h-5">{Icons.plus}</span>
            <span>New Letter</span>
          </button>
        </div>

        {/* Letters Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 text-gold/30">
              {Icons.envelope}
            </div>
            <h3 className="text-xl font-serif text-paper mb-2">No letters yet</h3>
            <p className="text-paper/60 mb-6 max-w-md mx-auto">
              Write letters to your loved ones that will be delivered at just the right moment.
            </p>
            <button
              onClick={handleNewLetter}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-dim text-void-deep font-semibold rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all"
            >
              <span className="w-5 h-5">{Icons.plus}</span>
              <span>Write Your First Letter</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {letters.map((letter) => (
              <div
                key={letter.id}
                onClick={() => handleEditLetter(letter)}
                className="group bg-void-light border border-gold/20 rounded-2xl p-6 cursor-pointer hover:border-gold/40 transition-all"
              >
                {/* Sealed Status */}
                {letter.sealedAt ? (
                  <div className="flex items-center gap-2 text-blood mb-4">
                    <span className="w-5 h-5">{Icons.waxSeal}</span>
                    <span className="text-sm">Sealed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-paper/40 mb-4">
                    <span className="w-5 h-5">{Icons.save}</span>
                    <span className="text-sm">Draft</span>
                  </div>
                )}
                
                {/* Title */}
                <h3 className="text-lg font-serif text-paper mb-2 group-hover:text-gold transition-colors">
                  {letter.title || 'Untitled Letter'}
                </h3>
                
                {/* Preview */}
                <p className="text-paper/50 text-sm line-clamp-3 mb-4">
                  {letter.body}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-paper/40">
                    <span className="w-4 h-4">{Icons.user}</span>
                    <span>{letter.recipients.length} recipient{letter.recipients.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-paper/40">
                    <span className="w-4 h-4">
                      {letter.deliveryTrigger === 'IMMEDIATE' && Icons.send}
                      {letter.deliveryTrigger === 'SCHEDULED' && Icons.calendar}
                      {letter.deliveryTrigger === 'POSTHUMOUS' && Icons.heart}
                    </span>
                    <span>
                      {letter.deliveryTrigger === 'IMMEDIATE' && 'Immediate'}
                      {letter.deliveryTrigger === 'SCHEDULED' && 'Scheduled'}
                      {letter.deliveryTrigger === 'POSTHUMOUS' && 'Posthumous'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* New Letter Card */}
            <button
              onClick={handleNewLetter}
              className="flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-gold/20 rounded-2xl text-paper/40 hover:border-gold/40 hover:text-paper/60 transition-all"
            >
              <span className="w-12 h-12 mb-4">{Icons.plus}</span>
              <span>New Letter</span>
            </button>
          </div>
        )}
      </main>

      {/* Add Family Member Modal */}
      <AddFamilyMemberModal
        isOpen={showAddFamilyModal}
        onClose={() => setShowAddFamilyModal(false)}
        onCreated={(member) => {
          setFamilyMembers(prev => [...prev, member]);
          setSelectedRecipients(prev => [...prev, member.id]);
        }}
      />
    </div>
  );
}
