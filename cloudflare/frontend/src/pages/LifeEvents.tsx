import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Send, X, GraduationCap, Heart, Baby, Cake, Sunset, Star, Calendar, User, Mail, Clock, CheckCircle, XCircle, ArrowRight, Image, Mic, FileText
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api, { familyApi, memoriesApi, lettersApi, voiceApi } from '../services/api';

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

const TRIGGER_METHODS = [
  { value: 'MANUAL', label: 'Manual', description: 'You trigger it when ready' },
  { value: 'DATE', label: 'Scheduled Date', description: 'Auto-trigger on a date' },
  { value: 'RECIPIENT_CONFIRMS', label: 'Recipient Confirms', description: 'They confirm the event' },
];

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

  const family: FamilyMember[] = Array.isArray(familyData) ? familyData : familyData?.members || [];
  const memories = Array.isArray(memoriesData) ? memoriesData : memoriesData?.memories || [];
  const letters = Array.isArray(lettersData) ? lettersData : lettersData?.letters || [];
  const voiceRecordings = Array.isArray(voiceData) ? voiceData : voiceData?.recordings || [];

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

  const handleCreate = () => {
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

  const handleFamilyMemberSelect = (memberId: string) => {
    const member = family.find(m => m.id === memberId);
    if (member) {
      setFamilyMemberId(memberId);
      setRecipientName(member.name);
      setRecipientEmail(member.email || '');
    }
  };

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

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto"
              onClick={() => resetForm()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass rounded-2xl p-6 max-w-xl w-full my-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium">Create Life Event Trigger</h3>
                  <button onClick={() => resetForm()} className="text-paper/50 hover:text-paper">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {EVENT_TYPES.map((type) => {
                        const TypeIcon = type.icon;
                        return (
                          <button
                            key={type.value}
                            onClick={() => setEventType(type.value)}
                            className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                              eventType === type.value 
                                ? 'bg-gold/20 border border-gold/30' 
                                : 'bg-void/30 hover:bg-void/50'
                            }`}
                          >
                            <TypeIcon size={20} className={type.color} />
                            <span className="text-xs">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Event Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Name</label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Sarah's Wedding Day"
                      className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Message (optional)</label>
                    <textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="A special message for this moment..."
                      rows={2}
                      className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50 resize-none"
                    />
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Recipient</label>
                    {family.length > 0 && (
                      <select
                        value={familyMemberId || ''}
                        onChange={(e) => handleFamilyMemberSelect(e.target.value)}
                        className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50 mb-2"
                      >
                        <option value="">Select from family...</option>
                        {family.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.relationship})
                          </option>
                        ))}
                      </select>
                    )}
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
                  </div>

                  {/* Trigger Method */}
                  <div>
                    <label className="block text-sm font-medium mb-2">When to Trigger</label>
                    <div className="space-y-2">
                      {TRIGGER_METHODS.map((method) => (
                        <button
                          key={method.value}
                          onClick={() => setTriggerMethod(method.value)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            triggerMethod === method.value 
                              ? 'bg-gold/20 border border-gold/30' 
                              : 'bg-void/30 hover:bg-void/50'
                          }`}
                        >
                          <p className="font-medium">{method.label}</p>
                          <p className="text-xs text-paper/50">{method.description}</p>
                        </button>
                      ))}
                    </div>
                    {triggerMethod === 'DATE' && (
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full mt-2 bg-void/50 border border-paper/10 rounded-lg px-4 py-2 focus:outline-none focus:border-gold/50"
                      />
                    )}
                  </div>

                  {/* Content to Deliver */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Content to Deliver</label>
                    <div className="space-y-2 mb-2">
                      {selectedContent.map((content) => (
                        <div key={`${content.type}-${content.id}`} className="flex items-center justify-between p-2 bg-void/30 rounded-lg">
                          <span className="text-sm">{content.title} ({content.type})</span>
                          <button
                            onClick={() => removeContent(content.type, content.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowContentPicker(true)}
                      className="w-full p-3 border border-dashed border-paper/20 rounded-lg text-paper/50 hover:text-paper hover:border-paper/40 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add content
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCreate}
                      disabled={!eventName.trim() || createMutation.isPending}
                      className="flex-1 btn btn-primary"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create Trigger'}
                    </button>
                    <button onClick={() => resetForm()} className="btn btn-ghost">
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Picker Modal */}
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
                <h3 className="text-lg font-medium mb-4">Select Content</h3>
                
                {memories.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-paper/60 mb-2">Memories</h4>
                    <div className="space-y-1">
                      {memories.slice(0, 5).map((m: { id: string; title: string }) => (
                        <button
                          key={m.id}
                          onClick={() => addContent('MEMORY', m.id, m.title)}
                          className="w-full p-2 text-left hover:bg-paper/10 rounded-lg transition-colors"
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {letters.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-paper/60 mb-2">Letters</h4>
                    <div className="space-y-1">
                      {letters.slice(0, 5).map((l: { id: string; title: string }) => (
                        <button
                          key={l.id}
                          onClick={() => addContent('LETTER', l.id, l.title || 'Untitled Letter')}
                          className="w-full p-2 text-left hover:bg-paper/10 rounded-lg transition-colors"
                        >
                          {l.title || 'Untitled Letter'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {voiceRecordings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-paper/60 mb-2">Voice Recordings</h4>
                    <div className="space-y-1">
                      {voiceRecordings.slice(0, 5).map((v: { id: string; title: string }) => (
                        <button
                          key={v.id}
                          onClick={() => addContent('VOICE', v.id, v.title)}
                          className="w-full p-2 text-left hover:bg-paper/10 rounded-lg transition-colors"
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
                  className="w-full btn btn-ghost mt-4"
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
