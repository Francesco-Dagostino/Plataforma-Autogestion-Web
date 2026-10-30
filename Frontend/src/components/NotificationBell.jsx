import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../features/admin/adminService'

const POLL_INTERVAL_MS = 30000
const HINT_DURATION_MS = 8000

function timeAgo(value) {
  const minutes = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} d`
}

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`

// Campana de avisos del Admin: muestra cuántos hay sin leer, los lista y avisa con una etiqueta bajo la campana cuando llegan nuevos.
export function NotificationBell({ onNew }) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState({ unreadCount: 0, items: [] })
  const [open, setOpen] = useState(false)
  // Etiqueta que anuncia avisos nuevos debajo de la campana (un toast taparia el propio botón).
  const [hint, setHint] = useState(null)
  const hintTimer = useRef(null)
  const rootRef = useRef(null)
  const previousUnread = useRef(null)
  const onNewRef = useRef(onNew)

  useEffect(() => { onNewRef.current = onNew }, [onNew])
  useEffect(() => () => window.clearTimeout(hintTimer.current), [])

  useEffect(() => {
    let cancelled = false

    function showHint(next) {
      setHint(next)
      window.clearTimeout(hintTimer.current)
      hintTimer.current = window.setTimeout(() => setHint(null), HINT_DURATION_MS)
    }

    async function poll() {
      try {
        const result = await getNotifications()
        if (cancelled || !result) return

        const previous = previousUnread.current
        previousUnread.current = result.unreadCount
        setData(result)

        if (previous === null && result.unreadCount > 0) {
          showHint({ title: `Tenés ${plural(result.unreadCount, 'aviso sin leer', 'avisos sin leer')}` })
        } else if (previous !== null && result.unreadCount > previous) {
          const latest = result.items.find((item) => !item.isRead)
          showHint({ title: `Tenés ${plural(result.unreadCount - previous, 'aviso nuevo', 'avisos nuevos')}`, detail: latest?.message })
          onNewRef.current?.()
        }
      } catch {
        // Un fallo puntual de red no debe molestar al Admin: se reintenta en el próximo ciclo.
      }
    }

    poll()
    const timer = window.setInterval(poll, POLL_INTERVAL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') poll() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function openItem(item) {
    setOpen(false)
    if (!item.isRead) {
      setData((current) => ({
        unreadCount: Math.max(0, current.unreadCount - 1),
        items: current.items.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)),
      }))
      previousUnread.current = Math.max(0, (previousUnread.current ?? 1) - 1)
      markNotificationRead(item.id).catch(() => {})
    }
    if (location.pathname !== '/admin') navigate('/admin')
    else onNewRef.current?.()
  }

  async function markAll() {
    setData((current) => ({ unreadCount: 0, items: current.items.map((entry) => ({ ...entry, isRead: true })) }))
    previousUnread.current = 0
    try {
      await markAllNotificationsRead()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const unread = data.unreadCount

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => { setHint(null); setOpen((value) => !value) }}
        aria-label={unread ? `Avisos, ${plural(unread, 'sin leer', 'sin leer')}` : 'Avisos'}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative grid size-10 place-items-center rounded-xl border border-slate-300 text-slate-700 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-5 text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <div className="sr-only" role="status" aria-live="polite">{hint ? `${hint.title}. ${hint.detail ?? ''}` : ''}</div>

      {hint && !open && (
        <button type="button" onClick={() => { setHint(null); setOpen(true) }} className="absolute right-0 top-12 z-30 w-max max-w-[min(20rem,calc(100vw-2.5rem))] rounded-xl bg-[#102848] px-3.5 py-2.5 text-left text-white shadow-lg transition hover:bg-[#17375f] focus:outline-none focus:ring-2 focus:ring-emerald-300">
          <span className="block text-sm font-semibold">{hint.title}</span>
          {hint.detail && <span className="mt-0.5 block text-xs text-slate-300">{hint.detail}</span>}
        </button>
      )}

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Avisos</p>
            <button type="button" onClick={markAll} disabled={unread === 0} className="text-xs font-semibold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">
              Marcar todos como leídos
            </button>
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {data.items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-400">Todavía no hay avisos.</li>}
            {data.items.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => openItem(item)} className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-slate-50 ${item.isRead ? '' : 'bg-emerald-50/60'}`}>
                  <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-emerald-500'}`} />
                  <span className="min-w-0">
                    <span className={`block text-sm ${item.isRead ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>{item.message}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
