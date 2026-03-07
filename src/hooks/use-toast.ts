import * as React from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

type ToastAction = 
  | { type: 'ADD'; toast: Toast }
  | { type: 'DISMISS'; id: string }

const toastListeners: Array<(action: ToastAction) => void> = []

function dispatch(action: ToastAction) {
  toastListeners.forEach((l) => l(action))
}

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    const listener = (action: ToastAction) => {
      if (action.type === 'ADD') {
        setToasts((p) => [...p, action.toast])
        setTimeout(() => {
          dispatch({ type: 'DISMISS', id: action.toast.id })
        }, 4000)
      } else if (action.type === 'DISMISS') {
        setToasts((p) => p.filter((t) => t.id !== action.id))
      }
    }
    toastListeners.push(listener)
    return () => {
      const i = toastListeners.indexOf(listener)
      if (i >= 0) toastListeners.splice(i, 1)
    }
  }, [])

  const toast = React.useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    dispatch({ type: 'ADD', toast: { ...opts, id } })
  }, [])

  return { toast, toasts }
}
