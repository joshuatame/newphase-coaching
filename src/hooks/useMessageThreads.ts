import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface MessageItem {
  id: string
  text: string
  senderId: string
  senderRole: 'admin' | 'trainer' | 'client'
  senderDisplayName?: string
  createdAt: { toDate: () => Date } | Date
  replyToId?: string
  replyToPreview?: string
  likes?: string[]
  comments?: { uid: string; displayName?: string; text: string; createdAt: { toDate: () => Date } | Date }[]
  type?: 'text' | 'voice' | 'image' | 'file'
  voiceUrl?: string
  imageUrl?: string
  fileUrl?: string
  fileName?: string
  attachments?: { url: string; name?: string; type?: string }[]
}

export interface MessageThread {
  id: string
  clientId: string
  trainerId: string
  clientDisplayName?: string
  trainerDisplayName?: string
  lastMessageAt?: { toDate: () => Date } | Date
  lastPreview?: string
}

function threadId(clientId: string, trainerId: string) {
  return [clientId, trainerId].sort().join('_')
}

export function useMessageThreads(myUid: string | undefined, role: 'admin' | 'trainer' | 'client') {
  const isTrainer = role === 'trainer' || role === 'admin'

  return useQuery({
    queryKey: ['messageThreads', myUid, role],
    queryFn: async () => {
      const q = isTrainer
        ? query(collection(db, 'messageThreads'), where('trainerId', '==', myUid!), orderBy('lastMessageAt', 'desc'))
        : query(collection(db, 'messageThreads'), where('clientId', '==', myUid!), orderBy('lastMessageAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MessageThread[]
    },
    enabled: !!myUid,
  })
}

export function useMessages(threadIdParam: string | null) {
  return useQuery({
    queryKey: ['messages', threadIdParam],
    queryFn: async () => {
      if (!threadIdParam) return []
      const snap = await getDocs(
        query(
          collection(db, 'messages', threadIdParam, 'items'),
          orderBy('createdAt', 'asc')
        )
      )
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MessageItem[]
    },
    enabled: !!threadIdParam,
  })
}

export function useSendMessage(threadIdParam: string | null, clientId?: string, trainerId?: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      text,
      senderId,
      senderRole,
      senderDisplayName,
      replyToId,
      replyToPreview,
      cid,
      tid,
      type = 'text',
      voiceUrl,
      imageUrl,
      fileUrl,
      fileName,
      attachments,
    }: {
      text: string
      senderId: string
      senderRole: 'admin' | 'trainer' | 'client'
      senderDisplayName?: string
      replyToId?: string
      replyToPreview?: string
      cid?: string
      tid?: string
      type?: 'text' | 'voice' | 'image' | 'file'
      voiceUrl?: string
      imageUrl?: string
      fileUrl?: string
      fileName?: string
      attachments?: { url: string; name?: string; type?: string }[]
    }) => {
      if (!threadIdParam) throw new Error('No thread selected')
      const col = collection(db, 'messages', threadIdParam, 'items')
      const ref = await addDoc(col, {
        text: text.trim() || (type === 'voice' ? '🎤 Voice note' : ''),
        senderId,
        senderRole,
        senderDisplayName: senderDisplayName ?? null,
        createdAt: serverTimestamp(),
        replyToId: replyToId ?? null,
        replyToPreview: replyToPreview ?? null,
        likes: [],
        comments: [],
        type: type ?? 'text',
        voiceUrl: voiceUrl ?? null,
        imageUrl: imageUrl ?? null,
        fileUrl: fileUrl ?? null,
        fileName: fileName ?? null,
        attachments: attachments ?? null,
      })
      const [c, t] = threadIdParam.split('_')
      const threadRef = doc(db, 'messageThreads', threadIdParam)
      await setDoc(
        threadRef,
        {
          clientId: cid ?? clientId ?? c,
          trainerId: tid ?? trainerId ?? t,
          lastMessageAt: serverTimestamp(),
          lastPreview: type === 'voice' ? '🎤 Voice note' : type === 'image' ? '📷 Image' : type === 'file' ? '📎 File' : text.slice(0, 80),
        },
        { merge: true }
      )
      return ref.id
    },
    onSuccess: (_, __) => {
      qc.invalidateQueries({ queryKey: ['messages', threadIdParam] })
      qc.invalidateQueries({ queryKey: ['messageThreads'] })
    },
  })
}

export function useLikeMessage(threadIdParam: string | null, messageId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ uid, add }: { uid: string; add: boolean }) => {
      if (!threadIdParam) return
      const ref = doc(db, 'messages', threadIdParam, 'items', messageId)
      const snap = await getDoc(ref)
      if (!snap.exists()) return
      const likes: string[] = (snap.data()?.likes ?? []).filter(Boolean)
      const next = add ? (likes.includes(uid) ? likes : [...likes, uid]) : likes.filter((x) => x !== uid)
      await setDoc(ref, { likes: next }, { merge: true })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', threadIdParam] })
    },
  })
}

export function useAddComment(threadIdParam: string | null, messageId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      uid,
      displayName,
      text,
    }: {
      uid: string
      displayName?: string
      text: string
    }) => {
      if (!threadIdParam) return
      const ref = doc(db, 'messages', threadIdParam, 'items', messageId)
      const snap = await getDoc(ref)
      if (!snap.exists()) return
      const raw = snap.data()?.comments
      const comments: NonNullable<MessageItem['comments']> = Array.isArray(raw) ? raw : []
      const next = [
        ...comments,
        { uid, displayName: displayName ?? null, text: text.trim(), createdAt: serverTimestamp() },
      ]
      await setDoc(ref, { comments: next }, { merge: true })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', threadIdParam] })
    },
  })
}

export { threadId }
