import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';

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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M15 10c1.3 0 1.3 2 0 2-1.3 0-1.8-2-3.2-2-1.2 0-1.2 2 0 2 1.4 0 1.9-2 3.2-2z" />
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

const letterPrompts = [
  "What I want you to know about our family history...",
  "The most important lessons I've learned in life...",
  "My hopes and dreams for your future...",
  "The story of how we met / you were born...",
  "What I love most about you...",
  "Advice for your wedding day...",
  "Words for when times get tough...",
  "My favorite memories of us together...",
];

export function Compose() {
  const navigate = useNavigate();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [_selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  
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

  useEffect(() => {
    fetchLetters();
    fetchFamilyMembers();
  }, []);

  const fetchLetters = async () => {
    try {
      // Mock data for now
      setLetters([
        {
          id: '1',
          title: 'To My Children',
          body: 'My dearest children, if you are reading this...',
          salutation: 'My Dearest Children',
          signature: 'With all my love, Mom',
          recipients: ['1', '2'],
          deliveryTrigger: 'POSTHUMOUS',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch letters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      // Mock data
      setFamilyMembers([
        { id: '1', name: 'Sarah', relationship: 'Daughter', email: 'sarah@example.com' },
        { id: '2', name: 'Michael', relationship: 'Son', email: 'michael@example.com' },
        { id: '3', name: 'Emma', relationship: 'Granddaughter', email: 'emma@example.com' },
      ]);
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
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowSealConfirm(false);
      setShowComposer(false);
      fetchLetters();
    } catch (error) {
      console.error('Failed to seal letter:', error);
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
            <button
              onClick={() => setShowComposer(false)}
              className="flex items-center gap-2 text-paper/60 hover:text-gold transition-colors"
            >
              <span className="w-5 h-5">{Icons.arrowLeft}</span>
              <span>Back to Letters</span>
            </button>
            
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
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-gold to-gold-dim text-void-deep font-semibold rounded-lg hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="w-4 h-4">{Icons.waxSeal}</span>
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
                  onClick={() => navigate('/family')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-gold/30 text-paper/40 hover:border-gold/50 hover:text-paper/60 transition-all"
                >
                  <span className="w-4 h-4">{Icons.plus}</span>
                  <span>Add Family Member</span>
                </button>
              </div>
            </div>

            {/* Letter Content */}
            <div className="bg-void-light border border-gold/20 rounded-2xl p-8">
              {/* Salutation */}
              <input
                type="text"
                value={salutation}
                onChange={(e) => setSalutation(e.target.value)}
                placeholder="Dear..."
                className="w-full text-2xl font-serif text-gold bg-transparent border-none focus:outline-none mb-6"
              />
              
              {/* Body */}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your letter here..."
                rows={15}
                className="w-full bg-transparent border-none text-paper text-lg leading-relaxed focus:outline-none resize-none placeholder:text-paper/30"
              />
              
              {/* Signature */}
              <div className="mt-8 pt-6 border-t border-gold/10">
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="With love..."
                  className="w-full text-lg font-serif text-paper/80 bg-transparent border-none focus:outline-none"
                />
              </div>
            </div>

            {/* Writing Prompts */}
            <div>
              <label className="block text-sm text-paper/60 mb-3">Need inspiration? Try a prompt:</label>
              <div className="flex flex-wrap gap-2">
                {letterPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => insertPrompt(prompt)}
                    className="px-3 py-1.5 text-sm bg-void-light border border-gold/10 rounded-lg text-paper/50 hover:text-paper/80 hover:border-gold/30 transition-colors"
                  >
                    {prompt.substring(0, 40)}...
                  </button>
                ))}
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
              {/* Wax Seal Animation */}
              <div className="w-24 h-24 mx-auto mb-6 text-blood">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="url(#sealGradient)" />
                  <defs>
                    <radialGradient id="sealGradient" cx="30%" cy="30%">
                      <stop offset="0%" stopColor="#c04060" />
                      <stop offset="50%" stopColor="#8b2942" />
                      <stop offset="100%" stopColor="#5a1a2a" />
                    </radialGradient>
                  </defs>
                  <g transform="translate(50,50)" className="text-paper/90">
                    <path d="M-15 0c0-4 1.5-8 4-8s4 4 4 8-1.5 8-4 8-4-4-4-8M11 0c0-4 1.5-8 4-8s4 4 4 8-1.5 8-4 8-4-4-4-8" 
                          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </g>
                </svg>
              </div>
              
              <h3 className="text-2xl font-serif text-paper mb-3">Seal This Letter?</h3>
              <p className="text-paper/60 mb-6">
                Once sealed, this letter cannot be edited. It will be encrypted and stored securely until delivery.
              </p>
              
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
    </div>
  );
}
