import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import { Check, X, Plus, Play } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { CheckInForm } from '@/components/CheckInForm'
import { PageLoader } from '@/components/PageLoader'

export function CheckInsPage() {
  const [fillingTemplate, setFillingTemplate] = useState<{ id: string; name: string; questions?: unknown[]; frequency?: string } | null>(null)
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'

  const { data: clientsMap = {}, isLoading: clientsLoading } = useQuery({
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
    enabled: !!profile && isTrainer,
  })

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['checkinTemplates'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'checkinTemplates'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile,
  })

  const { data: myCheckins = [], isLoading: myCheckinsLoading } = useQuery({
    queryKey: ['checkins', profile?.uid],
    queryFn: async () => {
      const q = query(
        collection(db, 'checkins'),
        where('clientId', '==', profile?.uid ?? '')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile && profile?.role === 'client',
  })

  const { data: allCheckins = [], isLoading: allCheckinsLoading } = useQuery({
    queryKey: ['checkins-trainer'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'checkins'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    },
    enabled: !!profile && isTrainer,
  })

  const pendingReview = allCheckins.filter((c) => (c as { status?: string }).status === 'pending_review')

  const loading = !profile || templatesLoading ||
    (isTrainer ? (clientsLoading || allCheckinsLoading) : myCheckinsLoading)
  if (loading) return <PageLoader />

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Check-ins</h1>
        <p className="text-muted-foreground mt-1">
          Daily and weekly check-ins. Templates configurable by admin.
        </p>
      </div>

      {isTrainer && pendingReview.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="font-semibold mb-3">Pending review ({pendingReview.length})</h2>
          <div className="space-y-2">
            {pendingReview.map((c) => {
              const cid = (c as { clientId?: string }).clientId ?? ''
              return (
                <Link
                  key={c.id}
                  to={`/clients/${cid}`}
                  className="block p-3 rounded-xl bg-card border border-border hover:border-primary/50"
                >
                  {clientsMap[cid] ?? `Client ${cid.slice(0, 8)}`} – {(c as { date?: string }).date}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {profile?.role === 'client' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-semibold mb-1">Submit check-in</h2>
              <p className="text-sm text-muted-foreground">
                {templates.length === 0
                  ? 'No check-in templates yet. Ask your coach to set them up in Admin.'
                  : 'Complete your daily or weekly check-in.'}
              </p>
            </div>
            {templates.length > 0 && (
              <Button onClick={() => setFillingTemplate(templates[0] as { id: string; name: string; questions?: unknown[]; frequency?: string })}>
                <Plus className="h-4 w-4 mr-2" weight="bold" />
                Submit check-in
              </Button>
            )}
          </div>
        </div>
      )}

      {profile?.role === 'client' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-3">My check-ins</h2>
          {myCheckins.length === 0 ? (
            <p className="text-muted-foreground">No check-ins yet.</p>
          ) : (
            <div className="space-y-2">
              {myCheckins
                .sort((a, b) => ((b as { date?: string }).date ?? '').localeCompare((a as { date?: string }).date ?? ''))
                .slice(0, 10)
                .map((c) => {
                  const item = c as { id: string; date?: string; status?: string; feedbackVideoUrl?: string }
                  return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border"
                  >
                    <span>{item.date}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.feedbackVideoUrl && (
                        <a
                          href={item.feedbackVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Play className="h-4 w-4" weight="fill" /> Check-in feedback
                        </a>
                      )}
                      {item.status === 'complete' ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <Check className="h-4 w-4" weight="bold" /> Complete
                        </span>
                      ) : item.status === 'pending_review' ? (
                        <span className="text-amber-500">Pending review</span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <X className="h-4 w-4" /> Incomplete
                        </span>
                      )}
                    </div>
                  </div>
                )})}
            </div>
          )}
        </div>
      )}

      {fillingTemplate && profile?.role === 'client' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setFillingTemplate(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto text-foreground shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Submit check-in: {fillingTemplate.name}</h3>
            </div>
            <div className="p-4">
              <CheckInForm
                template={{
                  id: fillingTemplate.id,
                  name: fillingTemplate.name,
                  questions: (fillingTemplate.questions ?? []) as { id: string; question: string; type: string; options?: string[] }[],
                  frequency: fillingTemplate.frequency,
                }}
                clientId={profile.uid}
                defaultDate={format(new Date(), 'yyyy-MM-dd')}
                onSuccess={() => setFillingTemplate(null)}
                onCancel={() => setFillingTemplate(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
