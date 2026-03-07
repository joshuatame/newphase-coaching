import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ForkKnife } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useMyClientId } from '@/hooks/useMyClientId'
import { format } from 'date-fns'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ALL_NUTRIENT_KEYS, formatNutrient } from '@/lib/macro-utils'

export interface FoodDetail {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  servingSize: string
  servingUnit?: string
}

export function FoodDetailDialog({
  food,
  open,
  onOpenChange,
}: {
  food: FoodDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile } = useAuth()
  const myClientId = useMyClientId()
  const qc = useQueryClient()
  const clientIdForLog = myClientId ?? profile?.uid
  const [qty, setQty] = useState(1)

  const logMutation = useMutation({
    mutationFn: async () => {
      if (!food || !clientIdForLog) return
      const getVal = (k: string) => {
        const r = food as unknown as Record<string, unknown>
        let v = r[k]
        if (v == null && typeof r.nutrients === 'object' && r.nutrients) v = (r.nutrients as Record<string, unknown>)[k]
        if (typeof v === 'number' && !Number.isNaN(v)) return v
        if (typeof v === 'string') return parseFloat(v) || 0
        return 0
      }
      const getStr = (k: string, fb: string) => {
        const r = food as unknown as Record<string, unknown>
        let v = r[k]
        if (v == null && typeof r.nutrients === 'object' && r.nutrients) v = (r.nutrients as Record<string, unknown>)[k]
        if (typeof v === 'string' && v.trim()) return v.trim()
        return fb
      }
      await addDoc(collection(db, 'logsMeals'), {
        clientId: clientIdForLog,
        foodId: food.id,
        foodName: getStr('name', 'Food'),
        servings: effectiveQty,
        date: format(new Date(), 'yyyy-MM-dd'),
        calories: getVal('calories') * effectiveQty,
        protein: getVal('protein') * effectiveQty,
        carbs: getVal('carbs') * effectiveQty,
        fat: getVal('fat') * effectiveQty,
        fiber: getVal('fiber') * effectiveQty,
        sugar: getVal('sugar') * effectiveQty,
        sodium: getVal('sodium') * effectiveQty,
        loggedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logsMeals', clientIdForLog] })
    },
  })

  const raw = (food ?? {}) as unknown as Record<string, unknown>
  const nutrientsObj = (typeof raw.nutrients === 'object' && raw.nutrients !== null ? raw.nutrients : null) as Record<string, unknown> | null

  const getVal = (key: string): number => {
    if (!food) return 0
    let v = raw[key]
    if (v == null && nutrientsObj) v = nutrientsObj[key]
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string') return parseFloat(v) || 0
    return 0
  }

  const getStr = (key: string, fallback: string): string => {
    if (!food) return fallback
    let v = raw[key]
    if (v == null && nutrientsObj) v = nutrientsObj[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number') return String(v)
    return fallback
  }

  const displayName = getStr('name', 'Food')
  const servingSize = getStr('servingSize', '100g')
  const servingUnit = getStr('servingUnit', '')

  /** Parse grams per serving from servingSize (e.g. "100g" -> 100, "50 g" -> 50) */
  const gramsPerServing = (() => {
    const match = servingSize.match(/(\d+(?:\.\d+)?)\s*g/i)
    return match ? parseFloat(match[1]) : 100
  })()

  const [entryMode, setEntryMode] = useState<'servings' | 'grams'>('servings')
  const [gramsInput, setGramsInput] = useState('')

  const qtyFromGrams = gramsInput.trim() ? Math.max(0.5, parseFloat(gramsInput) / gramsPerServing) : qty
  const effectiveQty = entryMode === 'grams' ? qtyFromGrams : qty

  const syncGramsFromQty = (s: number) => {
    setGramsInput(String(Math.round(s * gramsPerServing)))
  }

  const nutrients = ALL_NUTRIENT_KEYS.filter((key) => {
    const v = getVal(key)
    return v > 0 || ['calories', 'protein', 'carbs', 'fat'].includes(key)
  })
  const scaled = (key: string) => getVal(key) * effectiveQty

  const displayNutrients = nutrients.length > 0 ? nutrients : (['calories', 'protein', 'carbs', 'fat'] as const)

  // Infer key benefits from macros/micros
  const benefits: string[] = []
  if (food) {
    const p = getVal('protein')
    const c = getVal('carbs')
    const f = getVal('fat')
    const fiber = getVal('fiber')
    if (p >= 20) benefits.push('High protein — supports muscle building & recovery')
    else if (p >= 10) benefits.push('Good protein source')
    if (fiber >= 5) benefits.push('High fiber — supports digestion & satiety')
    else if (fiber >= 3) benefits.push('Good fiber source')
    if (c >= 20 && p < 15) benefits.push('Energy-dense — good for fueling workouts')
    if (f >= 15) benefits.push('Healthy fats — supports hormone function & nutrient absorption')
    if (c < 5 && p > 15) benefits.push('Low carb — ideal for keto or low-carb diets')
  }

  return (
    <Dialog open={open && !!food} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-w-[calc(100vw-2rem)] rounded-2xl bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ForkKnife className="h-5 w-5 text-primary" weight="duotone" />
            {displayName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full nutritional breakdown: macros, micros, and benefits for {displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <span className="text-muted-foreground">Serving size: </span>
            <span className="font-medium">{servingSize}{servingUnit ? ` ${servingUnit}` : ''}</span>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Quantity</label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={entryMode === 'servings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setEntryMode('servings'); setGramsInput('') }}
              >
                Servings
              </Button>
              <Button
                type="button"
                variant={entryMode === 'grams' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setEntryMode('grams'); syncGramsFromQty(qty) }}
              >
                Grams
              </Button>
            </div>
            {entryMode === 'servings' ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQty((q) => Math.max(0.5, q - 0.5))}
                >
                  −
                </Button>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={qty}
                  onChange={(e) => setQty(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQty((q) => q + 0.5)}
                >
                  +
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder={`e.g. ${gramsPerServing}`}
                  value={gramsInput}
                  onChange={(e) => {
                    setGramsInput(e.target.value)
                    const g = parseFloat(e.target.value)
                    if (!Number.isNaN(g) && g > 0) setQty(Math.max(0.5, g / gramsPerServing))
                  }}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">g</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <h4 className="font-semibold mb-3 text-foreground">Full nutrient breakdown (×{effectiveQty.toFixed(effectiveQty % 1 ? 1 : 0)} {effectiveQty === 1 ? 'serving' : 'servings'})</h4>
            <div className="grid grid-cols-2 gap-3">
              {displayNutrients.map((key) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">
                    {key === 'carbs' ? 'Carbs' : key === 'fat' ? 'Fat' : key.charAt(0).toUpperCase() + key.slice(1)}
                    {key === 'sodium' ? ' (mg)' : key !== 'calories' ? ' (g)' : ''}
                  </span>
                  <span className="font-medium">
                    {key === 'calories' ? Math.round(scaled(key)) : formatNutrient(scaled(key), key)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl bg-primary/10 p-3 text-center">
              <p className="text-xl font-bold text-primary">{Math.round(scaled('calories'))}</p>
              <p className="text-xs text-muted-foreground">Calories</p>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <p className="text-xl font-bold">{scaled('protein').toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <p className="text-xl font-bold">{scaled('carbs').toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="rounded-xl bg-muted p-3 text-center">
              <p className="text-xl font-bold">{scaled('fat').toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
          </div>

          {benefits.length > 0 && (
            <div className="rounded-2xl border border-border bg-primary/5 p-4">
              <h4 className="font-semibold mb-2 text-foreground">Key benefits</h4>
              <ul className="space-y-1 text-muted-foreground">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-primary">•</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(profile?.role === 'client' || myClientId) && (
            <Button
              onClick={() => logMutation.mutate()}
              disabled={logMutation.isPending}
              className="w-full"
            >
              {logMutation.isPending ? 'Adding…' : `Add to today's meals (×${effectiveQty.toFixed(effectiveQty % 1 ? 1 : 0)} ${effectiveQty === 1 ? 'serving' : 'servings'})`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
