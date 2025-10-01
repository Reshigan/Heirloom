'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, 
  Users, 
  Mail, 
  Link, 
  QrCode,
  Copy,
  Send,
  UserPlus,
  Heart,
  Star,
  Gift,
  MessageCircle,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  FileText,
  Sparkles,
  Crown,
  Shield
} from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  name: string;
  relationship: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: Date;
  acceptedAt?: Date;
  message?: string;
}

interface ShareTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  message: string;
  icon: React.ComponentType<any>;
  category: 'family' | 'friends' | 'professional';
}

const ShareInviteSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invite' | 'share' | 'templates' | 'analytics'>('invite');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [invitations] = useState<Invitation[]>([
    {
      id: '1',
      email: 'sarah.mitchell@email.com',
      name: 'Sarah Mitchell',
      relationship: 'Daughter',
      status: 'accepted',
      sentAt: new Date('2024-09-01'),
      acceptedAt: new Date('2024-09-02'),
      message: 'Would love to have you join our family memories platform!'
    },
    {
      id: '2',
      email: 'michael.chen@email.com',
      name: 'Michael Chen',
      relationship: 'Son-in-law',
      status: 'pending',
      sentAt: new Date('2024-09-15'),
      message: 'Join us in preserving our family legacy together.'
    },
    {
      id: '3',
      email: 'emma.whitmore@email.com',
      name: 'Emma Whitmore',
      relationship: 'Granddaughter',
      status: 'declined',
      sentAt: new Date('2024-08-20'),
      message: 'Your memories matter to our family story.'
    }
  ]);

  const shareTemplates: ShareTemplate[] = [
    {
      id: 'family_legacy',
      name: 'Family Legacy Invitation',
      description: 'Warm invitation for family members',
      subject: 'Join Our Family\'s Digital Legacy on Heirloom',
      message: `Dear {name},

I hope this message finds you well. I wanted to share something special with you - I've been using Heirloom to preserve and share our family's precious memories, stories, and legacy.

Heirloom is a beautiful platform where we can:
• Store and organize family photos, videos, and stories
• Share memories across generations
• Preserve our family history for future generations
• Connect with loved ones through shared experiences

I would love for you to join our family's Heirloom collection. Your memories and stories are an important part of our family's tapestry, and having you on the platform would make it even more meaningful.

Getting started is simple - just click the link below and you'll be guided through the process.

With love and warm regards,
{sender_name}

P.S. Don't worry about the technology - Heirloom is designed to be simple and intuitive for everyone to use.`,
      icon: Heart,
      category: 'family'
    },
    {
      id: 'friend_memories',
      name: 'Friends & Memories',
      description: 'Casual invitation for friends',
      subject: 'Let\'s Preserve Our Memories Together on Heirloom',
      message: `Hi {name}!

I've discovered this amazing platform called Heirloom that helps preserve and share life's precious memories. I immediately thought of all the wonderful times we've shared together and how much I'd love to have those memories preserved in one beautiful place.

Would you like to join me on Heirloom? We could:
• Share photos from our adventures together
• Record voice messages and stories
• Create a timeline of our friendship
• Keep our memories safe for years to come

It's really easy to use and I think you'd love it. Plus, it would mean so much to have you as part of my memory collection!

Hope to see you there soon!

Best,
{sender_name}`,
      icon: Users,
      category: 'friends'
    },
    {
      id: 'professional_legacy',
      name: 'Professional Legacy',
      description: 'For colleagues and professional connections',
      subject: 'Preserve Professional Memories and Mentorship on Heirloom',
      message: `Dear {name},

I hope you're doing well. I wanted to reach out about something that's become quite meaningful to me - preserving professional relationships and mentorship experiences through a platform called Heirloom.

Throughout our professional journey together, we've shared valuable experiences, insights, and moments that have shaped our careers. I believe these professional memories and the wisdom we've gained deserve to be preserved and potentially shared with future generations.

Heirloom provides a sophisticated platform for:
• Documenting professional milestones and achievements
• Preserving mentorship wisdom and career insights
• Sharing professional stories and lessons learned
• Creating a legacy of professional growth and relationships

I would be honored if you'd consider joining my professional memory collection on Heirloom. Your perspective and our shared experiences would add tremendous value to this digital legacy.

Best regards,
{sender_name}`,
      icon: Star,
      category: 'professional'
    }
  ];

  const socialPlatforms = [
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500', shareUrl: 'https://wa.me/?text=' },
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', shareUrl: 'https://facebook.com/sharer/sharer.php?u=' },
    { name: 'Twitter', icon: Twitter, color: 'bg-blue-400', shareUrl: 'https://twitter.com/intent/tweet?url=' },
    { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', shareUrl: 'https://linkedin.com/sharing/share-offsite/?url=' },
    { name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500', shareUrl: '' }
  ];

  const handleCopyLink = () => {
    const inviteLink = 'https://heirloom.app/invite/abc123xyz';
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'declined': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return CheckCircle;
      case 'pending': return Clock;
      case 'declined': return AlertCircle;
      default: return Clock;
    }
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
            <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
                Share & Invite
              </h1>
              <p className="text-purple-400/70 mt-1">
                Grow your family's digital legacy together
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-obsidian-800/50 p-1 rounded-xl backdrop-blur-sm">
          {[
            { id: 'invite', label: 'Send Invites', icon: UserPlus },
            { id: 'share', label: 'Share Platform', icon: Share2 },
            { id: 'templates', label: 'Message Templates', icon: FileText },
            { id: 'analytics', label: 'Invite Analytics', icon: Star }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                  : 'text-purple-400/70 hover:text-purple-400 hover:bg-obsidian-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'invite' && (
            <motion.div
              key="invite"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Quick Actions */}
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20 text-center"
                >
                  <div className="p-4 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">
                    Email Invitations
                  </h3>
                  <p className="text-gold-400/70 text-sm mb-4">
                    Send personalized email invitations to family and friends
                  </p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Send Invites
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20 text-center"
                >
                  <div className="p-4 bg-gradient-to-r from-green-600/20 to-green-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Link className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">
                    Share Link
                  </h3>
                  <p className="text-gold-400/70 text-sm mb-4">
                    Copy and share your personal invitation link
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20 text-center"
                >
                  <div className="p-4 bg-gradient-to-r from-purple-600/20 to-purple-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-2">
                    QR Code
                  </h3>
                  <p className="text-gold-400/70 text-sm mb-4">
                    Generate QR code for easy mobile sharing
                  </p>
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300">
                    Generate QR
                  </button>
                </motion.div>
              </div>

              {/* Sent Invitations */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Sent Invitations
                </h3>
                
                <div className="space-y-4">
                  {invitations.map((invitation) => {
                    const StatusIcon = getStatusIcon(invitation.status);
                    return (
                      <motion.div
                        key={invitation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-obsidian-900/50 rounded-lg border border-purple-600/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gradient-to-r from-purple-600/20 to-purple-500/20 rounded-lg">
                            <Mail className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gold-300">
                              {invitation.name}
                            </div>
                            <div className="text-gold-400/60 text-sm">
                              {invitation.email} • {invitation.relationship}
                            </div>
                            <div className="text-gold-400/60 text-xs mt-1">
                              Sent {invitation.sentAt.toLocaleDateString()}
                              {invitation.acceptedAt && ` • Accepted ${invitation.acceptedAt.toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(invitation.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {invitation.status}
                          </span>
                          <button className="p-2 hover:bg-purple-600/20 rounded-lg transition-colors">
                            <Send className="w-4 h-4 text-purple-400" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
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
              {/* Social Media Sharing */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Share on Social Media
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {socialPlatforms.map((platform) => (
                    <motion.button
                      key={platform.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 ${platform.color} rounded-xl text-white font-medium hover:shadow-lg transition-all duration-300 flex flex-col items-center gap-2`}
                    >
                      <platform.icon className="w-6 h-6" />
                      <span className="text-sm">{platform.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Share Statistics */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6">
                  Sharing Impact
                </h3>
                
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-300 mb-1">
                      127
                    </div>
                    <div className="text-blue-400/60 text-sm">Link Clicks</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-300 mb-1">
                      23
                    </div>
                    <div className="text-green-400/60 text-sm">Sign-ups</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-300 mb-1">
                      18%
                    </div>
                    <div className="text-purple-400/60 text-sm">Conversion Rate</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-gold-300 mb-1">
                      5.2
                    </div>
                    <div className="text-gold-400/60 text-sm">Avg. Referrals</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {shareTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-600/20 to-purple-500/20 rounded-lg">
                        <template.icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gold-300">
                          {template.name}
                        </h3>
                        <p className="text-gold-400/70 text-sm">
                          {template.description}
                        </p>
                        <span className="inline-block mt-1 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full capitalize">
                          {template.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(template.id)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                    >
                      Use Template
                    </button>
                  </div>
                  
                  <div className="bg-obsidian-900/50 rounded-lg p-4 border border-purple-600/10">
                    <div className="text-gold-300 font-medium mb-2">
                      Subject: {template.subject}
                    </div>
                    <div className="text-gold-400/70 text-sm whitespace-pre-line">
                      {template.message.substring(0, 200)}...
                    </div>
                  </div>
                </motion.div>
              ))}
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
              {/* Invitation Analytics */}
              <div className="bg-gradient-to-br from-obsidian-800/80 to-charcoal/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-600/20">
                <h3 className="text-xl font-semibold text-gold-300 mb-6">
                  Invitation Performance
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-300 mb-1">
                      {invitations.length}
                    </div>
                    <div className="text-blue-400/60 text-sm">Total Sent</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-300 mb-1">
                      {invitations.filter(i => i.status === 'accepted').length}
                    </div>
                    <div className="text-green-400/60 text-sm">Accepted</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-300 mb-1">
                      {invitations.filter(i => i.status === 'pending').length}
                    </div>
                    <div className="text-yellow-400/60 text-sm">Pending</div>
                  </div>
                  
                  <div className="text-center p-4 bg-obsidian-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-300 mb-1">
                      {Math.round((invitations.filter(i => i.status === 'accepted').length / invitations.length) * 100)}%
                    </div>
                    <div className="text-purple-400/60 text-sm">Success Rate</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invite Modal */}
        <AnimatePresence>
          {showInviteModal && (
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
                className="bg-gradient-to-br from-obsidian-800 to-charcoal rounded-2xl p-6 max-w-md w-full border border-purple-600/20"
              >
                <h3 className="text-xl font-semibold text-gold-300 mb-4">
                  Send Invitation
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gold-300 mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full bg-obsidian-900/50 border border-purple-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-purple-500"
                      placeholder="Enter name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gold-300 mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full bg-obsidian-900/50 border border-purple-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-purple-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gold-300 mb-2">Relationship</label>
                    <select className="w-full bg-obsidian-900/50 border border-purple-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-purple-500">
                      <option value="">Select relationship</option>
                      <option value="parent">Parent</option>
                      <option value="child">Child</option>
                      <option value="sibling">Sibling</option>
                      <option value="grandparent">Grandparent</option>
                      <option value="grandchild">Grandchild</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gold-300 mb-2">Personal Message</label>
                    <textarea
                      className="w-full bg-obsidian-900/50 border border-purple-600/30 rounded-lg px-3 py-2 text-gold-300 focus:outline-none focus:border-purple-500 h-20 resize-none"
                      placeholder="Add a personal message (optional)"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 bg-obsidian-700 text-gold-400 rounded-lg hover:bg-obsidian-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Send Invite
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

export default ShareInviteSystem;