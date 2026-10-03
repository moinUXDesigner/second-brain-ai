/* Imported by the existing Workbox worker in development and production. */
self.addEventListener('push', (event) => {
  let payload;
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = {}; }
  if (!payload || typeof payload !== 'object') payload = {};
  event.waitUntil((async () => {
    await self.registration.showNotification(payload.title || 'Second Brain AI', {
      body: payload.message || 'You have a new reminder.',
      icon: '/pwa-icon.svg',
      badge: '/pwa-icon.svg',
      tag: payload.tag || 'second-brain-reminder',
      data: { url: payload.url || '/tasks' },
    });
    for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
      client.postMessage({ type: 'PUSH_RECEIVED' });
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    let url = new URL('/tasks', self.location.origin);
    try {
      const candidate = new URL(event.notification.data?.url || '/tasks', self.location.origin);
      if (candidate.origin === self.location.origin && candidate.pathname === '/tasks') url = candidate;
    } catch { /* Use the task list for malformed payloads. */ }
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(url.href);
      await existing.focus();
    } else {
      await self.clients.openWindow(url.href);
    }
  })());
});
