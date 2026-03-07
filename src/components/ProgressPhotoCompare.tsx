import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Images } from '@phosphor-icons/react'

type ProgressPhoto = {
  id: string
  url: string
  date: string
  caption?: string
}

export function ProgressPhotoCompare({
  photos,
  open,
  onOpenChange,
}: {
  photos: ProgressPhoto[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [before, setBefore] = useState<ProgressPhoto | null>(null)
  const [after, setAfter] = useState<ProgressPhoto | null>(null)
  const [sliderPos, setSliderPos] = useState(50)

  const sortedByDate = [...photos].sort((a, b) => a.date.localeCompare(b.date))
  const beforeOptions = after ? sortedByDate.filter((p) => p.date < after.date) : sortedByDate
  const afterOptions = before ? sortedByDate.filter((p) => p.date > before.date) : sortedByDate

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setBefore(null)
          setAfter(null)
          setSliderPos(50)
          onOpenChange(true)
        }}
        disabled={photos.length < 2}
        className="gap-2"
      >
        <Images className="h-4 w-4" weight="duotone" />
        Compare photos
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Before & after comparison</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Before</label>
                <select
                  value={before?.id ?? ''}
                  onChange={(e) => {
                    const p = photos.find((x) => x.id === e.target.value)
                    setBefore(p ?? null)
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                >
                  <option value="">Select photo</option>
                  {beforeOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.date} {p.caption ? `– ${p.caption}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">After</label>
                <select
                  value={after?.id ?? ''}
                  onChange={(e) => {
                    const p = photos.find((x) => x.id === e.target.value)
                    setAfter(p ?? null)
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                >
                  <option value="">Select photo</option>
                  {afterOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.date} {p.caption ? `– ${p.caption}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {before && after && (
              <div
                className="relative w-full aspect-square max-h-[60vh] rounded-xl overflow-hidden bg-muted border border-border select-none"
                onMouseLeave={() => {}}
              >
                <img
                  src={after.url}
                  alt="After"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={before.url}
                    alt="Before"
                    className="absolute inset-0 h-full object-cover object-left"
                    style={{ width: `${10000 / sliderPos}%` }}
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
                  style={{ left: `${sliderPos}%` }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    const startX = e.clientX
                    const startPos = sliderPos
                    const onMove = (move: MouseEvent) => {
                      const el = e.currentTarget.parentElement
                      if (!el) return
                      const rect = el.getBoundingClientRect()
                      const delta = ((move.clientX - startX) / rect.width) * 100
                      setSliderPos(Math.min(95, Math.max(5, startPos + delta)))
                    }
                    const onUp = () => {
                      document.removeEventListener('mousemove', onMove)
                      document.removeEventListener('mouseup', onUp)
                    }
                    document.addEventListener('mousemove', onMove)
                    document.addEventListener('mouseup', onUp)
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-xs">
                    ◀▶
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
                  Before: {before.date}
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-xs">
                  After: {after.date}
                </div>
              </div>
            )}

            {(!before || !after) && photos.length >= 2 && (
              <p className="text-sm text-muted-foreground">
                Select a before and after photo to compare them side by side. Drag the slider to reveal the comparison.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
