import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileSidebar } from './MobileSidebar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientDetailPage } from '@/pages/ClientDetailPage'
import { AddClientPage } from '@/pages/AddClientPage'
import { NutritionPage } from '@/pages/NutritionPage'
import { TrainingPage } from '@/pages/TrainingPage'
import { RegimenPage } from '@/pages/RegimenPage'
import { CheckInsPage } from '@/pages/CheckInsPage'
import { MessagesPage } from '@/pages/MessagesPage'
import { TasksPage } from '@/pages/TasksPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { WorkoutPlayerPage } from '@/pages/WorkoutPlayerPage'

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {mobileMenuOpen && <MobileSidebar onClose={() => setMobileMenuOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-2 p-3 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="shrink-0">
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-display text-lg">Newphase</span>
        </header>
        <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/add" element={<AddClientPage />} />
          <Route path="/clients/:clientId" element={<ClientDetailPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/regimen" element={<RegimenPage />} />
          <Route path="/checkins" element={<CheckInsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/workout/:sessionId" element={<WorkoutPlayerPage />} />
        </Routes>
        </main>
      </div>
    </div>
  )
}
