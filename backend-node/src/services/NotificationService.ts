import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title?: string;
  body?: string;
  actionUrl?: string;
  metadata?: any;
  priority?: number;
  dedupeKey?: string;
  expiresAt?: Date;
}

export interface ListNotificationsParams {
  userId: string;
  sinceId?: bigint;
  limit?: number;
  unreadOnly?: boolean;
}

class NotificationService {
  private broadcaster: NotificationBroadcaster;

  constructor(broadcaster: NotificationBroadcaster) {
    this.broadcaster = broadcaster;
  }

  async create(params: CreateNotificationParams) {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        actionUrl: params.actionUrl,
        metadata: params.metadata,
        priority: params.priority ?? 0,
        dedupeKey: params.dedupeKey,
        expiresAt: params.expiresAt,
      },
    });

    this.broadcaster.emit(params.userId, notification);

    return notification;
  }

  async createWithDedupe(params: CreateNotificationParams) {
    if (!params.dedupeKey) {
      return this.create(params);
    }

    try {
      return await this.create(params);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  async list(params: ListNotificationsParams) {
    const where: any = {
      userId: params.userId,
    };

    if (params.sinceId) {
      where.id = { gt: params.sinceId };
    }

    if (params.unreadOnly) {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 50,
    });

    return notifications;
  }

  async markRead(userId: string, ids: bigint[]) {
    await prisma.notification.updateMany({
      where: {
        userId,
        id: { in: ids },
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllSeen(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        seenAt: null,
      },
      data: {
        seenAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async deleteExpired() {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}

export class NotificationBroadcaster {
  private connections: Map<string, Set<any>> = new Map();

  addConnection(userId: string, res: any) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(res);
  }

  removeConnection(userId: string, res: any) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(res);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  emit(userId: string, notification: any) {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    const data = JSON.stringify(notification);
    const message = `id: ${notification.id}\ndata: ${data}\n\n`;

    userConnections.forEach((res) => {
      try {
        res.write(message);
      } catch (error) {
        console.error('Failed to send notification to connection:', error);
        this.removeConnection(userId, res);
      }
    });
  }

  getConnectionCount(userId?: string): number {
    if (userId) {
      return this.connections.get(userId)?.size ?? 0;
    }
    let total = 0;
    this.connections.forEach((conns) => {
      total += conns.size;
    });
    return total;
  }
}

export const broadcaster = new NotificationBroadcaster();
export const notificationService = new NotificationService(broadcaster);
