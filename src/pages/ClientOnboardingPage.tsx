import { useState, useRef } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Camera, Plus, X } from '@phosphor-icons/react'

const GOALS = [
  { value: 'muscle', label: 'Build Muscle' },
  { value: 'fat-loss', label: 'Fat Loss' },
  { value: 'recomp', label: 'Body Recomposition' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'general', label: 'General Fitness' },
]

const INITIAL_HABITS = [
  'Plan my day',
  'Stretch for 10 mins',
  'Drink 2.5L of water',
  'Study for 30 mins',
  'Strength training',
  'Cardio training',
  'Practice mindfulness',
  'Sleep by 11pm',
]

const MEAL_TIMES = [
  { value: 'morning', label: 'Early morning (5–8am)' },
  { value: 'mid-morning', label: 'Mid-morning (9–11am)' },
  { value: 'lunch', label: 'Lunch (12–2pm)' },
  { value: 'afternoon', label: 'Afternoon (2–5pm)' },
  { value: 'dinner', label: 'Dinner (5–8pm)' },
  { value: 'evening', label: 'Evening (8pm+)' },
]

const TRAINING_TIMES = [
  { value: 'morning', label: 'Morning (6–9am)' },
  { value: 'midday', label: 'Midday (11am–1pm)' },
  { value: 'afternoon', label: 'Afternoon (2–5pm)' },
  { value: 'evening', label: 'Evening (5–8pm)' },
]

export function ClientOnboardingPage() {
  const { user, profile, refetch, needsClientOnboarding, isDualRole } = useAuth()
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
    customGoals: [] as string[],
    foodsToAvoid: '',
    preferredMealTimes: [] as string[],
    customMealSlots: [] as { label: string; time: string }[],
    preferredTrainingTime: '' as string,
    preferredTrainingTimeCustom: '' as string,
    supplementTimeMorning: '07:00',
    supplementTimeAfternoon: '12:00',
    supplementTimeNight: '20:00',
    movementRestrictions: '',
    injuries: '',
    dietaryConstraints: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    units: 'metric' as 'metric' | 'imperial',
    initialHabits: [] as string[],
    customHabits: [] as string[],
  })

  const handleGoalToggle = (value: string) => {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(value) ? f.goals.filter((g) => g !== value) : [...f.goals, value],
    }))
  }

  const handleHabitToggle = (value: string) => {
    setForm((f) => ({
      ...f,
      initialHabits: f.initialHabits.includes(value)
        ? f.initialHabits.filter((h) => h !== value)
        : [...f.initialHabits, value],
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

  const addCustomHabit = () => {
    const name = (document.getElementById('customHabit') as HTMLInputElement)?.value?.trim()
    if (!name || form.customHabits.includes(name)) return
    setForm((f) => ({ ...f, customHabits: [...f.customHabits, name] }))
    ;(document.getElementById('customHabit') as HTMLInputElement).value = ''
  }

  const removeCustomHabit = (name: string) => {
    setForm((f) => ({ ...f, customHabits: f.customHabits.filter((h) => h !== name) }))
  }

  const addCustomGoal = () => {
    const name = (document.getElementById('customGoal') as HTMLInputElement)?.value?.trim()
    if (!name || form.customGoals.includes(name)) return
    setForm((f) => ({ ...f, customGoals: [...f.customGoals, name] }))
    ;(document.getElementById('customGoal') as HTMLInputElement).value = ''
  }

  const removeCustomGoal = (name: string) => {
    setForm((f) => ({ ...f, customGoals: f.customGoals.filter((g) => g !== name) }))
  }

  const addCustomMealSlot = () => {
    const label = (document.getElementById('customMealLabel') as HTMLInputElement)?.value?.trim()
    const time = (document.getElementById('customMealTime') as HTMLInputElement)?.value?.trim()
    if (!label || !time) return
    setForm((f) => ({
      ...f,
      customMealSlots: [...f.customMealSlots, { label, time: time.slice(0, 5) }],
    }))
    ;(document.getElementById('customMealLabel') as HTMLInputElement).value = ''
    ;(document.getElementById('customMealTime') as HTMLInputElement).value = ''
  }

  const removeCustomMealSlot = (index: number) => {
    setForm((f) => ({
      ...f,
      customMealSlots: f.customMealSlots.filter((_, i) => i !== index),
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
        goals: [...form.goals, ...form.customGoals],
        foodsToAvoid: form.foodsToAvoid || null,
        preferredMealTimes: form.preferredMealTimes,
        customMealSlots: form.customMealSlots,
        preferredTrainingTime: form.preferredTrainingTime || form.preferredTrainingTimeCustom || null,
        supplementTimes: {
          morning: form.supplementTimeMorning || null,
          afternoon: form.supplementTimeAfternoon || null,
          night: form.supplementTimeNight || null,
        },
        movementRestrictions: form.movementRestrictions || null,
        injuries: form.injuries || null,
        dietaryConstraints: form.dietaryConstraints || null,
        timezone: form.timezone,
        units: form.units,
        initialHabits: [...form.initialHabits, ...form.customHabits],
        onboardingComplete: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(doc(db, 'clients', user.uid), clientData)
      await refetch?.()
      if (profile?.role === 'trainer' || profile?.role === 'admin') {
        navigate('/onboarding/trainer')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  if ((profile?.role === 'trainer' || profile?.role === 'admin') && !needsClientOnboarding) {
    return <Navigate to="/onboarding" replace />
  }
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {isDualRole && (
          <div className="flex items-center gap-2 mb-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
            <span className="h-0.5 w-8 bg-muted-foreground/30 rounded" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-muted-foreground text-sm font-medium">2</span>
            <span className="text-sm text-muted-foreground ml-2">Client profile → Trainer profile</span>
          </div>
        )}
        {isDualRole && (
          <p className="text-sm font-medium text-primary mb-2">Step 1 of 2 — Your client profile</p>
        )}
        <h1 className="text-2xl font-bold mb-2">Welcome! Complete your profile</h1>
        <p className="text-muted-foreground mb-8">
          {profile?.role === 'trainer' || profile?.role === 'admin'
            ? "You're coaching yourself. Set up your client profile so you can track meals, workouts, habits, and progress in one place. Then you'll complete your trainer profile."
            : 'This helps your trainer personalize your plans.'}
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
            <h2 className="font-semibold text-lg">Habits to track</h2>
            <p className="text-sm text-muted-foreground">
              Select habits you want to focus on, or add your own.
            </p>
            <div className="flex flex-wrap gap-2">
              {INITIAL_HABITS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHabitToggle(h)}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    form.initialHabits.includes(h)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                id="customHabit"
                placeholder="Add custom habit"
                className="max-w-[200px]"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomHabit())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomHabit}>
                <Plus className="h-4 w-4 mr-1" weight="bold" />
                Add
              </Button>
            </div>
            {form.customHabits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.customHabits.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-primary bg-primary/10 text-sm"
                  >
                    {h}
                    <button
                      type="button"
                      onClick={() => removeCustomHabit(h)}
                      className="p-0.5 rounded hover:bg-primary/20"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Goals</h2>
            <p className="text-sm text-muted-foreground">What do you want to achieve? Select and/or add your own.</p>
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
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                id="customGoal"
                placeholder="Add your own goal"
                className="max-w-[200px]"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGoal())}
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomGoal}>
                <Plus className="h-4 w-4 mr-1" weight="bold" />
                Add
              </Button>
            </div>
            {form.customGoals.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.customGoals.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-primary bg-primary/10 text-sm"
                  >
                    {g}
                    <button
                      type="button"
                      onClick={() => removeCustomGoal(g)}
                      className="p-0.5 rounded hover:bg-primary/20"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
            <p className="text-sm text-muted-foreground">When you usually eat. Select presets and/or add custom times (used for calendar reminders).</p>
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
            <div className="flex flex-wrap gap-2 items-center">
              <Input id="customMealLabel" placeholder="e.g. Breakfast" className="max-w-[140px]" />
              <Input id="customMealTime" type="time" className="max-w-[120px]" />
              <Button type="button" variant="outline" size="sm" onClick={addCustomMealSlot}>
                <Plus className="h-4 w-4 mr-1" weight="bold" />
                Add time
              </Button>
            </div>
            {form.customMealSlots.length > 0 && (
              <ul className="space-y-1">
                {form.customMealSlots.map((slot, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{slot.label}</span>
                    <span className="text-muted-foreground">{slot.time}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomMealSlot(i)}
                      className="p-0.5 rounded hover:bg-destructive/20 text-destructive"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Preferred training time</h2>
            <p className="text-sm text-muted-foreground">When you usually work out (for calendar sync).</p>
            <div className="flex flex-wrap gap-2">
              {TRAINING_TIMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, preferredTrainingTime: t.value, preferredTrainingTimeCustom: '' }))}
                  className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                    form.preferredTrainingTime === t.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="trainingTimeCustom">Or specific time</Label>
              <Input
                id="trainingTimeCustom"
                type="time"
                value={form.preferredTrainingTimeCustom}
                onChange={(e) => setForm((f) => ({ ...f, preferredTrainingTimeCustom: e.target.value, preferredTrainingTime: '' }))}
                className="max-w-[120px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Supplement times</h2>
            <p className="text-sm text-muted-foreground">When you take morning / afternoon / evening supplements (for calendar reminders).</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="suppMorning">Morning</Label>
                <Input
                  id="suppMorning"
                  type="time"
                  value={form.supplementTimeMorning}
                  onChange={(e) => setForm((f) => ({ ...f, supplementTimeMorning: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="suppAfternoon">Afternoon</Label>
                <Input
                  id="suppAfternoon"
                  type="time"
                  value={form.supplementTimeAfternoon}
                  onChange={(e) => setForm((f) => ({ ...f, supplementTimeAfternoon: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="suppNight">Night</Label>
                <Input
                  id="suppNight"
                  type="time"
                  value={form.supplementTimeNight}
                  onChange={(e) => setForm((f) => ({ ...f, supplementTimeNight: e.target.value }))}
                  className="mt-1"
                />
              </div>
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
