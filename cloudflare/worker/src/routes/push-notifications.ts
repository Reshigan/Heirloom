import { Hono } from 'hono';
import type { AppEnv } from '../index';

export const pushNotificationRoutes = new Hono<AppEnv>();

interface DeviceToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  appVersion?: string;
  osVersion?: string;
}

interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
}

pushNotificationRoutes.post('/register', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json() as DeviceToken;
  
  const { token, platform, deviceName, appVersion, osVersion } = body;
  
  if (!token || !platform) {
    return c.json({ error: 'Token and platform are required' }, 400);
  }
  
  if (!['ios', 'android', 'web'].includes(platform)) {
    return c.json({ error: 'Invalid platform. Must be ios, android, or web' }, 400);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  try {
    await c.env.DB.prepare(`
      INSERT INTO device_tokens (id, user_id, token, platform, device_name, app_version, os_version, is_active, last_used_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      ON CONFLICT(user_id, token) DO UPDATE SET
        platform = excluded.platform,
        device_name = excluded.device_name,
        app_version = excluded.app_version,
        os_version = excluded.os_version,
        is_active = 1,
        last_used_at = excluded.last_used_at,
        updated_at = excluded.updated_at
    `).bind(id, userId, token, platform, deviceName || null, appVersion || null, osVersion || null, now, now, now).run();
    
    return c.json({ success: true, message: 'Device registered for push notifications' });
  } catch (error: any) {
    console.error('Failed to register device token:', error);
    return c.json({ error: 'Failed to register device' }, 500);
  }
});

pushNotificationRoutes.delete('/unregister', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const { token } = body;
  
  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }
  
  const now = new Date().toISOString();
  
  try {
    await c.env.DB.prepare(`
      UPDATE device_tokens 
      SET is_active = 0, updated_at = ?
      WHERE user_id = ? AND token = ?
    `).bind(now, userId, token).run();
    
    return c.json({ success: true, message: 'Device unregistered from push notifications' });
  } catch (error: any) {
    console.error('Failed to unregister device token:', error);
    return c.json({ error: 'Failed to unregister device' }, 500);
  }
});

pushNotificationRoutes.get('/devices', async (c) => {
  const userId = c.get('userId');
  
  try {
    const devices = await c.env.DB.prepare(`
      SELECT id, platform, device_name, app_version, os_version, is_active, last_used_at, created_at
      FROM device_tokens
      WHERE user_id = ? AND is_active = 1
      ORDER BY last_used_at DESC
    `).bind(userId).all();
    
    return c.json({
      devices: devices.results.map((d: any) => ({
        id: d.id,
        platform: d.platform,
        deviceName: d.device_name,
        appVersion: d.app_version,
        osVersion: d.os_version,
        lastUsedAt: d.last_used_at,
        createdAt: d.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Failed to get devices:', error);
    return c.json({ error: 'Failed to get devices' }, 500);
  }
});

pushNotificationRoutes.get('/preferences', async (c) => {
  const userId = c.get('userId');
  
  try {
    let prefs = await c.env.DB.prepare(`
      SELECT * FROM notification_preferences WHERE user_id = ?
    `).bind(userId).first();
    
    if (!prefs) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await c.env.DB.prepare(`
        INSERT INTO notification_preferences (id, user_id, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).bind(id, userId, now, now).run();
      
      prefs = await c.env.DB.prepare(`
        SELECT * FROM notification_preferences WHERE user_id = ?
      `).bind(userId).first();
    }
    
    return c.json({
      pushEnabled: !!prefs?.push_enabled,
      dailyReminders: !!prefs?.daily_reminders,
      weeklyDigest: !!prefs?.weekly_digest,
      streakAlerts: !!prefs?.streak_alerts,
      familyActivity: !!prefs?.family_activity,
      milestoneAlerts: !!prefs?.milestone_alerts,
      quietHoursStart: prefs?.quiet_hours_start || '22:00',
      quietHoursEnd: prefs?.quiet_hours_end || '08:00',
      preferredTime: prefs?.preferred_time || '09:00',
    });
  } catch (error: any) {
    console.error('Failed to get notification preferences:', error);
    return c.json({ error: 'Failed to get preferences' }, 500);
  }
});

pushNotificationRoutes.patch('/preferences', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  const {
    pushEnabled,
    dailyReminders,
    weeklyDigest,
    streakAlerts,
    familyActivity,
    milestoneAlerts,
    quietHoursStart,
    quietHoursEnd,
    preferredTime,
  } = body;
  
  try {
    let existing = await c.env.DB.prepare(`
      SELECT id FROM notification_preferences WHERE user_id = ?
    `).bind(userId).first();
    
    if (!existing) {
      const id = crypto.randomUUID();
      await c.env.DB.prepare(`
        INSERT INTO notification_preferences (id, user_id, push_enabled, daily_reminders, weekly_digest, streak_alerts, family_activity, milestone_alerts, quiet_hours_start, quiet_hours_end, preferred_time, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, userId,
        pushEnabled !== undefined ? (pushEnabled ? 1 : 0) : 1,
        dailyReminders !== undefined ? (dailyReminders ? 1 : 0) : 1,
        weeklyDigest !== undefined ? (weeklyDigest ? 1 : 0) : 1,
        streakAlerts !== undefined ? (streakAlerts ? 1 : 0) : 1,
        familyActivity !== undefined ? (familyActivity ? 1 : 0) : 1,
        milestoneAlerts !== undefined ? (milestoneAlerts ? 1 : 0) : 1,
        quietHoursStart || '22:00',
        quietHoursEnd || '08:00',
        preferredTime || '09:00',
        now, now
      ).run();
    } else {
      await c.env.DB.prepare(`
        UPDATE notification_preferences SET
          push_enabled = COALESCE(?, push_enabled),
          daily_reminders = COALESCE(?, daily_reminders),
          weekly_digest = COALESCE(?, weekly_digest),
          streak_alerts = COALESCE(?, streak_alerts),
          family_activity = COALESCE(?, family_activity),
          milestone_alerts = COALESCE(?, milestone_alerts),
          quiet_hours_start = COALESCE(?, quiet_hours_start),
          quiet_hours_end = COALESCE(?, quiet_hours_end),
          preferred_time = COALESCE(?, preferred_time),
          updated_at = ?
        WHERE user_id = ?
      `).bind(
        pushEnabled !== undefined ? (pushEnabled ? 1 : 0) : null,
        dailyReminders !== undefined ? (dailyReminders ? 1 : 0) : null,
        weeklyDigest !== undefined ? (weeklyDigest ? 1 : 0) : null,
        streakAlerts !== undefined ? (streakAlerts ? 1 : 0) : null,
        familyActivity !== undefined ? (familyActivity ? 1 : 0) : null,
        milestoneAlerts !== undefined ? (milestoneAlerts ? 1 : 0) : null,
        quietHoursStart || null,
        quietHoursEnd || null,
        preferredTime || null,
        now, userId
      ).run();
    }
    
    return c.json({ success: true, message: 'Preferences updated' });
  } catch (error: any) {
    console.error('Failed to update notification preferences:', error);
    return c.json({ error: 'Failed to update preferences' }, 500);
  }
});

pushNotificationRoutes.get('/badge-count', async (c) => {
  const userId = c.get('userId');
  
  try {
    const result = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND read = 0
    `).bind(userId).first();
    
    return c.json({ badgeCount: result?.count || 0 });
  } catch (error: any) {
    console.error('Failed to get badge count:', error);
    return c.json({ badgeCount: 0 });
  }
});

pushNotificationRoutes.post('/send-test', async (c) => {
  const userId = c.get('userId');
  
  try {
    const devices = await c.env.DB.prepare(`
      SELECT token, platform FROM device_tokens
      WHERE user_id = ? AND is_active = 1
    `).bind(userId).all();
    
    if (devices.results.length === 0) {
      return c.json({ error: 'No registered devices found' }, 400);
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await c.env.DB.prepare(`
      INSERT INTO push_notification_queue (id, user_id, title, body, data, badge_count, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      id, userId,
      'Test Notification',
      'Push notifications are working! Your memories are safe.',
      JSON.stringify({ type: 'test', route: '/dashboard' }),
      0,
      now, now
    ).run();
    
    return c.json({ 
      success: true, 
      message: 'Test notification queued',
      deviceCount: devices.results.length,
    });
  } catch (error: any) {
    console.error('Failed to send test notification:', error);
    return c.json({ error: 'Failed to send test notification' }, 500);
  }
});

export async function sendPushToUser(
  env: any,
  userId: string,
  notification: PushNotification
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  try {
    const devices = await env.DB.prepare(`
      SELECT token, platform FROM device_tokens
      WHERE user_id = ? AND is_active = 1
    `).bind(userId).all();
    
    if (devices.results.length === 0) {
      return { success: false, sentCount: 0, error: 'No registered devices' };
    }
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await env.DB.prepare(`
      INSERT INTO push_notification_queue (id, user_id, title, body, data, badge_count, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      id, userId,
      notification.title,
      notification.body,
      notification.data ? JSON.stringify(notification.data) : null,
      notification.badge || 0,
      now, now
    ).run();
    
    return { success: true, sentCount: devices.results.length };
  } catch (error: any) {
    console.error('Failed to queue push notification:', error);
    return { success: false, sentCount: 0, error: error.message };
  }
}

export async function sendPushToAllUsers(
  env: any,
  notification: PushNotification,
  filter?: { hasStreak?: boolean; inactive?: boolean }
): Promise<{ success: boolean; queuedCount: number }> {
  try {
    let query = `
      SELECT DISTINCT dt.user_id 
      FROM device_tokens dt
      JOIN notification_preferences np ON dt.user_id = np.user_id
      WHERE dt.is_active = 1 AND np.push_enabled = 1
    `;
    
    const users = await env.DB.prepare(query).all();
    const now = new Date().toISOString();
    
    for (const user of users.results as any[]) {
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO push_notification_queue (id, user_id, title, body, data, badge_count, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        id, user.user_id,
        notification.title,
        notification.body,
        notification.data ? JSON.stringify(notification.data) : null,
        notification.badge || 0,
        now, now
      ).run();
    }
    
    return { success: true, queuedCount: users.results.length };
  } catch (error: any) {
    console.error('Failed to queue push notifications:', error);
    return { success: false, queuedCount: 0 };
  }
}

export default pushNotificationRoutes;
