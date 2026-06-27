import { useToastStore } from '@/hooks/useToast'
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const icons = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

const colors = {
  success: 'border-l-success-500 text-success-600',
  info: 'border-l-brand-500 text-brand-600',
  warning: 'border-l-warning-500 text-warning-600',
  error: 'border-l-danger-500 text-danger-600',
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`pointer-events-auto bg-surface-0 border border-surface-200 border-l-4 ${colors[toast.type]} rounded-lg shadow-lg p-3 flex items-start gap-3 max-w-sm`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-surface-900 flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-surface-500 hover:text-surface-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
