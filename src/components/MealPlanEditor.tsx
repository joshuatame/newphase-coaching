import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { calcNutrientsFromFoods, formatNutrient, type FoodWithServings } from '@/lib/macro-utils'
import { Plus, Trash, Info } from '@phosphor-icons/react'
import { FoodDetailDialog, type FoodDetail } from '@/components/FoodDetailDialog'

const DEFAULT_MEAL_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2']

export interface MealFood {
  foodId: string
  servings: number
  name?: string
}

export interface Meal {
  id: string
  name: string
  foods: MealFood[]
  notes?: string
}

export interface MealPlanForEditor {
  id: string
  name?: string
  meals?: Meal[]
  notes?: string
}

export interface FoodItemForEditor {
  id: string
  name: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  sodium?: number
  servingSize?: string
  servingUnit?: string
}

function formatNutrientDisplay(value: number, key: string): string {
  if (key === 'calories') return `${Math.round(value)} cal`
  return formatNutrient(value, key)
}

const NUTRIENT_KEYS = ['calories', 'protein', 'carbs', 'fat'] as const

function NutrientSummary({ totals }: { totals: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {NUTRIENT_KEYS.map((key) => (
        <span key={key} className="text-muted-foreground">
          {key === 'calories' ? 'Cal' : key.charAt(0).toUpperCase() + key.slice(1)}:{' '}
          <span className="font-medium text-foreground">{formatNutrientDisplay(totals[key] ?? 0, key)}</span>
        </span>
      ))}
    </div>
  )
}

export function MealPlanEditor({
  plan,
  foods,
  onSave,
  onClose,
}: {
  plan: MealPlanForEditor
  foods: FoodItemForEditor[]
  onSave: (plan: { meals: Meal[]; notes?: string }) => Promise<void>
  onClose: () => void
}) {
  const [meals, setMeals] = useState<Meal[]>(
    plan.meals?.length
      ? plan.meals.map((m) => ({ ...m, foods: [...(m.foods ?? [])] }))
      : DEFAULT_MEAL_NAMES.map((name, i) => ({
          id: `meal-${Date.now()}-${i}`,
          name,
          foods: [],
          notes: '',
        }))
  )
  const [planNotes, setPlanNotes] = useState(plan.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const foodLookup = Object.fromEntries(
    foods.map((f) => [
      f.id,
      {
        calories: f.calories ?? 0,
        protein: f.protein ?? 0,
        carbs: f.carbs ?? 0,
        fat: f.fat ?? 0,
        fiber: f.fiber ?? 0,
        sugar: f.sugar ?? 0,
        sodium: f.sodium ?? 0,
      },
    ])
  )

  const addMeal = () => {
    const usedNames = new Set(meals.map((m) => m.name))
    const nextName = DEFAULT_MEAL_NAMES.find((n) => !usedNames.has(n)) ?? `Meal ${meals.length + 1}`
    setMeals((prev) => [
      ...prev,
      { id: `meal-${Date.now()}`, name: nextName, foods: [], notes: '' },
    ])
  }

  const removeMeal = (mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId))
  }

  const updateMealName = (mealId: string, name: string) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, name } : m))
    )
  }

  const updateMealNotes = (mealId: string, notes: string) => {
    setMeals((prev) =>
      prev.map((m) => (m.id === mealId ? { ...m, notes } : m))
    )
  }

  const addFoodToMeal = (mealId: string, foodId: string) => {
    if (!foodId) return
    const food = foods.find((f) => f.id === foodId)
    if (!food) return
    setMeals((prev) =>
      prev.map((m) => {
        if (m.id !== mealId) return m
        const existing = m.foods.find((f) => f.foodId === foodId)
        if (existing) {
          return {
            ...m,
            foods: m.foods.map((f) =>
              f.foodId === foodId ? { ...f, servings: f.servings + 1 } : f
            ),
          }
        }
        return {
          ...m,
          foods: [
            ...m.foods,
            { foodId, servings: 1, name: food.name },
          ],
        }
      })
    )
  }

  const updateServings = (mealId: string, foodId: string, servings: number) => {
    const s = Math.max(0, Number(servings) || 0)
    setMeals((prev) =>
      prev.map((m) => {
        if (m.id !== mealId) return m
        return {
          ...m,
          foods: m.foods
            .map((f) => (f.foodId === foodId ? { ...f, servings: s } : f))
            .filter((f) => f.servings > 0),
        }
      })
    )
  }

  const removeFoodFromMeal = (mealId: string, foodId: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m.id === mealId
          ? { ...m, foods: m.foods.filter((f) => f.foodId !== foodId) }
          : m
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ meals, notes: planNotes.trim() || undefined })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const allFoodsWithServings: FoodWithServings[] = meals.flatMap((m) =>
    m.foods.map((f) => ({
      foodId: f.foodId,
      servings: f.servings,
      name: f.name ?? foods.find((x) => x.id === f.foodId)?.name,
    }))
  )
  const dailyTotals = calcNutrientsFromFoods(allFoodsWithServings, foodLookup)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit plan: {plan.name ?? 'Unnamed'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan-level notes */}
          <div>
            <label className="text-sm font-medium">Plan notes</label>
            <Textarea
              placeholder="General notes for this meal plan..."
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Meals */}
          {meals.map((meal) => {
            const mealFoods: FoodWithServings[] = meal.foods.map((f) => ({
              foodId: f.foodId,
              servings: f.servings,
              name: f.name ?? foods.find((x) => x.id === f.foodId)?.name,
            }))
            const mealTotals = calcNutrientsFromFoods(mealFoods, foodLookup)

            return (
              <div
                key={meal.id}
                className="rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={meal.name}
                    onChange={(e) => updateMealName(meal.id, e.target.value)}
                    placeholder="Meal name"
                    className="font-medium max-w-[180px]"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMeal(meal.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" weight="bold" />
                  </Button>
                </div>

                {/* Meal foods */}
                <div className="space-y-2 pl-2 border-l-2 border-muted">
                  {meal.foods.map((f) => {
                    const foodItem = foods.find((x) => x.id === f.foodId)
                    const asDetail: FoodDetail | null = foodItem
                      ? {
                          id: foodItem.id,
                          name: foodItem.name,
                          calories: foodItem.calories ?? 0,
                          protein: foodItem.protein ?? 0,
                          carbs: foodItem.carbs ?? 0,
                          fat: foodItem.fat ?? 0,
                          fiber: foodItem.fiber,
                          sugar: foodItem.sugar,
                          sodium: foodItem.sodium,
                          servingSize: foodItem.servingSize ?? '100g',
                          servingUnit: foodItem.servingUnit,
                        }
                      : null
                    return (
                    <div
                      key={`${meal.id}-${f.foodId}`}
                      className="flex items-center justify-between gap-2 py-1"
                    >
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="text-sm truncate">
                          {f.name ?? foodItem?.name ?? f.foodId}
                        </span>
                        {asDetail && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFood(asDetail)
                              setDetailOpen(true)
                            }}
                            className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            aria-label="View macros"
                          >
                            <Info className="h-4 w-4" weight="bold" />
                          </button>
                        )}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        value={f.servings}
                        onChange={(e) =>
                          updateServings(meal.id, f.foodId, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 h-8 text-sm"
                      />
                      <span className="text-xs text-muted-foreground w-8">serv</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFoodFromMeal(meal.id, f.foodId)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash className="h-4 w-4" weight="bold" />
                      </Button>
                    </div>
                    )
                  })}

                  <div className="flex items-center gap-2 pt-1">
                    <select
                      className="h-8 rounded-lg border border-input bg-background px-3 text-sm flex-1 max-w-[200px]"
                      value=""
                      onChange={(e) => {
                        addFoodToMeal(meal.id, e.target.value)
                        e.target.value = ''
                      }}
                    >
                      <option value="">Add food...</option>
                      {foods.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Meal notes */}
                <div>
                  <Textarea
                    placeholder="Notes for this meal..."
                    value={meal.notes ?? ''}
                    onChange={(e) => updateMealNotes(meal.id, e.target.value)}
                    className="text-sm"
                    rows={1}
                  />
                </div>

                <NutrientSummary totals={mealTotals} />
              </div>
            )
          })}

          <Button variant="outline" size="sm" onClick={addMeal}>
            <Plus className="h-4 w-4 mr-2" weight="bold" />
            Add meal
          </Button>

          {/* Daily total */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium mb-2">Daily total</p>
            <NutrientSummary totals={dailyTotals} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
        <FoodDetailDialog food={selectedFood} open={detailOpen} onOpenChange={setDetailOpen} />
      </DialogContent>
    </Dialog>
  )
}
