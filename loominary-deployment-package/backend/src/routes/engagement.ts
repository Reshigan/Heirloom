import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// XP rewards for different actions
const XP_REWARDS = {
  // Content creation
  CREATE_MEMORY: 50,
  CREATE_STORY: 100,
  UPLOAD_PHOTO: 25,
  ADD_AUDIO: 75,
  CREATE_TIME_CAPSULE: 150,
  
  // Social interactions
  SHARE_MEMORY: 30,
  COMMENT: 20,
  LIKE: 10,
  INVITE_FAMILY: 200,
  
  // Engagement
  DAILY_LOGIN: 25,
  COMPLETE_PROFILE: 100,
  FIRST_WEEK_ACTIVE: 500,
  
  // Referrals
  SUCCESSFUL_REFERRAL: 1000,
  
  // Milestones
  FIRST_MEMORY: 100,
  TENTH_MEMORY: 250,
  HUNDREDTH_MEMORY: 1000,
  
  // Streaks
  SEVEN_DAY_STREAK: 200,
  THIRTY_DAY_STREAK: 1000,
  HUNDRED_DAY_STREAK: 5000
};

// Achievement definitions
const ACHIEVEMENTS = {
  MEMORY_KEEPER: {
    id: 'memory_keeper',
    title: 'Memory Keeper',
    description: 'Create your first memory',
    icon: '📝',
    category: 'content',
    xpReward: 100,
    rarity: 'common',
    condition: (stats: any) => stats.memoriesCreated >= 1
  },
  
  STORYTELLER: {
    id: 'storyteller',
    title: 'Family Storyteller',
    description: 'Create 10 memories',
    icon: '📚',
    category: 'content',
    xpReward: 250,
    rarity: 'rare',
    condition: (stats: any) => stats.memoriesCreated >= 10
  },
  
  ARCHIVIST: {
    id: 'archivist',
    title: 'Family Archivist',
    description: 'Create 50 memories',
    icon: '🏛️',
    category: 'content',
    xpReward: 1000,
    rarity: 'epic',
    condition: (stats: any) => stats.memoriesCreated >= 50
  },
  
  CONNECTOR: {
    id: 'connector',
    title: 'Family Connector',
    description: 'Invite 5 family members',
    icon: '🤝',
    category: 'social',
    xpReward: 500,
    rarity: 'rare',
    condition: (stats: any) => stats.referralsCount >= 5
  },
  
  DEDICATED: {
    id: 'dedicated',
    title: 'Dedicated Keeper',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    xpReward: 200,
    rarity: 'common',
    condition: (stats: any) => stats.streak >= 7
  },
  
  COMMITTED: {
    id: 'committed',
    title: 'Committed Guardian',
    description: 'Maintain a 30-day streak',
    icon: '⚡',
    category: 'streak',
    xpReward: 1000,
    rarity: 'epic',
    condition: (stats: any) => stats.streak >= 30
  },
  
  AMBASSADOR: {
    id: 'ambassador',
    title: 'Loominary Ambassador',
    description: 'Successfully refer 3 new users',
    icon: '👑',
    category: 'referral',
    xpReward: 2000,
    rarity: 'legendary',
    condition: (stats: any) => stats.successfulReferrals >= 3
  }
};

// Content prompts to encourage posting
const CONTENT_PROMPTS = [
  {
    id: 'childhood_memory',
    title: 'Childhood Wonder',
    description: 'Share a favorite childhood memory that still makes you smile',
    category: 'memory',
    difficulty: 'easy',
    xpReward: 75,
    trending: true,
    examples: [
      'Your first day of school',
      'A special birthday celebration',
      'Learning to ride a bike'
    ]
  },
  {
    id: 'family_tradition',
    title: 'Family Traditions',
    description: 'Document a unique tradition your family has',
    category: 'tradition',
    difficulty: 'medium',
    xpReward: 100,
    trending: false,
    examples: [
      'Holiday celebrations',
      'Sunday family dinners',
      'Annual vacation spots'
    ]
  },
  {
    id: 'wisdom_shared',
    title: 'Words of Wisdom',
    description: 'Share advice or wisdom from an elder in your family',
    category: 'wisdom',
    difficulty: 'medium',
    xpReward: 125,
    trending: true,
    examples: [
      'Life lessons from grandparents',
      'Career advice from parents',
      'Relationship wisdom'
    ]
  },
  {
    id: 'photo_story',
    title: 'Picture Perfect',
    description: 'Upload a meaningful photo and tell its story',
    category: 'photo',
    difficulty: 'easy',
    xpReward: 60,
    trending: false,
    examples: [
      'Wedding photos',
      'Baby pictures',
      'Family gatherings'
    ]
  },
  {
    id: 'legacy_letter',
    title: 'Legacy Letter',
    description: 'Write a letter to future generations of your family',
    category: 'story',
    difficulty: 'hard',
    xpReward: 200,
    trending: true,
    examples: [
      'Hopes for the future',
      'Family values to preserve',
      'Stories they should know'
    ]
  }
];

// Get user engagement data
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get or create user engagement record
    let engagement = await prisma.userEngagement.findUnique({
      where: { userId },
      include: {
        achievements: true,
        dailyGoals: true
      }
    });

    if (!engagement) {
      // Create initial engagement record
      engagement = await prisma.userEngagement.create({
        data: {
          userId,
          level: 1,
          xp: 0,
          streak: 0,
          lastActivity: new Date(),
          socialConnections: 0,
          contentCreated: 0,
          contentShared: 0,
          referralsCount: 0
        },
        include: {
          achievements: true,
          dailyGoals: true
        }
      });

      // Create initial daily goals
      await generateDailyGoals(userId);
    }

    // Update last activity
    await prisma.userEngagement.update({
      where: { userId },
      data: { lastActivity: new Date() }
    });

    res.json(engagement);
  } catch (error) {
    logger.error('Failed to get user engagement:', error);
    res.status(500).json({ message: 'Failed to get engagement data' });
  }
});

// Track user action and award XP
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const { action, metadata } = req.body;
    const userId = req.user.id;

    const xpReward = XP_REWARDS[action as keyof typeof XP_REWARDS] || 0;
    
    // Get current engagement
    const engagement = await prisma.userEngagement.findUnique({
      where: { userId },
      include: { achievements: true }
    });

    if (!engagement) {
      return res.status(404).json({ message: 'User engagement not found' });
    }

    // Calculate new XP and level
    const newXP = engagement.xp + xpReward;
    const newLevel = Math.floor(newXP / 1000) + 1;

    // Update engagement
    await prisma.userEngagement.update({
      where: { userId },
      data: {
        xp: newXP,
        level: newLevel,
        lastActivity: new Date(),
        // Update specific counters based on action
        ...(action === 'CREATE_MEMORY' && { contentCreated: engagement.contentCreated + 1 }),
        ...(action === 'SHARE_MEMORY' && { contentShared: engagement.contentShared + 1 }),
        ...(action === 'INVITE_FAMILY' && { socialConnections: engagement.socialConnections + 1 })
      }
    });

    // Check for new achievements
    const userStats = {
      memoriesCreated: engagement.contentCreated + (action === 'CREATE_MEMORY' ? 1 : 0),
      referralsCount: engagement.referralsCount,
      successfulReferrals: engagement.referralsCount, // Simplified for now
      streak: engagement.streak
    };

    const newAchievements = [];
    const existingAchievementIds = engagement.achievements.map(a => a.achievementId);

    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (!existingAchievementIds.includes(achievement.id) && achievement.condition(userStats)) {
        // Award achievement
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            xpReward: achievement.xpReward,
            rarity: achievement.rarity,
            unlockedAt: new Date()
          }
        });

        newAchievements.push(achievement);

        // Award achievement XP
        await prisma.userEngagement.update({
          where: { userId },
          data: { xp: newXP + achievement.xpReward }
        });
      }
    }

    // Log the action
    await prisma.userAction.create({
      data: {
        userId,
        action,
        xpAwarded: xpReward,
        metadata: metadata ? JSON.stringify(metadata) : null,
        timestamp: new Date()
      }
    });

    res.json({
      xpAwarded: xpReward,
      newXP: newXP + newAchievements.reduce((sum, a) => sum + a.xpReward, 0),
      newLevel,
      newAchievements
    });
  } catch (error) {
    logger.error('Failed to track action:', error);
    res.status(500).json({ message: 'Failed to track action' });
  }
});

// Update user streak
router.post('/streak', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const engagement = await prisma.userEngagement.findUnique({
      where: { userId }
    });

    if (!engagement) {
      return res.status(404).json({ message: 'User engagement not found' });
    }

    const now = new Date();
    const lastActivity = new Date(engagement.lastActivity);
    const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    let newStreak = engagement.streak;
    let streakBonus = 0;

    if (daysDiff === 1) {
      // Consecutive day - increment streak
      newStreak = engagement.streak + 1;
      
      // Award streak bonuses
      if (newStreak === 7) streakBonus = XP_REWARDS.SEVEN_DAY_STREAK;
      else if (newStreak === 30) streakBonus = XP_REWARDS.THIRTY_DAY_STREAK;
      else if (newStreak === 100) streakBonus = XP_REWARDS.HUNDRED_DAY_STREAK;
      else if (newStreak % 7 === 0) streakBonus = 50; // Weekly bonus
      
    } else if (daysDiff > 1) {
      // Streak broken - reset to 1
      newStreak = 1;
    }
    // If daysDiff === 0, same day - no change to streak

    // Update engagement
    await prisma.userEngagement.update({
      where: { userId },
      data: {
        streak: newStreak,
        xp: engagement.xp + streakBonus,
        lastActivity: now
      }
    });

    res.json({
      streak: newStreak,
      streakBonus
    });
  } catch (error) {
    logger.error('Failed to update streak:', error);
    res.status(500).json({ message: 'Failed to update streak' });
  }
});

// Get daily content prompts
router.get('/prompts/daily', authenticateToken, async (req, res) => {
  try {
    // Rotate prompts based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const startIndex = dayOfYear % CONTENT_PROMPTS.length;
    
    const dailyPrompts = [
      ...CONTENT_PROMPTS.slice(startIndex),
      ...CONTENT_PROMPTS.slice(0, startIndex)
    ].slice(0, 3);

    res.json(dailyPrompts);
  } catch (error) {
    logger.error('Failed to get daily prompts:', error);
    res.status(500).json({ message: 'Failed to get daily prompts' });
  }
});

// Complete daily goal
router.post('/goals/:goalId/complete', authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;
    const userId = req.user.id;

    const goal = await prisma.dailyGoal.findFirst({
      where: {
        id: goalId,
        userId,
        completed: false
      }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found or already completed' });
    }

    // Mark goal as completed
    await prisma.dailyGoal.update({
      where: { id: goalId },
      data: { completed: true }
    });

    // Award XP
    await prisma.userEngagement.update({
      where: { userId },
      data: {
        xp: {
          increment: goal.xpReward
        }
      }
    });

    res.json({
      xpReward: goal.xpReward
    });
  } catch (error) {
    logger.error('Failed to complete daily goal:', error);
    res.status(500).json({ message: 'Failed to complete goal' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { type = 'weekly' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (type === 'weekly') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { lastActivity: { gte: weekStart } };
    } else if (type === 'monthly') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { lastActivity: { gte: monthStart } };
    }

    const leaderboard = await prisma.userEngagement.findMany({
      where: dateFilter,
      orderBy: { xp: 'desc' },
      take: 50,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.json(leaderboard.map((entry, index) => ({
      position: index + 1,
      user: entry.user,
      xp: entry.xp,
      level: entry.level,
      streak: entry.streak
    })));
  } catch (error) {
    logger.error('Failed to get leaderboard:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
});

// Get user's leaderboard position
router.get('/leaderboard/position', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userEngagement = await prisma.userEngagement.findUnique({
      where: { userId }
    });

    if (!userEngagement) {
      return res.status(404).json({ message: 'User engagement not found' });
    }

    // Count users with higher XP
    const higherXPCount = await prisma.userEngagement.count({
      where: {
        xp: { gt: userEngagement.xp }
      }
    });

    res.json({
      position: higherXPCount + 1,
      xp: userEngagement.xp,
      level: userEngagement.level
    });
  } catch (error) {
    logger.error('Failed to get leaderboard position:', error);
    res.status(500).json({ message: 'Failed to get position' });
  }
});

// Get current weekly challenge
router.get('/challenges/current', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    let challenge = await prisma.weeklyChallenge.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    if (!challenge) {
      // Create a new weekly challenge
      const challenges = [
        {
          title: 'Memory Marathon',
          description: 'Create 5 new memories this week',
          target: 5,
          reward: '500 bonus XP',
          xpReward: 500
        },
        {
          title: 'Family Connector',
          description: 'Invite 3 family members to join',
          target: 3,
          reward: '1000 bonus XP',
          xpReward: 1000
        },
        {
          title: 'Story Weaver',
          description: 'Generate 2 AI stories from your memories',
          target: 2,
          reward: '750 bonus XP',
          xpReward: 750
        }
      ];

      const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
      
      challenge = await prisma.weeklyChallenge.create({
        data: {
          ...randomChallenge,
          startDate: weekStart,
          endDate: weekEnd,
          participants: 0,
          current: 0
        }
      });
    }

    // Get user's progress for this challenge
    const userProgress = await prisma.challengeParticipation.findFirst({
      where: {
        userId: req.user.id,
        challengeId: challenge.id
      }
    });

    res.json({
      ...challenge,
      current: userProgress?.progress || 0
    });
  } catch (error) {
    logger.error('Failed to get current challenge:', error);
    res.status(500).json({ message: 'Failed to get challenge' });
  }
});

// Helper function to generate daily goals
async function generateDailyGoals(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if goals already exist for today
  const existingGoals = await prisma.dailyGoal.findMany({
    where: {
      userId,
      createdAt: { gte: today }
    }
  });

  if (existingGoals.length > 0) {
    return existingGoals;
  }

  const goalTemplates = [
    {
      title: 'Share a Memory',
      description: 'Create or add to a family memory today',
      target: 1,
      xpReward: 50,
      category: 'post'
    },
    {
      title: 'Connect with Family',
      description: 'Like or comment on family content',
      target: 3,
      xpReward: 30,
      category: 'interact'
    },
    {
      title: 'Spread the Love',
      description: 'Share a memory with family members',
      target: 1,
      xpReward: 40,
      category: 'share'
    },
    {
      title: 'Explore Features',
      description: 'Try a new feature like AI stories or time capsules',
      target: 1,
      xpReward: 60,
      category: 'explore'
    }
  ];

  // Create 2-3 random goals for the day
  const selectedGoals = goalTemplates
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 2) + 2);

  const createdGoals = await Promise.all(
    selectedGoals.map(goal =>
      prisma.dailyGoal.create({
        data: {
          ...goal,
          userId,
          current: 0,
          completed: false
        }
      })
    )
  );

  return createdGoals;
}

export default router;