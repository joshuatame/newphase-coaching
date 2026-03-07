import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash, MagnifyingGlass, Info } from '@phosphor-icons/react'
import { SupplementDetailDialog, type SupplementDetail } from '@/components/SupplementDetailDialog'

export interface CycleSupplement {
  supplementId: string
  name?: string
  dose?: string
  frequency?: string
  notes?: string
}

export interface CycleForEditor {
  id: string
  name?: string
  supplements?: CycleSupplement[]
  notes?: string
}

export interface SupplementForEditor {
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

export function CycleEditor({
  cycle,
  supplements,
  onSave,
  onClose,
}: {
  cycle: CycleForEditor
  supplements: SupplementForEditor[]
  onSave: (cycle: { supplements: CycleSupplement[]; notes?: string }) => Promise<void>
  onClose: () => void
}) {
  const [cycleSupplements, setCycleSupplements] = useState<CycleSupplement[]>(
    cycle.supplements ?? []
  )
  const [cycleNotes, setCycleNotes] = useState(cycle.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [selectedSupplement, setSelectedSupplement] = useState<SupplementDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filteredCatalog = useMemo(() => {
    if (!addSearch.trim()) return supplements
    const q = addSearch.toLowerCase()
    return supplements.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.form?.toLowerCase().includes(q)
    )
  }, [supplements, addSearch])

  const addSupplement = (supplementId: string) => {
    const sup = supplements.find((s) => s.id === supplementId)
    if (!sup || cycleSupplements.some((s) => s.supplementId === supplementId))
      return
    setCycleSupplements((prev) => [
      ...prev,
      { supplementId, name: sup.name },
    ])
  }

  const removeSupplement = (supplementId: string) => {
    setCycleSupplements((prev) =>
      prev.filter((s) => s.supplementId !== supplementId)
    )
  }

  const updateSupplement = (
    supplementId: string,
    updates: Partial<Omit<CycleSupplement, 'supplementId'>>
  ) => {
    setCycleSupplements((prev) =>
      prev.map((s) =>
        s.supplementId === supplementId ? { ...s, ...updates } : s
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        supplements: cycleSupplements,
        notes: cycleNotes.trim() || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const getName = (s: CycleSupplement) =>
    s.name ??
    supplements.find((x) => x.id === s.supplementId)?.name ??
    s.supplementId

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit cycle: {cycle.name ?? 'Unnamed'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cycle-level notes */}
          <div>
            <label className="text-sm font-medium">Cycle notes</label>
            <Textarea
              placeholder="General notes for this supplement cycle..."
              value={cycleNotes}
              onChange={(e) => setCycleNotes(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Supplements list */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplements</label>
            {cycleSupplements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 border border-dashed rounded-xl text-center">
                No supplements yet. Add from the catalog below.
              </p>
            ) : (
              <div className="space-y-2">
                {cycleSupplements.map((s) => {
                  const fullSup = supplements.find((x) => x.id === s.supplementId)
                  const asDetail: SupplementDetail | null = fullSup
                    ? {
                        id: fullSup.id,
                        name: fullSup.name,
                        form: fullSup.form,
                        category: fullSup.category,
                        instructions: fullSup.instructions,
                        notes: fullSup.notes,
                        halfLifeHours: fullSup.halfLifeHours,
                        halfLifeDays: fullSup.halfLifeDays,
                        mgPerMl: fullSup.mgPerMl,
                        useCases: fullSup.useCases,
                        positives: fullSup.positives,
                        sideEffects: fullSup.sideEffects,
                      }
                    : null
                  return (
                  <div
                    key={s.supplementId}
                    className="rounded-xl border border-border bg-muted/30 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span className="font-medium truncate">{getName(s)}</span>
                        {asDetail && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplement(asDetail)
                              setDetailOpen(true)
                            }}
                            className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            aria-label="View details"
                          >
                            <Info className="h-4 w-4" weight="bold" />
                          </button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSupplement(s.supplementId)}
                        className="text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash className="h-4 w-4" weight="bold" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Dose</label>
                        <Input
                          placeholder="e.g. 500mg"
                          value={s.dose ?? ''}
                          onChange={(e) =>
                            updateSupplement(s.supplementId, {
                              dose: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Frequency</label>
                        <Input
                          placeholder="e.g. 2x daily"
                          value={s.frequency ?? ''}
                          onChange={(e) =>
                            updateSupplement(s.supplementId, {
                              frequency: e.target.value,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Input
                        placeholder="Notes for this supplement..."
                        value={s.notes ?? ''}
                        onChange={(e) =>
                          updateSupplement(s.supplementId, { notes: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                  )
                })}
              </div>
            )}

            {/* Add from catalog */}
            <div className="pt-2 border-t border-border">
              <div className="relative mb-2">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  weight="bold"
                />
                <Input
                  placeholder="Search supplements to add..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                value=""
                onChange={(e) => {
                  addSupplement(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value="">Add supplement from catalog...</option>
                {filteredCatalog
                  .filter(
                    (sup) =>
                      !cycleSupplements.some((p) => p.supplementId === sup.id)
                  )
                  .map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {sup.form ? `(${sup.form})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
        <SupplementDetailDialog
          supplement={selectedSupplement}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
