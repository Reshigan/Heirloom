'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardDrive, 
  Zap, 
  Image, 
  Video, 
  Mic, 
  FileText,
  Settings,
  TrendingDown,
  TrendingUp,
  Gauge,
  Archive,
  Cloud,
  Download,
  Upload,
  Eye,
  EyeOff,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface StorageItem {
  id: string;
  name: string;
  type: 'photo' | 'video' | 'audio' | 'text';
  originalSize: number;
  compressedSize: number;
  quality: 'original' | 'high' | 'optimized' | 'compressed';
  priority: 'milestone' | 'everyday' | 'archive';
  dateAdded: Date;
  compressionRatio: number;
  isArchiveed: boolean;
}

interface ArchiveionSettings {
  photos: {
    maxResolution: '2MP' | '4MP' | '8MP' | 'original';
    quality: number; // 1-100
    format: 'webp' | 'jpeg' | 'original';
  };
  videos: {
    maxResolution: '720p' | '1080p' | '4K' | 'original';
    codec: 'h265' | 'h264' | 'original';
    bitrate: 'low' | 'medium' | 'high' | 'original';
  };
  audio: {
    bitrate: '128kbps' | '192kbps' | '320kbps' | 'original';
    format: 'mp3' | 'aac' | 'original';
  };
}

const StorageOptimizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'settings' | 'analytics'>('overview');
  const [compressionSettings, setArchiveionSettings] = useState<ArchiveionSettings>({
    photos: {
      maxResolution: '2MP',
      quality: 85,
      format: 'webp'
    },
    videos: {
      maxResolution: '720p',
      codec: 'h265',
      bitrate: 'medium'
    },
    audio: {
      bitrate: '128kbps',
      format: 'mp3'
    }
  });

  const [storageItems] = useState<StorageItem[]>([
    {
      id: '1',
      name: 'Wedding Photos Collection',
      type: 'photo',
      originalSize: 2.4,
      compressedSize: 0.7,
      quality: 'high',
      priority: 'milestone',
      dateAdded: new Date('2024-06-15'),
      compressionRatio: 70.8,
      isArchiveed: true
    },
    {
      id: '2',
      name: 'Birthday Video Message',
      type: 'video',
      originalSize: 1.8,
      compressedSize: 0.4,
      quality: 'optimized',
      priority: 'milestone',
      dateAdded: new Date('2024-07-20'),
      compressionRatio: 77.8,
      isArchiveed: true
    },
    {
      id: '3',
      name: 'Daily Voice Notes',
      type: 'audio',
      originalSize: 0.5,
      compressedSize: 0.1,
      quality: 'compressed',
      priority: 'everyday',
      dateAdded: new Date('2024-08-10'),
      compressionRatio: 80.0,
      isArchiveed: true
    },
    {
      id: '4',
      name: 'Family Stories Collection',
      type: 'text',
      originalSize: 0.02,
      compressedSize: 0.02,
      quality: 'original',
      priority: 'milestone',
      dateAdded: new Date('2024-05-05'),
      compressionRatio: 0,
      isArchiveed: false
    }
  ]);

  const totalOriginalSize = storageItems.reduce((sum, item) => sum + item.originalSize, 0);
  const totalArchiveedSize = storageItems.reduce((sum, item) => sum + item.compressedSize, 0);
  const totalSavings = totalOriginalSize - totalArchiveedSize;
  const savingsPercentage = (totalSavings / totalOriginalSize) * 100;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return Image;
      case 'video': return Video;
      case 'audio': return Mic;
      case 'text': return FileText;
      default: return FileText;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'milestone': return 'text-gold-300 bg-gold-500/20 border-gold-500/40';
      case 'everyday': return 'text-gold-300 bg-gold-500/20 border-gold-500/40';
      case 'archive': return 'text-yellow-300 bg-yellow-500/20 border-yellow-500/40';
      default: return 'text-gold-300 bg-gold-500/20 border-gold-500/40';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'original': return 'text-gold-300';
      case 'high': return 'text-gold-300';
      case 'optimized': return 'text-yellow-300';
      case 'compressed': return 'text-gold-400';
      default: return 'text-gold-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-obsidian-900 text-pearl">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-gold-600 to-gold-500 rounded-xl shadow-lg shadow-gold-500/30 border border-gold-400/30">
              <Archive className="w-7 h-7 text-obsidian-900" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400 bg-clip-text text-transparent">
                Storage Optimizer
              </h1>
              <p className="text-gold-400/80 mt-2 text-lg">
                Optimize your storage with intelligent compression and organization
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 bg-obsidian-800/60 p-2 rounded-xl backdrop-blur-sm border border-gold-500/20">
          {[
            { id: 'overview', label: 'Overview', icon: Gauge },
            { id: 'items', label: 'Items', icon: Archive },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 shadow-lg shadow-gold-500/30 border border-gold-400/50'
                  : 'text-gold-400/70 hover:text-gold-400 hover:bg-obsidian-700/50 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Storage Summary */}
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-obsidian-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/30 shadow-lg shadow-gold-500/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-gold-600/30 to-gold-500/30 rounded-lg border border-gold-500/30">
                      <HardDrive className="w-5 h-5 text-gold-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gold-300">
                      Total Size
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-gold-300 mb-2">
                    {totalOriginalSize.toFixed(2)}GB
                  </div>
                  <p className="text-gold-400/70 text-sm">
                    Unprocessed family memories
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-obsidian-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/30 shadow-lg shadow-gold-500/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-gold-600/30 to-gold-500/30 rounded-lg border border-gold-500/30">
                      <Archive className="w-5 h-5 text-gold-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gold-300">
                      Archived Size
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-gold-300 mb-2">
                    {totalArchiveedSize.toFixed(2)}GB
                  </div>
                  <p className="text-gold-400/70 text-sm">
                    Optimized for eternity
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-obsidian-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/30 shadow-lg shadow-gold-500/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 rounded-lg border border-yellow-500/30">
                      <TrendingDown className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gold-300">
                      Space Saved
                    </h3>
                  </div>
                  <div className="text-3xl font-bold text-yellow-300 mb-2">
                    {savingsPercentage.toFixed(1)}%
                  </div>
                  <p className="text-gold-400/70 text-sm">
                    {totalSavings.toFixed(2)}GB preserved efficiently
                  </p>
                </motion.div>
              </div>

              {/* Preservation Modes */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-obsidian-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gold-500/30 shadow-lg shadow-gold-500/10">
                <h3 className="text-2xl font-semibold text-gold-300 mb-8 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-gold-400" />
                  Storage Modes
                </h3>
                
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-4 bg-gradient-to-br from-gold-600/10 to-gold-500/10 rounded-xl border border-gold-600/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-5 h-5 text-gold-400" />
                      <h4 className="font-semibold text-gold-300">Milestone Moments</h4>
                    </div>
                    <p className="text-gold-400/70 text-sm mb-3">
                      High quality preservation for important memories
                    </p>
                    <div className="text-xs text-gold-400/60">
                      • Original quality vault option
                      • Minimal compression
                      • Priority storage allocation
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-gold-600/20 to-gold-500/20 rounded-xl border border-gold-600/40 shadow-lg shadow-gold-500/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-6 h-6 text-gold-400" />
                      <h4 className="font-semibold text-gold-200 text-lg">Everyday Moments</h4>
                    </div>
                    <p className="text-gold-300/90 text-sm mb-4 leading-relaxed">
                      Intelligent optimization for everyday family moments
                    </p>
                    <div className="text-xs text-gold-400/80 space-y-1">
                      • Smart quality balancing
                      • 70% space efficiency
                      • Rapid access optimization
                      • Family sharing ready
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-yellow-600/20 to-yellow-500/20 rounded-xl border border-yellow-600/40 shadow-lg shadow-yellow-500/10">
                    <div className="flex items-center gap-3 mb-4">
                      <Archive className="w-6 h-6 text-yellow-400" />
                      <h4 className="font-semibold text-yellow-200 text-lg">Archive Storage</h4>
                    </div>
                    <p className="text-yellow-300/90 text-sm mb-4 leading-relaxed">
                      Long-term archival for extensive family collections
                    </p>
                    <div className="text-xs text-yellow-400/80 space-y-1">
                      • Deep archive storage
                      • 90% space optimization
                      • Century-scale preservation
                      • Searchable metadata
                    </div>
                  </div>
                </div>
              </div>

              {/* Legacy Actions */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-obsidian-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-500/30 shadow-lg shadow-gold-500/10">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-gold-400" />
                  Quick Actions
                </h3>
                
                <div className="flex flex-wrap gap-4">
                  <button className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300 font-semibold border border-gold-400/50">
                    <Archive className="w-5 h-5" />
                    Optimize All
                  </button>
                  <button className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300 font-semibold border border-gold-400/50">
                    <Download className="w-5 h-5" />
                    Backup Originals
                  </button>
                  <button className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-obsidian-900 rounded-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 font-semibold border border-yellow-400/50">
                    <Cloud className="w-5 h-5" />
                    Sync to Cloud
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'items' && (
            <motion.div
              key="items"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {storageItems.map((item) => {
                const Icon = getTypeIcon(item.type);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-obsidian-800/80 to-obsidian-900/80 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30 shadow-lg shadow-gold-500/10 hover:border-gold-400/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="p-3 bg-gradient-to-r from-gold-600/30 to-gold-500/30 rounded-lg border border-gold-500/30">
                          <Icon className="w-6 h-6 text-gold-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gold-200 mb-2 text-lg">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs border ${getPriorityColor(item.priority)} font-medium`}>
                              {item.priority}
                            </span>
                            <span className={`font-medium px-3 py-1 rounded-full text-xs bg-gold-500/10 border border-gold-500/20 ${getQualityColor(item.quality)}`}>
                              {item.quality}
                            </span>
                            <span className="text-gold-400/80 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20">
                              {item.dateAdded.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-4 mb-1">
                          <div className="text-sm">
                            <span className="text-red-400">{item.originalSize.toFixed(2)}GB</span>
                            <span className="text-gold-400/60 mx-2">→</span>
                            <span className="text-green-400">{item.compressedSize.toFixed(2)}GB</span>
                          </div>
                          {item.isArchiveed && (
                            <div className="flex items-center gap-1 text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {item.compressionRatio.toFixed(1)}% saved
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-blue-600/20 rounded transition-colors">
                            <Eye className="w-4 h-4 text-blue-400" />
                          </button>
                          <button className="p-1 hover:bg-green-600/20 rounded transition-colors">
                            <Download className="w-4 h-4 text-green-400" />
                          </button>
                          <button className="p-1 hover:bg-purple-600/20 rounded transition-colors">
                            <Settings className="w-4 h-4 text-purple-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Photo Settings */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Photo Archiveion Settings
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gold-300 mb-2">Max Resolution</label>
                    <select
                      value={compressionSettings.photos.maxResolution}
                      onChange={(e) => setArchiveionSettings(prev => ({
                        ...prev,
                        photos: { ...prev.photos, maxResolution: e.target.value as any }
                      }))}
                      className="w-full bg-obsidian-900/50 border border-blue-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="2MP">2MP (Recommended)</option>
                      <option value="4MP">4MP</option>
                      <option value="8MP">8MP</option>
                      <option value="original">Original</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gold-300 mb-2">Quality ({compressionSettings.photos.quality}%)</label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={compressionSettings.photos.quality}
                      onChange={(e) => setArchiveionSettings(prev => ({
                        ...prev,
                        photos: { ...prev.photos, quality: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gold-300 mb-2">Format</label>
                    <select
                      value={compressionSettings.photos.format}
                      onChange={(e) => setArchiveionSettings(prev => ({
                        ...prev,
                        photos: { ...prev.photos, format: e.target.value as any }
                      }))}
                      className="w-full bg-obsidian-900/50 border border-blue-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="webp">WebP (Best compression)</option>
                      <option value="jpeg">JPEG</option>
                      <option value="original">Original</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Video Settings */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Archiveion Settings
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gold-300 mb-2">Max Resolution</label>
                    <select
                      value={compressionSettings.videos.maxResolution}
                      onChange={(e) => setArchiveionSettings(prev => ({
                        ...prev,
                        videos: { ...prev.videos, maxResolution: e.target.value as any }
                      }))}
                      className="w-full bg-obsidian-900/50 border border-blue-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="720p">720p (Recommended)</option>
                      <option value="1080p">1080p</option>
                      <option value="4K">4K</option>
                      <option value="original">Original</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gold-300 mb-2">Codec</label>
                    <select
                      value={compressionSettings.videos.codec}
                      onChange={(e) => setArchiveionSettings(prev => ({
                        ...prev,
                        videos: { ...prev.videos, codec: e.target.value as any }
                      }))}
                      className="w-full bg-obsidian-900/50 border border-blue-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="h265">H.265 (Best compression)</option>
                      <option value="h264">H.264</option>
                      <option value="original">Original</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gold-300 mb-2">Bitrate</label>
                    <select
                      value={compressionSettings.videos.bitrate}
                      onChange={(e) => setArchiveionSettings(prev => ({
                        ...prev,
                        videos: { ...prev.videos, bitrate: e.target.value as any }
                      }))}
                      className="w-full bg-obsidian-900/50 border border-blue-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium (Recommended)</option>
                      <option value="high">High</option>
                      <option value="original">Original</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Audio Settings */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Audio Archiveion Settings
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gold-300 mb-2">Bitrate</label>
                    <select
                      value={compressionSettings.audio.bitrate}
                      onChange={(e) => setArchiveionSettings(prev => ({
                        ...prev,
                        audio: { ...prev.audio, bitrate: e.target.value as any }
                      }))}
                      className="w-full bg-obsidian-900/50 border border-blue-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="128kbps">128kbps (Recommended)</option>
                      <option value="192kbps">192kbps</option>
                      <option value="320kbps">320kbps</option>
                      <option value="original">Original</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gold-300 mb-2">Format</label>
                    <select
                      value={compressionSettings.audio.format}
                      onChange={(e) => setArchiveionSettings(prev => ({
                        ...prev,
                        audio: { ...prev.audio, format: e.target.value as any }
                      }))}
                      className="w-full bg-obsidian-900/50 border border-blue-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-blue-500"
                    >
                      <option value="mp3">MP3 (Best compatibility)</option>
                      <option value="aac">AAC</option>
                      <option value="original">Original</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Settings */}
              <div className="flex justify-end">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-gold-100 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                  Save Settings
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Archiveion Analytics */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6">
                  Archiveion Analytics
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-300 mb-1">
                      {savingsPercentage.toFixed(1)}%
                    </div>
                    <div className="text-green-400/60 text-sm">Average Savings</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-300 mb-1">
                      {storageItems.filter(item => item.isArchiveed).length}
                    </div>
                    <div className="text-blue-400/60 text-sm">Items Archiveed</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-300 mb-1">
                      {totalSavings.toFixed(2)}GB
                    </div>
                    <div className="text-purple-400/60 text-sm">Total Saved</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-gold-300 mb-1">
                      ${(totalSavings * 2.5).toFixed(0)}
                    </div>
                    <div className="text-gold-400/60 text-sm">Cost Savings</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StorageOptimizer;