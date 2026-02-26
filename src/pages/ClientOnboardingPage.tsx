import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Camera } from 'lucide-react'

const GOALS = [
  { value: 'muscle', label: 'Build Muscle' },
  { value: 'fat-loss', label: 'Fat Loss' },
  { value: 'recomp', label: 'Body Recomposition' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general', label: 'General Fitness' },
]

const MEAL_TIMES = [
  { value: 'morning', label: 'Early morning (5–8am)' },
  { value: 'mid-morning', label: 'Mid-morning (9–11am)' },
  { value: 'lunch', label: 'Lunch (12–2pm)' },
  { value: 'afternoon', label: 'Afternoon (2–5pm)' },
  { value: 'dinner', label: 'Dinner (5–8pm)' },
  { value: 'evening', label: 'Evening (8pm+)' },
]

export function ClientOnboardingPage() {
  const { user, refetch } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    displayName: '',
    height: '',
    weight: '',
    weightUnit: 'kg' as 'kg' | 'lb',
    imageFile: null as File | null,
    goals: [] as string[],
    foodsToAvoid: '',
    preferredMealTimes: [] as string[],
    movementRestrictions: '',
    injuries: '',
    dietaryConstraints: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    units: 'metric' as 'metric' | 'imperial',
  })

  const handleGoalToggle = (value: string) => {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(value) ? f.goals.filter((g) => g !== value) : [...f.goals, value],
    }))
  }

  const handleMealTimeToggle = (value: string) => {
    setForm((f) => ({
      ...f,
      preferredMealTimes: f.preferredMealTimes.includes(value)
        ? f.preferredMealTimes.filter((t) => t !== value)
        : [...f.preferredMealTimes, value],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)
    try {
      let imageUrl = ''
      if (form.imageFile) {
        const storageRef = ref(storage, `clients/${user.uid}/profile.jpg`)
        await uploadBytes(storageRef, form.imageFile)
        imageUrl = await getDownloadURL(storageRef)
      }

      const clientData = {
        uid: user.uid,
        name: form.name,
        displayName: form.displayName || form.name,
        height: parseFloat(form.height) || null,
        weight: parseFloat(form.weight) || null,
        weightUnit: form.weightUnit,
        imageUrl: imageUrl || null,
        goals: form.goals,
        foodsToAvoid: form.foodsToAvoid || null,
        preferredMealTimes: form.preferredMealTimes,
        movementRestrictions: form.movementRestrictions || null,
        injuries: form.injuries || null,
        dietaryConstraints: form.dietaryConstraints || null,
        timezone: form.timezone,
        units: form.units,
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(doc(db, 'clients', user.uid), clientData)
      await refetch?.()
      navigate('/')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Welcome! Complete your profile</h1>
        <p className="text-muted-foreground mb-8">
          This helps your trainer personalize your plans.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Basic info</h2>
            <div className="flex items-start gap-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden"
              >
                {form.imageFile ? (
                  <img
                    src={URL.createObjectURL(form.imageFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))}
              />
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="How you'd like to be called"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Body metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={form.height}
                  onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                  placeholder={form.units === 'metric' ? 'cm' : 'inches'}
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  placeholder={form.weightUnit}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.units === 'metric'}
                  onChange={() => setForm((f) => ({ ...f, units: 'metric', weightUnit: 'kg' }))}
                />
                Metric (kg, cm)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.units === 'imperial'}
                  onChange={() => setForm((f) => ({ ...f, units: 'imperial', weightUnit: 'lb' }))}
                />
                Imperial (lb, in)
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Goals</h2>
            <p className="text-sm text-muted-foreground">What do you want to achieve?</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => handleGoalToggle(g.value)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    form.goals.includes(g.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="foodsToAvoid">Foods to avoid</Label>
            <Textarea
              id="foodsToAvoid"
              value={form.foodsToAvoid}
              onChange={(e) => setForm((f) => ({ ...f, foodsToAvoid: e.target.value }))}
              placeholder="Allergies, dislikes, foods you avoid..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Preferred meal times</h2>
            <div className="flex flex-wrap gap-2">
              {MEAL_TIMES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleMealTimeToggle(m.value)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    form.preferredMealTimes.includes(m.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label htmlFor="injuries">Injuries & movement restrictions</Label>
            <Textarea
              id="injuries"
              value={form.injuries}
              onChange={(e) => setForm((f) => ({ ...f, injuries: e.target.value }))}
              placeholder="Past injuries, joint issues, exercises to avoid..."
              rows={2}
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="movementRestrictions">Additional movement notes</Label>
            <Textarea
              id="movementRestrictions"
              value={form.movementRestrictions}
              onChange={(e) => setForm((f) => ({ ...f, movementRestrictions: e.target.value }))}
              placeholder="Any other restrictions or preferences..."
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <Label htmlFor="dietaryConstraints">Dietary constraints</Label>
            <Textarea
              id="dietaryConstraints"
              value={form.dietaryConstraints}
              onChange={(e) => setForm((f) => ({ ...f, dietaryConstraints: e.target.value }))}
              placeholder="Vegetarian, vegan, keto, allergies, etc."
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Complete setup'}
          </Button>
        </form>
      </div>
    </div>
  )
}
