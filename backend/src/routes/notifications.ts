import express from 'express';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';

const router = express.Router();

// Emotional reminder templates
const REMINDER_TEMPLATES = {
  voiceStory: [
    {
      title: "Your voice is irreplaceable",
      message: "Record a 2-minute story today",
      emotionalAppeal: "Someday, your grandchildren will play this recording and feel like you're right there with them.",
      icon: "mic",
      action: { label: "Record Now", route: "/record" }
    },
    {
      title: "They want to hear YOU",
      message: "Share a memory in your own words",
      emotionalAppeal: "Photos fade, but your voice carries your soul. What story have you been meaning to tell?",
      icon: "sparkles",
      action: { label: "Start Recording", route: "/record" }
    }
  ],
  memory: [
    {
      title: "A photo needs its story",
      message: "Add context to a recent memory",
      emotionalAppeal: "That photo on your phone? In 50 years, no one will know who's in it or why it mattered.",
      icon: "camera",
      action: { label: "Add Memory", route: "/memories" }
    },
    {
      title: "Don't let this moment fade",
      message: "Preserve today's memory",
      emotionalAppeal: "The small moments become the big ones. What happened today that you never want to forget?",
      icon: "star",
      action: { label: "Capture Now", route: "/memories" }
    }
  ],
  letter: [
    {
      title: "Words they'll read forever",
      message: "Write a letter to someone you love",
      emotionalAppeal: "There are things you want to say. Things they need to hear. Don't wait for the perfect moment.",
      icon: "envelope",
      action: { label: "Write Letter", route: "/compose" }
    },
    {
      title: "What would you tell them?",
      message: "Start a time-capsule letter",
      emotionalAppeal: "Imagine your child opening a letter from you on their wedding day. You can give them that gift today.",
      icon: "heart",
      action: { label: "Start Writing", route: "/compose" }
    }
  ],
  inactivity: [
    {
      title: "We miss you",
      message: "It's been a while since your last memory",
      emotionalAppeal: "Life gets busy, but memories don't wait. What's happened since we last heard from you?",
      icon: "clock",
      action: { label: "Come Back", route: "/dashboard" }
    }
  ],
  streak: [
    {
      title: "Keep your legacy alive!",
      message: "You're building something beautiful",
      emotionalAppeal: "Every day you show up is another day your story grows. Don't break the chain!",
      icon: "fire",
      action: { label: "Continue Streak", route: "/dashboard" }
    }
  ],
  milestone: [
    {
      title: "Congratulations!",
      message: "Your legacy is growing beautifully",
      emotionalAppeal: "You're doing something incredible for your family. Keep going!",
      icon: "trophy",
      action: { label: "View Journey", route: "/wrapped" }
    }
  ]
};

// Get random template from category
function getRandomTemplate(category: keyof typeof REMINDER_TEMPLATES) {
  const templates = REMINDER_TEMPLATES[category];
  return templates[Math.floor(Math.random() * templates.length)];
}

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.json(notifications);
}));

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId }
  });

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: {
      read: true,
      readAt: new Date()
    }
  });

  res.json(updated);
}));

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post('/mark-all-read', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: {
      read: true,
      readAt: new Date()
    }
  });

  res.json({ success: true });
}));

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId }
  });

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  await prisma.notification.delete({
    where: { id }
  });

  res.json({ success: true });
}));

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id;

  const count = await prisma.notification.count({
    where: { userId, read: false }
  });

  res.json({ count });
}));

// Schedule daily reminders function (called from server startup)
export function scheduleDailyReminders() {
  console.log('[Notifications] Daily reminder scheduling initialized');
  // In production, this would use node-cron to schedule reminders
  // For now, we just log that it's initialized
}

export default router;
