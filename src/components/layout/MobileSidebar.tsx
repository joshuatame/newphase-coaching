import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/clients', label: 'Clients' },
  { to: '/nutrition', label: 'Nutrition' },
  { to: '/training', label: 'Training' },
  { to: '/regimen', label: 'Regimen' },
  { to: '/checkins', label: 'Check-ins' },
  { to: '/messages', label: 'Messages' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/notifications', label: 'Notifications' },
]

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  const location = useLocation()

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl text-white">Newphase</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          {navItems.map(({ to, label }) => (
            <Link key={to} to={to} onClick={onClose}>
              <Button
                variant={location.pathname === to ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start min-h-[44px]', location.pathname === to && 'bg-primary/20')}
              >
                {label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start min-h-[44px]"
            onClick={() => { signOut(auth); onClose(); }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
