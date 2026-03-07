import { useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useCatalogPrefetch } from '@/hooks/useCatalogPrefetch'
import { useNotificationsSetup } from '@/hooks/useNotifications'
import { NotificationsPrompt } from '@/components/NotificationsPrompt'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { Sidebar } from './Sidebar'
import { MobileSidebar } from './MobileSidebar'
import { Button } from '@/components/ui/button'
import { List } from '@phosphor-icons/react'
import { PageLoader } from '@/components/PageLoader'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ClientsPage = lazy(() => import('@/pages/ClientsPage').then((m) => ({ default: m.ClientsPage })))
const ClientDetailPage = lazy(() => import('@/pages/ClientDetailPage').then((m) => ({ default: m.ClientDetailPage })))
const AddClientPage = lazy(() => import('@/pages/AddClientPage').then((m) => ({ default: m.AddClientPage })))
const NutritionConsolidatedPage = lazy(() => import('@/pages/NutritionConsolidatedPage').then((m) => ({ default: m.NutritionConsolidatedPage })))
const TrainingConsolidatedPage = lazy(() => import('@/pages/TrainingConsolidatedPage').then((m) => ({ default: m.TrainingConsolidatedPage })))
const SupplementsConsolidatedPage = lazy(() => import('@/pages/SupplementsConsolidatedPage').then((m) => ({ default: m.SupplementsConsolidatedPage })))
const CheckInsPage = lazy(() => import('@/pages/CheckInsPage').then((m) => ({ default: m.CheckInsPage })))
const MessagesPage = lazy(() => import('@/pages/MessagesPage').then((m) => ({ default: m.MessagesPage })))
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const WorkoutPlayerPage = lazy(() => import('@/pages/WorkoutPlayerPage').then((m) => ({ default: m.WorkoutPlayerPage })))
const CommunityChallengesPage = lazy(() => import('@/pages/CommunityChallengesPage').then((m) => ({ default: m.CommunityChallengesPage })))
const ChallengeDetailPage = lazy(() => import('@/pages/ChallengeDetailPage').then((m) => ({ default: m.ChallengeDetailPage })))
const ForumsPage = lazy(() => import('@/pages/ForumsPage').then((m) => ({ default: m.ForumsPage })))
const ForumDetailPage = lazy(() => import('@/pages/ForumDetailPage').then((m) => ({ default: m.ForumDetailPage })))
const ForumThreadPage = lazy(() => import('@/pages/ForumThreadPage').then((m) => ({ default: m.ForumThreadPage })))
const ClientAnalyticsPage = lazy(() => import('@/pages/ClientAnalyticsPage').then((m) => ({ default: m.ClientAnalyticsPage })))
const TrainerAnalyticsPage = lazy(() => import('@/pages/TrainerAnalyticsPage').then((m) => ({ default: m.TrainerAnalyticsPage })))
const ClientMealTrackingPage = lazy(() => import('@/pages/ClientMealTrackingPage').then((m) => ({ default: m.ClientMealTrackingPage })))
const WaterTrackerPage = lazy(() => import('@/pages/WaterTrackerPage').then((m) => ({ default: m.WaterTrackerPage })))
const StepsPage = lazy(() => import('@/pages/StepsPage').then((m) => ({ default: m.StepsPage })))
const ProductivityPage = lazy(() => import('@/pages/ProductivityPage').then((m) => ({ default: m.ProductivityPage })))

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useCatalogPrefetch()
  useNotificationsSetup()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {mobileMenuOpen && <MobileSidebar onClose={() => setMobileMenuOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:ml-64">
        <header className="md:hidden flex items-center gap-2 p-3 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="shrink-0">
            <List className="h-6 w-6" weight="bold" />
          </Button>
          <span className="font-display text-lg">Newphase</span>
        </header>
        <NotificationsPrompt />
        <PWAInstallPrompt />
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/add" element={<AddClientPage />} />
          <Route path="/clients/:clientId" element={<ClientDetailPage />} />
          <Route path="/clients/:clientId/analytics" element={<ClientAnalyticsPage />} />
          <Route path="/analytics" element={<TrainerAnalyticsPage />} />
          <Route path="/productivity" element={<ProductivityPage />} />
          <Route path="/nutrition" element={<NutritionConsolidatedPage />} />
          <Route path="/meal-plans" element={<Navigate to="/nutrition?tab=meal-plans" replace />} />
          <Route path="/meals" element={<ClientMealTrackingPage />} />
          <Route path="/water" element={<WaterTrackerPage />} />
          <Route path="/steps" element={<StepsPage />} />
          <Route path="/training" element={<TrainingConsolidatedPage />} />
          <Route path="/workout-plans" element={<Navigate to="/training?tab=workout-plans" replace />} />
          <Route path="/supplements" element={<SupplementsConsolidatedPage />} />
          <Route path="/regimen" element={<Navigate to="/supplements" replace />} />
          <Route path="/cycles" element={<Navigate to="/supplements?tab=cycles" replace />} />
          <Route path="/checkins" element={<CheckInsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/challenges" element={<CommunityChallengesPage />} />
          <Route path="/challenges/:challengeId" element={<ChallengeDetailPage />} />
          <Route path="/forums" element={<ForumsPage />} />
          <Route path="/forums/:forumId" element={<ForumDetailPage />} />
          <Route path="/forums/:forumId/threads/:threadId" element={<ForumThreadPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/workout/:sessionId" element={<WorkoutPlayerPage />} />
        </Routes>
        </Suspense>
        </main>
      </div>
    </div>
  )
}
