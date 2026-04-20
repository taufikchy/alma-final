const CACHE_NAME = 'alma-v1';
const SOUND_CACHE = 'alma-sounds-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🔔 ALMA Reminder';
  const options = {
    body: data.body || 'Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS ya Bund!',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'alma-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    sound: '/notification.mp3',
    data: {
      url: data.url || '/patient/dashboard',
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/patient/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/patient/dashboard') && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NOTIFICATION_CLICKED' });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_ALARM') {
    const { patientId, checkTime, snoozeInterval } = event.data;
    scheduleAlarm(patientId, checkTime, snoozeInterval);
  }
  if (event.data && event.data.type === 'STOP_ALARM') {
    stopAlarm();
  }
  if (event.data && event.data.type === 'SNOOZE_ALARM') {
    const { snoozeInterval } = event.data;
    snoozeTime = snoozeInterval || 10 * 60 * 1000;
    snoozeAlarm();
  }
});

let alarmTimeoutId = null;
let isAlarmActive = false;
let snoozeTime = 10 * 60 * 1000;
let checkHour = 19;

function scheduleAlarm(patientId, checkTime = 19, snoozeInterval = 10 * 60 * 1000) {
  if (alarmTimeoutId) {
    clearTimeout(alarmTimeoutId);
    alarmTimeoutId = null;
  }
  checkHour = checkTime;
  snoozeTime = snoozeInterval;
  isAlarmActive = true;
  setNextAlarm(patientId);
}

function setNextAlarm(patientId) {
  if (!isAlarmActive) return;

  const now = new Date();
  let targetHour = checkHour;
  let targetDate = new Date(now);

  if (now.getHours() >= targetHour) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  targetDate.setHours(targetHour, 0, 0, 0);

  const delay = targetDate.getTime() - now.getTime();
  console.log(`[SW] Next alarm scheduled for: ${targetDate.toISOString()}, delay: ${delay}ms`);

  alarmTimeoutId = setTimeout(async () => {
    await triggerAlarm(patientId);
  }, delay);
}

async function triggerAlarm(patientId) {
  if (!isAlarmActive) return;

  console.log('[SW] Alarm triggered!');

  try {
    await self.registration.showNotification('🔔 ALMA Reminder Minum TTD!', {
      body: 'Jangan lupa minum Tablet Tambah Darah (TTD) atau MMS ya Bund!',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'alma-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        url: '/patient/dashboard',
        patientId: patientId,
        timestamp: Date.now(),
      },
    });

    const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      client.postMessage({
        type: 'ALARM_TRIGGERED',
        patientId: patientId,
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error('[SW] Error showing notification:', error);
  }

  setNextAlarm(patientId);
}

function stopAlarm() {
  isAlarmActive = false;
  if (alarmTimeoutId) {
    clearTimeout(alarmTimeoutId);
    alarmTimeoutId = null;
  }
  console.log('[SW] Alarm stopped');
}

function snoozeAlarm() {
  console.log(`[SW] Snoozing alarm for ${snoozeTime / 1000 / 60} minutes`);
  if (alarmTimeoutId) {
    clearTimeout(alarmTimeoutId);
    alarmTimeoutId = null;
  }
  if (isAlarmActive) {
    alarmTimeoutId = setTimeout(() => {
      triggerAlarm(null);
    }, snoozeTime);
  }
}

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed, will reschedule for snooze');
  setTimeout(() => {
    if (isAlarmActive) {
      setNextAlarm(null);
    }
  }, snoozeTime);
});