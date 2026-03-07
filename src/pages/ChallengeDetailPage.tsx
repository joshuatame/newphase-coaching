import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, isAfter, isBefore, eachDayOfInterval } from 'date-fns'
import {
  Trophy,
  Crown,
  Medal,
  CaretLeft,
  Footprints,
  Scales,
  Barbell,
  User,
} from '@phosphor-icons/react'
import { PageLoader } from '@/components/PageLoader'
import { cn } from '@/lib/utils'
import type { CommunityChallenge, ChallengeMetric } from './CommunityChallengesPage'

const METRIC_LABELS: Record<ChallengeMetric, { label: string; icon: typeof Footprints; unit: string }> = {
  steps: { label: 'Steps', icon: Footprints, unit: '' },
  weight_loss: { label: 'Weight lost', icon: Scales, unit: 'kg' },
  workouts: { label: 'Workouts', icon: Barbell, unit: '' },
}

export function ChallengeDetailPage() {
  const { challengeId } = useParams<{ challengeId: string }>()

  const { data: challenge, isLoading: challengeLoading } = useQuery({
    queryKey: ['communityChallenge', challengeId],
    queryFn: async () => {
      if (!challengeId) return null
      const snap = await getDoc(doc(db, 'communityChallenges', challengeId))
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as CommunityChallenge) : null
    },
    enabled: !!challengeId,
  })

  const { data: participants = [] } = useQuery({
    queryKey: ['challengeParticipants', challengeId],
    queryFn: async () => {
      if (!challengeId) return []
      const snap = await getDocs(
        query(
          collection(db, 'challengeParticipants'),
          where('challengeId', '==', challengeId)
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
        id: string
        clientId: string
        displayName?: string
        joinedAt?: string
      }[]
    },
    enabled: !!challengeId,
  })

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['challengeLeaderboard', challengeId, challenge?.metric, challenge?.startDate, challenge?.endDate, participants.length],
    queryFn: async () => {
      if (!challenge || !challengeId) return []
      const start = new Date(challenge.startDate)
      const end = new Date(challenge.endDate)
      const clientIds = participants.map((p) => p.clientId)
      const participantMap = Object.fromEntries(participants.map((p) => [p.clientId, p]))

      if (challenge.metric === 'steps') {
        const days = eachDayOfInterval({ start, end })
        const results: { clientId: string; value: number; displayName?: string }[] = []
        for (const cid of clientIds) {
          let total = 0
          for (const d of days) {
            const dateStr = format(d, 'yyyy-MM-dd')
            const snap = await getDocs(
              query(
                collection(db, 'stepsEntries'),
                where('clientId', '==', cid),
                where('date', '==', dateStr)
              )
            )
            for (const doc of snap.docs) {
              total += (doc.data().steps as number) ?? 0
            }
          }
          results.push({
            clientId: cid,
            value: total,
            displayName: participantMap[cid]?.displayName,
          })
        }
        return results.sort((a, b) => b.value - a.value)
      }

      if (challenge.metric === 'weight_loss') {
        const results: { clientId: string; value: number; displayName?: string }[] = []
        for (const cid of clientIds) {
          const measSnap = await getDocs(
            query(
              collection(db, 'progressMeasurements'),
              where('clientId', '==', cid)
            )
          )
          const meas = measSnap.docs
            .map((d) => d.data())
            .filter((m) => m.weight != null)
            .sort((a, b) => (a.date as string).localeCompare(b.date as string))
          const beforeStart = meas.filter((m) => new Date((m.date as string)) <= start)
          const afterEnd = meas.filter((m) => new Date((m.date as string)) >= end)
          const startWeight = beforeStart.length ? beforeStart[beforeStart.length - 1].weight : null
          const endWeight = afterEnd.length ? afterEnd[0].weight : null
          const loss = startWeight != null && endWeight != null ? startWeight - endWeight : 0
          results.push({
            clientId: cid,
            value: Math.max(0, loss),
            displayName: participantMap[cid]?.displayName,
          })
        }
        return results.sort((a, b) => b.value - a.value)
      }

      if (challenge.metric === 'workouts') {
        const results: { clientId: string; value: number; displayName?: string }[] = []
        for (const cid of clientIds) {
          const clientSnap = await getDoc(doc(db, 'clients', cid))
          const uid = clientSnap.data()?.uid ?? cid
          const snap = await getDocs(
            query(
              collection(db, 'workoutSessionSurveys'),
              where('createdBy', '==', uid)
            )
          )
          let count = 0
          for (const d of snap.docs) {
            const createdAt = d.data().createdAt
            if (createdAt) {
              const ts = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt)
              if (ts >= start && ts <= end) count++
            }
          }
          results.push({
            clientId: cid,
            value: count,
            displayName: participantMap[cid]?.displayName,
          })
        }
        return results.sort((a, b) => b.value - a.value)
      }

      return []
    },
    enabled: !!challenge && !!challengeId && participants.length > 0,
  })

  const { data: clientsMap = {} } = useQuery({
    queryKey: ['clients-display-names'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'clients'))
      const map: Record<string, string> = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        map[d.id] = data.displayName ?? data.email ?? `Client ${d.id.slice(0, 8)}`
      })
      return map
    },
    enabled: leaderboard.length > 0,
  })

  if (!challengeId || challengeLoading || !challenge) return <PageLoader />

  const meta = METRIC_LABELS[challenge.metric]
  const Icon = meta.icon
  const isActive = isBefore(new Date(challenge.startDate), new Date()) && isAfter(new Date(challenge.endDate), new Date())

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Link to="/challenges" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <CaretLeft className="h-4 w-4" weight="bold" />
        Back to challenges
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/15 p-3">
            <Icon className="h-8 w-8 text-primary" weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{challenge.title}</h1>
            {challenge.description && (
              <p className="text-muted-foreground mt-1">{challenge.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {meta.label} · {format(new Date(challenge.startDate), 'd MMM yyyy')} – {format(new Date(challenge.endDate), 'd MMM yyyy')}
            </p>
            <span
              className={cn(
                'inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full',
                isActive ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'
              )}
            >
              {isActive ? 'Live' : 'Ended'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" weight="duotone" />
          Leaderboard
        </h2>
        {leaderboardLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-muted-foreground">No participants yet or no data in the challenge period.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((row, idx) => {
              const rank = idx + 1
              const displayName = row.displayName ?? clientsMap[row.clientId] ?? `Client ${row.clientId.slice(0, 8)}`
              return (
                <div
                  key={row.clientId}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                    rank === 1 && 'bg-amber-500/10 border-amber-500/30',
                    rank === 2 && 'bg-slate-400/10 border-slate-400/30',
                    rank === 3 && 'bg-amber-700/10 border-amber-700/30 dark:bg-amber-800/20'
                  )}
                >
                  <div className="w-10 flex items-center justify-center shrink-0">
                    {rank === 1 && <Crown className="h-8 w-8 text-amber-500" weight="fill" />}
                    {rank === 2 && <Medal className="h-8 w-8 text-slate-400" weight="fill" />}
                    {rank === 3 && <Medal className="h-8 w-8 text-amber-700" weight="fill" />}
                    {rank > 3 && (
                      <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{displayName}</span>
                  </div>
                  <span className="font-bold">
                    {row.value.toLocaleString()}
                    {meta.unit && ` ${meta.unit}`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
