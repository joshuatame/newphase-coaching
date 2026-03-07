import { useState } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from '@phosphor-icons/react'

export function AddExerciseDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    targetMuscles: '',
    equipment: '',
    instructions: '',
    videoLink: '',
  })
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addDoc(collection(db, 'exercises'), {
        name: form.name,
        category: form.category || undefined,
        targetMuscles: form.targetMuscles ? form.targetMuscles.split(',').map((s) => s.trim()) : undefined,
        equipment: form.equipment ? form.equipment.split(',').map((s) => s.trim()) : undefined,
        instructions: form.instructions || undefined,
        videoLink: form.videoLink || undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
      setForm({ name: '', category: '', targetMuscles: '', equipment: '', instructions: '', videoLink: '' })
      setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add exercise
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Chest, Legs, etc." />
          </div>
          <div>
            <Label>Target muscles (comma-separated)</Label>
            <Input value={form.targetMuscles} onChange={(e) => setForm((f) => ({ ...f, targetMuscles: e.target.value }))} placeholder="pectorals, triceps" />
          </div>
          <div>
            <Label>Equipment</Label>
            <Input value={form.equipment} onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))} placeholder="barbell, bench" />
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} rows={3} />
          </div>
          <div>
            <Label>Video link</Label>
            <Input type="url" value={form.videoLink} onChange={(e) => setForm((f) => ({ ...f, videoLink: e.target.value }))} placeholder="https://..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
