import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { AddSupplementDialog } from '@/components/AddSupplementDialog'

export function RegimenPage() {
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const { data: items = [] } = useQuery({
    queryKey: ['supplementCatalog'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'supplementCatalog'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile,
  })

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Regimen / Supplements / Hormones / Peptides</h1>
        {isTrainer && <AddSupplementDialog />}
      </div>
      <p className="text-muted-foreground mb-4">
        Tracking and compliance only. No dosing calculations or medical advice.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((i: { id: string; name?: string; category?: string; form?: string }) => (
          <div key={i.id} className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium">{i.name}</p>
            <p className="text-sm text-muted-foreground">
              {i.form} • {i.category}
            </p>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-muted-foreground">No items. Run npm run seed:supplements to populate.</p>
      )}
    </div>
  )
}
