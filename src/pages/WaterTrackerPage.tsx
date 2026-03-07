import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useMyClientId } from '@/hooks/useMyClientId'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoader } from '@/components/PageLoader'
import { Drop } from '@phosphor-icons/react'

const GLASS_SIZES = [0.25, 0.5, 1, 1.5, 2] // litres

function getMyClientId(clients: { id: string; uid?: string }[], profileUid: string): string | null {
  const byUid = clients.find((c) => c.uid === profileUid)
  if (byUid) return byUid.id
  const byId = clients.find((c) => c.id === profileUid)
  return byId?.id ?? null
}

export function WaterTrackerPage() {
  const { profile } = useAuth()
  const myClientIdFromHook = useMyClientId()
  const qc = useQueryClient()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'clients'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; uid?: string }[]
    },
    enabled: !!profile,
  })

  const myClientId = useMemo(
    () => (profile?.uid ? getMyClientId(clients, profile.uid) : null) ?? myClientIdFromHook,
    [clients, profile?.uid, myClientIdFromHook]
  )

  const { data: client } = useQuery({
    queryKey: ['client', myClientId],
    queryFn: async () => {
      if (!myClientId) return null
      const snap = await getDoc(doc(db, 'clients', myClientId))
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    },
    enabled: !!myClientId,
  })

  const waterGoalL = (client as { waterGoalL?: number })?.waterGoalL ?? 2.5

  const { data: logs = [] } = useQuery({
    queryKey: ['logsWater', myClientId, date],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'logsWater'),
          where('clientId', '==', myClientId!),
          where('date', '==', date)
        )
      )
      return snap.docs.map((d) => d.data())
    },
    enabled: !!myClientId && !!date,
  })

  const totalToday = useMemo(
    () => logs.reduce((sum, l) => sum + ((l.amountL as number) ?? 0), 0),
    [logs]
  )

  const addMutation = useMutation({
    mutationFn: async (amountL: number) => {
      const docId = `${myClientId}_${date}_${Date.now()}`
      await setDoc(
        doc(db, 'logsWater', docId),
        {
          clientId: myClientId,
          date,
          amountL,
          loggedAt: serverTimestamp(),
        },
        { merge: true }
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logsWater', myClientId, date] })
    },
  })

  if (!profile || clientsLoading) return <PageLoader />
  if (profile?.role !== 'client' && !myClientIdFromHook) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Water tracking is for clients. Create a client record linked to your account to self-coach.</p>
      </div>
    )
  }
  if (!myClientId) return <PageLoader />

  const progress = Math.min(100, (totalToday / waterGoalL) * 100)

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Water intake</h1>
        <p className="text-muted-foreground mt-1">
          Goal: {waterGoalL}L (set by your coach)
        </p>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Date</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-full bg-blue-500/15 p-4">
            <Drop className="h-12 w-12 text-blue-500" weight="duotone" />
          </div>
          <div>
            <p className="text-3xl font-bold">{totalToday.toFixed(1)} L</p>
            <p className="text-muted-foreground">of {waterGoalL} L today</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Log water</h2>
        <div className="flex flex-wrap gap-2">
          {GLASS_SIZES.map((size) => (
            <Button
              key={size}
              variant="outline"
              onClick={() => addMutation.mutate(size)}
              disabled={addMutation.isPending}
            >
              +{size}L
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
