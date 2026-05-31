import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppFrame } from '../loom/components/AppFrame';
import api, { familyApi, memoriesApi } from '../services/api';

interface ReleaseSchedule {
  id: string;
  stage: string;
  stage_name: string;
  delay_days: number;
  stage_description: string;
  enabled: number;
}

interface FamilyMemoryRoom {
  id: string;
  name: string;
  description: string;
  access_token: string;
  is_active: number;
  allow_photos: number;
  allow_voice: number;
  allow_text: number;
  moderation_required: number;
}

interface Contribution {
  id: string;
  contributor_name: string;
  contributor_email: string;
  contributor_relationship: string;
  content_type: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
}

/* ── Small shared primitives ──────────────────────────────────── */

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: `1px solid ${active ? 'var(--loom-rule-warm)' : 'var(--loom-rule)'}`,
        padding: '10px 16px',
        cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: active ? 'var(--loom-warm)' : 'var(--loom-bone-faint)',
        transition: 'border-color 180ms var(--loom-ease), color 180ms var(--loom-ease)',
        textAlign: 'center' as const,
      }}
    >
      {children}
    </button>
  );
}

/* Modal backdrop + card */
function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(14,14,12,0.80)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--loom-ink-card)',
          border: '1px solid var(--loom-rule)',
          padding: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 24,
      }}
    >
      <h3
        className="loom-serif"
        style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', margin: 0 }}
      >
        {title}
      </h3>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
          color: 'var(--loom-bone-faint)',
          fontSize: 18,
          lineHeight: 1,
          padding: '4px 6px',
        }}
      >
        ×
      </button>
    </div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="loom-eyebrow" style={{ display: 'block', marginBottom: 6, fontSize: 10 }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export function RecipientExperience() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'schedules' | 'room' | 'family' | 'preview'>('preview');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [familyForm, setFamilyForm] = useState({ name: '', relationship: '', email: '', phone: '', notes: '' });
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [_selectedPreviewMember, _setSelectedPreviewMember] = useState<FamilyMember | null>(null);
  void _selectedPreviewMember; void _setSelectedPreviewMember; // Reserved for future per-recipient preview

  const { data: schedulesData, isLoading: schedulesLoading } = useQuery<{ schedules: ReleaseSchedule[] }>({
    queryKey: ['release-schedules'],
    queryFn: () => api.get('/api/recipient-experience/schedules').then((r: { data: { schedules: ReleaseSchedule[] } }) => r.data),
  });

  const { data: roomData, isLoading: roomLoading } = useQuery<{ room: FamilyMemoryRoom; contributionCount: number }>({
    queryKey: ['memory-room'],
    queryFn: () => api.get('/api/recipient-experience/memory-room').then((r: { data: { room: FamilyMemoryRoom; contributionCount: number } }) => r.data),
  });

  const { data: contributionsData } = useQuery<{ contributions: Contribution[] }>({
    queryKey: ['room-contributions'],
    queryFn: () => api.get('/api/recipient-experience/memory-room/contributions').then((r: { data: { contributions: Contribution[] } }) => r.data),
    enabled: activeTab === 'room',
  });

  const { data: familyData } = useQuery<{ members: FamilyMember[] }>({
    queryKey: ['family-members'],
    queryFn: () => familyApi.getAll().then((r: { data: { members: FamilyMember[] } }) => r.data),
  });

  const { data: memoriesStats } = useQuery({
    queryKey: ['memories-stats'],
    queryFn: () => memoriesApi.getStats().then((r: { data: { total: number; byType: { letters: number; voice: number; photos: number } } }) => r.data),
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: () => api.post('/api/recipient-experience/test-email'),
    onSuccess: () => {
      setTestEmailSent(true);
      setTimeout(() => {
        setShowTestEmailModal(false);
        setTestEmailSent(false);
      }, 3000);
    },
  });

  const addFamilyMutation = useMutation({
    mutationFn: (data: { name: string; relationship: string; email?: string; phone?: string; notes?: string }) =>
      familyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      resetFamilyForm();
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      const message = error.response?.data?.error || error.message || 'Failed to add recipient';
      alert(message);
    },
  });

  const updateFamilyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      familyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      resetFamilyForm();
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      const message = error.response?.data?.error || error.message || 'Failed to update recipient';
      alert(message);
    },
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: (id: string) => familyApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family-members'] }),
  });

  const resetFamilyForm = () => {
    setShowAddFamilyModal(false);
    setEditingMember(null);
    setFamilyForm({ name: '', relationship: '', email: '', phone: '', notes: '' });
  };

  const handleSaveFamilyMember = () => {
    if (!familyForm.name.trim() || !familyForm.relationship) {
      alert('Please fill in both Name and Relationship fields');
      return;
    }
    if (editingMember) {
      updateFamilyMutation.mutate({ id: editingMember.id, data: familyForm });
    } else {
      addFamilyMutation.mutate(familyForm);
    }
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setFamilyForm({
      name: member.name,
      relationship: member.relationship,
      email: member.email || '',
      phone: member.phone || '',
      notes: member.notes || '',
    });
    setShowAddFamilyModal(true);
  };

  const updateScheduleMutation = useMutation({
    mutationFn: ({ scheduleId, data }: { scheduleId: string; data: Record<string, unknown> }) =>
      api.patch(`/api/recipient-experience/schedules/${scheduleId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['release-schedules'] }),
  });

  const updateRoomMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch('/api/recipient-experience/memory-room', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memory-room'] }),
  });

  const moderateContributionMutation = useMutation({
    mutationFn: ({ contributionId, status }: { contributionId: string; status: string }) =>
      api.patch(`/api/recipient-experience/memory-room/contributions/${contributionId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room-contributions'] }),
  });

  const sendInviteMutation = useMutation({
    mutationFn: (data: { email: string; name: string }) =>
      api.post('/api/recipient-experience/memory-room/invite', data),
    onSuccess: () => {
      setInviteSent(true);
      setInviteEmail('');
      setInviteName('');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSent(false);
      }, 2000);
    },
  });

  const copyRoomUrl = () => {
    if (roomData?.room?.access_token) {
      const url = `${window.location.origin}/memory-room/${roomData.room.access_token}`;
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const previewRoom = () => {
    if (roomData?.room?.access_token) {
      window.open(`/memory-room/${roomData.room.access_token}`, '_blank');
    }
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;
    sendInviteMutation.mutate({
      email: inviteEmail.trim(),
      name: inviteName.trim() || 'Friend',
    });
  };

  const isLoading = schedulesLoading || roomLoading;

  if (isLoading) {
    return (
      <AppFrame>
        <p className="loom-body" style={{ fontStyle: 'italic', color: 'var(--loom-bone-faint)', marginTop: 80 }}>
          Loading…
        </p>
      </AppFrame>
    );
  }

  const schedules = schedulesData?.schedules || [];
  const room = roomData?.room;
  const contributions = contributionsData?.contributions || [];
  const pendingContributions = contributions.filter((c) => c.status === 'PENDING');

  /* ── Tab bar ─────────────────────────────────────────────── */
  const tabStyle = (tab: typeof activeTab): React.CSSProperties => ({
    background: 'transparent',
    border: 0,
    padding: '8px 0',
    marginRight: 28,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: activeTab === tab ? 'var(--loom-bone)' : 'var(--loom-bone-faint)',
    borderBottom: activeTab === tab ? '1px solid var(--loom-warm)' : '1px solid transparent',
    transition: 'color 180ms var(--loom-ease), border-color 180ms var(--loom-ease)',
    position: 'relative' as const,
  });

  /* ── Stat cell ───────────────────────────────────────────── */
  const StatCell = ({ n, label }: { n: number; label: string }) => (
    <div
      style={{
        padding: '20px 0',
        textAlign: 'center',
        borderBottom: '1px solid var(--loom-rule)',
        borderRight: '1px solid var(--loom-rule)',
      }}
    >
      <p
        className="loom-serif"
        style={{ fontSize: 28, fontWeight: 300, color: 'var(--loom-warm)', margin: '0 0 4px' }}
      >
        {n}
      </p>
      <p className="loom-eyebrow" style={{ fontSize: 9 }}>
        {label}
      </p>
    </div>
  );

  return (
    <AppFrame>
      {/* Page header */}
      <header style={{ marginBottom: 48 }}>
        <p className="loom-eyebrow" style={{ marginBottom: 14 }}>
          successor experience
        </p>
        <h1
          className="loom-h2"
          style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 300, fontStyle: 'italic', margin: 0 }}
        >
          How your thread reaches them.
        </h1>
        <p
          className="loom-body"
          style={{ fontSize: 17, color: 'var(--loom-bone-dim)', margin: '14px 0 0', maxWidth: 640, lineHeight: 1.6 }}
        >
          Configure how your descendants receive and move through the cloth you've woven.
        </p>
      </header>

      {/* Quick setup */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 1,
          border: '1px solid var(--loom-rule)',
          marginBottom: 48,
        }}
      >
        <button
          type="button"
          onClick={() => { setActiveTab('family'); setShowAddFamilyModal(true); }}
          style={{
            background: 'transparent',
            border: 0,
            padding: '22px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            borderRight: '1px solid var(--loom-rule)',
            transition: 'background 180ms var(--loom-ease)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,122,74,0.04)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <p className="loom-eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>step one</p>
          <p className="loom-serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 4px' }}>
            Name your descendants
          </p>
          <p className="loom-body" style={{ fontSize: 12, color: 'var(--loom-bone-faint)', margin: 0 }}>
            Who will receive the thread?
          </p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          style={{
            background: 'transparent',
            border: 0,
            padding: '22px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            borderRight: '1px solid var(--loom-rule)',
            transition: 'background 180ms var(--loom-ease)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,122,74,0.04)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <p className="loom-eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>step two</p>
          <p className="loom-serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 4px' }}>
            Set the release rhythm
          </p>
          <p className="loom-body" style={{ fontSize: 12, color: 'var(--loom-bone-faint)', margin: 0 }}>
            When does the cloth unfold?
          </p>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('room'); if (room && room.is_active !== 1) { updateRoomMutation.mutate({ is_active: true }); } }}
          style={{
            background: 'transparent',
            border: 0,
            padding: '22px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 180ms var(--loom-ease)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,122,74,0.04)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <p className="loom-eyebrow" style={{ marginBottom: 6, fontSize: 9 }}>step three</p>
          <p className="loom-serif" style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 4px' }}>
            Open a memory room
          </p>
          <p className="loom-body" style={{ fontSize: 12, color: 'var(--loom-bone-faint)', margin: 0 }}>
            Let the bloodline add their weft.
          </p>
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          borderBottom: '1px solid var(--loom-rule)',
          marginBottom: 40,
        }}
      >
        <button type="button" onClick={() => setActiveTab('preview')} style={tabStyle('preview')}>
          preview
        </button>
        <button type="button" onClick={() => setActiveTab('schedules')} style={tabStyle('schedules')}>
          releases
        </button>
        <button type="button" onClick={() => setActiveTab('room')} style={tabStyle('room')}>
          memory room
          {pendingContributions.length > 0 ? (
            <span
              className="loom-mono"
              style={{
                marginLeft: 6,
                fontSize: 8,
                letterSpacing: '0.1em',
                color: 'var(--loom-warm)',
              }}
            >
              {pendingContributions.length}
            </span>
          ) : null}
        </button>
        <button type="button" onClick={() => setActiveTab('family')} style={tabStyle('family')}>
          descendants
        </button>
      </div>

      {/* ── Preview ──────────────────────────────────────────── */}
      {activeTab === 'preview' && (
        <div style={{ display: 'grid', gap: 36 }}>
          {/* What they'll receive */}
          <section>
            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>what they'll receive</p>

            {/* Simulated email card */}
            <div
              style={{
                border: '1px solid var(--loom-rule)',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid var(--loom-rule)',
                  padding: '12px 20px',
                }}
              >
                <span
                  className="loom-mono"
                  style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
                >
                  preview · the email your successors will receive
                </span>
              </div>
              <div style={{ padding: '28px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
                  <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, color: 'var(--loom-warm)' }}>
                    ∞
                  </span>
                  <div>
                    <p className="loom-serif" style={{ fontSize: 15, fontStyle: 'italic', margin: 0 }}>
                      A message from someone who loves you
                    </p>
                    <p
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: '2px 0 0' }}
                    >
                      from Heirloom
                    </p>
                  </div>
                </div>
                <div
                  className="loom-body"
                  style={{ color: 'var(--loom-bone-dim)', lineHeight: 1.8, fontSize: 14, marginBottom: 24 }}
                >
                  <p style={{ margin: '0 0 12px' }}>Dear loved one,</p>
                  <p style={{ margin: '0 0 12px' }}>
                    Someone who cares deeply about you has left you messages, memories, and stories
                    they wanted you to have.
                  </p>
                  <p style={{ margin: 0 }}>When you're ready, follow the link to access your personal thread.</p>
                </div>
                <button type="button" className="loom-btn">
                  access your thread
                </button>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--loom-rule)' }}>
              <StatCell n={memoriesStats?.total ?? 0} label="total entries" />
              <StatCell n={memoriesStats?.byType?.letters ?? 0} label="letters" />
              <StatCell n={memoriesStats?.byType?.voice ?? 0} label="voice" />
              <StatCell n={familyData?.members?.length ?? 0} label="descendants" />
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setShowTestEmailModal(true)}
                className="loom-btn-ghost"
              >
                send test to myself
              </button>
              <button
                type="button"
                onClick={() => window.open('/inherit/preview', '_blank')}
                className="loom-btn-ghost"
              >
                preview full portal
              </button>
            </div>
          </section>

          {/* Delivery timeline */}
          <section>
            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>delivery timeline</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {schedules.filter((s) => s.enabled === 1).map((schedule, index) => (
                <li
                  key={schedule.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr',
                    gap: 16,
                    alignItems: 'baseline',
                    padding: '14px 0',
                    borderBottom: '1px solid var(--loom-rule)',
                  }}
                >
                  <span
                    className="loom-mono"
                    style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="loom-serif" style={{ fontSize: 15, fontStyle: 'italic', margin: '0 0 2px' }}>
                      {schedule.stage_name}
                    </p>
                    <p
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: 0 }}
                    >
                      {schedule.delay_days === 0 ? 'immediately' : `after ${schedule.delay_days} days`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Privacy */}
          <section>
            <p className="loom-eyebrow" style={{ marginBottom: 16 }}>privacy &amp; control</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, border: '1px solid var(--loom-rule)' }}>
              {[
                { title: 'end-to-end encrypted', body: 'Your memories are protected with bank-level encryption.' },
                { title: 'you control access', body: 'Only invited successors can view your content.' },
                { title: 'export anytime', body: 'Download all your content whenever you want.' },
                { title: 'delete permanently', body: 'Remove any entry at any time, no questions asked.' },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: '20px',
                    borderRight: '1px solid var(--loom-rule)',
                    borderBottom: '1px solid var(--loom-rule)',
                  }}
                >
                  <p className="loom-serif" style={{ fontSize: 14, fontStyle: 'italic', margin: '0 0 4px' }}>
                    {item.title}
                  </p>
                  <p className="loom-body" style={{ fontSize: 12, color: 'var(--loom-bone-faint)', margin: 0, lineHeight: 1.6 }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Explainer */}
          <p
            className="loom-body"
            style={{ fontSize: 14, color: 'var(--loom-bone-dim)', lineHeight: 1.8, borderTop: '1px solid var(--loom-rule)', paddingTop: 20 }}
          >
            When your legacy is activated, each named descendant receives a secure link. Content
            unfolds in stages so they can move through it gradually. You can adjust these settings at
            any time.
          </p>
        </div>
      )}

      {/* ── Staged releases ───────────────────────────────────── */}
      {activeTab === 'schedules' && (
        <div>
          <header style={{ marginBottom: 28 }}>
            <h2 className="loom-serif" style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px' }}>
              Staged content release.
            </h2>
            <p
              className="loom-body"
              style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: 0, lineHeight: 1.7, maxWidth: 560 }}
            >
              Instead of surfacing everything at once, the thread unfolds in thoughtful stages — each
              one a new row in the cloth.
            </p>
          </header>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
            {schedules.map((schedule, index) => (
              <li
                key={schedule.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr auto',
                  gap: 20,
                  alignItems: 'center',
                  padding: '18px 0',
                  borderBottom: '1px solid var(--loom-rule)',
                  opacity: schedule.enabled === 1 ? 1 : 0.45,
                  transition: 'opacity 180ms var(--loom-ease)',
                }}
              >
                <span
                  className="loom-mono"
                  style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="loom-serif" style={{ fontSize: 16, fontStyle: 'italic', margin: '0 0 2px' }}>
                    {schedule.stage_name}
                  </p>
                  <p
                    className="loom-mono"
                    style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: '0 0 4px' }}
                  >
                    {schedule.delay_days === 0 ? 'immediately' : `after ${schedule.delay_days} days`}
                  </p>
                  <p
                    className="loom-body"
                    style={{ fontSize: 13, color: 'var(--loom-bone-dim)', margin: 0, lineHeight: 1.6 }}
                  >
                    {schedule.stage_description}
                  </p>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    updateScheduleMutation.mutate({ scheduleId: schedule.id, data: { enabled: schedule.enabled !== 1 } })
                  }
                  aria-label={schedule.enabled === 1 ? 'Disable stage' : 'Enable stage'}
                  style={{
                    width: 36,
                    height: 20,
                    background: schedule.enabled === 1 ? 'var(--loom-warm)' : 'var(--loom-rule)',
                    border: 0,
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'background 180ms var(--loom-ease)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: schedule.enabled === 1 ? 19 : 3,
                      width: 14,
                      height: 14,
                      background: 'var(--loom-ink)',
                      transition: 'left 180ms var(--loom-ease)',
                    }}
                  />
                </button>
              </li>
            ))}
          </ul>

          <p
            className="loom-body"
            style={{ fontSize: 13, color: 'var(--loom-bone-faint)', lineHeight: 1.7 }}
          >
            Staged releases help successors move through the cloth gradually, finding comfort where
            they need it and deeper reflection over time.
          </p>
        </div>
      )}

      {/* ── Memory room ──────────────────────────────────────── */}
      {activeTab === 'room' && room && (
        <div style={{ display: 'grid', gap: 36 }}>
          {/* Room status */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <h2 className="loom-serif" style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', margin: '0 0 6px' }}>
                  Family memory room.
                </h2>
                <p
                  className="loom-body"
                  style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: 0, lineHeight: 1.7 }}
                >
                  A shared space where your bloodline can add their own threads.
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateRoomMutation.mutate({ is_active: room.is_active !== 1 })}
                className={room.is_active === 1 ? 'loom-btn' : 'loom-btn-ghost'}
                style={{ flexShrink: 0, marginLeft: 24 }}
              >
                {room.is_active === 1 ? 'active' : 'inactive'}
              </button>
            </div>

            {room.is_active === 1 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1, border: '1px solid var(--loom-rule)', marginBottom: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    borderRight: '1px solid var(--loom-rule)',
                    padding: '18px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 180ms var(--loom-ease)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,122,74,0.04)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <p className="loom-serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--loom-warm)', margin: '0 0 2px' }}>
                    invite kin
                  </p>
                  <p className="loom-body" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    send email invitation
                  </p>
                </button>
                <button
                  type="button"
                  onClick={previewRoom}
                  style={{
                    background: 'transparent',
                    border: 0,
                    borderRight: '1px solid var(--loom-rule)',
                    padding: '18px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 180ms var(--loom-ease)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,122,74,0.04)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <p className="loom-serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 2px' }}>
                    preview room
                  </p>
                  <p className="loom-body" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    see what family sees
                  </p>
                </button>
                <button
                  type="button"
                  onClick={copyRoomUrl}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: '18px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 180ms var(--loom-ease)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,122,74,0.04)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <p className="loom-serif" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--loom-bone)', margin: '0 0 2px' }}>
                    {copiedUrl ? 'copied' : 'copy link'}
                  </p>
                  <p className="loom-body" style={{ fontSize: 11, color: 'var(--loom-bone-faint)', margin: 0 }}>
                    share manually
                  </p>
                </button>
              </div>
            ) : null}

            {/* Content toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <ToggleBtn active={room.allow_photos === 1} onClick={() => updateRoomMutation.mutate({ allow_photos: room.allow_photos !== 1 })}>
                photos{'\n'}{room.allow_photos === 1 ? 'on' : 'off'}
              </ToggleBtn>
              <ToggleBtn active={room.allow_voice === 1} onClick={() => updateRoomMutation.mutate({ allow_voice: room.allow_voice !== 1 })}>
                voice{'\n'}{room.allow_voice === 1 ? 'on' : 'off'}
              </ToggleBtn>
              <ToggleBtn active={room.allow_text === 1} onClick={() => updateRoomMutation.mutate({ allow_text: room.allow_text !== 1 })}>
                text{'\n'}{room.allow_text === 1 ? 'on' : 'off'}
              </ToggleBtn>
              <ToggleBtn active={room.moderation_required === 1} onClick={() => updateRoomMutation.mutate({ moderation_required: room.moderation_required !== 1 })}>
                moderation{'\n'}{room.moderation_required === 1 ? 'required' : 'auto'}
              </ToggleBtn>
            </div>
          </section>

          {/* Contributions */}
          {contributions.length > 0 ? (
            <section>
              <p className="loom-eyebrow" style={{ marginBottom: 16 }}>
                contributions · {contributions.length}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {contributions.map((contribution) => (
                  <li
                    key={contribution.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 20,
                      alignItems: 'center',
                      padding: '18px 0',
                      borderBottom: '1px solid var(--loom-rule)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                        <span
                          className="loom-serif"
                          style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--loom-bone)' }}
                        >
                          {contribution.contributor_name}
                        </span>
                        {contribution.contributor_relationship ? (
                          <span
                            className="loom-mono"
                            style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em' }}
                          >
                            {contribution.contributor_relationship}
                          </span>
                        ) : null}
                      </div>
                      {contribution.title ? (
                        <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone)', margin: '0 0 4px' }}>
                          {contribution.title}
                        </p>
                      ) : null}
                      <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-dim)', margin: '0 0 6px', lineHeight: 1.6 }}>
                        {contribution.content}
                      </p>
                      <p
                        className="loom-mono"
                        style={{ fontSize: 9, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: 0 }}
                      >
                        {new Date(contribution.created_at).toLocaleDateString()} · {contribution.content_type}
                      </p>
                    </div>
                    {contribution.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => moderateContributionMutation.mutate({ contributionId: contribution.id, status: 'APPROVED' })}
                          className="loom-btn-ghost"
                          style={{ padding: '8px 14px', fontSize: 10 }}
                        >
                          approve
                        </button>
                        <button
                          type="button"
                          onClick={() => moderateContributionMutation.mutate({ contributionId: contribution.id, status: 'REJECTED' })}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--loom-rule)',
                            padding: '8px 14px',
                            cursor: 'pointer',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 10,
                            letterSpacing: '0.16em',
                            textTransform: 'uppercase',
                            color: '#c25a5a',
                          }}
                        >
                          reject
                        </button>
                      </div>
                    ) : (
                      <span
                        className="loom-mono"
                        style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--loom-bone-faint)' }}
                      >
                        {contribution.status.toLowerCase()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : room.is_active === 1 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', borderTop: '1px solid var(--loom-rule)' }}>
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, color: 'var(--loom-bone-faint)', display: 'block', marginBottom: 14 }}>
                ∞
              </span>
              <h3 className="loom-serif" style={{ fontSize: 18, fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px' }}>
                No contributions yet.
              </h3>
              <p className="loom-body" style={{ fontSize: 13, color: 'var(--loom-bone-faint)', margin: 0 }}>
                Share the room link with your bloodline to begin collecting memories.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Descendants ──────────────────────────────────────── */}
      {activeTab === 'family' && (
        <div style={{ display: 'grid', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <h2 className="loom-serif" style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', margin: '0 0 6px' }}>
                Named descendants.
              </h2>
              <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', margin: 0, lineHeight: 1.7 }}>
                The people who will receive the thread when the time comes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddFamilyModal(true)}
              className="loom-btn"
              style={{ flexShrink: 0, marginLeft: 24 }}
            >
              add descendant
            </button>
          </div>

          {familyData?.members && familyData.members.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {familyData.members.map((member) => (
                <li
                  key={member.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 24,
                    alignItems: 'center',
                    padding: '16px 0',
                    borderBottom: '1px solid var(--loom-rule)',
                  }}
                >
                  <div>
                    <p className="loom-serif" style={{ fontSize: 17, fontStyle: 'italic', margin: '0 0 2px' }}>
                      {member.name}
                    </p>
                    <p
                      className="loom-mono"
                      style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: '0 0 2px' }}
                    >
                      {member.relationship}
                    </p>
                    {member.email ? (
                      <p
                        className="loom-mono"
                        style={{ fontSize: 10, color: 'var(--loom-bone-faint)', letterSpacing: '0.04em', margin: 0 }}
                      >
                        {member.email}
                      </p>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button
                      type="button"
                      onClick={() => handleEditMember(member)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'var(--loom-bone-dim)',
                        transition: 'color 180ms var(--loom-ease)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--loom-bone)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--loom-bone-dim)'; }}
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFamilyMutation.mutate(member.id)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'var(--loom-bone-faint)',
                        transition: 'color 180ms var(--loom-ease)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#c25a5a'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--loom-bone-faint)'; }}
                    >
                      remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: '48px 0', textAlign: 'center', border: '1px solid var(--loom-rule)' }}>
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, color: 'var(--loom-bone-faint)', display: 'block', marginBottom: 14 }}>
                ∞
              </span>
              <h3 className="loom-serif" style={{ fontSize: 18, fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px' }}>
                No descendants named yet.
              </h3>
              <p
                className="loom-body"
                style={{ fontSize: 13, color: 'var(--loom-bone-faint)', margin: '0 0 24px' }}
              >
                Add the people who will receive your legacy.
              </p>
              <button type="button" onClick={() => setShowAddFamilyModal(true)} className="loom-btn">
                add first descendant
              </button>
            </div>
          )}

          <p
            className="loom-body"
            style={{ fontSize: 13, color: 'var(--loom-bone-faint)', borderTop: '1px solid var(--loom-rule)', paddingTop: 16, lineHeight: 1.7 }}
          >
            Successors only receive the thread after your legacy is activated. You control exactly
            what each person receives.
          </p>
        </div>
      )}

      {/* ── Add/Edit member modal ──────────────────────────── */}
      {showAddFamilyModal && (
        <Modal onClose={resetFamilyForm}>
          <ModalHeader
            title={editingMember ? 'edit descendant' : 'add descendant'}
            onClose={resetFamilyForm}
          />
          <div style={{ display: 'grid', gap: 18 }}>
            <FieldBlock label="name *">
              <input
                type="text"
                value={familyForm.name}
                onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                placeholder="Sarah, Dad, Uncle John"
              />
            </FieldBlock>
            <FieldBlock label="relationship *">
              <select
                value={familyForm.relationship}
                onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })}
              >
                <option value="">select relationship…</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Grandchild">Grandchild</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </FieldBlock>
            <FieldBlock label="email">
              <input
                type="email"
                value={familyForm.email}
                onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </FieldBlock>
            <FieldBlock label="phone">
              <input
                type="tel"
                value={familyForm.phone}
                onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </FieldBlock>
            <FieldBlock label="notes">
              <textarea
                value={familyForm.notes}
                onChange={(e) => setFamilyForm({ ...familyForm, notes: e.target.value })}
                placeholder="Any special notes…"
                rows={2}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid var(--loom-rule)',
                  padding: '10px 12px',
                  color: 'var(--loom-bone)',
                  fontFamily: "'Source Serif 4', serif",
                  fontSize: 14,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 0,
                  boxSizing: 'border-box',
                }}
              />
            </FieldBlock>
            <button
              type="button"
              onClick={handleSaveFamilyMember}
              disabled={!familyForm.name.trim() || !familyForm.relationship || addFamilyMutation.isPending || updateFamilyMutation.isPending}
              className="loom-btn"
              style={{
                width: '100%',
                opacity: !familyForm.name.trim() || !familyForm.relationship || addFamilyMutation.isPending || updateFamilyMutation.isPending ? 0.45 : 1,
              }}
            >
              {(addFamilyMutation.isPending || updateFamilyMutation.isPending)
                ? (editingMember ? 'saving…' : 'adding…')
                : (editingMember ? 'save changes' : 'add descendant')}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Invite modal ──────────────────────────────────── */}
      {showInviteModal && (
        <Modal onClose={() => setShowInviteModal(false)}>
          {inviteSent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: 'var(--loom-warm)', display: 'block', marginBottom: 16 }}>
                ∞
              </span>
              <h3 className="loom-serif" style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px' }}>
                Invitation sent.
              </h3>
              <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                They will receive an email with a link to the memory room.
              </p>
            </div>
          ) : (
            <>
              <ModalHeader title="invite a kin" onClose={() => setShowInviteModal(false)} />
              <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', marginBottom: 24, lineHeight: 1.7 }}>
                Send an email invitation to a family member to contribute their own memories.
              </p>
              <div style={{ display: 'grid', gap: 18 }}>
                <FieldBlock label="their name">
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Mum, Uncle John…"
                  />
                </FieldBlock>
                <FieldBlock label="their email *">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </FieldBlock>
                <button
                  type="button"
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
                  className="loom-btn"
                  style={{ width: '100%', opacity: !inviteEmail.trim() || sendInviteMutation.isPending ? 0.45 : 1 }}
                >
                  {sendInviteMutation.isPending ? 'sending…' : 'send invitation'}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {/* ── Test email modal ──────────────────────────────── */}
      {showTestEmailModal && (
        <Modal onClose={() => setShowTestEmailModal(false)}>
          {testEmailSent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: 'var(--loom-warm)', display: 'block', marginBottom: 16 }}>
                ∞
              </span>
              <h3 className="loom-serif" style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', margin: '0 0 8px' }}>
                Test email sent.
              </h3>
              <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)' }}>
                Check your inbox to see exactly what your successors will receive.
              </p>
            </div>
          ) : (
            <>
              <ModalHeader title="send test email" onClose={() => setShowTestEmailModal(false)} />
              <div style={{ textAlign: 'center', padding: '12px 0 28px' }}>
                <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: 'var(--loom-warm)', display: 'block', marginBottom: 16 }}>
                  ∞
                </span>
                <p className="loom-body" style={{ fontSize: 14, color: 'var(--loom-bone-dim)', lineHeight: 1.7 }}>
                  We'll send you a sample of the email your successors will receive when your legacy is
                  activated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => sendTestEmailMutation.mutate()}
                disabled={sendTestEmailMutation.isPending}
                className="loom-btn"
                style={{ width: '100%', opacity: sendTestEmailMutation.isPending ? 0.45 : 1 }}
              >
                {sendTestEmailMutation.isPending ? 'sending…' : 'send test to my email'}
              </button>
            </>
          )}
        </Modal>
      )}
    </AppFrame>
  );
}

export default RecipientExperience;
