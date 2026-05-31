import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressHair } from '../components/ui/ProgressHair';
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
    <div className="min-h-screen bg-void text-paper antialiased">
      <Navigation />

      <main id="main-content" className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-3">QR Memorial Codes</p>
            <h1 className="font-body font-light text-3xl md:text-4xl tracking-[-0.014em]">Create lasting digital memorials accessible via QR code</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <span>Create memorial</span>
            <span aria-hidden>→</span>
          </button>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <ProgressHair label="loading…" width={180} />
          </div>
        ) : memorials && memorials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memorials.map((memorial: any, index: number) => (
              <motion.div
                key={memorial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-void-surface border border-paper-15 hover:border-gold-40 transition-colors p-6 rounded-[2px]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-body text-lg text-paper">{memorial.memorial_name}</h3>
                    {memorial.family_member_name && (
                      <div className="text-sm text-paper-70">{memorial.family_member_name}</div>
                    )}
                  </div>
                  <div className="w-16 h-16 bg-white p-1 rounded-[2px]">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://hlm.blue/m/${memorial.qr_code}`}
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {memorial.memorial_description && (
                  <p className="text-sm text-paper-70 mb-4 line-clamp-2">
                    {memorial.memorial_description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-paper-60 mb-4">
                  {memorial.birth_date && memorial.death_date && (
                    <span>{new Date(memorial.birth_date).getFullYear()} – {new Date(memorial.death_date).getFullYear()}</span>
                  )}
                  {memorial.location && (
                    <span>{memorial.location}</span>
                  )}
                  <span>{memorial.view_count || 0} views</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMemorial(memorial)}
                    className="btn btn-ghost flex-1 text-sm"
                  >
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => downloadQR(memorial)}
                    className="btn btn-ghost text-sm"
                    aria-label={`Download QR code for ${memorial.memorial_name}`}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => shareMemorial(memorial)}
                    className="btn btn-ghost text-sm"
                    aria-label={`Share ${memorial.memorial_name}`}
                  >
                    Share
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-void-surface border border-paper-15 text-center py-16 px-6 rounded-[2px]"
          >
            <span className="font-body text-4xl text-gold block mb-6" aria-hidden>∞</span>
            <h2 className="font-body font-light text-xl mb-2 tracking-[-0.014em]">No memorials yet</h2>
            <p className="text-paper-70 mb-8 max-w-md mx-auto leading-relaxed">
              Create a QR code memorial that can be placed on gravestones, photo frames,
              or any physical location to share memories with visitors.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <span>Create your first memorial</span>
              <span aria-hidden>→</span>
            </button>
          </motion.div>
        )}

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 bg-void-surface border border-paper-15 p-6 rounded-[2px]"
        >
          <p className="font-mono text-[0.7rem] tracking-[0.32em] uppercase text-gold mb-6">How QR memorials work</p>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="font-mono text-sm text-gold mb-3">01</p>
              <h3 className="font-body text-paper mb-2">Create memorial</h3>
              <p className="text-sm text-paper-70">Add details about your loved one</p>
            </div>
            <div>
              <p className="font-mono text-sm text-gold mb-3">02</p>
              <h3 className="font-body text-paper mb-2">Get QR code</h3>
              <p className="text-sm text-paper-70">Download weather-resistant QR</p>
            </div>
            <div>
              <p className="font-mono text-sm text-gold mb-3">03</p>
              <h3 className="font-body text-paper mb-2">Place anywhere</h3>
              <p className="text-sm text-paper-70">Gravestone, frame, or keepsake</p>
            </div>
            <div>
              <p className="font-mono text-sm text-gold mb-3">04</p>
              <h3 className="font-body text-paper mb-2">Share memories</h3>
              <p className="text-sm text-paper-70">Visitors can view and add tributes</p>
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
                className="absolute top-4 right-4 text-paper-60 hover:text-paper transition-colors text-lg"
                aria-label="Close"
              >
                <span aria-hidden>✕</span>
              </button>

              <h3 className="font-body text-xl mb-6">Create memorial</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Memorial name <span className="text-blood" aria-hidden>*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="In loving memory of..."
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="A brief description or biography..."
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors h-24 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Birth date</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Death date</label>
                    <input
                      type="date"
                      value={formData.deathDate}
                      onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                      className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Resting place or hometown"
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Epitaph</label>
                  <textarea
                    value={formData.epitaph}
                    onChange={(e) => setFormData({ ...formData, epitaph: e.target.value })}
                    placeholder="A meaningful quote or message..."
                    className="w-full bg-void-surface border border-paper-15 focus:border-gold focus:outline-none text-paper px-4 py-3 rounded-[2px] placeholder:text-paper-30 transition-colors h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.22em] text-paper-50 mb-2.5">Design style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {designStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setFormData({ ...formData, style: style.id })}
                        className={`p-3 rounded-[2px] text-left border transition-colors ${
                          formData.style === style.id
                            ? 'bg-void-surface border-gold-40'
                            : 'bg-void-surface border-paper-15 hover:border-gold-40'
                        }`}
                      >
                        <div className="text-sm font-medium text-paper">{style.name}</div>
                        <div className="text-xs text-paper-60">{style.description}</div>
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
                    className="w-4 h-4 rounded-[2px] border-paper-15"
                  />
                  <label htmlFor="isPublic" className="text-sm text-paper-70">
                    Allow anyone with the QR code to view this memorial
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createMutation.mutate()}
                    disabled={!formData.name.trim() || createMutation.isPending}
                    className="btn btn-primary flex-1"
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create memorial'}
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
                className="absolute top-4 right-4 text-paper-60 hover:text-paper transition-colors text-lg"
                aria-label="Close"
              >
                <span aria-hidden>✕</span>
              </button>

              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-white p-2 mx-auto mb-4 rounded-[2px]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://hlm.blue/m/${selectedMemorial.qr_code}`}
                    alt="QR Code"
                    className="w-full h-full"
                  />
                </div>
                <h3 className="font-body text-xl text-paper">{selectedMemorial.memorial_name}</h3>
                {selectedMemorial.birth_date && selectedMemorial.death_date && (
                  <div className="text-paper-70 mt-1">
                    {new Date(selectedMemorial.birth_date).getFullYear()} – {new Date(selectedMemorial.death_date).getFullYear()}
                  </div>
                )}
              </div>

              {selectedMemorial.memorial_description && (
                <p className="text-paper-70 text-center mb-4">
                  {selectedMemorial.memorial_description}
                </p>
              )}

              {selectedMemorial.epitaph && (
                <div className="bg-void border border-paper-15 rounded-[2px] p-4 mb-4 text-center italic text-paper font-body">
                  "{selectedMemorial.epitaph}"
                </div>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-sm text-paper-70 mb-6">
                {selectedMemorial.location && (
                  <span>{selectedMemorial.location}</span>
                )}
                <span>{selectedMemorial.view_count || 0} views</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => downloadQR(selectedMemorial)}
                  className="btn btn-ghost flex-1"
                >
                  <span>Download QR</span>
                </button>
                <button
                  onClick={() => shareMemorial(selectedMemorial)}
                  className="btn btn-primary flex-1"
                >
                  <span>Share</span>
                </button>
              </div>

              <div className="mt-4 text-center">
                <a
                  href={`https://hlm.blue/m/${selectedMemorial.qr_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold hover:text-gold-bright transition-colors text-sm"
                >
                  View public memorial page <span aria-hidden>→</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
