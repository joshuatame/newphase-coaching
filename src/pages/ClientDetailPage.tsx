import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Spinner } from '@/components/ui/spinner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore'
import { db, functions } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { httpsCallable } from 'firebase/functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, ChartLine, Drop, VideoCamera, Play } from '@phosphor-icons/react'
import { ClientNotesSection } from '@/components/ClientNotesSection'
import { WeeklyRecapForm } from '@/components/WeeklyRecapForm'
import { ClientGoalsSection } from '@/components/ClientGoalsSection'
import { ProgressPhotosSection } from '@/components/ProgressPhotosSection'
import { ProgressMeasurementsSection } from '@/components/ProgressMeasurementsSection'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { CheckinFeedbackRecorder } from '@/components/CheckinFeedbackRecorder'

interface ClientData {
  id: string
  goals?: string
  trainingExperience?: string
  injuries?: string
  timezone?: string
}

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [showNotify, setShowNotify] = useState(false)
  const [waterGoal, setWaterGoal] = useState('')
  const [recordingCheckin, setRecordingCheckin] = useState<{
    id: string
    date: string
  } | null>(null)

  const { data: checkins = [] } = useQuery({
    queryKey: ['checkins-client', clientId],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'checkins'), where('clientId', '==', clientId!)))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!clientId && (profile?.role === 'trainer' || profile?.role === 'admin'),
  })

  const sendNotifMutation = useMutation({
    mutationFn: async () => {
      const fn = httpsCallable<
        { userId: string; title: string; body: string },
        { success: boolean }
      >(functions, 'sendNotification')
      const targetUserId = (client as { uid?: string })?.uid ?? clientId!
      await fn({ userId: targetUserId, title: notifTitle, body: notifBody })
    },
    onSuccess: () => {
      setNotifTitle('')
      setNotifBody('')
      setShowNotify(false)
    },
  })

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'clients', clientId!))
      return snap.exists() ? { id: snap.id, ...snap.data() } as ClientData : null
    },
    enabled: !!clientId,
  })

  const waterGoalMutation = useMutation({
    mutationFn: async (litres: number) => {
      await updateDoc(doc(db, 'clients', clientId!), { waterGoalL: litres })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', clientId] })
      setWaterGoal('')
    },
  })


  if (!clientId) return <p>Invalid client</p>
  if (!client) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    )
  }

  const displayName = (client as { displayName?: string; email?: string }).displayName ?? (client as { email?: string }).email ?? `Client ${client.id.slice(0, 8)}`
  const canSendNotification = profile?.role === 'trainer' || profile?.role === 'admin'

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">{displayName}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold mb-2">Details</h2>
          <p>Goals: {client.goals ?? '—'}</p>
          <p>Experience: {client.trainingExperience ?? '—'}</p>
          <p>Injuries: {client.injuries ?? '—'}</p>
          <p>Timezone: {client.timezone ?? '—'}</p>
          {canSendNotification && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Drop className="h-5 w-5 text-blue-500" weight="duotone" />
                <span className="font-medium">Water goal</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {(client as { waterGoalL?: number }).waterGoalL != null
                  ? `Current: ${(client as { waterGoalL?: number }).waterGoalL}L/day`
                  : 'Not set'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Liters per day"
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(e.target.value)}
                  className="w-28"
                />
                <Button
                  size="sm"
                  onClick={() => waterGoalMutation.mutate(parseFloat(waterGoal) || 0)}
                  disabled={!waterGoal.trim() || waterGoalMutation.isPending}
                >
                  Set
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold mb-2">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/clients/${clientId}/analytics`}>
                <ChartLine className="mr-2 h-4 w-4" weight="duotone" />
                Analytics
              </Link>
            </Button>
            {canSendNotification && (
            <Button
              variant="outline"
              onClick={() => setShowNotify(true)}
              disabled={!(client as { uid?: string }).uid}
              title={!(client as { uid?: string }).uid ? 'Client must sign in before receiving notifications' : undefined}
            >
              <Bell className="mr-2 h-4 w-4" weight="duotone" />
              Send notification
            </Button>
            )}
          </div>
          {showNotify && (
            <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <Input
                placeholder="Title"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
              />
              <Input
                placeholder="Message"
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => sendNotifMutation.mutate()} disabled={!notifTitle.trim() || !notifBody.trim() || sendNotifMutation.isPending}>
                  Send
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowNotify(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {canSendNotification && checkins.length > 0 && (
        <div className="mt-6 p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold mb-3">Check-ins</h2>
          <div className="space-y-2">
            {checkins
              .sort((a, b) => ((b as { date?: string }).date ?? '').localeCompare((a as { date?: string }).date ?? ''))
              .slice(0, 20)
              .map((c) => {
                const item = c as { id: string; date?: string; status?: string; feedbackVideoUrl?: string }
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border"
                  >
                    <div>
                      <span className="font-medium">{item.date ?? '—'}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {item.status === 'complete' && item.feedbackVideoUrl
                          ? 'Feedback recorded'
                          : item.status === 'pending_review'
                            ? 'Pending review'
                            : item.status ?? '—'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.status === 'pending_review' && (
                        <Button
                          size="sm"
                          onClick={() => setRecordingCheckin({ id: item.id, date: item.date ?? '' })}
                        >
                          <VideoCamera className="h-4 w-4 mr-1" weight="bold" />
                          Provide Feedback
                        </Button>
                      )}
                      {item.feedbackVideoUrl && (
                        <a
                          href={item.feedbackVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button size="sm" variant="outline">
                            <Play className="h-4 w-4 mr-1" weight="fill" />
                            View feedback
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-6">
        <div className="p-4 rounded-lg border border-border bg-card">
          <ClientGoalsSection clientId={clientId!} isTrainer={!!canSendNotification} />
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <ProgressPhotosSection clientId={clientId!} isTrainer={!!canSendNotification} />
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <ProgressMeasurementsSection clientId={clientId!} isTrainer={!!canSendNotification} />
        </div>
      </div>

      {/* Trainer-only: Notes & Weekly Recap (collapsible) */}
      {canSendNotification && (
        <div className="mt-6 space-y-4">
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger>Trainer notes</CollapsibleTrigger>
            <CollapsibleContent>
              <ClientNotesSection clientId={clientId!} />
            </CollapsibleContent>
          </Collapsible>
          <Collapsible defaultOpen={true}>
            <CollapsibleTrigger>Weekly recap</CollapsibleTrigger>
            <CollapsibleContent>
              <WeeklyRecapForm clientId={clientId!} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {recordingCheckin && (
        <CheckinFeedbackRecorder
          checkinId={recordingCheckin.id}
          clientId={clientId!}
          clientUid={(client as { uid?: string })?.uid}
          date={recordingCheckin.date}
          onComplete={() => {
            setRecordingCheckin(null)
            qc.invalidateQueries({ queryKey: ['checkins-client', clientId] })
            qc.invalidateQueries({ queryKey: ['checkins-trainer'] })
          }}
          onCancel={() => setRecordingCheckin(null)}
        />
      )}
    </div>
  )
}
