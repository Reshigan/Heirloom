import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// User engagement tracking
export interface UserEngagement {
  userId: string;
  level: number;
  xp: number;
  streak: number;
  lastActivity: Date;
  achievements: Achievement[];
  dailyGoals: DailyGoal[];
  weeklyChallenge: WeeklyChallenge | null;
  socialConnections: number;
  contentCreated: number;
  contentShared: number;
  referralsCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'content' | 'social' | 'streak' | 'milestone' | 'referral';
  xpReward: number;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DailyGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
  category: 'post' | 'interact' | 'share' | 'connect';
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  target: number;
  current: number;
  participants: number;
  reward: string;
  xpReward: number;
}

export interface ContentPrompt {
  id: string;
  title: string;
  description: string;
  category: 'memory' | 'story' | 'photo' | 'wisdom' | 'tradition';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  trending: boolean;
  examples: string[];
}

// Stores
export const engagementStore = writable<UserEngagement | null>(null);
export const dailyPromptsStore = writable<ContentPrompt[]>([]);
export const leaderboardStore = writable<any[]>([]);
export const notificationsStore = writable<any[]>([]);

// Derived stores
export const userLevel = derived(engagementStore, ($engagement) => {
  if (!$engagement) return 1;
  return Math.floor($engagement.xp / 1000) + 1;
});

export const nextLevelXP = derived(engagementStore, ($engagement) => {
  if (!$engagement) return 1000;
  const currentLevel = Math.floor($engagement.xp / 1000) + 1;
  return currentLevel * 1000;
});

export const levelProgress = derived([engagementStore, nextLevelXP], ([$engagement, $nextLevelXP]) => {
  if (!$engagement) return 0;
  const currentLevelXP = ($engagement.level - 1) * 1000;
  return (($engagement.xp - currentLevelXP) / 1000) * 100;
});

// Engagement actions
export const engagementActions = {
  // Initialize user engagement
  async initialize(userId: string) {
    try {
      const response = await fetch(`/api/engagement/${userId}`);
      if (response.ok) {
        const data = await response.json();
        engagementStore.set(data);
      }
    } catch (error) {
      console.error('Failed to initialize engagement:', error);
    }
  },

  // Track user action and award XP
  async trackAction(action: string, metadata?: any) {
    try {
      const response = await fetch('/api/engagement/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, metadata })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update engagement store
        engagementStore.update(current => {
          if (!current) return current;
          return {
            ...current,
            xp: result.newXP,
            level: result.newLevel,
            achievements: [...current.achievements, ...result.newAchievements]
          };
        });

        // Show achievement notifications
        if (result.newAchievements.length > 0) {
          this.showAchievements(result.newAchievements);
        }

        return result;
      }
    } catch (error) {
      console.error('Failed to track action:', error);
    }
  },

  // Show achievement notifications
  showAchievements(achievements: Achievement[]) {
    achievements.forEach(achievement => {
      notificationsStore.update(notifications => [
        ...notifications,
        {
          id: `achievement_${achievement.id}`,
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: achievement.title,
          icon: achievement.icon,
          timestamp: new Date(),
          autoHide: false
        }
      ]);
    });
  },

  // Load daily content prompts
  async loadDailyPrompts() {
    try {
      const response = await fetch('/api/engagement/prompts/daily');
      if (response.ok) {
        const prompts = await response.json();
        dailyPromptsStore.set(prompts);
      }
    } catch (error) {
      console.error('Failed to load daily prompts:', error);
    }
  },

  // Complete daily goal
  async completeDailyGoal(goalId: string) {
    try {
      const response = await fetch(`/api/engagement/goals/${goalId}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        
        engagementStore.update(current => {
          if (!current) return current;
          return {
            ...current,
            xp: current.xp + result.xpReward,
            dailyGoals: current.dailyGoals.map(goal => 
              goal.id === goalId ? { ...goal, completed: true } : goal
            )
          };
        });

        // Show completion notification
        notificationsStore.update(notifications => [
          ...notifications,
          {
            id: `goal_${goalId}`,
            type: 'success',
            title: 'Daily Goal Complete!',
            message: `+${result.xpReward} XP earned`,
            icon: '🎯',
            timestamp: new Date(),
            autoHide: true
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to complete daily goal:', error);
    }
  },

  // Update streak
  async updateStreak() {
    try {
      const response = await fetch('/api/engagement/streak', {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        
        engagementStore.update(current => {
          if (!current) return current;
          return {
            ...current,
            streak: result.streak,
            xp: current.xp + result.streakBonus
          };
        });

        if (result.streakBonus > 0) {
          notificationsStore.update(notifications => [
            ...notifications,
            {
              id: `streak_${Date.now()}`,
              type: 'streak',
              title: `${result.streak} Day Streak!`,
              message: `+${result.streakBonus} bonus XP`,
              icon: '🔥',
              timestamp: new Date(),
              autoHide: true
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  },

  // Load leaderboard
  async loadLeaderboard(type: 'weekly' | 'monthly' | 'allTime' = 'weekly') {
    try {
      const response = await fetch(`/api/engagement/leaderboard?type=${type}`);
      if (response.ok) {
        const leaderboard = await response.json();
        leaderboardStore.set(leaderboard);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  },

  // Dismiss notification
  dismissNotification(notificationId: string) {
    notificationsStore.update(notifications => 
      notifications.filter(n => n.id !== notificationId)
    );
  }
};

// XP rewards for private vault building actions
export const XP_REWARDS = {
  // Private content creation
  CREATE_MEMORY: 50,
  CREATE_STORY: 100,
  UPLOAD_PHOTO: 25,
  ADD_AUDIO: 75,
  CREATE_TIME_CAPSULE: 150,
  ADD_WISDOM: 100,
  CREATE_FAMILY_RECIPE: 75,
  RECORD_VOICE_MESSAGE: 125,
  
  // Vault organization
  ORGANIZE_CATEGORY: 30,
  ADD_METADATA: 20,
  CREATE_COLLECTION: 60,
  TAG_CONTENT: 15,
  
  // Legacy planning
  CREATE_INHERITANCE_TOKEN: 200,
  SETUP_LEGACY_PLAN: 500,
  DEFINE_BENEFICIARY: 100,
  SET_PRIVACY_LEVELS: 50,
  
  // Personal engagement
  DAILY_VAULT_VISIT: 25,
  COMPLETE_PROFILE: 100,
  FIRST_WEEK_ACTIVE: 500,
  VAULT_BACKUP: 150,
  
  // Milestones
  FIRST_MEMORY: 100,
  TENTH_MEMORY: 250,
  FIFTIETH_MEMORY: 500,
  HUNDREDTH_MEMORY: 1000,
  VAULT_COMPLETIONIST: 2000, // 500+ memories
  
  // Streaks (personal consistency)
  SEVEN_DAY_STREAK: 200,
  THIRTY_DAY_STREAK: 1000,
  HUNDRED_DAY_STREAK: 5000,
  
  // Special achievements
  FIRST_INHERITANCE_RECEIVED: 300,
  VAULT_SEALED: 1000, // When vault is sealed for inheritance
  LEGACY_ACTIVATED: 2000 // When inheritance tokens are first used
};

// Achievement definitions for private vault building
export const ACHIEVEMENTS = {
  // Vault creation achievements
  VAULT_FOUNDER: {
    id: 'vault_founder',
    title: 'Vault Founder',
    description: 'Created your private family vault',
    icon: '🏛️',
    category: 'vault' as const,
    xpReward: 100,
    rarity: 'common' as const
  },
  
  MEMORY_KEEPER: {
    id: 'memory_keeper',
    title: 'Memory Keeper',
    description: 'Added your first memory to your vault',
    icon: '📝',
    category: 'content' as const,
    xpReward: 100,
    rarity: 'common' as const
  },
  
  STORYTELLER: {
    id: 'storyteller',
    title: 'Family Storyteller',
    description: 'Created 10 memories in your vault',
    icon: '📚',
    category: 'content' as const,
    xpReward: 250,
    rarity: 'rare' as const
  },
  
  ARCHIVIST: {
    id: 'archivist',
    title: 'Family Archivist',
    description: 'Preserved 50 memories in your vault',
    icon: '🗃️',
    category: 'content' as const,
    xpReward: 1000,
    rarity: 'epic' as const
  },
  
  VAULT_MASTER: {
    id: 'vault_master',
    title: 'Vault Master',
    description: 'Accumulated 100+ memories in your private vault',
    icon: '👑',
    category: 'content' as const,
    xpReward: 2000,
    rarity: 'legendary' as const
  },
  
  // Organization achievements
  ORGANIZER: {
    id: 'organizer',
    title: 'Vault Organizer',
    description: 'Organized memories into 5 different categories',
    icon: '📁',
    category: 'organization' as const,
    xpReward: 200,
    rarity: 'common' as const
  },
  
  CURATOR: {
    id: 'curator',
    title: 'Memory Curator',
    description: 'Added detailed metadata to 25 memories',
    icon: '🏷️',
    category: 'organization' as const,
    xpReward: 300,
    rarity: 'rare' as const
  },
  
  // Legacy planning achievements
  LEGACY_PLANNER: {
    id: 'legacy_planner',
    title: 'Legacy Planner',
    description: 'Created your first inheritance plan',
    icon: '📋',
    category: 'legacy' as const,
    xpReward: 500,
    rarity: 'rare' as const
  },
  
  TOKEN_CREATOR: {
    id: 'token_creator',
    title: 'Token Creator',
    description: 'Created your first inheritance token',
    icon: '🎫',
    category: 'legacy' as const,
    xpReward: 300,
    rarity: 'rare' as const
  },
  
  VAULT_GUARDIAN: {
    id: 'vault_guardian',
    title: 'Vault Guardian',
    description: 'Set up comprehensive privacy controls',
    icon: '🛡️',
    category: 'security' as const,
    xpReward: 400,
    rarity: 'rare' as const
  },
  
  // Time-based achievements
  DEDICATED: {
    id: 'dedicated',
    title: 'Dedicated Keeper',
    description: 'Visited your vault for 7 consecutive days',
    icon: '🔥',
    category: 'streak' as const,
    xpReward: 200,
    rarity: 'common' as const
  },
  
  COMMITTED: {
    id: 'committed',
    title: 'Committed Guardian',
    description: 'Maintained a 30-day vault building streak',
    icon: '⚡',
    category: 'streak' as const,
    xpReward: 1000,
    rarity: 'epic' as const
  },
  
  ETERNAL_KEEPER: {
    id: 'eternal_keeper',
    title: 'Eternal Keeper',
    description: 'Maintained a 100-day legacy building streak',
    icon: '♾️',
    category: 'streak' as const,
    xpReward: 5000,
    rarity: 'legendary' as const
  },
  
  // Special content achievements
  WISDOM_KEEPER: {
    id: 'wisdom_keeper',
    title: 'Wisdom Keeper',
    description: 'Recorded 10 pieces of life wisdom',
    icon: '🧠',
    category: 'content' as const,
    xpReward: 750,
    rarity: 'epic' as const
  },
  
  TIME_CAPSULE_CREATOR: {
    id: 'time_capsule_creator',
    title: 'Time Capsule Creator',
    description: 'Created your first time capsule for future generations',
    icon: '⏰',
    category: 'content' as const,
    xpReward: 300,
    rarity: 'rare' as const
  },
  
  VOICE_OF_LEGACY: {
    id: 'voice_of_legacy',
    title: 'Voice of Legacy',
    description: 'Recorded 5 audio messages for your family',
    icon: '🎵',
    category: 'content' as const,
    xpReward: 400,
    rarity: 'rare' as const
  },
  
  // Inheritance achievements
  INHERITANCE_RECEIVED: {
    id: 'inheritance_received',
    title: 'Inheritance Received',
    description: 'Received your first family inheritance token',
    icon: '🎁',
    category: 'inheritance' as const,
    xpReward: 300,
    rarity: 'rare' as const
  },
  
  LEGACY_ACTIVATED: {
    id: 'legacy_activated',
    title: 'Legacy Activated',
    description: 'Your inheritance tokens were first accessed',
    icon: '🌟',
    category: 'legacy' as const,
    xpReward: 2000,
    rarity: 'legendary' as const
  },
  
  VAULT_SEALED: {
    id: 'vault_sealed',
    title: 'Vault Sealed',
    description: 'Sealed your vault for inheritance-only access',
    icon: '🔐',
    category: 'legacy' as const,
    xpReward: 1000,
    rarity: 'epic' as const
  }
};

// Daily goals generator
export function generateDailyGoals(): DailyGoal[] {
  const goals = [
    {
      id: 'daily_memory',
      title: 'Share a Memory',
      description: 'Create or add to a family memory today',
      target: 1,
      current: 0,
      xpReward: 50,
      completed: false,
      category: 'post' as const
    },
    {
      id: 'daily_interaction',
      title: 'Connect with Family',
      description: 'Like or comment on family content',
      target: 3,
      current: 0,
      xpReward: 30,
      completed: false,
      category: 'interact' as const
    },
    {
      id: 'daily_share',
      title: 'Spread the Love',
      description: 'Share a memory with family members',
      target: 1,
      current: 0,
      xpReward: 40,
      completed: false,
      category: 'share' as const
    }
  ];

  // Randomize goals to keep it fresh
  return goals.sort(() => Math.random() - 0.5).slice(0, 2);
}

// Content prompts to encourage private vault building
export const CONTENT_PROMPTS = [
  {
    id: 'childhood_memory',
    title: 'Childhood Wonder',
    description: 'Preserve a favorite childhood memory in your private vault',
    category: 'memory' as const,
    difficulty: 'easy' as const,
    xpReward: 75,
    trending: true,
    examples: [
      'Your first day of school',
      'A special birthday celebration',
      'Learning to ride a bike'
    ]
  },
  {
    id: 'family_wisdom',
    title: 'Life Wisdom',
    description: 'Record important life lessons to pass down through generations',
    category: 'wisdom' as const,
    difficulty: 'medium' as const,
    xpReward: 125,
    trending: true,
    examples: [
      'Career advice you wish you had known',
      'Relationship wisdom from experience',
      'Financial lessons learned'
    ]
  },
  {
    id: 'family_recipe',
    title: 'Family Recipe',
    description: 'Preserve a cherished family recipe with its story',
    category: 'tradition' as const,
    difficulty: 'easy' as const,
    xpReward: 100,
    trending: false,
    examples: [
      'Grandmother\'s secret recipe',
      'Holiday cooking traditions',
      'Comfort food memories'
    ]
  },
  {
    id: 'voice_message',
    title: 'Voice of Love',
    description: 'Record an audio message for future family members',
    category: 'audio' as const,
    difficulty: 'medium' as const,
    xpReward: 150,
    trending: true,
    examples: [
      'Bedtime story you used to tell',
      'Singing a family song',
      'Sharing your hopes for them'
    ]
  },
  {
    id: 'time_capsule',
    title: 'Time Capsule',
    description: 'Create a time capsule to be opened in the future',
    category: 'time_capsule' as const,
    difficulty: 'hard' as const,
    xpReward: 200,
    trending: true,
    examples: [
      'Letter to your future grandchildren',
      'Predictions about the world in 20 years',
      'Current family photos and stories'
    ]
  },
  {
    id: 'family_values',
    title: 'Family Values',
    description: 'Document the core values that define your family',
    category: 'values' as const,
    difficulty: 'medium' as const,
    xpReward: 125,
    trending: false,
    examples: [
      'What family means to you',
      'Values you want to pass down',
      'Family mottos or sayings'
    ]
  },
  {
    id: 'milestone_moment',
    title: 'Milestone Moment',
    description: 'Capture an important life milestone in your vault',
    category: 'milestone' as const,
    difficulty: 'easy' as const,
    xpReward: 100,
    trending: false,
    examples: [
      'Graduation memories',
      'First job experiences',
      'Wedding day reflections'
    ]
  },
  {
    id: 'family_history',
    title: 'Family Origins',
    description: 'Research and document your family\'s history and origins',
    category: 'genealogy' as const,
    difficulty: 'hard' as const,
    xpReward: 175,
    trending: false,
    examples: [
      'Immigration stories',
      'Family tree discoveries',
      'Ancestral traditions'
    ]
  },
  {
    id: 'personal_growth',
    title: 'Growth Journey',
    description: 'Reflect on your personal growth and life lessons',
    category: 'reflection' as const,
    difficulty: 'medium' as const,
    xpReward: 100,
    trending: true,
    examples: [
      'Overcoming challenges',
      'Career journey insights',
      'Personal transformation stories'
    ]
  },
  {
    id: 'legacy_letter',
    title: 'Legacy Letter',
    description: 'Write a heartfelt letter to future generations',
    category: 'letter' as const,
    difficulty: 'hard' as const,
    xpReward: 200,
    trending: true,
    examples: [
      'Hopes for the future',
      'Family values to preserve',
      'Stories they should know'
    ]
  }
];

// Auto-save engagement data
if (browser) {
  engagementStore.subscribe(value => {
    if (value) {
      localStorage.setItem('loominary_engagement', JSON.stringify(value));
    }
  });
}