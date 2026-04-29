

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
    // ─── REPURPOSED — DO NOT DELETE ───────────────────────────────────────────
    // checkAndNotify originally fired a local push-style reminder when the user
    // opened the app. That job now belongs to the backend cron (APScheduler).
    //
    // This function is kept as the future home of the IN-APP NOTIFICATION POLLER.
    // When the in-app notification system ships, this function will:
    //   1. Hit GET /notifications to fetch unread notifications for the current user
    //   2. Update the notification badge count in the UI
    //   3. Show in-app toasts for new activity (quest completions, streak milestones,
    //      collaboration alerts, update announcements, etc.)
    //
    // The Supabase schema for this will be:
    //   notifications(id, user_id, type, message, read, created_at)
    //
    // DO NOT restore the old reminder logic here — that now lives in the backend.
    // ──────────────────────────────────────────────────────────────────────────
    console.log('[Apex Notifications] checkAndNotify is reserved for in-app notification polling — not yet implemented');
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
    // Attempt to schedule a notification for 24h in the future
    // This uses the experimental Notification Triggers API
    if (!('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if Notification Triggers are supported
      if ('showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
        const messages = [
          "Ready to dive back into your books? 📚",
          "Don't lose your streak! Time for some reading? ✨",
          "Your books are waiting for you. Let's make some progress today! 🚀",
          "A chapter a day keeps the knowledge stay! Open Apex to read now. 📖"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        // Schedule for 24 hours from now
        const triggerTime = Date.now() + 24 * 60 * 60 * 1000;

        await registration.showNotification('Apex Reading Reminder', {
          body: randomMessage,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'daily-reminder-scheduled',
          showTrigger: new TimestampTrigger(triggerTime),
        });

        console.log('[Apex Notification] Scheduled for:', new Date(triggerTime).toLocaleString());
      }
    } catch (err) {
      console.warn('Failed to schedule notification:', err);
    }
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
