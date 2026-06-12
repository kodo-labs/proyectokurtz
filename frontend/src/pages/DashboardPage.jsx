import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Badge from '../components/common/Badge'
import { formatDate } from '../data/mockData'
import { useReservations } from '../context/ReservationsContext'
import { useAuth } from '../context/AuthContext'
import { useResources } from '../context/ResourcesContext'
import {
  getReservationDisplayStatus,
  reservationHasEnded,
} from '../utils/reservationRules'

function MiniMetric({ label, value, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    green: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-[0_18px_45px_rgba(35,55,95,0.08)] backdrop-blur">
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <p className="text-3xl font-black text-[#202837]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8a94a6]">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { reservations } = useReservations()
  const { resources } = useResources()
  const navigate = useNavigate()

  const myReservations = useMemo(
    () => reservations.filter(r => r.userId === user.id && !r.isBlocked),
    [reservations, user.id]
  )

  const upcoming = myReservations
    .filter(r => r.status !== 'cancelled' && !reservationHasEnded(r))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))

  const next = upcoming[0]
  const nextResource = resources.find(r => r.id === next?.resourceId)
  const recent = myReservations
    .slice()
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
    .slice(0, 3)

  return (
    <div>
      <TopBar
        title={`Buen dia, ${user.name.split(' ')[0]}`}
        subtitle="Tu espacio de trabajo listo para reservar."
        action={
          <button
            onClick={() => navigate('/booking')}
            className="hidden rounded-full bg-[#2563eb] px-4 py-2 text-xs font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition-transform hover:-translate-y-0.5 sm:block"
          >
            Reservar
          </button>
        }
      />

      <div className="p-4 md:p-8">
        <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-[0_26px_70px_rgba(35,55,95,0.10)] backdrop-blur md:p-8">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-bl-[70px] bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(168,85,247,0.16))]" />
            <div className="relative max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563eb]">Miembro</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-[#202837] md:text-4xl">
                {next ? 'Tu proxima reserva esta lista.' : 'Agenda tu proximo espacio.'}
              </h2>
              <p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-[#667085]">
                {next
                  ? `${nextResource?.name ?? 'Tu recurso'} te espera el ${formatDate(next.date)} desde ${next.startTime}.`
                  : 'Reserva salas y escritorios disponibles sin cruces de agenda.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/booking')}
                  className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-black text-white shadow-[0_16px_32px_rgba(37,99,235,0.28)] transition-transform hover:-translate-y-0.5"
                >
                  Nueva reserva
                </button>
                <button
                  onClick={() => navigate('/reservations')}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-black text-[#202837] shadow-sm transition-colors hover:bg-slate-50"
                >
                  Ver mis reservas
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/70 p-5 shadow-[0_22px_60px_rgba(35,55,95,0.09)] backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a94a6]">Espacios</p>
            <div className="mt-5 rounded-2xl bg-[linear-gradient(135deg,#f7faff,#f4edff)] p-5">
              <p className="text-sm font-black text-[#202837]">Disponibles para reservar</p>
              <p className="mt-2 text-3xl font-black text-[#111827]">{resources.length}</p>
              <p className="mt-1 text-xs font-semibold text-[#7a8496]">Salas y escritorios activos</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <MiniMetric label="Reservas activas" value={upcoming.length} />
              <MiniMetric label="Reservas totales" value={myReservations.length} tone="violet" />
              <MiniMetric label="Finalizadas" value={myReservations.filter(r => getReservationDisplayStatus(r) === 'completed').length} tone="green" />
            </div>

            <div className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-[#202837]">Proximas reservas</h2>
                <button onClick={() => navigate('/reservations')} className="text-xs font-black text-[#2563eb]">Ver todas</button>
              </div>
              <div className="grid gap-3">
                {upcoming.slice(0, 3).map(r => {
                  const resource = resources.find(item => item.id === r.resourceId)
                  return (
                    <div key={r.id} className="flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-sm">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-[#2563eb]">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
                          <path d="M9 7h1M14 7h1M9 11h1M14 11h1" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#202837]">{resource?.name}</p>
                        <p className="mt-1 text-xs font-semibold text-[#7a8496]">{formatDate(r.date)} | {r.startTime}-{r.endTime}</p>
                      </div>
                      <Badge variant={getReservationDisplayStatus(r)} />
                    </div>
                  )
                })}
                {!upcoming.length && (
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
                    <p className="text-sm font-black text-[#202837]">Todavia no tenes reservas activas.</p>
                    <button onClick={() => navigate('/booking')} className="mt-3 text-xs font-black text-[#2563eb]">Crear una ahora</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
            <h2 className="text-lg font-black text-[#202837]">Actividad reciente</h2>
            <div className="mt-5 space-y-4">
              {recent.map(r => {
                const resource = resources.find(item => item.id === r.resourceId)
                return (
                  <div key={r.id} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#202837]">{resource?.name}</p>
                      <p className="text-xs font-semibold text-[#8a94a6]">{r.title}</p>
                    </div>
                    <Badge variant={getReservationDisplayStatus(r)} />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <button
          onClick={() => navigate('/booking')}
          className="fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-[#2563eb] text-white shadow-[0_18px_35px_rgba(37,99,235,0.34)] transition-transform hover:-translate-y-1 md:hidden"
          aria-label="Nueva reserva"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  )
}
