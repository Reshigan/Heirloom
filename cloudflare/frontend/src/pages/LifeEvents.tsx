import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
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
void _TRIGGER_METHODS;

const STATUS_CONFIG: Record<string, { label: string }> = {
  PENDING: { label: 'pending' },
  TRIGGERED: { label: 'triggered' },
  DELIVERED: { label: 'delivered' },
  CANCELLED: { label: 'cancelled' },
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--loom-rule)',
  borderRadius: 2,
  color: 'var(--loom-bone)',
  caretColor: 'var(--loom-warm)',
  fontFamily: "'Source Serif 4', serif",
  fontSize: 15,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Inter', sans-serif",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--loom-bone-faint)',
  marginBottom: 10,
};

export function LifeEvents() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showContentPicker, setShowContentPicker] = useState(false);

  const [wizardStep, setWizardStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof QUICK_TEMPLATES[0] | null>(null);

  const { isOpen: isOnboardingOpen, completeOnboarding, dismissOnboarding, openOnboarding } = useFeatureOnboarding('life-events');

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
    queryFn: () => api.get('/life-events').then((r: { data: { triggers: LifeEventTrigger[] } }) => r.data),
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
    mutationFn: (data: Record<string, unknown>) => api.post('/life-events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-events'] });
      resetForm();
    },
  });

  const triggerMutation = useMutation({
    mutationFn: (triggerId: string) => api.post(`/life-events/${triggerId}/trigger`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-events'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (triggerId: string) => api.post(`/life-events/${triggerId}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-events'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (triggerId: string) => api.delete(`/life-events/${triggerId}`),
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
      <AppFrame>
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)' }}>
          Loading…
        </p>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <header style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <p className="loom-eyebrow" style={{ marginBottom: 14 }}>Life events</p>
          <h1
            className="loom-h2"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
          >
            Words timed to moments.
          </h1>
          <p
            className="loom-body"
            style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 560, lineHeight: 1.6 }}
          >
            Prepare messages for the moments in a life that matter most — graduation, marriage, a first child.
            They arrive when the moment does.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="loom-btn"
          style={{ flexShrink: 0, marginTop: 8 }}
        >
          create trigger
        </button>
      </header>

      {/* Triggers list */}
      {triggers?.triggers && triggers.triggers.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {triggers.triggers.map((trigger) => {
            const statusConfig = STATUS_CONFIG[trigger.status] || STATUS_CONFIG.PENDING;
            return (
              <li
                key={trigger.id}
                style={{ padding: '24px 0', borderBottom: '1px solid var(--loom-rule)' }}
              >
                <article style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
                      <h3
                        className="loom-serif"
                        style={{ fontSize: 20, fontWeight: 300, color: 'var(--loom-bone)', margin: 0 }}
                      >
                        {trigger.event_name}
                      </h3>
                      <span
                        className="loom-mono"
                        style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    {trigger.event_description && (
                      <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 8px', lineHeight: 1.6 }}>
                        {trigger.event_description}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                      <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                        {trigger.recipient_name || trigger.family_member_name || 'No recipient'}
                      </span>
                      {trigger.recipient_email && (
                        <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                          {trigger.recipient_email}
                        </span>
                      )}
                      {trigger.scheduled_date && (
                        <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                          {new Date(trigger.scheduled_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className="loom-mono" style={{ fontSize: 11, color: 'var(--loom-bone-faint)' }}>
                        {JSON.parse(trigger.content_items || '[]').length} items attached
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {trigger.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => triggerMutation.mutate(trigger.id)}
                          disabled={triggerMutation.isPending}
                          className="loom-btn"
                          style={{ padding: '8px 16px', fontSize: 11 }}
                        >
                          deliver now
                        </button>
                        <button
                          onClick={() => cancelMutation.mutate(trigger.id)}
                          className="loom-btn-ghost"
                          style={{ padding: '8px 16px', fontSize: 11 }}
                        >
                          cancel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(trigger.id)}
                      style={{ background: 'none', border: 0, padding: '8px 4px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.06em', color: 'var(--loom-bone-faint)', transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#c25a5a')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--loom-bone-faint)')}
                    >
                      remove
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div style={{ padding: '60px 36px', border: '1px solid var(--loom-rule)', textAlign: 'center' }}>
          <p className="loom-mono" style={{ fontSize: 22, color: 'var(--loom-warm)', marginBottom: 14 }}>∞</p>
          <h3
            className="loom-serif"
            style={{ fontSize: 24, fontWeight: 300, fontStyle: 'italic', margin: '0 0 10px' }}
          >
            No triggers yet.
          </h3>
          <p className="loom-body" style={{ fontSize: 15, color: 'var(--loom-bone-faint)', margin: '0 0 24px' }}>
            Create one for the moments still to come.
          </p>
          <button onClick={() => setShowCreate(true)} className="loom-btn">
            create your first trigger
          </button>
        </div>
      )}

      {/* Create wizard overlay */}
      {showCreate && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24, overflowY: 'auto',
          }}
          onClick={() => resetForm()}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 560,
              width: '100%',
              margin: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Wizard header */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                {wizardStep > 1 && (
                  <button
                    onClick={() => setWizardStep(wizardStep - 1)}
                    style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--loom-bone-faint)' }}
                    aria-label="Back"
                  >
                    ←
                  </button>
                )}
                <div>
                  <h3 className="loom-serif" style={{ fontSize: 20, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 2px' }}>
                    {wizardStep === 1 && 'Choose a moment.'}
                    {wizardStep === 2 && 'Who is this for?'}
                    {wizardStep === 3 && 'Review and create.'}
                  </h3>
                  <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.06em' }}>
                    step {wizardStep} of 3
                  </p>
                </div>
              </div>
              <button
                onClick={() => resetForm()}
                style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: 'var(--loom-bone-faint)' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Pick template */}
            {wizardStep === 1 && (
              <div style={{ display: 'grid', gap: 8 }}>
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--loom-rule)',
                      borderRadius: 0,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 16,
                      transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--loom-warm)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--loom-rule)')}
                  >
                    <div>
                      <p className="loom-serif" style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 300, color: 'var(--loom-bone)' }}>
                        {template.title}
                      </p>
                      <p className="loom-body" style={{ margin: 0, fontSize: 13, color: 'var(--loom-bone-faint)' }}>
                        {template.description}
                      </p>
                    </div>
                    <span className="loom-mono" style={{ fontSize: 12, color: 'var(--loom-bone-faint)' }}>→</span>
                  </button>
                ))}
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--loom-rule)' }}>
                  <button
                    onClick={() => { setWizardStep(2); setSelectedTemplate(null); }}
                    style={{ background: 'none', border: 0, padding: '8px 0', cursor: 'pointer', width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)', textAlign: 'center' }}
                  >
                    or create a custom event
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Pick recipient */}
            {wizardStep === 2 && (
              <div style={{ display: 'grid', gap: 12 }}>
                {family.length > 0 ? (
                  <>
                    <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: '0 0 8px' }}>
                      Select a family member:
                    </p>
                    {family.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleRecipientSelect(member)}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${familyMemberId === member.id ? 'var(--loom-warm)' : 'var(--loom-rule)'}`,
                          borderRadius: 0,
                          padding: '14px 18px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 16,
                        }}
                      >
                        <div>
                          <p className="loom-serif" style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 300, color: familyMemberId === member.id ? 'var(--loom-warm)' : 'var(--loom-bone)' }}>
                            {member.name}
                          </p>
                          <p className="loom-mono" style={{ margin: 0, fontSize: 10, color: 'var(--loom-bone-faint)' }}>{member.relationship}</p>
                        </div>
                        <span className="loom-mono" style={{ fontSize: 12, color: 'var(--loom-bone-faint)' }}>→</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p className="loom-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--loom-bone)', margin: '0 0 8px' }}>
                      No family members yet.
                    </p>
                    <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: '0 0 16px' }}>
                      Add family members first, or enter a recipient manually below.
                    </p>
                    <a href="/family" className="loom-btn" style={{ textDecoration: 'none' }}>
                      add family members
                    </a>
                  </div>
                )}
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--loom-rule)' }}>
                  <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', margin: '0 0 10px' }}>Or enter manually:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Recipient name"
                      style={fieldStyle}
                    />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Recipient email"
                      style={fieldStyle}
                    />
                  </div>
                  {recipientName && (
                    <button
                      onClick={() => setWizardStep(3)}
                      className="loom-btn"
                      style={{ width: '100%', marginTop: 12 }}
                    >
                      continue
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review & create */}
            {wizardStep === 3 && (
              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ borderLeft: '2px solid var(--loom-warm)', paddingLeft: 14 }}>
                  <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: 0 }}>
                    {selectedTemplate ? `"${selectedTemplate.title}"` : 'Custom event'} for{' '}
                    <span style={{ color: 'var(--loom-bone)' }}>{recipientName}</span>
                  </p>
                </div>

                <div>
                  <label style={labelStyle} htmlFor="le-name">Event title</label>
                  <input
                    id="le-name"
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Give this event a name…"
                    style={fieldStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle} htmlFor="le-desc">Personal message (optional)</label>
                  <textarea
                    id="le-desc"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Add words for this moment…"
                    rows={3}
                    style={fieldStyle}
                  />
                </div>

                {selectedContent.length > 0 && (
                  <div>
                    <label style={labelStyle}>
                      Included content ({selectedContent.length})
                    </label>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                      {selectedContent.map((item) => (
                        <li
                          key={`${item.type}-${item.id}`}
                          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '8px 10px', border: '1px solid var(--loom-rule)' }}
                        >
                          <span className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>{item.title}</span>
                          <button
                            onClick={() => removeContent(item.type, item.id)}
                            aria-label="Remove"
                            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--loom-bone-faint)' }}
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setShowContentPicker(true)}
                      style={{ background: 'none', border: 0, padding: '8px 0 0', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--loom-warm)' }}
                    >
                      + add more
                    </button>
                  </div>
                )}

                {selectedContent.length === 0 && (
                  <button
                    onClick={() => setShowContentPicker(true)}
                    style={{
                      background: 'transparent',
                      border: '1px dashed var(--loom-rule)',
                      borderRadius: 0,
                      padding: '14px',
                      cursor: 'pointer',
                      width: '100%',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--loom-bone-faint)',
                    }}
                  >
                    attach memories, letters, or voice recordings
                  </button>
                )}

                <button
                  onClick={handleQuickCreate}
                  disabled={!eventName.trim() || createMutation.isPending}
                  className="loom-btn"
                  style={{ width: '100%' }}
                >
                  {createMutation.isPending ? 'creating…' : 'create life event'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content picker overlay */}
      {showContentPicker && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(14,14,12,0.82)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300, padding: 24,
          }}
          onClick={() => setShowContentPicker(false)}
        >
          <div
            style={{
              background: 'var(--loom-ink-card)',
              border: '1px solid var(--loom-rule)',
              padding: 40,
              maxWidth: 440,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="loom-eyebrow" style={{ marginBottom: 20 }}>Add content</p>

            {memories.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p className="loom-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>
                  Memories ({memories.length})
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {memories.slice(0, 10).map((m: { id: string; title: string }) => (
                    <li key={m.id}>
                      <button
                        onClick={() => addContent('MEMORY', m.id, m.title)}
                        disabled={selectedContent.some(c => c.id === m.id)}
                        style={{ background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Source Serif 4', serif", fontSize: 14, color: 'var(--loom-bone-dim)', opacity: selectedContent.some(c => c.id === m.id) ? 0.4 : 1 }}
                      >
                        {m.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {letters.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p className="loom-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>
                  Letters ({letters.length})
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {letters.slice(0, 10).map((l: { id: string; title: string }) => (
                    <li key={l.id}>
                      <button
                        onClick={() => addContent('LETTER', l.id, l.title || 'Untitled letter')}
                        disabled={selectedContent.some(c => c.id === l.id)}
                        style={{ background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Source Serif 4', serif", fontSize: 14, color: 'var(--loom-bone-dim)', opacity: selectedContent.some(c => c.id === l.id) ? 0.4 : 1 }}
                      >
                        {l.title || 'Untitled letter'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {voiceRecordings.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p className="loom-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>
                  Voice ({voiceRecordings.length})
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {voiceRecordings.slice(0, 10).map((v: { id: string; title: string }) => (
                    <li key={v.id}>
                      <button
                        onClick={() => addContent('VOICE', v.id, v.title)}
                        disabled={selectedContent.some(c => c.id === v.id)}
                        style={{ background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: "'Source Serif 4', serif", fontSize: 14, color: 'var(--loom-bone-dim)', opacity: selectedContent.some(c => c.id === v.id) ? 0.4 : 1 }}
                      >
                        {v.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {memories.length === 0 && letters.length === 0 && voiceRecordings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-faint)', margin: '0 0 16px' }}>
                  No content yet. Add some first:
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { href: '/memories', label: 'Add memories' },
                    { href: '/compose', label: 'Write a letter' },
                    { href: '/record', label: 'Record a voice message' },
                  ].map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        padding: '12px 14px',
                        border: '1px solid var(--loom-rule)',
                        textDecoration: 'none',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--loom-bone-dim)',
                      }}
                    >
                      {label} →
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setShowContentPicker(false)} className="loom-btn" style={{ width: '100%', marginTop: 16 }}>
              done
            </button>
          </div>
        </div>
      )}

      <OnboardingHelpButton onClick={openOnboarding} />
      <FeatureOnboarding
        featureKey="life-events"
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />
    </AppFrame>
  );
}

export default LifeEvents;
