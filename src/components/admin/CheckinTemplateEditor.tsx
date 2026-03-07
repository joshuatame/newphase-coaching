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
  photo: 'text',
  video: 'text',
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

export interface CheckinTemplate {
  id?: string
  name: string
  description: string
  frequency: 'daily' | 'weekly'
  isDefault?: boolean
  questions: FormQuestion[]
}

interface CheckinTemplateEditorProps {
  template?: CheckinTemplate | null
  onClose: () => void
  onSaved: () => void
}

export function CheckinTemplateEditor({ template, onClose, onSaved }: CheckinTemplateEditorProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(template?.frequency ?? 'daily')
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false)
  const [questions, setQuestions] = useState<FormQuestion[]>(
    template?.questions?.map(fromLegacyQuestion) ?? []
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = template?.id ?? `tpl_${Date.now()}`
      const ref = doc(db, 'checkinTemplates', id)
      await setDoc(ref, {
        name: name.trim(),
        description: description.trim(),
        frequency,
        isDefault: isDefault || undefined,
        questions: questions.map(toLegacyQuestion),
        updatedAt: serverTimestamp(),
        ...(template ? {} : { createdAt: serverTimestamp() }),
      })
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkinTemplates'] })
      onSaved()
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!template?.id) return
      await deleteDoc(doc(db, 'checkinTemplates', template.id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkinTemplates'] })
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
            {template ? 'Edit check-in template' : 'New check-in template'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daily Check-in"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quick daily wellness tracking"
              className="mt-1"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <label className="flex items-center gap-2 mt-8">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Default template</span>
            </label>
          </div>
          <QuestionBuilder questions={questions} onChange={setQuestions} />
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
