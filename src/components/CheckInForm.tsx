import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Question {
  id: string
  question: string
  type: string
  options?: string[]
}

interface CheckInFormProps {
  template: { id: string; name: string; questions?: Question[]; frequency?: string }
  clientId: string
  defaultDate: string
  onSuccess: () => void
  onCancel: () => void
}

export function CheckInForm({ template, clientId, defaultDate, onSuccess, onCancel }: CheckInFormProps) {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(defaultDate)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  const submitMutation = useMutation({
    mutationFn: async () => {
      const docId = `${clientId}_${date}`
      const ref = doc(db, 'checkins', docId)
      await setDoc(ref, {
        clientId,
        templateId: template.id,
        date,
        answers,
        status: 'pending_review',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] })
      queryClient.invalidateQueries({ queryKey: ['checkins-trainer'] })
      queryClient.invalidateQueries({ queryKey: ['checkins-grid'] })
      onSuccess()
    },
  })

  const updateAnswer = (id: string, value: string | string[]) => {
    setAnswers((a) => ({ ...a, [id]: value }))
  }

  const questions = template.questions ?? []

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Date</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1"
        />
      </div>

      {questions.map((q) => (
        <div key={q.id}>
          <label className="text-sm font-medium">{q.question}</label>
          <div className="mt-1">
            {q.type === 'text' && (
              <Input
                value={(answers[q.id] as string) ?? ''}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                placeholder="Your answer"
              />
            )}
            {q.type === 'number' && (
              <Input
                type="number"
                value={(answers[q.id] as string) ?? ''}
                onChange={(e) => updateAnswer(q.id, e.target.value)}
                placeholder="Enter number"
              />
            )}
            {(q.type === 'scale' || q.type === 'yesno' || q.type === 'multiselect' || q.type === 'checkbox') && q.options && q.options.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {q.options.map((opt) => {
                  const selected = q.type === 'multiselect'
                    ? ((answers[q.id] as string[]) ?? []).includes(opt)
                    : (answers[q.id] as string) === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        updateAnswer(
                          q.id,
                          q.type === 'multiselect'
                            ? (selected ? ((answers[q.id] as string[]) ?? []).filter((x) => x !== opt) : [...((answers[q.id] as string[]) ?? []), opt])
                            : opt
                        )
                      }
                      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
        >
          Submit check-in
        </Button>
      </div>
    </div>
  )
}
