/**
 * Canonical domain types for Heirloom application
 * These types represent the core data structures used throughout the app
 */

export interface User {
  id: string;
  email: string;
  status: string;
  nextCheckIn?: string;
  name?: string;
  familyName?: string;
  subscription?: {
    tier: string;
    status: string;
    currentPeriodEnd?: string;
  };
}

export interface Memory {
  id: string;
  title: string;
  description?: string;
  content?: string;
  date: string;
  type: string;
  thumbnailUrl?: string;
  thumbnail?: string; // Temporary alias for migration
  location?: string;
  participants?: string[];
  tags?: string[];
  significance?: 'low' | 'medium' | 'high' | 'milestone';
  aiEnhanced?: boolean;
  emotions?: string[];
  emotionCategory?: string;
  importanceScore?: number;
  sentimentScore?: number;
  sentimentLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiTimeCapsule {
  id: string;
  title: string;
  message: string;
  memoryIds: string[];
  unlockDate: string;
  isLocked: boolean;
  recipients: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest?: boolean;
  checkInReminders?: boolean;
  vaultUpdates?: boolean;
}

export type ViewMode = 
  | 'home'
  | 'gallery'
  | 'timeline'
  | 'family'
  | 'vault'
  | 'recipients'
  | 'trusted-contacts'
  | 'check-in'
  | 'stats'
  | 'settings'
  | 'notifications'
  | 'search'
  | 'tokens'
  | 'pricing'
  | 'storage'
  | 'share';

export interface FamilyMember {
  id: string;
  name: string;
  relation?: string;
  birthDate?: string;
  deathDate?: string;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
  participants?: string[];
}

export interface Comment {
  id: string;
  itemId: string;
  userId: string;
  content: string;
  createdAt: string;
  reactions?: CommentReaction[];
}

export interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  type: string;
  createdAt: string;
}

export interface ActivityStats {
  memoriesAdded?: number;
  commentsPosted?: number;
  commentsReceived?: number;
  reactionsReceived?: number;
  profileViews?: number;
  newConnections?: number;
  storiesRecorded?: number;
  highlightsCreated?: number;
  checkInsCompleted?: number;
  storageUsed?: number;
  recipientsAdded?: number;
}
