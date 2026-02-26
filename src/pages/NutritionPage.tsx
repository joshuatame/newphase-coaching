import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { AddFoodDialog } from '@/components/AddFoodDialog'

export function NutritionPage() {
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const { data: foods = [] } = useQuery({
    queryKey: ['foodItems'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'foodItems'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile,
  })

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Nutrition</h1>
        {isTrainer && <AddFoodDialog />}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {foods.map((f: { id: string; name?: string; calories?: number; protein?: number }) => (
          <div key={f.id} className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium">{f.name}</p>
            <p className="text-sm text-muted-foreground">
              {f.calories} cal | P: {f.protein}g
            </p>
          </div>
        ))}
      </div>
      {foods.length === 0 && (
        <p className="text-muted-foreground">No foods. Run npm run seed:foods to populate.</p>
      )}
    </div>
  )
}
