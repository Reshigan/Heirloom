import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    category?: string;
    helpful?: boolean;
    escalated?: boolean;
    articles?: KnowledgeArticle[];
  };
}

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  relatedArticles?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  query: string;
}

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================

const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  // Getting Started
  {
    id: 'getting-started',
    title: 'Getting Started with Heirloom',
    category: 'Getting Started',
    keywords: ['start', 'begin', 'new', 'setup', 'first', 'how to', 'tutorial'],
    content: `Welcome to Heirloom! Here's how to get started:

1. **Create Your Profile**: Add your name, photo, and a brief bio that will be part of your legacy.

2. **Set Up Your Family Tree**: Connect with family members by sending invitations. Each person can contribute their own memories.

3. **Add Your First Memory**: Tap the + button to add a photo, video, or written memory. Add context about who's in the photo, when it was taken, and why it matters.

4. **Record a Voice Story**: Your voice is irreplaceable. Record your first story - it can be as simple as introducing yourself to future generations.

5. **Write a Time-Capsule Letter**: Write a letter to be delivered to a loved one on a future date.

Pro tip: Start small! Even one memory a week builds a beautiful legacy over time.`
  },
  {
    id: 'voice-stories',
    title: 'How to Record Voice Stories',
    category: 'Features',
    keywords: ['voice', 'record', 'audio', 'story', 'recording', 'microphone', 'speak'],
    content: `Voice Stories capture your voice for future generations. Here's how:

**Recording a Voice Story:**
1. Tap the microphone icon on your dashboard
2. Choose a prompt or speak freely
3. Tap the red button to start recording
4. Speak naturally - pauses and imperfections make it authentic
5. Tap stop when finished
6. Add a title and tags
7. Choose who can access this recording

**Tips for Great Voice Stories:**
- Find a quiet space with minimal background noise
- Speak as if talking to a grandchild
- Share specific details and emotions
- Don't worry about being perfect
- Record multiple short stories rather than one long one

**Story Prompts to Try:**
- "The day I knew I wanted to marry your grandmother..."
- "My favorite childhood memory is..."
- "The best advice I ever received was..."
- "I want you to know that..."`
  },
  {
    id: 'time-letters',
    title: 'Writing Time-Capsule Letters',
    category: 'Features',
    keywords: ['letter', 'write', 'time capsule', 'future', 'delivery', 'schedule', 'posthumous'],
    content: `Time-Capsule Letters are messages delivered at the perfect moment.

**Types of Letters:**
- **Scheduled Letters**: Delivered on a specific date (birthdays, graduations, weddings)
- **Milestone Letters**: Delivered when recipient reaches a life milestone
- **Posthumous Letters**: Delivered after you pass, ensuring your words live on

**How to Write a Letter:**
1. Go to Compose → New Letter
2. Choose your recipient from your family tree
3. Select delivery type and timing
4. Write your letter (AI assistant can help!)
5. Add photos or voice recordings if desired
6. Review and seal your letter

**Writing Tips:**
- Be specific about memories and feelings
- Share wisdom you wish you'd known
- Express things you might not say in person
- Update letters periodically - you can edit until sealed

**Privacy & Security:**
- Letters are encrypted end-to-end
- Only the recipient can open sealed letters
- You can set backup recipients
- Estate executor can manage posthumous delivery`
  },
  {
    id: 'memory-vault',
    title: 'Using the Memory Vault',
    category: 'Features',
    keywords: ['memory', 'vault', 'photo', 'video', 'upload', 'organize', 'storage', 'album'],
    content: `The Memory Vault stores your photos and videos with rich context.

**Adding Memories:**
1. Tap + on your dashboard
2. Select photos/videos from your device
3. Add context: who, when, where, why
4. Tag family members in the photo
5. Add voice narration (optional)
6. Set privacy level

**Organizing Memories:**
- Create albums by event, person, or time period
- Use tags for easy searching
- Star your favorites
- Create "Stories" that combine multiple memories

**Bulk Upload:**
- Upload up to 100 photos at once
- AI helps identify faces and suggest context
- Edit details later at your own pace

**Storage:**
- Free plan: 5GB storage
- Premium: 100GB storage
- Family plan: 500GB shared storage
- All plans include unlimited voice stories`
  },
  {
    id: 'family-tree',
    title: 'Building Your Family Tree',
    category: 'Features',
    keywords: ['family', 'tree', 'invite', 'connect', 'relatives', 'members', 'constellation'],
    content: `Your Family Constellation connects generations.

**Adding Family Members:**
1. Go to Family → Add Member
2. Enter their name and relationship to you
3. Send an invitation via email or share link
4. They'll create their own account and connect

**Family Roles:**
- **Owner**: Full control, billing, can delete account
- **Guardian**: Can manage content, approve members
- **Contributor**: Can add memories, stories, letters
- **Viewer**: Can view shared content only

**Privacy Controls:**
- Set default sharing for new content
- Control who sees specific memories
- Create private memories visible only to you
- Set up legacy contacts for after you pass

**Multi-Generational:**
- Connect up to 5 generations
- Each person maintains their own memories
- Shared family albums visible to all
- Private content stays private`
  },
  {
    id: 'ai-assistant',
    title: 'Using the AI Writing Assistant',
    category: 'Features',
    keywords: ['ai', 'assistant', 'help', 'write', 'prompt', 'suggest', 'writer'],
    content: `Our AI assistant helps you find the right words.

**What It Can Do:**
- Suggest letter openings and closings
- Help articulate difficult emotions
- Generate story prompts based on your life
- Create photo captions
- Translate your words into other languages

**How to Use:**
1. Look for the ✨ sparkle icon
2. Tap to open the assistant
3. Describe what you want to express
4. Review and edit suggestions
5. Use as-is or as inspiration

**Privacy First:**
- AI runs locally on your device
- Your content never leaves your phone
- No data used for training
- You own everything you create

**Best For:**
- Starting when you don't know what to say
- Finding the right words for emotions
- Getting unstuck on difficult topics
- Polishing your writing`
  },
  {
    id: 'year-wrapped',
    title: 'Your Year Wrapped',
    category: 'Features',
    keywords: ['wrapped', 'year', 'review', 'summary', 'annual', 'statistics', 'recap'],
    content: `Year Wrapped celebrates your legacy journey.

**What's Included:**
- Total memories preserved
- Voice stories recorded
- Letters written
- Most tagged people
- Emotional themes detected
- Your consistency streak
- Milestones achieved

**When It's Available:**
- Generated annually in December
- Access anytime from your profile
- Share highlights with family
- Compare year over year

**Sharing:**
- Create shareable cards for social media
- Send to family members
- Download as PDF keepsake
- Privacy-safe summaries (no personal content exposed)`
  },
  // Account & Billing
  {
    id: 'subscription-plans',
    title: 'Subscription Plans & Pricing',
    category: 'Account & Billing',
    keywords: ['price', 'cost', 'plan', 'subscription', 'billing', 'payment', 'premium', 'free'],
    content: `Choose the plan that fits your legacy.

**Free Plan - $0/month**
- 5GB storage
- Unlimited voice stories
- Basic family tree (10 members)
- 3 time-capsule letters
- Community support

**Premium - $9.99/month or $99/year**
- 100GB storage
- Unlimited everything
- Extended family tree (50 members)
- AI writing assistant
- Priority support
- Year Wrapped premium features
- Advanced privacy controls

**Family Plan - $19.99/month or $199/year**
- 500GB shared storage
- Up to 6 premium accounts
- Unlimited family tree
- Family admin dashboard
- Dedicated support
- Legacy planning tools

**Legacy Vault - $299 one-time**
- Everything in Premium
- Lifetime access (no monthly fees)
- 1TB permanent storage
- Guaranteed 100-year preservation
- Legal document templates
- Estate planning integration`
  },
  {
    id: 'cancel-subscription',
    title: 'Canceling Your Subscription',
    category: 'Account & Billing',
    keywords: ['cancel', 'unsubscribe', 'stop', 'end', 'subscription', 'refund'],
    content: `We're sad to see you go, but here's how to cancel:

**To Cancel:**
1. Go to Settings → Subscription
2. Tap "Manage Subscription"
3. Select "Cancel Subscription"
4. Choose your reason (helps us improve)
5. Confirm cancellation

**What Happens Next:**
- Access continues until billing period ends
- Content is never deleted
- Downgrade to free plan automatically
- Can reactivate anytime

**Refund Policy:**
- Full refund within 14 days of purchase
- Prorated refund for annual plans
- No refunds for monthly after 14 days

**Before You Go:**
- Download your data (Settings → Export)
- Your memories are always yours
- Family members keep their access
- Consider pausing instead of canceling`
  },
  // Privacy & Security
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    category: 'Privacy & Security',
    keywords: ['privacy', 'security', 'safe', 'encrypt', 'data', 'protect', 'secure'],
    content: `Your memories deserve the highest protection.

**Encryption:**
- End-to-end encryption for all content
- Zero-knowledge architecture
- Only you hold the keys
- Even we can't read your data

**Data Storage:**
- Stored in geographically distributed data centers
- Multiple redundant backups
- 99.99% uptime guarantee
- GDPR & CCPA compliant

**Access Controls:**
- Two-factor authentication
- Biometric login option
- Session management
- Login notifications

**Your Rights:**
- Download all your data anytime
- Delete your account completely
- Control what's shared with family
- Legacy contacts for after you pass

**AI Privacy:**
- AI runs locally on your device
- No content sent to external servers
- No training on your data
- Full transparency on data usage`
  },
  {
    id: 'legacy-planning',
    title: 'Legacy & Estate Planning',
    category: 'Privacy & Security',
    keywords: ['legacy', 'estate', 'death', 'pass', 'die', 'after', 'posthumous', 'executor'],
    content: `Ensure your legacy continues after you're gone.

**Legacy Contacts:**
- Designate trusted people to manage your account
- They can release scheduled letters
- They can share memories with family
- They cannot delete or modify content

**Posthumous Features:**
- Letters delivered after you pass
- Voice messages for specific occasions
- Photo albums unlocked for family
- Personal messages to individuals

**Setting Up:**
1. Go to Settings → Legacy Planning
2. Add legacy contacts (2+ recommended)
3. Set verification requirements
4. Write instructions for your contacts
5. Review periodically

**Verification:**
- Multiple contacts must confirm
- Optional: require death certificate
- Waiting period before access (default 30 days)
- Appeals process for disputes

**Legal Integration:**
- Export for estate planning
- Compatible with digital will services
- Document storage for legal papers
- Executor notification system`
  },
  // Troubleshooting
  {
    id: 'upload-issues',
    title: 'Troubleshooting Upload Issues',
    category: 'Troubleshooting',
    keywords: ['upload', 'fail', 'error', 'stuck', 'not working', 'problem', 'issue'],
    content: `Having trouble uploading? Try these fixes:

**Common Issues:**

**Upload Stuck or Failed:**
1. Check your internet connection
2. Ensure file is under 500MB
3. Try uploading fewer files at once
4. Close and reopen the app
5. Check available storage in Settings

**Supported Formats:**
- Photos: JPG, PNG, HEIC, WebP
- Videos: MP4, MOV, AVI (up to 10 min)
- Audio: MP3, M4A, WAV
- Documents: PDF, TXT

**Quality Issues:**
- Original quality preserved
- Large files may take longer
- Use WiFi for video uploads
- Enable "Upload on WiFi only" in Settings

**Still Not Working?**
- Update to latest app version
- Clear app cache (Settings → Storage)
- Try from web app instead
- Contact support with error message`
  },
  {
    id: 'recording-issues',
    title: 'Voice Recording Problems',
    category: 'Troubleshooting',
    keywords: ['recording', 'microphone', 'audio', 'sound', 'voice', 'not working', 'quiet'],
    content: `Fix voice recording issues:

**No Sound Recording:**
1. Check microphone permissions in device settings
2. Ensure no other app is using microphone
3. Test microphone with another app
4. Restart your device

**Poor Audio Quality:**
1. Move to a quieter space
2. Hold device 6-12 inches from mouth
3. Avoid covering the microphone
4. Remove phone case if thick

**Recording Cuts Off:**
1. Disable battery saver mode
2. Keep app in foreground while recording
3. Check storage space
4. Maximum recording is 30 minutes

**Playback Issues:**
1. Check device volume
2. Try with headphones
3. Download recording for offline play
4. Check if file completed upload`
  },
  {
    id: 'account-access',
    title: 'Account Access Issues',
    category: 'Troubleshooting',
    keywords: ['login', 'password', 'forgot', 'locked', 'access', 'account', 'reset', 'cant'],
    content: `Can't access your account? Here's help:

**Forgot Password:**
1. Tap "Forgot Password" on login
2. Enter your email address
3. Check email (and spam folder)
4. Click reset link within 1 hour
5. Create new password

**Account Locked:**
- Too many failed attempts locks account
- Wait 30 minutes or reset password
- Contact support if still locked

**Two-Factor Issues:**
- Use backup codes (saved during setup)
- Try SMS instead of authenticator
- Contact support with ID verification

**Email Changed:**
- Use most recent email on file
- Check old email for account info
- Contact support with verification

**Deleted Account:**
- Accounts recoverable within 30 days
- Contact support immediately
- After 30 days, data is permanently deleted`
  }
];

// Quick actions for common queries
const QUICK_ACTIONS: QuickAction[] = [
  { id: 'getting-started', label: 'Getting Started', icon: '🚀', query: 'How do I get started?' },
  { id: 'voice-stories', label: 'Voice Stories', icon: '🎙️', query: 'How do I record a voice story?' },
  { id: 'time-letters', label: 'Time Letters', icon: '✉️', query: 'How do time capsule letters work?' },
  { id: 'pricing', label: 'Pricing', icon: '💳', query: 'What are the subscription plans?' },
  { id: 'privacy', label: 'Privacy', icon: '🔒', query: 'How is my data protected?' },
  { id: 'contact', label: 'Contact Human', icon: '👤', query: 'I need to speak with a human' },
];

// ============================================================================
// SUPPORT BOT LOGIC
// ============================================================================

// Find relevant articles based on user query
function findRelevantArticles(query: string): KnowledgeArticle[] {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);
  
  const scored = KNOWLEDGE_BASE.map(article => {
    let score = 0;
    
    // Check keywords
    article.keywords.forEach(keyword => {
      if (queryLower.includes(keyword)) score += 10;
      words.forEach(word => {
        if (keyword.includes(word) || word.includes(keyword)) score += 5;
      });
    });
    
    // Check title
    if (article.title.toLowerCase().includes(queryLower)) score += 15;
    words.forEach(word => {
      if (article.title.toLowerCase().includes(word)) score += 3;
    });
    
    // Check content
    words.forEach(word => {
      if (article.content.toLowerCase().includes(word)) score += 1;
    });
    
    return { article, score };
  });
  
  return scored
    .filter(item => item.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.article);
}

// Detect intent from user message
function detectIntent(message: string): string {
  const lower = message.toLowerCase();
  
  if (lower.match(/cancel|unsubscribe|stop subscription|end my/)) return 'cancel';
  if (lower.match(/refund|money back|charge|billing issue/)) return 'billing';
  if (lower.match(/delete|remove account|close account/)) return 'delete_account';
  if (lower.match(/human|person|agent|real person|speak to someone/)) return 'escalate';
  if (lower.match(/not working|broken|error|bug|issue|problem|help/)) return 'troubleshoot';
  if (lower.match(/how do|how to|how can|what is|explain/)) return 'how_to';
  if (lower.match(/price|cost|plan|subscription|premium|free/)) return 'pricing';
  if (lower.match(/thank|thanks|great|perfect|awesome/)) return 'positive';
  if (lower.match(/angry|frustrated|upset|terrible|worst|hate/)) return 'negative';
  
  return 'general';
}

// Generate bot response
function generateResponse(query: string, articles: KnowledgeArticle[]): string {
  const intent = detectIntent(query);
  
  // Handle escalation
  if (intent === 'escalate') {
    return `I understand you'd like to speak with a human. I'm connecting you with our support team now.

**What to expect:**
- Response within 2 hours during business hours
- 24-48 hours on weekends
- You can also email us at support@heirloom.blue

While you wait, is there anything I can help clarify?`;
  }
  
  // Handle negative sentiment
  if (intent === 'negative') {
    return `I'm truly sorry you're having a frustrating experience. Your feelings are completely valid, and I want to help make this right.

Let me connect you with our support team who can give this their full attention. In the meantime, could you share more details about what's happening? The more I understand, the better we can help.

Would you like me to escalate this to a human right away?`;
  }
  
  // Handle positive sentiment
  if (intent === 'positive') {
    return `You're so welcome! I'm glad I could help. 😊

Is there anything else you'd like to know about preserving your memories with Heirloom?`;
  }
  
  // Handle cancellation intent with care
  if (intent === 'cancel') {
    return `I understand you're thinking about canceling. Before you go, I want to make sure you know your options:

**Pause Instead of Cancel:**
You can pause your subscription for up to 3 months. Your content stays safe, and you can resume anytime.

**Downgrade Option:**
Switch to our free plan and keep access to your existing memories.

**If You're Having Issues:**
I'd love to help resolve any problems. What's prompting you to cancel?

If you're sure you want to proceed, go to **Settings → Subscription → Cancel**. You'll keep access until your current billing period ends.`;
  }
  
  // If we found relevant articles
  if (articles.length > 0) {
    const mainArticle = articles[0];
    let response = mainArticle.content;
    
    // Add related articles if available
    if (articles.length > 1) {
      response += `\n\n---\n\n**Related Help:**`;
      articles.slice(1).forEach(article => {
        response += `\n• ${article.title}`;
      });
    }
    
    response += `\n\nDoes this answer your question? If not, I can connect you with our support team.`;
    
    return response;
  }
  
  // Fallback response
  return `I want to make sure I give you the right answer. Could you tell me a bit more about what you're looking for?

**Popular topics I can help with:**
• Getting started with Heirloom
• Recording voice stories
• Writing time-capsule letters
• Privacy and security
• Subscription and billing

Or if you'd prefer, I can connect you with a human from our support team.`;
}

// ============================================================================
// COMPONENTS
// ============================================================================

// Message bubble component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center mr-2 flex-shrink-0">
          <span className="text-void-deep text-sm">∞</span>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gold text-void-deep rounded-br-sm'
            : 'bg-void-elevated border border-gold/20 text-paper rounded-bl-sm'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content.split('\n').map((line, i) => {
            // Handle bold text
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                {parts.map((part, j) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                  }
                  return part;
                })}
              </p>
            );
          })}
        </div>
        <span className={`text-xs mt-2 block ${isUser ? 'text-void-deep/50' : 'text-paper/40'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

// Quick action buttons
const QuickActions: React.FC<{ onSelect: (query: string) => void }> = ({ onSelect }) => (
  <div className="flex flex-wrap gap-2 mb-4">
    {QUICK_ACTIONS.map(action => (
      <motion.button
        key={action.id}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect(action.query)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-void-elevated border border-gold/20 rounded-full text-sm text-paper/80 hover:border-gold/40 transition-colors"
      >
        <span>{action.icon}</span>
        <span>{action.label}</span>
      </motion.button>
    ))}
  </div>
);

// Feedback component
const FeedbackButtons: React.FC<{ onFeedback: (helpful: boolean) => void }> = ({ onFeedback }) => {
  const [submitted, setSubmitted] = useState(false);
  
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-paper/50 text-sm py-2"
      >
        Thanks for your feedback! 💜
      </motion.div>
    );
  }
  
  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <span className="text-paper/50 text-sm">Was this helpful?</span>
      <button
        onClick={() => { onFeedback(true); setSubmitted(true); }}
        className="p-2 hover:bg-green-500/20 rounded-full transition-colors"
      >
        👍
      </button>
      <button
        onClick={() => { onFeedback(false); setSubmitted(true); }}
        className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
      >
        👎
      </button>
    </div>
  );
};

// ============================================================================
// MAIN SUPPORT BOT COMPONENT
// ============================================================================

interface SupportBotProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const SupportBot: React.FC<SupportBotProps> = ({ isOpen, onClose, userId: _userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);
  
  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi there! 👋 I'm here to help you with anything related to Heirloom.

I can answer questions about:
• Getting started and features
• Recording voice stories
• Writing time-capsule letters
• Privacy and security
• Billing and subscriptions

What can I help you with today?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length]);
  
  // Handle sending message
  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setShowFeedback(false);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Find relevant articles and generate response
    const articles = findRelevantArticles(messageText);
    const response = generateResponse(messageText, articles);
    
    // Add bot response
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: { articles }
    };
    
    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
    setShowFeedback(true);
  };
  
  // Handle feedback
  const handleFeedback = (_helpful: boolean) => {
    // Analytics tracking would be implemented here in production
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-void-deep/80 backdrop-blur-sm z-40"
          />
          
          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-20 md:bottom-4 right-4 w-full max-w-md h-[500px] md:h-[600px] max-h-[70vh] md:max-h-[80vh] bg-void border border-gold/20 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gold/10 flex items-center justify-between bg-void-elevated">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center">
                  <span className="text-void-deep font-bold">∞</span>
                </div>
                <div>
                  <h3 className="text-paper font-semibold">Heirloom Support</h3>
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-paper/60 hover:text-paper transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map(message => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-2 text-paper/50 text-sm mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center">
                    <span className="text-void-deep text-sm">∞</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              
              {showFeedback && <FeedbackButtons onFeedback={handleFeedback} />}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick Actions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <QuickActions onSelect={handleSend} />
              </div>
            )}
            
            {/* Input */}
            <div className="p-4 border-t border-gold/10 bg-void-elevated">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-void border border-gold/20 rounded-xl px-4 py-3 text-paper placeholder-paper/40 focus:outline-none focus:border-gold/50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-12 h-12 bg-gradient-to-br from-gold to-gold-dim rounded-xl flex items-center justify-center text-void-deep disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// FLOATING SUPPORT BUTTON
// ============================================================================

export const SupportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-gold to-gold-dim rounded-full shadow-lg shadow-gold/30 flex items-center justify-center z-30"
      >
        <svg className="w-6 h-6 text-void-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </motion.button>
      
      <SupportBot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default SupportBot;
export { KNOWLEDGE_BASE, findRelevantArticles, detectIntent };
