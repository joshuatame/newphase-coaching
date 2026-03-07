import { useQuery } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import {
  User,
  Users,
  Warning,
  TrendUp,
  Lightning,
} from '@phosphor-icons/react'
import { format, subDays } from 'date-fns'
import { PageLoader } from '@/components/PageLoader'
import { Button } from '@/components/ui/button'

export function TrainerAnalyticsPage() {
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'clients'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: isTrainer,
  })

  const { data: productivityMap = {} } = useQuery({
    queryKey: ['productivity-trainer', clients.map((c) => c.id).join(',')],
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
      const snap = await getDocs(
        query(
          collection(db, 'productivityEntries'),
          where('date', '>=', sevenDaysAgo),
          orderBy('date', 'asc')
        )
      )
      const map: Record<string, { lastActive: string; entries: number }> = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        const cid = data.clientId as string
        if (!map[cid]) map[cid] = { lastActive: '', entries: 0 }
        map[cid].entries++
        if (data.date > map[cid].lastActive) map[cid].lastActive = data.date
      })
      return map
    },
    enabled: isTrainer && clients.length > 0,
  })

  const { data: checkinMap = {} } = useQuery({
    queryKey: ['checkins-trainer', clients.map((c) => c.id).join(',')],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'checkins'))
      const map: Record<string, number> = {}
      const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
      snap.docs.forEach((d) => {
        const data = d.data()
        const cid = data.clientId as string
        const date = data.date as string
        if (date >= weekAgo) {
          map[cid] = (map[cid] ?? 0) + 1
        }
      })
      return map
    },
    enabled: isTrainer && clients.length > 0,
  })

  const needsAttention = clients.filter((c: { id: string }) => {
    const prod = productivityMap[c.id]
    const checkins = checkinMap[c.id] ?? 0
    return (!prod || prod.entries === 0) && checkins === 0
  })

  if (!profile) return <PageLoader />
  if (!isTrainer) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Analytics dashboard is for trainers only.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trainer Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Engagement overview, habit adherence, and clients who need attention.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/15 p-2.5">
              <Users className="h-6 w-6 text-primary" weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clients.length}</p>
              <p className="text-sm text-muted-foreground">Total clients</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-500/15 p-2.5">
              <Lightning className="h-6 w-6 text-green-500" weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(productivityMap).filter((p) => p.entries > 0).length}
              </p>
              <p className="text-sm text-muted-foreground">Active (habits, 7d)</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/15 p-2.5">
              <Warning className="h-6 w-6 text-amber-500" weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold">{needsAttention.length}</p>
              <p className="text-sm text-muted-foreground">Need attention</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendUp className="h-5 w-5" weight="duotone" />
          Client engagement (last 7 days)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-adminto">
            <thead>
              <tr>
                <th className="text-left">Client</th>
                <th className="text-center">Productivity entries</th>
                <th className="text-center">Check-ins</th>
                <th className="text-left">Last active</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: { id: string; displayName?: string; email?: string }) => {
                const prod = productivityMap[c.id]
                const checkins = checkinMap[c.id] ?? 0
                const inactive = !prod?.entries && !checkins
                return (
                  <tr key={c.id} className={inactive ? 'bg-amber-500/5' : ''}>
                    <td>
                      <Link
                        to={`/clients/${c.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.displayName ?? c.email ?? `Client ${c.id.slice(0, 8)}`}
                      </Link>
                    </td>
                    <td className="text-center">{prod?.entries ?? 0}</td>
                    <td className="text-center">{checkins}</td>
                    <td>{prod?.lastActive ? format(new Date(prod.lastActive), 'd MMM') : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {needsAttention.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h2 className="font-semibold mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Warning className="h-5 w-5" weight="duotone" />
            Clients who need attention
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            No productivity or check-in activity in the last 7 days.
          </p>
          <div className="flex flex-wrap gap-2">
            {needsAttention.map((c: { id: string; displayName?: string; email?: string }) => (
              <Button key={c.id} variant="outline" size="sm" asChild>
                <Link to={`/clients/${c.id}`}>
                  <User className="h-4 w-4 mr-1" /> {c.displayName ?? c.email ?? c.id.slice(0, 8)}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
