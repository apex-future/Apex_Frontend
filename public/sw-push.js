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
    self.registration.showNotification(data.title, options).catch((err) => {
      console.error('[Apex SW] Failed to show notification:', err);
    })
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

// ── Web Share Target (Android "Open with") ────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('file');
        
        if (file) {
          // Store the file in Cache API temporarily to pass it to the frontend
          const cache = await caches.open('share-target-cache');
          await cache.put(
            new Request('/shared-file'),
            new Response(file, {
              headers: {
                'Content-Type': file.type || 'application/octet-stream',
                'Content-Length': file.size,
                'X-File-Name': encodeURIComponent(file.name)
              }
            })
          );
          
          // Redirect the user to the import page with a query parameter
          return Response.redirect('/import?shared=true', 303);
        }
      } catch (err) {
        console.error('[Apex SW] Error handling share target:', err);
      }
      
      // Fallback redirect if something fails
      return Response.redirect('/', 303);
    })());
  }
});
