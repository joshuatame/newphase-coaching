import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { registerFCMToken, subscribeToForegroundNotifications } from '@/lib/notifications'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'

export function useNotificationsSetup() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const hasInitialLoad = useRef(false)

  const { data: prefs } = useQuery({
    queryKey: ['userPreferences', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null
      const snap = await getDoc(doc(db, 'userPreferences', user.uid))
      return { ...snap.data() } as { notificationsPush?: boolean; notificationsInApp?: boolean }
    },
    enabled: !!user?.uid,
  })

  useEffect(() => {
    if (!user?.uid || !prefs?.notificationsInApp) return
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
    const unsub = onSnapshot(q, (snap) => {
      if (!hasInitialLoad.current) {
        hasInitialLoad.current = true
        return
      }
      snap.docChanges().forEach((change) => {
        if (change.type !== 'added') return
        const { title, body } = change.doc.data()
        if (title) {
          toast({ title: title as string, description: (body as string) ?? undefined })
        }
        queryClient.invalidateQueries({ queryKey: ['notifications', user.uid] })
      })
    })
    return () => unsub()
  }, [user?.uid, prefs?.notificationsInApp, toast, queryClient])

  useEffect(() => {
    if (!user?.uid) return () => {}
    const unsub = subscribeToForegroundNotifications((payload) => {
      if (prefs?.notificationsInApp !== false && payload?.notification?.title) {
        toast({
          title: payload.notification.title,
          description: payload.notification.body,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.uid] })
    })
    return unsub
  }, [prefs?.notificationsInApp, toast, queryClient, user?.uid])


  useEffect(() => {
    if (!user?.uid || prefs?.notificationsPush !== true) return
    registerFCMToken(user.uid).catch(() => {})
  }, [user?.uid, prefs?.notificationsPush])
}
