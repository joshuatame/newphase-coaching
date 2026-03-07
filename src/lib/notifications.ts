/**
 * Notification utilities: FCM token storage, real-time subscription setup.
 */
import { doc, setDoc } from 'firebase/firestore'
import { db, getFCMToken, onForegroundMessage } from '@/lib/firebase'

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return await Notification.requestPermission()
}

export async function registerFCMToken(uid: string): Promise<boolean> {
  const token = await getFCMToken()
  if (!token) return false
  try {
    const tokenId = token.slice(0, 50).replace(/[^a-zA-Z0-9_-]/g, '') || 'web'
    await setDoc(doc(db, 'fcmTokens', uid, 'tokens', tokenId), {
      token,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch {
    return false
  }
}

export function subscribeToForegroundNotifications(
  onNotify: (payload: { notification?: { title?: string; body?: string } }) => void
): () => void {
  return onForegroundMessage((payload) => {
    const p = payload as { notification?: { title?: string; body?: string } }
    if (p?.notification?.title) {
      onNotify(p)
    }
  })
}
