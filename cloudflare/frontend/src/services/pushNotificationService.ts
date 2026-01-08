import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import api from './api';

interface PushNotificationState {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
  permission: 'prompt' | 'granted' | 'denied';
}

const state: PushNotificationState = {
  isSupported: false,
  isRegistered: false,
  token: null,
  permission: 'prompt',
};

type NotificationHandler = (notification: PushNotificationSchema) => void;
type ActionHandler = (action: ActionPerformed) => void;

let notificationReceivedHandler: NotificationHandler | null = null;
let notificationActionHandler: ActionHandler | null = null;

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function isPushSupported(): boolean {
  return isNativePlatform() && (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android');
}

export async function checkPermissions(): Promise<'prompt' | 'granted' | 'denied'> {
  if (!isPushSupported()) {
    return 'denied';
  }
  
  try {
    const result = await PushNotifications.checkPermissions();
    state.permission = result.receive as 'prompt' | 'granted' | 'denied';
    return state.permission;
  } catch (error) {
    console.error('Failed to check push notification permissions:', error);
    return 'denied';
  }
}

export async function requestPermissions(): Promise<boolean> {
  if (!isPushSupported()) {
    console.log('Push notifications not supported on this platform');
    return false;
  }
  
  try {
    const result = await PushNotifications.requestPermissions();
    state.permission = result.receive as 'prompt' | 'granted' | 'denied';
    return result.receive === 'granted';
  } catch (error) {
    console.error('Failed to request push notification permissions:', error);
    return false;
  }
}

export async function registerForPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) {
    console.log('Push notifications not supported on this platform');
    return false;
  }
  
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    console.log('Push notification permission denied');
    return false;
  }
  
  try {
    await PushNotifications.register();
    state.isSupported = true;
    return true;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return false;
  }
}

export async function unregisterFromPushNotifications(): Promise<void> {
  if (!isPushSupported() || !state.token) {
    return;
  }
  
  try {
    await api.delete('/push/unregister', { data: { token: state.token } });
    state.isRegistered = false;
    state.token = null;
  } catch (error) {
    console.error('Failed to unregister from push notifications:', error);
  }
}

export function setupPushNotificationListeners(): void {
  if (!isPushSupported()) {
    return;
  }
  
  PushNotifications.addListener('registration', async (token: Token) => {
    console.log('Push registration success, token:', token.value);
    state.token = token.value;
    state.isRegistered = true;
    
    try {
      const platform = Capacitor.getPlatform() as 'ios' | 'android';
      await api.post('/push/register', {
        token: token.value,
        platform,
        deviceName: `${platform} device`,
        appVersion: '1.1.0',
      });
      console.log('Device token registered with server');
    } catch (error) {
      console.error('Failed to register device token with server:', error);
    }
  });
  
  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('Push registration error:', error);
    state.isRegistered = false;
  });
  
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('Push notification received:', notification);
    if (notificationReceivedHandler) {
      notificationReceivedHandler(notification);
    }
  });
  
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('Push notification action performed:', action);
    if (notificationActionHandler) {
      notificationActionHandler(action);
    }
  });
}

export function onNotificationReceived(handler: NotificationHandler): void {
  notificationReceivedHandler = handler;
}

export function onNotificationAction(handler: ActionHandler): void {
  notificationActionHandler = handler;
}

export async function getBadgeCount(): Promise<number> {
  try {
    const response = await api.get('/push/badge-count');
    return response.data.badgeCount || 0;
  } catch (error) {
    console.error('Failed to get badge count:', error);
    return 0;
  }
}

export async function getNotificationPreferences(): Promise<{
  pushEnabled: boolean;
  dailyReminders: boolean;
  weeklyDigest: boolean;
  streakAlerts: boolean;
  familyActivity: boolean;
  milestoneAlerts: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  preferredTime: string;
}> {
  try {
    const response = await api.get('/push/preferences');
    return response.data;
  } catch (error) {
    console.error('Failed to get notification preferences:', error);
    return {
      pushEnabled: true,
      dailyReminders: true,
      weeklyDigest: true,
      streakAlerts: true,
      familyActivity: true,
      milestoneAlerts: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      preferredTime: '09:00',
    };
  }
}

export async function updateNotificationPreferences(preferences: Partial<{
  pushEnabled: boolean;
  dailyReminders: boolean;
  weeklyDigest: boolean;
  streakAlerts: boolean;
  familyActivity: boolean;
  milestoneAlerts: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  preferredTime: string;
}>): Promise<boolean> {
  try {
    await api.patch('/push/preferences', preferences);
    return true;
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return false;
  }
}

export async function sendTestNotification(): Promise<boolean> {
  try {
    await api.post('/push/send-test');
    return true;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return false;
  }
}

export async function getRegisteredDevices(): Promise<Array<{
  id: string;
  platform: string;
  deviceName: string;
  appVersion: string;
  lastUsedAt: string;
  createdAt: string;
}>> {
  try {
    const response = await api.get('/push/devices');
    return response.data.devices || [];
  } catch (error) {
    console.error('Failed to get registered devices:', error);
    return [];
  }
}

export function getState(): PushNotificationState {
  return { ...state };
}

export async function initializePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    console.log('Push notifications not supported on this platform');
    return;
  }
  
  setupPushNotificationListeners();
  
  const permission = await checkPermissions();
  if (permission === 'granted') {
    await registerForPushNotifications();
  }
}

export function removePushNotificationListeners(): void {
  if (!isPushSupported()) {
    return;
  }
  
  PushNotifications.removeAllListeners();
  notificationReceivedHandler = null;
  notificationActionHandler = null;
}

export default {
  isNativePlatform,
  isPushSupported,
  checkPermissions,
  requestPermissions,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  setupPushNotificationListeners,
  onNotificationReceived,
  onNotificationAction,
  getBadgeCount,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  getRegisteredDevices,
  getState,
  initializePushNotifications,
  removePushNotificationListeners,
};
