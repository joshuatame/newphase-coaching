import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Question {
  id: string
  question: string
  type: string
  options?: string[]
}

interface PostSessionSurveyDialogProps {
  template: { id: string; name: string; questions?: Question[] }
  sessionId: string
  onComplete: () => void
}

export function PostSessionSurveyDialog({ template, sessionId, onComplete }: PostSessionSurveyDialogProps) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  const submitMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'workoutSessionSurveys'), {
        sessionId,
        templateId: template.id,
        answers,
        createdAt: serverTimestamp(),
        createdBy: profile?.uid ?? null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSessionSurveys'] })
      onComplete()
    },
  })

  const updateAnswer = (id: string, value: string | string[]) => {
    setAnswers((a) => ({ ...a, [id]: value }))
  }

  const questions = template.questions ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onComplete}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">How did you feel after training?</h3>
          <p className="text-sm text-muted-foreground mt-1">{template.name}</p>
        </div>
        <div className="p-4 space-y-4">
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
                            q.type === 'multiselect'
                              ? updateAnswer(q.id, selected ? ((answers[q.id] as string[]) ?? []).filter((x) => x !== opt) : [...((answers[q.id] as string[]) ?? []), opt])
                              : updateAnswer(q.id, opt)
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
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onComplete}
          >
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
          >
            Submit feedback
          </Button>
        </div>
      </div>
    </div>
  )
}
