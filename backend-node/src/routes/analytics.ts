import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/events', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { event, properties } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    const analyticsEnabled = process.env.NEXT_PUBLIC_ANALYTICS === 'on';
    if (!analyticsEnabled) {
      return res.json({ success: true, tracked: false });
    }

    const prisma = require('../index').prisma;
    await prisma.analyticsEvent.create({
      data: {
        userId,
        event,
        properties: properties || {}
      }
    });

    res.json({ success: true, tracked: true });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

router.get('/metrics', authenticate, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, cohortTag } = req.query;
    
    const prisma = require('../index').prisma;
    
    const totalUsers = await prisma.user.count({
      where: cohortTag ? {
        email: { contains: cohortTag as string }
      } : {}
    });

    const activeUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      },
      _count: true
    });

    const eventCounts = await prisma.analyticsEvent.groupBy({
      by: ['event'],
      where: {
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      },
      _count: true
    });

    const events = await prisma.analyticsEvent.findMany({
      where: {
        event: 'time_in_app_heartbeat',
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const sessionLengthSeconds = events.length * 15;
    const avgSessionLengthMinutes = sessionLengthSeconds / 60 / (activeUsers.length || 1);

    const notificationsSent = await prisma.analyticsEvent.count({
      where: {
        event: 'notification_sent',
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      }
    });

    const notificationsOpened = await prisma.analyticsEvent.count({
      where: {
        event: 'notification_opened',
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      }
    });

    const notificationOpenRate = notificationsSent > 0 
      ? (notificationsOpened / notificationsSent * 100).toFixed(2)
      : 0;

    const firstValueEvents = await prisma.analyticsEvent.findMany({
      where: {
        event: 'memory_create',
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      },
      select: {
        userId: true,
        createdAt: true
      }
    });

    const userFirstEvents = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined
        }
      },
      _min: {
        createdAt: true
      }
    });

    const returnedUsers = new Set();
    for (const user of userFirstEvents) {
      const firstEventTime = user._min.createdAt;
      if (!firstEventTime) continue;

      const laterEvents = await prisma.analyticsEvent.count({
        where: {
          userId: user.userId,
          createdAt: {
            gt: new Date(firstEventTime.getTime() + 60000) // 1 minute later (compressed day)
          }
        }
      });

      if (laterEvents > 0) {
        returnedUsers.add(user.userId);
      }
    }

    const retentionRate = userFirstEvents.length > 0
      ? (returnedUsers.size / userFirstEvents.length * 100).toFixed(2)
      : 0;

    res.json({
      totalUsers,
      activeUsers: activeUsers.length,
      activationRate: ((activeUsers.length / totalUsers) * 100).toFixed(2) + '%',
      retentionRate: retentionRate + '%',
      avgSessionLengthMinutes: avgSessionLengthMinutes.toFixed(2),
      notificationOpenRate: notificationOpenRate + '%',
      eventCounts: eventCounts.map(e => ({
        event: e.event,
        count: e._count
      })),
      timeToFirstValue: firstValueEvents.length > 0 ? 'Calculated' : 'N/A'
    });
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
