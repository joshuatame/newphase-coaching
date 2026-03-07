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
import { Plus } from '@phosphor-icons/react'

export function AddFoodDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    servingSize: '',
  })
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addDoc(collection(db, 'foodItems'), {
        name: form.name,
        calories: parseFloat(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        fiber: form.fiber ? parseFloat(form.fiber) : undefined,
        sugar: form.sugar ? parseFloat(form.sugar) : undefined,
        sodium: form.sodium ? parseFloat(form.sodium) : undefined,
        servingSize: form.servingSize || '100g',
      })
      queryClient.invalidateQueries({ queryKey: ['foodItems'] })
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '', sodium: '', servingSize: '' })
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
          Add food
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add food item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Calories</Label>
              <Input type="number" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} />
            </div>
            <div>
              <Label>Protein (g)</Label>
              <Input type="number" value={form.protein} onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))} />
            </div>
            <div>
              <Label>Carbs (g)</Label>
              <Input type="number" value={form.carbs} onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))} />
            </div>
            <div>
              <Label>Fat (g)</Label>
              <Input type="number" value={form.fat} onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Serving size</Label>
            <Input value={form.servingSize} onChange={(e) => setForm((f) => ({ ...f, servingSize: e.target.value }))} placeholder="100g" />
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
