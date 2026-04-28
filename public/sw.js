try {
  importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
} catch (e) {
  console.warn('OneSignal SDK could not be loaded in Service Worker:', e);
}

// Service Worker Sederhana untuk ALMA
// Fokus pada Push Notification dan Background Sync agar navigasi PWA stabil

const DEFAULT_REMINDER_TITLE = 'ALMA - Reminder Minum TTD';
const DEFAULT_REMINDER_BODY = 'Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS ya Bund!';
const DEFAULT_VIBRATION_PATTERN = [1200, 250, 1200, 250, 1200, 600, 1800, 400, 1200];

function normalizeNotificationData(rawData) {
  return {
    title: rawData.title || rawData.heading || DEFAULT_REMINDER_TITLE,
    body: rawData.body || rawData.message || DEFAULT_REMINDER_BODY,
    url: rawData.url || rawData.launchURL || '/patient/dashboard',
    icon: rawData.icon || '/logo.png',
    badge: rawData.badge || '/logo.png',
    tag: rawData.tag || 'alma-reminder',
    vibrate: Array.isArray(rawData.vibrate) && rawData.vibrate.length > 0
      ? rawData.vibrate
      : DEFAULT_VIBRATION_PATTERN,
  };
}

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

  const notification = normalizeNotificationData(data);
  const options = {
    body: notification.body,
    icon: notification.icon,
    badge: notification.badge,
    tag: notification.tag,
    requireInteraction: true,
    renotify: true,
    silent: false,
    vibrate: notification.vibrate,
    timestamp: Date.now(),
    data: {
      url: notification.url,
    },
    actions: [
      { action: 'open', title: 'Buka ALMA' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notification.title, options)
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
