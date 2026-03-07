import * as React from 'react'
import { CaretDown, CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface CollapsibleContextValue {
  open: boolean
  onToggle: () => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

export function Collapsible({
  defaultOpen = false,
  children,
  className,
}: {
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <CollapsibleContext.Provider value={{ open, onToggle: () => setOpen((o) => !o) }}>
      <div className={cn('rounded-lg border border-border', className)}>{children}</div>
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) return null
  const Icon = ctx.open ? CaretDown : CaretRight
  return (
    <button
      type="button"
      onClick={ctx.onToggle}
      className={cn(
        'w-full flex items-center gap-2 px-4 py-3 text-left font-medium hover:bg-muted/50 transition-colors rounded-lg',
        className
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" weight="bold" />
      {children}
    </button>
  )
}

export function CollapsibleContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) return null
  if (!ctx.open) return null
  return <div className={cn('px-4 pb-4 pt-0', className)}>{children}</div>
}
