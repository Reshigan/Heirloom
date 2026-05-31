/**
 * Web Push (browser PWA notifications).
 *
 * The single re-engagement lever the web can offer that survives a closed tab:
 * a nudge that it's someone's turn to add to the thread, or that a sealed entry
 * has unlocked. Requires a VAPID public key at build time
 * (`VITE_VAPID_PUBLIC_KEY`) and a matching private key + sender on the worker.
 * Until those exist the capability is dormant — `webPushEnabled()` is false and
 * no notification CTA is shown — so we never ask for a permission we can't honour.
 *
 * The native iOS/Android apps use the Capacitor path in services/pushNotificationService.
 */
import api from '../services/api';

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || '';

/** True only when a VAPID key is configured *and* the browser supports push. */
export function webPushEnabled(): boolean {
  return (
    !!VAPID_PUBLIC_KEY &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Request notification permission and subscribe this browser to web push,
 * persisting the subscription server-side. Returns true on success.
 */
export async function enableWebPush(): Promise<boolean> {
  if (!webPushEnabled()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  try {
    await api.post('/push/web-subscribe', {
      subscription: sub.toJSON(),
      userAgent: navigator.userAgent,
    });
    return true;
  } catch {
    // Permission is granted and the browser subscription exists; the server
    // store can be retried later. Don't claim failure to the user.
    return true;
  }
}
