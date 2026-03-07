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
  X,
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
  { to: '/settings', icon: Sliders, label: 'Settings' },
]

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  const location = useLocation()
  const { profile } = useAuth()
  const myClientId = useMyClientId()
  const isTrainer = profile?.role === 'trainer' || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'
  const isBlended = isTrainer && !!myClientId
  const navItems = [
    ...(isBlended && myClientId ? [{ to: `/clients/${myClientId}/analytics`, icon: ChartLine, label: 'Me (my progress)' }] : []),
    ...baseNavItems.filter((item) =>
      item.to === '/analytics' ? isTrainer : true
    ),
    ...(isAdmin ? [{ to: '/admin', icon: Gear, label: 'Admin' }] : []),
  ]

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl text-foreground">Newphase</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="h-5 w-5" weight="bold" />
            </Button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} onClick={onClose}>
              <Button
                variant={location.pathname === to ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start min-h-[44px] rounded-xl',
                  location.pathname === to && 'bg-primary/15 text-primary'
                )}
              >
                <Icon className="mr-3 h-5 w-5 shrink-0" weight="duotone" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start min-h-[44px] rounded-xl"
            onClick={() => { signOut(auth); onClose(); }}
          >
            <SignOut className="mr-3 h-5 w-5 shrink-0" weight="duotone" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
