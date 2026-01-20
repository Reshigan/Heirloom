import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Facebook, Instagram, Image, Check, Loader2, Link2, Unlink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigation } from '../components/Navigation';
import api from '../services/api';

// Social Import API
const socialImportApi = {
  getProviders: () => api.get<{ providers: Provider[] }>('/import/providers'),
  connectProvider: (provider: string) => api.get<{ authUrl: string }>(`/import/connect/${provider}`),
  disconnectProvider: (provider: string) => api.delete(`/import/disconnect/${provider}`),
  getMedia: (provider: string, cursor?: string) => 
    api.get<{ media: MediaItem[]; nextCursor?: string }>(`/import/media/${provider}`, { params: cursor ? { cursor } : {} }),
  importMedia: (provider: string, mediaIds: string[]) => 
    api.post<{ imported: number; failed: number }>('/import/import', { provider, mediaIds }),
};

interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
}

interface MediaItem {
  id: string;
  thumbnail: string;
  url: string;
  caption?: string;
  createdAt: string;
  type: string;
}

export function Import() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [importStatus, setImportStatus] = useState<{ importing: boolean; result?: { imported: number; failed: number } }>({ importing: false });

  // Fetch available providers
  const { data: providersData, isLoading: loadingProviders } = useQuery({
    queryKey: ['import-providers'],
    queryFn: () => socialImportApi.getProviders().then(r => r.data),
  });

  // Fetch media from selected provider
  const { data: mediaData, isLoading: loadingMedia, refetch: refetchMedia } = useQuery({
    queryKey: ['import-media', selectedProvider],
    queryFn: () => selectedProvider ? socialImportApi.getMedia(selectedProvider).then(r => r.data) : null,
    enabled: !!selectedProvider,
  });

  // Connect provider mutation
  const connectMutation = useMutation({
    mutationFn: (provider: string) => socialImportApi.connectProvider(provider),
    onSuccess: (res: { data: { authUrl: string } }) => {
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      }
    },
  });

  // Disconnect provider mutation
  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => socialImportApi.disconnectProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-providers'] });
      setSelectedProvider(null);
    },
  });

  // Import media mutation
  const importMutation = useMutation({
    mutationFn: ({ provider, mediaIds }: { provider: string; mediaIds: string[] }) => 
      socialImportApi.importMedia(provider, mediaIds),
    onSuccess: (res: { data: { imported: number; failed: number } }) => {
      setImportStatus({ importing: false, result: res.data });
      setSelectedMedia(new Set());
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
    onError: () => {
      setImportStatus({ importing: false });
    },
  });

  const handleImport = () => {
    if (!selectedProvider || selectedMedia.size === 0) return;
    setImportStatus({ importing: true });
    importMutation.mutate({ provider: selectedProvider, mediaIds: Array.from(selectedMedia) });
  };

  const toggleMediaSelection = (id: string) => {
    const newSelection = new Set(selectedMedia);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedMedia(newSelection);
  };

  const selectAll = () => {
    if (mediaData?.media) {
      setSelectedMedia(new Set(mediaData.media.map((m: MediaItem) => m.id)));
    }
  };

  const deselectAll = () => {
    setSelectedMedia(new Set());
  };

  const getProviderIcon = (icon: string) => {
    switch (icon) {
      case 'facebook':
        return <Facebook className="w-8 h-8 text-blue-500" />;
      case 'instagram':
        return <Instagram className="w-8 h-8 text-pink-500" />;
      case 'google':
        return <Image className="w-8 h-8 text-green-500" />;
      default:
        return <Image className="w-8 h-8 text-gold" />;
    }
  };

  const providers: Provider[] = providersData?.providers || [];

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

      <div className="relative z-10 px-6 md:px-12 py-12">
        <button 
          onClick={() => navigate('/memories')} 
          className="flex items-center gap-2 text-paper/40 hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Memories
        </button>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-light mb-4">Import from Social Media</h1>
          <p className="text-paper/60 mb-8">
            Connect your social media accounts to import photos and memories into Heirloom.
          </p>

          {/* Provider Selection */}
          {!selectedProvider && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {loadingProviders ? (
                <div className="col-span-3 flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gold" />
                </div>
              ) : providers.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <Image className="w-16 h-16 mx-auto mb-4 text-paper/30" />
                  <h3 className="text-xl mb-2">No Providers Available</h3>
                  <p className="text-paper/60">
                    Social media import is not configured. Please contact support to enable this feature.
                  </p>
                </div>
              ) : (
                providers.map((provider) => (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card hover:border-gold/30 transition-all cursor-pointer"
                    onClick={() => provider.connected && setSelectedProvider(provider.id)}
                  >
                    <div className="flex items-start gap-4">
                      {getProviderIcon(provider.icon)}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium mb-1">{provider.name}</h3>
                        <p className="text-sm text-paper/60 mb-4">{provider.description}</p>
                        
                        {provider.connected ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-green-400 text-sm">
                              <Check size={16} />
                              Connected
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                disconnectMutation.mutate(provider.id);
                              }}
                              className="text-sm text-paper/40 hover:text-red-400 flex items-center gap-1"
                            >
                              <Unlink size={14} />
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              connectMutation.mutate(provider.id);
                            }}
                            className="btn-secondary text-sm flex items-center gap-2"
                            disabled={connectMutation.isPending}
                          >
                            {connectMutation.isPending ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Link2 size={14} />
                            )}
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Media Selection */}
          {selectedProvider && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="flex items-center gap-2 text-paper/60 hover:text-gold"
                >
                  <ArrowLeft size={18} />
                  Back to providers
                </button>
                
                <div className="flex items-center gap-4">
                  <span className="text-paper/60">
                    {selectedMedia.size} selected
                  </span>
                  <button onClick={selectAll} className="text-sm text-gold hover:text-gold-dim">
                    Select All
                  </button>
                  <button onClick={deselectAll} className="text-sm text-paper/40 hover:text-paper">
                    Deselect All
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selectedMedia.size === 0 || importStatus.importing}
                    className="btn-primary flex items-center gap-2"
                  >
                    {importStatus.importing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>Import {selectedMedia.size} items</>
                    )}
                  </button>
                </div>
              </div>

              {/* Import Result */}
              {importStatus.result && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30"
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <Check size={20} />
                    <span>
                      Successfully imported {importStatus.result.imported} items
                      {importStatus.result.failed > 0 && ` (${importStatus.result.failed} failed)`}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Media Grid */}
              {loadingMedia ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gold" />
                </div>
              ) : mediaData?.media?.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 mx-auto mb-4 text-paper/30" />
                  <h3 className="text-xl mb-2">No Media Found</h3>
                  <p className="text-paper/60">
                    No photos or videos found in your connected account.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {mediaData?.media?.map((item: MediaItem) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${
                        selectedMedia.has(item.id) ? 'ring-2 ring-gold' : ''
                      }`}
                      onClick={() => toggleMediaSelection(item.id)}
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.caption || 'Media'}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 transition-all ${
                        selectedMedia.has(item.id) 
                          ? 'bg-gold/20' 
                          : 'bg-void/0 group-hover:bg-void/40'
                      }`} />
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedMedia.has(item.id)
                          ? 'bg-gold border-gold'
                          : 'border-white/50 group-hover:border-white'
                      }`}>
                        {selectedMedia.has(item.id) && <Check size={14} className="text-void" />}
                      </div>
                      {item.type === 'video' && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-void/80 rounded text-xs">
                          Video
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load More */}
              {mediaData?.nextCursor && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => refetchMedia()}
                    className="btn-secondary"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Import;
