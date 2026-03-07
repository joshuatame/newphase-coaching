import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  addDoc,
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
import { Ruler, Trash, Plus } from '@phosphor-icons/react'

type Measurement = {
  id: string
  clientId: string
  date: string
  weight?: number
  waist?: number
  chest?: number
  hips?: number
  notes?: string
  createdAt?: unknown
}

export function ProgressMeasurementsSection({
  clientId,
  isTrainer,
}: {
  clientId: string
  isTrainer: boolean
}) {
  const qc = useQueryClient()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [notes, setNotes] = useState('')

  const { data: measurements = [] } = useQuery({
    queryKey: ['progressMeasurements', clientId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'progressMeasurements'),
          where('clientId', '==', clientId),
          orderBy('date', 'desc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Measurement[]
    },
    enabled: !!clientId,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'progressMeasurements'), {
        clientId,
        date,
        weight: parseFloat(weight) || undefined,
        waist: parseFloat(waist) || undefined,
        notes: notes.trim() || undefined,
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressMeasurements', clientId] })
      setWeight('')
      setWaist('')
      setNotes('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'progressMeasurements', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progressMeasurements', clientId] }),
  })

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Ruler className="h-5 w-5 text-primary" weight="duotone" />
        Body Measurements
      </h3>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-36"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Weight (kg)</label>
          <Input
            type="number"
            step="0.1"
            placeholder="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-24"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Waist (cm)</label>
          <Input
            type="number"
            step="0.1"
            placeholder="0"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            className="w-24"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <Input
            placeholder="Optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-32"
          />
        </div>
        <Button
          size="sm"
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2">Date</th>
              <th className="text-right py-2">Weight</th>
              <th className="text-right py-2">Waist</th>
              <th className="text-left py-2">Notes</th>
              {isTrainer && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {measurements.map((m) => (
              <tr key={m.id} className="border-b border-border/50">
                <td className="py-2">{m.date}</td>
                <td className="text-right">{m.weight != null ? `${m.weight} kg` : '—'}</td>
                <td className="text-right">{m.waist != null ? `${m.waist} cm` : '—'}</td>
                <td className="text-muted-foreground">{m.notes ?? '—'}</td>
                {isTrainer && (
                  <td>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteMutation.mutate(m.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {measurements.length === 0 && (
        <p className="text-sm text-muted-foreground">No measurements yet.</p>
      )}
    </div>
  )
}
