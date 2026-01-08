import type { Env } from '../index';

interface QueuedNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: string | null;
  badge_count: number;
  status: string;
  created_at: string;
}

interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
}

interface APNsConfig {
  teamId: string;
  keyId: string;
  privateKey: string;
  bundleId: string;
  production: boolean;
}

interface FCMConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

async function generateAPNsJWT(config: APNsConfig): Promise<string> {
  const header = {
    alg: 'ES256',
    kid: config.keyId,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.teamId,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKeyPem = config.privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const privateKeyBuffer = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureArray = new Uint8Array(signature);
  const encodedSignature = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsignedToken}.${encodedSignature}`;
}

async function sendAPNs(
  token: string,
  notification: { title: string; body: string; data?: Record<string, string>; badge?: number },
  config: APNsConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const jwt = await generateAPNsJWT(config);
    const endpoint = config.production
      ? `https://api.push.apple.com/3/device/${token}`
      : `https://api.sandbox.push.apple.com/3/device/${token}`;

    const payload = {
      aps: {
        alert: {
          title: notification.title,
          body: notification.body,
        },
        badge: notification.badge || 0,
        sound: 'default',
      },
      ...notification.data,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': config.bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorBody = await response.text();
    console.error(`APNs error: ${response.status} - ${errorBody}`);
    return { success: false, error: `APNs ${response.status}: ${errorBody}` };
  } catch (error: any) {
    console.error('APNs send error:', error);
    return { success: false, error: error.message };
  }
}

async function generateFCMAccessToken(config: FCMConfig): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: config.clientEmail,
    sub: config.clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKeyPem = config.privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const privateKeyBuffer = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureArray = new Uint8Array(signature);
  const encodedSignature = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${encodedSignature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json() as { access_token: string };
  return tokenData.access_token;
}

async function sendFCM(
  token: string,
  notification: { title: string; body: string; data?: Record<string, string>; badge?: number },
  config: FCMConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await generateFCMAccessToken(config);
    const endpoint = `https://fcm.googleapis.com/v1/projects/${config.projectId}/messages:send`;

    const message = {
      message: {
        token: token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            notification_count: notification.badge || 0,
          },
        },
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      return { success: true };
    }

    const errorBody = await response.text();
    console.error(`FCM error: ${response.status} - ${errorBody}`);
    return { success: false, error: `FCM ${response.status}: ${errorBody}` };
  } catch (error: any) {
    console.error('FCM send error:', error);
    return { success: false, error: error.message };
  }
}

export async function processPushNotificationQueue(env: Env): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const result = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  const hasAPNsConfig = env.APNS_TEAM_ID && env.APNS_KEY_ID && env.APNS_PRIVATE_KEY && env.APNS_BUNDLE_ID;
  const hasFCMConfig = env.FCM_PROJECT_ID && env.FCM_PRIVATE_KEY && env.FCM_CLIENT_EMAIL;

  if (!hasAPNsConfig && !hasFCMConfig) {
    console.log('Push notification credentials not configured. Skipping queue processing.');
    return result;
  }

  const apnsConfig: APNsConfig | null = hasAPNsConfig ? {
    teamId: env.APNS_TEAM_ID!,
    keyId: env.APNS_KEY_ID!,
    privateKey: env.APNS_PRIVATE_KEY!,
    bundleId: env.APNS_BUNDLE_ID!,
    production: env.ENVIRONMENT === 'production',
  } : null;

  const fcmConfig: FCMConfig | null = hasFCMConfig ? {
    projectId: env.FCM_PROJECT_ID!,
    privateKey: env.FCM_PRIVATE_KEY!,
    clientEmail: env.FCM_CLIENT_EMAIL!,
  } : null;

  try {
    const pendingNotifications = await env.DB.prepare(`
      SELECT id, user_id, title, body, data, badge_count, status, created_at
      FROM push_notification_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 100
    `).all();

    for (const notification of pendingNotifications.results as unknown as QueuedNotification[]) {
      result.processed++;

      const devices = await env.DB.prepare(`
        SELECT id, user_id, token, platform
        FROM device_tokens
        WHERE user_id = ? AND is_active = 1
      `).bind(notification.user_id).all();

      if (devices.results.length === 0) {
        await env.DB.prepare(`
          UPDATE push_notification_queue
          SET status = 'skipped', error_message = 'No active devices', updated_at = ?
          WHERE id = ?
        `).bind(new Date().toISOString(), notification.id).run();
        result.skipped++;
        continue;
      }

      const notificationData = notification.data ? JSON.parse(notification.data) : undefined;
      let sentToAny = false;
      const errors: string[] = [];

      for (const device of devices.results as unknown as DeviceToken[]) {
        let sendResult: { success: boolean; error?: string };

        if (device.platform === 'ios' && apnsConfig) {
          sendResult = await sendAPNs(device.token, {
            title: notification.title,
            body: notification.body,
            data: notificationData,
            badge: notification.badge_count,
          }, apnsConfig);
        } else if (device.platform === 'android' && fcmConfig) {
          sendResult = await sendFCM(device.token, {
            title: notification.title,
            body: notification.body,
            data: notificationData,
            badge: notification.badge_count,
          }, fcmConfig);
        } else {
          sendResult = { success: false, error: `No config for platform: ${device.platform}` };
        }

        if (sendResult.success) {
          sentToAny = true;
          await env.DB.prepare(`
            UPDATE device_tokens SET last_used_at = ? WHERE id = ?
          `).bind(new Date().toISOString(), device.id).run();
        } else {
          errors.push(`${device.platform}: ${sendResult.error}`);
          if (sendResult.error?.includes('Unregistered') || sendResult.error?.includes('InvalidRegistration')) {
            await env.DB.prepare(`
              UPDATE device_tokens SET is_active = 0, updated_at = ? WHERE id = ?
            `).bind(new Date().toISOString(), device.id).run();
          }
        }
      }

      const now = new Date().toISOString();
      if (sentToAny) {
        await env.DB.prepare(`
          UPDATE push_notification_queue
          SET status = 'sent', sent_at = ?, updated_at = ?
          WHERE id = ?
        `).bind(now, now, notification.id).run();
        result.sent++;
      } else {
        await env.DB.prepare(`
          UPDATE push_notification_queue
          SET status = 'failed', error_message = ?, updated_at = ?
          WHERE id = ?
        `).bind(errors.join('; '), now, notification.id).run();
        result.failed++;
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error processing push notification queue:', error);
    return result;
  }
}

export async function cleanupOldNotifications(env: Env): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const result = await env.DB.prepare(`
    DELETE FROM push_notification_queue
    WHERE created_at < ? AND status IN ('sent', 'failed', 'skipped')
  `).bind(thirtyDaysAgo).run();

  return result.meta.changes || 0;
}
