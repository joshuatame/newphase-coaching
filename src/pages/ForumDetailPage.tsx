import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ChatCircle, Plus, Paperclip, X } from '@phosphor-icons/react'

export function ForumDetailPage() {
  const { forumId } = useParams<{ forumId: string }>()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [showNewThread, setShowNewThread] = useState(false)
  const [threadTitle, setThreadTitle] = useState('')
  const [threadBody, setThreadBody] = useState('')
  const [threadAttachments, setThreadAttachments] = useState<{ url: string; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: forum } = useQuery({
    queryKey: ['forum', forumId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'forums', forumId!))
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    },
    enabled: !!forumId,
  })

  const { data: threads = [] } = useQuery({
    queryKey: ['forum-threads', forumId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'forums', forumId!, 'threads'),
          orderBy('createdAt', 'desc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!forumId,
  })

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      const threadRef = await addDoc(collection(db, 'forums', forumId!, 'threads'), {
        title: threadTitle.trim(),
        createdBy: profile?.uid ?? null,
        createdByName: profile?.displayName ?? profile?.email ?? 'Anonymous',
        createdAt: serverTimestamp(),
      })
      await addDoc(collection(db, 'forums', forumId!, 'threads', threadRef.id, 'posts'), {
        body: threadBody.trim(),
        createdBy: profile?.uid ?? null,
        createdByName: profile?.displayName ?? profile?.email ?? 'Anonymous',
        createdAt: serverTimestamp(),
        attachments: threadAttachments,
      })
      return threadRef.id
    },
    onSuccess: () => {
      setThreadTitle('')
      setThreadBody('')
      setThreadAttachments([])
      setShowNewThread(false)
      qc.invalidateQueries({ queryKey: ['forum-threads', forumId] })
    },
  })

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !forumId) return
    e.target.value = ''
    const path = `forums/${forumId}/${Date.now()}_${file.name}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    setThreadAttachments((a) => [...a, { url, name: file.name }])
  }

  if (!forum) return <p className="p-4">Forum not found.</p>

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Link to="/forums" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to forums
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{(forum as { name?: string }).name ?? 'Forum'}</h1>
          <p className="text-muted-foreground mt-1">{(forum as { description?: string }).description ?? ''}</p>
        </div>
        <Button onClick={() => setShowNewThread(true)}>
          <Plus className="h-4 w-4 mr-2" weight="bold" />
          New thread
        </Button>
      </div>

      {showNewThread && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">New thread</h3>
          <div className="space-y-3">
            <Input
              placeholder="Title"
              value={threadTitle}
              onChange={(e) => setThreadTitle(e.target.value)}
            />
            <textarea
              placeholder="Your message"
              value={threadBody}
              onChange={(e) => setThreadBody(e.target.value)}
              className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleAttachFile} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4 mr-1" weight="bold" /> Attach file
              </Button>
              {threadAttachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {threadAttachments.map((a, i) => (
                    <span key={i} className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[120px]">{a.name}</a>
                      <button type="button" onClick={() => setThreadAttachments((x) => x.filter((_, j) => j !== i))}><X className="h-4 w-4" weight="bold" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setShowNewThread(false); setThreadAttachments([]) }}>Cancel</Button>
              <Button
                onClick={() => createThreadMutation.mutate()}
                disabled={!threadTitle.trim() || (!threadBody.trim() && threadAttachments.length === 0) || createThreadMutation.isPending}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Threads</h2>
        {threads.length === 0 ? (
          <p className="text-muted-foreground">No threads yet.</p>
        ) : (
          <div className="space-y-2">
            {threads.map((t: { id: string; title?: string; createdByName?: string }) => (
              <Link
                key={t.id}
                to={`/forums/${forumId}/threads/${t.id}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 block"
              >
                <ChatCircle className="h-6 w-6 text-primary shrink-0" weight="duotone" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{t.title ?? 'Untitled'}</p>
                  <p className="text-sm text-muted-foreground">by {t.createdByName ?? 'Anonymous'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
