importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBAYEZHIUg5Kz_jmH_gJG-dYDdKClgEyco",
  authDomain: "newphase-coaching.firebaseapp.com",
  projectId: "newphase-coaching",
  storageBucket: "newphase-coaching.firebasestorage.app",
  messagingSenderId: "1021170862688",
  appId: "1:1021170862688:web:9a69cb3156bd5033df5105"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title ?? 'Newphase Coaching';
  const options = {
    body: payload?.notification?.body ?? '',
    icon: '/assets/logo-np.png',
    badge: '/assets/logo-np.png',
    data: payload?.data ?? {}
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.screen ? event.notification.data.screen : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(self.location.origin + url);
    })
  );
});
