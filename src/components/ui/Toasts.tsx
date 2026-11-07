import { useEffect } from 'react'
import { useAppStore, type Toast } from '../../store/useAppStore'

export function Toasts() {
  const toasts = useAppStore((s) => s.toasts)
  return (
    <div className="toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useAppStore((s) => s.dismissToast)
  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), 8000)
    return () => clearTimeout(id)
  }, [toast.id, dismiss])
  return (
    <div className={`toast toast--${toast.tone}`} role="status">
      <p>{toast.text}</p>
      <button type="button" className="icon-btn" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}
