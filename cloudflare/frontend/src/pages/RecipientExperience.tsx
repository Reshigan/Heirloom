import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '../components/Navigation';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import { ProgressHair } from '../components/ui/ProgressHair';
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

  // Feature onboarding
  const { isOpen: isOnboardingOpen, completeOnboarding, dismissOnboarding, openOnboarding } = useFeatureOnboarding('recipient-experience');

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

    // Get memories stats for preview
    const { data: memoriesStats } = useQuery({
      queryKey: ['memories-stats'],
      queryFn: () => memoriesApi.getStats().then((r: { data: { total: number; byType: { letters: number; voice: number; photos: number } } }) => r.data),
    });

    // Send test email to self
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
      <div className="min-h-screen relative bg-void">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <ProgressHair label="loading…" width={180} />
        </div>
      </div>
    );
  }

  const schedules = schedulesData?.schedules || [];
  const room = roomData?.room;
  const contributions = contributionsData?.contributions || [];
  const pendingContributions = contributions.filter(c => c.status === 'PENDING');

  const tabClass = (tab: typeof activeTab) =>
    `px-4 md:px-6 py-3 rounded-[2px] flex items-center gap-2 transition-colors border ${
      activeTab === tab
        ? 'border-gold-40 text-gold'
        : 'border-paper-15 text-paper-70 hover:text-paper'
    }`;

  return (
    <div className="min-h-screen relative bg-void text-paper antialiased">
      <Navigation />

      <main className="relative z-10 px-6 md:px-12 pt-24 pb-16 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-4">Recipient Experience</p>
          <h1 className="font-display font-light text-4xl md:text-5xl mb-4 tracking-[-0.018em]">Recipient Experience</h1>
          <p className="text-paper-70 max-w-xl mx-auto font-light leading-relaxed">
            Configure how your loved ones will receive and interact with your legacy
          </p>
        </motion.div>

        {/* Quick Setup Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-void-surface border border-paper-15 rounded-[2px] p-6 mb-8"
        >
          <h2 className="font-body mb-4">Quick Setup</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setActiveTab('family');
                setShowAddFamilyModal(true);
              }}
              className="p-4 rounded-[2px] bg-void border border-paper-15 hover:bg-void-elevated transition-colors flex items-center gap-4 text-left group"
            >
              <div className="flex-1">
                <h3 className="font-body text-sm">Add Recipients</h3>
                <p className="text-xs text-paper-65">Who should receive your legacy?</p>
              </div>
              <span aria-hidden className="text-paper-50 group-hover:text-gold transition-colors">→</span>
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className="p-4 rounded-[2px] bg-void border border-paper-15 hover:bg-void-elevated transition-colors flex items-center gap-4 text-left group"
            >
              <div className="flex-1">
                <h3 className="font-body text-sm">Set Release Schedule</h3>
                <p className="text-xs text-paper-65">When should content be released?</p>
              </div>
              <span aria-hidden className="text-paper-50 group-hover:text-gold transition-colors">→</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('room');
                if (room && room.is_active !== 1) {
                  updateRoomMutation.mutate({ is_active: true });
                }
              }}
              className="p-4 rounded-[2px] bg-void border border-paper-15 hover:bg-void-elevated transition-colors flex items-center gap-4 text-left group"
            >
              <div className="flex-1">
                <h3 className="font-body text-sm">Enable Memory Room</h3>
                <p className="text-xs text-paper-65">Let family share their memories</p>
              </div>
              <span aria-hidden className="text-paper-50 group-hover:text-gold transition-colors">→</span>
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 md:gap-4 mb-8 flex-wrap">
          <button onClick={() => setActiveTab('preview')} className={tabClass('preview')}>
            <span className="hidden md:inline">Preview Experience</span>
            <span className="md:hidden">Preview</span>
          </button>
          <button onClick={() => setActiveTab('schedules')} className={tabClass('schedules')}>
            <span className="hidden md:inline">Staged Releases</span>
            <span className="md:hidden">Releases</span>
          </button>
          <button onClick={() => setActiveTab('room')} className={tabClass('room')}>
            <span className="hidden md:inline">Memory Room</span>
            <span className="md:hidden">Room</span>
            {pendingContributions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-[2px] bg-gold text-void text-xs font-mono">
                {pendingContributions.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('family')} className={tabClass('family')}>
            <span className="hidden md:inline">Manage Recipients</span>
            <span className="md:hidden">Recipients</span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Preview Experience Tab */}
          {activeTab === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* What Recipients Will See */}
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                <div className="mb-6">
                  <h2 className="font-body text-xl mb-1">Preview What They'll Experience</h2>
                  <p className="text-paper-65 text-sm">
                    See exactly what your loved ones will receive when your legacy is activated.
                  </p>
                </div>

                {/* Preview Card - Simulated Email */}
                <div className="bg-void rounded-[2px] border border-paper-15 overflow-hidden mb-6">
                  <div className="bg-void-elevated px-4 py-3 border-b border-paper-15">
                    <div className="text-sm text-paper-70 font-mono">
                      Preview: Email they'll receive
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="font-display text-2xl text-gold" aria-hidden>∞</span>
                      <div>
                        <p className="font-body">A Message From Someone Who Loves You</p>
                        <p className="text-sm text-paper-65">From Heirloom</p>
                      </div>
                    </div>
                    <div className="space-y-4 text-paper-70 leading-relaxed">
                      <p>Dear loved one,</p>
                      <p>Someone who cares deeply about you has left you messages, memories, and stories they wanted you to have.</p>
                      <p>When you're ready, click below to access your personal legacy portal.</p>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button className="btn btn-primary">
                        Access Your Legacy <span aria-hidden>→</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* What's Included Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-void border border-paper-15 rounded-[2px] text-center">
                    <div className="text-2xl font-light text-gold mb-1">{memoriesStats?.total || 0}</div>
                    <div className="text-xs text-paper-65">Total Memories</div>
                  </div>
                  <div className="p-4 bg-void border border-paper-15 rounded-[2px] text-center">
                    <div className="text-2xl font-light text-paper mb-1">{memoriesStats?.byType?.letters || 0}</div>
                    <div className="text-xs text-paper-65">Letters</div>
                  </div>
                  <div className="p-4 bg-void border border-paper-15 rounded-[2px] text-center">
                    <div className="text-2xl font-light text-paper mb-1">{memoriesStats?.byType?.voice || 0}</div>
                    <div className="text-xs text-paper-65">Voice Messages</div>
                  </div>
                  <div className="p-4 bg-void border border-paper-15 rounded-[2px] text-center">
                    <div className="text-2xl font-light text-paper mb-1">{familyData?.members?.length || 0}</div>
                    <div className="text-xs text-paper-65">Recipients</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowTestEmailModal(true)}
                    className="flex-1 py-3 border border-gold-40 text-gold rounded-[2px] hover:text-gold-bright transition-colors flex items-center justify-center gap-2"
                  >
                    Send Test to Myself
                  </button>
                  <button
                    onClick={() => window.open('/inherit/preview', '_blank')}
                    className="flex-1 py-3 border border-paper-15 rounded-[2px] hover:bg-void-elevated transition-colors flex items-center justify-center gap-2"
                  >
                    Preview Full Portal <span aria-hidden>→</span>
                  </button>
                </div>
              </div>

              {/* Delivery Timeline */}
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                <h3 className="font-body mb-4">Delivery Timeline</h3>
                <div className="space-y-3">
                  {schedules.filter(s => s.enabled === 1).map((schedule, index) => (
                    <div key={schedule.id} className="flex items-center gap-4 p-3 bg-void border border-paper-15 rounded-[2px]">
                      <div className="w-8 h-8 rounded-[2px] border border-gold-40 flex items-center justify-center text-gold text-sm font-mono">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-body text-sm">{schedule.stage_name}</p>
                        <p className="text-xs text-paper-65">
                          {schedule.delay_days === 0 ? 'Delivered immediately' : `Delivered after ${schedule.delay_days} days`}
                        </p>
                      </div>
                      <span aria-hidden className="text-gold">✓</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust & Privacy Section */}
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                <h3 className="font-body mb-4">Privacy & Control</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-void border border-paper-15 rounded-[2px]">
                    <p className="font-body text-sm">End-to-End Encrypted</p>
                    <p className="text-xs text-paper-65 mt-1">Your memories are protected with bank-level encryption</p>
                  </div>
                  <div className="p-4 bg-void border border-paper-15 rounded-[2px]">
                    <p className="font-body text-sm">You Control Access</p>
                    <p className="text-xs text-paper-65 mt-1">Only invited recipients can view your content</p>
                  </div>
                  <div className="p-4 bg-void border border-paper-15 rounded-[2px]">
                    <p className="font-body text-sm">Export Anytime</p>
                    <p className="text-xs text-paper-65 mt-1">Download all your content whenever you want</p>
                  </div>
                  <div className="p-4 bg-void border border-paper-15 rounded-[2px]">
                    <p className="font-body text-sm">Delete Permanently</p>
                    <p className="text-xs text-paper-65 mt-1">Remove any content at any time, no questions asked</p>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-4 text-sm">
                <div className="text-paper-70">
                  <p className="font-body text-paper mb-1">What happens when your legacy is activated?</p>
                  <p className="leading-relaxed">Your designated recipients will receive an email with a secure link to access the content you've prepared for them. Content is released in stages to help them process gradually. You can change these settings anytime.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Staged Releases Tab */}
          {activeTab === 'schedules' && (
            <motion.div
              key="schedules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6 mb-6">
                <div className="mb-6">
                  <h2 className="font-body text-xl mb-1">Staged Content Release</h2>
                  <p className="text-paper-65 text-sm leading-relaxed">
                    Instead of overwhelming recipients with everything at once, your content will be released in thoughtful stages to help them through their grief journey.
                  </p>
                </div>

                <div className="space-y-4">
                  {schedules.map((schedule, index) => (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-[2px] border transition-colors ${
                        schedule.enabled === 1 ? 'bg-void border-paper-15' : 'bg-void border-paper-15 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[2px] border border-gold-40 flex items-center justify-center text-gold text-sm font-mono">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-body">{schedule.stage_name}</h3>
                            <p className="text-sm text-paper-65">
                              {schedule.delay_days === 0 ? 'Immediately' : `After ${schedule.delay_days} days`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateScheduleMutation.mutate({
                            scheduleId: schedule.id,
                            data: { enabled: schedule.enabled !== 1 }
                          })}
                          aria-label={schedule.enabled === 1 ? 'Disable stage' : 'Enable stage'}
                          className={`w-12 h-6 rounded-[2px] transition-colors ${
                            schedule.enabled === 1 ? 'bg-gold' : 'bg-paper-15'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-[2px] bg-void transition-transform ${
                            schedule.enabled === 1 ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                      <p className="text-sm text-paper-70 ml-11">{schedule.stage_description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-4 text-sm text-paper-70 leading-relaxed">
                <p>
                  Staged releases help recipients process content gradually, providing comfort when they need it most and deeper reflections over time.
                </p>
              </div>
            </motion.div>
          )}

          {/* Family Memory Room Tab */}
          {activeTab === 'room' && room && (
            <motion.div
              key="room"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Room Settings */}
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-body text-xl mb-1">Family Memory Room</h2>
                    <p className="text-paper-65 text-sm">
                      A shared space where your loved ones can add their own memories and stories about you.
                    </p>
                  </div>
                  <button
                    onClick={() => updateRoomMutation.mutate({ is_active: room.is_active !== 1 })}
                    className={`px-4 py-2 rounded-[2px] text-sm transition-colors border ${
                      room.is_active === 1
                        ? 'border-gold-40 text-gold'
                        : 'border-paper-15 text-paper-65'
                    }`}
                  >
                    {room.is_active === 1 ? 'Active' : 'Inactive'}
                  </button>
                </div>

                                {/* Quick Actions */}
                                {room.is_active === 1 && (
                                  <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                      onClick={() => setShowInviteModal(true)}
                                      className="p-4 bg-void border border-paper-15 rounded-[2px] hover:bg-void-elevated transition-colors flex items-center gap-3 text-left"
                                    >
                                      <div>
                                        <p className="font-body text-gold">Invite Family</p>
                                        <p className="text-xs text-paper-65">Send email invitations</p>
                                      </div>
                                    </button>
                                    <button
                                      onClick={previewRoom}
                                      className="p-4 bg-void border border-paper-15 rounded-[2px] hover:bg-void-elevated transition-colors flex items-center gap-3 text-left"
                                    >
                                      <div>
                                        <p className="font-body">Preview Room <span aria-hidden>→</span></p>
                                        <p className="text-xs text-paper-65">See what family sees</p>
                                      </div>
                                    </button>
                                    <button
                                      onClick={copyRoomUrl}
                                      className="p-4 bg-void border border-paper-15 rounded-[2px] hover:bg-void-elevated transition-colors flex items-center gap-3 text-left"
                                    >
                                      <div>
                                        <p className="font-body">{copiedUrl ? 'Copied!' : 'Copy Link'}</p>
                                        <p className="text-xs text-paper-65">Share manually</p>
                                      </div>
                                    </button>
                                  </div>
                                )}

                {/* Room Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => updateRoomMutation.mutate({ allow_photos: room.allow_photos !== 1 })}
                    className={`p-4 rounded-[2px] flex flex-col items-center gap-2 transition-colors border ${
                      room.allow_photos === 1 ? 'border-gold-40 text-gold' : 'border-paper-15 text-paper-70'
                    }`}
                  >
                    <span className="text-sm">Photos</span>
                    <span className="text-xs">{room.allow_photos === 1 ? 'Allowed' : 'Disabled'}</span>
                  </button>
                  <button
                    onClick={() => updateRoomMutation.mutate({ allow_voice: room.allow_voice !== 1 })}
                    className={`p-4 rounded-[2px] flex flex-col items-center gap-2 transition-colors border ${
                      room.allow_voice === 1 ? 'border-gold-40 text-gold' : 'border-paper-15 text-paper-70'
                    }`}
                  >
                    <span className="text-sm">Voice</span>
                    <span className="text-xs">{room.allow_voice === 1 ? 'Allowed' : 'Disabled'}</span>
                  </button>
                  <button
                    onClick={() => updateRoomMutation.mutate({ allow_text: room.allow_text !== 1 })}
                    className={`p-4 rounded-[2px] flex flex-col items-center gap-2 transition-colors border ${
                      room.allow_text === 1 ? 'border-gold-40 text-gold' : 'border-paper-15 text-paper-70'
                    }`}
                  >
                    <span className="text-sm">Text</span>
                    <span className="text-xs">{room.allow_text === 1 ? 'Allowed' : 'Disabled'}</span>
                  </button>
                  <button
                    onClick={() => updateRoomMutation.mutate({ moderation_required: room.moderation_required !== 1 })}
                    className={`p-4 rounded-[2px] flex flex-col items-center gap-2 transition-colors border ${
                      room.moderation_required === 1 ? 'border-gold-40 text-gold' : 'border-paper-15 text-paper-70'
                    }`}
                  >
                    <span className="text-sm">Moderation</span>
                    <span className="text-xs">{room.moderation_required === 1 ? 'Required' : 'Auto-approve'}</span>
                  </button>
                </div>
              </div>

              {/* Contributions */}
              {contributions.length > 0 && (
                <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                  <h3 className="font-body text-lg mb-4">
                    Contributions ({contributions.length})
                  </h3>
                  <div className="space-y-3">
                    {contributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className="p-4 rounded-[2px] bg-void border border-paper-15"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-body">{contribution.contributor_name}</span>
                              {contribution.contributor_relationship && (
                                <span className="text-sm text-paper-65">({contribution.contributor_relationship})</span>
                              )}
                            </div>
                            {contribution.title && (
                              <p className="text-sm font-body mb-1">{contribution.title}</p>
                            )}
                            <p className="text-sm text-paper-70 line-clamp-2">{contribution.content}</p>
                            <p className="text-xs text-paper-50 mt-2 font-mono">
                              {new Date(contribution.created_at).toLocaleDateString()} · {contribution.content_type}
                            </p>
                          </div>
                          {contribution.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => moderateContributionMutation.mutate({
                                  contributionId: contribution.id,
                                  status: 'APPROVED'
                                })}
                                className="px-3 py-1.5 border border-gold-40 text-gold rounded-[2px] hover:text-gold-bright transition-colors text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => moderateContributionMutation.mutate({
                                  contributionId: contribution.id,
                                  status: 'REJECTED'
                                })}
                                className="px-3 py-1.5 border border-paper-15 text-blood rounded-[2px] hover:text-blood transition-colors text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {contribution.status !== 'PENDING' && (
                            <span className="px-2 py-1 rounded-[2px] text-xs font-mono uppercase tracking-[0.1em] border border-paper-15 text-paper-70">
                              {contribution.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contributions.length === 0 && room.is_active === 1 && (
                <div className="bg-void-surface border border-paper-15 rounded-[2px] p-8 text-center">
                  <span className="font-display text-3xl text-paper-30 block mb-4" aria-hidden>∞</span>
                  <h3 className="font-body mb-2">No contributions yet</h3>
                  <p className="text-paper-65 text-sm">
                    Share the room link with family members to start collecting memories.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Family Management Tab */}
          {activeTab === 'family' && (
            <motion.div
              key="family"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-body text-xl mb-1">Manage Recipients</h2>
                    <p className="text-paper-65 text-sm">
                      Add and manage the people who will receive your legacy content.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddFamilyModal(true)}
                    className="btn btn-primary"
                  >
                    Add Recipient
                  </button>
                </div>

                {/* Family Members List */}
                {familyData?.members && familyData.members.length > 0 ? (
                  <div className="space-y-3">
                    {familyData.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 bg-void border border-paper-15 rounded-[2px] flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-body">{member.name}</h3>
                          <p className="text-sm text-paper-65">{member.relationship}</p>
                          {member.email && (
                            <p className="text-xs text-paper-50 mt-1 font-mono">
                              {member.email}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-paper-70 hover:text-paper transition-colors text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteFamilyMutation.mutate(member.id)}
                            className="text-paper-50 hover:text-blood transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="font-display text-3xl text-paper-30 block mb-4" aria-hidden>∞</span>
                    <h3 className="font-body mb-2">No recipients added yet</h3>
                    <p className="text-paper-65 text-sm mb-4">
                      Add family members and loved ones who will receive your legacy.
                    </p>
                    <button
                      onClick={() => setShowAddFamilyModal(true)}
                      className="btn btn-primary"
                    >
                      Add Your First Recipient
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-void-surface border border-paper-15 rounded-[2px] p-4 text-sm text-paper-70 leading-relaxed">
                <p>
                  Recipients will only receive content after your legacy is activated. You control exactly what each person receives.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Help Button */}
      <OnboardingHelpButton onClick={openOnboarding} />

      {/* Feature Onboarding */}
      <FeatureOnboarding
        featureKey="recipient-experience"
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onDismiss={dismissOnboarding}
      />

      {/* Add/Edit Family Member Modal */}
      <AnimatePresence>
        {showAddFamilyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4"
            onClick={() => resetFamilyForm()}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-void-surface border border-paper-15 rounded-[2px] p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-body text-xl">
                  {editingMember ? 'Edit Recipient' : 'Add Recipient'}
                </h3>
                <button onClick={() => resetFamilyForm()} className="text-paper-50 hover:text-paper transition-colors" aria-label="Close">
                  <span aria-hidden>✕</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">Name *</label>
                  <input
                    type="text"
                    value={familyForm.name}
                    onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                    placeholder="e.g., Sarah, Dad, Uncle John"
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 placeholder:text-paper-30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">Relationship *</label>
                  <select
                    value={familyForm.relationship}
                    onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 transition-colors"
                  >
                    <option value="">Select relationship...</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Grandchild">Grandchild</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">Email</label>
                  <input
                    type="email"
                    value={familyForm.email}
                    onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 placeholder:text-paper-30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={familyForm.phone}
                    onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 placeholder:text-paper-30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">Notes</label>
                  <textarea
                    value={familyForm.notes}
                    onChange={(e) => setFamilyForm({ ...familyForm, notes: e.target.value })}
                    placeholder="Any special notes about this person..."
                    rows={2}
                    className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 placeholder:text-paper-30 transition-colors resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveFamilyMember}
                  disabled={!familyForm.name.trim() || !familyForm.relationship || addFamilyMutation.isPending || updateFamilyMutation.isPending}
                  className="w-full btn btn-primary"
                >
                  {(addFamilyMutation.isPending || updateFamilyMutation.isPending)
                    ? (editingMember ? 'Saving…' : 'Adding…')
                    : (editingMember ? 'Save Changes' : 'Add Recipient')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-void-surface border border-paper-15 rounded-[2px] p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              {inviteSent ? (
                <div className="text-center py-8">
                  <span className="font-display text-4xl text-gold block mb-4" aria-hidden>∞</span>
                  <h3 className="font-body text-xl mb-2">Invitation Sent</h3>
                  <p className="text-paper-70">They will receive an email with the link to your memory room.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-body text-xl">Invite Family Member</h3>
                    <button onClick={() => setShowInviteModal(false)} className="text-paper-50 hover:text-paper transition-colors" aria-label="Close">
                      <span aria-hidden>✕</span>
                    </button>
                  </div>

                  <p className="text-paper-70 text-sm mb-6">
                    Send an email invitation to a family member or friend to contribute memories and stories.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">Their Name</label>
                      <input
                        type="text"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="e.g., Mom, Uncle John"
                        className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 placeholder:text-paper-30 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2">Their Email *</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full bg-void border border-paper-15 focus:border-gold focus:outline-none text-paper rounded-[2px] px-4 py-3 placeholder:text-paper-30 transition-colors"
                      />
                    </div>

                    <button
                      onClick={handleSendInvite}
                      disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
                      className="w-full btn btn-primary"
                    >
                      {sendInviteMutation.isPending ? 'Sending…' : 'Send Invitation'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Email Modal */}
      <AnimatePresence>
        {showTestEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTestEmailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-void-surface border border-paper-15 rounded-[2px] p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              {testEmailSent ? (
                <div className="text-center py-8">
                  <span className="font-display text-4xl text-gold block mb-4" aria-hidden>∞</span>
                  <h3 className="font-body text-xl mb-2">Test Email Sent</h3>
                  <p className="text-paper-70">Check your inbox to see exactly what your recipients will receive.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-body text-xl">Send Test Email</h3>
                    <button onClick={() => setShowTestEmailModal(false)} className="text-paper-50 hover:text-paper transition-colors" aria-label="Close">
                      <span aria-hidden>✕</span>
                    </button>
                  </div>

                  <div className="text-center py-4">
                    <span className="font-display text-4xl text-gold block mb-4" aria-hidden>∞</span>
                    <p className="text-paper-70 text-sm mb-6 leading-relaxed">
                      We'll send you a sample of the email your recipients will receive when your legacy is activated. This helps you see exactly what they'll experience.
                    </p>
                  </div>

                  <button
                    onClick={() => sendTestEmailMutation.mutate()}
                    disabled={sendTestEmailMutation.isPending}
                    className="w-full btn btn-primary"
                  >
                    {sendTestEmailMutation.isPending ? 'Sending…' : 'Send Test to My Email'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RecipientExperience;
