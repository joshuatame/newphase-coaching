/**
 * Export utilities for CSV and text reports.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
) {
  const headers = columns.map((c) => c.header).join(',')
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const v = row[c.key]
        const s = v == null ? '' : String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      })
      .join(',')
  )
  const csv = [headers, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportProductivityReport(
  entries: { date: string; score?: number; diaryNote?: string; habitCompletions?: Record<string, boolean>; scheduleItems?: { title: string; completed: boolean }[] }[],
  filename = 'productivity-report.csv'
) {
  const cols = [
    { key: 'date' as const, header: 'Date' },
    { key: 'score' as const, header: 'Score (1-10)' },
    { key: 'habitsDone' as const, header: 'Habits completed' },
    { key: 'tasksDone' as const, header: 'Tasks completed' },
    { key: 'diaryNote' as const, header: 'Diary note' },
  ]
  const rows = entries.map((e) => ({
    date: e.date,
    score: e.score ?? '',
    habitsDone: e.habitCompletions
      ? Object.values(e.habitCompletions).filter(Boolean).length
      : 0,
    tasksDone: (e.scheduleItems ?? []).filter((s) => s.completed).length,
    diaryNote: (e.diaryNote ?? '').replace(/\n/g, ' ').slice(0, 100),
  }))
  exportToCSV(rows, cols, filename)
}
