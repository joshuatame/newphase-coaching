import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/spinner'

/**
 * Single entry for onboarding. Redirects to the correct step so dual-role users
 * always complete client onboarding first, then trainer onboarding.
 */
export function OnboardingGuard() {
  const { loading, needsOnboarding, needsClientOnboarding, needsTrainerOnboarding } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    )
  }

  if (!needsOnboarding) {
    return <Navigate to="/" replace />
  }

  if (needsClientOnboarding) {
    return <Navigate to="/onboarding/client" replace />
  }

  if (needsTrainerOnboarding) {
    return <Navigate to="/onboarding/trainer" replace />
  }

  return <Navigate to="/" replace />
}
