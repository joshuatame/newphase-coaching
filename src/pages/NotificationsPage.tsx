import { useQuery } from '@tanstack/react-query'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

export function NotificationsPage() {
  const { user } = useAuth()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: async () => {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user?.uid ?? ''),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!user?.uid,
  })

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="space-y-2">
        {notifications.map((n: { id: string; title?: string; body?: string }) => (
          <div key={n.id} className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-muted-foreground">{n.body}</p>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-muted-foreground">No notifications.</p>
        )}
      </div>
    </div>
  )
}
