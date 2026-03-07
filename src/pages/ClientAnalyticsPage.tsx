import { useParams } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  forecastWeight,
  forecastWeightWithCalories,
  forecastBodyFat,
  buildPredictionSeries,
  type TrainingGoal,
  buildWorkoutPlanFromLift,
  getGoalPrescription,
  type DailyCalorieData,
} from '@/lib/ai-utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Barbell, CaretDown, CaretRight, ChartLine } from '@phosphor-icons/react'
import { calcNutrientsFromFoods } from '@/lib/macro-utils'
import { getDocsCacheFirst } from '@/lib/firestore-cache'

export function ClientAnalyticsPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const { profile } = useAuth()

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'clients', clientId!))
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    },
    enabled: !!clientId,
  })

  const effectiveUserId = (client as { uid?: string } | null)?.uid || clientId
  const { data: checkins = [] } = useQuery({
    queryKey: ['checkins-analytics', effectiveUserId, clientId],
    queryFn: async () => {
      const idsToTry = [...new Set([effectiveUserId, clientId].filter(Boolean))]
      const allDocs: { id: string; [k: string]: unknown }[] = []
      const seen = new Set<string>()
      for (const id of idsToTry) {
        const snap = await getDocs(
          query(
            collection(db, 'checkins'),
            where('clientId', '==', id),
            orderBy('date', 'desc'),
            limit(30)
          )
        )
        for (const d of snap.docs) {
          if (!seen.has(d.id)) {
            seen.add(d.id)
            allDocs.push({ id: d.id, ...d.data() })
          }
        }
      }
      return allDocs.sort((a, b) => ((b.date as string) ?? '').localeCompare((a.date as string) ?? '')).slice(0, 30)
    },
    enabled: !!clientId && !!client,
  })

  const { data: workoutSurveys = [] } = useQuery({
    queryKey: ['workout-surveys-analytics', effectiveUserId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'workoutSessionSurveys'),
          where('createdBy', '==', effectiveUserId!),
          orderBy('createdAt', 'desc'),
          limit(20)
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!clientId && !!client,
  })

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlanVersions'],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'mealPlanVersions'), orderBy('createdAt', 'desc'))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; clientIds?: string[]; meals?: { id: string; foods?: { foodId: string; servings: number }[] }[] }[]
    },
    enabled: !!clientId,
  })

  const myPlan = useMemo(
    () => mealPlans.find((p) => p.clientIds?.includes(clientId ?? '')) ?? mealPlans[0],
    [mealPlans, clientId]
  )

  const { data: foods = [] } = useQuery({
    queryKey: ['foodItems'],
    queryFn: async () => {
      const snap = await getDocsCacheFirst(collection(db, 'foodItems'))
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) })) as { id: string; name?: string; calories?: number; protein?: number; carbs?: number; fat?: number }[]
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 60 * 24,
  })

  const foodLookup = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods])

  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 60)
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
  }, [])

  const { data: logsMealsRange = [] } = useQuery({
    queryKey: ['logsMeals-range', clientId, dateRange.start, dateRange.end],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'logsMeals'),
          where('clientId', '==', clientId!),
          where('date', '>=', dateRange.start),
          where('date', '<=', dateRange.end)
        )
      )
      return snap.docs.map((d) => d.data()) as { date?: string; foodId?: string; servings?: number; checked?: boolean }[]
    },
    enabled: !!clientId && !!dateRange.start && !!dateRange.end,
  })

  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'
  const isOwnProfile = clientId === profile?.uid
  const [goal, setGoal] = useState<TrainingGoal>('hypertrophy')
  const [comfortWeight, setComfortWeight] = useState('')
  const [comfortSets, setComfortSets] = useState('3')
  const [comfortReps, setComfortReps] = useState('10')
  const [exerciseName, setExerciseName] = useState('Main lift (e.g. Bench, Squat)')
  const [planResult, setPlanResult] = useState<ReturnType<typeof buildWorkoutPlanFromLift> | null>(null)
  const [planExpanded, setPlanExpanded] = useState(true)
  if (!isTrainer && !isOwnProfile) return <p className="p-4">Access denied.</p>
  if (!client) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    )
  }

  const displayName = (client as { displayName?: string; email?: string }).displayName ?? (client as { email?: string }).email ?? `Client ${clientId}`

  const checkinChartData = [...(checkins as { date?: string; answers?: Record<string, unknown> }[])]
    .reverse()
    .map((c) => {
      const scale = Object.values(c.answers ?? {}).find(
        (v) => typeof v === 'string' && /^\d+$/.test(v)
      ) as string | undefined
      return {
        date: c.date ?? '',
        score: scale ? parseInt(scale, 10) : null,
      }
    })
    .filter((d) => d.score != null)

  const weightHistory = (checkins as { date?: string; answers?: Record<string, unknown> }[])
    .map((c) => {
      const ans = c.answers ?? {}
      for (const [k, v] of Object.entries(ans)) {
        if (!/weight/i.test(k)) continue
        const w = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : null
        if (w != null && !isNaN(w) && w >= 20 && w <= 300) return { date: c.date ?? '', weight: w }
      }
      return null
    })
    .filter((d): d is { date: string; weight: number } => d != null)
    .sort((a, b) => a.date.localeCompare(b.date))
  const weightForecast = weightHistory.length >= 2 ? forecastWeight(weightHistory, 7) : null

  const bfHistory = useMemo(() => {
    const out: { date: string; bf: number }[] = []
    for (const c of checkins as { date?: string; answers?: Record<string, unknown> }[]) {
      const ans = c.answers ?? {}
      for (const [k, v] of Object.entries(ans)) {
        if (!/bodyfat|^bf$|body_fat|fat_pct/i.test(k)) continue
        const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : null
        if (n != null && !isNaN(n) && n >= 5 && n <= 60) {
          out.push({ date: c.date ?? '', bf: n })
          break
        }
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date))
  }, [checkins])

  const allocatedCal = useMemo(() => {
    if (!myPlan?.meals || !Object.keys(foodLookup).length) return 2000
    const items: { foodId: string; servings: number }[] = []
    for (const meal of myPlan.meals) {
      for (const f of meal.foods ?? []) {
        items.push({ foodId: f.foodId, servings: f.servings })
      }
    }
    const totals = calcNutrientsFromFoods(items, foodLookup)
    return Math.round(totals.calories ?? 2000)
  }, [myPlan, foodLookup])

  const dailyCalorieData = useMemo((): DailyCalorieData[] => {
    const byDate: Record<string, { consumed: number; allocated: number }> = {}
    for (const log of logsMealsRange) {
      const date = log.date ?? ''
      if (!date) continue
      if (!byDate[date]) byDate[date] = { consumed: 0, allocated: allocatedCal }
      if (log.checked) {
        const food = foodLookup[log.foodId ?? '']
        const cal = (food?.calories ?? 0) * (log.servings ?? 1)
        byDate[date].consumed += cal
      }
    }
    return Object.entries(byDate).map(([date, v]) => ({
      date,
      consumedCal: Math.round(v.consumed),
      allocatedCal: v.allocated,
    }))
  }, [logsMealsRange, foodLookup, allocatedCal])

  const predictionSeries = useMemo(
    () =>
      buildPredictionSeries(
        weightHistory,
        bfHistory,
        dailyCalorieData,
        14,
        allocatedCal
      ),
    [weightHistory, bfHistory, dailyCalorieData, allocatedCal]
  )

  const chartData = useMemo(
    () =>
      predictionSeries.map((p) => ({
        ...p,
        dateShort: p.date.slice(5),
        weight: p.weight ?? undefined,
        bf: p.bf ?? undefined,
        predictedWeight: p.predictedWeight ?? undefined,
        predictedBf: p.predictedBf ?? undefined,
      })),
    [predictionSeries]
  )

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics: {displayName}</h1>

      {isOwnProfile && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <h2 className="font-semibold flex items-center gap-2">
            <Barbell className="h-5 w-5 text-primary" weight="duotone" />
            Goal-based lift calculator & workout plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose your goal, enter what you feel comfortable lifting, and we’ll calculate what to do and build a plan.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">What do you want to achieve?</Label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as TrainingGoal)}
                className="mt-1.5 w-full h-10 rounded-xl border border-input bg-background px-4 text-sm"
              >
                <option value="endurance">Endurance</option>
                <option value="strength">Strength</option>
                <option value="hypertrophy">Muscle size (hypertrophy)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">{getGoalPrescription(goal).description}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Exercise name</Label>
              <Input
                placeholder="e.g. Bench Press, Squat"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-sm font-medium">Weight you’re comfortable with (kg)</Label>
              <Input
                type="number"
                min="1"
                step="0.5"
                placeholder="e.g. 60"
                value={comfortWeight}
                onChange={(e) => setComfortWeight(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Sets</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={comfortSets}
                onChange={(e) => setComfortSets(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Reps (at that weight)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={comfortReps}
                onChange={(e) => setComfortReps(e.target.value)}
                className="mt-1.5 rounded-xl"
              />
            </div>
          </div>

          <Button
            onClick={() => {
              const w = parseFloat(comfortWeight)
              const sets = parseInt(comfortSets, 10) || 3
              const reps = parseInt(comfortReps, 10) || 10
              if (w > 0 && reps > 0) {
                setPlanResult(buildWorkoutPlanFromLift(goal, w, sets, reps, exerciseName || 'Main lift'))
                setPlanExpanded(true)
              }
            }}
            disabled={!comfortWeight || !comfortReps || parseFloat(comfortWeight) <= 0 || parseInt(comfortReps, 10) <= 0}
            className="rounded-xl"
          >
            Calculate & build workout plan
          </Button>

          {planResult && (
            <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setPlanExpanded((x) => !x)}
                className="w-full flex items-center justify-between p-4 text-left font-medium"
              >
                <span>Your plan: est. 1RM {planResult.oneRM} kg → {planResult.prescription.sets}×{planResult.prescription.repMin}–{planResult.prescription.repMax} @ {planResult.workingWeightKg} kg</span>
                {planExpanded ? <CaretDown className="h-5 w-5 shrink-0" /> : <CaretRight className="h-5 w-5 shrink-0" />}
              </button>
              {planExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-sm text-muted-foreground">{planResult.prescription.description} Rest: {planResult.prescription.restSeconds}s between sets.</p>
                  <ul className="space-y-2">
                    {planResult.exercises.map((ex, i) => (
                      <li key={i} className="flex flex-wrap items-baseline gap-2 text-sm p-3 rounded-lg bg-background border border-border">
                        <span className="font-medium">{ex.name}</span>
                        <span>{ex.sets} × {ex.reps}</span>
                        <span className="text-primary font-semibold">{ex.weightKg} kg</span>
                        <span className="text-muted-foreground">rest {ex.restSeconds}s</span>
                        {ex.notes && <span className="text-muted-foreground text-xs">— {ex.notes}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Check-in trend</h2>
        {checkinChartData.length === 0 ? (
          <p className="text-muted-foreground">No check-in data yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={checkinChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Recent post-workout surveys</h2>
        {workoutSurveys.length === 0 ? (
          <p className="text-muted-foreground">No surveys yet.</p>
        ) : (
          <div className="space-y-2">
            {workoutSurveys.slice(0, 5).map((s: { id: string; createdAt?: { toDate: () => Date }; answers?: Record<string, unknown> }) => (
              <div key={s.id} className="p-3 rounded-xl border border-border text-sm">
                {s.createdAt && typeof s.createdAt === 'object' && 'toDate' in s.createdAt
                  ? (s.createdAt as { toDate: () => Date }).toDate().toLocaleDateString()
                  : '—'}
                : {JSON.stringify((s as { answers?: Record<string, unknown> }).answers ?? {})}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <ChartLine className="h-5 w-5 text-primary" weight="duotone" />
          AI predictions: scale weight & body fat %
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Predictions factor in your meal plan (allocated calories) and a trend line from calories consumed. Log weight and, optionally, body fat % in check-ins to see forecasts.
        </p>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground">Log check-ins with weight (and optionally body fat %) to see predictions.</p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateShort" fontSize={11} />
                <YAxis yAxisId="weight" fontSize={11} domain={['auto', 'auto']} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="bf" orientation="right" fontSize={11} domain={['auto', 'auto']} label={{ value: 'BF %', angle: 90, position: 'insideRight' }} />
                <Tooltip
                  formatter={(v: number | undefined, name?: string) => [v != null ? ((name ?? '').includes('BF') || (name ?? '').includes('bf') ? `${v}%` : `${v} kg`) : '—', name ?? '']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {(weightHistory.length >= 2 || bfHistory.length >= 2) && (
                  <ReferenceLine x={chartData[chartData.length - 1]?.dateShort} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
                )}
                <Line yAxisId="weight" type="monotone" dataKey="weight" name="Weight (actual)" stroke="hsl(var(--primary))" strokeWidth={2} dot connectNulls={false} />
                <Line yAxisId="weight" type="monotone" dataKey="predictedWeight" name="Weight (predicted)" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />
                <Line yAxisId="bf" type="monotone" dataKey="bf" name="BF % (actual)" stroke="hsl(199 89% 48%)" strokeWidth={2} dot connectNulls={false} />
                <Line yAxisId="bf" type="monotone" dataKey="predictedBf" name="BF % (predicted)" stroke="hsl(199 89% 48%)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {weightHistory.length >= 2 && (() => {
            const withCals = forecastWeightWithCalories(weightHistory, dailyCalorieData, 7, allocatedCal)
            return withCals ? (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-muted-foreground">Weight in 7 days (with calories)</p>
                <p className="font-semibold">{withCals.predictedWeight} kg</p>
              </div>
            ) : null
          })()}
          {weightHistory.length >= 2 && weightForecast != null && (
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-muted-foreground">Weight in 7 days (trend only)</p>
              <p className="font-semibold">{weightForecast} kg</p>
            </div>
          )}
          {bfHistory.length >= 2 && (() => {
            const bf7 = forecastBodyFat(bfHistory, 7)
            return bf7 != null ? (
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-muted-foreground">BF % in 7 days</p>
                <p className="font-semibold">{bf7}%</p>
              </div>
            ) : null
          })()}
          <div className="p-3 rounded-xl bg-muted/50">
            <p className="text-muted-foreground">Meal plan (allocated cal)</p>
            <p className="font-semibold">{allocatedCal} cal</p>
          </div>
        </div>
      </div>
    </div>
  )
}
