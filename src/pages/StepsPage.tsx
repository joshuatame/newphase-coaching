import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import {
  format,
  startOfWeek,
  endOfWeek,
  subDays,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
} from 'date-fns'
import { Footprints, CaretLeft, CaretRight, DeviceMobile, AppleLogo, PlugsConnected } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoader } from '@/components/PageLoader'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'

type StepsEntry = {
  clientId: string
  date: string
  steps: number
  hourlySteps?: Record<string, number>
  source?: 'manual' | 'wearable'
}

export function StepsPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const { data: myClients = [] } = useQuery({
    queryKey: ['clients-my', profile?.uid],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'clients'), where('uid', '==', profile?.uid ?? ''))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile?.uid,
  })
  const myClientId = myClients[0]?.id ?? profile?.uid

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [stepsInput, setStepsInput] = useState('')

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const { data: stepsEntries = [] } = useQuery({
    queryKey: ['stepsEntries', myClientId, weekStart.toISOString()],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'stepsEntries'),
          where('clientId', '==', myClientId!),
          where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
          where('date', '<=', format(weekEnd, 'yyyy-MM-dd')),
          orderBy('date', 'asc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as StepsEntry))
    },
    enabled: !!myClientId,
  })

  const { data: monthEntries = [] } = useQuery({
    queryKey: ['stepsEntries-month', myClientId],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')
      const snap = await getDocs(
        query(
          collection(db, 'stepsEntries'),
          where('clientId', '==', myClientId!),
          where('date', '>=', thirtyDaysAgo),
          where('date', '<=', today),
          orderBy('date', 'asc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as StepsEntry))
    },
    enabled: !!myClientId,
  })

  const entriesByDate = useMemo(
    () => Object.fromEntries(stepsEntries.map((e) => [e.date, e])),
    [stepsEntries]
  )
  const saveMutation = useMutation({
    mutationFn: async ({ date, steps }: { date: string; steps: number }) => {
      const docId = `${myClientId}_${date}`
      await setDoc(doc(db, 'stepsEntries', docId), {
        clientId: myClientId,
        date,
        steps,
        source: 'manual',
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stepsEntries', myClientId] })
      qc.invalidateQueries({ queryKey: ['stepsEntries-month', myClientId] })
    },
  })

  const todaySteps = entriesByDate[format(new Date(), 'yyyy-MM-dd')]?.steps ?? 0

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weekChartData = weekDays.map((d) => {
    const dateStr = format(d, 'yyyy-MM-dd')
    const ent = entriesByDate[dateStr]
    return {
      day: format(d, 'EEE'),
      date: dateStr,
      steps: ent?.steps ?? 0,
    }
  })

  const byDayOfWeek = useMemo(() => {
    const map: Record<number, number[]> = {}
    monthEntries.forEach((e) => {
      const dow = new Date(e.date).getDay()
      if (!map[dow]) map[dow] = []
      map[dow].push(e.steps)
    })
    const avg: { day: string; avg: number; count: number }[] = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 0; i < 7; i++) {
      const arr = map[i] ?? []
      avg.push({
        day: dayNames[i],
        avg: arr.length ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : 0,
        count: arr.length,
      })
    }
    return avg
  }, [monthEntries])

  const handleSave = () => {
    const steps = parseInt(stepsInput, 10)
    if (isNaN(steps) || steps < 0) return
    saveMutation.mutate(
      { date: selectedDate, steps },
      {
        onSuccess: () => setStepsInput(''),
      }
    )
  }

  const totalWeekSteps = weekChartData.reduce((s, d) => s + d.steps, 0)
  const avgDaily = weekChartData.length ? Math.round(totalWeekSteps / 7) : 0

  if (!profile) return <PageLoader />

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Steps</h1>
        <p className="text-muted-foreground mt-1">
          Track your daily steps. Log manually or connect Apple Health, Samsung Health, or Garmin below to auto-sync.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2.5">
              <Footprints className="h-6 w-6 text-emerald-500" weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaySteps.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Today&apos;s steps</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-2xl font-bold">{totalWeekSteps.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">This week</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-2xl font-bold">{avgDaily.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Avg per day</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <PlugsConnected className="h-5 w-5" weight="duotone" />
          Connect wearables & log steps
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 p-2 rounded-lg border border-border">
            <AppleLogo className="h-6 w-6" weight="duotone" />
            <div>
              <p className="text-sm font-medium">Apple Health</p>
              <p className="text-xs text-muted-foreground">Sync from iPhone, Apple Watch</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg border border-border">
            <DeviceMobile className="h-6 w-6" weight="duotone" />
            <div>
              <p className="text-sm font-medium">Samsung Health</p>
              <p className="text-xs text-muted-foreground">Sync from Galaxy, Galaxy Watch</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg border border-border">
            <Footprints className="h-6 w-6" weight="duotone" />
            <div>
              <p className="text-sm font-medium">Garmin / Fitbit</p>
              <p className="text-xs text-muted-foreground">Sync from Garmin Connect, Fitbit</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Open your health app (Health on iOS, Samsung Health, Garmin Connect), copy today&apos;s step count, and paste below for instant import.
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Steps</label>
            <Input
              type="number"
              min="0"
              placeholder="Enter or paste from health app"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-44"
            />
          </div>
          <Button onClick={handleSave} disabled={!stepsInput.trim() || saveMutation.isPending}>
            Save steps
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Current for {selectedDate}: {entriesByDate[selectedDate]?.steps ?? 0} steps
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Weekly view</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            >
              <CaretLeft className="h-4 w-4" weight="bold" />
            </Button>
            <span className="min-w-[180px] text-center font-medium">
              {format(weekStart, 'd MMM')} – {format(weekEnd, 'd MMM yyyy')}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            >
              <CaretRight className="h-4 w-4" weight="bold" />
            </Button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                formatter={(v: number | undefined) => [v != null ? v.toLocaleString() : 0, 'Steps']}
                labelFormatter={(_, payload) =>
                  payload[0]?.payload?.date ? format(new Date(payload[0].payload.date), 'd MMM yyyy') : ''
                }
              />
              <Bar dataKey="steps" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Average steps by day of week (last 30 days)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          See which days you&apos;re most active.
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                formatter={(v: number | undefined, __, props: { payload?: { count?: number } }) => [
                  `${(v ?? 0).toLocaleString()} steps (${props.payload?.count ?? 0} days)`,
                  'Avg',
                ]}
              />
              <Bar dataKey="avg" fill="hsl(217 91% 60%)" name="Avg steps" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Daily breakdown</h2>
        <div className="grid grid-cols-7 gap-2 text-sm">
          {weekDays.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd')
            const ent = entriesByDate[dateStr]
            const steps = ent?.steps ?? 0
            const isSelected = selectedDate === dateStr
            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  p-3 rounded-xl border text-center transition-colors
                  ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/30'}
                  ${isToday ? 'ring-2 ring-emerald-500/30' : ''}
                `}
              >
                <p className="text-xs text-muted-foreground">{format(d, 'EEE')}</p>
                <p className="font-bold text-lg">{format(d, 'd')}</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {steps > 0 ? steps.toLocaleString() : '—'}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
