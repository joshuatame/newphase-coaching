import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection } from 'firebase/firestore'
import { getDocsCacheFirst } from '@/lib/firestore-cache'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { AddExerciseDialog } from '@/components/AddExerciseDialog'
import { ExerciseDetailDialog, type ExerciseDetail } from '@/components/ExerciseDetailDialog'
import { Spinner } from '@/components/ui/spinner'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'

const BODY_PARTS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'] as const

function getBodyPart(ex: { category?: string }): string {
  const c = (ex.category ?? '').toLowerCase()
  if (c.includes('chest')) return 'Chest'
  if (c.includes('back')) return 'Back'
  if (c.includes('leg')) return 'Legs'
  if (c.includes('shoulder')) return 'Shoulders'
  if (c.includes('arm') || c.includes('bicep') || c.includes('tricep')) return 'Arms'
  if (c.includes('core') || c.includes('ab')) return 'Core'
  if (c.includes('cardio')) return 'Cardio'
  if (c.includes('full')) return 'Full Body'
  return c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Other'
}

export function TrainingPage() {
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'
  const [search, setSearch] = useState('')
  const [bodyPartFilter, setBodyPartFilter] = useState<string>('All')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const snap = await getDocsCacheFirst(collection(db, 'exercises'))
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) })) as ExerciseDetail[]
      const byKey = new Map<string, ExerciseDetail>()
      for (const e of items) {
        const key = (e.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim() || e.id
        const existing = byKey.get(key)
        const preferThis = !existing || (e.id.startsWith('ex-') && !existing.id.startsWith('ex-'))
        if (preferThis) byKey.set(key, e)
      }
      return Array.from(byKey.values())
    },
    enabled: !!profile,
    staleTime: 1000 * 60 * 60 * 24,
  })

  const { filtered, grouped } = useMemo(() => {
    let list = exercises
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.category?.toLowerCase().includes(q) ||
          e.targetMuscles?.some((m) => m.toLowerCase().includes(q)) ||
          e.equipment?.some((eq) => eq.toLowerCase().includes(q))
      )
    }
    if (bodyPartFilter !== 'All') {
      list = list.filter((e) => getBodyPart(e) === bodyPartFilter)
    }
    const byPart = list.reduce<Record<string, ExerciseDetail[]>>((acc, ex) => {
      const part = getBodyPart(ex)
      if (!acc[part]) acc[part] = []
      acc[part].push(ex)
      return acc
    }, {})
    const order = [...BODY_PARTS].filter((b) => b !== 'All')
    const sortedParts = Object.keys(byPart).sort(
      (a, b) => (order.indexOf(a as typeof order[number]) + 1 || 99) - (order.indexOf(b as typeof order[number]) + 1 || 99)
    )
    return {
      filtered: list,
      grouped: sortedParts.map((p) => ({
        part: p,
        exercises: byPart[p]!.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
      })),
    }
  }, [exercises, search, bodyPartFilter])

  const openDetail = (ex: ExerciseDetail) => {
    setSelectedExercise(ex)
    setDetailOpen(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Training & Exercises</h1>
        {isTrainer && <AddExerciseDialog />}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            weight="bold"
          />
          <Input
            placeholder="Search exercises, muscles, equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <select
          value={bodyPartFilter}
          onChange={(e) => setBodyPartFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-4 text-sm"
        >
          {BODY_PARTS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-10 w-10 text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ part, exercises: exs }) => (
            <div key={part}>
              <h2 className="text-lg font-semibold mb-4">{part}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exs.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => openDetail(ex)}
                    className="text-left p-5 rounded-2xl border border-border bg-card hover:bg-card/80 hover:border-primary/50 transition-all w-full min-h-[88px] touch-manipulation cursor-pointer"
                  >
                    {ex.imageUrl && (
                      <img
                        src={ex.imageUrl}
                        alt=""
                        className="w-full h-32 object-cover rounded-xl mb-3"
                      />
                    )}
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-sm text-muted-foreground">{ex.category}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <p className="text-muted-foreground py-8 text-center">Not found</p>
      )}

      <ExerciseDetailDialog
        exercise={selectedExercise}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
