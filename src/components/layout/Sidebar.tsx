import { Link, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  LogOut,
  Users,
  UtensilsCrossed,
  Dumbbell,
  Pill,
  MessageSquare,
  ClipboardList,
  CheckSquare,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/nutrition', icon: UtensilsCrossed, label: 'Nutrition' },
  { to: '/training', icon: Dumbbell, label: 'Training' },
  { to: '/regimen', icon: Pill, label: 'Regimen' },
  { to: '/checkins', icon: ClipboardList, label: 'Check-ins' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="font-display text-xl text-white">Newphase</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}>
            <Button
              variant={location.pathname === to ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start', location.pathname === to && 'bg-primary/20')}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut(auth)}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
