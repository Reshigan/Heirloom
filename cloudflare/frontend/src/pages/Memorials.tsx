import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Plus, X, Download, Share2, Calendar, Grid } from '../components/Icons';
import { Navigation } from '../components/Navigation';
import { memorialsApi } from '../services/api';

const designStyles = [
  { id: 'classic', name: 'Classic', description: 'Timeless and elegant' },
  { id: 'elegant', name: 'Elegant', description: 'Refined and sophisticated' },
  { id: 'modern', name: 'Modern', description: 'Clean and minimal' },
  { id: 'floral', name: 'Floral', description: 'Soft and natural' },
  { id: 'religious', name: 'Religious', description: 'Faith-inspired' },
];

export function Memorials() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMemorial, setSelectedMemorial] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    style: 'classic',
    isPublic: true,
    birthDate: '',
    deathDate: '',
    location: '',
    epitaph: '',
  });

  const { data: memorials, isLoading } = useQuery({
    queryKey: ['memorials'],
    queryFn: () => memorialsApi.getAll().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => memorialsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorials'] });
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        style: 'classic',
        isPublic: true,
        birthDate: '',
        deathDate: '',
        location: '',
        epitaph: '',
      });
    },
  });

  const downloadQR = (memorial: any) => {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://hlm.blue/m/${memorial.qr_code}`;
    link.download = `memorial-${memorial.memorial_name}-qr.png`;
    link.click();
  };

  const shareMemorial = (memorial: any) => {
    const url = `https://hlm.blue/m/${memorial.qr_code}`;
    if (navigator.share) {
      navigator.share({
        title: `${memorial.memorial_name}'s Memorial`,
        text: `Visit the memorial page for ${memorial.memorial_name}`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-void">
      <Navigation />
      
      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-light mb-2">QR Memorial Codes</h1>
            <p className="text-paper/60">Create lasting digital memorials accessible via QR code</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            <span>Create Memorial</span>
          </button>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : memorials && memorials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memorials.map((memorial: any, index: number) => (
              <motion.div
                key={memorial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card hover:border-gold/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{memorial.memorial_name}</h3>
                    {memorial.family_member_name && (
                      <div className="text-sm text-paper/60">{memorial.family_member_name}</div>
                    )}
                  </div>
                  <div className="w-16 h-16 bg-white rounded-lg p-1">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://hlm.blue/m/${memorial.qr_code}`}
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {memorial.memorial_description && (
                  <p className="text-sm text-paper/70 mb-4 line-clamp-2">
                    {memorial.memorial_description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-paper/50 mb-4">
                  {memorial.birth_date && memorial.death_date && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(memorial.birth_date).getFullYear()} - {new Date(memorial.death_date).getFullYear()}</span>
                    </div>
                  )}
                  {memorial.location && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{memorial.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    <span>{memorial.view_count || 0} views</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMemorial(memorial)}
                    className="btn btn-secondary flex-1 text-sm"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => downloadQR(memorial)}
                    className="btn btn-ghost p-2"
                    title="Download QR"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => shareMemorial(memorial)}
                    className="btn btn-ghost p-2"
                    title="Share"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-paper/5 flex items-center justify-center mx-auto mb-4">
              <Grid size={40} className="text-paper/30" />
            </div>
            <h2 className="text-xl font-light mb-2">No Memorials Yet</h2>
            <p className="text-paper/60 mb-6 max-w-md mx-auto">
              Create a QR code memorial that can be placed on gravestones, photo frames, 
              or any physical location to share memories with visitors.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus size={18} />
              <span>Create Your First Memorial</span>
            </button>
          </motion.div>
        )}

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 card"
        >
          <h2 className="text-xl font-light mb-6">How QR Memorials Work</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-gold font-medium">1</span>
              </div>
              <h3 className="font-medium mb-2">Create Memorial</h3>
              <p className="text-sm text-paper/60">Add details about your loved one</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-gold font-medium">2</span>
              </div>
              <h3 className="font-medium mb-2">Get QR Code</h3>
              <p className="text-sm text-paper/60">Download weather-resistant QR</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-gold font-medium">3</span>
              </div>
              <h3 className="font-medium mb-2">Place Anywhere</h3>
              <p className="text-sm text-paper/60">Gravestone, frame, or keepsake</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-gold font-medium">4</span>
              </div>
              <h3 className="font-medium mb-2">Share Memories</h3>
              <p className="text-sm text-paper/60">Visitors can view and add tributes</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-paper/50 hover:text-paper"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-medium mb-6">Create Memorial</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-paper/70 mb-2">Memorial Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="In loving memory of..."
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="A brief description or biography..."
                    className="input w-full h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-paper/70 mb-2">Birth Date</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-paper/70 mb-2">Death Date</label>
                    <input
                      type="date"
                      value={formData.deathDate}
                      onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Resting place or hometown"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Epitaph</label>
                  <textarea
                    value={formData.epitaph}
                    onChange={(e) => setFormData({ ...formData, epitaph: e.target.value })}
                    placeholder="A meaningful quote or message..."
                    className="input w-full h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-paper/70 mb-2">Design Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {designStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setFormData({ ...formData, style: style.id })}
                        className={`p-3 rounded-lg text-left transition-all ${
                          formData.style === style.id
                            ? 'bg-gold/20 border border-gold'
                            : 'bg-paper/5 border border-transparent hover:border-paper/20'
                        }`}
                      >
                        <div className="text-sm font-medium">{style.name}</div>
                        <div className="text-xs text-paper/50">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded border-paper/30"
                  />
                  <label htmlFor="isPublic" className="text-sm text-paper/70">
                    Allow anyone with the QR code to view this memorial
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={!formData.name.trim() || createMutation.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Memorial'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Memorial Modal */}
      <AnimatePresence>
        {selectedMemorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={() => setSelectedMemorial(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedMemorial(null)}
                className="absolute top-4 right-4 text-paper/50 hover:text-paper"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-white rounded-xl p-2 mx-auto mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://hlm.blue/m/${selectedMemorial.qr_code}`}
                    alt="QR Code"
                    className="w-full h-full"
                  />
                </div>
                <h3 className="text-xl font-medium">{selectedMemorial.memorial_name}</h3>
                {selectedMemorial.birth_date && selectedMemorial.death_date && (
                  <div className="text-paper/60 mt-1">
                    {new Date(selectedMemorial.birth_date).getFullYear()} - {new Date(selectedMemorial.death_date).getFullYear()}
                  </div>
                )}
              </div>

              {selectedMemorial.memorial_description && (
                <p className="text-paper/70 text-center mb-4">
                  {selectedMemorial.memorial_description}
                </p>
              )}

              {selectedMemorial.epitaph && (
                <div className="bg-paper/5 rounded-lg p-4 mb-4 text-center italic text-paper/80">
                  "{selectedMemorial.epitaph}"
                </div>
              )}

              <div className="flex flex-wrap gap-4 justify-center text-sm text-paper/60 mb-6">
                {selectedMemorial.location && (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>{selectedMemorial.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  <span>{selectedMemorial.view_count || 0} views</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => downloadQR(selectedMemorial)}
                  className="btn btn-secondary flex-1"
                >
                  <Download size={16} />
                  <span>Download QR</span>
                </button>
                <button
                  onClick={() => shareMemorial(selectedMemorial)}
                  className="btn btn-primary flex-1"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>

              <div className="mt-4 text-center">
                <a
                  href={`https://hlm.blue/m/${selectedMemorial.qr_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline text-sm"
                >
                  View Public Memorial Page
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
