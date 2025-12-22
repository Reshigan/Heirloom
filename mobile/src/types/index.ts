export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  tier: 'FREE' | 'STARTER' | 'FAMILY' | 'FOREVER';
  trialEndsAt?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Memory {
  id: string;
  userId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  emotion?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VoiceRecording {
  id: string;
  userId: string;
  title: string;
  description?: string;
  fileUrl: string;
  duration: number;
  createdAt: string;
}

export interface Letter {
  id: string;
  userId: string;
  title: string;
  body: string;
  recipientName?: string;
  recipientEmail?: string;
  deliveryDate?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'DELIVERED';
  sealed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  email?: string;
  profilePicture?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'reminder' | 'milestone' | 'prompt' | 'streak' | 'family';
  title: string;
  message: string;
  emotionalAppeal: string;
  icon: string;
  action?: {
    label: string;
    route: string;
  };
  read: boolean;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LegacyScore {
  score: number;
  tier: string;
  memoriesCount: number;
  voiceMinutes: number;
  lettersCount: number;
  familyCount: number;
  streakDays: number;
}
