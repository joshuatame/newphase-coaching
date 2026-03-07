import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash, CaretUp, CaretDown, MagnifyingGlass, Info } from '@phosphor-icons/react'
import { ExerciseDetailDialog, type ExerciseDetail } from '@/components/ExerciseDetailDialog'

export interface PlanExercise {
  exerciseId: string
  name?: string
  sets?: number
  reps?: number
  restSec?: number
  notes?: string
}

export interface WorkoutPlanForEditor {
  id: string
  name?: string
  exercises?: PlanExercise[]
  notes?: string
}

export interface ExerciseForEditor {
  id: string
  name: string
  category?: string
  targetMuscles?: string[]
  equipment?: string[]
  instructions?: string
  videoLink?: string
  imageUrl?: string
}

export function WorkoutPlanEditor({
  plan,
  exercises,
  onSave,
  onClose,
}: {
  plan: WorkoutPlanForEditor
  exercises: ExerciseForEditor[]
  onSave: (plan: { exercises: PlanExercise[]; notes?: string }) => Promise<void>
  onClose: () => void
}) {
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>(
    (plan.exercises ?? []).map((e) => ({
      ...e,
      sets: e.sets ?? 3,
      reps: e.reps ?? 10,
      restSec: e.restSec ?? 60,
    }))
  )
  const [planNotes, setPlanNotes] = useState(plan.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filteredCatalog = useMemo(() => {
    if (!addSearch.trim()) return exercises
    const q = addSearch.toLowerCase()
    return exercises.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
    )
  }, [exercises, addSearch])

  const addExercise = (exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId)
    if (!ex || planExercises.some((e) => e.exerciseId === exerciseId)) return
    setPlanExercises((prev) => [
      ...prev,
      { exerciseId, name: ex.name, sets: 3, reps: 10, restSec: 60 },
    ])
  }

  const removeExercise = (exerciseId: string) => {
    setPlanExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId))
  }

  const updateExercise = (
    exerciseId: string,
    updates: Partial<Omit<PlanExercise, 'exerciseId'>>
  ) => {
    setPlanExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId ? { ...e, ...updates } : e
      )
    )
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= planExercises.length) return
    setPlanExercises((prev) => {
      const copy = [...prev]
      ;[copy[index], copy[newIndex]] = [copy[newIndex], copy[index]]
      return copy
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        exercises: planExercises,
        notes: planNotes.trim() || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const getName = (e: PlanExercise) =>
    e.name ?? exercises.find((x) => x.id === e.exerciseId)?.name ?? e.exerciseId

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit plan: {plan.name ?? 'Unnamed'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan-level notes */}
          <div>
            <label className="text-sm font-medium">Plan notes</label>
            <Textarea
              placeholder="General notes for this workout plan..."
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Exercises list */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Exercises</label>
            {planExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 border border-dashed rounded-xl text-center">
                No exercises yet. Add from the catalog below.
              </p>
            ) : (
              <div className="space-y-2">
                {planExercises.map((ex, idx) => {
                  const fullEx = exercises.find((e) => e.id === ex.exerciseId)
                  const asDetail: ExerciseDetail | null = fullEx
                    ? {
                        id: fullEx.id,
                        name: fullEx.name,
                        category: fullEx.category,
                        targetMuscles: fullEx.targetMuscles,
                        equipment: fullEx.equipment,
                        instructions: fullEx.instructions,
                        videoLink: fullEx.videoLink,
                        imageUrl: fullEx.imageUrl,
                      }
                    : null
                  return (
                  <div
                    key={ex.exerciseId}
                    className="rounded-xl border border-border bg-muted/30 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="font-medium truncate">{getName(ex)}</span>
                        {asDetail && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedExercise(asDetail)
                              setDetailOpen(true)
                            }}
                            className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            aria-label="View details"
                          >
                            <Info className="h-4 w-4" weight="bold" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => moveExercise(idx, 'up')}
                          disabled={idx === 0}
                        >
                          <CaretUp className="h-4 w-4" weight="bold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => moveExercise(idx, 'down')}
                          disabled={idx === planExercises.length - 1}
                        >
                          <CaretDown className="h-4 w-4" weight="bold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(ex.exerciseId)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash className="h-4 w-4" weight="bold" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Sets</label>
                        <Input
                          type="number"
                          min={1}
                          value={ex.sets ?? ''}
                          onChange={(e) =>
                            updateExercise(ex.exerciseId, {
                              sets: parseInt(e.target.value, 10) || undefined,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Reps</label>
                        <Input
                          type="number"
                          min={0}
                          value={ex.reps ?? ''}
                          onChange={(e) =>
                            updateExercise(ex.exerciseId, {
                              reps: parseInt(e.target.value, 10) || undefined,
                            })
                          }
                          className="h-8"
                          placeholder="—"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Rest (sec)</label>
                        <Input
                          type="number"
                          min={0}
                          value={ex.restSec ?? ''}
                          onChange={(e) =>
                            updateExercise(ex.exerciseId, {
                              restSec: parseInt(e.target.value, 10) || undefined,
                            })
                          }
                          className="h-8"
                          placeholder="60"
                        />
                      </div>
                    </div>
                    <div>
                      <Input
                        placeholder="Notes for this exercise..."
                        value={ex.notes ?? ''}
                        onChange={(e) =>
                          updateExercise(ex.exerciseId, { notes: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                  )
                })}
              </div>
            )}

            {/* Add from catalog */}
            <div className="pt-2 border-t border-border">
              <div className="relative mb-2">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  weight="bold"
                />
                <Input
                  placeholder="Search exercises to add..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value=""
                onChange={(e) => {
                  addExercise(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value="">Add exercise from catalog...</option>
                {filteredCatalog
                  .filter((ex) => !planExercises.some((p) => p.exerciseId === ex.id))
                  .map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} {ex.category ? `(${ex.category})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
        <ExerciseDetailDialog
          exercise={selectedExercise}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
