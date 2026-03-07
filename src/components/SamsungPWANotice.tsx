import { useState, useEffect } from 'react'
import { X, Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'np-samsung-pwa-notice-dismissed'

function isSamsungDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /samsung|SamsungBrowser|SEC/i.test(ua) || /SM-|SAMSUNG/i.test(ua)
}

function isSamsungInternet(): boolean {
  if (typeof navigator === 'undefined') return false
  return /SamsungBrowser/i.test(navigator.userAgent || '')
}

export function SamsungPWANotice() {
  const [show, setShow] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (!isSamsungDevice()) return
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
    if (standalone) return
    if (localStorage.getItem(DISMISS_KEY)) return
    setShow(true)
  }, [])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  if (!show || isStandalone) return null

  return (
    <div className="flex items-start gap-3 p-4 bg-amber-500/15 border-b border-amber-500/30">
      <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" weight="duotone" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-amber-800 dark:text-amber-200">
          Samsung device: Avoid &quot;Enable Samsung Internet&quot; error
        </p>
        <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-1">
          {isSamsungInternet() ? (
            <>
              You&apos;re using Samsung Internet. To add the app to your home screen without issues, open this site in{' '}
              <strong>Chrome</strong> instead, then use Chrome&apos;s menu (⋮) → Add to Home screen. This prevents the
              &quot;Enable Samsung Internet&quot; error.
            </>
          ) : (
            <>
              Add to home screen from <strong>Chrome</strong> (menu → Add to Home screen) for the best experience. Installing
              from Samsung Internet can cause &quot;Enable Samsung Internet&quot; errors if that app is disabled.
            </>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 border-amber-500/50 text-amber-800 dark:text-amber-200"
          onClick={() => {
            window.open('https://www.google.com/chrome/', '_blank')
          }}
        >
          Get Chrome
        </Button>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-2 -m-2 rounded-lg text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" weight="bold" />
      </button>
    </div>
  )
}
