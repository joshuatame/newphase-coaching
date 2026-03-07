/**
 * Generates public/firebase-messaging-sw.js for FCM background push notifications.
 * Run before build: node scripts/generate-firebase-sw.js
 * Requires VITE_FIREBASE_* in .env
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

config()
const apiKey = process.env.VITE_FIREBASE_API_KEY || ''
const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || ''
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || ''
const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET || ''
const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''
const appId = process.env.VITE_FIREBASE_APP_ID || ''

if (!projectId || !messagingSenderId) {
  console.warn('Firebase config missing. Set VITE_FIREBASE_* in .env. Skipping firebase-messaging-sw.js')
  process.exit(0)
}

const sw = `importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
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
`

const publicDir = resolve(process.cwd(), 'public')
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })
writeFileSync(resolve(publicDir, 'firebase-messaging-sw.js'), sw)
console.log('Generated public/firebase-messaging-sw.js')
