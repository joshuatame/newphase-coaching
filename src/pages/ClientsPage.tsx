import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/PageLoader'
import { Link } from 'react-router-dom'
import { Plus } from '@phosphor-icons/react'

export function ClientsPage() {
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const q = isTrainer
        ? query(collection(db, 'clients'))
        : query(collection(db, 'clients'), where('uid', '==', profile?.uid ?? ''))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile,
  })

  if (!profile || isLoading) return <PageLoader />

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        {isTrainer && (
          <Button asChild>
            <Link to="/clients/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Link>
          </Button>
        )}
      </div>
      <div className="grid gap-4">
        {clients.map((c: { id: string; goals?: string }) => {
          const displayName = (c as { displayName?: string }).displayName
          const email = (c as { email?: string }).email
          const name = displayName ?? email ?? `Client ${c.id.slice(0, 8)}`
          const sub = displayName && email ? email : null
          return (
            <Link key={c.id} to={`/clients/${c.id}`}>
              <div className="p-5 rounded-2xl border border-border bg-card hover:bg-accent/10 transition-colors">
                <p className="font-medium">{name}</p>
                {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
                {c.goals && <p className="text-sm text-muted-foreground mt-0.5">{c.goals}</p>}
              </div>
            </Link>
          )
        })}
        {clients.length === 0 && (
          <p className="text-muted-foreground">No clients yet.</p>
        )}
      </div>
    </div>
  )
}
