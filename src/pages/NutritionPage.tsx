import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection } from 'firebase/firestore'
import { getDocsCacheFirst } from '@/lib/firestore-cache'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { AddFoodDialog } from '@/components/AddFoodDialog'
import { FoodDetailDialog, type FoodDetail } from '@/components/FoodDetailDialog'
import { Spinner } from '@/components/ui/spinner'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'

const CATEGORIES = ['All', 'Proteins', 'Carbs', 'Fats', 'Vegetables', 'Fruits', 'Dairy', 'Nuts & Seeds'] as const

function inferCategory(food: { name?: string; protein?: number; carbs?: number; fat?: number }): string {
  const n = (food.name ?? '').toLowerCase()
  if (n.includes('chicken') || n.includes('beef') || n.includes('fish') || n.includes('egg') || n.includes('turkey') || n.includes('tuna') || n.includes('salmon') || n.includes('shrimp') || n.includes('tofu') || n.includes('protein')) return 'Proteins'
  if (n.includes('rice') || n.includes('pasta') || n.includes('oatmeal') || n.includes('bread') || n.includes('quinoa') || n.includes('potato') || n.includes('cream of rice')) return 'Carbs'
  if (n.includes('oil') || n.includes('avocado') || n.includes('butter') || n.includes('peanut butter')) return 'Fats'
  if (n.includes('broccoli') || n.includes('spinach') || n.includes('kale') || n.includes('asparagus') || n.includes('beans') || n.includes('lentils') || n.includes('zucchini') || n.includes('carrot') || n.includes('brussels')) return 'Vegetables'
  if (n.includes('banana') || n.includes('apple') || n.includes('berry') || n.includes('orange') || n.includes('grape') || n.includes('mango') || n.includes('melon') || n.includes('peach') || n.includes('kiwi') || n.includes('cherry') || n.includes('plum')) return 'Fruits'
  if (n.includes('milk') || n.includes('yogurt') || n.includes('cheese') || n.includes('cottage') || n.includes('kefir') || n.includes('skyr')) return 'Dairy'
  if (n.includes('almond') || n.includes('walnut') || n.includes('cashew') || n.includes('seed') || n.includes('nut')) return 'Nuts & Seeds'
  return 'Other'
}

export function NutritionPage() {
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [selectedFood, setSelectedFood] = useState<FoodDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['foodItems'],
    queryFn: async () => {
      const snap = await getDocsCacheFirst(collection(db, 'foodItems'))
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) })) as FoodDetail[]
      const byKey = new Map<string, FoodDetail>()
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

  const filtered = useMemo(() => {
    let list = foods
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((f) => f.name?.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'All') {
      list = list.filter((f) => inferCategory(f) === categoryFilter)
    }
    return list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [foods, search, categoryFilter])

  const openDetail = (item: FoodDetail) => {
    setSelectedFood(item)
    setDetailOpen(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Nutrition</h1>
        {isTrainer && <AddFoodDialog />}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            weight="bold"
          />
          <Input
            placeholder="Search foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-4 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-10 w-10 text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => openDetail(f)}
              className="text-left p-5 rounded-2xl border border-border bg-card hover:bg-card/80 hover:border-primary/50 transition-all w-full min-h-[88px] touch-manipulation cursor-pointer"
            >
              <p className="font-medium">{f.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {f.calories} cal · P: {f.protein}g C: {f.carbs}g F: {f.fat}g
              </p>
              <p className="text-xs text-muted-foreground mt-1">{inferCategory(f)}</p>
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <p className="text-muted-foreground py-8 text-center">Not found</p>
      )}

      <FoodDetailDialog food={selectedFood} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}
