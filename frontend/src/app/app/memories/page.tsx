'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useVault } from '@/contexts/VaultContext';
import VaultUploadModal from '@/components/vault-upload-modal';

interface Memory {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export default function MemoriesPage() {
  const { vaultEncryption } = useVault();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  useEffect(() => {
    filterMemories();
  }, [memories, searchQuery, filterType]);

  const fetchMemories = async () => {
    try {
      const data = await apiClient.getMemories();
      setMemories(data);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMemories = () => {
    let filtered = memories;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.type.toLowerCase() === filterType.toLowerCase());
    }

    setFilteredMemories(filtered);
  };

  const handleUploadSuccess = async () => {
    await fetchMemories();
    setShowUploadModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-ring"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="font-display text-3xl text-cream-100">Memories</h1>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
            Add Memory
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {/* Search Box */}
          <div className="flex-1 min-w-[250px] relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black-200"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black-700 border border-black-500 rounded-md text-cream-300 text-base focus:outline-none focus:border-gold-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                filterType === 'all'
                  ? 'bg-gold-500/15 border-gold-500 text-gold-500'
                  : 'bg-black-700 border-black-500 text-black-100 hover:border-black-400 hover:text-cream-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('photo')}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                filterType === 'photo'
                  ? 'bg-gold-500/15 border-gold-500 text-gold-500'
                  : 'bg-black-700 border-black-500 text-black-100 hover:border-black-400 hover:text-cream-300'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                filterType === 'video'
                  ? 'bg-gold-500/15 border-gold-500 text-gold-500'
                  : 'bg-black-700 border-black-500 text-black-100 hover:border-black-400 hover:text-cream-300'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setFilterType('document')}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                filterType === 'document'
                  ? 'bg-gold-500/15 border-gold-500 text-gold-500'
                  : 'bg-black-700 border-black-500 text-black-100 hover:border-black-400 hover:text-cream-300'
              }`}
            >
              Documents
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onClick={() => setShowUploadModal(true)}
          className="border-2 border-dashed border-black-400 rounded-xl p-12 text-center bg-gold-500/[0.03] transition-all hover:border-gold-500 hover:bg-gold-500/[0.08] cursor-pointer mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gold-500/10 border border-gold-600 rounded-full text-4xl">
            📸
          </div>
          <div className="font-display text-xl text-cream-100 mb-2">Drop files to upload</div>
          <div className="text-base text-black-100 mb-4">or click to browse</div>
          <div className="text-sm text-black-200">Supports: JPG, PNG, MP4, PDF, DOCX</div>
        </div>

        {/* Memories Grid */}
        {filteredMemories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMemories.map((memory) => (
              <div
                key={memory.id}
                className="bg-black-700 border border-black-500 rounded-lg overflow-hidden transition-all hover:border-gold-500 hover:-translate-y-0.5 hover:shadow-gold-sm cursor-pointer"
              >
                {memory.thumbnailUrl ? (
                  <img
                    src={memory.thumbnailUrl}
                    alt={memory.title}
                    className="w-full h-[200px] object-cover bg-black-600"
                  />
                ) : (
                  <div className="w-full h-[200px] flex items-center justify-center bg-gradient-to-br from-black-600 to-black-700 text-6xl">
                    {memory.type === 'photo' ? '📸' : memory.type === 'video' ? '🎥' : '📄'}
                  </div>
                )}
                <div className="p-4">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium uppercase tracking-wide rounded-sm mb-2 ${
                      memory.type === 'photo'
                        ? 'bg-gold-500/15 text-gold-500'
                        : memory.type === 'video'
                        ? 'bg-info-500/15 text-info-400'
                        : 'bg-success-500/15 text-success-400'
                    }`}
                  >
                    {memory.type}
                  </div>
                  <div className="text-base font-semibold text-cream-100 mb-2 line-clamp-2">
                    {memory.title}
                  </div>
                  <div className="flex justify-between items-center text-sm text-black-100">
                    <span>{new Date(memory.date).toLocaleDateString()}</span>
                    {memory.tags && memory.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        <span>{memory.tags.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="font-display text-2xl text-cream-100 mb-2">No memories yet</h3>
            <p className="text-black-100 mb-6">Start preserving your precious moments</p>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
              Add Your First Memory
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && vaultEncryption && (
        <VaultUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          vaultEncryption={vaultEncryption}
        />
      )}
    </div>
  );
}
