import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

/**
 * Returns the current user's client document id if they have a client record
 * (e.g. trainer who is also their own client). Used for blended view and
 * allowing trainer+client to access meal tracking, water, etc.
 */
export function useMyClientId(): string | null {
  const { profile } = useAuth()
  const { data: clientId = null } = useQuery({
    queryKey: ['myClientId', profile?.uid],
    queryFn: async () => {
      if (!profile?.uid) return null
      const snap = await getDocs(
        query(
          collection(db, 'clients'),
          where('uid', '==', profile.uid),
          limit(1)
        )
      )
      const first = snap.docs[0]
      return first?.id ?? null
    },
    enabled: !!profile?.uid,
    staleTime: 1000 * 60 * 5,
  })
  return clientId
}
