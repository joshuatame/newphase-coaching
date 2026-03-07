import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { QuestionBuilder, type FormQuestion } from './QuestionBuilder'
import { X } from '@phosphor-icons/react'

const SCALE_OPTS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const DEFAULT_QUESTIONS: FormQuestion[] = [
  { id: 'q1', question: 'How was your energy level this week?', type: 'scale', options: SCALE_OPTS },
  { id: 'q2', question: 'How consistent were you with your nutrition?', type: 'scale', options: SCALE_OPTS },
  { id: 'q3', question: 'Did you hit your workout targets?', type: 'yesno', options: ['Yes', 'No'] },
  { id: 'q4', question: 'Any sleep issues or changes?', type: 'text' },
  { id: 'q5', question: 'Stress level (1-10)?', type: 'scale', options: SCALE_OPTS },
  { id: 'q6', question: 'Biggest win this week?', type: 'text' },
  { id: 'q7', question: 'Biggest challenge?', type: 'text' },
  { id: 'q8', question: 'How motivated do you feel for next week?', type: 'scale', options: SCALE_OPTS },
  { id: 'q9', question: 'Any injuries or niggles to report?', type: 'text' },
  { id: 'q10', question: 'Anything else your coach should know?', type: 'text' },
]

interface WeeklyRecapQuestionEditorProps {
  questions: FormQuestion[]
  onClose: () => void
  onSaved: () => void
}

export function WeeklyRecapQuestionEditor({
  questions: initialQuestions,
  onClose,
  onSaved,
}: WeeklyRecapQuestionEditorProps) {
  const queryClient = useQueryClient()
  const [questions, setQuestions] = useState<FormQuestion[]>(
    initialQuestions.length > 0 ? initialQuestions : DEFAULT_QUESTIONS
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const ref = doc(db, 'config', 'weeklyRecapTemplate')
      await setDoc(ref, {
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
        })),
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeklyRecapTemplate'] })
      onSaved()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-foreground shadow-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Weekly recap questions</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            These questions appear in the trainer-only weekly recap form for each client. Add, remove, or edit questions.
          </p>
          <QuestionBuilder questions={questions} onChange={setQuestions} />
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
