import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Pen, Trash2, Mail, Phone, Heart, Users, Check, AlertCircle, Camera } from 'lucide-react';
import { familyApi, settingsApi } from '../services/api';
import { AvatarCropperModal } from '../components/AvatarCropperModal';
import { Navigation } from '../components/Navigation';

const RELATIONSHIPS = ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Grandchild', 'Grandparent', 'Friend', 'Other'];

export function Family() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', relationship: '', email: '', phone: '', avatarUrl: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
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
                  const angle = (i / Math.max(1, family.length)) * 2 * Math.PI - Math.PI / 2;
                  const radius = 200;
                  const x = 50 + (Math.cos(angle) * radius) / 6;
                  const y = 50 + (Math.sin(angle) * radius) / 3;
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
                const angle = (i / Math.max(1, family.length)) * 2 * Math.PI - Math.PI / 2;
                const radius = 200;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <motion.div
                    key={member.id}
                    className="absolute"
                    style={{ x, y }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      y: [y - 5, y + 5, y - 5],
                    }}
                    transition={{
                      scale: { delay: 0.3 + i * 0.1 },
                      y: { duration: 4 + i, repeat: Infinity },
                    }}
                  >
                    <motion.button
                      onClick={() => navigate(`/family/${member.id}`)}
                      className={`relative group ${id === member.id ? 'z-30' : ''}`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div 
                        className={`w-20 h-20 rounded-full glass flex items-center justify-center border-2 transition-all ${
                          id === member.id ? 'border-gold bg-gold/20' : 'border-gold/30 group-hover:border-gold'
                        }`}
                        style={{
                          boxShadow: id === member.id 
                            ? '0 0 30px rgba(201,169,89,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.1)',
                        }}
                      >
                        <span className="text-2xl text-gold">{member.name[0]}</span>
                      </div>
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                        <div className="text-paper text-sm font-medium">{member.name}</div>
                        <div className="text-paper/40 text-xs">{member.relationship}</div>
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
                    className="btn btn-primary"
                  >
                    <Plus size={18} />
                    Add Your First Family Member
                  </button>
                </motion.div>
              )}
            </div>

            {/* Add button - positioned at bottom-right of outer container (sibling of flex) */}
            <motion.button
              onClick={() => {
                setEditingId(null);
                setForm({ name: '', relationship: '', email: '', phone: '', avatarUrl: '' });
                setAvatarPreview(null);
                setErrors({});
                setShowAddModal(true);
              }}
              className="absolute bottom-6 right-6 z-30 w-14 h-14 rounded-full glass border border-dashed border-gold/30 flex items-center justify-center text-gold/50 hover:text-gold hover:border-gold hover:bg-gold/10 transition-all"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Plus size={24} />
            </motion.button>
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
