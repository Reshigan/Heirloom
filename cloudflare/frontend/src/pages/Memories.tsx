import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Image, Video, Upload, Trash2, Pen, Check, AlertCircle, Filter, Grid, List } from 'lucide-react';
import { memoriesApi, familyApi } from '../services/api';

type Memory = {
  id: string;
  title: string;
  description?: string;
  type: 'PHOTO' | 'VIDEO';
  mediaUrl?: string;
  thumbnailUrl?: string;
  recipients: { familyMember: { id: string; name: string } }[];
  createdAt: string;
};

export function Memories() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'PHOTO' as 'PHOTO' | 'VIDEO',
    file: null as File | null,
    recipientIds: [] as string[],
  });

  const { data: memories, isLoading } = useQuery({
    queryKey: ['memories', filterType],
    queryFn: () => memoriesApi.getAll({ type: filterType === 'all' ? undefined : filterType }).then(r => r.data),
  });

  const { data: family } = useQuery({
    queryKey: ['family'],
    queryFn: () => familyApi.getAll().then(r => r.data),
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!data.file) throw new Error('No file selected');
      
      // Get presigned upload URL
      const { data: uploadData } = await memoriesApi.getUploadUrl({
        filename: data.file.name,
        contentType: data.file.type,
      });
      
      // Upload file to S3
      await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: data.file,
        headers: { 'Content-Type': data.file.type },
      });
      
      setUploadProgress(70);
      
      // Create memory record
      return memoriesApi.create({
        title: data.title,
        description: data.description,
        type: data.type,
        mediaKey: uploadData.key,
        recipientIds: data.recipientIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setShowUploadModal(false);
      setForm({ title: '', description: '', type: 'PHOTO', file: null, recipientIds: [] });
      setUploadProgress(0);
      showToast('success', 'Memory uploaded successfully');
    },
    onError: (error: any) => {
      setUploadProgress(0);
      showToast('error', error.message || 'Failed to upload memory');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setSelectedMemory(null);
      showToast('success', 'Memory deleted');
    },
    onError: () => {
      showToast('error', 'Failed to delete memory');
    },
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      setForm(prev => ({
        ...prev,
        file,
        type: isVideo ? 'VIDEO' : 'PHOTO',
        title: prev.title || file.name.split('.')[0],
      }));
    }
  }, []);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file || !form.title.trim()) return;
    setUploadProgress(10);
    uploadMutation.mutate(form);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleRecipient = (id: string) => {
    setForm(prev => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(id)
        ? prev.recipientIds.filter(r => r !== id)
        : [...prev.recipientIds, id],
    }));
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? <Check size={20} className="text-green-400" /> : <AlertCircle size={20} className="text-red-400" />}
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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-light mb-2">Your <em>Memories</em></h1>
              <p className="text-paper/50">Moments worth preserving forever</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              {/* View toggle */}
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gold/20 text-gold' : 'text-paper/50 hover:text-paper'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gold/20 text-gold' : 'text-paper/50 hover:text-paper'}`}
                >
                  <List size={18} />
                </button>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2 glass rounded-lg px-3 py-2">
                <Filter size={16} className="text-paper/50" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-paper text-sm focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="PHOTO">Photos</option>
                  <option value="VIDEO">Videos</option>
                </select>
              </div>

              {/* Upload button */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary"
              >
                <Plus size={18} />
                Add Memory
              </button>
            </motion.div>
          </div>

          {/* Memory Grid/List */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square skeleton rounded-xl" />
              ))}
            </div>
          ) : memories?.memories?.length > 0 ? (
            <motion.div
              className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
                : 'space-y-4'
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {memories.memories.map((memory: Memory, i: number) => (
                <motion.button
                  key={memory.id}
                  onClick={() => setSelectedMemory(memory)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative group overflow-hidden rounded-xl ${
                    viewMode === 'grid' ? 'aspect-square' : 'flex items-center gap-4 p-4 glass'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* Thumbnail */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-blood/10">
                        {memory.thumbnailUrl ? (
                          <img
                            src={memory.thumbnailUrl}
                            alt={memory.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {memory.type === 'VIDEO' ? (
                              <Video size={40} className="text-paper/30" />
                            ) : (
                              <Image size={40} className="text-paper/30" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Glass overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                        <div className="text-paper font-medium truncate">{memory.title}</div>
                        <div className="text-paper/50 text-sm">{new Date(memory.createdAt).toLocaleDateString()}</div>
                      </div>

                      {/* Type badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`badge ${memory.type === 'VIDEO' ? 'badge-danger' : 'badge-gold'}`}>
                          {memory.type === 'VIDEO' ? <Video size={12} /> : <Image size={12} />}
                        </span>
                      </div>

                      {/* Glass shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-lg glass flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {memory.thumbnailUrl ? (
                          <img src={memory.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : memory.type === 'VIDEO' ? (
                          <Video size={24} className="text-paper/30" />
                        ) : (
                          <Image size={24} className="text-paper/30" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-paper font-medium">{memory.title}</div>
                        {memory.description && (
                          <div className="text-paper/50 text-sm truncate">{memory.description}</div>
                        )}
                        <div className="text-paper/30 text-xs mt-1">{new Date(memory.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge ${memory.type === 'VIDEO' ? 'badge-danger' : 'badge-gold'}`}>
                        {memory.type}
                      </span>
                    </>
                  )}
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 rounded-full glass flex items-center justify-center mx-auto mb-6">
                <Image size={40} className="text-paper/30" />
              </div>
              <h3 className="text-xl font-light mb-2">No memories yet</h3>
              <p className="text-paper/50 mb-6">Start preserving your precious moments</p>
              <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
                <Plus size={18} />
                Upload Your First Memory
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedMemory(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper z-10"
              >
                <X size={20} />
              </button>

              <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-void-light">
                {selectedMemory.mediaUrl ? (
                  selectedMemory.type === 'VIDEO' ? (
                    <video src={selectedMemory.mediaUrl} controls className="w-full h-full object-contain" />
                  ) : (
                    <img src={selectedMemory.mediaUrl} alt={selectedMemory.title} className="w-full h-full object-contain" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {selectedMemory.type === 'VIDEO' ? <Video size={60} className="text-paper/20" /> : <Image size={60} className="text-paper/20" />}
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-light mb-2">{selectedMemory.title}</h2>
              {selectedMemory.description && (
                <p className="text-paper/60 mb-4">{selectedMemory.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-paper/50 mb-6">
                <span className={`badge ${selectedMemory.type === 'VIDEO' ? 'badge-danger' : 'badge-gold'}`}>
                  {selectedMemory.type}
                </span>
                <span>{new Date(selectedMemory.createdAt).toLocaleDateString()}</span>
              </div>

              {selectedMemory.recipients?.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm text-paper/50 mb-2">Shared with:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMemory.recipients.map((r: any) => (
                      <span key={r.familyMember.id} className="badge">{r.familyMember.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1">
                  <Pen size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedMemory.id)}
                  className="btn btn-ghost text-blood hover:bg-blood/10"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={16} />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-light">Add Memory</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-8 h-8 rounded-full glass flex items-center justify-center text-paper/50 hover:text-paper"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-5">
                {/* File upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    form.file ? 'border-gold/50 bg-gold/5' : 'border-white/10 hover:border-gold/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {form.file ? (
                    <div className="flex items-center justify-center gap-3">
                      {form.type === 'VIDEO' ? (
                        <Video size={24} className="text-gold" />
                      ) : (
                        <Image size={24} className="text-gold" />
                      )}
                      <span className="text-paper">{form.file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm(prev => ({ ...prev, file: null }));
                        }}
                        className="text-paper/50 hover:text-blood"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-paper/30 mx-auto mb-3" />
                      <p className="text-paper/50">Click to upload photo or video</p>
                      <p className="text-paper/30 text-sm mt-1">Max 50MB</p>
                    </>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input"
                    placeholder="Give this memory a name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-paper/50 mb-2">Description (optional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input min-h-[100px] resize-none"
                    placeholder="Tell the story behind this moment..."
                  />
                </div>

                {/* Recipients */}
                {family?.length > 0 && (
                  <div>
                    <label className="block text-sm text-paper/50 mb-2">Share with family</label>
                    <div className="flex flex-wrap gap-2">
                      {family.map((member: any) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => toggleRecipient(member.id)}
                          className={`badge cursor-pointer transition-all ${
                            form.recipientIds.includes(member.id)
                              ? 'badge-gold'
                              : 'hover:border-gold/50'
                          }`}
                        >
                          {form.recipientIds.includes(member.id) && <Check size={12} />}
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {uploadProgress > 0 && (
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!form.file || !form.title.trim() || uploadMutation.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="spinner w-4 h-4" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload Memory
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
