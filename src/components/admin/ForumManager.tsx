import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientMultiSelect } from '@/components/ClientMultiSelect'
import { Plus, Trash, Users } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

type Forum = { id: string; name?: string; description?: string; createdBy?: string; createdAt?: unknown }
type ForumMember = { id: string; forumId: string; clientId: string; userId?: string; invitedAt?: string }

export function ForumManager() {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [inviteForum, setInviteForum] = useState<Forum | null>(null)
  const [inviteClientIds, setInviteClientIds] = useState<string[]>([])

  const { data: forums = [] } = useQuery({
    queryKey: ['forums'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'forums'), orderBy('createdAt', 'desc')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Forum[]
    },
    enabled: profile?.role === 'admin',
  })

  const { data: membersByForum = {} } = useQuery({
    queryKey: ['forumMembers'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'forumMembers'))
      const map: Record<string, ForumMember[]> = {}
      snap.docs.forEach((d) => {
        const data = d.data() as ForumMember
        const m = { ...data, id: d.id } as ForumMember
        if (!map[m.forumId]) map[m.forumId] = []
        map[m.forumId].push(m)
      })
      return map
    },
    enabled: profile?.role === 'admin',
  })

  const { data: clientsMap = {} } = useQuery({
    queryKey: ['clients-display-names'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'clients'))
      const map: Record<string, string> = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        map[d.id] = data.displayName ?? data.email ?? `Client ${d.id.slice(0, 8)}`
      })
      return map
    },
    enabled: profile?.role === 'admin',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'forums'), {
        name: newName.trim(),
        description: newDesc.trim(),
        createdBy: profile?.uid ?? null,
        createdAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['forums'] })
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async ({ forumId, clientIds, existingMembers }: { forumId: string; clientIds: string[]; existingMembers: ForumMember[] }) => {
      const existingIds = existingMembers.map((m) => m.clientId)
      const toRemove = existingIds.filter((id) => !clientIds.includes(id))
      const toAdd = clientIds.filter((id) => !existingIds.includes(id))
      for (const clientId of toRemove) {
        await deleteDoc(doc(db, 'forumMembers', `${forumId}_${clientId}`))
      }
      for (const clientId of toAdd) {
        const clientSnap = await getDoc(doc(db, 'clients', clientId))
        const uid = clientSnap.data()?.uid
        const userId = uid || clientId
        await setDoc(doc(db, 'forumMembers', `${forumId}_${clientId}`), {
          forumId,
          clientId,
          userId,
          invitedAt: new Date().toISOString(),
        })
      }
    },
    onSuccess: () => {
      setInviteForum(null)
      setInviteClientIds([])
      qc.invalidateQueries({ queryKey: ['forumMembers'] })
    },
  })

  const deleteForumMutation = useMutation({
    mutationFn: async (forumId: string) => {
      const members = await getDocs(query(collection(db, 'forumMembers'), where('forumId', '==', forumId)))
      for (const m of members.docs) {
        await deleteDoc(doc(db, 'forumMembers', m.id))
      }
      await deleteDoc(doc(db, 'forums', forumId))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forums'] })
      qc.invalidateQueries({ queryKey: ['forumMembers'] })
    },
  })

  const openInvite = (f: Forum) => {
    setInviteForum(f)
    const existing = (membersByForum[f.id] ?? []).map((m) => m.clientId)
    setInviteClientIds(existing)
  }

  const handleInvite = () => {
    if (!inviteForum) return
    const existing = membersByForum[inviteForum.id] ?? []
    inviteMutation.mutate({ forumId: inviteForum.id, clientIds: inviteClientIds, existingMembers: existing })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" weight="duotone" />
          Forums (group chats)
        </h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" weight="bold" />
          Create forum
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Admins create forums and invite clients. Clients only see forums they&apos;re invited to.
      </p>

      {showCreate && (
        <div className="mb-4 p-4 rounded-xl border border-border bg-muted/30">
          <h3 className="font-semibold mb-3">New forum</h3>
          <div className="space-y-3">
            <Input placeholder="Forum name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => createMutation.mutate()} disabled={!newName.trim() || createMutation.isPending}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {inviteForum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-foreground shadow-xl p-5">
            <h3 className="font-semibold mb-2">Invite clients: {inviteForum.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selected clients can access this forum. Deselect to remove.
            </p>
            <ClientMultiSelect value={inviteClientIds} onChange={setInviteClientIds} />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleInvite} disabled={inviteMutation.isPending}>
                Save
              </Button>
              <Button variant="outline" onClick={() => { setInviteForum(null); setInviteClientIds([]) }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {forums.length === 0 ? (
        <p className="text-muted-foreground py-4">No forums. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {forums.map((f) => {
            const members = membersByForum[f.id] ?? []
            return (
              <div
                key={f.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/forums/${f.id}`} className="font-medium hover:underline truncate">
                      {f.name ?? 'Unnamed'}
                    </Link>
                    <span className="text-xs text-muted-foreground">({members.length} members)</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{f.description ?? ''}</p>
                  {members.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {members.map((m) => clientsMap[m.clientId] ?? m.clientId).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openInvite(f)}>
                    <Users className="h-4 w-4 mr-1" />
                    Invite
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteForumMutation.mutate(f.id)}
                    disabled={deleteForumMutation.isPending}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
