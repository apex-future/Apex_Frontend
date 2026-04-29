/**
 * sw-push.js
 * Custom push notification handler for Apex.
 * This file is NOT auto-generated — do not delete.
 * Imported by the Workbox service worker via vite.config.js.
 */

// ── Push Event ────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[Apex SW] Push event received');

  let data = {
    title: 'Apex',
    body: 'Time to study, Scholar 📚',
    url: '/',
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (err) {
    console.warn('[Apex SW] Failed to parse push data:', err);
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'apex-reminder',
    renotify: true,
    data: {
      url: data.url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification Click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[Apex SW] Notification clicked');
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If Apex is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
