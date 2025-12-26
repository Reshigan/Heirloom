import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, Check, X, Image, Mic, FileText, Copy, Shield, Send, ExternalLink, Mail, CheckCircle, Plus, Trash2, Edit2, UserPlus, Sparkles, ChevronRight, Heart
} from 'lucide-react';
import { Navigation } from '../components/Navigation';
import { FeatureOnboarding, useFeatureOnboarding, OnboardingHelpButton } from '../components/FeatureOnboarding';
import api, { familyApi } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'schedules' | 'room' | 'family'>('schedules');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [familyForm, setFamilyForm] = useState({ name: '', relationship: '', email: '', phone: '', notes: '' });

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
      enabled: activeTab === 'family',
    });

  const addFamilyMutation = useMutation({
    mutationFn: (data: { name: string; relationship: string; email?: string; phone?: string; notes?: string }) =>
      familyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      resetFamilyForm();
    },
  });

  const updateFamilyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      familyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      resetFamilyForm();
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
    if (!familyForm.name.trim()) return;
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

  const schedules = schedulesData?.schedules || [];
  const room = roomData?.room;
  const contributions = contributionsData?.contributions || [];
  const pendingContributions = contributions.filter(c => c.status === 'PENDING');

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
          className="text-center mb-8"
        >
          <h1 className="font-display text-4xl md:text-5xl mb-4">Recipient Experience</h1>
          <p className="text-paper/60 max-w-xl mx-auto">
            Configure how your loved ones will receive and interact with your legacy
          </p>
        </motion.div>

        {/* Quick Setup Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={20} className="text-gold" />
            <h2 className="font-medium">Quick Setup</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setActiveTab('family');
                setShowAddFamilyModal(true);
              }}
              className="p-4 rounded-xl bg-paper/5 hover:bg-paper/10 transition-all flex items-center gap-4 text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                <UserPlus size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Add Recipients</h3>
                <p className="text-xs text-paper/50">Who should receive your legacy?</p>
              </div>
              <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className="p-4 rounded-xl bg-paper/5 hover:bg-paper/10 transition-all flex items-center gap-4 text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Set Release Schedule</h3>
                <p className="text-xs text-paper/50">When should content be released?</p>
              </div>
              <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
            </button>
            <button
              onClick={() => {
                setActiveTab('room');
                if (room && room.is_active !== 1) {
                  updateRoomMutation.mutate({ is_active: true });
                }
              }}
              className="p-4 rounded-xl bg-paper/5 hover:bg-paper/10 transition-all flex items-center gap-4 text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Heart size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Enable Memory Room</h3>
                <p className="text-xs text-paper/50">Let family share their memories</p>
              </div>
              <ChevronRight size={16} className="text-paper/30 group-hover:text-gold transition-colors" />
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'schedules' 
                ? 'bg-gold/20 text-gold border border-gold/30' 
                : 'glass hover:bg-paper/5'
            }`}
          >
            <Clock size={18} />
            Staged Releases
          </button>
          <button
            onClick={() => setActiveTab('room')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'room' 
                ? 'bg-gold/20 text-gold border border-gold/30' 
                : 'glass hover:bg-paper/5'
            }`}
          >
            <Users size={18} />
            Memory Room
            {pendingContributions.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-gold text-void text-xs flex items-center justify-center">
                {pendingContributions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'family' 
                ? 'bg-gold/20 text-gold border border-gold/30' 
                : 'glass hover:bg-paper/5'
            }`}
          >
            <UserPlus size={18} />
            Manage Recipients
          </button>
        </div>

        {/* Staged Releases Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'schedules' && (
            <motion.div
              key="schedules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="glass rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium mb-1">Staged Content Release</h2>
                    <p className="text-paper/50 text-sm">
                      Instead of overwhelming recipients with everything at once, your content will be released in thoughtful stages to help them through their grief journey.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {schedules.map((schedule, index) => (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-xl transition-all ${
                        schedule.enabled === 1 ? 'bg-paper/5' : 'bg-void/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-medium">{schedule.stage_name}</h3>
                            <p className="text-sm text-paper/50">
                              {schedule.delay_days === 0 ? 'Immediately' : `After ${schedule.delay_days} days`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateScheduleMutation.mutate({
                            scheduleId: schedule.id,
                            data: { enabled: schedule.enabled !== 1 }
                          })}
                          className={`w-12 h-6 rounded-full transition-all ${
                            schedule.enabled === 1 ? 'bg-gold' : 'bg-paper/20'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            schedule.enabled === 1 ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                      <p className="text-sm text-paper/40 ml-11">{schedule.stage_description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-4 flex items-center gap-3 text-sm text-paper/60">
                <Shield size={18} className="text-gold" />
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
              <div className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <Users size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-medium mb-1">Family Memory Room</h2>
                      <p className="text-paper/50 text-sm">
                        A shared space where your loved ones can add their own memories and stories about you.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateRoomMutation.mutate({ is_active: room.is_active !== 1 })}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      room.is_active === 1 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-paper/10 text-paper/50'
                    }`}
                  >
                    {room.is_active === 1 ? (
                      <>
                        <Check size={16} />
                        Active
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        Inactive
                      </>
                    )}
                  </button>
                </div>

                                {/* Quick Actions */}
                                {room.is_active === 1 && (
                                  <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                      onClick={() => setShowInviteModal(true)}
                                      className="p-4 bg-gold/10 border border-gold/30 rounded-xl hover:bg-gold/20 transition-all flex items-center gap-3"
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
                                        <Mail size={20} />
                                      </div>
                                      <div className="text-left">
                                        <p className="font-medium text-gold">Invite Family</p>
                                        <p className="text-xs text-paper/50">Send email invitations</p>
                                      </div>
                                    </button>
                                    <button
                                      onClick={previewRoom}
                                      className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-all flex items-center gap-3"
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <ExternalLink size={20} />
                                      </div>
                                      <div className="text-left">
                                        <p className="font-medium text-purple-400">Preview Room</p>
                                        <p className="text-xs text-paper/50">See what family sees</p>
                                      </div>
                                    </button>
                                    <button
                                      onClick={copyRoomUrl}
                                      className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-all flex items-center gap-3"
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        {copiedUrl ? <Check size={20} /> : <Copy size={20} />}
                                      </div>
                                      <div className="text-left">
                                        <p className="font-medium text-blue-400">{copiedUrl ? 'Copied!' : 'Copy Link'}</p>
                                        <p className="text-xs text-paper/50">Share manually</p>
                                      </div>
                                    </button>
                                  </div>
                                )}

                {/* Room Settings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => updateRoomMutation.mutate({ allow_photos: room.allow_photos !== 1 })}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      room.allow_photos === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-void/30 text-paper/40'
                    }`}
                  >
                    <Image size={24} />
                    <span className="text-sm">Photos</span>
                    <span className="text-xs">{room.allow_photos === 1 ? 'Allowed' : 'Disabled'}</span>
                  </button>
                  <button
                    onClick={() => updateRoomMutation.mutate({ allow_voice: room.allow_voice !== 1 })}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      room.allow_voice === 1 ? 'bg-purple-500/20 text-purple-400' : 'bg-void/30 text-paper/40'
                    }`}
                  >
                    <Mic size={24} />
                    <span className="text-sm">Voice</span>
                    <span className="text-xs">{room.allow_voice === 1 ? 'Allowed' : 'Disabled'}</span>
                  </button>
                  <button
                    onClick={() => updateRoomMutation.mutate({ allow_text: room.allow_text !== 1 })}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      room.allow_text === 1 ? 'bg-green-500/20 text-green-400' : 'bg-void/30 text-paper/40'
                    }`}
                  >
                    <FileText size={24} />
                    <span className="text-sm">Text</span>
                    <span className="text-xs">{room.allow_text === 1 ? 'Allowed' : 'Disabled'}</span>
                  </button>
                  <button
                    onClick={() => updateRoomMutation.mutate({ moderation_required: room.moderation_required !== 1 })}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      room.moderation_required === 1 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-void/30 text-paper/40'
                    }`}
                  >
                    <Shield size={24} />
                    <span className="text-sm">Moderation</span>
                    <span className="text-xs">{room.moderation_required === 1 ? 'Required' : 'Auto-approve'}</span>
                  </button>
                </div>
              </div>

              {/* Contributions */}
              {contributions.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-medium mb-4">
                    Contributions ({contributions.length})
                  </h3>
                  <div className="space-y-3">
                    {contributions.map((contribution) => (
                      <div
                        key={contribution.id}
                        className={`p-4 rounded-xl ${
                          contribution.status === 'PENDING' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                          contribution.status === 'APPROVED' ? 'bg-green-500/10' :
                          'bg-red-500/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{contribution.contributor_name}</span>
                              {contribution.contributor_relationship && (
                                <span className="text-sm text-paper/50">({contribution.contributor_relationship})</span>
                              )}
                            </div>
                            {contribution.title && (
                              <p className="text-sm font-medium mb-1">{contribution.title}</p>
                            )}
                            <p className="text-sm text-paper/60 line-clamp-2">{contribution.content}</p>
                            <p className="text-xs text-paper/40 mt-2">
                              {new Date(contribution.created_at).toLocaleDateString()} - {contribution.content_type}
                            </p>
                          </div>
                          {contribution.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => moderateContributionMutation.mutate({
                                  contributionId: contribution.id,
                                  status: 'APPROVED'
                                })}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => moderateContributionMutation.mutate({
                                  contributionId: contribution.id,
                                  status: 'REJECTED'
                                })}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                          {contribution.status !== 'PENDING' && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              contribution.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
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
                <div className="glass rounded-xl p-8 text-center">
                  <Users size={48} className="mx-auto text-paper/20 mb-4" />
                  <h3 className="font-medium mb-2">No contributions yet</h3>
                  <p className="text-paper/50 text-sm">
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
              <div className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                      <UserPlus size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-medium mb-1">Manage Recipients</h2>
                      <p className="text-paper/50 text-sm">
                        Add and manage the people who will receive your legacy content.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddFamilyModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Recipient
                  </button>
                </div>

                {/* Family Members List */}
                {familyData?.members && familyData.members.length > 0 ? (
                  <div className="space-y-3">
                    {familyData.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 bg-paper/5 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-medium text-lg">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-paper/50">{member.relationship}</p>
                            {member.email && (
                              <p className="text-xs text-paper/40 flex items-center gap-1 mt-1">
                                <Mail size={12} />
                                {member.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="p-2 hover:bg-paper/10 rounded-lg transition-colors text-paper/60 hover:text-paper"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteFamilyMutation.mutate(member.id)}
                            className="p-2 hover:bg-paper/10 rounded-lg transition-colors text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-paper/20 mb-4" />
                    <h3 className="font-medium mb-2">No recipients added yet</h3>
                    <p className="text-paper/50 text-sm mb-4">
                      Add family members and loved ones who will receive your legacy.
                    </p>
                    <button
                      onClick={() => setShowAddFamilyModal(true)}
                      className="btn btn-primary"
                    >
                      <Plus size={18} className="mr-2" />
                      Add Your First Recipient
                    </button>
                  </div>
                )}
              </div>

              <div className="glass rounded-xl p-4 flex items-center gap-3 text-sm text-paper/60">
                <Shield size={18} className="text-gold" />
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => resetFamilyForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium">
                  {editingMember ? 'Edit Recipient' : 'Add Recipient'}
                </h3>
                <button onClick={() => resetFamilyForm()} className="text-paper/50 hover:text-paper">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Name *</label>
                  <input
                    type="text"
                    value={familyForm.name}
                    onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                    placeholder="e.g., Sarah, Dad, Uncle John"
                    className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Relationship *</label>
                  <select
                    value={familyForm.relationship}
                    onChange={(e) => setFamilyForm({ ...familyForm, relationship: e.target.value })}
                    className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
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
                  <label className="block text-sm text-paper/70 mb-2">Email</label>
                  <input
                    type="email"
                    value={familyForm.email}
                    onChange={(e) => setFamilyForm({ ...familyForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={familyForm.phone}
                    onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Notes</label>
                  <textarea
                    value={familyForm.notes}
                    onChange={(e) => setFamilyForm({ ...familyForm, notes: e.target.value })}
                    placeholder="Any special notes about this person..."
                    rows={2}
                    className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveFamilyMember}
                  disabled={!familyForm.name.trim() || !familyForm.relationship || addFamilyMutation.isPending || updateFamilyMutation.isPending}
                  className="w-full py-3 bg-gradient-to-r from-gold to-gold/80 text-void font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(addFamilyMutation.isPending || updateFamilyMutation.isPending) ? (
                    <div className="animate-spin w-5 h-5 border-2 border-void border-t-transparent rounded-full" />
                  ) : (
                    <>
                      {editingMember ? 'Save Changes' : 'Add Recipient'}
                    </>
                  )}
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              {inviteSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Invitation Sent!</h3>
                  <p className="text-paper/60">They will receive an email with the link to your memory room.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium">Invite Family Member</h3>
                    <button onClick={() => setShowInviteModal(false)} className="text-paper/50 hover:text-paper">
                      <X size={24} />
                    </button>
                  </div>

                  <p className="text-paper/60 text-sm mb-6">
                    Send an email invitation to a family member or friend to contribute memories and stories.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-paper/70 mb-2">Their Name</label>
                      <input
                        type="text"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        placeholder="e.g., Mom, Uncle John"
                        className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-paper/70 mb-2">Their Email *</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full bg-void/50 border border-paper/10 rounded-lg px-4 py-3 focus:outline-none focus:border-gold/50"
                      />
                    </div>

                    <button
                      onClick={handleSendInvite}
                      disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
                      className="w-full py-3 bg-gradient-to-r from-gold to-gold/80 text-void font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sendInviteMutation.isPending ? (
                        <div className="animate-spin w-5 h-5 border-2 border-void border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Send size={18} />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
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
