import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns'
import {
  CheckSquare,
  Calendar,
  Plus,
  Bell,
  PencilSimple,
  Trash,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type Task = {
  id: string
  title?: string
  completed?: boolean
  dueDate?: string | null
  reminderAt?: string | null
  uid?: string
  assignedTo?: string
}

export function TasksPage() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskReminder, setNewTaskReminder] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editReminder, setEditReminder] = useState('')

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', profile?.uid],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'tasks'))
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((t) => {
          const x = t as { uid?: string; assignedTo?: string }
          return (x.uid ?? x.assignedTo) === profile?.uid || !x.uid
        })
    },
    enabled: !!profile,
  })

  const typedTasks = tasks as Task[]

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle.trim(),
        uid: profile?.uid ?? null,
        assignedTo: profile?.uid ?? null,
        completed: false,
        dueDate: newTaskDueDate || null,
        reminderAt: newTaskReminder || null,
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      setNewTaskTitle('')
      setNewTaskDueDate('')
      setNewTaskReminder('')
      setShowAdd(false)
      qc.invalidateQueries({ queryKey: ['tasks', profile?.uid] })
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      dueDate,
      reminderAt,
    }: {
      id: string
      title: string
      dueDate: string | null
      reminderAt: string | null
    }) => {
      await setDoc(
        doc(db, 'tasks', id),
        { title: title.trim(), dueDate, reminderAt },
        { merge: true }
      )
    },
    onSuccess: () => {
      setEditingTask(null)
      qc.invalidateQueries({ queryKey: ['tasks', profile?.uid] })
    },
  })

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await setDoc(doc(db, 'tasks', id), { completed }, { merge: true })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', profile?.uid] }),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'tasks', id))
    },
    onSuccess: () => {
      setEditingTask(null)
      qc.invalidateQueries({ queryKey: ['tasks', profile?.uid] })
    },
  })

  const openEdit = (t: Task) => {
    setEditingTask(t)
    setEditTitle(t.title ?? '')
    setEditDueDate(t.dueDate ?? '')
    setEditReminder(t.reminderAt ?? '')
  }

  const incomplete = typedTasks.filter((t) => !t.completed)
  const completed = typedTasks.filter((t) => t.completed)

  // Calendar: build grid including leading/trailing days from adjacent months
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [monthStart])

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const t of typedTasks) {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = []
        map[t.dueDate].push(t)
      }
    }
    return map
  }, [typedTasks])

  const sortedIncomplete = useMemo(() => {
    return [...incomplete].sort((a, b) => {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    })
  }, [incomplete])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks & Planner</h1>
          <p className="text-muted-foreground mt-1">Tasks, reminders, and scheduling.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" weight="bold" />
          Add task
        </Button>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
              view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            <CheckSquare className="h-4 w-4" weight="duotone" />
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
              view === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            <Calendar className="h-4 w-4" weight="duotone" />
            Calendar
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold mb-3">New task</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createTaskMutation.mutate()}
              />
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Due date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Reminder</label>
                  <input
                    type="datetime-local"
                    value={newTaskReminder}
                    onChange={(e) => setNewTaskReminder(e.target.value)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => createTaskMutation.mutate()}
                disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
              >
                Add
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Task title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Due date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Reminder</label>
                  <input
                    type="datetime-local"
                    value={editReminder}
                    onChange={(e) => setEditReminder(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => editingTask && deleteTaskMutation.mutate(editingTask.id)}
              disabled={deleteTaskMutation.isPending}
            >
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button
              onClick={() =>
                editingTask &&
                updateTaskMutation.mutate({
                  id: editingTask.id,
                  title: editTitle,
                  dueDate: editDueDate || null,
                  reminderAt: editReminder || null,
                })
              }
              disabled={!editTitle.trim() || updateTaskMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {view === 'list' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Tasks</h2>
          {incomplete.length === 0 && completed.length === 0 ? (
            <p className="text-muted-foreground">No tasks yet. Add tasks to get started.</p>
          ) : (
            <div className="space-y-4">
              {sortedIncomplete.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">To do</h3>
                  {sortedIncomplete.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border group"
                    >
                      <button
                        onClick={() => toggleCompleteMutation.mutate({ id: t.id, completed: true })}
                        className="shrink-0"
                      >
                        <CheckSquare
                          className="h-5 w-5 text-muted-foreground hover:text-primary"
                          weight="regular"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <span>{t.title ?? 'Untitled task'}</span>
                        {(t.dueDate || t.reminderAt) && (
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            {t.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" weight="duotone" />
                                {format(new Date(t.dueDate), 'MMM d, yyyy')}
                              </span>
                            )}
                            {t.reminderAt && (
                              <span className="flex items-center gap-1">
                                <Bell className="h-3 w-3" weight="duotone" />
                                {format(new Date(t.reminderAt), 'MMM d, h:mm a')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => openEdit(t)}
                      >
                        <PencilSimple className="h-4 w-4" weight="duotone" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {completed.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Done</h3>
                  {completed.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border opacity-60 group"
                    >
                      <button
                        onClick={() =>
                          toggleCompleteMutation.mutate({ id: t.id, completed: false })
                        }
                        className="shrink-0"
                      >
                        <CheckSquare className="h-5 w-5 text-green-500" weight="fill" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className="line-through">{t.title ?? 'Untitled task'}</span>
                        {t.dueDate && (
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {format(new Date(t.dueDate), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={() => openEdit(t)}
                      >
                        <PencilSimple className="h-4 w-4" weight="duotone" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === 'calendar' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Calendar</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMonthStart(subMonths(monthStart, 1))}
              >
                <CaretLeft className="h-4 w-4" weight="bold" />
              </Button>
              <span className="font-medium min-w-[160px] text-center">
                {format(monthStart, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMonthStart(addMonths(monthStart, 1))}
              >
                <CaretRight className="h-4 w-4" weight="bold" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div
                key={d}
                className="bg-muted/50 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const dayTasks = (tasksByDate[dateStr] ?? []).filter((t) => !t.completed)
              const inMonth = isSameMonth(day, monthStart)
              return (
                <div
                  key={dateStr}
                  className={cn(
                    'min-h-[80px] p-2 bg-card flex flex-col',
                    !inMonth && 'opacity-40',
                    isToday(day) && 'ring-1 ring-primary/50'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium mb-1',
                      isToday(day) && 'text-primary'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex-1 space-y-0.5 overflow-y-auto">
                    {dayTasks.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => openEdit(t)}
                        className="w-full text-left text-xs px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 truncate"
                      >
                        {t.title ?? 'Task'}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {typedTasks.some((t) => !t.dueDate && !t.completed) && (
            <div className="mt-4 p-3 rounded-xl bg-muted/30">
              <h3 className="text-sm font-medium mb-2">Tasks without due date</h3>
              <div className="flex flex-wrap gap-2">
                {typedTasks
                  .filter((t) => !t.dueDate && !t.completed)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => openEdit(t)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
                    >
                      {t.title ?? 'Task'}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
