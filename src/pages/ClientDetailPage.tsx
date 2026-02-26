import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Dumbbell } from 'lucide-react'

interface ClientData {
  id: string
  goals?: string
  trainingExperience?: string
  injuries?: string
  timezone?: string
}

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'clients', clientId!))
      return snap.exists() ? { id: snap.id, ...snap.data() } as ClientData : null
    },
    enabled: !!clientId,
  })


  if (!clientId) return <p>Invalid client</p>
  if (!client) return <p className="p-6">Loading...</p>

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Client Profile</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold mb-2">Details</h2>
          <p>Goals: {client.goals ?? '—'}</p>
          <p>Experience: {client.trainingExperience ?? '—'}</p>
          <p>Injuries: {client.injuries ?? '—'}</p>
          <p>Timezone: {client.timezone ?? '—'}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold mb-2">Quick Actions</h2>
          <Button asChild>
            <Link to={`/workout/new?clientId=${clientId}`}>
              <Dumbbell className="mr-2 h-4 w-4" />
              Start Workout
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
