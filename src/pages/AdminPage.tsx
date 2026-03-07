import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import {
  EnvelopeSimple,
  Plus,
  Trash,
  ClipboardText,
  ListChecks,
  Pencil,
  FileText,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckinTemplateEditor } from '@/components/admin/CheckinTemplateEditor'
import { SessionSurveyEditor } from '@/components/admin/SessionSurveyEditor'
import { ForumManager } from '@/components/admin/ForumManager'
import { ChallengeManager } from '@/components/admin/ChallengeManager'
import { WeeklyRecapQuestionEditor } from '@/components/admin/WeeklyRecapQuestionEditor'
import type { CheckinTemplate } from '@/components/admin/CheckinTemplateEditor'
import type { SessionSurveyTemplate } from '@/components/admin/SessionSurveyEditor'

type InviteRole = 'client' | 'trainer' | 'both'

export function AdminPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteRole>('client')
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testEmailState, setTestEmailState] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [checkinEditorOpen, setCheckinEditorOpen] = useState(false)
  const [editingCheckin, setEditingCheckin] = useState<CheckinTemplate | null>(null)
  const [surveyEditorOpen, setSurveyEditorOpen] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState<SessionSurveyTemplate | null>(null)
  const [weeklyRecapEditorOpen, setWeeklyRecapEditorOpen] = useState(false)

  const { data: invites = [] } = useQuery({
    queryKey: ['allowedEmails'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'allowedEmails'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: profile?.role === 'admin',
  })

  const { data: checkinTemplates = [] } = useQuery({
    queryKey: ['checkinTemplates'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'checkinTemplates'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: profile?.role === 'admin',
  })

  const { data: weeklyRecapTemplate } = useQuery({
    queryKey: ['weeklyRecapTemplate'],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'config', 'weeklyRecapTemplate'))
      return snap.exists() ? snap.data() : null
    },
    enabled: profile?.role === 'admin',
  })

  const { data: sessionSurveys = [] } = useQuery({
    queryKey: ['sessionSurveyTemplates'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'sessionSurveyTemplates'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: profile?.role === 'admin',
  })

  const addInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: InviteRole }) => {
      const docId = email.toLowerCase().replace(/\./g, '_')
      const roles: ('client' | 'trainer')[] =
        role === 'both' ? ['client', 'trainer'] : role === 'trainer' ? ['trainer'] : ['client']
      await setDoc(doc(db, 'allowedEmails', docId), {
        email: email.toLowerCase(),
        roles,
        addedAt: new Date().toISOString(),
      })
    },
    onSuccess: (_, { email }) => {
      setInviteEmail('')
      setInviteMessage({ type: 'success', text: `Invite sent to ${email}. They will receive an email notification.` })
      queryClient.invalidateQueries({ queryKey: ['allowedEmails'] })
    },
    onError: (e) => setInviteMessage({ type: 'error', text: String(e) }),
  })

  const removeInviteMutation = useMutation({
    mutationFn: async (docId: string) => {
      await deleteDoc(doc(db, 'allowedEmails', docId))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allowedEmails'] }),
  })

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setInviteMessage(null)
    const email = inviteEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      setInviteMessage({ type: 'error', text: 'Enter a valid email' })
      return
    }
    addInviteMutation.mutate({ email, role: inviteRole })
  }

  const openNewCheckin = () => {
    setEditingCheckin(null)
    setCheckinEditorOpen(true)
  }

  const openEditCheckin = (t: CheckinTemplate) => {
    setEditingCheckin(t as CheckinTemplate)
    setCheckinEditorOpen(true)
  }

  const openNewSurvey = () => {
    setEditingSurvey(null)
    setSurveyEditorOpen(true)
  }

  const openEditSurvey = (t: SessionSurveyTemplate) => {
    setEditingSurvey(t as SessionSurveyTemplate)
    setSurveyEditorOpen(true)
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-muted-foreground mt-1">Platform management</p>
      </div>

      {/* Check-in templates */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardText className="h-5 w-5 text-primary" weight="duotone" />
            Check-in forms
          </h2>
          <Button onClick={openNewCheckin}>
            <Plus className="h-4 w-4 mr-2" weight="bold" />
            New template
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Daily and weekly check-in templates. Clients fill these out based on the frequency you set.
        </p>
        {checkinTemplates.length === 0 ? (
          <p className="text-muted-foreground py-4">No templates. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {(checkinTemplates as CheckinTemplate[]).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30"
              >
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.frequency} · {(t.questions ?? []).length} questions
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEditCheckin(t)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post-workout survey */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" weight="duotone" />
            Post-workout survey
          </h2>
          <Button onClick={openNewSurvey}>
            <Plus className="h-4 w-4 mr-2" weight="bold" />
            New survey
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Questions shown after a client completes a workout (e.g. &quot;How did you feel after training?&quot;).
        </p>
        {sessionSurveys.length === 0 ? (
          <p className="text-muted-foreground py-4">No surveys. Create one to collect post-workout feedback.</p>
        ) : (
          <div className="space-y-2">
            {(sessionSurveys as SessionSurveyTemplate[]).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30"
              >
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(t.questions ?? []).length} questions
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEditSurvey(t)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly recap questions */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" weight="duotone" />
            Weekly recap questions
          </h2>
          <Button onClick={() => setWeeklyRecapEditorOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" weight="bold" />
            Edit questions
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Questions for the trainer-only weekly recap form (per client). Customize the form your trainers fill out.
        </p>
        {(weeklyRecapTemplate?.questions?.length ?? 0) > 0 ? (
          <p className="text-sm text-muted-foreground">
            {(weeklyRecapTemplate?.questions ?? []).length} questions configured
          </p>
        ) : (
          <p className="text-muted-foreground py-2">Using default questions. Edit to customize.</p>
        )}
      </div>

      {/* Community challenges */}
      <ChallengeManager />

      {/* Forums */}
      <ForumManager />

      {/* Invite management */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <EnvelopeSimple className="h-5 w-5 text-primary" weight="duotone" />
          Invite management
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Add an email to send an invite. The user will receive an email notification with sign-up instructions.
        </p>
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              setTestEmailState(null)
              try {
                const fn = httpsCallable<unknown, { ok: boolean; error?: string }>(functions, 'sendTestEmail')
                const res = await fn()
                const data = res.data
                if (data.ok) {
                  setTestEmailState({ type: 'success', text: 'Test email sent. Check your inbox (and spam folder).' })
                } else {
                  setTestEmailState({ type: 'error', text: data.error ?? 'Failed to send test email' })
                }
              } catch (e) {
                setTestEmailState({ type: 'error', text: (e as Error).message })
              }
            }}
          >
            <EnvelopeSimple className="h-4 w-4 mr-2" weight="bold" />
            Send test email
          </Button>
        </div>
        {testEmailState && (
          <div
            className={`p-3 rounded-xl text-sm mb-4 ${testEmailState.type === 'success' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-destructive/20 text-destructive'}`}
          >
            {testEmailState.text}
          </div>
        )}
        <form onSubmit={handleAddInvite} className="flex flex-wrap gap-2 items-center mb-4">
          <Input
            type="email"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as InviteRole)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="client">Client</option>
            <option value="trainer">Trainer</option>
            <option value="both">Both (trainer & client)</option>
          </select>
          <Button type="submit" disabled={addInviteMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" weight="bold" />
            Add invite
          </Button>
        </form>
        {inviteMessage && (
          <div
            className={`p-3 rounded-xl text-sm mb-4 ${inviteMessage.type === 'success' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-destructive/20 text-destructive'}`}
          >
            {inviteMessage.text}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Allowed emails ({invites.length})</h3>
          {invites.map((i: { id: string; email?: string; roles?: string[] }) => (
            <div
              key={i.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border"
            >
              <span className="flex flex-wrap items-center gap-2">
                {i.email}
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {!i.roles || i.roles.length === 0
                    ? 'Client'
                    : i.roles.length === 2
                      ? 'Both'
                      : i.roles[0] === 'trainer'
                        ? 'Trainer'
                        : 'Client'}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeInviteMutation.mutate(i.id)}
                disabled={removeInviteMutation.isPending}
                className="text-destructive"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {checkinEditorOpen && (
        <CheckinTemplateEditor
          template={editingCheckin}
          onClose={() => {
            setCheckinEditorOpen(false)
            setEditingCheckin(null)
          }}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['checkinTemplates'] })}
        />
      )}
      {surveyEditorOpen && (
        <SessionSurveyEditor
          template={editingSurvey}
          onClose={() => {
            setSurveyEditorOpen(false)
            setEditingSurvey(null)
          }}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['sessionSurveyTemplates'] })}
        />
      )}
      {weeklyRecapEditorOpen && (
        <WeeklyRecapQuestionEditor
          questions={((weeklyRecapTemplate ?? {})?.questions ?? []).map((q: { id: string; question: string; type: string; options?: string[] }) => ({
            id: q.id,
            question: q.question,
            type: q.type as 'text' | 'number' | 'scale' | 'yesno' | 'multiselect' | 'photo' | 'video',
            options: q.options,
          }))}
          onClose={() => setWeeklyRecapEditorOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['weeklyRecapTemplate'] })
            setWeeklyRecapEditorOpen(false)
          }}
        />
      )}
    </div>
  )
}
