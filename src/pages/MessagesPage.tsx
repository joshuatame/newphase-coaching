import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import {
  useMessageThreads,
  useMessages,
  useSendMessage,
  useLikeMessage,
  useAddComment,
  threadId,
  type MessageItem,
  type MessageThread,
} from '@/hooks/useMessageThreads'
import { Link } from 'react-router-dom'
import { ChatCircle, Users, PaperPlaneTilt, Heart, ChatDots, ArrowsClockwise, Microphone, Stop, Image, Paperclip } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'

function RolePill({ role }: { role: Role }) {
  const colors: Record<Role, string> = {
    admin: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    trainer: 'bg-primary/20 text-primary border-primary/40',
    client: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  }
  return (
    <span
      className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full border capitalize',
        colors[role] ?? 'bg-muted text-muted-foreground'
      )}
    >
      {role}
    </span>
  )
}

function formatTime(d: Date | { toDate: () => Date }) {
  const date = d instanceof Date ? d : d.toDate()
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({
  msg,
  isMe,
  threadId: tid,
  onReply,
  myUid,
  getDisplayName,
}: {
  msg: MessageItem
  isMe: boolean
  threadId: string
  onReply: (id: string, preview: string) => void
  myUid: string
  getDisplayName: (uid: string) => string
}) {
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const likeMut = useLikeMessage(tid, msg.id)
  const commentMut = useAddComment(tid, msg.id)

  const created = msg.createdAt instanceof Date ? msg.createdAt : msg.createdAt?.toDate?.()
  const displayName = msg.senderDisplayName ?? getDisplayName(msg.senderId)
  const liked = (msg.likes ?? []).includes(myUid)

  const handleLike = () => {
    likeMut.mutate({ uid: myUid, add: !liked })
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    commentMut.mutate(
      { uid: myUid, text: commentText.trim(), displayName: getDisplayName(myUid) },
      {
        onSuccess: () => {
          setCommentText('')
          setShowCommentInput(null)
        },
      }
    )
  }

  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] rounded-2xl px-4 py-2', isMe ? 'bg-primary text-primary-foreground' : 'bg-card border border-border')}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{displayName}</span>
          <RolePill role={msg.senderRole as Role} />
        </div>
        {msg.replyToId && msg.replyToPreview && (
          <div className="mt-1 pl-2 border-l-2 border-current/40 text-sm opacity-90">
            Reply to: {msg.replyToPreview.slice(0, 50)}{msg.replyToPreview.length > 50 ? '…' : ''}
          </div>
        )}
        {msg.type === 'voice' && msg.voiceUrl ? (
          <div className="mt-2">
            <audio controls src={msg.voiceUrl} className="max-w-full h-10" />
          </div>
        ) : msg.type === 'image' && (msg.imageUrl || (msg as { attachments?: { url: string }[] }).attachments?.[0]?.url) ? (
          <div className="mt-2 space-y-1">
            <a href={msg.imageUrl ?? (msg as { attachments?: { url: string }[] }).attachments?.[0]?.url} target="_blank" rel="noopener noreferrer" className="block">
              <img src={msg.imageUrl ?? (msg as { attachments?: { url: string }[] }).attachments?.[0]?.url} alt="Shared" className="max-w-full max-h-64 rounded-lg object-contain" />
            </a>
            {msg.text && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{msg.text}</p>}
          </div>
        ) : (msg as { fileUrl?: string; attachments?: { url: string; name?: string }[] }).fileUrl || (msg as { attachments?: { url: string; name?: string }[] }).attachments?.length ? (
          <div className="mt-2 space-y-1">
            {((msg as { attachments?: { url: string; name?: string }[] }).attachments ?? [{ url: (msg as { fileUrl?: string }).fileUrl!, name: (msg as { fileName?: string }).fileName }]).map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Paperclip className="h-4 w-4" weight="bold" />
                {a.name ?? 'Attachment'}
              </a>
            ))}
            {msg.text && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{msg.text}</p>}
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words">{msg.text}</p>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
          <span className="py-2">{created ? formatTime(created) : '—'}</span>
          <button
            type="button"
            onClick={() => onReply(msg.id, msg.text.slice(0, 80))}
            className="hover:underline flex items-center gap-1 py-2 px-2 -mx-2 rounded-lg min-h-[36px] min-w-[36px] touch-manipulation"
            aria-label="Reply"
          >
            <ArrowsClockwise className="h-3.5 w-3.5" weight="bold" /> Reply
          </button>
          <button
            type="button"
            onClick={handleLike}
            className={cn('flex items-center gap-1 py-2 px-2 -mx-2 rounded-lg min-h-[36px] min-w-[36px] touch-manipulation', liked && 'text-red-400')}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart className="h-3.5 w-3.5" weight={liked ? 'fill' : 'regular'} />
            {(msg.likes ?? []).length > 0 && <span>{(msg.likes ?? []).length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setShowCommentInput((s) => (s === msg.id ? null : msg.id))}
            className="hover:underline flex items-center gap-1 py-2 px-2 -mx-2 rounded-lg min-h-[36px] min-w-[36px] touch-manipulation"
            aria-label="Comment"
          >
            <ChatDots className="h-3.5 w-3.5" weight="bold" /> Comment
          </button>
        </div>
        {(msg.comments ?? []).length > 0 && (
          <div className="mt-2 space-y-1 pl-2 border-l-2 border-current/40">
            {(msg.comments ?? []).map((c, i) => {
              const cd = c.createdAt instanceof Date ? c.createdAt : (c.createdAt as { toDate?: () => Date })?.toDate?.()
              return (
                <div key={i} className="text-sm">
                  <span className="font-medium">{c.displayName ?? c.uid.slice(0, 8)}</span>
                  {cd && <span className="opacity-70 ml-1 text-xs">{formatTime(cd)}</span>}
                  <p className="opacity-90">{c.text}</p>
                </div>
              )
            })}
          </div>
        )}
        {showCommentInput === msg.id && (
          <div className="mt-2 flex gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="h-8 text-sm bg-background/50"
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button size="sm" onClick={handleComment} disabled={!commentText.trim() || commentMut.isPending}>
              Post
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function MessagesPage() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'dm' | 'groups'>('dm')
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null)
  const [composeClientId, setComposeClientId] = useState<string | null>(null)
  const [composeTrainerId, setComposeTrainerId] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; preview: string } | null>(null)
  const [input, setInput] = useState('')
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const myUid = profile?.uid ?? ''
  const myRole = (profile?.role ?? 'client') as Role
  const isTrainer = myRole === 'trainer' || myRole === 'admin'

  const tid = selectedThread?.id ?? (composeClientId && composeTrainerId ? threadId(composeClientId, composeTrainerId) : null)
  const { data: threads = [] } = useMessageThreads(myUid, myRole)
  const { data: messages = [], refetch: refetchMessages } = useMessages(tid)
  const sendMessage = useSendMessage(tid, composeClientId ?? undefined, composeTrainerId ?? undefined)

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-messages'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'clients'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; displayName?: string; email?: string }[]
    },
    enabled: !!profile && isTrainer,
  })

  const { data: trainers = [] } = useQuery({
    queryKey: ['trainers-for-messages'],
    queryFn: async () => {
      const q = query(
        collection(db, 'users'),
        where('role', 'in', ['trainer', 'admin'])
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; displayName?: string; email?: string }[]
    },
    enabled: !!profile && !isTrainer,
  })

  const getDisplayName = (uid: string) => {
    const client = clients.find((c) => c.id === uid)
    if (client) return client.displayName ?? client.email ?? `Client ${uid.slice(0, 8)}`
    const trainer = trainers.find((t) => t.id === uid)
    if (trainer) return trainer.displayName ?? trainer.email ?? `Trainer ${uid.slice(0, 8)}`
    return uid.slice(0, 8)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectThread = (t: MessageThread) => {
    setSelectedThread(t)
    setComposeClientId(t.clientId)
    setComposeTrainerId(t.trainerId)
    setReplyTo(null)
  }

  const handleStartChat = (clientId?: string, trainerId?: string) => {
    if (clientId && trainerId) {
      setComposeClientId(clientId)
      setComposeTrainerId(trainerId)
      setSelectedThread({
        id: threadId(clientId, trainerId),
        clientId,
        trainerId,
        clientDisplayName: clients.find((c) => c.id === clientId)?.displayName,
        trainerDisplayName: trainers.find((t) => t.id === trainerId)?.displayName,
      })
    }
  }

  const otherDisplayName = selectedThread
    ? isTrainer
      ? selectedThread.clientDisplayName ?? clients.find((c) => c.id === selectedThread.clientId)?.displayName ?? `Client ${selectedThread.clientId.slice(0, 8)}`
      : selectedThread.trainerDisplayName ?? trainers.find((t) => t.id === selectedThread.trainerId)?.displayName ?? `Trainer ${selectedThread.trainerId.slice(0, 8)}`
    : null
  const otherRealName = selectedThread
    ? isTrainer
      ? clients.find((c) => c.id === selectedThread.clientId)?.email ?? selectedThread.clientId
      : trainers.find((t) => t.id === selectedThread.trainerId)?.email ?? selectedThread.trainerId
    : null

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tid) return
    e.target.value = ''
    const isImage = file.type.startsWith('image/')
    const path = `messages/${tid}/${Date.now()}_${file.name}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    if (isImage) {
      sendMessage.mutate(
        {
          text: input.trim() || '📷 Image',
          senderId: myUid,
          senderRole: myRole,
          senderDisplayName: profile?.displayName ?? undefined,
          cid: composeClientId ?? undefined,
          tid: composeTrainerId ?? undefined,
          type: 'image',
          imageUrl: url,
        },
        { onSuccess: () => { setInput(''); refetchMessages() } }
      )
    } else {
      sendMessage.mutate(
        {
          text: input.trim() || `📎 ${file.name}`,
          senderId: myUid,
          senderRole: myRole,
          senderDisplayName: profile?.displayName ?? undefined,
          cid: composeClientId ?? undefined,
          tid: composeTrainerId ?? undefined,
          type: 'file',
          fileUrl: url,
          fileName: file.name,
        },
        { onSuccess: () => { setInput(''); refetchMessages() } }
      )
    }
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || !tid) return
    sendMessage.mutate(
      {
        text,
        senderId: myUid,
        senderRole: myRole,
        senderDisplayName: profile?.displayName ?? undefined,
        replyToId: replyTo?.id,
        replyToPreview: replyTo?.preview,
        cid: composeClientId ?? undefined,
        tid: composeTrainerId ?? undefined,
      },
      {
        onSuccess: () => {
          setInput('')
          setReplyTo(null)
          refetchMessages()
        },
      }
    )
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const path = `voice/${tid}/${Date.now()}.webm`
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, blob)
        const voiceUrl = await getDownloadURL(storageRef)
        sendMessage.mutate(
          {
            text: 'Voice note',
            senderId: myUid,
            senderRole: myRole,
            senderDisplayName: profile?.displayName ?? undefined,
            cid: composeClientId ?? undefined,
            tid: composeTrainerId ?? undefined,
            type: 'voice',
            voiceUrl,
          },
          { onSuccess: () => refetchMessages() }
        )
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch (e) {
      console.error('Mic access failed:', e)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }

  const threadList = threads.length > 0 ? threads : (isTrainer
    ? clients.map((c) => ({
        id: threadId(c.id, myUid),
        clientId: c.id,
        trainerId: myUid,
        clientDisplayName: c.displayName ?? c.email,
        trainerDisplayName: profile?.displayName,
      }))
    : trainers.map((t) => ({
        id: threadId(myUid, t.id),
        clientId: myUid,
        trainerId: t.id,
        clientDisplayName: profile?.displayName,
        trainerDisplayName: t.displayName ?? t.email,
      }))) as MessageThread[]

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Trainer-client messaging. Display names and role labels shown.
        </p>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => setActiveTab('dm')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-medium min-h-[44px] min-w-[44px]',
            activeTab === 'dm' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
          )}
        >
          <ChatCircle className="h-4 w-4" weight="duotone" />
          Direct Messages
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl font-medium min-h-[44px] min-w-[44px]',
            activeTab === 'groups' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
          )}
        >
          <Users className="h-4 w-4" weight="duotone" />
          Groups
        </button>
      </div>

      {activeTab === 'dm' ? (
        <div className="flex-1 flex gap-4 mt-4 rounded-2xl border border-border bg-card overflow-hidden min-h-0">
          <div
            className={cn(
              'w-full md:w-80 flex flex-col border-r border-border shrink-0',
              selectedThread && 'hidden md:flex'
            )}
          >
            <div className="p-3 border-b border-border font-semibold">Conversations</div>
            <div className="flex-1 overflow-y-auto">
              {threadList.map((t) => {
                const client = clients.find((c) => c.id === t.clientId)
                const trainer = trainers.find((tr) => tr.id === t.trainerId)
                const displayName = isTrainer
                  ? (t.clientDisplayName ?? client?.displayName ?? `Client ${t.clientId.slice(0, 8)}`)
                  : (t.trainerDisplayName ?? trainer?.displayName ?? `Trainer ${t.trainerId.slice(0, 8)}`)
                const realName = isTrainer ? (client?.email ?? t.clientId) : (trainer?.email ?? t.trainerId)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectThread(t)}
                    className={cn(
                      'w-full text-left p-4 hover:bg-muted/50 transition-colors min-h-[52px] flex flex-col justify-center',
                      selectedThread?.id === t.id && 'bg-primary/10 border-l-2 border-primary'
                    )}
                  >
                    <span className="font-medium truncate">{displayName}</span>
                    {realName && realName !== displayName && (
                      <span className="text-xs text-muted-foreground truncate">{realName}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {tid ? (
              <>
                <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold truncate">{otherDisplayName ?? 'Chat'}</span>
                    {otherRealName && otherRealName !== otherDisplayName && (
                      <span className="text-xs text-muted-foreground truncate">{otherRealName}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedThread(null)}
                    className="md:hidden text-muted-foreground hover:text-foreground"
                  >
                    Back
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      msg={m}
                      isMe={m.senderId === myUid}
                      threadId={tid}
                      onReply={(id, preview) => setReplyTo({ id, preview })}
                      myUid={myUid}
                      getDisplayName={getDisplayName}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 border-t border-border shrink-0">
                  {replyTo && (
                    <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                      <span>Replying to: {replyTo.preview.slice(0, 40)}…</span>
                      <button type="button" onClick={() => setReplyTo(null)} className="hover:text-foreground">
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleAttachFile}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl min-h-[44px] min-w-[44px] shrink-0"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach image or file"
                    >
                      <Image className="h-5 w-5" weight="bold" />
                    </Button>
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl min-h-[44px]"
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    />
                    {recording ? (
                      <Button
                        onClick={stopRecording}
                        variant="destructive"
                        className="rounded-xl min-h-[44px] min-w-[44px] shrink-0"
                      >
                        <Stop className="h-5 w-5" weight="fill" />
                      </Button>
                    ) : (
                      <Button
                        onClick={startRecording}
                        variant="outline"
                        className="rounded-xl min-h-[44px] min-w-[44px] shrink-0"
                        title="Record voice note"
                      >
                        <Microphone className="h-5 w-5" weight="fill" />
                      </Button>
                    )}
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || sendMessage.isPending}
                      className="rounded-xl min-h-[44px] min-w-[44px] shrink-0"
                    >
                      <PaperPlaneTilt className="h-5 w-5" weight="fill" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <ChatCircle className="h-16 w-16 text-muted-foreground mb-4" weight="duotone" />
                <h3 className="font-semibold">Select a conversation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isTrainer ? 'Choose a client to start messaging.' : 'Choose a trainer to start messaging.'}
                </p>
                {!threads.length && (
                  <div className="mt-4 space-y-2">
                    {isTrainer
                      ? clients.map((c) => (
                          <Button
                            key={c.id}
                            variant="outline"
                            onClick={() => handleStartChat(c.id, myUid)}
                            className="min-h-[44px] flex flex-col items-start h-auto py-2"
                          >
                            <span className="font-medium">{c.displayName ?? c.email ?? `Client ${c.id.slice(0, 8)}`}</span>
                            {c.email && c.email !== (c.displayName ?? c.email) && (
                              <span className="text-xs text-muted-foreground">{c.email}</span>
                            )}
                          </Button>
                        ))
                      : trainers.map((t) => (
                          <Button
                            key={t.id}
                            variant="outline"
                            onClick={() => handleStartChat(myUid, t.id)}
                            className="min-h-[44px] flex flex-col items-start h-auto py-2"
                          >
                            <span className="font-medium">{t.displayName ?? t.email ?? `Trainer ${t.id.slice(0, 8)}`}</span>
                            {t.email && t.email !== (t.displayName ?? t.email) && (
                              <span className="text-xs text-muted-foreground">{t.email}</span>
                            )}
                          </Button>
                        ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center mt-4">
          <Users className="h-16 w-16 text-muted-foreground mb-4" weight="duotone" />
          <h3 className="font-semibold">Community Forums</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Groups and community discussions are in Forums. Join forums your coach invites you to.</p>
          <Link to="/forums">
            <Button>Go to Forums</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
