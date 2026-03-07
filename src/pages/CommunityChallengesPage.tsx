import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import { format, isAfter, isBefore } from 'date-fns'
import {
  Trophy,
  Flame,
  Footprints,
  Barbell,
  Scales,
  Users,
  CaretRight,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/PageLoader'
import { cn } from '@/lib/utils'

export type ChallengeMetric = 'steps' | 'weight_loss' | 'workouts'

export type CommunityChallenge = {
  id: string
  title: string
  description?: string
  metric: ChallengeMetric
  startDate: string
  endDate: string
  createdBy?: string
  createdAt?: unknown
}

export type ChallengeParticipant = {
  id: string
  challengeId: string
  clientId: string
  displayName?: string
  invitedAt?: string
  joinedAt?: string
}

const METRIC_LABELS: Record<ChallengeMetric, { label: string; icon: typeof Footprints; higherIsBetter: boolean }> = {
  steps: { label: 'Most steps', icon: Footprints, higherIsBetter: true },
  weight_loss: { label: 'Biggest weight loss', icon: Scales, higherIsBetter: true },
  workouts: { label: 'Most workouts', icon: Barbell, higherIsBetter: true },
}

export function CommunityChallengesPage() {
  const { profile } = useAuth()

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['communityChallenges'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'communityChallenges'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CommunityChallenge[]
    },
    enabled: !!profile,
  })

  const activeChallenges = challenges.filter(
    (c) => isBefore(new Date(c.startDate), new Date()) && isAfter(new Date(c.endDate), new Date())
  )
  const upcomingChallenges = challenges.filter((c) => isAfter(new Date(c.startDate), new Date()))
  const pastChallenges = challenges.filter((c) => isBefore(new Date(c.endDate), new Date()))

  if (!profile) return <PageLoader />
  if (challengesLoading) return <PageLoader />

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community Challenges</h1>
        <p className="text-muted-foreground mt-1">
          Compete with others, climb the leaderboard, and earn trophies.
        </p>
      </div>

      {profile?.role === 'admin' && (
        <Link to="/admin">
          <Button>
            <Trophy className="h-4 w-4 mr-2" weight="duotone" />
            Manage challenges (Admin)
          </Button>
        </Link>
      )}

      {activeChallenges.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" weight="fill" />
            Active now
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeChallenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} status="active" />
            ))}
          </div>
        </div>
      )}

      {upcomingChallenges.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Upcoming</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingChallenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} status="upcoming" />
            ))}
          </div>
        </div>
      )}

      {pastChallenges.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Past challenges</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastChallenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} status="past" />
            ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" weight="duotone" />
          <h3 className="font-semibold text-lg mb-2">No challenges yet</h3>
          <p className="text-muted-foreground">
            {profile?.role === 'admin'
              ? 'Create a community challenge in Admin to get started.'
              : 'Check back soon for community challenges.'}
          </p>
        </div>
      )}
    </div>
  )
}

function ChallengeCard({
  challenge,
  status,
}: {
  challenge: CommunityChallenge
  status: 'active' | 'upcoming' | 'past'
}) {
  const meta = METRIC_LABELS[challenge.metric]
  const Icon = meta.icon

  return (
    <Link to={`/challenges/${challenge.id}`}>
      <div
        className={cn(
          'rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors h-full',
          status === 'active' && 'ring-2 ring-amber-500/30 border-amber-500/30'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="rounded-xl bg-primary/15 p-2.5">
            <Icon className="h-6 w-6 text-primary" weight="duotone" />
          </div>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              status === 'active' && 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
              status === 'upcoming' && 'bg-muted text-muted-foreground',
              status === 'past' && 'bg-muted text-muted-foreground'
            )}
          >
            {status}
          </span>
        </div>
        <h3 className="font-semibold mt-3">{challenge.title}</h3>
        {challenge.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{challenge.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">{meta.label}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(challenge.startDate), 'd MMM')} – {format(new Date(challenge.endDate), 'd MMM yyyy')}
        </p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="h-4 w-4" />
            View leaderboard
          </span>
          <CaretRight className="h-5 w-5 text-muted-foreground" weight="bold" />
        </div>
      </div>
    </Link>
  )
}
