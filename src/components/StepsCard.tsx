import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { format, subDays } from 'date-fns'
import { Footprints, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function StepsCard({
  clientId,
  compact = false,
}: {
  clientId: string
  compact?: boolean
}) {
  const qc = useQueryClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const [editingSteps, setEditingSteps] = useState<string | null>(null)
  const [stepsValue, setStepsValue] = useState('')

  const { data: stepsLogs = [] } = useQuery({
    queryKey: ['stepsLog', clientId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'stepsLog'),
          where('clientId', '==', clientId),
          where('date', '>=', weekAgo),
          orderBy('date', 'desc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
        id: string
        clientId: string
        date: string
        steps: number
        source?: string
      }[]
    },
    enabled: !!clientId,
  })

  const saveMutation = useMutation({
    mutationFn: async ({ date, steps }: { date: string; steps: number }) => {
      const docId = `${clientId}_${date}`
      await setDoc(doc(db, 'stepsLog', docId), {
        clientId,
        date,
        steps,
        source: 'manual',
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stepsLog', clientId] })
      setEditingSteps(null)
    },
  })

  const stepsByDate = Object.fromEntries(stepsLogs.map((s) => [s.date, s.steps]))
  const todaySteps = stepsByDate[today] ?? null
  const weekSteps = stepsLogs
    .filter((s) => s.date >= weekAgo)
    .reduce((sum, s) => sum + s.steps, 0)
  const weekAvg = stepsLogs.filter((s) => s.date >= weekAgo).length || 1

  if (compact) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-2.5">
            <Footprints className="h-5 w-5 text-emerald-500" weight="duotone" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Steps today</p>
            {editingSteps === today ? (
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={stepsValue}
                  onChange={(e) => setStepsValue(e.target.value)}
                  className="w-24 h-8"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() =>
                    saveMutation.mutate({ date: today, steps: parseInt(stepsValue, 10) || 0 })
                  }
                  disabled={saveMutation.isPending}
                >
                  Save
                </Button>
              </div>
            ) : (
              <p className="font-bold text-lg">
                {todaySteps != null ? todaySteps.toLocaleString() : '—'}
                <button
                  onClick={() => {
                    setEditingSteps(today)
                    setStepsValue(String(todaySteps ?? ''))
                  }}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {todaySteps != null ? 'Edit' : 'Add'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-xl bg-emerald-500/15 p-2.5">
          <Footprints className="h-6 w-6 text-emerald-500" weight="duotone" />
        </div>
        <div>
          <p className="font-medium">Steps</p>
          <p className="text-sm text-muted-foreground">Track your daily steps</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Today</p>
          {editingSteps === today ? (
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                value={stepsValue}
                onChange={(e) => setStepsValue(e.target.value)}
                placeholder="0"
                className="max-w-[140px]"
              />
              <Button
                size="sm"
                onClick={() =>
                  saveMutation.mutate({ date: today, steps: parseInt(stepsValue, 10) || 0 })
                }
                disabled={saveMutation.isPending}
              >
                Save
              </Button>
            </div>
          ) : (
            <p className="text-2xl font-bold">
              {todaySteps != null ? todaySteps.toLocaleString() : '—'}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-8"
                onClick={() => {
                  setEditingSteps(today)
                  setStepsValue(String(todaySteps ?? ''))
                }}
              >
                <Plus className="h-4 w-4" /> {todaySteps != null ? 'Edit' : 'Log'}
              </Button>
            </p>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">7-day total</p>
          <p className="text-xl font-semibold">{weekSteps.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">7-day average</p>
          <p className="text-lg font-medium">
            {Math.round(weekSteps / weekAvg).toLocaleString()} / day
          </p>
        </div>
      </div>
    </div>
  )
}
