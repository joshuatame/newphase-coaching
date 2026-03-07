/**
 * Build ICS (iCalendar) content for a client's schedule: meals (with foods), training, supplements.
 * Use for "Export to calendar" / subscribe in Gmail or Outlook.
 */

const DEFAULT_MEAL_TIMES: Record<string, string> = {
  morning: '07:00',
  'mid-morning': '10:00',
  lunch: '12:30',
  afternoon: '15:00',
  dinner: '18:00',
  evening: '20:30',
}

const DEFAULT_TRAINING_TIMES: Record<string, string> = {
  morning: '07:00',
  midday: '12:00',
  afternoon: '15:00',
  evening: '18:00',
}

function escapeIcsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function formatIcsDate(date: Date, timeStr: string): string {
  const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10) || 0)
  const d = new Date(date)
  d.setHours(hh, mm, 0, 0)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const sec = '00'
  return `${y}${m}${day}T${h}${min}${sec}`
}

export interface CalendarExportClient {
  customMealSlots?: { label: string; time: string }[]
  preferredMealTimes?: string[]
  preferredTrainingTime?: string
  supplementTimes?: { morning?: string; afternoon?: string; night?: string }
  timezone?: string
}

export interface CalendarExportMeal {
  name: string
  foods: { name?: string; servings?: number }[]
}

export interface CalendarExportWorkout {
  name?: string
  exercises?: { name?: string; sets?: number; reps?: number }[]
}

export interface CalendarExportSupplement {
  name?: string
  dose?: string
  frequency?: string
  timeOfDay?: 'morning' | 'afternoon' | 'night'
}

export interface CalendarExportInput {
  client: CalendarExportClient
  mealPlan?: { meals?: CalendarExportMeal[] } | null
  workoutPlan?: CalendarExportWorkout | null
  regimen?: { supplements?: CalendarExportSupplement[] } | null
  startDate: Date
  numDays: number
}

export function buildCalendarIcs(input: CalendarExportInput): string {
  const { client, mealPlan, workoutPlan, regimen, startDate, numDays } = input
  const events: string[] = []

  // Resolve meal slots: custom first, then preset times in order
  const mealSlots: { label: string; time: string }[] = []
  if (client.customMealSlots?.length) {
    client.customMealSlots
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach((s) => mealSlots.push({ label: s.label, time: s.time }))
  }
  if (mealSlots.length === 0 && client.preferredMealTimes?.length) {
    client.preferredMealTimes
      .map((key) => ({ label: key, time: DEFAULT_MEAL_TIMES[key] || '12:00' }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach((s) => mealSlots.push(s))
  }

  const meals = mealPlan?.meals ?? []

  for (let dayOffset = 0; dayOffset < numDays; dayOffset++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + dayOffset)
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')

    // Meal events
    for (let i = 0; i < mealSlots.length; i++) {
      const slot = mealSlots[i]
      const meal = meals[i]
      const title = meal?.name ?? slot.label
      const foodLines = meal?.foods?.map((f) => {
        const serv = f.servings != null ? ` x${f.servings}` : ''
        return `${f.name ?? 'Food'}${serv}`
      }) ?? []
      const description = foodLines.length ? foodLines.join('\n') : `${slot.label}`
      const dtStart = formatIcsDate(date, slot.time)
      const dtEnd = formatIcsDate(date, slot.time)
      const uid = `meal-${dateStr}-${i}-${slot.time}@newphase`
      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${escapeIcsText(title)}`,
          `DESCRIPTION:${escapeIcsText(description)}`,
          'END:VEVENT',
        ].join('\r\n')
      )
    }

    // Training event (once per day)
    const rawTrain = client.preferredTrainingTime ?? ''
    const trainingTime =
      /^\d{1,2}:\d{2}$/.test(rawTrain) ? rawTrain : (DEFAULT_TRAINING_TIMES[rawTrain] ?? '18:00')
    const workoutName = workoutPlan?.name ?? 'Workout'
    const exerciseLines =
      workoutPlan?.exercises?.map((e) => {
        const parts = [e.name ?? 'Exercise']
        if (e.sets != null) parts.push(`${e.sets} sets`)
        if (e.reps != null) parts.push(`${e.reps} reps`)
        return parts.join(' – ')
      }) ?? []
    const workoutDesc = exerciseLines.length ? exerciseLines.join('\n') : workoutName
    const dtStartTrain = formatIcsDate(date, trainingTime)
    const dtEndTrain = formatIcsDate(date, trainingTime)
    const uidTrain = `training-${dateStr}@newphase`
    events.push(
      [
        'BEGIN:VEVENT',
        `UID:${uidTrain}`,
        `DTSTART:${dtStartTrain}`,
        `DTEND:${dtEndTrain}`,
        `SUMMARY:${escapeIcsText(workoutName)}`,
        `DESCRIPTION:${escapeIcsText(workoutDesc)}`,
        'END:VEVENT',
      ].join('\r\n')
    )

    // Supplement events (group by timeOfDay)
    const suppTimes = client.supplementTimes ?? {
      morning: '07:00',
      afternoon: '12:00',
      night: '20:00',
    }
    const bySlot: Record<string, CalendarExportSupplement[]> = { morning: [], afternoon: [], night: [] }
    for (const s of regimen?.supplements ?? []) {
      const slot = s.timeOfDay ?? 'morning'
      if (bySlot[slot]) bySlot[slot].push(s)
    }
    for (const slot of ['morning', 'afternoon', 'night'] as const) {
      const list = bySlot[slot]
      if (list.length === 0) continue
      const time = suppTimes[slot] ?? '07:00'
      const title = `Supplements (${slot})`
      const lines = list.map((s) => {
        const parts = [s.name ?? 'Supplement']
        if (s.dose) parts.push(s.dose)
        if (s.frequency) parts.push(s.frequency)
        return parts.join(' – ')
      })
      const description = lines.join('\n')
      const dtStartSupp = formatIcsDate(date, time)
      const dtEndSupp = formatIcsDate(date, time)
      const uidSupp = `supp-${dateStr}-${slot}@newphase`
      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${uidSupp}`,
          `DTSTART:${dtStartSupp}`,
          `DTEND:${dtEndSupp}`,
          `SUMMARY:${escapeIcsText(title)}`,
          `DESCRIPTION:${escapeIcsText(description)}`,
          'END:VEVENT',
        ].join('\r\n')
      )
    }
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Newphase Coaching//Schedule//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return ics
}

/** Trigger download of an ICS file */
export function downloadIcs(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
