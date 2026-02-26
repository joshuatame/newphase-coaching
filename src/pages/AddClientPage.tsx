import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AddClientPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [goals, setGoals] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const ref = await addDoc(collection(db, 'clients'), {
        email,
        goals,
        uid: '', // Will link when client signs up
        units: 'metric',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      navigate(`/clients/${ref.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Add Client</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="goals">Goals</Label>
          <Input
            id="goals"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="e.g. Build muscle, lose fat"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Client'}
        </Button>
      </form>
    </div>
  )
}
