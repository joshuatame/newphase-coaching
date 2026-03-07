import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { collection } from 'firebase/firestore'
import { getDocsCacheFirst } from '@/lib/firestore-cache'
import { db } from '@/lib/firebase'

const CATALOG_STALE_TIME = 1000 * 60 * 60 * 24 // 24 hours - treat as fresh, use cache
const prefetchCatalog = async (queryClient: ReturnType<typeof useQueryClient>, key: string, collectionName: string) => {
  await queryClient.prefetchQuery({
    queryKey: [key],
    queryFn: async () => {
      const snap = await getDocsCacheFirst(collection(db, collectionName))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) }))
    },
    staleTime: CATALOG_STALE_TIME,
  })
}

export function useCatalogPrefetch() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const run = () => {
      prefetchCatalog(queryClient, 'foodItems', 'foodItems')
      prefetchCatalog(queryClient, 'exercises', 'exercises')
      prefetchCatalog(queryClient, 'supplementCatalog', 'supplementCatalog')
    }
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run, { timeout: 2000 })
      return () => cancelIdleCallback(id)
    }
    const t = setTimeout(run, 100)
    return () => clearTimeout(t)
  }, [queryClient])
}
