import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export const QUESTION_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'scale', label: 'Scale (1-10 etc)' },
  { value: 'yesno', label: 'Yes/No' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'photo', label: 'Photo upload' },
  { value: 'video', label: 'Video upload' },
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]['value']

export interface FormQuestion {
  id: string
  question: string
  type: QuestionType
  options?: string[]
}

interface QuestionBuilderProps {
  questions: FormQuestion[]
  onChange: (questions: FormQuestion[]) => void
  disabled?: boolean
}

function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function QuestionBuilder({ questions, onChange, disabled }: QuestionBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addQuestion = () => {
    onChange([
      ...questions,
      { id: generateId(), question: 'New question', type: 'text' },
    ])
  }

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    )
  }

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id))
    setEditingId(null)
  }

  const needsOptions = (type: QuestionType) =>
    ['scale', 'yesno', 'multiselect'].includes(type)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Questions</h4>
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" /> Add question
          </Button>
        )}
      </div>
      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No questions. Add one to get started.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={cn(
                'rounded-xl border border-border bg-card p-3',
                editingId === q.id && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground mt-2 w-6">{idx + 1}.</span>
                <div className="flex-1 space-y-2">
                  <Input
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                    placeholder="Question text"
                    className="font-medium"
                    disabled={disabled}
                  />
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          type: e.target.value as QuestionType,
                          options: needsOptions(e.target.value as QuestionType)
                            ? q.options ?? ['Yes', 'No']
                            : undefined,
                        })
                      }
                      className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                      disabled={disabled}
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {needsOptions(q.type) && (
                      <div className="flex-1">
                        <Input
                          value={(q.options ?? []).join(', ')}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              options: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Options (comma-separated)"
                          className="text-sm"
                          disabled={disabled}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => removeQuestion(q.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
