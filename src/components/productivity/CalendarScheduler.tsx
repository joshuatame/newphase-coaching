import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  format,
  addDays,
  subDays,
  addMinutes,
  startOfDay,
  startOfWeek,
  setHours,
  setMinutes,
  parseISO,
  isWithinInterval,
  isSameDay,
} from 'date-fns'
import {
  CalendarPlus,
  CaretLeft,
  CaretRight,
  Trash,
  X,
  Bell,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type CalendarEvent = {
  id: string
  clientId: string
  title: string
  startTime: string
  endTime: string
  reminderMinutes?: number
  color?: string
  createdAt?: unknown
  updatedAt?: unknown
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = (i % 2) * 30
  return { hour: h, minute: m, label: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` }
})

const REMINDER_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 min before' },
  { value: 15, label: '15 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' },
]

interface CalendarSchedulerProps {
  clientId: string
  clientDisplayName?: string
}

function generateId() {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function CalendarScheduler({ clientId }: CalendarSchedulerProps) {
  const qc = useQueryClient()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const dateStr = format(weekStart, 'yyyy-MM-dd')
  const weekEnd = addDays(weekStart, 7)

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendarEvents', clientId, dateStr],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'calendarEvents'),
          where('clientId', '==', clientId),
          where('startTime', '>=', weekStart.toISOString()),
          where('startTime', '<', weekEnd.toISOString()),
          orderBy('startTime', 'asc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CalendarEvent[]
    },
    enabled: !!clientId,
  })

  const createMutation = useMutation({
    mutationFn: async (ev: Omit<CalendarEvent, 'id'>) => {
      const id = generateId()
      await setDoc(doc(db, 'calendarEvents', id), {
        ...ev,
        id,
        clientId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarEvents', clientId] })
      setEditingEvent(null)
      setIsCreating(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (ev: CalendarEvent) => {
      await setDoc(doc(db, 'calendarEvents', ev.id), {
        ...ev,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarEvents', clientId] })
      setEditingEvent(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'calendarEvents', id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarEvents', clientId] })
      setEditingEvent(null)
    },
  })

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.startTime), day))

  const handleSlotClick = (day: Date, hour: number, minute: number) => {
    const slotStart = setMinutes(setHours(startOfDay(day), hour), minute)
    const slotEnd = addMinutes(slotStart, 30)
    setIsCreating(true)
    setEditingEvent({
      id: '',
      clientId,
      title: '',
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      reminderMinutes: 15,
    })
  }

  const handleAddEvent = () => {
    const now = new Date()
    const nextSlot = Math.ceil(now.getMinutes() / 30) * 30
    const start = setMinutes(setHours(startOfDay(now), now.getHours()), nextSlot % 60)
    const end = addMinutes(start, 30)
    setEditingEvent({
      id: '',
      clientId,
      title: '',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      reminderMinutes: 15,
    })
    setIsCreating(true)
  }

  if (!clientId) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((d) => subDays(d, 7))}
          >
            <CaretLeft className="h-4 w-4" weight="bold" />
          </Button>
          <span className="font-medium min-w-[220px] text-center text-sm sm:text-base">
            {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart((d) => addDays(d, 7))}
          >
            <CaretRight className="h-4 w-4" weight="bold" />
          </Button>
        </div>
        <Button onClick={handleAddEvent} className="shrink-0">
          <CalendarPlus className="h-4 w-4 mr-2" weight="bold" />
          Add event
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <div className="min-w-[600px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="w-14 py-2 px-1 text-muted-foreground text-xs font-medium align-bottom border-b border-r border-border">
                  Time
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.toISOString()}
                    className="min-w-[100px] py-2 px-1 text-center text-xs font-medium border-b border-r border-border last:border-r-0"
                  >
                    <div>{format(day, 'EEE')}</div>
                    <div className="text-muted-foreground">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(({ hour, minute, label }) => (
                <tr key={label} className="border-b border-border/50">
                  <td className="w-14 py-0.5 px-1 text-muted-foreground text-xs align-top border-r border-border">
                    {label}
                  </td>
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForDay(day)
                    const slotStart = setMinutes(setHours(startOfDay(day), hour), minute)
                    const slotEnd = addMinutes(slotStart, 30)
                    const event = dayEvents.find((e) => {
                      const start = parseISO(e.startTime)
                      const end = parseISO(e.endTime)
                      return (
                        isWithinInterval(slotStart, { start, end }) ||
                        isWithinInterval(start, { start: slotStart, end: slotEnd })
                      )
                    })
                    const isFirstSlot =
                      event &&
                      format(parseISO(event.startTime), 'HH:mm') === label

                    return (
                      <td
                        key={day.toISOString()}
                        className="p-0.5 align-top border-r border-border last:border-r-0"
                      >
                        {isFirstSlot && event ? (
                          <div
                            className="rounded px-2 py-1.5 bg-primary/15 border border-primary/30 cursor-pointer hover:bg-primary/20 text-xs truncate"
                            onClick={() => setEditingEvent(event)}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ) : !event ? (
                          <button
                            type="button"
                            className="w-full h-7 rounded hover:bg-muted/50 text-muted-foreground/40 hover:text-muted-foreground transition-colors min-h-[28px]"
                            onClick={() => handleSlotClick(day, hour, minute)}
                          >
                            +
                          </button>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(editingEvent || isCreating) && (
        <EventForm
          event={editingEvent!}
          onSave={(ev) => {
            if (ev.id) updateMutation.mutate(ev)
            else createMutation.mutate(ev)
          }}
          onDelete={editingEvent?.id ? () => deleteMutation.mutate(editingEvent.id) : undefined}
          onClose={() => {
            setEditingEvent(null)
            setIsCreating(false)
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-4">Loading schedule…</p>
      )}
    </div>
  )
}

interface EventFormProps {
  event: CalendarEvent
  onSave: (ev: CalendarEvent) => void
  onDelete?: () => void
  onClose: () => void
  isSaving: boolean
}

function EventForm({ event, onSave, onDelete, onClose, isSaving }: EventFormProps) {
  const [title, setTitle] = useState(event.title)
  const [startTime, setStartTime] = useState(
    event.startTime ? format(parseISO(event.startTime), "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [endTime, setEndTime] = useState(
    event.endTime ? format(parseISO(event.endTime), "yyyy-MM-dd'T'HH:mm") : ''
  )
  const [reminderMinutes, setReminderMinutes] = useState(event.reminderMinutes ?? 15)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      ...event,
      title: title.trim(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      reminderMinutes: reminderMinutes || 0,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">{event.id ? 'Edit event' : 'New event'}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting, workout, etc."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Start</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">End</label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4" weight="duotone" />
              Reminder
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSaving || !title.trim()}>
              Save
            </Button>
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete()}
                disabled={isSaving}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
