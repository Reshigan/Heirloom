'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Share2,
  Users,
  Clock,
  Lock,
  Unlock,
  QrCode,
  Download,
  Mail
} from 'lucide-react';

interface LegacyToken {
  id: string;
  token: string;
  profileId: string;
  profileName: string;
  createdAt: Date;
  lastRegenerated?: Date;
  isActive: boolean;
  accessCount: number;
  expiresAt?: Date;
}

interface TokenAccess {
  id: string;
  tokenId: string;
  accessedBy: string;
  accessedAt: Date;
  ipAddress: string;
  location: string;
}

const LegacyTokenManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'access' | 'share'>('tokens');
  const [showRegenerateModal, setShowRegenerateModal] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Mock data - in real app, this would come from API
  const [tokens] = useState<LegacyToken[]>([
    {
      id: '1',
      token: 'HLM_LEG_8f4a2b1c9d3e5f7g8h9i0j1k2l3m4n5o',
      profileId: 'prof_1',
      profileName: 'Eleanor Whitmore',
      createdAt: new Date('2024-01-15'),
      lastRegenerated: new Date('2024-08-20'),
      isActive: true,
      accessCount: 0,
      expiresAt: undefined
    },
    {
      id: '2',
      token: 'HLM_LEG_9g5b3c2d0e4f6g7h8i9j0k1l2m3n4o5p',
      profileId: 'prof_2',
      profileName: 'James Whitmore',
      createdAt: new Date('2024-02-10'),
      isActive: true,
      accessCount: 2,
      expiresAt: undefined
    }
  ]);

  const [accessHistory] = useState<TokenAccess[]>([
    {
      id: '1',
      tokenId: '2',
      accessedBy: 'Sarah Mitchell',
      accessedAt: new Date('2024-09-15'),
      ipAddress: '192.168.1.100',
      location: 'New York, NY'
    },
    {
      id: '2',
      tokenId: '2',
      accessedBy: 'Michael Chen',
      accessedAt: new Date('2024-09-10'),
      ipAddress: '10.0.0.50',
      location: 'San Francisco, CA'
    }
  ]);

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRegenerateToken = (tokenId: string) => {
    // In real app, this would call API to regenerate token
    console.log('Regenerating token:', tokenId);
    setShowRegenerateModal(null);
  };

  const generateQRCode = (token: string) => {
    // In real app, this would generate actual QR code
    const qrData = `https://heirloom.app/access/${token}`;
    return qrData;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian-900 via-obsidian-800 to-charcoal text-pearl">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-gold-600 to-gold-500 rounded-xl">
              <Key className="w-6 h-6 text-obsidian-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-400 to-gold-300 bg-clip-text text-transparent">
                Legacy Token Manager
              </h1>
              <p className="text-gold-400/70 mt-1">
                Secure posthumous access to family memories
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-obsidian-800/50 p-1 rounded-xl backdrop-blur-sm">
          {[
            { id: 'tokens', label: 'My Tokens', icon: Key },
            { id: 'access', label: 'Access History', icon: Clock },
            { id: 'share', label: 'Share & Invite', icon: Share2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 shadow-lg'
                  : 'text-gold-400/70 hover:text-gold-400 hover:bg-obsidian-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'tokens' && (
            <motion.div
              key="tokens"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Token Cards */}
              {tokens.map((token) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-600/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-gold-600/20 to-gold-500/20 rounded-lg">
                        <Shield className="w-5 h-5 text-gold-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gold-300">
                          {token.profileName}
                        </h3>
                        <p className="text-gold-400/60 text-sm">
                          Created {token.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        token.isActive 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {token.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Token Display */}
                  <div className="bg-obsidian-900/50 rounded-lg p-4 mb-4 border border-gold-600/10">
                    <div className="flex items-center justify-between">
                      <code className="text-gold-300 font-mono text-sm break-all">
                        {token.token}
                      </code>
                      <button
                        onClick={() => handleCopyToken(token.token)}
                        className="ml-3 p-2 hover:bg-gold-600/20 rounded-lg transition-colors"
                      >
                        {copiedToken === token.token ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gold-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Token Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gold-300">
                        {token.accessCount}
                      </div>
                      <div className="text-gold-400/60 text-xs">Access Count</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gold-300">
                        {token.lastRegenerated ? 
                          Math.floor((Date.now() - token.lastRegenerated.getTime()) / (1000 * 60 * 60 * 24))
                          : 'Never'
                        }
                      </div>
                      <div className="text-gold-400/60 text-xs">Days Since Regen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gold-300">
                        <Lock className="w-6 h-6 mx-auto" />
                      </div>
                      <div className="text-gold-400/60 text-xs">Secure</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gold-300">
                        ∞
                      </div>
                      <div className="text-gold-400/60 text-xs">No Expiry</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowRegenerateModal(token.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold-600/20 to-gold-500/20 hover:from-gold-600/30 hover:to-gold-500/30 text-gold-300 rounded-lg transition-all duration-300 border border-gold-500/30"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={() => setShowShareModal(token.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-blue-500/20 hover:from-blue-600/30 hover:to-blue-500/30 text-blue-300 rounded-lg transition-all duration-300 border border-blue-500/30"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <button
                      onClick={() => generateQRCode(token.token)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 text-purple-300 rounded-lg transition-all duration-300 border border-purple-500/30"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Add New Token */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-gold-600/10 to-gold-500/10 backdrop-blur-sm rounded-2xl p-6 border border-gold-600/30 border-dashed"
              >
                <div className="text-center">
                  <div className="p-4 bg-gradient-to-r from-gold-600/20 to-gold-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Key className="w-8 h-8 text-gold-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gold-300 mb-2">
                    Create New Legacy Token
                  </h3>
                  <p className="text-gold-400/70 mb-4">
                    Generate a secure token for posthumous access to your memories
                  </p>
                  <button className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                    Generate Token
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'access' && (
            <motion.div
              key="access"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Access History */}
              <div className="bg-gradient-to-r from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Access History
                </h3>
                
                <div className="space-y-4">
                  {accessHistory.map((access) => (
                    <div
                      key={access.id}
                      className="flex items-center justify-between p-4 bg-obsidian-900/50 rounded-lg border border-gold-600/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-600/20 to-green-500/20 rounded-lg">
                          <Unlock className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <div className="text-gold-300 font-medium">
                            {access.accessedBy}
                          </div>
                          <div className="text-gold-400/60 text-sm">
                            {access.location} • {access.accessedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-gold-400/60 text-sm font-mono">
                        {access.ipAddress}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'share' && (
            <motion.div
              key="share"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Share Options */}
              <div className="bg-gradient-to-r from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-gold-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share & Invite
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-obsidian-900/50 rounded-lg border border-gold-600/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-5 h-5 text-blue-400" />
                      <h4 className="text-lg font-medium text-gold-300">
                        Invite Family Members
                      </h4>
                    </div>
                    <p className="text-gold-400/70 text-sm mb-4">
                      Send invitations to join your family's Heirloom platform
                    </p>
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300">
                      Send Invitations
                    </button>
                  </div>

                  <div className="p-4 bg-obsidian-900/50 rounded-lg border border-gold-600/10">
                    <div className="flex items-center gap-3 mb-3">
                      <Mail className="w-5 h-5 text-green-400" />
                      <h4 className="text-lg font-medium text-gold-300">
                        Legacy Instructions
                      </h4>
                    </div>
                    <p className="text-gold-400/70 text-sm mb-4">
                      Generate instructions for your will or estate planning
                    </p>
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300">
                      Generate Instructions
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Regenerate Modal */}
        <AnimatePresence>
          {showRegenerateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-obsidian-800 to-charcoal rounded-2xl p-6 max-w-md w-full border border-gold-600/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-r from-gold-600/20 to-gold-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-gold-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gold-300">
                    Regenerate Token
                  </h3>
                </div>
                
                <p className="text-gold-400/70 mb-6">
                  This will invalidate the current token and generate a new one. 
                  Anyone with the old token will lose access. This action cannot be undone.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRegenerateModal(null)}
                    className="flex-1 px-4 py-2 bg-obsidian-700 text-gold-400 rounded-lg hover:bg-obsidian-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRegenerateToken(showRegenerateModal)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-900 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Regenerate
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LegacyTokenManager;