import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Toaster } from './components/ui/toaster'
import { Spinner } from './components/ui/spinner'
import { SamsungPWANotice } from './components/SamsungPWANotice'
import { LoginPage } from './pages/LoginPage'
import { ClientOnboardingPage } from './pages/ClientOnboardingPage'
import { TrainerOnboardingPage } from './pages/TrainerOnboardingPage'

const DashboardLayout = lazy(() =>
  import('./components/layout/DashboardLayout').then((m) => ({ default: m.DashboardLayout }))
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, needsOnboarding } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (needsOnboarding) {
    if (profile?.role === 'client') {
      return <Navigate to="/onboarding/client" replace />
    }
    if (profile?.role === 'trainer' || profile?.role === 'admin') {
      return <Navigate to="/onboarding/trainer" replace />
    }
  }
  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <>
      <SamsungPWANotice />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding/client" element={<OnboardingRoute><ClientOnboardingPage /></OnboardingRoute>} />
        <Route path="/onboarding/trainer" element={<OnboardingRoute><TrainerOnboardingPage /></OnboardingRoute>} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                  <Spinner className="h-10 w-10 text-primary" />
                </div>
              }>
                <DashboardLayout />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
