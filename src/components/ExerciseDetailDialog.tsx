import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Barbell, Video, Play, ListChecks } from '@phosphor-icons/react'

const EXERCISE_PLACEHOLDER = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400'

export interface ExerciseDetail {
  id: string
  name: string
  category?: string
  targetMuscles?: string[]
  equipment?: string[]
  instructions?: string
  videoLink?: string
  imageUrl?: string
}

export function ExerciseDetailDialog({
  exercise,
  open,
  onOpenChange,
}: {
  exercise: ExerciseDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const ex = (exercise ?? {}) as unknown as Record<string, unknown>
  const rawTarget = ex.targetMuscles ?? ex.target_muscles
  const rawEquipment = ex.equipment ?? ex.equipment_type
  const targetMuscles = Array.isArray(rawTarget) ? rawTarget.filter(Boolean).map(String) : []
  const equipment = Array.isArray(rawEquipment)
    ? rawEquipment.filter(Boolean).map(String)
    : typeof rawEquipment === 'string' && rawEquipment.trim()
      ? [rawEquipment.trim()]
      : []
  const instructions = (ex.instructions ?? ex.instruction ?? '') as string
  const imageUrl = ((ex.imageUrl ?? ex.image ?? '') as string) || EXERCISE_PLACEHOLDER
  const videoUrl = (ex.videoLink ?? ex.video ?? '') as string
  const displayName = (ex.name ?? 'Exercise') as string

  return (
    <Dialog open={open && !!exercise} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(32rem,calc(100vw-2rem))] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barbell className="h-5 w-5 text-primary" weight="duotone" />
            {displayName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full exercise details: picture, muscle groups, equipment, and instructions for {displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-2xl overflow-hidden border border-border bg-muted/30">
            <img
              src={imageUrl}
              alt={`${displayName} — exercise form`}
              className="w-full h-44 sm:h-52 object-cover"
            />
          </div>

          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:bg-card/80 transition-colors"
            >
              <div className="rounded-xl bg-primary/20 p-2">
                <Play className="h-6 w-6 text-primary" weight="fill" />
              </div>
              <div>
                <p className="font-medium">Watch video tutorial</p>
                <p className="text-muted-foreground">Opens in new tab</p>
              </div>
              <Video className="h-5 w-5 ml-auto text-muted-foreground" weight="duotone" />
            </a>
          )}

          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-foreground">
              <ListChecks className="h-4 w-4 text-primary" weight="duotone" />
              Exercise information
            </h4>
            <div className="grid gap-4">
              {ex.category != null && String(ex.category).trim() && (
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-1">Category</span>
                  <p className="font-medium">{String(ex.category)}</p>
                </div>
              )}
              {targetMuscles.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Target muscle groups</span>
                  <div className="flex flex-wrap gap-2">
                    {targetMuscles.map((m, i) => (
                      <span key={i} className="rounded-lg bg-primary/20 text-primary px-3 py-1 text-sm font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {equipment.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-2">Equipment</span>
                  <div className="flex flex-wrap gap-2">
                    {equipment.map((eq, i) => (
                      <span key={i} className="rounded-lg bg-muted px-3 py-1 text-sm">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {!ex.category && !targetMuscles.length && !equipment.length && (
                <p className="text-muted-foreground text-sm">No additional details available.</p>
              )}
            </div>
          </div>

          {(instructions && instructions.trim()) && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h4 className="font-semibold mb-2 text-foreground">How to perform</h4>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{instructions}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
