import useStudyStore from '../store/studyStore';

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
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const lastNotified = localStorage.getItem('apex_last_notified');
    const now = new Date();

    if (lastNotified) {
      const lastNotifiedDate = new Date(lastNotified);
      const diffSinceNotify = now.getTime() - lastNotifiedDate.getTime();
      const hoursSinceNotify = diffSinceNotify / (1000 * 60 * 60);

      // Don't notify more than once every 24 hours
      if (hoursSinceNotify < 24) return;
    }

    const { lastActiveDate } = useStudyStore.getState();
    if (!lastActiveDate) return;

    const lastActive = new Date(lastActiveDate);
    const diffTime = now.getTime() - lastActive.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    // If it's been more than 24 hours since last activity
    if (diffHours >= 24) {
      notificationService.showDailyReminder();
      localStorage.setItem('apex_last_notified', now.toISOString());
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
  }
};

export default notificationService;
