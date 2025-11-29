import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationService, broadcaster } from '../services/NotificationService';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/notifications', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const sinceId = req.query.sinceId ? BigInt(req.query.sinceId as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await notificationService.list({
      userId,
      sinceId,
      limit,
      unreadOnly,
    });

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.json({
      notifications,
      unreadCount,
      nextSinceId: notifications.length > 0 ? notifications[0].id.toString() : null,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/notifications/mark-read', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { ids } = req.body;

    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }

    const bigIntIds = ids.map((id: string) => BigInt(id));
    await notificationService.markRead(userId, bigIntIds);

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

router.post('/notifications/mark-all-seen', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await notificationService.markAllSeen(userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as seen:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as seen' });
  }
});

router.get('/notifications/stream', async (req: Request, res: Response) => {
  let token: string | undefined;

  if (req.cookies?.heirloom_token) {
    token = req.cookies.heirloom_token;
  }
  
  if (!token && req.query.token) {
    token = req.query.token as string;
  }
  
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  let userId: string;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    userId = decoded.userId;
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (res.flushHeaders) {
    res.flushHeaders();
  }

  res.write('retry: 10000\n\n');

  const lastEventId = req.headers['last-event-id'];
  if (lastEventId) {
    try {
      const sinceId = BigInt(lastEventId as string);
      const backlog = await notificationService.list({
        userId,
        sinceId,
        limit: 100,
      });

      backlog.reverse().forEach((notification: any) => {
        const data = JSON.stringify(notification);
        res.write(`id: ${notification.id}\ndata: ${data}\n\n`);
      });
    } catch (error) {
      console.error('Error sending backlog:', error);
    }
  }

  broadcaster.addConnection(userId, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (error) {
      clearInterval(heartbeat);
      broadcaster.removeConnection(userId, res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    broadcaster.removeConnection(userId, res);
  });
});

router.get('/notifications/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const user = await require('../index').prisma.user.findUnique({
      where: { id: userId },
      select: { notificationSettings: true }
    });

    const defaultSettings = {
      weekly_digest: true,
      daily_reminders: false,
      new_comments: true,
      new_memories: true,
      birthdays: true,
      anniversaries: true,
      story_prompts: true,
      family_activity: true,
      email_notifications: true,
      push_notifications: false
    };

    res.json(user?.notificationSettings || defaultSettings);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

router.put('/notifications/settings', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const settings = req.body;

    await require('../index').prisma.user.update({
      where: { id: userId },
      data: { notificationSettings: settings }
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

export default router;
