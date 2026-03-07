import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trophy, Plus, Trash, Users } from '@phosphor-icons/react'
import { ClientMultiSelect } from '@/components/ClientMultiSelect'
import type { ChallengeMetric } from '@/pages/CommunityChallengesPage'
import { format, isAfter } from 'date-fns'

const METRICS: { value: ChallengeMetric; label: string }[] = [
  { value: 'steps', label: 'Most steps' },
  { value: 'weight_loss', label: 'Biggest weight loss' },
  { value: 'workouts', label: 'Most workouts' },
]

export function ChallengeManager() {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [metric, setMetric] = useState<ChallengeMetric>('steps')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [inviteChallengeId, setInviteChallengeId] = useState<string | null>(null)

  const { data: challenges = [] } = useQuery({
    queryKey: ['communityChallenges'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'communityChallenges'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
        id: string
        title: string
        description?: string
        metric: ChallengeMetric
        startDate: string
        endDate: string
        createdAt?: unknown
      }[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const ref = await addDoc(collection(db, 'communityChallenges'), {
        title: title.trim(),
        description: description.trim() || null,
        metric,
        startDate,
        endDate,
        createdBy: null,
        createdAt: serverTimestamp(),
      })
      return ref.id
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['communityChallenges'] })
      setTitle('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setInviteChallengeId(id)
      setSelectedClients([])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const participants = await getDocs(
        query(collection(db, 'challengeParticipants'), where('challengeId', '==', id))
      )
      for (const d of participants.docs) {
        await deleteDoc(d.ref)
      }
      await deleteDoc(doc(db, 'communityChallenges', id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communityChallenges'] })
      setInviteChallengeId(null)
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async ({ challengeId, clientIds }: { challengeId: string; clientIds: string[] }) => {
      const clientsSnap = await getDocs(collection(db, 'clients'))
      const clientMap = Object.fromEntries(
        clientsSnap.docs.map((d) => {
          const data = d.data()
          return [d.id, { displayName: data.displayName, email: data.email }]
        })
      )
      for (const clientId of clientIds) {
        const existing = await getDocs(
          query(
            collection(db, 'challengeParticipants'),
            where('challengeId', '==', challengeId),
            where('clientId', '==', clientId)
          )
        )
        if (!existing.empty) continue
        const c = clientMap[clientId] as { displayName?: string; email?: string } | undefined
        await addDoc(collection(db, 'challengeParticipants'), {
          challengeId,
          clientId,
          displayName: c?.displayName ?? c?.email ?? null,
          invitedAt: serverTimestamp(),
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challengeParticipants'] })
      setSelectedClients([])
      setInviteChallengeId(null)
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startDate || !endDate) return
    createMutation.mutate()
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-semibold flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-primary" weight="duotone" />
        Community challenges
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Create challenges, set a time frame, and invite clients. Leaderboard pulls data from steps, weight, and workouts.
      </p>

      <form onSubmit={handleCreate} className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium block mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="30-Day Step Challenge"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            className="min-h-[60px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Metric</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as ChallengeMetric)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {METRICS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Start date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">End date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={createMutation.isPending || !title.trim()}>
          <Plus className="h-4 w-4 mr-2" weight="bold" />
          Create challenge
        </Button>
      </form>

      {inviteChallengeId && (
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm font-medium mb-2">
            Invite participants to &quot;{challenges.find((c) => c.id === inviteChallengeId)?.title ?? 'challenge'}&quot;
          </p>
          <ClientMultiSelect value={selectedClients} onChange={setSelectedClients} />
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() =>
                inviteMutation.mutate({ challengeId: inviteChallengeId, clientIds: selectedClients })
              }
              disabled={inviteMutation.isPending || selectedClients.length === 0}
            >
              <Users className="h-4 w-4 mr-2" />
              Invite selected
            </Button>
            <Button variant="outline" onClick={() => { setInviteChallengeId(null); setSelectedClients([]) }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {challenges.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Existing challenges</h3>
          <div className="space-y-2">
            {challenges.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border"
              >
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {METRICS.find((m) => m.value === c.metric)?.label} ·{' '}
                    {format(new Date(c.startDate), 'd MMM')} – {format(new Date(c.endDate), 'd MMM yyyy')}
                    {isAfter(new Date(c.startDate), new Date()) && ' (upcoming)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInviteChallengeId(c.id)
                      setSelectedClients([])
                    }}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Invite
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(c.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
