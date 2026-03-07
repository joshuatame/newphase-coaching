import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuestionBuilder, type FormQuestion } from './QuestionBuilder'
import { X } from '@phosphor-icons/react'

const QUESTION_TYPE_MAP: Record<string, string> = {
  text: 'text',
  number: 'number',
  scale: 'scale',
  yesno: 'checkbox',
  multiselect: 'checkbox',
}

function toLegacyQuestion(q: FormQuestion) {
  return {
    id: q.id.replace(/^q_/, '').slice(0, 32) || q.id,
    question: q.question,
    type: (QUESTION_TYPE_MAP[q.type] ?? q.type) as 'text' | 'number' | 'scale' | 'checkbox',
    options: q.options && q.options.length > 0 ? q.options : undefined,
  }
}

function fromLegacyQuestion(q: { id?: string; question?: string; type?: string; options?: string[] }): FormQuestion {
  const typeMap: Record<string, FormQuestion['type']> = {
    text: 'text',
    number: 'number',
    scale: 'scale',
    checkbox: 'yesno',
  }
  return {
    id: q.id ?? `q_${Date.now()}`,
    question: q.question ?? '',
    type: (typeMap[q.type ?? ''] ?? 'text') as FormQuestion['type'],
    options: q.options,
  }
}

export interface SessionSurveyTemplate {
  id?: string
  name: string
  description: string
  questions: FormQuestion[]
}

interface SessionSurveyEditorProps {
  template?: SessionSurveyTemplate | null
  onClose: () => void
  onSaved: () => void
}

export function SessionSurveyEditor({ template, onClose, onSaved }: SessionSurveyEditorProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [questions, setQuestions] = useState<FormQuestion[]>(
    template?.questions?.map(fromLegacyQuestion) ?? []
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = template?.id ?? `survey_${Date.now()}`
      const ref = doc(db, 'sessionSurveyTemplates', id)
      await setDoc(ref, {
        name: name.trim(),
        description: description.trim(),
        questions: questions.map(toLegacyQuestion),
        updatedAt: serverTimestamp(),
        ...(template ? {} : { createdAt: serverTimestamp() }),
      })
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionSurveyTemplates'] })
      onSaved()
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!template?.id) return
      await deleteDoc(doc(db, 'sessionSurveyTemplates', template.id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionSurveyTemplates'] })
      onSaved()
      onClose()
    },
  })

  const isValid = name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-foreground shadow-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">
            {template ? 'Edit post-workout survey' : 'New post-workout survey'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Questions shown to clients after completing a workout (e.g. &quot;How did you feel after training?&quot;).
          </p>
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Post-workout feedback"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How did you feel after training?"
              className="mt-1"
            />
          </div>
          <QuestionBuilder
            questions={questions}
            onChange={setQuestions}
          />
        </div>
        <div className="p-4 border-t border-border flex justify-between">
          <div>
            {template?.id && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/50"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!isValid || saveMutation.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
