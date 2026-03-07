import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { getDocsCacheFirst } from '@/lib/firestore-cache'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientMultiSelect } from '@/components/ClientMultiSelect'
import { WorkoutPlanEditor, type PlanExercise } from '@/components/WorkoutPlanEditor'
import { Plus, Pencil, Users } from '@phosphor-icons/react'

type WorkoutPlan = {
  id: string
  name?: string
  effectiveFrom?: string
  clientIds?: string[]
  exercises?: { exerciseId: string; name?: string; sets?: number; reps?: number; restSec?: number; notes?: string }[]
  notes?: string
  createdAt?: unknown
}

export function WorkoutPlansPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [clientIds, setClientIds] = useState<string[]>([])
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null)
  const [editingPlanContent, setEditingPlanContent] = useState<WorkoutPlan | null>(null)
  const [updateClientIds, setUpdateClientIds] = useState<string[]>([])

  const { data: plans = [] } = useQuery({
    queryKey: ['workoutPlanVersions'],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'workoutPlanVersions'), orderBy('createdAt', 'desc'))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WorkoutPlan[]
    },
    enabled: !!profile,
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
    enabled: !!profile,
  })

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const snap = await getDocsCacheFirst(collection(db, 'exercises'))
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) })) as { id: string; name: string; category?: string }[]
      const byKey = new Map<string, { id: string; name: string; category?: string }>()
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

  const createMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'workoutPlanVersions'), {
        name: name.trim(),
        clientIds: clientIds,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        createdBy: profile?.uid ?? null,
        createdAt: serverTimestamp(),
        exercises: [],
      })
    },
    onSuccess: () => {
      setName('')
      setClientIds([])
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['workoutPlanVersions'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      planId,
      clientIds: ids,
      updatedForClientIds,
    }: {
      planId: string
      clientIds: string[]
      updatedForClientIds?: string[]
    }) => {
      await updateDoc(doc(db, 'workoutPlanVersions', planId), {
        clientIds: ids,
        updatedForClientIds: updatedForClientIds ?? ids,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      setEditingPlan(null)
      setUpdateClientIds([])
      qc.invalidateQueries({ queryKey: ['workoutPlanVersions'] })
    },
  })

  const savePlanContentMutation = useMutation({
    mutationFn: async ({
      planId,
      exercises,
      notes,
    }: {
      planId: string
      exercises: PlanExercise[]
      notes?: string
    }) => {
      await updateDoc(doc(db, 'workoutPlanVersions', planId), {
        exercises,
        notes: notes ?? null,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      setEditingPlanContent(null)
      qc.invalidateQueries({ queryKey: ['workoutPlanVersions'] })
    },
  })

  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const openEdit = (p: WorkoutPlan) => {
    setEditingPlan(p)
    setUpdateClientIds(p.clientIds ?? [])
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workout plans</h1>
          <p className="text-muted-foreground mt-1">Versioned training plans (exercises) allocated to clients.</p>
        </div>
        {isTrainer && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" weight="bold" />
            New plan
          </Button>
        )}
      </div>

      {showCreate && isTrainer && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Create workout plan</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Plan name</label>
              <Input
                placeholder="e.g. Push Pull Legs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <ClientMultiSelect value={clientIds} onChange={setClientIds} />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!name.trim() || createMutation.isPending}
              >
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingPlanContent && isTrainer && (
        <WorkoutPlanEditor
          plan={editingPlanContent}
          exercises={exercises}
          onSave={async ({ exercises: exs, notes }) => {
            await savePlanContentMutation.mutateAsync({
              planId: editingPlanContent.id,
              exercises: exs,
              notes,
            })
          }}
          onClose={() => setEditingPlanContent(null)}
        />
      )}

      {editingPlan && isTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-foreground shadow-xl p-5">
            <h3 className="font-semibold mb-3">Update allocation: {editingPlan.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Changes apply only to the selected clients. Email notifications will be sent to updated clients.
            </p>
            <ClientMultiSelect value={updateClientIds} onChange={setUpdateClientIds} />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() =>
                  updateMutation.mutate({
                    planId: editingPlan.id,
                    clientIds: updateClientIds,
                    updatedForClientIds: updateClientIds,
                  })
                }
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditingPlan(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Plans</h2>
        {plans.length === 0 ? (
          <p className="text-muted-foreground">No workout plans yet.</p>
        ) : (
          <div className="space-y-2">
            {plans.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border"
              >
                <div>
                  <p className="font-medium">{p.name ?? 'Unnamed'}</p>
                  <p className="text-sm text-muted-foreground">
                    From {p.effectiveFrom ?? '—'}
                    {(p.exercises?.length ?? 0) > 0 && ` • ${p.exercises!.length} exercises`}
                  </p>
                  {(p.clientIds?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" weight="duotone" />
                      {p.clientIds!.map((cid) => clientsMap[cid] ?? cid).join(', ')}
                    </div>
                  )}
                </div>
                {isTrainer && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingPlanContent(p)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit plan
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Allocate
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
