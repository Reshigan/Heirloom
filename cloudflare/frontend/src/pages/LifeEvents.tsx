import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Send, X, GraduationCap, Heart, Baby, Cake, Sunset, Star, Calendar, User, Mail, Clock, CheckCircle, XCircle, ArrowRight, Image, Mic, FileText, Sparkles, ChevronRight
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api, { familyApi, memoriesApi, lettersApi, voiceApi } from '../services/api';

// Quick Create wizard templates
const QUICK_TEMPLATES = [
  { 
    id: 'graduation', 
    icon: GraduationCap, 
    title: 'Graduation Day',
    description: 'A message for when they graduate',
    eventType: 'GRADUATION',
    suggestedTitle: 'Congratulations on Your Graduation!',
  },
  { 
    id: 'wedding', 
    icon: Heart, 
    title: 'Wedding Day',
    description: 'Words of love for their special day',
    eventType: 'WEDDING',
    suggestedTitle: 'On Your Wedding Day',
  },
  { 
    id: 'first-child', 
    icon: Baby, 
    title: 'First Child',
    description: 'Welcome their new baby',
    eventType: 'FIRST_CHILD',
    suggestedTitle: 'Welcome to Parenthood',
  },
  { 
    id: 'milestone-birthday', 
    icon: Cake, 
    title: 'Milestone Birthday',
    description: 'For a special birthday (18, 21, 30...)',
    eventType: 'BIRTHDAY',
    suggestedTitle: 'Happy Milestone Birthday!',
  },
  { 
    id: 'when-they-miss-me', 
    icon: Sunset, 
    title: 'When They Miss Me',
    description: 'Comfort for difficult moments',
    eventType: 'LOSS',
    suggestedTitle: 'When You Need Me Most',
  },
];

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email: string;
}

interface LifeEventTrigger {
  id: string;
  event_type: string;
  event_name: string;
  event_description: string;
  family_member_id: string | null;
  family_member_name: string | null;
  family_member_relationship: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  trigger_method: string;
  scheduled_date: string | null;
  content_items: string;
  status: string;
  triggered_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

const EVENT_TYPES = [
  { value: 'GRADUATION', label: 'Graduation', icon: GraduationCap, color: 'text-blue-400' },
  { value: 'WEDDING', label: 'Wedding', icon: Heart, color: 'text-pink-400' },
  { value: 'FIRST_CHILD', label: 'First Child', icon: Baby, color: 'text-purple-400' },
  { value: 'BIRTHDAY_MILESTONE', label: 'Milestone Birthday', icon: Cake, color: 'text-yellow-400' },
  { value: 'RETIREMENT', label: 'Retirement', icon: Sunset, color: 'text-orange-400' },
  { value: 'CUSTOM', label: 'Custom Event', icon: Star, color: 'text-gold' },
];

// Trigger methods available for advanced options (used in handleQuickCreate)
const _TRIGGER_METHODS = [
  { value: 'MANUAL', label: 'Manual', description: 'You trigger it when ready' },
  { value: 'DATE', label: 'Scheduled Date', description: 'Auto-trigger on a date' },
  { value: 'RECIPIENT_CONFIRMS', label: 'Recipient Confirms', description: 'They confirm the event' },
];
void _TRIGGER_METHODS; // Suppress unused warning - kept for future advanced options

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  TRIGGERED: { label: 'Triggered', color: 'text-blue-400 bg-blue-400/10', icon: Send },
  DELIVERED: { label: 'Delivered', color: 'text-green-400 bg-green-400/10', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10', icon: XCircle },
};

export function LifeEvents() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showContentPicker, setShowContentPicker] = useState(false);
  
  // Wizard state - simplified 3-step flow
  const [wizardStep, setWizardStep] = useState(1); // 1: Pick template, 2: Pick recipient, 3: Review & customize
  const [selectedTemplate, setSelectedTemplate] = useState<typeof QUICK_TEMPLATES[0] | null>(null);

  // Feature onboarding
  const { isOpen: isOnboardingOpen, completeOnboarding, dismissOnboarding, openOnboarding } = useFeatureOnboarding('life-events');

  // Form state
  const [eventType, setEventType] = useState('GRADUATION');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [familyMemberId, setFamilyMemberId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [triggerMethod, setTriggerMethod] = useState('MANUAL');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedContent, setSelectedContent] = useState<{ type: string; id: string; title: string }[]>([]);

    const { data: triggers, isLoading } = useQuery<{ triggers: LifeEventTrigger[] }>({
      queryKey: ['life-events'],
      queryFn: () => api.get('/api/life-events').then((r: { data: { triggers: LifeEventTrigger[] } }) => r.data),
    });

  const { data: familyData } = useQuery({
    queryKey: ['family-for-events'],
    queryFn: () => familyApi.getAll().then(r => r.data),
    enabled: showCreate,
  });

  const { data: memoriesData } = useQuery({
    queryKey: ['memories-for-events'],
    queryFn: () => memoriesApi.getAll().then(r => r.data),
    enabled: showContentPicker,
  });

  const { data: lettersData } = useQuery({
    queryKey: ['letters-for-events'],
    queryFn: () => lettersApi.getAll().then(r => r.data),
    enabled: showContentPicker,
  });

  const { data: voiceData } = useQuery({
    queryKey: ['voice-for-events'],
    queryFn: () => voiceApi.getAll().then(r => r.data),
    enabled: showContentPicker,
  });

  // Normalize API responses - handle multiple response shapes
  const family: FamilyMember[] = Array.isArray(familyData) ? familyData : (familyData?.members || familyData?.data || []);
  const memories = (() => {
    if (!memoriesData) return [];
    if (Array.isArray(memoriesData)) return memoriesData;
    if (memoriesData.data && Array.isArray(memoriesData.data)) return memoriesData.data;
    if (memoriesData.memories && Array.isArray(memoriesData.memories)) return memoriesData.memories;
    return [];
  })();
  const letters = (() => {
    if (!lettersData) return [];
    if (Array.isArray(lettersData)) return lettersData;
    if (lettersData.data && Array.isArray(lettersData.data)) return lettersData.data;
    if (lettersData.letters && Array.isArray(lettersData.letters)) return lettersData.letters;
    return [];
  })();
  const voiceRecordings = (() => {
    if (!voiceData) return [];
    if (Array.isArray(voiceData)) return voiceData;
    if (voiceData.data && Array.isArray(voiceData.data)) return voiceData.data;
    if (voiceData.recordings && Array.isArray(voiceData.recordings)) return voiceData.recordings;
    return [];
  })();

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/life-events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-events'] });
      resetForm();
    },
  });

  const triggerMutation = useMutation({
    mutationFn: (triggerId: string) => api.post(`/api/life-events/${triggerId}/trigger`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-events'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (triggerId: string) => api.post(`/api/life-events/${triggerId}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-events'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (triggerId: string) => api.delete(`/api/life-events/${triggerId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-events'] }),
  });

  const resetForm = () => {
    setShowCreate(false);
    setWizardStep(1);
    setSelectedTemplate(null);
    setEventType('GRADUATION');
    setEventName('');
    setEventDescription('');
    setFamilyMemberId(null);
    setRecipientName('');
    setRecipientEmail('');
    setTriggerMethod('MANUAL');
    setScheduledDate('');
    setSelectedContent([]);
  };

  const handleTemplateSelect = (template: typeof QUICK_TEMPLATES[0]) => {
    setSelectedTemplate(template);
    setEventType(template.eventType);
    setEventName(template.suggestedTitle);
    setWizardStep(2);
  };

  const handleRecipientSelect = (member: FamilyMember) => {
    setFamilyMemberId(member.id);
    setRecipientName(member.name);
    setRecipientEmail(member.email || '');
    // Auto-select recent content for this recipient
    const recentMemories = memories.slice(0, 3).map((m: { id: string; title: string }) => ({ type: 'MEMORY', id: m.id, title: m.title }));
    setSelectedContent(recentMemories);
    setWizardStep(3);
  };

  const handleQuickCreate = () => {
    if (!eventName.trim()) return;
    createMutation.mutate({
      eventType,
      eventName: eventName.trim(),
      eventDescription: eventDescription.trim() || undefined,
      recipientName,
      recipientEmail: recipientEmail || undefined,
      familyMemberId: familyMemberId || undefined,
      triggerMethod,
      scheduledDate: triggerMethod === 'DATE' ? scheduledDate : undefined,
      content: selectedContent,
    });
  };

  // Legacy create handler - kept for advanced mode
  const _handleCreate = () => {
    if (!eventName.trim()) return;
    
    createMutation.mutate({
      eventType,
      eventName: eventName.trim(),
      eventDescription: eventDescription.trim() || undefined,
      familyMemberId: familyMemberId || undefined,
      recipientName: recipientName.trim() || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
      triggerMethod,
      scheduledDate: scheduledDate || undefined,
      contentItems: selectedContent.map(c => ({ type: c.type, id: c.id })),
    });
  };
  void _handleCreate;

  // Legacy family member select - kept for advanced mode
  const _handleFamilyMemberSelect = (memberId: string) => {
    const member = family.find(m => m.id === memberId);
    if (member) {
      setFamilyMemberId(memberId);
      setRecipientName(member.name);
      setRecipientEmail(member.email || '');
    }
  };
  void _handleFamilyMemberSelect;

  const addContent = (type: string, id: string, title: string) => {
    if (!selectedContent.find(c => c.type === type && c.id === id)) {
      setSelectedContent([...selectedContent, { type, id, title }]);
    }
    setShowContentPicker(false);
  };

  const removeContent = (type: string, id: string) => {
    setSelectedContent(selectedContent.filter(c => !(c.type === type && c.id === id)));
  };

  const getEventIcon = (type: string) => {
    const config = EVENT_TYPES.find(e => e.value === type);
    return config?.icon || Star;
  };

  const getEventColor = (type: string) => {
    const config = EVENT_TYPES.find(e => e.value === type);
    return config?.color || 'text-gold';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="eternal-bg">
          <div className="eternal-aura" />
          <div className="eternal-stars" />
        </div>
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="eternal-bg">
        <div className="eternal-aura" />
        <div className="eternal-stars" />
        <div className="eternal-mist" />
      </div>

      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-16 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className="font-display text-4xl md:text-5xl mb-2">Life Event Triggers</h1>
            <p className="text-paper/60">
              Deliver messages when life's special moments happen
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create Trigger
          </button>
        </motion.div>

        {/* Triggers List */}
        {triggers?.triggers && triggers.triggers.length > 0 ? (
          <div className="space-y-4">
            {triggers.triggers.map((trigger, index) => {
              const Icon = getEventIcon(trigger.event_type);
              const statusConfig = STATUS_CONFIG[trigger.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={trigger.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-xl p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-paper/5 flex items-center justify-center ${getEventColor(trigger.event_type)}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-lg">{trigger.event_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </div>
                      {trigger.event_description && (
                        <p className="text-paper/50 text-sm mb-2">{trigger.event_description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-paper/40">
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {trigger.recipient_name || trigger.family_member_name || 'No recipient'}
                        </span>
                        {trigger.recipient_email && (
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {trigger.recipient_email}
                          </span>
                        )}
                        {trigger.scheduled_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(trigger.scheduled_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {JSON.parse(trigger.content_items || '[]').length} items attached
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {trigger.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => triggerMutation.mutate(trigger.id)}
                            disabled={triggerMutation.isPending}
                            className="btn btn-primary btn-sm flex items-center gap-1"
                          >
                            <Send size={14} />
                            Trigger Now
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(trigger.id)}
                            className="btn btn-ghost btn-sm text-paper/50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(trigger.id)}
                        className="p-2 hover:bg-paper/10 rounded-lg transition-colors text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Calendar size={64} className="mx-auto text-paper/20 mb-4" />
            <h3 className="text-xl font-medium mb-2">No life event triggers yet</h3>
            <p className="text-paper/50 mb-6">Create triggers to deliver messages at life's special moments</p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary"
            >
              Create Your First Trigger
            </button>
          </motion.div>
        )}

        {/* Create Modal - Simplified Wizard */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1100] p-4 overflow-y-auto"
              onClick={() => resetForm()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-6 max-w-xl w-full my-8"
                onClick={e => e.stopPropagation()}
              >
                {/* Wizard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {wizardStep > 1 && (
                      <button 
                        onClick={() => setWizardStep(wizardStep - 1)} 
                        className="text-paper/50 hover:text-paper"
                      >
                        <ArrowRight size={20} className="rotate-180" />
                      </button>
                    )}
                    <div>
                      <h3 className="text-xl font-medium">
                        {wizardStep === 1 && 'What moment do you want to capture?'}
                        {wizardStep === 2 && 'Who is this for?'}
                        {wizardStep === 3 && 'Review & Create'}
                      </h3>
                      <p className="text-sm text-paper/50">Step {wizardStep} of 3</p>
                    </div>
                  </div>
                  <button onClick={() => resetForm()} className="text-paper/50 hover:text-paper">
                    <X size={24} />
                  </button>
                </div>

                {/* Step 1: Pick Template */}
                {wizardStep === 1 && (
                  <div className="space-y-3">
                    {QUICK_TEMPLATES.map((template) => {
                      const TemplateIcon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full p-4 rounded-xl bg-paper/5 hover:bg-paper/10 transition-all flex items-center gap-4 text-left group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
                            <TemplateIcon size={24} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{template.title}</h4>
                            <p className="text-sm text-paper/50">{template.description}</p>
                          </div>
                          <ChevronRight size={20} className="text-paper/30 group-hover:text-gold transition-colors" />
                        </button>
                      );
                    })}
                    <div className="pt-4 border-t border-paper/10">
                      <button
                        onClick={() => {
                          setWizardStep(2);
                          setSelectedTemplate(null);
                        }}
                        className="w-full p-3 text-center text-paper/50 hover:text-paper transition-colors"
                      >
                        Or create a custom event...
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Pick Recipient */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    {family.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-paper/60 mb-3">Select a family member:</p>
                        {family.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => handleRecipientSelect(member)}
                            className={`w-full p-4 rounded-xl transition-all flex items-center gap-4 text-left ${
                              familyMemberId === member.id 
                                ? 'bg-gold/20 border border-gold/30' 
                                : 'bg-paper/5 hover:bg-paper/10'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{member.name}</h4>
                              <p className="text-sm text-paper/50">{member.relationship}</p>
                            </div>
                            <ChevronRight size={20} className="text-paper/30" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User size={48} className="mx-auto text-paper/20 mb-4" />
                        <h4 className="font-medium mb-2">No family members yet</h4>
                        <p className="text-paper/50 text-sm mb-4">Add family members to easily select recipients</p>
                        <a href="/family" className="btn btn-primary">
                          Add Family Members
                        </a>
                      </div>
                    )}
                    <div className="pt-4 border-t border-paper/10">
                      <p className="text-sm text-paper/50 mb-2">Or enter manually:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Recipient name"
                          className="bg-void/50 border border-paper/10 rounded-lg px-4 py-2 focus:outline-none focus:border-gold/50"
                        />
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="Recipient email"
                          className="bg-void/50 border border-paper/10 rounded-lg px-4 py-2 focus:outline-none focus:border-gold/50"
                        />
                      </div>
                      {recipientName && (
                        <button
                          onClick={() => setWizardStep(3)}
                          className="w-full mt-3 btn btn-primary"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Create */}
                {wizardStep === 3 && (
                  <div className="space-y-5">
                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-gold/10 border border-gold/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles size={20} className="text-gold" />
                        <span className="font-medium">Ready to create</span>
                      </div>
                      <p className="text-sm text-paper/70">
                        {selectedTemplate ? `"${selectedTemplate.title}"` : 'Custom event'} for <strong>{recipientName}</strong>
                      </p>
                    </div>

                    {/* Editable Title */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Event Title</label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Give this event a name..."
                        className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                      />
                    </div>

                    {/* Optional Message */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Personal Message (optional)</label>
                      <textarea
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="Add a heartfelt message..."
                        rows={3}
                        className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50 resize-none"
                      />
                    </div>

                    {/* Auto-selected Content */}
                    {selectedContent.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Included Content ({selectedContent.length} items)
                        </label>
                        <div className="space-y-1">
                          {selectedContent.map((item) => (
                            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-2 bg-void/30 rounded-lg text-sm">
                              <span>{item.title}</span>
                              <button
                                onClick={() => removeContent(item.type, item.id)}
                                className="text-paper/50 hover:text-red-400"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowContentPicker(true)}
                          className="mt-2 text-sm text-gold hover:underline"
                        >
                          + Add more content
                        </button>
                      </div>
                    )}

                    {selectedContent.length === 0 && (
                      <button
                        onClick={() => setShowContentPicker(true)}
                        className="w-full p-3 border border-dashed border-paper/20 rounded-lg text-paper/50 hover:text-paper hover:border-paper/40 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Add photos, letters, or voice recordings
                      </button>
                    )}

                    {/* Create Button */}
                    <button
                      onClick={handleQuickCreate}
                      disabled={!eventName.trim() || createMutation.isPending}
                      className="w-full py-4 bg-gradient-to-r from-gold to-gold/80 text-void font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {createMutation.isPending ? (
                        <div className="animate-spin w-5 h-5 border-2 border-void border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Create Life Event
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Picker Modal - Keep existing but simplified */}
        <AnimatePresence>
          {showContentPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
              onClick={() => setShowContentPicker(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-medium mb-4">Add Content</h3>
                
                {memories.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-paper/60 mb-2 flex items-center gap-2">
                      <Image size={14} /> Photos & Memories ({memories.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {memories.slice(0, 10).map((m: { id: string; title: string }) => (
                        <button
                          key={m.id}
                          onClick={() => addContent('MEMORY', m.id, m.title)}
                          disabled={selectedContent.some(c => c.id === m.id)}
                          className="w-full p-2 text-left hover:bg-paper/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {letters.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-paper/60 mb-2 flex items-center gap-2">
                      <FileText size={14} /> Letters ({letters.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {letters.slice(0, 10).map((l: { id: string; title: string }) => (
                        <button
                          key={l.id}
                          onClick={() => addContent('LETTER', l.id, l.title || 'Untitled Letter')}
                          disabled={selectedContent.some(c => c.id === l.id)}
                          className="w-full p-2 text-left hover:bg-paper/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {l.title || 'Untitled Letter'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {voiceRecordings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-paper/60 mb-2 flex items-center gap-2">
                      <Mic size={14} /> Voice Recordings ({voiceRecordings.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {voiceRecordings.slice(0, 10).map((v: { id: string; title: string }) => (
                        <button
                          key={v.id}
                          onClick={() => addContent('VOICE', v.id, v.title)}
                          disabled={selectedContent.some(c => c.id === v.id)}
                          className="w-full p-2 text-left hover:bg-paper/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {memories.length === 0 && letters.length === 0 && voiceRecordings.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-paper/50 mb-4">No content available yet. Create some first:</p>
                    <div className="space-y-2">
                      <a
                        href="/memories"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                      >
                        <Image size={18} />
                        Add Photos & Memories
                        <ArrowRight size={14} />
                      </a>
                      <a
                        href="/compose"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                      >
                        <FileText size={18} />
                        Write a Letter
                        <ArrowRight size={14} />
                      </a>
                      <a
                        href="/record"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-colors"
                      >
                        <Mic size={18} />
                        Record a Voice Message
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowContentPicker(false)}
                  className="w-full btn btn-primary mt-4"
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Help Button */}
      <OnboardingHelpButton onClick={openOnboarding} />

      {/* Feature Onboarding */}
      <FeatureOnboarding
        featureKey="life-events"
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />
    </div>
  );
}

export default LifeEvents;
