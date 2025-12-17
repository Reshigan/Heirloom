import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Image, Video, Upload, Trash2, Pen, Check, AlertCircle, Filter, Grid, List, Calendar, ChevronLeft, ChevronRight, Heart, Sparkles, Cloud, Gift, Droplet, Eye, Trophy, Leaf, Sun } from 'lucide-react';
import { memoriesApi, familyApi } from '../services/api';

type EmotionType = 'joyful' | 'nostalgic' | 'grateful' | 'loving' | 'bittersweet' | 'sad' | 'reflective' | 'proud' | 'peaceful' | 'hopeful';

const EMOTIONS: { value: EmotionType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'joyful', label: 'Joyful', icon: Sparkles, color: 'text-yellow-400 bg-yellow-400/20' },
  { value: 'nostalgic', label: 'Nostalgic', icon: Cloud, color: 'text-amber-400 bg-amber-400/20' },
  { value: 'grateful', label: 'Grateful', icon: Gift, color: 'text-emerald-400 bg-emerald-400/20' },
  { value: 'loving', label: 'Loving', icon: Heart, color: 'text-rose-400 bg-rose-400/20' },
  { value: 'bittersweet', label: 'Bittersweet', icon: Droplet, color: 'text-purple-400 bg-purple-400/20' },
  { value: 'reflective', label: 'Reflective', icon: Eye, color: 'text-indigo-400 bg-indigo-400/20' },
  { value: 'proud', label: 'Proud', icon: Trophy, color: 'text-orange-400 bg-orange-400/20' },
  { value: 'peaceful', label: 'Peaceful', icon: Leaf, color: 'text-teal-400 bg-teal-400/20' },
  { value: 'hopeful', label: 'Hopeful', icon: Sun, color: 'text-sky-400 bg-sky-400/20' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Memory = {
  id: string;
  title: string;
  description?: string;
  type: 'PHOTO' | 'VIDEO';
  fileUrl?: string;
  emotion?: EmotionType;
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
  
  // Timeline filter state
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  
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
      
      // Upload file to R2 - include credentials for auth
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: data.file,
        headers: { 'Content-Type': data.file.type },
        credentials: 'include',
      });
      
      // Check if upload was successful
      if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to upload memory file');
      }
      
      // Get the file URL from the upload response
      const uploadResult = await uploadResponse.json();
      const fileUrl = uploadResult.fileUrl || `${import.meta.env.VITE_API_URL}/memories/file/${encodeURIComponent(uploadData.key)}`;
      
      setUploadProgress(70);
      
      // Create memory record with correct field names (fileKey, fileUrl instead of mediaKey)
      // Include fileSize and mimeType so storage stats update correctly
      return memoriesApi.create({
        title: data.title,
        description: data.description,
        type: data.type,
        fileKey: uploadData.key,
        fileUrl: fileUrl,
        fileSize: data.file.size,
        mimeType: data.file.type,
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

    // Get the memories array from the API response (handles both { data: [...] } and direct array)
    const memoriesList = useMemo(() => {
      if (!memories) return [];
      // API returns { data: [...], pagination: {...} }
      if (Array.isArray(memories)) return memories;
      if (memories.data && Array.isArray(memories.data)) return memories.data;
      if (memories.memories && Array.isArray(memories.memories)) return memories.memories;
      return [];
    }, [memories]);

    // Get available years from memories
    const availableYears = useMemo(() => {
      if (!memoriesList.length) return [new Date().getFullYear()];
      const years = new Set<number>();
      memoriesList.forEach((m: Memory) => {
        years.add(new Date(m.createdAt).getFullYear());
      });
      const yearArray = Array.from(years).sort((a, b) => b - a);
      return yearArray.length > 0 ? yearArray : [new Date().getFullYear()];
    }, [memoriesList]);

    // Filter memories by timeline and emotion
    const filteredMemories = useMemo(() => {
      if (!memoriesList.length) return [];
      return memoriesList.filter((m: Memory) => {
        const date = new Date(m.createdAt);
        const matchesYear = date.getFullYear() === selectedYear;
        const matchesMonth = selectedMonth === null || date.getMonth() === selectedMonth;
        const matchesEmotion = selectedEmotion === null || m.emotion === selectedEmotion;
        return matchesYear && matchesMonth && matchesEmotion;
      });
    }, [memoriesList, selectedYear, selectedMonth, selectedEmotion]);

    // Get emotion counts for current filter
    const emotionCounts = useMemo(() => {
      if (!memoriesList.length) return {};
      const counts: Record<string, number> = {};
      memoriesList.forEach((m: Memory) => {
        const date = new Date(m.createdAt);
        if (date.getFullYear() === selectedYear && (selectedMonth === null || date.getMonth() === selectedMonth)) {
          if (m.emotion) {
            counts[m.emotion] = (counts[m.emotion] || 0) + 1;
          }
        }
      });
      return counts;
    }, [memoriesList, selectedYear, selectedMonth]);

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

          {/* Timeline Slider */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            {/* Year Selector */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => {
                  const idx = availableYears.indexOf(selectedYear);
                  if (idx < availableYears.length - 1) {
                    setSelectedYear(availableYears[idx + 1]);
                    setSelectedMonth(null);
                  }
                }}
                disabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                className="p-2 glass rounded-full text-paper/50 hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gold" />
                <span className="text-2xl font-light text-gold">{selectedYear}</span>
              </div>
              <button
                onClick={() => {
                  const idx = availableYears.indexOf(selectedYear);
                  if (idx > 0) {
                    setSelectedYear(availableYears[idx - 1]);
                    setSelectedMonth(null);
                  }
                }}
                disabled={availableYears.indexOf(selectedYear) === 0}
                className="p-2 glass rounded-full text-paper/50 hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Month Slider */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
              <button
                onClick={() => setSelectedMonth(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedMonth === null
                    ? 'bg-gold text-void font-medium'
                    : 'glass text-paper/60 hover:text-paper hover:bg-white/10'
                }`}
              >
                All
              </button>
              {MONTHS.map((month, idx) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(selectedMonth === idx ? null : idx)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedMonth === idx
                      ? 'bg-gold text-void font-medium'
                      : 'glass text-paper/60 hover:text-paper hover:bg-white/10'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>

            {/* Emotion Filter */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-paper/40 text-sm mr-2">Filter by emotion:</span>
              <button
                onClick={() => setSelectedEmotion(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedEmotion === null
                    ? 'bg-white/20 text-paper font-medium'
                    : 'glass text-paper/50 hover:text-paper'
                }`}
              >
                All
              </button>
              {EMOTIONS.map((emotion) => {
                const Icon = emotion.icon;
                const count = emotionCounts[emotion.value] || 0;
                return (
                  <button
                    key={emotion.value}
                    onClick={() => setSelectedEmotion(selectedEmotion === emotion.value ? null : emotion.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 ${
                      selectedEmotion === emotion.value
                        ? emotion.color + ' font-medium'
                        : 'glass text-paper/50 hover:text-paper'
                    }`}
                  >
                    <Icon size={14} />
                    {emotion.label}
                    {count > 0 && <span className="text-xs opacity-60">({count})</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Memory Grid/List */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square skeleton rounded-xl" />
              ))}
            </div>
          ) : filteredMemories.length > 0 ? (
            <motion.div
              className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' 
                : 'space-y-4'
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {filteredMemories.map((memory: Memory, i: number) => (
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
                        {memory.fileUrl ? (
                          <img
                            src={memory.fileUrl}
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
                        {memory.fileUrl ? (
                          <img src={memory.fileUrl} alt="" className="w-full h-full object-cover" />
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
              {memories?.memories?.length > 0 ? (
                <>
                  <h3 className="text-xl font-light mb-2">No memories match your filters</h3>
                  <p className="text-paper/50 mb-6">Try adjusting the year, month, or emotion filter</p>
                  <button 
                    onClick={() => {
                      setSelectedMonth(null);
                      setSelectedEmotion(null);
                    }} 
                    className="btn btn-secondary"
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-light mb-2">No memories yet</h3>
                  <p className="text-paper/50 mb-6">Start preserving your precious moments</p>
                  <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
                    <Plus size={18} />
                    Upload Your First Memory
                  </button>
                </>
              )}
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
                {selectedMemory.fileUrl ? (
                  selectedMemory.type === 'VIDEO' ? (
                    <video src={selectedMemory.fileUrl} controls className="w-full h-full object-contain" />
                  ) : (
                    <img src={selectedMemory.fileUrl} alt={selectedMemory.title} className="w-full h-full object-contain" />
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
