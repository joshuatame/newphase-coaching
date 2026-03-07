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
import { CycleEditor, type CycleSupplement } from '@/components/CycleEditor'
import { Plus, Pencil, Users } from '@phosphor-icons/react'

type Cycle = {
  id: string
  name?: string
  effectiveFrom?: string
  clientIds?: string[]
  supplements?: { supplementId: string; name?: string; dose?: string; frequency?: string; notes?: string }[]
  notes?: string
  createdAt?: unknown
}

export function CyclesPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [clientIds, setClientIds] = useState<string[]>([])
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null)
  const [editingCycleContent, setEditingCycleContent] = useState<Cycle | null>(null)
  const [updateClientIds, setUpdateClientIds] = useState<string[]>([])

  const { data: cycles = [] } = useQuery({
    queryKey: ['regimenVersions'],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'regimenVersions'), orderBy('createdAt', 'desc'))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Cycle[]
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

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplementCatalog'],
    queryFn: async () => {
      const snap = await getDocsCacheFirst(collection(db, 'supplementCatalog'))
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) })) as { id: string; name: string; form?: string; category?: string }[]
      const byKey = new Map<string, typeof items[0]>()
      for (const i of items) {
        const key = (i.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim() || i.id
        const existing = byKey.get(key)
        const preferThis = !existing || (i.id.startsWith('sup-') && !existing.id.startsWith('sup-'))
        if (preferThis) byKey.set(key, i)
      }
      return Array.from(byKey.values())
    },
    enabled: !!profile,
    staleTime: 1000 * 60 * 60 * 24,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'regimenVersions'), {
        name: name.trim(),
        clientIds: clientIds,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        createdBy: profile?.uid ?? null,
        createdAt: serverTimestamp(),
        supplements: [],
      })
    },
    onSuccess: () => {
      setName('')
      setClientIds([])
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['regimenVersions'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      cycleId,
      clientIds: ids,
      updatedForClientIds,
    }: {
      cycleId: string
      clientIds: string[]
      updatedForClientIds?: string[]
    }) => {
      await updateDoc(doc(db, 'regimenVersions', cycleId), {
        clientIds: ids,
        updatedForClientIds: updatedForClientIds ?? ids,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      setEditingCycle(null)
      setUpdateClientIds([])
      qc.invalidateQueries({ queryKey: ['regimenVersions'] })
    },
  })

  const saveCycleContentMutation = useMutation({
    mutationFn: async ({
      cycleId,
      supplements: sups,
      notes,
    }: {
      cycleId: string
      supplements: CycleSupplement[]
      notes?: string
    }) => {
      await updateDoc(doc(db, 'regimenVersions', cycleId), {
        supplements: sups,
        notes: notes ?? null,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      setEditingCycleContent(null)
      qc.invalidateQueries({ queryKey: ['regimenVersions'] })
    },
  })

  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const openEdit = (c: Cycle) => {
    setEditingCycle(c)
    setUpdateClientIds(c.clientIds ?? [])
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cycles</h1>
          <p className="text-muted-foreground mt-1">Supplementation plans allocated to clients.</p>
        </div>
        {isTrainer && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" weight="bold" />
            New cycle
          </Button>
        )}
      </div>

      {showCreate && isTrainer && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Create supplementation cycle</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Cycle name</label>
              <Input
                placeholder="e.g. Winter bulk stack"
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

      {editingCycleContent && isTrainer && (
        <CycleEditor
          cycle={editingCycleContent}
          supplements={supplements}
          onSave={async ({ supplements: sups, notes }) => {
            await saveCycleContentMutation.mutateAsync({
              cycleId: editingCycleContent.id,
              supplements: sups,
              notes,
            })
          }}
          onClose={() => setEditingCycleContent(null)}
        />
      )}

      {editingCycle && isTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-foreground shadow-xl p-5">
            <h3 className="font-semibold mb-3">Update allocation: {editingCycle.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Changes apply only to the selected clients. Email notifications will be sent to updated clients.
            </p>
            <ClientMultiSelect value={updateClientIds} onChange={setUpdateClientIds} />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() =>
                  updateMutation.mutate({
                    cycleId: editingCycle.id,
                    clientIds: updateClientIds,
                    updatedForClientIds: updateClientIds,
                  })
                }
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditingCycle(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Cycles</h2>
        {cycles.length === 0 ? (
          <p className="text-muted-foreground">No cycles yet.</p>
        ) : (
          <div className="space-y-2">
            {cycles.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border"
              >
                <div>
                  <p className="font-medium">{c.name ?? 'Unnamed'}</p>
                  <p className="text-sm text-muted-foreground">
                    From {c.effectiveFrom ?? '—'}
                    {(c.supplements?.length ?? 0) > 0 && ` • ${c.supplements!.length} supplements`}
                  </p>
                  {(c.clientIds?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" weight="duotone" />
                      {c.clientIds!.map((cid) => clientsMap[cid] ?? cid).join(', ')}
                    </div>
                  )}
                </div>
                {isTrainer && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingCycleContent(c)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit cycle
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
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
