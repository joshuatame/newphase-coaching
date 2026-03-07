import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
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
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addMonths,
  addYears,
  subMonths,
  subYears,
  getDaysInMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
} from 'date-fns'
import {
  Lightning,
  Flame,
  Trophy,
  CalendarBlank,
  NotePencil,
  CheckSquare,
  Plus,
  Trash,
  CaretLeft,
  CaretRight,
  Star,
  List,
  ChartBar,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/PageLoader'
import { Spinner } from '@/components/ui/spinner'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import { BADGES, computeEarnedBadges, type BadgeId } from '@/lib/achievements'
import { exportProductivityReport } from '@/lib/export-utils'
import { getDoc } from 'firebase/firestore'
import { DownloadSimple, Medal, BookOpen, Calendar } from '@phosphor-icons/react'
import { DiaryTab } from '@/components/productivity/DiaryTab'
import { CalendarScheduler } from '@/components/productivity/CalendarScheduler'

type Habit = { id: string; name: string; trainerId?: string }
type ScheduleItem = { id: string; title: string; time?: string; completed: boolean; repeat?: 'daily' | 'weekly' }
type ProductivityEntry = {
  id?: string
  clientId: string
  date: string
  score?: number
  diaryNote?: string
  scheduleItems?: ScheduleItem[]
  habitCompletions?: Record<string, boolean>
  createdAt?: unknown
}

const BONUS_STREAK = 5
const DEFAULT_HABITS = [
  'Plan my day',
  'Stretch for 10 mins',
  'Drink 2.5L of water',
  'Study for 30 mins',
  'Strength training',
  'Cardio training',
  'Practice mindfulness',
  'Sleep by 11pm',
]

function generateId() {
  return `si_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function ProductivityPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year' | 'diary' | 'schedule'>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [yearStart, setYearStart] = useState(() => startOfYear(new Date()))
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'clients'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile && isTrainer,
  })

  const { data: prefs } = useQuery({
    queryKey: ['userPreferences', profile?.uid],
    queryFn: async () => {
      if (!profile?.uid) return null
      const snap = await getDoc(doc(db, 'userPreferences', profile.uid))
      return snap.data()
    },
    enabled: !!profile?.uid,
  })
  const freezeDates: string[] = prefs?.streakFreezeDates ?? []
  const freezeAllowance = prefs?.streakFreezeAllowance ?? 2
  const freezeUsedThisMonth =
    freezeDates.filter((d) => d.startsWith(format(new Date(), 'yyyy-MM'))).length

  const { data: myClients = [], isLoading: myClientsLoading } = useQuery({
    queryKey: ['clients-my', profile?.uid],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'clients'), where('uid', '==', profile?.uid ?? ''))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile?.uid && !isTrainer,
  })

  const { data: habits = [] } = useQuery({
    queryKey: ['habits', profile?.uid],
    queryFn: async () => {
      const q = query(
        collection(db, 'habits'),
        where('trainerId', '==', profile?.uid ?? '')
      )
      const snap = await getDocs(q)
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Habit[]
      if (list.length === 0) {
        return DEFAULT_HABITS.map((name, i) => ({
          id: `default_${i}`,
          name,
          trainerId: profile?.uid,
        }))
      }
      return list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    },
    enabled: !!profile,
  })

  const addHabitMutation = useMutation({
    mutationFn: async (name: string) => {
      await addDoc(collection(db, 'habits'), {
        name: name.trim(),
        trainerId: profile?.uid ?? null,
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', profile?.uid] }),
  })

  const removeHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('default_')) return
      await deleteDoc(doc(db, 'habits', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits', profile?.uid] }),
  })

  const displayClients = isTrainer ? clients : myClients
  const activeClientId = selectedClientId ?? displayClients[0]?.id ?? profile?.uid

  const effectiveYearStart =
    viewMode === 'month' ? startOfYear(monthStart) : yearStart
  const yearRange = useMemo(() => {
    const start = startOfYear(effectiveYearStart)
    const end = endOfYear(effectiveYearStart)
    return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
  }, [effectiveYearStart])

  const { data: weekEntries = [] } = useQuery({
    queryKey: ['productivityEntries', activeClientId, weekStart.toISOString()],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 6)
      const snap = await getDocs(
        query(
          collection(db, 'productivityEntries'),
          where('clientId', '==', activeClientId!),
          where('date', '>=', format(weekStart, 'yyyy-MM-dd')),
          where('date', '<=', format(weekEnd, 'yyyy-MM-dd')),
          orderBy('date', 'asc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProductivityEntry[]
    },
    enabled: !!activeClientId && viewMode === 'week',
  })

  const diaryRange = useMemo(() => {
    const end = new Date()
    const start = addDays(end, -180)
    return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
  }, [])

  const { data: diaryEntriesData = [] } = useQuery({
    queryKey: ['productivityEntries-diary', activeClientId, diaryRange.start, diaryRange.end],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'productivityEntries'),
          where('clientId', '==', activeClientId!),
          where('date', '>=', diaryRange.start),
          where('date', '<=', diaryRange.end),
          orderBy('date', 'asc')
        )
      )
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProductivityEntry[]
      return list.reverse()
    },
    enabled: !!activeClientId && viewMode === 'diary',
  })

  const { data: yearEntries = [], isLoading: yearLoading, isError: yearError } = useQuery({
    queryKey: ['productivityEntries-year', activeClientId, yearRange.start, yearRange.end],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'productivityEntries'),
          where('clientId', '==', activeClientId!),
          where('date', '>=', yearRange.start),
          where('date', '<=', yearRange.end),
          orderBy('date', 'asc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProductivityEntry[]
    },
    enabled: !!activeClientId && (viewMode === 'year' || viewMode === 'month'),
  })

  const entries = viewMode === 'week' ? weekEntries : yearEntries
  const entriesByDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries]
  )

  const monthDays = useMemo(() => {
    const start = startOfMonth(monthStart)
    const end = endOfMonth(monthStart)
    return eachDayOfInterval({ start, end })
  }, [monthStart])

  const saveMutation = useMutation({
    mutationFn: async (entry: ProductivityEntry) => {
      const docId = `${activeClientId}_${entry.date}`
      await setDoc(doc(db, 'productivityEntries', docId), {
        ...entry,
        clientId: activeClientId,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productivityEntries', activeClientId] })
      qc.invalidateQueries({ queryKey: ['productivityEntries-year', activeClientId] })
    },
  })

  const allHabitNames = useMemo(
    () => [...new Set([...habits.map((h) => h.name), ...DEFAULT_HABITS])],
    [habits]
  )

  const habitStats = useMemo(() => {
    const byName: Record<string, { completed: number; total: number }> = {}
    for (const name of allHabitNames) {
      byName[name] = { completed: 0, total: 0 }
    }
    for (const e of entries) {
      const hc = e.habitCompletions ?? {}
      const si = (e.scheduleItems ?? []).filter((s) => s.completed)
      for (const name of allHabitNames) {
        byName[name].total++
        const done = hc[name] || si.some((s) => s.title?.toLowerCase() === name.toLowerCase())
        if (done) byName[name].completed++
      }
    }
    return Object.entries(byName)
      .map(([name, s]) => ({ name, ...s }))
      .filter((h) => h.total > 0)
      .sort((a, b) => b.completed - a.completed)
  }, [entries, allHabitNames])

  const monthlyData = useMemo(() => {
    const months: { month: string; completed: number; goal: number }[] = []
    for (let m = 0; m < 12; m++) {
      const d = addMonths(effectiveYearStart, m)
      const monthStr = format(d, 'MMM')
      const daysInMonth = getDaysInMonth(d)
      const monthEntries = entries.filter((e) => {
        const ed = new Date(e.date)
        return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth()
      })
      const completed = monthEntries.reduce((sum, e) => {
        const hc = e.habitCompletions ?? {}
        const si = (e.scheduleItems ?? []).filter((s) => s.completed)
        const count =
          Object.values(hc).filter(Boolean).length +
          si.length +
          (e.score && e.score >= 5 ? 1 : 0)
        return sum + Math.min(count, allHabitNames.length)
      }, 0)
      months.push({
        month: monthStr,
        completed: Math.min(completed, daysInMonth * allHabitNames.length),
        goal: daysInMonth * Math.max(1, allHabitNames.length),
      })
    }
    return months
  }, [entries, effectiveYearStart, allHabitNames])

  const totalGoals = useMemo(
    () => monthlyData.reduce((s, m) => s + m.goal, 0),
    [monthlyData]
  )
  const totalCompleted = useMemo(
    () => monthlyData.reduce((s, m) => s + m.completed, 0),
    [monthlyData]
  )
  const totalProgressPct = totalGoals > 0 ? Math.round((totalCompleted / totalGoals) * 100) : 0

  const streak = useMemo(() => {
    let count = 0
    let checkDate = new Date()
    for (let i = 0; i < 365; i++) {
      const d = format(checkDate, 'yyyy-MM-dd')
      const ent = entriesByDate[d]
      const hasActivity =
        ent &&
        ((ent.score && ent.score >= 5) ||
          Object.values(ent.habitCompletions ?? {}).some(Boolean) ||
          (ent.scheduleItems ?? []).some((s) => s.completed))
      const usedFreeze = freezeDates.includes(d)
      if (hasActivity || usedFreeze) {
        count++
        checkDate = addDays(checkDate, -1)
      } else break
    }
    return count
  }, [entries, entriesByDate, freezeDates])

  const effectiveUid =
    (displayClients as { id: string; uid?: string }[]).find((c) => c.id === activeClientId)
      ?.uid ?? activeClientId ?? profile?.uid
  const { data: workoutCount = 0 } = useQuery({
    queryKey: ['workoutCount', effectiveUid],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'workoutSessionSurveys'),
          where('createdBy', '==', effectiveUid)
        )
      )
      return snap.size
    },
    enabled: !!effectiveUid,
  })

  const earnedBadges = useMemo(
    () =>
      computeEarnedBadges({
        productivityStreak: streak,
        totalWorkoutsLogged: workoutCount,
        onboardingComplete: !!profile,
      }),
    [streak, workoutCount, profile]
  )

  const days = viewMode === 'week'
    ? eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) })
    : monthDays

  const currentEntry = entriesByDate[selectedDate] ?? {
    date: selectedDate,
    clientId: activeClientId,
    scheduleItems: [],
    habitCompletions: {},
  }
  const [score, setScore] = useState(currentEntry.score ?? 0)
  const [diaryNote, setDiaryNote] = useState(currentEntry.diaryNote ?? '')
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(
    currentEntry.scheduleItems ?? []
  )
  const [habitCompletions, setHabitCompletions] = useState<Record<string, boolean>>(
    currentEntry.habitCompletions ?? {}
  )
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemRepeat, setNewItemRepeat] = useState<'none' | 'daily' | 'weekly'>('none')
  const [newHabitName, setNewHabitName] = useState('')

  const recurringTasks: { id: string; title: string; repeat: 'daily' | 'weekly'; weekday?: number }[] =
    prefs?.recurringTasks ?? []
  const selectedDayOfWeek = new Date(selectedDate).getDay()
  const displayScheduleItems = useMemo(() => {
    const base = [...scheduleItems]
    for (const rt of recurringTasks) {
      const applies =
        rt.repeat === 'daily' ||
        (rt.repeat === 'weekly' && selectedDayOfWeek === (rt.weekday ?? 0))
      if (!applies) continue
      const hasMatch = base.some((s) => s.title.toLowerCase() === rt.title.toLowerCase())
      if (!hasMatch) {
        base.push({
          id: `rt_${rt.id}`,
          title: rt.title,
          completed: false,
          repeat: rt.repeat,
        })
      }
    }
    return base
  }, [scheduleItems, recurringTasks, selectedDate, selectedDayOfWeek])

  const addRecurringMutation = useMutation({
    mutationFn: async (task: {
      id: string
      title: string
      repeat: 'daily' | 'weekly'
      weekday?: number
    }) => {
      if (!profile?.uid) return
      const current = (prefs?.recurringTasks ?? []) as {
        id: string
        title: string
        repeat: string
        weekday?: number
      }[]
      await setDoc(
        doc(db, 'userPreferences', profile.uid),
        { recurringTasks: [...current.filter((t) => t.id !== task.id), task] },
        { merge: true }
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['userPreferences', profile?.uid] }),
  })
  const removeRecurringMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.uid) return
      const current = (prefs?.recurringTasks ?? []) as { id: string; title: string; repeat: string }[]
      await setDoc(
        doc(db, 'userPreferences', profile.uid),
        { recurringTasks: current.filter((t) => t.id !== id) },
        { merge: true }
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['userPreferences', profile?.uid] }),
  })

  const useFreezeMutation = useMutation({
    mutationFn: async (date: string) => {
      if (!profile?.uid) return
      const current = (prefs?.streakFreezeDates ?? []) as string[]
      const month = date.slice(0, 7)
      const usedThisMonth = current.filter((d) => d.startsWith(month)).length
      if (usedThisMonth >= freezeAllowance) throw new Error('No freezes left this month')
      await setDoc(
        doc(db, 'userPreferences', profile.uid),
        { streakFreezeDates: [...current, date] },
        { merge: true }
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['userPreferences', profile?.uid] }),
  })

  useEffect(() => {
    const e = entriesByDate[selectedDate]
    setScore(e?.score ?? 0)
    setDiaryNote(e?.diaryNote ?? '')
    setScheduleItems(e?.scheduleItems ?? [])
    setHabitCompletions(e?.habitCompletions ?? {})
  }, [selectedDate, entriesByDate])

  const handleSave = () => {
    saveMutation.mutate({
      ...currentEntry,
      date: selectedDate,
      clientId: activeClientId,
      score: score || undefined,
      diaryNote: diaryNote.trim() || undefined,
      scheduleItems,
      habitCompletions: Object.keys(habitCompletions).length ? habitCompletions : undefined,
    })
  }

  const toggleHabit = (name: string) => {
    setHabitCompletions((prev) => ({
      ...prev,
      [name]: !prev[name],
    }))
  }

  const addScheduleItem = () => {
    if (!newItemTitle.trim()) return
    const title = newItemTitle.trim()
    if (newItemRepeat === 'daily' || newItemRepeat === 'weekly') {
      addRecurringMutation.mutate({
        id: generateId(),
        title,
        repeat: newItemRepeat,
        weekday: newItemRepeat === 'weekly' ? new Date().getDay() : undefined,
      })
    } else {
      setScheduleItems([
        ...scheduleItems,
        { id: generateId(), title, completed: false },
      ])
    }
    setNewItemTitle('')
    setNewItemRepeat('none')
  }

  const toggleScheduleItem = (id: string) => {
    if (id.startsWith('rt_')) {
      const rtId = id.replace('rt_', '')
      const rt = recurringTasks.find((r) => r.id === rtId)
      if (rt) {
        const existing = scheduleItems.find((s) => s.title.toLowerCase() === rt.title.toLowerCase())
        if (existing) {
          setScheduleItems(
            scheduleItems.map((s) =>
              s.title.toLowerCase() === rt.title.toLowerCase()
                ? { ...s, completed: !s.completed }
                : s
            )
          )
        } else {
          setScheduleItems([
            ...scheduleItems,
            { id: generateId(), title: rt.title, completed: true, repeat: rt.repeat },
          ])
        }
      }
    } else {
      setScheduleItems(
        scheduleItems.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
      )
    }
  }

  const removeScheduleItem = (id: string) => {
    if (id.startsWith('rt_')) {
      removeRecurringMutation.mutate(id.replace('rt_', ''))
    } else {
      setScheduleItems(scheduleItems.filter((s) => s.id !== id))
    }
  }

  const daysLeftInYear = Math.max(0, differenceInDays(endOfYear(effectiveYearStart), new Date()))

  if (!profile || (isTrainer ? clientsLoading : myClientsLoading))
    return <PageLoader />

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Habit Tracker & Productivity</h1>
          <p className="text-muted-foreground mt-1">
            Track habits, build streaks, and view your progress.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            <CalendarBlank className="h-4 w-4 mr-1" weight="duotone" />
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            <List className="h-4 w-4 mr-1" weight="duotone" />
            Month
          </Button>
          <Button
            variant={viewMode === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('year')
              setYearStart(startOfYear(viewMode === 'month' ? monthStart : weekStart))
            }}
          >
            <ChartBar className="h-4 w-4 mr-1" weight="duotone" />
            Year
          </Button>
          <Button
            variant={viewMode === 'diary' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('diary')}
          >
            <BookOpen className="h-4 w-4 mr-1" weight="duotone" />
            Diary
          </Button>
          <Button
            variant={viewMode === 'schedule' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('schedule')}
          >
            <Calendar className="h-4 w-4 mr-1" weight="duotone" />
            Schedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportProductivityReport(
                entries,
                `productivity-${activeClientId}-${format(new Date(), 'yyyy-MM-dd')}.csv`
              )
            }
          >
            <DownloadSimple className="h-4 w-4 mr-1" weight="duotone" />
            Export
          </Button>
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Medal className="h-5 w-5 text-amber-500" weight="duotone" />
            Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((id: BadgeId) => {
              const b = BADGES[id]
              if (!b) return null
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  title={b.description}
                >
                  <span>{b.icon}</span>
                  <span className="text-sm font-medium">{b.name}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {isTrainer && displayClients.length > 1 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium mb-2">View client</p>
          <div className="flex flex-wrap gap-2">
            {displayClients.map((c: { id: string; displayName?: string; email?: string }) => (
              <Button
                key={c.id}
                variant={activeClientId === c.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedClientId(c.id)}
              >
                {c.displayName ?? c.email ?? `Client ${c.id.slice(0, 8)}`}
              </Button>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'diary' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" weight="duotone" />
            Diary
          </h2>
          <DiaryTab entries={diaryEntriesData} />
        </div>
      )}

      {viewMode === 'schedule' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" weight="duotone" />
            Calendar Schedule
          </h2>
          <CalendarScheduler clientId={activeClientId} />
        </div>
      )}

      {viewMode === 'year' && (
        <>
          <div className="rounded-2xl border border-border bg-card p-5">
            {yearError && (
              <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
                <p className="font-medium">Could not load yearly data</p>
                <p className="text-sm mt-1 opacity-90">
                  Make sure the Firestore index for productivityEntries (clientId, date) exists.
                  Run: firebase deploy --only firestore:indexes
                </p>
              </div>
            )}
            {yearLoading && (
              <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                <Spinner className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Loading yearly data…</span>
              </div>
            )}
            <h2 className="font-semibold mb-2">{format(effectiveYearStart, 'yyyy')} – Annual Overview</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <span className="text-sm text-muted-foreground">Start: </span>
                <span>{format(yearStart, 'd MMM yyyy')}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">End: </span>
                <span>{format(endOfYear(effectiveYearStart), 'd MMM yyyy')}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Days left: </span>
                <span className="font-medium">{daysLeftInYear}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setYearStart(subYears(effectiveYearStart, 1))}
                >
                  <CaretLeft className="h-4 w-4" weight="bold" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setYearStart(addYears(effectiveYearStart, 1))}
                >
                  <CaretRight className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: 'Momentum',
                  value: Math.min(100, streak * 4),
                  color: 'hsl(217 91% 60%)',
                },
                {
                  label: 'Monthly Progress',
                  value: monthlyData.slice(-1)[0]?.goal
                    ? Math.round(
                        ((monthlyData.slice(-1)[0]?.completed ?? 0) /
                          (monthlyData.slice(-1)[0]?.goal ?? 1)) *
                          100
                      )
                    : 0,
                  color: 'hsl(142 71% 45%)',
                },
                {
                  label: 'Quarterly',
                  value:
                    monthlyData.slice(-3).reduce((s, m) => s + m.completed, 0) > 0
                      ? Math.round(
                          (monthlyData.slice(-3).reduce((s, m) => s + m.completed, 0) /
                            monthlyData.slice(-3).reduce((s, m) => s + m.goal, 0)) *
                            100
                        )
                      : 0,
                  color: 'hsl(142 71% 45%)',
                },
                {
                  label: 'Total Progress',
                  value: totalProgressPct,
                  color: 'hsl(142 71% 45%)',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center">
                  <ResponsiveContainer width={80} height={80}>
                    <PieChart>
                      <Pie
                        data={[
                          { value, color },
                          { value: 100 - value, color: 'hsl(var(--muted))' },
                        ]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={24}
                        outerRadius={36}
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        <Cell fill={color} />
                        <Cell fill="hsl(var(--muted))" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-bold">{value}%</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-sm font-medium">Daily Habits: {allHabitNames.length}</p>
                <p className="text-sm text-muted-foreground">
                  Goals: {totalGoals} · Completed: {totalCompleted} · Remaining:{' '}
                  {totalGoals - totalCompleted}
                </p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="hsl(142 71% 45%)" name="Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Top Habits</h3>
              <div className="space-y-2">
                {habitStats.slice(0, 8).map((h) => {
                  const pct = h.total > 0 ? Math.round((h.completed / h.total) * 100) : 0
                  return (
                    <div key={h.name} className="flex items-center gap-2">
                      <span className="text-sm w-40 truncate">{h.name}</span>
                      <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {h.completed}/{h.total}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {(viewMode === 'week' || viewMode === 'month') && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/15 p-2.5">
                  <Star className="h-6 w-6 text-amber-500" weight="fill" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streak}</p>
                  <p className="text-sm text-muted-foreground">Day streak</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-500/15 p-2.5">
                  <Flame className="h-6 w-6 text-orange-500" weight="fill" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{entries.length}</p>
                  <p className="text-sm text-muted-foreground">Days logged</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-500/15 p-2.5">
                  <CheckSquare className="h-6 w-6 text-green-500" weight="duotone" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {streak >= BONUS_STREAK ? '🔥' : `${BONUS_STREAK - streak}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{BONUS_STREAK} day bonus</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/15 p-2.5">
                  <Trophy className="h-6 w-6 text-primary" weight="duotone" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalProgressPct}%</p>
                  <p className="text-sm text-muted-foreground">Progress</p>
                </div>
              </div>
            </div>
          </div>

          {isTrainer && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium mb-2">Manage habits</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {habits.map((h) => (
                  <span
                    key={h.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-sm"
                  >
                    {h.name}
                    {!h.id.startsWith('default_') && (
                      <button
                        onClick={() => removeHabitMutation.mutate(h.id)}
                        className="text-destructive hover:bg-destructive/20 rounded p-0.5"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add habit..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), addHabitMutation.mutate(newHabitName), setNewHabitName(''))
                  }
                  className="max-w-xs"
                />
                <Button
                  onClick={() => {
                    addHabitMutation.mutate(newHabitName)
                    setNewHabitName('')
                  }}
                  disabled={!newHabitName.trim() || addHabitMutation.isPending}
                >
                  <Plus className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    viewMode === 'week'
                      ? setWeekStart(addDays(weekStart, -7))
                      : setMonthStart(subMonths(monthStart, 1))
                  }
                >
                  <CaretLeft className="h-4 w-4" weight="bold" />
                </Button>
                <span className="font-medium min-w-[180px] text-center">
                  {viewMode === 'week'
                    ? `${format(weekStart, 'd MMM')} – ${format(addDays(weekStart, 6), 'd MMM yyyy')}`
                    : format(monthStart, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    viewMode === 'week'
                      ? setWeekStart(addDays(weekStart, 7))
                      : setMonthStart(addMonths(monthStart, 1))
                  }
                >
                  <CaretRight className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>

            {viewMode === 'month' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm table-adminto">
                  <thead>
                    <tr>
                      <th className="text-left py-2">Habit</th>
                      {monthDays.map((d) => (
                        <th key={d.toISOString()} className="text-center py-1 w-8">
                          {format(d, 'd')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allHabitNames.map((habitName) => (
                      <tr key={habitName}>
                        <td className="py-2">{habitName}</td>
                        {monthDays.map((d) => {
                          const dateStr = format(d, 'yyyy-MM-dd')
                          const ent = entriesByDate[dateStr]
                          const done =
                            ent?.habitCompletions?.[habitName] ||
                            (ent?.scheduleItems ?? []).some(
                              (s) => s.completed && s.title?.toLowerCase() === habitName.toLowerCase()
                            )
                          return (
                            <td key={dateStr} className="text-center py-1">
                              <button
                                onClick={() => {
                                  const e = entriesByDate[dateStr]
                                  const wasDone =
                                    e?.habitCompletions?.[habitName] ||
                                    (e?.scheduleItems ?? []).some(
                                      (s) =>
                                        s.completed &&
                                        s.title?.toLowerCase() === habitName.toLowerCase()
                                    )
                                  const nextCompletions = {
                                    ...e?.habitCompletions,
                                    [habitName]: !wasDone,
                                  }
                                  setSelectedDate(dateStr)
                                  setHabitCompletions(nextCompletions)
                                  setScore(e?.score ?? 0)
                                  setDiaryNote(e?.diaryNote ?? '')
                                  setScheduleItems(e?.scheduleItems ?? [])
                                  saveMutation.mutate({
                                    ...e,
                                    date: dateStr,
                                    clientId: activeClientId,
                                    habitCompletions: nextCompletions,
                                    scheduleItems: e?.scheduleItems ?? [],
                                  })
                                }}
                                className={cn(
                                  'w-7 h-7 rounded inline-flex items-center justify-center text-xs',
                                  done
                                    ? 'bg-green-500/30 text-green-600 dark:text-green-400'
                                    : 'bg-muted hover:bg-muted/80'
                                )}
                              >
                                {done ? '✓' : ''}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {days.map((d) => {
                  const dateStr = format(d, 'yyyy-MM-dd')
                  const entry = entriesByDate[dateStr]
                  const hasData =
                    entry &&
                    (entry.score ||
                      Object.values(entry.habitCompletions ?? {}).some(Boolean) ||
                      (entry.scheduleItems ?? []).some((s) => s.completed))
                  const isSelected = selectedDate === dateStr
                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate(dateStr)
                        const e = entriesByDate[dateStr]
                        setScore(e?.score ?? 0)
                        setDiaryNote(e?.diaryNote ?? '')
                        setScheduleItems(e?.scheduleItems ?? [])
                        setHabitCompletions(e?.habitCompletions ?? {})
                      }}
                      className={cn(
                        'p-3 rounded-xl border text-center transition-colors',
                        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/30',
                        hasData && 'ring-2 ring-green-500/30'
                      )}
                    >
                      <p className="text-xs text-muted-foreground">{format(d, 'EEE')}</p>
                      <p className="font-bold">{format(d, 'd')}</p>
                      {entry?.score && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold mt-1">
                          {entry.score}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
            <h2 className="font-semibold flex items-center gap-2">
              <CalendarBlank className="h-5 w-5 text-primary" weight="duotone" />
              {format(new Date(selectedDate), 'EEEE d MMMM yyyy')}
            </h2>

            <div>
              <label className="text-sm font-medium block mb-2">Daily habits</label>
              <div className="flex flex-wrap gap-2">
                {allHabitNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleHabit(name)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-sm font-medium transition-colors border',
                      habitCompletions[name]
                        ? 'bg-green-500/20 border-green-500/50 text-green-600 dark:text-green-400'
                        : 'bg-muted/50 border-border hover:bg-muted'
                    )}
                  >
                    {habitCompletions[name] ? '✓ ' : ''}
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Energy score (1–10)</label>
              <div className="flex gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    className={cn(
                      'w-9 h-9 rounded-lg font-bold text-sm transition-colors',
                      score === n ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const hasActivity =
                (currentEntry?.score && currentEntry.score >= 5) ||
                Object.values(currentEntry?.habitCompletions ?? {}).some(Boolean) ||
                (currentEntry?.scheduleItems ?? []).some((s) => s.completed)
              const alreadyFrozen = freezeDates.includes(selectedDate)
              const canUseFreeze =
                !hasActivity &&
                !alreadyFrozen &&
                freezeUsedThisMonth < freezeAllowance &&
                selectedDate <= format(new Date(), 'yyyy-MM-dd')
              return canUseFreeze ? (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                    No activity logged for this day. Use a streak freeze to protect your streak?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => useFreezeMutation.mutate(selectedDate)}
                    disabled={useFreezeMutation.isPending}
                    className="border-amber-500/50 text-amber-600 dark:text-amber-400"
                  >
                    Use streak freeze ({freezeAllowance - freezeUsedThisMonth} left this month)
                  </Button>
                </div>
              ) : null
            })()}

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <NotePencil className="h-4 w-4" weight="duotone" />
                Diary note
              </label>
              <Textarea
                value={diaryNote}
                onChange={(e) => setDiaryNote(e.target.value)}
                placeholder="Wins, reflections..."
                className="min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <CheckSquare className="h-4 w-4" weight="duotone" />
                Ad-hoc tasks
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                <Input
                  placeholder="Add task..."
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addScheduleItem())
                  }
                  className="flex-1 min-w-[140px]"
                />
                <select
                  value={newItemRepeat}
                  onChange={(e) =>
                    setNewItemRepeat(e.target.value as 'none' | 'daily' | 'weekly')
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="none">One-time</option>
                  <option value="daily">Repeat daily</option>
                  <option value="weekly">Repeat weekly</option>
                </select>
                <Button onClick={addScheduleItem} disabled={!newItemTitle.trim()}>
                  <Plus className="h-4 w-4" weight="bold" />
                </Button>
              </div>
              <div className="space-y-2">
                {displayScheduleItems.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 p-2 rounded-xl border border-border"
                  >
                    <button onClick={() => toggleScheduleItem(s.id)} className="shrink-0">
                      <CheckSquare
                        className={cn(
                          'h-5 w-5',
                          s.completed ? 'text-green-500' : 'text-muted-foreground'
                        )}
                        weight={s.completed ? 'fill' : 'regular'}
                      />
                    </button>
                    <span
                      className={cn(
                        'flex-1',
                        s.completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {s.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive shrink-0 h-8 w-8"
                      onClick={() => removeScheduleItem(s.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Lightning className="h-4 w-4 mr-2" weight="fill" />
              Save day
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
