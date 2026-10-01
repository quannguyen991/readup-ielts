/*
 * Service worker của Band 9 — CHỈ để nhận thông báo đẩy nhắc học.
 * Cố ý KHÔNG cache gì (không chạy offline): thêm cache là thêm cả một lớp lỗi
 * "trang cũ không chịu cập nhật". Máy chủ gửi JSON { title, body, url, tag }
 * (xem src/services/reminders/server.ts).
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Band 9';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/notify-icon-192.png',
      badge: '/notify-badge-96.png',
      tag: data.tag || 'band9-reminder',
      renotify: false,
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.url) || '/';
  // Link trong lời nhắc trỏ tới tên miền chính; app cài từ tên miền khác (máy dev,
  // tên miền cũ) thì mở cùng đường dẫn trên nguồn của chính service worker.
  let target;
  try {
    const u = new URL(raw, self.location.origin);
    target = new URL(u.pathname + u.search + u.hash, self.location.origin).href;
  } catch {
    target = self.location.origin + '/';
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus().then((c) => (c && 'navigate' in c ? c.navigate(target) : c));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
