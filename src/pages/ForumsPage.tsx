import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { ChatCircle, CaretRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { PageLoader } from '@/components/PageLoader'

export function ForumsPage() {
  const { profile } = useAuth()

  const { data: memberForumIds = [], isLoading: membersLoading } = useQuery({
    queryKey: ['forumMembers-my', profile?.uid],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'forumMembers'))
      const uid = profile?.uid ?? ''
      return snap.docs
        .filter((d) => {
          const data = d.data()
          return data.userId === uid || data.clientId === uid
        })
        .map((d) => d.data().forumId as string)
    },
    enabled: !!profile?.uid && profile?.role === 'client',
  })

  const { data: allForums = [], isLoading: forumsLoading } = useQuery({
    queryKey: ['forums'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'forums'), orderBy('createdAt', 'desc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile,
  })

  const forums = useMemo(() => {
    const isAdmin = profile?.role === 'admin'
    const isTrainer = profile?.role === 'trainer'
    if (isAdmin || isTrainer) {
      return allForums
    }
    const memberSet = new Set(memberForumIds)
    return allForums.filter((f: { id: string }) => memberSet.has(f.id))
  }, [allForums, memberForumIds, profile?.role])

  if (!profile) return <PageLoader />
  if (forumsLoading || (profile.role === 'client' && membersLoading)) return <PageLoader />

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Forums</h1>
        <p className="text-muted-foreground mt-1">
          {profile?.role === 'client'
            ? 'Forums you\'ve been invited to.'
            : 'Community discussions. Manage forums in Admin.'}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Forums</h2>
        {forums.length === 0 ? (
          <p className="text-muted-foreground">
            {profile?.role === 'client'
              ? 'No forums yet. Your coach will invite you when one is available.'
              : 'No forums yet. Create and manage forums in Admin.'}
          </p>
        ) : (
          <div className="space-y-2">
            {forums.map((f: { id: string; name?: string; description?: string }) => (
              <Link
                key={f.id}
                to={`/forums/${f.id}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/30"
              >
                <ChatCircle className="h-8 w-8 text-primary shrink-0" weight="duotone" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{f.name ?? 'Unnamed'}</p>
                  <p className="text-sm text-muted-foreground truncate">{f.description ?? ''}</p>
                </div>
                <CaretRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
