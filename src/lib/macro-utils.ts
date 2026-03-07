/** Macro and micro nutrient keys for food items. */
export const MACRO_KEYS = ['calories', 'protein', 'carbs', 'fat'] as const
export const MICRO_KEYS = ['fiber', 'sugar', 'sodium'] as const
export const ALL_NUTRIENT_KEYS = [...MACRO_KEYS, ...MICRO_KEYS] as const

export type NutrientTotals = Record<string, number>

export interface FoodWithServings {
  foodId: string
  servings: number
  name?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
  sodium?: number
}

export function calcNutrientsFromFoods(
  items: FoodWithServings[],
  foodLookup?: Record<string, { calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; sugar?: number; sodium?: number }>
): NutrientTotals {
  const totals: NutrientTotals = {}
  for (const key of ALL_NUTRIENT_KEYS) {
    totals[key] = 0
  }
  for (const item of items) {
    const s = Math.max(0, item.servings || 1)
    const food = foodLookup?.[item.foodId] ?? item
    for (const key of ALL_NUTRIENT_KEYS) {
      const v = (food as Record<string, number>)[key]
      if (typeof v === 'number') {
        totals[key] = (totals[key] ?? 0) + v * s
      }
    }
  }
  return totals
}

export function formatNutrient(value: number, key: string): string {
  if (key === 'sodium') return `${Math.round(value)} mg`
  return `${Math.round(value * 10) / 10} g`
}
