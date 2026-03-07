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
import { PageLoader } from '@/components/PageLoader'
import { ArrowLeft, Paperclip, X } from '@phosphor-icons/react'

export function ForumThreadPage() {
  const { forumId, threadId } = useParams<{ forumId: string; threadId: string }>()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [replyText, setReplyText] = useState('')
  const [replyAttachments, setReplyAttachments] = useState<{ url: string; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: forum } = useQuery({
    queryKey: ['forum', forumId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'forums', forumId!))
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    },
    enabled: !!forumId,
  })

  const { data: thread } = useQuery({
    queryKey: ['forum-thread', forumId, threadId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'forums', forumId!, 'threads', threadId!))
      return snap.exists() ? { id: snap.id, ...snap.data() } : null
    },
    enabled: !!forumId && !!threadId,
  })

  const { data: posts = [] } = useQuery({
    queryKey: ['forum-posts', forumId, threadId],
    queryFn: async () => {
      const snap = await getDocs(
        query(
          collection(db, 'forums', forumId!, 'threads', threadId!, 'posts'),
          orderBy('createdAt', 'asc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!forumId && !!threadId,
  })

  const replyMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'forums', forumId!, 'threads', threadId!, 'posts'), {
        body: replyText.trim(),
        createdBy: profile?.uid ?? null,
        createdByName: profile?.displayName ?? profile?.email ?? 'Anonymous',
        createdAt: serverTimestamp(),
        attachments: replyAttachments,
      })
    },
    onSuccess: () => {
      setReplyText('')
      setReplyAttachments([])
      qc.invalidateQueries({ queryKey: ['forum-posts', forumId, threadId] })
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
    setReplyAttachments((a) => [...a, { url, name: file.name }])
  }

  if (!forum || !thread) return <PageLoader />

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <Link to={`/forums/${forumId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {(forum as { name?: string }).name}
      </Link>
      <h1 className="text-2xl font-bold">{(thread as { title?: string }).title ?? 'Thread'}</h1>

      <div className="space-y-4">
        {posts.map((p: { id: string; body?: string; createdByName?: string; createdAt?: { toDate: () => Date }; attachments?: { url: string; name: string }[] }) => (
          <div key={p.id} className="p-4 rounded-xl border border-border bg-card">
            <p className="text-sm text-muted-foreground mb-2">
              {p.createdByName ?? 'Anonymous'}
              {p.createdAt && typeof p.createdAt === 'object' && 'toDate' in p.createdAt
                ? ` · ${(p.createdAt as { toDate: () => Date }).toDate().toLocaleDateString()}`
                : ''}
            </p>
            <p className="whitespace-pre-wrap">{p.body ?? ''}</p>
            {(p.attachments ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {p.attachments!.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Paperclip className="h-4 w-4" weight="bold" />
                    {a.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3">Reply</h3>
        <textarea
          placeholder="Your reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="w-full min-h-[80px] rounded-lg border border-border bg-background px-3 py-2 text-sm mb-3"
        />
        <div className="mb-3">
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt" className="hidden" onChange={handleAttachFile} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4 mr-1" weight="bold" /> Attach file
          </Button>
          {replyAttachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {replyAttachments.map((a, i) => (
                <span key={i} className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded">
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[120px]">{a.name}</a>
                  <button type="button" onClick={() => setReplyAttachments((x) => x.filter((_, j) => j !== i))}><X className="h-4 w-4" weight="bold" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={() => replyMutation.mutate()}
          disabled={(!replyText.trim() && replyAttachments.length === 0) || replyMutation.isPending}
        >
          Post reply
        </Button>
      </div>
    </div>
  )
}
