import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { startOfWeek, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ClipboardText } from '@phosphor-icons/react'

interface Question {
  id: string
  question: string
  type: string
  options?: string[]
}

interface WeeklyRecapFormProps {
  clientId: string
}

const FALLBACK_QUESTIONS: Question[] = [
  { id: 'q1', question: 'How was your energy level this week?', type: 'scale', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
  { id: 'q2', question: 'How consistent were you with your nutrition?', type: 'scale', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
  { id: 'q3', question: 'Did you hit your workout targets?', type: 'text' },
  { id: 'q4', question: 'Biggest win this week?', type: 'text' },
  { id: 'q5', question: 'Biggest challenge?', type: 'text' },
  { id: 'q6', question: 'How motivated for next week?', type: 'text' },
  { id: 'q7', question: 'Any injuries or niggles?', type: 'text' },
  { id: 'q8', question: 'Anything else your coach should know?', type: 'text' },
]

export function WeeklyRecapForm({ clientId }: WeeklyRecapFormProps) {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const trainerId = profile?.uid ?? ''

  const [weekStart, setWeekStart] = useState(() =>
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  )

  const { data: template } = useQuery({
    queryKey: ['weeklyRecapTemplate'],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'config', 'weeklyRecapTemplate'))
      return snap.exists() ? snap.data() : null
    },
  })

  const questions: Question[] =
    (template?.questions ?? FALLBACK_QUESTIONS) as Question[]

  const { data: existingRecap } = useQuery({
    queryKey: ['weeklyRecap', clientId, weekStart],
    queryFn: async () => {
      const docId = `${clientId}_${weekStart}_${trainerId}`
      const snap = await getDoc(doc(db, 'weeklyRecaps', docId))
      return snap.exists() ? snap.data() : null
    },
    enabled: !!clientId && !!weekStart,
  })

  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})
  const [planChanges, setPlanChanges] = useState<{ meals: boolean; training: boolean; cycles: boolean }>({
    meals: false,
    training: false,
    cycles: false,
  })
  const [planChangesNotes, setPlanChangesNotes] = useState('')

  useEffect(() => {
    setLocalAnswers(existingRecap?.answers ?? {})
    const pc = (existingRecap as { planChanges?: { meals?: boolean; training?: boolean; cycles?: boolean } })?.planChanges ?? {}
    setPlanChanges({
      meals: pc.meals ?? false,
      training: pc.training ?? false,
      cycles: pc.cycles ?? false,
    })
    setPlanChangesNotes((existingRecap as { planChangesNotes?: string })?.planChangesNotes ?? '')
  }, [existingRecap, weekStart])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const docId = `${clientId}_${weekStart}_${trainerId}`
      await setDoc(doc(db, 'weeklyRecaps', docId), {
        clientId,
        trainerId,
        weekStart,
        answers: localAnswers,
        planChanges,
        planChangesNotes: planChangesNotes.trim() || undefined,
        submittedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weeklyRecap', clientId, weekStart] })
    },
  })

  const updateAnswer = (id: string, value: string) => {
    setLocalAnswers((a) => ({ ...a, [id]: value }))
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-2">
        <ClipboardText className="h-5 w-5 text-primary" weight="duotone" />
        Weekly recap
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Fill out the weekly recap for this client. One submission per week.
      </p>

      <div className="mb-4">
        <label className="text-sm font-medium">Week starting (Monday)</label>
        <Input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className="mt-1 w-44"
        />
      </div>

      {existingRecap?.submittedAt && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-4">
          ✓ Recap saved for this week
        </p>
      )}

      <div className="mb-4 p-4 rounded-xl border border-border bg-muted/30">
        <label className="text-sm font-medium block mb-2">Any changes made to plans?</label>
        <div className="flex flex-wrap gap-4 mb-2">
          {(['meals', 'training', 'cycles'] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={planChanges[key]}
                onChange={(e) => setPlanChanges((p) => ({ ...p, [key]: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm capitalize">{key}</span>
            </label>
          ))}
        </div>
        <Textarea
          placeholder="Describe changes made (optional)..."
          value={planChangesNotes}
          onChange={(e) => setPlanChangesNotes(e.target.value)}
          className="min-h-[80px] mt-2"
        />
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id}>
            <label className="text-sm font-medium block mb-1">{q.question}</label>
            {q.type === 'text' && (
              <Input
                value={localAnswers[q.id] ?? ''}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                placeholder="Your notes..."
                className="mt-1"
              />
            )}
            {q.type === 'scale' && q.options && (
              <div className="flex flex-wrap gap-2 mt-1">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateAnswer(q.id, opt)}
                    className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${
                      localAnswers[q.id] === opt
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {(q.type === 'yesno' || q.type === 'checkbox') && q.options && (
              <div className="flex gap-2 mt-1">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateAnswer(q.id, opt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      localAnswers[q.id] === opt
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        className="mt-4"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? 'Saving...' : 'Save weekly recap'}
      </Button>
    </div>
  )
}
