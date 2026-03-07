import { Spinner } from '@/components/ui/spinner'

export function PageLoader() {
  return (
    <div
      className="flex w-full flex-1 items-center justify-center min-h-[min(70vh,400px)] py-16"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-12 w-12 text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
