import { useAuth } from '@/hooks/useAuth'

export function DashboardPage() {
  const { user, profile } = useAuth()

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome, {user?.email} ({profile?.role ?? 'unknown'})
      </p>
    </div>
  )
}
