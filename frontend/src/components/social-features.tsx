'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Send, Users, Bell, Settings, UserPlus, X, Search, Filter } from 'lucide-react';

interface SocialFeaturesProps {
  onClose?: () => void;
}

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

interface Activity {
  id: string;
  type: 'like' | 'comment' | 'share' | 'upload' | 'join';
  user: string;
  target: string;
  timestamp: string;
  content?: string;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'mention' | 'share' | 'memory_added';
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
}

export default function SocialFeatures({ onClose }: SocialFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'family' | 'notifications'>('activity');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const familyMembers: FamilyMember[] = [
    {
      id: '1',
      name: 'Michael Johnson',
      relationship: 'Husband',
      status: 'online',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: '2',
      name: 'Emma Johnson',
      relationship: 'Daughter',
      status: 'offline',
      lastSeen: '2 hours ago'
    },
    {
      id: '3',
      name: 'Grandma Rose',
      relationship: 'Mother-in-law',
      status: 'away',
      lastSeen: '1 day ago'
    },
    {
      id: '4',
      name: 'Uncle Tom',
      relationship: 'Brother',
      status: 'online'
    },
    {
      id: '5',
      name: 'Aunt Mary',
      relationship: 'Sister-in-law',
      status: 'offline',
      lastSeen: '3 days ago'
    },
    {
      id: '6',
      name: 'Cousin Jake',
      relationship: 'Nephew',
      status: 'online'
    }
  ];

  const activities: Activity[] = [
    {
      id: '1',
      type: 'like',
      user: 'Michael Johnson',
      target: 'Emma\'s First Steps',
      timestamp: '5 minutes ago'
    },
    {
      id: '2',
      type: 'comment',
      user: 'Grandma Rose',
      target: 'Family Vacation Photos',
      timestamp: '1 hour ago',
      content: 'What beautiful memories! Emma looks so happy.'
    },
    {
      id: '3',
      type: 'upload',
      user: 'Uncle Tom',
      target: 'Birthday Celebration 2024',
      timestamp: '2 hours ago'
    },
    {
      id: '4',
      type: 'share',
      user: 'Aunt Mary',
      target: 'Christmas Morning Magic',
      timestamp: '5 hours ago'
    },
    {
      id: '5',
      type: 'join',
      user: 'Cousin Jake',
      target: 'the family',
      timestamp: '1 day ago'
    }
  ];

  const notifications: Notification[] = [
    {
      id: '1',
      type: 'like',
      message: 'Michael Johnson liked your memory "Emma\'s First Birthday"',
      timestamp: '10 minutes ago',
      read: false
    },
    {
      id: '2',
      type: 'comment',
      message: 'Grandma Rose commented on "Summer Family Reunion"',
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'memory_added',
      message: 'Uncle Tom added 5 new photos to "Holiday Traditions"',
      timestamp: '3 hours ago',
      read: true
    },
    {
      id: '4',
      type: 'mention',
      message: 'You were mentioned in a comment by Aunt Mary',
      timestamp: '1 day ago',
      read: true
    },
    {
      id: '5',
      type: 'share',
      message: 'Cousin Jake shared your memory "Dad\'s Workshop Legacy"',
      timestamp: '2 days ago',
      read: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like': return '👍';
      case 'comment': return '💬';
      case 'share': return '🔄';
      case 'upload': return '📸';
      case 'join': return '👋';
      default: return '📝';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'mention': return '👤';
      case 'share': return '🔄';
      case 'memory_added': return '📸';
      default: return '🔔';
    }
  };

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      // Handle invite logic here
      console.log('Inviting:', inviteEmail);
      setInviteEmail('');
      setShowInviteModal(false);
    }
  };

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.relationship.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-glass-border">
          <h2 className="text-2xl font-display font-bold text-gold">Family Social Hub</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-secondary-gradient text-black px-4 py-2 rounded-lg hover:scale-105 transition-transform font-semibold flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Family</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gold/60 hover:text-gold transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-glass-border">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'activity' 
                ? 'text-gold border-b-2 border-gold' 
                : 'text-gold/60 hover:text-gold'
            }`}
          >
            Recent Activity
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'family' 
                ? 'text-gold border-b-2 border-gold' 
                : 'text-gold/60 hover:text-gold'
            }`}
          >
            Family Members ({familyMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors relative ${
              activeTab === 'notifications' 
                ? 'text-gold border-b-2 border-gold' 
                : 'text-gold/60 hover:text-gold'
            }`}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 bg-black-light rounded-lg border border-gold/20">
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gold">{activity.user}</span>
                        <span className="text-gold/60">
                          {activity.type === 'like' && 'liked'}
                          {activity.type === 'comment' && 'commented on'}
                          {activity.type === 'share' && 'shared'}
                          {activity.type === 'upload' && 'uploaded'}
                          {activity.type === 'join' && 'joined'}
                        </span>
                        <span className="font-medium text-gold">{activity.target}</span>
                      </div>
                      {activity.content && (
                        <p className="text-gold/80 text-sm mb-2">{activity.content}</p>
                      )}
                      <span className="text-gold/50 text-xs">{activity.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Family Tab */}
          {activeTab === 'family' && (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-6 border-b border-glass-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gold/60 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search family members..."
                    className="w-full bg-black-light border border-gold/30 rounded-lg pl-10 pr-4 py-3 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Family Members List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="bg-black-light rounded-lg border border-gold/20 p-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-secondary-gradient flex items-center justify-center text-black font-bold">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              member.name[0]
                            )}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${getStatusColor(member.status)}`}></div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gold">{member.name}</h3>
                          <p className="text-gold/60 text-sm">{member.relationship}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`}></div>
                            <span className="text-gold/50 text-xs">
                              {member.status === 'online' ? 'Online' : 
                               member.status === 'away' ? 'Away' : 
                               member.lastSeen ? `Last seen ${member.lastSeen}` : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-gold/60 hover:text-gold transition-colors">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gold/60 hover:text-gold transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-black-light border-gold/20' 
                      : 'bg-gold/10 border-gold/40'
                  }`}>
                    <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <p className="text-gold/90 text-sm">{notification.message}</p>
                      <span className="text-gold/50 text-xs">{notification.timestamp}</span>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-gold rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-60">
          <div className="bg-glass-bg backdrop-blur-lg border border-glass-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-gold">Invite Family Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gold/60 hover:text-gold transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gold/80 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address..."
                  className="w-full bg-black-light border border-gold/30 rounded-lg px-4 py-3 text-gold placeholder-gold/50 focus:border-gold focus:outline-none transition-colors"
                />
              </div>

              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                <h4 className="text-gold font-medium mb-2">Invitation Preview</h4>
                <p className="text-gold/80 text-sm">
                  &quot;Hi! I&apos;d love for you to join our family&apos;s Heirloom collection where we share and preserve our precious memories together. Click the link below to get started!&quot;
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 border border-gold/30 text-gold py-3 rounded-lg hover:border-gold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className="flex-1 bg-secondary-gradient text-black py-3 rounded-lg hover:scale-105 transition-transform font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}