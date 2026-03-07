import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { getDocsCacheFirst } from '@/lib/firestore-cache'
import { format } from 'date-fns'
import { calcNutrientsFromFoods } from '@/lib/macro-utils'
import { Input } from '@/components/ui/input'
import { PageLoader } from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import { Check, Circle, Info, Plus, Trash } from '@phosphor-icons/react'
import { FoodDetailDialog, type FoodDetail } from '@/components/FoodDetailDialog'

type MealFood = { foodId: string; servings: number; name?: string }
type Meal = { id: string; name: string; foods: MealFood[]; notes?: string }
type MealPlan = { id: string; name?: string; meals?: Meal[]; clientIds?: string[] }

function getMyClientId(clients: { id: string; uid?: string }[], profileUid: string): string | null {
  const byUid = clients.find((c) => c.uid === profileUid)
  if (byUid) return byUid.id
  const byId = clients.find((c) => c.id === profileUid)
  return byId?.id ?? null
}

export function ClientMealTrackingPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedFood, setSelectedFood] = useState<FoodDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [searchCatalog, setSearchCatalog] = useState('')

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'clients'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; uid?: string }[]
    },
    enabled: !!profile,
  })

  const myClientId = useMemo(
    () => (profile?.uid ? getMyClientId(clients, profile.uid) : null),
    [clients, profile?.uid]
  )

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['mealPlanVersions'],
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'mealPlanVersions'), orderBy('createdAt', 'desc'))
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MealPlan[]
    },
    enabled: !!profile,
  })

  const myPlan = useMemo(
    () => plans.find((p) => p.clientIds?.includes(myClientId ?? '')) ?? plans[0],
    [plans, myClientId]
  )

  const effectiveClientId = myClientId ?? profile?.uid ?? null

  const { data: foods = [], isLoading: foodsLoading } = useQuery({
    queryKey: ['foodItems'],
    queryFn: async () => {
      const snap = await getDocsCacheFirst(collection(db, 'foodItems'))
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) })) as { id: string; name: string; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; sugar?: number; sodium?: number }[]
      const byKey = new Map<string, typeof items[0]>()
      for (const f of items) {
        const key = (f.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim() || f.id
        const existing = byKey.get(key)
        const preferThis = !existing || (f.id.startsWith('food-') && !existing.id.startsWith('food-'))
        if (preferThis) byKey.set(key, f)
      }
      return Array.from(byKey.values())
    },
    enabled: !!profile,
    staleTime: 1000 * 60 * 60 * 24,
  })

  const filteredCatalog = useMemo(() => {
    if (!searchCatalog.trim()) return foods.slice(0, 50)
    const q = searchCatalog.toLowerCase()
    return foods.filter((f) => f.name?.toLowerCase().includes(q)).slice(0, 30)
  }, [foods, searchCatalog])

  const foodLookup = useMemo(
    () => Object.fromEntries(foods.map((f) => [f.id, f])),
    [foods]
  )

  const { data: logsMeals } = useQuery({
    queryKey: ['logsMeals', effectiveClientId, date],
    queryFn: async () => {
      if (!effectiveClientId) return []
      const snap = await getDocs(
        query(
          collection(db, 'logsMeals'),
          where('clientId', '==', effectiveClientId),
          where('date', '==', date)
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; clientId?: string; date?: string; mealId?: string | null; foodId?: string; servings?: number; checked?: boolean }[]
    },
    enabled: !!effectiveClientId && !!date,
  })

  const consumedMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const log of logsMeals ?? []) {
      const mealId = log.mealId ?? ''
      const key = `${mealId}_${log.foodId}_${log.servings ?? 1}`
      map[key] = true
    }
    return map
  }, [logsMeals])

  const planMealIds = useMemo(() => new Set((myPlan?.meals ?? []).map((m) => m.id)), [myPlan])
  const independentLogs = useMemo(
    () => (logsMeals ?? []).filter((log) => log.mealId == null || log.mealId === '' || !planMealIds.has(log.mealId ?? '')),
    [logsMeals, planMealIds]
  )

  const addIndependentLogMutation = useMutation({
    mutationFn: async ({ foodId, servings }: { foodId: string; servings: number }) => {
      if (!effectiveClientId) return
      await addDoc(collection(db, 'logsMeals'), {
        clientId: effectiveClientId,
        date,
        mealId: null,
        foodId,
        servings,
        checked: true,
        loggedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logsMeals', effectiveClientId, date] })
    },
  })

  const removeLogMutation = useMutation({
    mutationFn: async (docId: string) => {
      await deleteDoc(doc(db, 'logsMeals', docId))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logsMeals', effectiveClientId, date] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({
      mealId,
      foodId,
      servings,
      checked,
    }: { mealId?: string; foodId: string; servings: number; checked: boolean }) => {
      if (!effectiveClientId) return
      const docId = `${effectiveClientId}_${date}_${mealId ?? 'none'}_${foodId}`
      if (checked) {
        await setDoc(
          doc(db, 'logsMeals', docId),
          {
            clientId: effectiveClientId,
            date,
            mealId: mealId || null,
            foodId,
            servings,
            checked: true,
            loggedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } else {
        await deleteDoc(doc(db, 'logsMeals', docId))
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logsMeals', effectiveClientId, date] })
    },
  })

  const isChecked = (mealId: string, foodId: string, servings: number) =>
    consumedMap[`${mealId}_${foodId}_${servings}`] ?? consumedMap[`_${foodId}_${servings}`] ?? false

  const allocatedTotals = useMemo(() => {
    const allFoods: { foodId: string; servings: number }[] = []
    for (const meal of myPlan?.meals ?? []) {
      for (const f of meal.foods ?? []) {
        allFoods.push({ foodId: f.foodId, servings: f.servings })
      }
    }
    const lookup: Record<string, { calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; sugar?: number; sodium?: number }> = {}
    for (const f of foods) {
      lookup[f.id] = f
    }
    return calcNutrientsFromFoods(allFoods, lookup)
  }, [myPlan, foods])

  const consumedTotals = useMemo(() => {
    const items: { foodId: string; servings: number }[] = []
    for (const log of logsMeals ?? []) {
      if (log.checked) {
        items.push({ foodId: log.foodId ?? '', servings: log.servings ?? 1 })
      }
    }
    const lookup: Record<string, { calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; sugar?: number; sodium?: number }> = {}
    for (const f of foods) {
      lookup[f.id] = f
    }
    return calcNutrientsFromFoods(items, lookup)
  }, [logsMeals, foods])

  const NUTRIENT_KEYS = ['calories', 'protein', 'carbs', 'fat'] as const

  if (!profile || clientsLoading || plansLoading || foodsLoading) return <PageLoader />
  if (profile?.role !== 'client') {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Meal tracking is for clients only.</p>
      </div>
    )
  }
  if (!effectiveClientId) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Unable to load your profile. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meal tracking</h1>
        <p className="text-muted-foreground mt-1">Tick off foods as you eat them. Track your progress.</p>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Date</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">Daily totals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {NUTRIENT_KEYS.map((key) => (
            <div key={key} className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground capitalize">{key}</p>
              <p className="font-semibold">
                {Math.round(consumedTotals[key] ?? 0)}
                {key === 'calories' ? ' cal' : 'g'}
                <span className="text-muted-foreground font-normal text-sm">
                  {' '}
                  / {Math.round(allocatedTotals[key] ?? 0) || '—'}
                  {key === 'calories' ? '' : 'g'}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {!myPlan ? (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" weight="duotone" />
            Log your own meals
          </h2>
          <p className="text-sm text-muted-foreground">
            No meal plan from your coach yet. You can still log any food from the catalog below.
          </p>
          <Input
            placeholder="Search foods..."
            value={searchCatalog}
            onChange={(e) => setSearchCatalog(e.target.value)}
            className="max-w-xs rounded-xl"
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCatalog.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border border-border bg-muted/30"
              >
                <button
                  type="button"
                  onClick={() => {
                    const asDetail: FoodDetail = {
                      id: f.id,
                      name: f.name,
                      calories: f.calories ?? 0,
                      protein: f.protein ?? 0,
                      carbs: f.carbs ?? 0,
                      fat: f.fat ?? 0,
                      servingSize: (f as { servingSize?: string }).servingSize ?? '100g',
                      servingUnit: (f as { servingUnit?: string }).servingUnit,
                    }
                    setSelectedFood(asDetail)
                    setDetailOpen(true)
                  }}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.calories ?? 0} cal · P: {f.protein ?? 0}g C: {f.carbs ?? 0}g F: {f.fat ?? 0}g
                  </p>
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addIndependentLogMutation.mutate({ foodId: f.id, servings: 1 })}
                  disabled={addIndependentLogMutation.isPending}
                >
                  Add (×1)
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold">{myPlan.name ?? 'Meal plan'}</h2>
          {(myPlan.meals ?? []).map((meal) => (
            <div key={meal.id} className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-medium mb-3">{meal.name}</h3>
              {meal.notes && <p className="text-sm text-muted-foreground mb-2">{meal.notes}</p>}
              <div className="space-y-2">
                {(meal.foods ?? []).map((f) => {
                  const checked = isChecked(meal.id, f.foodId, f.servings)
                  const food = foodLookup[f.foodId]
                  const label = food?.name ?? f.name ?? f.foodId
                  const asDetail: FoodDetail | null = food
                    ? {
                        id: food.id,
                        name: food.name,
                        calories: food.calories ?? 0,
                        protein: food.protein ?? 0,
                        carbs: food.carbs ?? 0,
                        fat: food.fat ?? 0,
                        fiber: food.fiber,
                        sugar: food.sugar,
                        sodium: food.sodium,
                        servingSize: (food as { servingSize?: string }).servingSize ?? '100g',
                        servingUnit: (food as { servingUnit?: string }).servingUnit,
                      }
                    : null
                  return (
                    <div
                      key={`${meal.id}-${f.foodId}-${f.servings}`}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        checked ? 'bg-green-500/10 border-green-500/30' : 'hover:bg-muted/50 border-border'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleMutation.mutate({
                            mealId: meal.id,
                            foodId: f.foodId,
                            servings: f.servings,
                            checked: !checked,
                          })
                        }
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        {checked ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0" weight="bold" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0" weight="regular" />
                        )}
                        <span className={checked ? 'line-through text-muted-foreground' : ''}>
                          {label} × {f.servings}
                        </span>
                      </button>
                      {asDetail && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFood(asDetail)
                            setDetailOpen(true)
                          }}
                          className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                          aria-label="View macros"
                        >
                          <Info className="h-4 w-4" weight="bold" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {myPlan && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" weight="duotone" />
            Also log other foods
          </h2>
          <p className="text-sm text-muted-foreground">
            Add any food from the catalog that isn’t on your plan.
          </p>
          <Input
            placeholder="Search foods..."
            value={searchCatalog}
            onChange={(e) => setSearchCatalog(e.target.value)}
            className="max-w-xs rounded-xl"
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCatalog.slice(0, 12).map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border border-border bg-muted/30"
              >
                <button
                  type="button"
                  onClick={() => {
                    const asDetail: FoodDetail = {
                      id: f.id,
                      name: f.name,
                      calories: f.calories ?? 0,
                      protein: f.protein ?? 0,
                      carbs: f.carbs ?? 0,
                      fat: f.fat ?? 0,
                      servingSize: (f as { servingSize?: string }).servingSize ?? '100g',
                      servingUnit: (f as { servingUnit?: string }).servingUnit,
                    }
                    setSelectedFood(asDetail)
                    setDetailOpen(true)
                  }}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.calories ?? 0} cal · P: {f.protein ?? 0}g
                  </p>
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addIndependentLogMutation.mutate({ foodId: f.id, servings: 1 })}
                  disabled={addIndependentLogMutation.isPending}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {independentLogs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-3">Other foods logged today</h2>
          <ul className="space-y-2">
            {independentLogs.map((log) => {
              const food = foodLookup[log.foodId ?? '']
              const label = food?.name ?? log.foodId ?? 'Food'
              const servings = log.servings ?? 1
              return (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-border bg-muted/30"
                >
                  <span className="font-medium truncate">{label} × {servings}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeLogMutation.mutate(log.id)}
                    disabled={removeLogMutation.isPending}
                    aria-label="Remove"
                  >
                    <Trash className="h-4 w-4" weight="bold" />
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <FoodDetailDialog food={selectedFood} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}
