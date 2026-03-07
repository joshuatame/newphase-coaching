import { Link, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  ChartLine,
  SignOut,
  Users,
  ForkKnife,
  Barbell,
  Pill,
  ChatCircle,
  ClipboardText,
  CheckSquare,
  Bell,
  Gear,
  Sliders,
  ChatsCircle,
  Lightning,
  ChartBar,
  Footprints,
  Trophy,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useMyClientId } from '@/hooks/useMyClientId'

const baseNavItems = [
  { to: '/', icon: ChartLine, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/analytics', icon: ChartBar, label: 'Analytics' },
  { to: '/productivity', icon: Lightning, label: 'Productivity' },
  { to: '/steps', icon: Footprints, label: 'Steps' },
  { to: '/nutrition', icon: ForkKnife, label: 'Nutrition' },
  { to: '/training', icon: Barbell, label: 'Training' },
  { to: '/supplements', icon: Pill, label: 'Supplements' },
  { to: '/checkins', icon: ClipboardText, label: 'Check-ins' },
  { to: '/messages', icon: ChatCircle, label: 'Messages' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
  { to: '/forums', icon: ChatsCircle, label: 'Forums' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
]

export function Sidebar() {
  const location = useLocation()
  const { profile } = useAuth()
  const myClientId = useMyClientId()
  const isAdmin = profile?.role === 'admin'
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'
  const isBlended = isTrainer && !!myClientId
  const items = [
    ...baseNavItems.filter((item) =>
      item.to === '/analytics' ? isTrainer : true
    ),
    { to: '/settings', icon: Sliders, label: 'Settings' },
    ...(isAdmin ? [{ to: '/admin', icon: Gear, label: 'Admin' }] : []),
  ]
  const meItem = isBlended && myClientId ? { to: `/clients/${myClientId}/analytics`, icon: ChartLine, label: 'Me (my progress)' } : null

  return (
    <aside className="hidden md:flex fixed left-0 top-0 w-64 h-screen flex-col border-r border-border bg-sidebar z-40">
      <div className="p-5 border-b border-border">
        <h2 className="font-display text-xl text-foreground">Newphase</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-auto">
        {meItem && (() => {
          const MeIcon = meItem.icon
          return (
            <Link to={meItem.to}>
              <Button
                variant={location.pathname === meItem.to ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start rounded-xl h-11',
                  location.pathname === meItem.to && 'bg-primary text-primary-foreground'
                )}
              >
                <MeIcon className="mr-3 h-5 w-5" weight="duotone" />
                {meItem.label}
              </Button>
            </Link>
          )
        })()}
        {items.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}>
            <Button
              variant={location.pathname === to ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start rounded-xl h-11',
                location.pathname === to && 'bg-primary text-primary-foreground'
              )}
            >
              <Icon className="mr-3 h-5 w-5" weight="duotone" />
              {label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border space-y-1">
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <span className="text-xs text-muted-foreground">Theme</span>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl h-11"
          onClick={() => signOut(auth)}
        >
          <SignOut className="mr-3 h-5 w-5" weight="duotone" />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
