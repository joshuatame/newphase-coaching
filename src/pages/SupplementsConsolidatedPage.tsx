import { useState, useEffect, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pill, ArrowsClockwise } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { PageLoader } from '@/components/PageLoader'

const RegimenPage = lazy(() => import('./RegimenPage').then((m) => ({ default: m.RegimenPage })))
const CyclesPage = lazy(() => import('./CyclesPage').then((m) => ({ default: m.CyclesPage })))

const TABS = [
  { id: 'catalog', label: 'Supplement catalog', icon: Pill, component: RegimenPage },
  { id: 'cycles', label: 'Cycles', icon: ArrowsClockwise, component: CyclesPage },
] as const

export function SupplementsConsolidatedPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') ?? 'catalog'
  const tabId = (TABS.some((t) => t.id === tabParam) ? tabParam : 'catalog') as (typeof TABS)[number]['id']
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>(tabId)
  useEffect(() => {
    setActiveTab(tabId)
  }, [tabId])

  const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0]
  const TabContent = currentTab.component

  const handleTabChange = (id: (typeof TABS)[number]['id']) => {
    setActiveTab(id)
    setSearchParams({ tab: id })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 p-4 md:p-6 pb-0">
        <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-muted/50 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" weight="duotone" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <Suspense fallback={<PageLoader />}>
          <TabContent />
        </Suspense>
      </div>
    </div>
  )
}
