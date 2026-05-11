/**
 * Push Notification utility using Service Worker + Notification API
 * Enables real browser notifications even when the tab is in background
 */

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Check if push notifications are supported
 */
export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'Notification' in window;
};

export type PushBlockerReason =
  | 'ios-not-installed'
  | 'in-app-browser'
  | 'incognito'
  | 'unsupported'
  | null;

/**
 * Diagnose why push isn't available so we can guide the user to a fix.
 * Returns null if push is fully usable on this device.
 */
export const detectPushBlocker = (): PushBlockerReason => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unsupported';

  const ua = navigator.userAgent || '';

  // In-app browsers (Instagram, Facebook, TikTok, Line, WeChat) — block SW & push
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|MicroMessenger|TikTok|Twitter|Snapchat/i.test(ua)) {
    return 'in-app-browser';
  }

  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  const isStandalone =
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as any).standalone === true;

  // iOS only supports Web Push when installed to home screen (iOS 16.4+)
  if (isIOS && !isStandalone && (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window))) {
    return 'ios-not-installed';
  }

  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return 'unsupported';
  }

  // Heuristic: incognito often disables persistent storage / SW
  try {
    if (!navigator.cookieEnabled) return 'incognito';
  } catch {}

  return null;
};

/**
 * Get current notification permission status
 */
export const getPermissionStatus = (): NotificationPermission | 'unsupported' => {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Register the service worker for notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) {
    // Service Worker not supported
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw-notifications.js', {
      scope: '/',
    });
    swRegistration = registration;
    // SW registered
    return registration;
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Request notification permission from the user
 */
export const requestPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) return 'denied';

  try {
    const permission = await Notification.requestPermission();
    // Permission granted
    return permission;
  } catch (error) {
    console.error('[Push] Permission request failed:', error);
    return 'denied';
  }
};

/**
 * Get active service worker registration
 */
const getRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
  if (swRegistration) return swRegistration;

  try {
    const registration = await navigator.serviceWorker.ready;
    swRegistration = registration;
    return registration;
  } catch {
    return null;
  }
};

/**
 * Show a native push notification via the Service Worker
 */
export const showPushNotification = async (options: {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  icon?: string;
}): Promise<boolean> => {
  if (Notification.permission !== 'granted') return false;

  const registration = await getRegistration();

  if (registration?.active) {
    registration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        title: options.title,
        body: options.body,
        tag: options.tag || 'pregnancy-tools-' + Date.now(),
        url: options.url || '/',
        icon: options.icon || '/favicon.png',
        badge: '/favicon.png',
      },
    });
    return true;
  } else {
    try {
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.png',
        tag: options.tag,
      });
      return true;
    } catch (error) {
      console.error('[Push] Fallback notification failed:', error);
      return false;
    }
  }
};

/**
 * Schedule reminders in the Service Worker so they fire even when the app is closed.
 * Each reminder: { title, body, tag, url, fireAt (ms timestamp) }
 */
export const scheduleRemindersInSW = async (
  reminders: Array<{
    title: string;
    body: string;
    tag: string;
    url: string;
    fireAt: number;
  }>
): Promise<boolean> => {
  if (Notification.permission !== 'granted') return false;

  const registration = await getRegistration();
  if (!registration?.active) return false;

  registration.active.postMessage({
    type: 'SCHEDULE_REMINDERS',
    payload: { reminders },
  });

  // Reminders sent to SW
  return true;
};

/**
 * Initialize push notification system
 * Should be called once when the app starts
 */
export const initPushNotifications = async (): Promise<{
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  registration: ServiceWorkerRegistration | null;
}> => {
  const supported = isPushSupported();

  if (!supported) {
    return { supported: false, permission: 'unsupported', registration: null };
  }

  const registration = await registerServiceWorker();
  const permission = getPermissionStatus();

  return { supported, permission, registration };
};
