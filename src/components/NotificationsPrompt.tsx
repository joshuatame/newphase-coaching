import { useState, useEffect } from 'react'
import { Bell, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { requestNotificationPermission, registerFCMToken } from '@/lib/notifications'
import { useAuth } from '@/hooks/useAuth'

const DISMISS_KEY = 'np-notifications-prompt-dismissed'

export function NotificationsPrompt() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !user?.uid) return
    const perm = Notification.permission
    setStatus(perm)
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (perm === 'default' && !dismissed) setVisible(true)
    else if (perm === 'denied') setVisible(true)
  }, [user?.uid])

  const handleEnable = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const perm = await requestNotificationPermission()
      setStatus(perm)
      if (perm === 'granted') {
        await registerFCMToken(user.uid)
        setVisible(false)
        localStorage.removeItem(DISMISS_KEY)
      }
    } catch (e) {
      console.warn('Notification setup failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    if (status === 'default') localStorage.setItem(DISMISS_KEY, '1')
  }

  if (!visible || !user) return null

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-primary/10 border-b border-primary/20">
      <div className="flex items-center gap-3 min-w-0">
        <Bell className="h-5 w-5 text-primary shrink-0" weight="duotone" />
        <div>
          <p className="font-medium text-sm">
            {status === 'denied'
              ? 'Notifications are blocked. Enable them in your browser to get reminders.'
              : 'Enable notifications to get reminders, check-ins, and calendar alerts.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {status !== 'denied' && (
          <Button size="sm" onClick={handleEnable} disabled={loading}>
            {loading ? 'Enabling…' : 'Enable'}
          </Button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" weight="bold" />
        </button>
      </div>
    </div>
  )
}
