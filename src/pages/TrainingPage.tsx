import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { AddExerciseDialog } from '@/components/AddExerciseDialog'

export function TrainingPage() {
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const { data: exercises = [] } = useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'exercises'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile,
  })

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Training & Exercises</h1>
        {isTrainer && <AddExerciseDialog />}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((e: { id: string; name?: string; category?: string }) => (
          <div key={e.id} className="p-4 rounded-lg border border-border bg-card">
            <p className="font-medium">{e.name}</p>
            <p className="text-sm text-muted-foreground">{e.category}</p>
          </div>
        ))}
      </div>
      {exercises.length === 0 && (
        <p className="text-muted-foreground">No exercises. Run npm run seed:exercises to populate.</p>
      )}
    </div>
  )
}
