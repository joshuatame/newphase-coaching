import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { NotePencil, Trash } from '@phosphor-icons/react'

interface ClientNotesSectionProps {
  clientId: string
}

type NoteEntry = {
  id: string
  content: string
  createdAt: unknown
  trainerId: string
  clientId: string
}

export function ClientNotesSection({ clientId }: ClientNotesSectionProps) {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const trainerId = profile?.uid ?? ''
  const [newNote, setNewNote] = useState('')

  const { data: notes = [] } = useQuery({
    queryKey: ['clientNotes', clientId, trainerId],
    queryFn: async () => {
      const q = query(
        collection(db, 'clientNotes'),
        where('clientId', '==', clientId),
        where('trainerId', '==', trainerId),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NoteEntry[]
    },
    enabled: !!clientId && !!trainerId,
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'clientNotes'), {
        clientId,
        trainerId,
        content: newNote.trim(),
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientNotes', clientId, trainerId] })
      setNewNote('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await deleteDoc(doc(db, 'clientNotes', noteId))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientNotes', clientId, trainerId] })
    },
  })

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-2">
        <NotePencil className="h-5 w-5 text-amber-500" weight="duotone" />
        Trainer notes (private)
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        Each note saved as a separate entry. Notes visible only to trainers.
      </p>
      <div className="flex gap-2 mb-4">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note..."
          className="min-h-[80px] bg-background flex-1"
        />
        <Button
          size="sm"
          onClick={() => addMutation.mutate()}
          disabled={!newNote.trim() || addMutation.isPending}
          className="shrink-0 self-end"
        >
          {addMutation.isPending ? 'Saving...' : 'Add'}
        </Button>
      </div>
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {notes.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-2 p-3 rounded-xl border border-border bg-background"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm whitespace-pre-wrap">{n.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {n.createdAt
                  ? format(
                      (n.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(n.createdAt as string),
                      'd MMM yyyy, HH:mm'
                    )
                  : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive shrink-0 h-8 w-8"
              onClick={() => deleteMutation.mutate(n.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No notes yet.</p>
        )}
      </div>
    </div>
  )
}
