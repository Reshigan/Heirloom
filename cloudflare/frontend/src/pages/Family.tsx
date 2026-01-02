import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Pen, Trash2, Mail, Phone, Heart, Users, Check, AlertCircle, Camera, Share2, Copy } from '../components/Icons';
import { familyApi, settingsApi } from '../services/api';
import { AvatarCropperModal } from '../components/AvatarCropperModal';
import { Navigation } from '../components/Navigation';

const RELATIONSHIPS = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Grandchild', 'Grandparent', 'Friend', 'Other'];

const INVITE_URL = 'https://heirloom.blue/signup';
const INVITE_TEXT = "I'm preserving our family memories on Heirloom - a beautiful app for stories, photos, and letters that last forever. Join me and let's keep our family legacy alive together!";

export function Family() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', relationship: '', email: '', phone: '', avatarUrl: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(INVITE_TEXT);
    const url = encodeURIComponent(INVITE_URL);
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        break;
      case 'instagram':
      case 'tiktok':
      case 'copy':
        navigator.clipboard.writeText(`${INVITE_TEXT}\n\n${INVITE_URL}`);
        setCopiedPlatform(platform);
        setTimeout(() => setCopiedPlatform(null), 2000);
        if (platform === 'instagram') {
          showToast('success', 'Link copied! Open Instagram and paste in your bio or story');
        } else if (platform === 'tiktok') {
          showToast('success', 'Link copied! Open TikTok and paste in your bio or video');
        } else {
          showToast('success', 'Invite link copied to clipboard!');
        }
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({
            title: 'Join me on Heirloom',
            text: INVITE_TEXT,
            url: INVITE_URL,
          });
        }
        break;
    }
  };
  
    // Avatar upload state
    const [showAvatarCropper, setShowAvatarCropper] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection for avatar
    const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setSelectedImageSrc(event.target?.result as string);
          setShowAvatarCropper(true);
        };
        reader.readAsDataURL(file);
      }
      if (e.target) e.target.value = '';
    };

    // Handle cropped avatar upload
    const handleAvatarCropComplete = async (croppedFile: File, previewUrl: string) => {
      setIsUploadingAvatar(true);
      try {
        const { data: urlData } = await settingsApi.getUploadUrl({
          filename: croppedFile.name,
          contentType: croppedFile.type,
        });
      
        await fetch(urlData.uploadUrl, {
          method: 'PUT',
          body: croppedFile,
          headers: { 'Content-Type': croppedFile.type },
        });
      
        setAvatarPreview(previewUrl);
        setForm({ ...form, avatarUrl: urlData.url });
        setShowAvatarCropper(false);
        setSelectedImageSrc(null);
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        showToast('error', 'Failed to upload photo');
      } finally {
        setIsUploadingAvatar(false);
      }
    };

  const { data: family, isLoading } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

  const { data: selectedMember } = useQuery({
    queryKey: ['family', id],
    queryFn: () => familyApi.getOne(id!).then(r => r.data),
    enabled: !!id,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

    const createMutation = useMutation({
      mutationFn: (data: typeof form) => familyApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['family'] });
        setShowAddModal(false);
        setForm({ name: '', relationship: '', email: '', phone: '', avatarUrl: '' });
        setAvatarPreview(null);
        showToast('success', 'Family member added successfully');
      },
      onError: (error: any) => {
        setErrors({ submit: error.response?.data?.error || 'Failed to add family member' });
      },
    });

    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => familyApi.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['family'] });
        setEditingId(null);
        setShowAddModal(false);
        setForm({ name: '', relationship: '', email: '', phone: '', avatarUrl: '' });
        setAvatarPreview(null);
        showToast('success', 'Family member updated');
      },
      onError: () => {
        showToast('error', 'Failed to update');
      },
    });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => familyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family'] });
      navigate('/family');
      showToast('success', 'Family member removed');
    },
    onError: () => {
      showToast('error', 'Failed to remove');
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.relationship) newErrors.relationship = 'Relationship is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (editingId) {
        updateMutation.mutate({ id: editingId, data: form });
      } else {
        createMutation.mutate(form);
      }
    }
  };

  const handleDelete = (memberId: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from your family?`)) {
      deleteMutation.mutate(memberId);
    }
  };

    const openEditModal = (member: any) => {
      setForm({
        name: member.name,
        relationship: member.relationship,
        email: member.email || '',
        phone: member.phone || '',
        avatarUrl: member.avatarUrl || '',
      });
      setAvatarPreview(member.avatarUrl || null);
      setEditingId(member.id);
      setShowAddModal(true);
    };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Sanctuary Background */}
      <div className="sanctuary-bg">
        <div className="sanctuary-orb sanctuary-orb-1" />
        <div className="sanctuary-orb sanctuary-orb-2" />
        <div className="sanctuary-orb sanctuary-orb-3" />
        <div className="sanctuary-stars" />
        <div className="sanctuary-mist" />
      </div>

      <Navigation />

      {/* Animated constellation stars */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-gold rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <Check size={20} className="text-green-400" />
              ) : (
                <AlertCircle size={20} className="text-red-400" />
              )}
              <span>{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-6 md:px-12 py-12">
        <motion.button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft size={20} />
          Back to Vault
        </motion.button>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-light mb-2">Your Family <em>Constellation</em></h1>
            <p className="text-paper/50">The people who matter most to you</p>
          </motion.div>

          {/* Constellation View - outer relative wrapper for positioning */}
          <div className="relative h-[calc(100vh-200px)] min-h-[400px] max-h-[600px] mb-12">
            {/* Inner flex container for centering constellation content */}
            <div className="flex h-full items-center justify-center">
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {family?.map((member: any, i: number) => {
                  // Use same dynamic radius calculation as nodes
                  const memberCount = family.length;
                  const baseRadius = 180;
                  const ring = memberCount > 6 ? Math.floor(i / 6) : 0;
                  const indexInRing = memberCount > 6 ? i % 6 : i;
                  const membersInRing = memberCount > 6 ? Math.min(6, memberCount - ring * 6) : memberCount;
                  const radius = baseRadius + ring * 100;
                  const angleOffset = ring * (Math.PI / 6);
                  const angle = (indexInRing / Math.max(1, membersInRing)) * 2 * Math.PI - Math.PI / 2 + angleOffset;
                  const x = 50 + (Math.cos(angle) * radius) / 6;
                  const y = 50 + (Math.sin(angle) * radius * 0.7) / 3;
                  return (
                    <motion.line
                      key={member.id}
                      x1="50%"
                      y1="50%"
                      x2={`${x}%`}
                      y2={`${y}%`}
                      stroke="url(#goldGradient)"
                      strokeWidth="1"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.3 }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  );
                })}
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(201,169,89,0.5)" />
                    <stop offset="100%" stopColor="rgba(201,169,89,0.1)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center - You */}
              <motion.div
                className="absolute z-20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <div className="relative">
                  <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void font-medium text-lg shadow-lg"
                    style={{
                      boxShadow: '0 0 40px rgba(201,169,89,0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 30px rgba(201,169,89,0.3), inset 0 2px 4px rgba(255,255,255,0.3)',
                        '0 0 60px rgba(201,169,89,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                        '0 0 30px rgba(201,169,89,0.3), inset 0 2px 4px rgba(255,255,255,0.3)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    YOU
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 rounded-full border border-gold/30"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Family members */}
              {family?.map((member: any, i: number) => {
                // Dynamic radius based on number of members to prevent overlap
                const memberCount = family.length;
                const baseRadius = 180;
                // Increase radius for more members, and use multiple rings if needed
                const ring = memberCount > 6 ? Math.floor(i / 6) : 0;
                const indexInRing = memberCount > 6 ? i % 6 : i;
                const membersInRing = memberCount > 6 ? Math.min(6, memberCount - ring * 6) : memberCount;
                const radius = baseRadius + ring * 100;
                
                // Calculate angle with offset for each ring
                const angleOffset = ring * (Math.PI / 6); // Offset each ring slightly
                const angle = (indexInRing / Math.max(1, membersInRing)) * 2 * Math.PI - Math.PI / 2 + angleOffset;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius * 0.7; // Compress vertically to fit better

                return (
                  <motion.div
                    key={member.id}
                    className="absolute"
                    style={{ x, y }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      y: [y - 3, y + 3, y - 3],
                    }}
                    transition={{
                      scale: { delay: 0.3 + i * 0.1 },
                      y: { duration: 4 + i, repeat: Infinity },
                    }}
                  >
                    <motion.button
                      onClick={() => navigate(`/family/${member.id}`)}
                      className={`relative group ${id === member.id ? 'z-30' : 'z-10'}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div 
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-full glass flex items-center justify-center border-2 transition-all ${
                          id === member.id ? 'border-gold bg-gold/20' : 'border-gold/30 group-hover:border-gold'
                        }`}
                        style={{
                          boxShadow: id === member.id 
                            ? '0 0 30px rgba(201,169,89,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}
                      >
                        <span className="text-xl md:text-2xl text-gold">{member.name[0]}</span>
                      </div>
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center w-32 md:w-36">
                        <div className="text-paper text-xs md:text-sm font-medium truncate" title={member.name}>{member.name}</div>
                        <div className="text-paper/40 text-xs truncate" title={member.relationship}>{member.relationship}</div>
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}

              {/* Empty state */}
              {!isLoading && (!family || family.length === 0) && (
                <motion.div
                  className="absolute text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-20 h-20 rounded-full glass flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-paper/30" />
                  </div>
                  <p className="text-paper/50 mb-4">No family members yet</p>
                  <button 
                    onClick={() => setShowAddModal(true)} 
                    className="btn btn-primary bg-gradient-to-r from-gold to-gold-dim text-void-deep font-semibold hover:shadow-lg hover:shadow-gold/20"
                  >
                    <Plus size={18} />
                    Add Your First Family Member
                  </button>
                </motion.div>
              )}
            </div>

            {/* Action buttons - positioned at bottom to avoid overlap with constellation nodes */}
            <div className="absolute bottom-4 left-4 z-40 flex gap-3">
              <motion.button
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: '', relationship: '', email: '', phone: '', avatarUrl: '' });
                  setAvatarPreview(null);
                  setErrors({});
                  setShowAddModal(true);
                }}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void shadow-lg hover:shadow-gold/30 transition-all"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                title="Add family member"
              >
                <Plus size={24} />
              </motion.button>
              
              <motion.button
                onClick={() => setShowShareModal(true)}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full glass border border-gold/30 flex items-center justify-center text-gold shadow-lg hover:bg-gold/10 hover:border-gold transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                title="Invite family via social media"
              >
                <Share2 size={22} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Member Detail Panel */}
      <AnimatePresence>
        {selectedMember && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-void/50 backdrop-blur-sm z-30"
              onClick={() => navigate('/family')}
            />
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md glass-strong border-l border-white/[0.04] overflow-y-auto z-40"
            >
              <div className="p-8">
                <button
                  onClick={() => navigate('/family')}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="text-center mb-8 pt-4">
                  <motion.div
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-gold-dim flex items-center justify-center text-void text-3xl font-medium mx-auto mb-4"
                    style={{
                      boxShadow: '0 8px 32px rgba(201,169,89,0.3), inset 0 2px 4px rgba(255,255,255,0.3)',
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    {selectedMember.name[0]}
                  </motion.div>
                  <h2 className="text-2xl font-light">{selectedMember.name}</h2>
                  <span className="badge badge-gold mt-2">{selectedMember.relationship}</span>
                </div>

                <div className="space-y-4 mb-8">
                  {selectedMember.email && (
                    <motion.a
                      href={`mailto:${selectedMember.email}`}
                      className="flex items-center gap-4 p-4 glass rounded-xl hover:bg-gold/10 transition-colors group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                        <Mail size={18} className="text-gold" />
                      </div>
                      <div>
                        <div className="text-paper/50 text-xs">Email</div>
                        <div className="text-paper group-hover:text-gold transition-colors">{selectedMember.email}</div>
                      </div>
                    </motion.a>
                  )}

                  {selectedMember.phone && (
                    <motion.a
                      href={`tel:${selectedMember.phone}`}
                      className="flex items-center gap-4 p-4 glass rounded-xl hover:bg-gold/10 transition-colors group"
                      whileHover={{ x: 4 }}
                    >
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                        <Phone size={18} className="text-gold" />
                      </div>
                      <div>
                        <div className="text-paper/50 text-xs">Phone</div>
                        <div className="text-paper group-hover:text-gold transition-colors">{selectedMember.phone}</div>
                      </div>
                    </motion.a>
                  )}

                  {!selectedMember.email && !selectedMember.phone && (
                    <div className="text-center py-8 text-paper/40">
                      <p>No contact information added</p>
                    </div>
                  )}
                </div>

                <div className="divider" />

                <div className="space-y-3">
                  <button
                    onClick={() => openEditModal(selectedMember)}
                    className="btn btn-secondary w-full justify-center"
                  >
                    <Pen size={16} />
                    Edit Details
                  </button>

                  <button
                    onClick={() => handleDelete(selectedMember.id, selectedMember.name)}
                    className="btn btn-ghost w-full justify-center text-blood hover:bg-blood/10"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={16} />
                    {deleteMutation.isPending ? 'Removing...' : 'Remove from Family'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light">
                  {editingId ? 'Edit Family Member' : 'Add Family Member'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                              {/* Avatar Upload */}
                              <div className="flex justify-center mb-4">
                                <div className="relative group">
                                  {avatarPreview || form.avatarUrl ? (
                                    <img 
                                      src={avatarPreview || form.avatarUrl} 
                                      alt="Avatar" 
                                      className="w-24 h-24 rounded-full object-cover border-2 border-gold/30"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-gold-dim/20 flex items-center justify-center text-gold text-3xl font-medium border-2 border-dashed border-gold/30">
                                      {form.name ? form.name[0].toUpperCase() : '?'}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 flex items-center justify-center bg-void/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <Camera size={24} className="text-gold" />
                                  </button>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarFileSelect}
                                    className="hidden"
                                  />
                                </div>
                              </div>
                              <p className="text-center text-paper/40 text-sm -mt-2 mb-4">Click to add photo</p>

                              <div>
                                <label className="block text-sm text-paper/50 mb-2">Name *</label>
                                <input
                                  type="text"
                                  value={form.name}
                                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                                  className={`input ${errors.name ? 'border-blood' : ''}`}
                                  placeholder="Enter name"
                                />
                                {errors.name && <p className="text-blood text-sm mt-1">{errors.name}</p>}
                              </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Relationship *</label>
                  <select
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    className={`input ${errors.relationship ? 'border-blood' : ''}`}
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIPS.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                  {errors.relationship && <p className="text-blood text-sm mt-1">{errors.relationship}</p>}
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`input ${errors.email ? 'border-blood' : ''}`}
                    placeholder="email@example.com"
                  />
                  {errors.email && <p className="text-blood text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm text-paper/50 mb-2">Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                {errors.submit && (
                  <div className="p-3 bg-blood/10 border border-blood/30 rounded-lg text-blood text-sm">
                    {errors.submit}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <div className="spinner w-4 h-4" />
                        {editingId ? 'Saving...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <Heart size={16} />
                        {editingId ? 'Save Changes' : 'Add to Family'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Invite Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light">Invite Family to Heirloom</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-paper/60 text-sm mb-6">
                Share Heirloom with your family so you can preserve memories together. Choose how you'd like to invite them:
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Twitter/X */}
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex items-center gap-3 p-4 glass rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-paper group-hover:text-gold transition-colors">X / Twitter</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex items-center gap-3 p-4 glass rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <span className="text-paper group-hover:text-gold transition-colors">Facebook</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="flex items-center gap-3 p-4 glass rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span className="text-paper group-hover:text-gold transition-colors">WhatsApp</span>
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => handleShare('linkedin')}
                  className="flex items-center gap-3 p-4 glass rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0A66C2]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <span className="text-paper group-hover:text-gold transition-colors">LinkedIn</span>
                </button>

                {/* Instagram */}
                <button
                  onClick={() => handleShare('instagram')}
                  className="flex items-center gap-3 p-4 glass rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F58529]/20 via-[#DD2A7B]/20 to-[#8134AF]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#E4405F]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-paper group-hover:text-gold transition-colors">Instagram</span>
                    <span className="text-paper/40 text-xs">{copiedPlatform === 'instagram' ? 'Copied!' : 'Copy link'}</span>
                  </div>
                </button>

                {/* TikTok */}
                <button
                  onClick={() => handleShare('tiktok')}
                  className="flex items-center gap-3 p-4 glass rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-paper" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-paper group-hover:text-gold transition-colors">TikTok</span>
                    <span className="text-paper/40 text-xs">{copiedPlatform === 'tiktok' ? 'Copied!' : 'Copy link'}</span>
                  </div>
                </button>
              </div>

              {/* Copy Link & Native Share */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleShare('copy')}
                  className="flex-1 btn btn-secondary justify-center"
                >
                  {copiedPlatform === 'copy' ? (
                    <>
                      <Check size={16} className="text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Link
                    </>
                  )}
                </button>
                
                {'share' in navigator && (
                  <button
                    onClick={() => handleShare('native')}
                    className="flex-1 btn btn-primary justify-center"
                  >
                    <Share2 size={16} />
                    Share
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Cropper Modal */}
      <AvatarCropperModal
        isOpen={showAvatarCropper}
        imageSrc={selectedImageSrc}
        onCancel={() => {
          setShowAvatarCropper(false);
          setSelectedImageSrc(null);
        }}
        onComplete={handleAvatarCropComplete}
        isUploading={isUploadingAvatar}
      />
    </div>
  );
}
