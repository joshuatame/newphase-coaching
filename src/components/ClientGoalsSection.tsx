import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Target, Plus, Trash, PencilSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type Goal = {
  id: string
  clientId: string
  title: string
  targetValue?: number
  currentValue?: number
  unit?: string
  targetDate?: string
  createdAt?: unknown
}

export function ClientGoalsSection({
  clientId,
  isTrainer,
}: {
  clientId: string
  isTrainer: boolean
}) {
  const qc = useQueryClient()
  const [newTitle, setNewTitle] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { data: goals = [] } = useQuery({
    queryKey: ['clientGoals', clientId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'clientGoals'),
          where('clientId', '==', clientId),
          orderBy('createdAt', 'desc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Goal[]
    },
    enabled: !!clientId,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'clientGoals'), {
        clientId,
        title: newTitle.trim(),
        targetValue: parseFloat(newTarget) || undefined,
        currentValue: 0,
        unit: newUnit.trim() || undefined,
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientGoals', clientId] })
      setNewTitle('')
      setNewTarget('')
      setNewUnit('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number }) => {
      await updateDoc(doc(db, 'clientGoals', id), { currentValue })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientGoals', clientId] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'clientGoals', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientGoals', clientId] }),
  })

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" weight="duotone" />
        Goals & Milestones
      </h3>
      <div className="space-y-3">
        {goals.map((g) => {
          const target = g.targetValue ?? 100
          const current = g.currentValue ?? 0
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
          const isEditing = editingId === g.id
          return (
            <div
              key={g.id}
              className="p-4 rounded-xl border border-border bg-muted/20 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{g.title}</span>
                {isTrainer && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(g.id)
                        setEditValue(String(g.currentValue ?? 0))
                      }}
                    >
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate(g.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24"
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      updateMutation.mutate({ id: g.id, currentValue: parseFloat(editValue) || 0 })
                    }
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="font-bold text-primary">{current}</span>
                    {g.unit && <span className="text-muted-foreground">{g.unit}</span>}
                    {g.targetValue != null && (
                      <span className="text-muted-foreground">/ {target} {g.unit}</span>
                    )}
                    {pct >= 100 && (
                      <span className="text-green-500 font-medium">✓ Milestone reached!</span>
                    )}
                  </div>
                  {g.targetValue != null && (
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all rounded-full',
                          pct >= 100 ? 'bg-green-500' : 'bg-primary'
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
      {isTrainer && (
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Goal title (e.g. Lose 5kg)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="max-w-[200px]"
          />
          <Input
            placeholder="Target (e.g. 5)"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            type="number"
            className="w-20"
          />
          <Input
            placeholder="Unit (kg)"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="w-16"
          />
          <Button
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={!newTitle.trim() || addMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-1" /> Add goal
          </Button>
        </div>
      )}
    </div>
  )
}
