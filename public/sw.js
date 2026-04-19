// HerNest Service Worker — handles push notifications

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Handle push notifications from server
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const title = data.title || 'HerNest ✨';
  const body = data.body || 'Good morning! Your daily briefing is ready.';
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon.png',
      badge: '/icon.png',
      tag: 'hernest-briefing',
      renotify: true,
      data: { url: '/' },
      actions: [
        { action: 'open', title: 'Open Briefing' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const c = cs.find(x => x.url.includes('her-nest'));
      if (c) return c.focus();
      return clients.openWindow('/');
    })
  );
});

// Schedule daily briefing check
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_BRIEFING') {
    const { hour, minute, name } = e.data;
    console.log(`HerNest: briefing scheduled for ${hour}:${minute} for ${name}`);
  }
});
