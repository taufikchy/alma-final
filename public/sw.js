try {
  importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
} catch (e) {
  console.warn('OneSignal SDK could not be loaded in Service Worker:', e);
}

// Service Worker Sederhana untuk ALMA
// Fokus pada Push Notification dan Background Sync agar navigasi PWA stabil

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handler untuk Push Notification dari OneSignal atau Server
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || '🔔 ALMA Reminder Minum TTD';
  const options = {
    body: data.body || 'Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS ya Bund!',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'alma-reminder',
    requireInteraction: true,
    vibrate: [500, 110, 500, 110, 450, 110, 200, 110, 170, 40, 450, 110, 200, 110, 170, 40],
    data: {
      url: data.url || '/patient/dashboard',
    },
    actions: [
      { action: 'open', title: 'Buka ALMA' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handler saat notifikasi di-klik
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/patient/dashboard';

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/patient/dashboard') && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICKED' });
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Menangani pesan dari aplikasi utama (seperti jadwal alarm saat web terbuka)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ALARM_TRIGGERED') {
    // Teruskan pesan ke semua window yang terbuka
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage(event.data);
      });
    });
  }
});
