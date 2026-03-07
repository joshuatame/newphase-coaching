import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection } from 'firebase/firestore'
import { getDocsCacheFirst } from '@/lib/firestore-cache'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { AddSupplementDialog } from '@/components/AddSupplementDialog'
import { SupplementDetailDialog, type SupplementDetail } from '@/components/SupplementDetailDialog'
import { Spinner } from '@/components/ui/spinner'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'

const CATEGORIES = ['All', 'supplement', 'hormone', 'peptide', 'medication'] as const

export function RegimenPage() {
  const { profile } = useAuth()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [selectedSupplement, setSelectedSupplement] = useState<SupplementDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['supplementCatalog'],
    queryFn: async () => {
      const snap = await getDocsCacheFirst(collection(db, 'supplementCatalog'))
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() ?? {}) })) as SupplementDetail[]
      const byKey = new Map<string, SupplementDetail>()
      for (const i of list) {
        const key = (i.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '').trim() || i.id
        const existing = byKey.get(key)
        const preferThis = !existing || (i.id.startsWith('sup-') && !existing.id.startsWith('sup-'))
        if (preferThis) byKey.set(key, i)
      }
      return Array.from(byKey.values())
    },
    enabled: !!profile,
    staleTime: 1000 * 60 * 60 * 24,
  })

  const filtered = useMemo(() => {
    let list = items
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.form?.toLowerCase().includes(q)
      )
    }
    if (categoryFilter !== 'All') {
      list = list.filter((i) => (i.category ?? '').toLowerCase() === categoryFilter.toLowerCase())
    }
    return list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }, [items, search, categoryFilter])

  const openDetail = (item: SupplementDetail) => {
    setSelectedSupplement(item)
    setDetailOpen(true)
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Supplementation</h1>
        {isTrainer && <AddSupplementDialog />}
      </div>

      <p className="text-muted-foreground text-sm">
        Tracking and compliance only. No dosing calculations or medical advice.
      </p>

      {profile?.role === 'client' && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-3">Compliance</h2>
          <p className="text-sm text-muted-foreground">
            Log supplements as you take them to track compliance. Tap a supplement below, then &quot;Log today&quot; in the detail dialog.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            weight="bold"
          />
          <Input
            placeholder="Search supplements, hormones, peptides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-4 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-10 w-10 text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openDetail(item)}
              className="text-left p-5 rounded-2xl border border-border bg-card hover:bg-card/80 hover:border-primary/50 transition-all w-full min-h-[88px] touch-manipulation cursor-pointer"
            >
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {[item.form, item.category].filter(Boolean).join(' • ')}
              </p>
              {item.halfLifeHours != null && (
                <p className="text-xs text-primary mt-2">
                  Half-life: {item.halfLifeHours >= 24 ? `${(item.halfLifeHours / 24).toFixed(1)}d` : `${item.halfLifeHours}h`}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <p className="text-muted-foreground py-8 text-center">Not found</p>
      )}

      <SupplementDetailDialog
        supplement={selectedSupplement}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
