import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type Client = { id: string; displayName?: string; email?: string; goals?: string }

export function ClientMultiSelect({
  value,
  onChange,
  className,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  className?: string
}) {
  const { profile } = useAuth()

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'clients'))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Client[]
    },
    enabled: !!profile && (profile?.role === 'trainer' || profile?.role === 'admin'),
  })

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">Allocated to</label>
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clients. Add clients first.</p>
      ) : (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
          {clients.map((c) => {
            const selected = value.includes(c.id)
            const label = c.displayName ?? c.email ?? `Client ${c.id.slice(0, 8)}`
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors',
                  selected ? 'bg-primary/15 text-primary' : 'hover:bg-muted/50'
                )}
              >
                <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', selected ? 'bg-primary border-primary' : 'border-input')}>
                  {selected && <Check className="h-3 w-3 text-primary-foreground" weight="bold" />}
                </span>
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
