import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = ++_id
      setToasts((prev) => [...prev, { id, message, type }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

// ─── Toast container ──────────────────────────────────────────────────────────

const TYPE_STYLES = {
  success: { bar: 'bg-green-500',  icon: 'text-green-400',  bg: 'border-green-500/20' },
  error:   { bar: 'bg-red-500',    icon: 'text-red-400',    bg: 'border-red-500/20'   },
  info:    { bar: 'bg-blue-500',   icon: 'text-blue-400',   bg: 'border-blue-500/20'  },
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  )
}

const ICONS = { success: <CheckIcon />, error: <XCircleIcon />, info: <InfoIcon /> }

function ToastItem({ toast, dismiss }) {
  const s = TYPE_STYLES[toast.type] ?? TYPE_STYLES.info
  return (
    <div
      className={`relative flex items-start gap-3 bg-[#1f1f1f] border ${s.bg} rounded-lg px-4 py-3 shadow-xl min-w-[260px] max-w-sm overflow-hidden`}
    >
      {/* Colored left bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-lg`} />

      <span className={`mt-0.5 ${s.icon}`}>{ICONS[toast.type]}</span>

      <p className="flex-1 text-sm text-gray-200 leading-snug pr-4">{toast.message}</p>

      <button
        onClick={() => dismiss(toast.id)}
        className="absolute top-2.5 right-2.5 text-gray-600 hover:text-gray-300 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} dismiss={dismiss} />
      ))}
    </div>
  )
}
