import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '../components/Navigation';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import { ProgressHair } from '../components/ui/ProgressHair';
import api, { familyApi, memoriesApi, lettersApi, voiceApi } from '../services/api';

// Quick Create wizard templates
const QUICK_TEMPLATES = [
  {
    id: 'graduation',
    title: 'Graduation Day',
    description: 'A message for when they graduate',
    eventType: 'GRADUATION',
    suggestedTitle: 'Congratulations on Your Graduation!',
  },
  {
    id: 'wedding',
    title: 'Wedding Day',
    description: 'Words of love for their special day',
    eventType: 'WEDDING',
    suggestedTitle: 'On Your Wedding Day',
  },
  {
    id: 'first-child',
    title: 'First Child',
    description: 'Welcome their new baby',
    eventType: 'FIRST_CHILD',
    suggestedTitle: 'Welcome to Parenthood',
  },
  {
    id: 'milestone-birthday',
    title: 'Milestone Birthday',
    description: 'For a special birthday (18, 21, 30...)',
    eventType: 'BIRTHDAY',
    suggestedTitle: 'Happy Milestone Birthday!',
  },
  {
    id: 'when-they-miss-me',
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

// Event type catalog - kept for future advanced options
const _EVENT_TYPES = [
  { value: 'GRADUATION', label: 'Graduation' },
  { value: 'WEDDING', label: 'Wedding' },
  { value: 'FIRST_CHILD', label: 'First Child' },
  { value: 'BIRTHDAY_MILESTONE', label: 'Milestone Birthday' },
  { value: 'RETIREMENT', label: 'Retirement' },
  { value: 'CUSTOM', label: 'Custom Event' },
];
void _EVENT_TYPES;

// Trigger methods available for advanced options (used in handleQuickCreate)
const _TRIGGER_METHODS = [
  { value: 'MANUAL', label: 'Manual', description: 'You trigger it when ready' },
  { value: 'DATE', label: 'Scheduled Date', description: 'Auto-trigger on a date' },
  { value: 'RECIPIENT_CONFIRMS', label: 'Recipient Confirms', description: 'They confirm the event' },
];
void _TRIGGER_METHODS; // Suppress unused warning - kept for future advanced options

const STATUS_CONFIG: Record<string, { label: string }> = {
  PENDING: { label: 'Pending' },
  TRIGGERED: { label: 'Triggered' },
  DELIVERED: { label: 'Delivered' },
  CANCELLED: { label: 'Cancelled' },
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

  if (isLoading) {
    return (
      <div className="min-h-screen relative bg-void">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <ProgressHair label="loading…" width={180} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-void text-paper antialiased">
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-16 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-3">Life Events</p>
            <h1 className="font-display font-light text-4xl md:text-5xl mb-2 tracking-[-0.018em]">Life Event Triggers</h1>
            <p className="text-paper-70 font-light">
              Deliver messages when life's special moments happen
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn btn-primary"
          >
            Create Trigger
          </button>
        </motion.div>

        {/* Triggers List */}
        {triggers?.triggers && triggers.triggers.length > 0 ? (
          <div className="space-y-4">
            {triggers.triggers.map((trigger, index) => {
              const statusConfig = STATUS_CONFIG[trigger.status] || STATUS_CONFIG.PENDING;

              return (
                <motion.div
                  key={trigger.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-void-surface border border-paper-15 rounded-[2px] p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-body text-lg">{trigger.event_name}</h3>
                        <span className="px-2 py-0.5 rounded-[2px] text-xs font-mono uppercase tracking-[0.1em] border border-paper-15 text-paper-70">
                          {statusConfig.label}
                        </span>
                      </div>
                      {trigger.event_description && (
                        <p className="text-paper-65 text-sm mb-2">{trigger.event_description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-paper-70">
                        <span>
                          {trigger.recipient_name || trigger.family_member_name || 'No recipient'}
                        </span>
                        {trigger.recipient_email && (
                          <span className="font-mono text-xs">{trigger.recipient_email}</span>
                        )}
                        {trigger.scheduled_date && (
                          <span className="font-mono text-xs">
                            {new Date(trigger.scheduled_date).toLocaleDateString()}
                          </span>
                        )}
                        <span>
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
                            className="btn btn-primary btn-sm"
                          >
                            Trigger Now
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(trigger.id)}
                            className="btn btn-ghost btn-sm text-paper-65"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(trigger.id)}
                        className="text-paper-50 hover:text-blood transition-colors text-sm p-2"
                      >
                        Delete
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
            <span className="font-display text-4xl text-paper-30 block mb-6" aria-hidden>∞</span>
            <h3 className="font-body text-xl mb-2">No life event triggers yet</h3>
            <p className="text-paper-65 mb-6">Create triggers to deliver messages at life's special moments</p>
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
              className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
              onClick={() => resetForm()}
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-void-surface border border-paper-15 rounded-[2px] p-6 max-w-xl w-full my-8"
                onClick={e => e.stopPropagation()}
              >
                {/* Wizard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {wizardStep > 1 && (
                      <button
                        onClick={() => setWizardStep(wizardStep - 1)}
                        className="text-paper-50 hover:text-paper transition-colors"
                        aria-label="Back"
                      >
                        <span aria-hidden>←</span>
                      </button>
                    )}
                    <div>
                      <h3 className="font-body text-xl">
                        {wizardStep === 1 && 'What moment do you want to capture?'}
                        {wizardStep === 2 && 'Who is this for?'}
                        {wizardStep === 3 && 'Review & Create'}
                      </h3>
                      <p className="text-sm text-paper-65 font-mono">Step {wizardStep} of 3</p>
                    </div>
                  </div>
                  <button onClick={() => resetForm()} className="text-paper-50 hover:text-paper transition-colors" aria-label="Close">
                    <span aria-hidden>✕</span>
                  </button>
                </div>

                {/* Step 1: Pick Template */}
                {wizardStep === 1 && (
                  <div className="space-y-3">
                    {QUICK_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="w-full p-4 rounded-[2px] bg-void border border-paper-15 hover:bg-void-elevated transition-colors flex items-center gap-4 text-left group"
                      >
                        <div className="flex-1">
                          <h4 className="font-body">{template.title}</h4>
                          <p className="text-sm text-paper-65">{template.description}</p>
                        </div>
                        <span aria-hidden className="text-paper-50 group-hover:text-gold transition-colors">→</span>
                      </button>
                    ))}
                    <div className="pt-4 border-t border-paper-15">
                      <button
                        onClick={() => {
                          setWizardStep(2);
                          setSelectedTemplate(null);
                        }}
                        className="w-full p-3 text-center text-paper-65 hover:text-paper transition-colors"
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
                        <p className="text-sm text-paper-70 mb-3">Select a family member:</p>
                        {family.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => handleRecipientSelect(member)}
                            className={`w-full p-4 rounded-[2px] transition-colors flex items-center gap-4 text-left border ${
                              familyMemberId === member.id
                                ? 'border-gold-40 text-gold'
                                : 'border-paper-15 bg-void hover:bg-void-elevated'
                            }`}
                          >
                            <div className="flex-1">
                              <h4 className="font-body">{member.name}</h4>
                              <p className="text-sm text-paper-65">{member.relationship}</p>
                            </div>
                            <span aria-hidden className="text-paper-50">→</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <h4 className="font-body mb-2">No family members yet</h4>
                        <p className="text-paper-65 text-sm mb-4">Add family members to easily select recipients</p>
                        <a href="/family" className="btn btn-primary">
                          Add Family Members
                        </a>
                      </div>
                    )}
                    <div className="pt-4 border-t border-paper-15">
                      <p className="text-sm text-paper-65 mb-2">Or enter manually:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Recipient name"
                          className="bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-2 placeholder:text-paper-30 transition-colors"
                        />
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="Recipient email"
                          className="bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-2 placeholder:text-paper-30 transition-colors"
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
                    <div className="p-4 rounded-[2px] bg-void border border-gold-40">
                      <p className="font-body mb-2">Ready to create</p>
                      <p className="text-sm text-paper-70">
                        {selectedTemplate ? `"${selectedTemplate.title}"` : 'Custom event'} for <strong>{recipientName}</strong>
                      </p>
                    </div>

                    {/* Editable Title */}
                    <div>
                      <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Event Title</label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        placeholder="Give this event a name..."
                        className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 placeholder:text-paper-30 transition-colors"
                      />
                    </div>

                    {/* Optional Message */}
                    <div>
                      <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Personal Message (optional)</label>
                      <textarea
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="Add a heartfelt message..."
                        rows={3}
                        className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 placeholder:text-paper-30 transition-colors resize-none"
                      />
                    </div>

                    {/* Auto-selected Content */}
                    {selectedContent.length > 0 && (
                      <div>
                        <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">
                          Included Content ({selectedContent.length} items)
                        </label>
                        <div className="space-y-1">
                          {selectedContent.map((item) => (
                            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-2 bg-void border border-paper-15 rounded-[2px] text-sm">
                              <span>{item.title}</span>
                              <button
                                onClick={() => removeContent(item.type, item.id)}
                                aria-label="Remove content"
                                className="text-paper-50 hover:text-blood transition-colors"
                              >
                                <span aria-hidden>✕</span>
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowContentPicker(true)}
                          className="mt-2 text-sm text-gold hover:text-gold-bright transition-colors"
                        >
                          + Add more content
                        </button>
                      </div>
                    )}

                    {selectedContent.length === 0 && (
                      <button
                        onClick={() => setShowContentPicker(true)}
                        className="w-full p-3 border border-dashed border-paper-15 rounded-[2px] text-paper-65 hover:text-paper hover:border-paper-15 transition-colors flex items-center justify-center gap-2"
                      >
                        <span aria-hidden>+</span>
                        Add photos, letters, or voice recordings
                      </button>
                    )}

                    {/* Create Button */}
                    <button
                      onClick={handleQuickCreate}
                      disabled={!eventName.trim() || createMutation.isPending}
                      className="w-full btn btn-primary"
                    >
                      {createMutation.isPending ? 'Creating…' : 'Create Life Event'}
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
              className="fixed inset-0 bg-void/80 flex items-center justify-center z-[60] p-4"
              onClick={() => setShowContentPicker(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-void-surface border border-paper-15 rounded-[2px] p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-body text-lg mb-4">Add Content</h3>

                {memories.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">
                      Photos & Memories ({memories.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {memories.slice(0, 10).map((m: { id: string; title: string }) => (
                        <button
                          key={m.id}
                          onClick={() => addContent('MEMORY', m.id, m.title)}
                          disabled={selectedContent.some(c => c.id === m.id)}
                          className="w-full p-2 text-left hover:bg-void-elevated rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {letters.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">
                      Letters ({letters.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {letters.slice(0, 10).map((l: { id: string; title: string }) => (
                        <button
                          key={l.id}
                          onClick={() => addContent('LETTER', l.id, l.title || 'Untitled Letter')}
                          disabled={selectedContent.some(c => c.id === l.id)}
                          className="w-full p-2 text-left hover:bg-void-elevated rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {l.title || 'Untitled Letter'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {voiceRecordings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">
                      Voice Recordings ({voiceRecordings.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {voiceRecordings.slice(0, 10).map((v: { id: string; title: string }) => (
                        <button
                          key={v.id}
                          onClick={() => addContent('VOICE', v.id, v.title)}
                          disabled={selectedContent.some(c => c.id === v.id)}
                          className="w-full p-2 text-left hover:bg-void-elevated rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {memories.length === 0 && letters.length === 0 && voiceRecordings.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-paper-65 mb-4">No content available yet. Create some first:</p>
                    <div className="space-y-2">
                      <a
                        href="/memories"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-void border border-paper-15 rounded-[2px] text-paper hover:bg-void-elevated transition-colors"
                      >
                        Add Photos & Memories
                        <span aria-hidden>→</span>
                      </a>
                      <a
                        href="/compose"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-void border border-paper-15 rounded-[2px] text-paper hover:bg-void-elevated transition-colors"
                      >
                        Write a Letter
                        <span aria-hidden>→</span>
                      </a>
                      <a
                        href="/record"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-void border border-paper-15 rounded-[2px] text-paper hover:bg-void-elevated transition-colors"
                      >
                        Record a Voice Message
                        <span aria-hidden>→</span>
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
