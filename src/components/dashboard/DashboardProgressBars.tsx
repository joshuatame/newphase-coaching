import { useQuery } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { calcNutrientsFromFoods } from '@/lib/macro-utils'
import { ForkKnife, Drop } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface DashboardProgressBarsProps {
  myClientId: string
  clients: { id: string; uid?: string }[]
  profileUid: string
}

export function DashboardProgressBars({ myClientId }: DashboardProgressBarsProps) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: client } = useQuery({
    queryKey: ['client', myClientId],
    queryFn: async () => {
      if (!myClientId) return null
      const snap = await getDoc(doc(db, 'clients', myClientId))
      return snap.exists() ? snap.data() : null
    },
    enabled: !!myClientId,
  })
  const waterGoalL = (client as { waterGoalL?: number })?.waterGoalL ?? 2.5

  const { data: logsWater = [] } = useQuery({
    queryKey: ['logsWater', myClientId, today],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'logsWater'),
          where('clientId', '==', myClientId),
          where('date', '==', today)
        )
      )
      return snap.docs.map((d) => d.data())
    },
    enabled: !!myClientId,
  })
  const waterConsumed = logsWater.reduce((sum, l) => sum + ((l.amountL as number) ?? 0), 0)

  const { data: plans = [] } = useQuery({
    queryKey: ['mealPlanVersions'],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'mealPlanVersions'), orderBy('createdAt', 'desc'))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; clientIds?: string[]; meals?: { id: string; foods?: { foodId: string; servings: number }[] }[] }[]
    },
    enabled: !!myClientId,
  })
  const myPlan = plans.find((p) => p.clientIds?.includes(myClientId)) ?? plans[0]

  const { data: foods = [] } = useQuery({
    queryKey: ['foodItems'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'foodItems'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; calories?: number; protein?: number; carbs?: number; fat?: number }[]
    },
    enabled: !!myClientId && !!myPlan,
  })
  const foodLookup = Object.fromEntries(foods.map((f) => [f.id, f]))

  const { data: logsMeals = [] } = useQuery({
    queryKey: ['logsMeals', myClientId, today],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'logsMeals'),
          where('clientId', '==', myClientId),
          where('date', '==', today)
        )
      )
      return snap.docs.map((d) => d.data())
    },
    enabled: !!myClientId,
  })

  const allocatedTotals = (() => {
    if (!myPlan?.meals) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    const items: { foodId: string; servings: number }[] = []
    for (const meal of myPlan.meals) {
      for (const f of meal.foods ?? []) {
        items.push({ foodId: f.foodId, servings: f.servings })
      }
    }
    return calcNutrientsFromFoods(items, foodLookup)
  })()

  const consumedTotals = (() => {
    const items: { foodId: string; servings: number }[] = []
    for (const log of logsMeals) {
      if (log.checked) {
        items.push({ foodId: log.foodId, servings: log.servings ?? 1 })
      }
    }
    return calcNutrientsFromFoods(items, foodLookup)
  })()

  const totalMealItems = (myPlan?.meals ?? []).reduce(
    (acc, m) => acc + (m.foods ?? []).length,
    0
  )
  const consumedMealItems = logsMeals.filter((l) => l.checked).length

  const waterPct = waterGoalL > 0 ? Math.min(100, (waterConsumed / waterGoalL) * 100) : 0
  const mealsPct = totalMealItems > 0 ? Math.min(100, (consumedMealItems / totalMealItems) * 100) : 0
  const caloriesGoal = allocatedTotals.calories || 2000
  const caloriesPct = caloriesGoal > 0 ? Math.min(150, (consumedTotals.calories / caloriesGoal) * 100) : 0
  const proteinGoal = allocatedTotals.protein || 150
  const proteinPct = proteinGoal > 0 ? Math.min(150, (consumedTotals.protein / proteinGoal) * 100) : 0
  const carbsGoal = allocatedTotals.carbs || 200
  const carbsPct = carbsGoal > 0 ? Math.min(150, (consumedTotals.carbs / carbsGoal) * 100) : 0
  const fatGoal = allocatedTotals.fat || 65
  const fatPct = fatGoal > 0 ? Math.min(150, (consumedTotals.fat / fatGoal) * 100) : 0

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Today&apos;s progress</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/water">
          <div className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Drop className="h-5 w-5 text-blue-500" weight="duotone" />
              <span className="text-sm font-medium">Water</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${waterPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {waterConsumed.toFixed(1)}L / {waterGoalL}L
            </p>
          </div>
        </Link>

        <Link to="/meals">
          <div className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <ForkKnife className="h-5 w-5 text-primary" weight="duotone" />
              <span className="text-sm font-medium">Meals</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${mealsPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {consumedMealItems} / {totalMealItems} items
            </p>
          </div>
        </Link>

        <Link to="/meals">
          <div className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Calories</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  caloriesPct > 100 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, caloriesPct)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(consumedTotals.calories)} / {Math.round(caloriesGoal)} cal
            </p>
          </div>
        </Link>

        <Link to="/meals">
          <div className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Macros</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs w-14">P</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-red-500/80"
                    style={{ width: `${Math.min(100, proteinPct)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {Math.round(consumedTotals.protein)}g
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-14">C</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-500/80"
                    style={{ width: `${Math.min(100, carbsPct)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {Math.round(consumedTotals.carbs)}g
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs w-14">F</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-500/80"
                    style={{ width: `${Math.min(100, fatPct)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {Math.round(consumedTotals.fat)}g
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
