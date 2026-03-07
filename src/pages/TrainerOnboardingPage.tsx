import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useMyClientId } from '@/hooks/useMyClientId'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TrainerOnboardingPage() {
  const { user, refetch, needsTrainerOnboarding, isDualRole } = useAuth()
  const myClientId = useMyClientId()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    displayName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: form.name,
        displayName: form.displayName || form.name,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      })
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

  if (!needsTrainerOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-md mx-auto">
        {isDualRole && (
          <div className="flex items-center gap-2 mb-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-medium">1</span>
            <span className="h-0.5 w-8 bg-primary rounded" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">2</span>
            <span className="text-sm text-muted-foreground ml-2">Client profile → Trainer profile</span>
          </div>
        )}
        {isDualRole && (
          <p className="text-sm font-medium text-primary mb-2">Step 2 of 2 — Your trainer profile</p>
        )}
        <h1 className="text-2xl font-bold mb-2">Complete your trainer profile</h1>
        <p className="text-muted-foreground mb-8">
          Add your details to get started. You can create and assign meal plans, workouts, and supplement regimens to yourself and any other clients.
          {myClientId && (
            <span className="block mt-2 text-sm">
              You're also set up as a client—track your own meals, water, habits, and progress from the dashboard.
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="How clients should see you"
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
