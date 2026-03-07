import { getDocs, getDocsFromCache, type CollectionReference, type Query } from 'firebase/firestore'

/**
 * Fetches documents cache-first for instant loads when data was previously loaded.
 * Falls back to server when cache is empty or unavailable.
 */
export async function getDocsCacheFirst(
  ref: CollectionReference | Query
): Promise<Awaited<ReturnType<typeof getDocs>>> {
  try {
    const snap = await getDocsFromCache(ref)
    if (!snap.empty) return snap
  } catch {
    /* cache miss or error, fall through to server */
  }
  return getDocs(ref)
}
