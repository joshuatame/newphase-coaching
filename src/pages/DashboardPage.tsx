import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import {
  ChartLine,
  User,
  CaretLeft,
  CaretRight,
  Check,
  X,
  List,
  Calendar,
  ForkKnife,
  Drop,
  Pill,
  ClipboardText,
  Lightning,
  Footprints,
} from '@phosphor-icons/react'
import { addWeeks, subWeeks, startOfWeek, endOfWeek, format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval } from 'date-fns'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/PageLoader'
import { DashboardProgressBars } from '@/components/dashboard/DashboardProgressBars'
import { useMyClientId } from '@/hooks/useMyClientId'

export function DashboardPage() {
  const { user, profile } = useAuth()
  const myClientIdFromHook = useMyClientId()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'
  const isBlended = isTrainer && !!myClientIdFromHook

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const q = isTrainer
        ? query(collection(db, 'clients'))
        : query(collection(db, 'clients'), where('uid', '==', profile?.uid ?? ''))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile && isTrainer,
  })

  const { data: myClients = [], isLoading: myClientsLoading } = useQuery({
    queryKey: ['clients-my', profile?.uid],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'clients'), where('uid', '==', profile?.uid ?? ''))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile?.uid && (!isTrainer || !!myClientIdFromHook),
  })
  const myClientId = myClients[0]?.id ?? myClientIdFromHook ?? profile?.uid

  const { data: todaySteps = 0 } = useQuery({
    queryKey: ['steps-today', myClientId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const snap = await getDocs(
        query(
          collection(db, 'stepsEntries'),
          where('clientId', '==', myClientId!),
          where('date', '==', today)
        )
      )
      return snap.docs[0]?.data()?.steps ?? 0
    },
    enabled: !!myClientId && !isTrainer,
  })

  const displayStart = viewMode === 'week' ? weekStart : monthStart
  const displayEnd = viewMode === 'week' ? endOfWeek(weekStart, { weekStartsOn: 1 }) : endOfMonth(monthStart)
  const days = eachDayOfInterval({ start: displayStart, end: displayEnd })
  const weeks = eachWeekOfInterval(
    { start: displayStart, end: displayEnd },
    { weekStartsOn: 1 }
  )

  const { data: checkinData, isLoading: checkinsLoading } = useQuery({
    queryKey: ['checkins-grid', clients.map((c) => c.id).join(','), displayStart.toISOString(), displayEnd.toISOString()],
    queryFn: async () => {
      const [checkinsSnap, templatesSnap] = await Promise.all([
        getDocs(collection(db, 'checkins')),
        getDocs(collection(db, 'checkinTemplates')),
      ])
      const templateFrequency: Record<string, 'daily' | 'weekly'> = {}
      templatesSnap.docs.forEach((d) => {
        const data = d.data()
        templateFrequency[d.id] = (data.frequency ?? 'daily') as 'daily' | 'weekly'
      })
      const dailyMap: Record<string, Record<string, string>> = {}
      const weeklyMap: Record<string, Record<string, string>> = {}
      const pendingDaily: { id: string; clientId: string; date?: string }[] = []
      const pendingWeekly: { id: string; clientId: string; date?: string }[] = []
      checkinsSnap.docs.forEach((d) => {
        const data = d.data()
        const clientId = (data.clientId ?? data.uid) as string
        const date = data.date as string
        const templateId = data.templateId as string | undefined
        const status = (data.status ?? 'incomplete') as string
        if (!clientId || !date) return
        const frequency = templateId ? (templateFrequency[templateId] ?? 'daily') : 'daily'
        const weekKey = format(startOfWeek(new Date(date), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        if (frequency === 'weekly') {
          if (!weeklyMap[clientId]) weeklyMap[clientId] = {}
          weeklyMap[clientId][weekKey] = status
          if (status === 'pending_review') pendingWeekly.push({ id: d.id, clientId, date })
        } else {
          if (!dailyMap[clientId]) dailyMap[clientId] = {}
          dailyMap[clientId][date] = status
          if (status === 'pending_review') pendingDaily.push({ id: d.id, clientId, date })
        }
      })
      return { dailyMap, weeklyMap, pendingDaily, pendingWeekly }
    },
    enabled: isTrainer && clients.length > 0,
  })
  const dailyCheckinMap = checkinData?.dailyMap ?? {}
  const weeklyCheckinMap = checkinData?.weeklyMap ?? {}
  const pendingDaily = checkinData?.pendingDaily ?? []
  const pendingWeekly = checkinData?.pendingWeekly ?? []

  const prevPeriod = () => {
    if (viewMode === 'week') setWeekStart((s) => subWeeks(s, 1))
    else setMonthStart((s) => subMonths(s, 1))
  }
  const nextPeriod = () => {
    if (viewMode === 'week') setWeekStart((s) => addWeeks(s, 1))
    else setMonthStart((s) => addMonths(s, 1))
  }

  const headerText =
    viewMode === 'week'
      ? `${format(weekStart, 'd MMM')} – ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'd MMM yyyy')}`
      : format(monthStart, 'MMMM yyyy')

  if (!profile) return <PageLoader />
  if (isTrainer && (clientsLoading || checkinsLoading)) return <PageLoader />
  if (!isTrainer && myClientsLoading) return <PageLoader />
  if (isBlended && myClientsLoading) return <PageLoader />

  const clientSection = (myClientId || isBlended) && (
    <>
      {isBlended && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-muted-foreground mb-3">My progress (self-coach)</h2>
        </div>
      )}
      {myClientId && (
        <DashboardProgressBars
          myClientId={myClientId}
          clients={myClients.length ? myClients : (myClientIdFromHook ? [{ id: myClientIdFromHook, uid: profile?.uid }] : [])}
          profileUid={profile?.uid ?? ''}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/meals">
          <div className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors h-full">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/15 p-2.5">
                <ForkKnife className="h-6 w-6 text-primary" weight="duotone" />
              </div>
              <div>
                <p className="font-medium">Track meals</p>
                <p className="text-sm text-muted-foreground">Log your food intake</p>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/steps">
          <div className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors h-full">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/15 p-2.5">
                <Footprints className="h-6 w-6 text-emerald-500" weight="duotone" />
              </div>
              <div>
                <p className="font-medium">Steps</p>
                <p className="text-sm text-muted-foreground">
                  {todaySteps > 0 ? `${todaySteps.toLocaleString()} today` : 'Track your steps'}
                </p>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/water">
          <div className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors h-full">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/15 p-2.5">
                <Drop className="h-6 w-6 text-blue-500" weight="duotone" />
              </div>
              <div>
                <p className="font-medium">Water intake</p>
                <p className="text-sm text-muted-foreground">Track your hydration</p>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/regimen">
          <div className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors h-full">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/15 p-2.5">
                <Pill className="h-6 w-6 text-amber-500" weight="duotone" />
              </div>
              <div>
                <p className="font-medium">Supplements</p>
                <p className="text-sm text-muted-foreground">Log supplements</p>
              </div>
            </div>
          </div>
        </Link>
        <Link to={myClientId ? `/clients/${myClientId}/analytics` : '/checkins'}>
          <div className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors h-full">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/15 p-2.5">
                <ChartLine className="h-6 w-6 text-purple-500" weight="duotone" />
              </div>
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">View your progress</p>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/checkins">
          <div className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors h-full">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-500/15 p-2.5">
                <ClipboardText className="h-6 w-6 text-green-500" weight="duotone" />
              </div>
              <div>
                <p className="font-medium">Daily check-in</p>
                <p className="text-sm text-muted-foreground">Complete your check-in</p>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/productivity">
          <div className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/30 transition-colors h-full">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-orange-500/15 p-2.5">
                <Lightning className="h-6 w-6 text-orange-500" weight="fill" />
              </div>
              <div>
                <p className="font-medium">Productivity</p>
                <p className="text-sm text-muted-foreground">Diary, schedule & streaks</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      {!isBlended && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/15 p-2.5">
              <User className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="font-medium truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )

  if (!isTrainer) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Your progress and quick actions below.</p>
        </div>
        {clientSection}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">{isBlended ? 'Blended view: your progress and trainer overview' : 'Trainer overview'}</p>
        </div>
      </div>

      {isBlended && clientSection && (
        <>
          {clientSection}
          <hr className="border-border my-6" />
          <h2 className="text-lg font-semibold text-muted-foreground mb-3">Trainer overview</h2>
        </>
      )}

      {(pendingDaily.length > 0 || pendingWeekly.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pendingDaily.length > 0 && (
            <Link to="/checkins">
              <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-5 hover:bg-amber-500/15 transition-colors h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/20 p-2.5">
                      <Calendar className="h-6 w-6 text-amber-500" weight="duotone" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-amber-700 dark:text-amber-400">
                        {pendingDaily.length} daily check-in{pendingDaily.length !== 1 ? 's' : ''} to review
                      </h2>
                      <p className="text-sm text-muted-foreground">Click to review and respond</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 shrink-0">
                    Review
                  </Button>
                </div>
              </div>
            </Link>
          )}
          {pendingWeekly.length > 0 && (
            <Link to="/checkins">
              <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-5 hover:bg-amber-500/15 transition-colors h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/20 p-2.5">
                      <ClipboardText className="h-6 w-6 text-amber-500" weight="duotone" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-amber-700 dark:text-amber-400">
                        {pendingWeekly.length} weekly check-in{pendingWeekly.length !== 1 ? 's' : ''} to review
                      </h2>
                      <p className="text-sm text-muted-foreground">Click to review and respond</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 shrink-0">
                    Review
                  </Button>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevPeriod}
              className="rounded-xl"
            >
              <CaretLeft className="h-4 w-4" weight="bold" />
            </Button>
            <span className="font-medium min-w-[200px] text-center">{headerText}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={nextPeriod}
              className="rounded-xl"
            >
              <CaretRight className="h-4 w-4" weight="bold" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-xl"
            >
              <Calendar className="h-4 w-4 mr-1" weight="duotone" />
              Weekly
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="rounded-xl"
            >
              <List className="h-4 w-4 mr-1" weight="duotone" />
              Monthly
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" weight="duotone" />
            Daily check-ins
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Client</th>
                  {days.map((d) => (
                  <th key={d.toISOString()} className="py-3 px-1 text-center font-medium text-muted-foreground">
                    {format(d, 'EEE d')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c: { id: string; displayName?: string }) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-2">
                    <Link to={`/clients/${c.id}`} className="font-medium text-primary hover:underline">
                      {c.displayName ?? `Client ${c.id.slice(0, 8)}`}
                    </Link>
                  </td>
                  {days.map((d) => {
                    const dateStr = format(d, 'yyyy-MM-dd')
                    const status = dailyCheckinMap[(c as { uid?: string }).uid ?? c.id]?.[dateStr] ?? 'incomplete'
                    const isComplete = status === 'complete'
                    const isPending = status === 'pending_review'
                    return (
                      <td key={dateStr} className="py-3 px-1 text-center">
                        {isComplete && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-500/20 text-green-500">
                            <Check className="h-4 w-4" weight="bold" />
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500" title="Pending review">
                            <span className="text-xs font-bold">?</span>
                          </span>
                        )}
                        {!isComplete && !isPending && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-destructive/20 text-destructive">
                            <X className="h-4 w-4" weight="bold" />
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ClipboardText className="h-5 w-5 text-primary" weight="duotone" />
            Weekly check-ins
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Client</th>
                  {weeks.map((w) => (
                    <th key={w.toISOString()} className="py-3 px-1 text-center font-medium text-muted-foreground">
                      {format(w, 'd MMM')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c: { id: string; displayName?: string }) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2">
                      <Link to={`/clients/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.displayName ?? `Client ${c.id.slice(0, 8)}`}
                      </Link>
                    </td>
                    {weeks.map((w) => {
                      const weekKey = format(w, 'yyyy-MM-dd')
                      const status = weeklyCheckinMap[(c as { uid?: string }).uid ?? c.id]?.[weekKey] ?? 'incomplete'
                      const isComplete = status === 'complete'
                      const isPending = status === 'pending_review'
                      return (
                        <td key={weekKey} className="py-3 px-1 text-center">
                          {isComplete && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-500/20 text-green-500">
                              <Check className="h-4 w-4" weight="bold" />
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500" title="Pending review">
                              <span className="text-xs font-bold">?</span>
                            </span>
                          )}
                          {!isComplete && !isPending && (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-destructive/20 text-destructive">
                              <X className="h-4 w-4" weight="bold" />
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {clients.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No clients yet. Add clients to see check-in status.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/15 p-2.5">
              <User className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="font-medium truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/15 p-2.5">
              <ChartLine className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clients</p>
              <p className="font-medium">{clients.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
