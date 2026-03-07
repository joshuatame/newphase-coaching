import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { Pill, Check } from '@phosphor-icons/react'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'

export interface SupplementDetail {
  id: string
  name: string
  form?: string
  category?: string
  instructions?: string
  notes?: string
  halfLifeHours?: number
  halfLifeDays?: number
  mgPerMl?: number
  useCases?: string[]
  positives?: string[]
  sideEffects?: string[]
}

function halfLifeDecayData(halfLifeHours: number): { hours: number; percent: number }[] {
  const points: { hours: number; percent: number }[] = []
  const maxHours = Math.min(halfLifeHours * 6, 720)
  for (let h = 0; h <= maxHours; h += Math.max(1, Math.floor(maxHours / 50))) {
    const halfLives = h / halfLifeHours
    const percent = 100 * Math.pow(0.5, halfLives)
    points.push({ hours: h, percent: Math.round(percent * 10) / 10 })
  }
  if (points[points.length - 1]?.hours !== maxHours) {
    const halfLives = maxHours / halfLifeHours
    points.push({ hours: maxHours, percent: Math.round(100 * Math.pow(0.5, halfLives) * 10) / 10 })
  }
  return points
}

export function SupplementDetailDialog({
  supplement,
  open,
  onOpenChange,
}: {
  supplement: SupplementDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { profile } = useAuth()
  const qc = useQueryClient()
  const logMutation = useMutation({
    mutationFn: async () => {
      await addDoc(collection(db, 'logsRegimen'), {
        supplementId: supplement!.id,
        supplementName: supplement!.name,
        userId: profile!.uid,
        date: format(new Date(), 'yyyy-MM-dd'),
        loggedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['logsRegimen', profile?.uid] })
    },
  })

  if (!supplement) return null

  const halfLifeH = supplement.halfLifeHours ?? supplement.halfLifeDays ? (supplement.halfLifeDays as number) * 24 : null
  const chartData = halfLifeH ? halfLifeDecayData(halfLifeH) : []
  const displayHalfLife = halfLifeH
    ? halfLifeH >= 24
      ? `${(halfLifeH / 24).toFixed(1)} days`
      : `${halfLifeH} hours`
    : 'N/A'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(32rem,calc(100vw-2rem))] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" weight="duotone" />
            {supplement.name ?? 'Supplement'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details for {supplement.name ?? 'this supplement'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {!supplement.form && !supplement.category && supplement.mgPerMl == null && !supplement.instructions && !supplement.notes && !(supplement.useCases?.length) && !(supplement.positives?.length) && !(supplement.sideEffects?.length) && supplement.halfLifeHours == null && supplement.halfLifeDays == null && (
            <p className="text-muted-foreground">No additional details available.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {supplement.form && (
              <span className="rounded-lg bg-muted px-2 py-1">{supplement.form}</span>
            )}
            {supplement.category && (
              <span className="rounded-lg bg-primary/20 text-primary px-2 py-1 capitalize">
                {supplement.category}
              </span>
            )}
            {supplement.mgPerMl != null && (
              <span className="rounded-lg bg-muted px-2 py-1">{supplement.mgPerMl} mg/mL</span>
            )}
          </div>

          {halfLifeH != null && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-semibold mb-2">Half-life: {displayHalfLife}</h3>
              <p className="text-muted-foreground text-xs mb-3">
                Estimated compound concentration over time (exponential decay)
              </p>
              <div className="h-48 min-h-[192px] w-full min-w-[240px]">
                <ResponsiveContainer width="100%" height={192}>
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="hours"
                      tickFormatter={(v) => (v >= 24 ? `${Math.round(v / 24)}d` : `${v}h`)}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                    />
                    <Tooltip
                      formatter={(v) => [`${v ?? 0}%`, 'Remaining']}
                      labelFormatter={(h) => `Hour ${h}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.75rem',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="percent"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {supplement.useCases && supplement.useCases.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Use cases</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {supplement.useCases.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}

          {supplement.positives && supplement.positives.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Benefits</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {supplement.positives.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {supplement.sideEffects && supplement.sideEffects.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Side effects</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {supplement.sideEffects.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {supplement.instructions && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Instructions</h4>
              <p className="text-muted-foreground">{supplement.instructions}</p>
            </div>
          )}

          {supplement.notes && (
            <p className="text-xs text-muted-foreground italic">{supplement.notes}</p>
          )}

          {profile?.role === 'client' && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => logMutation.mutate()}
                disabled={logMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" weight="bold" />
                Log today
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
