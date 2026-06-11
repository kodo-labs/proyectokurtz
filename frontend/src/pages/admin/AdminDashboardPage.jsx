import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/common/Badge'
import WeeklyCalendar from '../../components/calendar/WeeklyCalendar'
import { formatDate } from '../../data/mockData'
import { useReservations } from '../../context/ReservationsContext'
import { useResources } from '../../context/ResourcesContext'
import { fetchProfiles } from '../../services/bookdeskRepository'

function AdminMetric({ label, value, detail, tone = 'blue' }) {
  const tones = {
    blue: 'from-blue-50 to-white text-blue-700',
    green: 'from-emerald-50 to-white text-emerald-700',
    amber: 'from-amber-50 to-white text-amber-700',
    violet: 'from-violet-50 to-white text-violet-700',
  }

  return (
    <div className={`rounded-2xl border border-white/80 bg-gradient-to-br ${tones[tone]} p-5 shadow-[0_18px_45px_rgba(35,55,95,0.08)]`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#202837]">{value}</p>
      {detail && <p className="mt-1 text-xs font-bold opacity-70">{detail}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { reservations, cancelReservation, blockSlot } = useReservations()
  const { resources } = useResources()
  const [selectedResource, setSelectedResource] = useState(resources[0]?.id ?? '')
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [blockDate, setBlockDate] = useState('2026-04-07')
  const [blockStart, setBlockStart] = useState('08:00')
  const [blockEnd, setBlockEnd] = useState('18:00')
  const [blockSuccess, setBlockSuccess] = useState(false)
  const [notificationNotice, setNotificationNotice] = useState(null)
  const [profiles, setProfiles] = useState([])

  const stats = useMemo(() => {
    const realReservations = reservations.filter(r => !r.isBlocked)
    return {
      confirmed: realReservations.filter(r => r.status === 'confirmed').length,
      pending: realReservations.filter(r => r.status === 'pending').length,
      cancelled: realReservations.filter(r => r.status === 'cancelled').length,
      blocked: reservations.filter(r => r.isBlocked).length,
    }
  }, [reservations])

  useEffect(() => {
    if (!selectedResource && resources[0]) {
      setSelectedResource(resources[0].id)
    }
  }, [resources, selectedResource])

  useEffect(() => {
    fetchProfiles().then(setProfiles).catch(() => setProfiles([]))
  }, [])

  const recent = reservations
    .filter(r => !r.isBlocked)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
    .slice(0, 6)

  function getUserName(userId) {
    return profiles.find(profile => String(profile.id) === String(userId))?.name ?? 'Perfil no disponible'
  }

  async function handleBlock() {
    await blockSlot(selectedResource, blockDate, blockStart, blockEnd)
    setShowBlockForm(false)
    setBlockSuccess(true)
    setTimeout(() => setBlockSuccess(false), 3000)
  }

  async function handleCancelReservation(id) {
    const notification = await cancelReservation(id)
    setNotificationNotice(notification?.ok
      ? { type: 'success', text: 'Reserva cancelada y correo enviado al miembro.' }
      : { type: 'warning', text: 'La reserva se actualizo, pero no se pudo enviar el correo.' })
  }

  return (
    <div>
      <TopBar
        title="Panel administrador"
        subtitle="Control de reservas, recursos y ocupacion."
        action={
          <button
            onClick={() => setShowBlockForm(true)}
            className="hidden rounded-full bg-[#2563eb] px-4 py-2 text-xs font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition-transform hover:-translate-y-0.5 sm:block"
          >
            Bloquear horario
          </button>
        }
      />

      <div className="p-4 md:p-8">
        {notificationNotice && (
          <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
            notificationNotice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}>
            {notificationNotice.text}
          </div>
        )}
        <section className="grid gap-5 xl:grid-cols-[1fr_330px]">
          <div className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-[0_26px_70px_rgba(35,55,95,0.10)] backdrop-blur md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563eb]">Operacion</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-normal text-[#202837] md:text-4xl">
              Vista general del coworking para tomar decisiones rapido.
            </h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetric label="Confirmadas" value={stats.confirmed} detail="reservas activas" tone="green" />
              <AdminMetric label="Pendientes" value={stats.pending} detail="requieren seguimiento" tone="amber" />
              <AdminMetric label="Canceladas" value={stats.cancelled} detail="historial" />
              <AdminMetric label="Bloqueos" value={stats.blocked} detail="mantenimiento" tone="violet" />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
            <h2 className="text-lg font-black text-[#202837]">Actividad reciente</h2>
            <div className="mt-5 space-y-4">
              {recent.map(r => {
                const resource = resources.find(item => item.id === r.resourceId)
                return (
                  <div key={r.id} className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#2563eb]">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#202837]">{resource?.name}</p>
                      <p className="truncate text-xs font-semibold text-[#8a94a6]">{getUserName(r.userId)} | {formatDate(r.date)}</p>
                    </div>
                    <Badge variant={r.status} />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
          <div className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#202837]">Calendario semanal</h2>
                <p className="text-xs font-semibold text-[#8a94a6]">Ocupacion por recurso.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedResource}
                  onChange={e => setSelectedResource(e.target.value)}
                  className="rounded-xl border border-white bg-white/80 px-3 py-2 text-xs font-bold text-[#202837] shadow-sm outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowBlockForm(!showBlockForm)}
                  className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition-colors hover:bg-amber-100"
                >
                  Bloquear
                </button>
              </div>
            </div>

            {blockSuccess && (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                Horario bloqueado exitosamente.
              </div>
            )}

            {showBlockForm && (
              <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                <p className="mb-3 text-sm font-black text-amber-800">Bloquear {resources.find(r => r.id === selectedResource)?.name}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <select value={blockDate} onChange={e => setBlockDate(e.target.value)} className="rounded-xl border border-amber-100 bg-white px-3 py-2 text-xs font-bold">
                    <option value="2026-04-07">Lun 07/04</option>
                    <option value="2026-04-08">Mar 08/04</option>
                    <option value="2026-04-09">Mie 09/04</option>
                    <option value="2026-04-10">Jue 10/04</option>
                    <option value="2026-04-11">Vie 11/04</option>
                  </select>
                  <select value={blockStart} onChange={e => setBlockStart(e.target.value)} className="rounded-xl border border-amber-100 bg-white px-3 py-2 text-xs font-bold">
                    {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={blockEnd} onChange={e => setBlockEnd(e.target.value)} className="rounded-xl border border-amber-100 bg-white px-3 py-2 text-xs font-bold">
                    {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={handleBlock} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white">Confirmar bloqueo</button>
                  <button onClick={() => setShowBlockForm(false)} className="rounded-xl bg-white px-4 py-2 text-xs font-black text-[#667085]">Cancelar</button>
                </div>
              </div>
            )}

            <WeeklyCalendar resourceId={selectedResource} reservations={reservations} />
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#202837]">Reservas</h2>
              <Link to="/admin/reservations" className="rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-black text-[#2563eb] hover:bg-blue-100">
                Ver todas
              </Link>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl bg-white/80">
              <div className="max-h-[560px] overflow-y-auto">
                {reservations
                  .filter(r => !r.isBlocked)
                  .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
                  .map(r => {
                    const resource = resources.find(item => item.id === r.resourceId)
                    return (
                      <div key={r.id} className="border-b border-slate-100 p-4 last:border-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#202837]">{resource?.name}</p>
                            <p className="mt-1 text-xs font-semibold text-[#7a8496]">{getUserName(r.userId)} | {r.startTime}-{r.endTime}</p>
                          </div>
                          <Badge variant={r.status} />
                        </div>
                        {r.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelReservation(r.id)}
                            className="mt-3 text-xs font-black text-red-500 transition-colors hover:text-red-700"
                          >
                            Cancelar reserva
                          </button>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
