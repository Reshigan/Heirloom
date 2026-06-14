import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClothShell } from '../loom/components/ClothShell';
import { type FamilyMember } from '../types';
import { UserMenu } from '../loom/components/Frame';
import { Breadcrumbs } from '../loom/components/Breadcrumbs';
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
    description: 'For a special birthday (18, 21, 30…)',
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
  status: TriggerStatus | string;
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

type TriggerStatus = 'PENDING' | 'TRIGGERED' | 'DELIVERED' | 'CANCELLED';

interface StatusConfigEntry {
  label: string;
}

const STATUS_CONFIG: { [K in TriggerStatus]: StatusConfigEntry } = {
  PENDING: { label: 'pending' },
  TRIGGERED: { label: 'triggered' },
  DELIVERED: { label: 'delivered' },
  CANCELLED: { label: 'cancelled' },
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--rule)',
  borderRadius: 2,
  color: 'var(--bone)',
  caretColor: 'var(--warm)',
  fontFamily: 'var(--serif)',
  fontSize: 15,
  lineHeight: 1.7,
  padding: '12px 14px',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--mono)',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--bone-faint)',
  marginBottom: 10,
};

export function LifeEvents() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wizardStep, setWizardStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof QUICK_TEMPLATES[0] | null>(null);

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
    onError: (err: any) => setError(err?.response?.data?.error ?? 'something went wrong'),
  });

  const triggerMutation = useMutation({
    mutationFn: (triggerId: string) => api.post(`/life-events/${triggerId}/trigger`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-events'] }),
    onError: (err: any) => setError(err?.response?.data?.error ?? 'something went wrong'),
  });

  const cancelMutation = useMutation({
    mutationFn: (triggerId: string) => api.post(`/life-events/${triggerId}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-events'] }),
    onError: (err: any) => setError(err?.response?.data?.error ?? 'something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (triggerId: string) => api.delete(`/life-events/${triggerId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['life-events'] }),
    onError: (err: any) => setError(err?.response?.data?.error ?? 'something went wrong'),
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
      <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'life events' }]} />} topbarCenter="life events" topbarRight={<UserMenu />}>
        <div style={{ padding: 'clamp(16px, 4vw, 48px)' }}>
          <div
            style={{
              height: 1,
              background: 'var(--warm)',
              width: 0,
              animation: 'hl-load 1400ms cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          />
        </div>
      </ClothShell>
    );
  }

  return (
    <ClothShell topbarLeft={<Breadcrumbs trail={[{ label: 'heirloom', to: '/loom/index' }, { label: 'life events' }]} />} topbarCenter="life events" topbarRight={<UserMenu />}>
      <div style={{ padding: 'var(--page-pad-top) var(--page-pad-x) var(--page-clear)', maxWidth: 'var(--page-max-wide)', margin: '0 auto' }}>

        {/* Page header */}
        <header style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <h1
              className="hl-serif hl-tight"
              style={{ fontSize: 'var(--type-display)', fontWeight: 300, margin: '0 0 28px', color: 'var(--bone)' }}
            >
              The moments that shaped the cloth.
            </h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="hl-btn"
            style={{ flexShrink: 0 }}
          >
            add event
          </button>
        </header>

        {/* Timeline list */}
        {triggers?.triggers && triggers.triggers.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {triggers.triggers.map((trigger) => {
              const statusConfig = STATUS_CONFIG[trigger.status as TriggerStatus] || STATUS_CONFIG.PENDING;
              const dateStr = trigger.scheduled_date
                ? new Date(trigger.scheduled_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : trigger.created_at
                  ? new Date(trigger.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '—';
              return (
                <li
                  key={trigger.id}
                  style={{
                    padding: '22px 0',
                    borderBottom: '1px solid var(--rule)',
                    display: 'grid',
                    gridTemplateColumns: 'clamp(72px, 15vw, 120px) 1fr auto',
                    gap: 'clamp(12px, 2vw, 24px)',
                    alignItems: 'start',
                  }}
                >
                  {/* Date column */}
                  <span
                    className="hl-mono"
                    style={{ fontSize: 10, color: 'var(--warm)', letterSpacing: '0.06em', paddingTop: 3 }}
                  >
                    {dateStr}
                  </span>

                  {/* Event content column */}
                  <div>
                    <p
                      className="hl-serif"
                      style={{ fontSize: 16, fontWeight: 300, color: 'var(--bone)', margin: '0 0 4px' }}
                    >
                      {trigger.event_name}
                    </p>
                    {trigger.event_description && (
                      <p
                        className="hl-serif"
                        style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 6px', lineHeight: 1.6 }}
                      >
                        {trigger.event_description}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 4 }}>
                      {(trigger.recipient_name || trigger.family_member_name) && (
                        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}>
                          {trigger.recipient_name || trigger.family_member_name}
                        </span>
                      )}
                      {trigger.recipient_email && (
                        <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}>
                          {trigger.recipient_email}
                        </span>
                      )}
                      <span className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}>
                        {JSON.parse(trigger.content_items || '[]').length} items attached
                      </span>
                    </div>
                  </div>

                  {/* Category / status + actions column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                    <span
                      className="hl-mono"
                      style={{ fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}
                    >
                      {statusConfig.label}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {trigger.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => triggerMutation.mutate(trigger.id)}
                            disabled={triggerMutation.isPending}
                            className="hl-btn"
                            style={{ padding: '6px 14px', fontSize: 10 }}
                          >
                            deliver now
                          </button>
                          <button
                            onClick={() => cancelMutation.mutate(trigger.id)}
                            style={{
                              background: 'none',
                              border: '1px solid var(--rule)',
                              borderRadius: 0,
                              padding: '6px 14px',
                              cursor: 'pointer',
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              letterSpacing: '0.06em',
                              color: 'var(--bone-faint)',
                              transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--warm)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
                          >
                            cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(trigger.id)}
                        style={{
                          background: 'none',
                          border: 0,
                          padding: '6px 4px',
                          cursor: 'pointer',
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          letterSpacing: '0.06em',
                          color: 'var(--bone-faint)',
                          transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--bone-faint)')}
                      >
                        remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div style={{ padding: 'clamp(24px, 5vw, 60px) clamp(16px, 3vw, 36px)', border: '1px solid var(--rule)', textAlign: 'center' }}>
            <p
              className="hl-serif hl-italic"
              style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone-faint)', margin: 0 }}
            >
              No life events yet.
            </p>
          </div>
        )}
      </div>

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
            className="cosmic-panel cosmic-panel--solid"
            style={{
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
                    style={{
                      background: 'none', border: 0, padding: 0, cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--bone-faint)',
                    }}
                    aria-label="Back"
                  >
                    ←
                  </button>
                )}
                <div>
                  <h3 className="hl-serif" style={{ fontSize: 20, fontWeight: 300, color: 'var(--bone)', margin: '0 0 2px' }}>
                    {wizardStep === 1 && 'Choose a moment.'}
                    {wizardStep === 2 && 'Who is this for?'}
                    {wizardStep === 3 && 'Review and create.'}
                  </h3>
                  <p className="hl-mono" style={{ margin: 0, fontSize: 10, color: 'var(--bone-faint)', letterSpacing: '0.06em' }}>
                    step {wizardStep} of 3
                  </p>
                </div>
              </div>
              <button
                onClick={() => resetForm()}
                style={{
                  background: 'none', border: 0, padding: 0, cursor: 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'var(--bone-faint)',
                }}
                aria-label="Close"
              >
                close
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
                      border: '1px solid var(--rule)',
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
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--warm)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
                  >
                    <div>
                      <p className="hl-serif" style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 300, color: 'var(--bone)' }}>
                        {template.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--bone-faint)', fontFamily: 'var(--serif)' }}>
                        {template.description}
                      </p>
                    </div>
                    <span className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-faint)' }}>→</span>
                  </button>
                ))}
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
                  <button
                    onClick={() => { setWizardStep(2); setSelectedTemplate(null); }}
                    style={{
                      background: 'none', border: 0, padding: '8px 0', cursor: 'pointer', width: '100%',
                      fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: 'var(--bone-faint)', textAlign: 'center',
                    }}
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
                    <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: '0 0 8px' }}>
                      Select a family member:
                    </p>
                    {family.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleRecipientSelect(member)}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${familyMemberId === member.id ? 'var(--warm)' : 'var(--rule)'}`,
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
                          <p className="hl-serif" style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 300, color: familyMemberId === member.id ? 'var(--warm)' : 'var(--bone)' }}>
                            {member.name}
                          </p>
                          <p className="hl-mono" style={{ margin: 0, fontSize: 10, color: 'var(--bone-faint)' }}>{member.relationship}</p>
                        </div>
                        <span className="hl-mono" style={{ fontSize: 12, color: 'var(--bone-faint)' }}>→</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p className="hl-serif" style={{ fontSize: 18, fontWeight: 300, color: 'var(--bone)', margin: '0 0 8px' }}>
                      No family members yet.
                    </p>
                    <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-faint)', margin: '0 0 16px' }}>
                      Add family members first, or enter a recipient manually below.
                    </p>
                    <Link to="/family" className="hl-btn" style={{ textDecoration: 'none' }}>
                      add family members
                    </Link>
                  </div>
                )}
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
                  <p className="hl-mono" style={{ fontSize: 10, color: 'var(--bone-faint)', margin: '0 0 10px', letterSpacing: '0.08em' }}>Or enter manually:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 10 }}>
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
                      className="hl-btn"
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
                <div style={{ borderLeft: '2px solid var(--warm)', paddingLeft: 14 }}>
                  <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)', margin: 0 }}>
                    {selectedTemplate ? `"${selectedTemplate.title}"` : 'Custom event'} for{' '}
                    <span style={{ color: 'var(--bone)' }}>{recipientName}</span>
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
                          style={{
                            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                            padding: '8px 10px', border: '1px solid var(--rule)',
                          }}
                        >
                          <span className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-dim)' }}>{item.title}</span>
                          <button
                            onClick={() => removeContent(item.type, item.id)}
                            aria-label="Remove"
                            style={{
                              background: 'none', border: 0, padding: 0, cursor: 'pointer',
                              fontFamily: 'var(--mono)', fontSize: 10,
                              letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-faint)',
                            }}
                          >
                            close
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setShowContentPicker(true)}
                      style={{
                        background: 'none', border: 0, padding: '8px 0 0', cursor: 'pointer',
                        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'var(--warm)',
                      }}
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
                      border: '1px dashed var(--rule)',
                      borderRadius: 0,
                      padding: '14px',
                      cursor: 'pointer',
                      width: '100%',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--bone-faint)',
                    }}
                  >
                    attach memories, letters, or voice recordings
                  </button>
                )}

                {error && (
                  <p
                    role="alert"
                    style={{
                      margin: 0,
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--danger)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  onClick={handleQuickCreate}
                  disabled={!eventName.trim() || createMutation.isPending}
                  className="hl-btn"
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
            className="cosmic-panel cosmic-panel--solid"
            style={{
              padding: 40,
              maxWidth: 440,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="hl-eyebrow" style={{ marginBottom: 20 }}>Add content</p>

            {memories.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p className="hl-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>
                  Memories ({memories.length})
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {memories.slice(0, 10).map((m: { id: string; title: string }) => (
                    <li key={m.id}>
                      <button
                        onClick={() => addContent('MEMORY', m.id, m.title)}
                        disabled={selectedContent.some(c => c.id === m.id)}
                        style={{
                          background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', width: '100%',
                          textAlign: 'left', fontFamily: 'var(--serif)', fontSize: 14,
                          color: 'var(--bone-dim)', opacity: selectedContent.some(c => c.id === m.id) ? 0.4 : 1,
                        }}
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
                <p className="hl-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>
                  Letters ({letters.length})
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {letters.slice(0, 10).map((l: { id: string; title: string }) => (
                    <li key={l.id}>
                      <button
                        onClick={() => addContent('LETTER', l.id, l.title || 'Untitled letter')}
                        disabled={selectedContent.some(c => c.id === l.id)}
                        style={{
                          background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', width: '100%',
                          textAlign: 'left', fontFamily: 'var(--serif)', fontSize: 14,
                          color: 'var(--bone-dim)', opacity: selectedContent.some(c => c.id === l.id) ? 0.4 : 1,
                        }}
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
                <p className="hl-eyebrow" style={{ marginBottom: 10, fontSize: 9 }}>
                  Voice ({voiceRecordings.length})
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                  {voiceRecordings.slice(0, 10).map((v: { id: string; title: string }) => (
                    <li key={v.id}>
                      <button
                        onClick={() => addContent('VOICE', v.id, v.title)}
                        disabled={selectedContent.some(c => c.id === v.id)}
                        style={{
                          background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', width: '100%',
                          textAlign: 'left', fontFamily: 'var(--serif)', fontSize: 14,
                          color: 'var(--bone-dim)', opacity: selectedContent.some(c => c.id === v.id) ? 0.4 : 1,
                        }}
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
                <p className="hl-serif" style={{ fontSize: 14, color: 'var(--bone-faint)', margin: '0 0 16px' }}>
                  No content yet. Add some first:
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { href: '/memories', label: 'Add memories' },
                    { href: '/compose', label: 'Write a letter' },
                    { href: '/record', label: 'Record a voice message' },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      to={href}
                      style={{
                        display: 'block',
                        padding: '12px 14px',
                        border: '1px solid var(--rule)',
                        textDecoration: 'none',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--bone-dim)',
                      }}
                    >
                      {label} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setShowContentPicker(false)} className="hl-btn" style={{ width: '100%', marginTop: 16 }}>
              done
            </button>
          </div>
        </div>
      )}
    </ClothShell>
  );
}

export default LifeEvents;
