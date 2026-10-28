import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(({ message, type = 'info', title = '', duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type, title }])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const toast = useMemo(() => ({
    success: (message, title = 'Éxito') => showToast({ message, title, type: 'success' }),
    error: (message, title = 'Error') => showToast({ message, title, type: 'error' }),
    warning: (message, title = 'Atención') => showToast({ message, title, type: 'warning' }),
    info: (message, title = 'Información') => showToast({ message, title, type: 'info' }),
  }), [showToast])

  return (
    <ToastContext.Provider value={{ toast, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  )
}

function ToastItem({ item, onDismiss }) {
  const typeStyles = {
    success: {
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      title: 'text-emerald-900',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      border: 'border-red-200',
      iconBg: 'bg-red-100 text-red-700',
      title: 'text-red-900',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      border: 'border-amber-200',
      iconBg: 'bg-amber-100 text-amber-800',
      title: 'text-amber-900',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      border: 'border-blue-200',
      iconBg: 'bg-blue-100 text-blue-700',
      title: 'text-blue-900',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  }

  const current = typeStyles[item.type] || typeStyles.info

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-lg transition-all animate-toast-in ${current.border}`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${current.iconBg}`}>
        {current.icon}
      </div>

      <div className="flex-1 pt-0.5">
        {item.title && <p className={`text-xs font-bold uppercase tracking-wider ${current.title}`}>{item.title}</p>}
        <p className="text-sm font-medium text-slate-800">{item.message}</p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Cerrar notificación"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
