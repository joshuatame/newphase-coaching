import { useState, useMemo } from 'react'
import { CaretLeft, CaretRight, BookOpen, List } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type DiaryEntry = {
  id?: string
  date: string
  diaryNote?: string
  score?: number
}

interface DiaryTabProps {
  entries: DiaryEntry[]
  displayClients?: { id: string; displayName?: string; email?: string }[]
  activeClientId?: string
  clientDisplayName?: string
}

const ENTRIES_PER_PAGE = 2

export function DiaryTab({ entries }: DiaryTabProps) {
  const [diaryView, setDiaryView] = useState<'book' | 'list'>('book')
  const [currentPage, setCurrentPage] = useState(0)

  const diaryEntries = useMemo(
    () =>
      entries
        .filter((e) => e.diaryNote && e.diaryNote.trim().length > 0)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [entries]
  )

  const pageCount = Math.max(1, Math.ceil(diaryEntries.length / ENTRIES_PER_PAGE))
  const canPrev = currentPage > 0
  const canNext = currentPage < pageCount - 1

  const pageEntries = diaryEntries.slice(
    currentPage * ENTRIES_PER_PAGE,
    (currentPage + 1) * ENTRIES_PER_PAGE
  )

  if (diaryEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" weight="duotone" />
        <h3 className="font-semibold text-lg mb-2">No diary entries yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Write reflections in the Diary note field when you log your daily habits. Your entries will appear here in a beautiful book-style view.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={diaryView === 'book' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDiaryView('book')}
          >
            <BookOpen className="h-4 w-4 mr-1" weight="duotone" />
            Book
          </Button>
          <Button
            variant={diaryView === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDiaryView('list')}
          >
            <List className="h-4 w-4 mr-1" weight="duotone" />
            List
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {diaryEntries.length} entr{diaryEntries.length === 1 ? 'y' : 'ies'}
        </p>
      </div>

      {diaryView === 'list' ? (
        <div className="space-y-3">
          {diaryEntries.map((e) => (
            <div
              key={e.date}
              className="rounded-2xl border border-border bg-card p-5 hover:bg-muted/20 transition-colors"
            >
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {format(new Date(e.date), 'EEEE, d MMMM yyyy')}
              </p>
              <p className="whitespace-pre-wrap">{e.diaryNote}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'relative w-full max-w-2xl perspective-1000',
              'min-h-[320px] flex items-center justify-center'
            )}
          >
            <div className="relative w-full flex flex-wrap justify-center gap-4 md:gap-6" style={{ perspective: '1200px' }}>
              {pageEntries.map((e, idx) => (
                <div
                  key={e.date}
                  className={cn(
                    'rounded-2xl border-2 border-amber-900/20 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/30',
                    'shadow-xl shadow-amber-900/10',
                    'p-6 md:p-8',
                    'min-h-[280px] w-full md:max-w-[calc(50%-0.5rem)] flex-shrink-0',
                    idx === 0 && pageEntries.length === 2 && 'md:-rotate-[2deg]',
                    idx === 1 && 'md:rotate-[2deg]'
                  )}
                >
                  <div className="font-serif">
                    <p className="text-sm text-amber-800/70 dark:text-amber-200/70 mb-2">
                      {format(new Date(e.date), 'EEEE, d MMMM yyyy')}
                    </p>
                    <p className="text-amber-900 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
                      {e.diaryNote}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={!canPrev}
              className="rounded-full"
            >
              <CaretLeft className="h-5 w-5" weight="bold" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              Page {currentPage + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={!canNext}
              className="rounded-full"
            >
              <CaretRight className="h-5 w-5" weight="bold" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
