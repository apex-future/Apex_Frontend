

import apiClient from './apiClient';

const NOTIFICATION_PERMISSION_KEY = 'apex_notification_permission_requested';

const notificationService = {
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  },

  checkAndNotify: async () => {
    try {
      const response = await apiClient.get('/api/notifications');
      const unreadCount = response.data?.filter?.(n => !n.read)?.length || 0;
      if (import.meta.env.DEV) console.log(`[Apex Notifications] Polled unread count: ${unreadCount}`);
      return unreadCount;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Apex Notifications] Failed to poll notifications:', err);
      return 0;
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await apiClient.get('/api/notifications');
      return response.data || [];
    } catch (err) {
      console.error('[Apex Notifications] Failed to fetch notifications:', err);
      return [];
    }
  },

  markAsRead: async (id) => {
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
    } catch (err) {
      console.error('[Apex Notifications] Failed to mark as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.post('/api/notifications/read-all');
    } catch (err) {
      console.error('[Apex Notifications] Failed to mark all as read:', err);
    }
  },

  showDailyReminder: () => {
    const messages = [
      "Ready to dive back into your books? 📚",
      "Don't lose your streak! Time for some reading? ✨",
      "Your books are waiting for you. Let's make some progress today! 🚀",
      "A chapter a day keeps the knowledge stay! Open Apex to read now. 📖"
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const options = {
      body: randomMessage,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'daily-reminder',
      renotify: true,
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Apex Reading Reminder', options);
      });
    } else {
      new Notification('Apex Reading Reminder', options);
    }
  },

  scheduleNotification: async () => {
    // Deprecated: Experimental Notification Triggers API is unsupported in most browsers.
    // Local daily reminders have been migrated to the backend push cron job.
  },

  // ─── PUSH SUBSCRIPTION METHODS ────────────────────────────────────────────

  subscribeToPush: async (authToken) => {
    console.log('[Apex Push] Attempting to subscribe to push notifications...');

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Apex Push] Push notifications not supported in this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Apex Push] Service worker ready');

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[Apex Push] Already subscribed — sending existing subscription to backend');
        await notificationService._saveSubscriptionToBackend(existingSubscription, authToken);
        return existingSubscription;
      }

      // Subscribe with VAPID public key
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });

      console.log('[Apex Push] New subscription created:', subscription.endpoint.slice(0, 50) + '...');
      await notificationService._saveSubscriptionToBackend(subscription, authToken);
      return subscription;

    } catch (err) {
      console.error('[Apex Push] Failed to subscribe:', err);
      return null;
    }
  },

  unsubscribeFromPush: async (authToken) => {
    console.log('[Apex Push] Unsubscribing from push notifications...');

    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log('[Apex Push] No active subscription found — nothing to unsubscribe');
        return;
      }

      // Tell backend to delete it first
      await notificationService._deleteSubscriptionFromBackend(subscription, authToken);

      // Then unsubscribe in browser
      await subscription.unsubscribe();
      console.log('[Apex Push] Successfully unsubscribed');

    } catch (err) {
      console.error('[Apex Push] Failed to unsubscribe:', err);
    }
  },

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  _saveSubscriptionToBackend: async (subscription, authToken) => {
    const keys = subscription.toJSON().keys;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }),
      });
      if (!response.ok) throw new Error(`Backend responded with ${response.status}`);
      console.log('[Apex Push] Subscription saved to backend');
    } catch (err) {
      console.error('[Apex Push] Failed to save subscription to backend:', err);
    }
  },

  _deleteSubscriptionFromBackend: async (subscription, authToken) => {
    const keys = subscription.toJSON().keys;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }),
      });
      if (!response.ok) throw new Error(`Backend responded with ${response.status}`);
      console.log('[Apex Push] Subscription deleted from backend');
    } catch (err) {
      console.error('[Apex Push] Failed to delete subscription from backend:', err);
    }
  },
};

export default notificationService;
