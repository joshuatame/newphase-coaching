import { useState, useEffect } from 'react'
import { DeviceMobile, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'np-pwa-install-dismissed'

function isSamsungInternet(): boolean {
  if (typeof navigator === 'undefined') return false
  return /SamsungBrowser/i.test(navigator.userAgent || '')
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null)
  const [show, setShow] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [useChromeInstead, setUseChromeInstead] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
    if (isSamsungInternet() && !localStorage.getItem(DISMISS_KEY)) {
      setUseChromeInstead(true)
      setShow(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      if (isSamsungInternet()) return
      const ev = e as unknown as { prompt: () => Promise<void> }
      setDeferredPrompt({ prompt: () => ev.prompt() })
      if (!localStorage.getItem(DISMISS_KEY)) setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      setShow(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  if (isStandalone) return null
  if (useChromeInstead && !show) return null
  if (useChromeInstead) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 bg-amber-500/10 border-b border-amber-500/20">
        <div className="flex items-center gap-3 min-w-0">
          <DeviceMobile className="h-5 w-5 text-amber-600 shrink-0" weight="duotone" />
          <div>
            <p className="font-medium text-sm">Samsung Internet detected</p>
            <p className="text-xs text-muted-foreground">
              Use Chrome and add from Chrome&apos;s menu (⋮) → Add to Home screen to avoid &quot;Enable Samsung Internet&quot; errors.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 -m-2 rounded-lg text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" weight="bold" />
        </button>
      </div>
    )
  }
  if (!show) return null

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 border-b border-border">
      <div className="flex items-center gap-3 min-w-0">
        <DeviceMobile className="h-5 w-5 text-primary shrink-0" weight="duotone" />
        <div>
          <p className="font-medium text-sm">Add to home screen for quick access</p>
          <p className="text-xs text-muted-foreground">Install the app like a native app</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {deferredPrompt && (
          <Button size="sm" onClick={handleInstall}>
            Install
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
