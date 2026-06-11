import { useEffect, useRef, useState } from 'react'
import { fetchNotifications, markNotificationsRead } from '../../services/integratorApi'

const EVENT_LABELS = {
  confirmed: 'Reserva confirmada',
  cancelled: 'Reserva cancelada',
  new_reservation: 'Nueva reserva recibida',
}

function formatNotificationDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function NotificationBell() {
  const containerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadNotifications() {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      const nextNotifications = data.notifications ?? []
      setNotifications(nextNotifications)
      setError('')
      return nextNotifications
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    const handleChange = () => loadNotifications()
    const handleOutside = event => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }

    window.addEventListener('bookdesk:notifications-changed', handleChange)
    document.addEventListener('pointerdown', handleOutside)
    const intervalId = window.setInterval(loadNotifications, 20000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadNotifications()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('bookdesk:notifications-changed', handleChange)
      document.removeEventListener('pointerdown', handleOutside)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(intervalId)
    }
  }, [])

  const unread = notifications.filter(item => !item.read_at).length

  async function toggle() {
    const nextOpen = !open
    setOpen(nextOpen)
    if (!nextOpen) return

    const loaded = await loadNotifications()
    if (loaded?.some(item => !item.read_at)) {
      try {
        await markNotificationsRead()
        setNotifications(current =>
          current.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
        )
      } catch {
        // The list remains usable even if marking as read fails.
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        className="relative grid h-9 w-9 place-items-center rounded-full bg-white/70 text-[#667085] shadow-sm transition-colors hover:bg-white"
        aria-label="Abrir notificaciones"
        aria-expanded={open}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/90 bg-white/90 shadow-[0_28px_80px_rgba(35,55,95,0.22)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-black text-[#202837]">Notificaciones</p>
              <p className="text-[11px] font-semibold text-[#8a94a6]">Actividad de reservas y envios por email</p>
            </div>
            <button onClick={loadNotifications} className="rounded-lg p-2 text-[#667085] hover:bg-slate-100" aria-label="Actualizar notificaciones">
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 11a8 8 0 10-2.34 5.66M20 4v7h-7" />
              </svg>
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {error && <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
            {!error && !loading && notifications.length === 0 && (
              <div className="px-4 py-10 text-center text-xs font-semibold text-[#8a94a6]">
                Todavia no hay notificaciones.
              </div>
            )}
            {notifications.map(item => {
              const failed = item.status === 'failed'
              return (
                <article key={item.id} className={`mb-1 rounded-xl p-3 ${item.read_at ? 'bg-white/60' : 'bg-blue-50/80'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${failed ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {failed ? '!' : 'OK'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-black text-[#202837]">{EVENT_LABELS[item.event] ?? 'Notificacion'}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${failed ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          {failed ? 'Fallida' : 'Enviada'}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[11px] font-semibold text-[#7a8496]">
                        {item.event === 'new_reservation'
                          ? `${item.actor_name || 'Un miembro'} reservo ${item.resource_name || 'un recurso'}`
                          : item.resource_name || item.recipient_email}
                      </p>
                      {item.reservation_date && (
                        <p className="mt-0.5 text-[10px] font-semibold text-[#8a94a6]">
                          {item.reservation_date} | {item.reservation_start_time}-{item.reservation_end_time}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] font-semibold text-[#a0a7b5]">{formatNotificationDate(item.created_at)}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
