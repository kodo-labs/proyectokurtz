import { useEffect, useMemo, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/common/Badge'
import { useReservations } from '../../context/ReservationsContext'
import { useResources } from '../../context/ResourcesContext'
import { fetchProfiles } from '../../services/bookdeskRepository'
import { formatDate } from '../../data/mockData'

const PAGE_SIZE = 8

function ReservationDetail({ reservation, resource, profile, onClose, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-lg rounded-[24px] border border-white/90 bg-white/92 p-6 shadow-[0_30px_90px_rgba(35,55,95,0.25)] backdrop-blur-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#2563eb]">Detalle de reserva</p>
            <h2 className="mt-2 text-2xl font-black text-[#202837]">{resource?.name ?? 'Recurso'}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#667085] hover:bg-slate-100" aria-label="Cerrar detalle">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f1f3fe] p-4">
            <p className="text-[10px] font-black uppercase text-[#8a94a6]">Miembro</p>
            <p className="mt-1 text-sm font-black text-[#202837]">{profile?.name ?? 'Perfil no disponible'}</p>
            <p className="mt-0.5 break-all text-xs font-semibold text-[#667085]">{profile?.email ?? reservation.userId}</p>
          </div>
          <div className="rounded-xl bg-[#f1f3fe] p-4">
            <p className="text-[10px] font-black uppercase text-[#8a94a6]">Estado</p>
            <div className="mt-2"><Badge variant={reservation.status} /></div>
          </div>
          <div className="rounded-xl bg-[#f1f3fe] p-4">
            <p className="text-[10px] font-black uppercase text-[#8a94a6]">Fecha</p>
            <p className="mt-1 text-sm font-black text-[#202837]">{formatDate(reservation.date)}</p>
          </div>
          <div className="rounded-xl bg-[#f1f3fe] p-4">
            <p className="text-[10px] font-black uppercase text-[#8a94a6]">Horario</p>
            <p className="mt-1 text-sm font-black text-[#202837]">{reservation.startTime}-{reservation.endTime}</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-[#f7f8fd] p-4">
          <p className="text-[10px] font-black uppercase text-[#8a94a6]">Motivo</p>
          <p className="mt-1 text-sm font-semibold text-[#414755]">{reservation.title || 'Reserva de espacio'}</p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          {reservation.status !== 'cancelled' && (
            <button onClick={() => onCancel(reservation.id)} className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-black text-red-600 hover:bg-red-100">
              Cancelar reserva
            </button>
          )}
          <button onClick={onClose} className="rounded-xl bg-[#0070eb] px-4 py-2.5 text-xs font-black text-white">
            Cerrar
          </button>
        </div>
      </section>
    </div>
  )
}

export default function AdminReservationsPage() {
  const { reservations, cancelReservation } = useReservations()
  const { resources } = useResources()
  const [profiles, setProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    fetchProfiles().then(setProfiles).catch(() => setProfiles([]))
  }, [])

  const profilesById = useMemo(
    () => new Map(profiles.map(profile => [String(profile.id), profile])),
    [profiles]
  )
  const resourcesById = useMemo(
    () => new Map(resources.map(resource => [resource.id, resource])),
    [resources]
  )

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return reservations
      .filter(reservation => !reservation.isBlocked)
      .filter(reservation => {
        const profile = profilesById.get(String(reservation.userId))
        const resource = resourcesById.get(reservation.resourceId)
        if (status && reservation.status !== status) return false
        if (resourceId && reservation.resourceId !== resourceId) return false
        if (from && reservation.date < from) return false
        if (to && reservation.date > to) return false
        if (normalizedSearch) {
          const searchable = [
            reservation.id,
            reservation.title,
            profile?.name,
            profile?.email,
            resource?.name,
          ].join(' ').toLowerCase()
          if (!searchable.includes(normalizedSearch)) return false
        }
        return true
      })
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
  }, [reservations, profilesById, resourcesById, search, status, resourceId, from, to])

  useEffect(() => setPage(1), [search, status, resourceId, from, to])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleCancel(id) {
    const notification = await cancelReservation(id)
    setNotice(notification?.ok
      ? { type: 'success', text: 'Reserva cancelada y miembro notificado por email.' }
      : { type: 'warning', text: 'Reserva cancelada, pero el correo al miembro no pudo enviarse.' })
    setSelected(current => current?.id === id ? { ...current, status: 'cancelled' } : current)
  }

  function clearFilters() {
    setSearch('')
    setStatus('')
    setResourceId('')
    setFrom('')
    setTo('')
  }

  return (
    <div>
      <TopBar title="Reservas" subtitle="Consulta y administra todas las reservas del coworking." />

      <div className="p-4 md:p-8">
        {notice && (
          <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}>
            {notice.text}
          </div>
        )}

        <section className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-[0_26px_70px_rgba(35,55,95,0.10)] backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-[#2563eb]">Gestion</p>
              <h2 className="mt-2 text-3xl font-black text-[#202837]">Todas las reservas en un solo lugar.</h2>
              <p className="mt-2 text-sm font-semibold text-[#667085]">{filtered.length} reservas coinciden con los filtros.</p>
            </div>
            <button onClick={clearFilters} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-[#667085] hover:bg-slate-200">
              Limpiar filtros
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="xl:col-span-2">
              <span className="text-[10px] font-black uppercase text-[#8a94a6]">Buscar</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white bg-white/90 px-3 py-2.5">
                <svg className="h-4 w-4 text-[#8a94a6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
                </svg>
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Miembro, email, recurso o motivo" className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none" />
              </div>
            </label>
            <label>
              <span className="text-[10px] font-black uppercase text-[#8a94a6]">Estado</span>
              <select value={status} onChange={event => setStatus(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-3 py-2.5 text-xs font-bold outline-none">
                <option value="">Todos</option>
                <option value="confirmed">Confirmadas</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </label>
            <label>
              <span className="text-[10px] font-black uppercase text-[#8a94a6]">Recurso</span>
              <select value={resourceId} onChange={event => setResourceId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-3 py-2.5 text-xs font-bold outline-none">
                <option value="">Todos</option>
                {resources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="text-[10px] font-black uppercase text-[#8a94a6]">Desde</span>
                <input type="date" value={from} onChange={event => setFrom(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-2 py-2.5 text-[10px] font-bold outline-none" />
              </label>
              <label>
                <span className="text-[10px] font-black uppercase text-[#8a94a6]">Hasta</span>
                <input type="date" value={to} onChange={event => setTo(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-2 py-2.5 text-[10px] font-bold outline-none" />
              </label>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-white/80 bg-white/72 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-xs">
              <thead className="bg-[#f1f3fe] text-[#667085]">
                <tr>
                  {['Miembro', 'Recurso', 'Fecha', 'Horario', 'Motivo', 'Estado', 'Acciones'].map(label => (
                    <th key={label} className="px-4 py-3 font-black uppercase">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map(reservation => {
                  const profile = profilesById.get(String(reservation.userId))
                  const resource = resourcesById.get(reservation.resourceId)
                  return (
                    <tr key={reservation.id} className="border-t border-slate-100 font-semibold text-[#414755]">
                      <td className="px-4 py-3">
                        <p className="font-black text-[#202837]">{profile?.name ?? 'Perfil no disponible'}</p>
                        <p className="mt-0.5 text-[10px] text-[#8a94a6]">{profile?.email ?? reservation.userId}</p>
                      </td>
                      <td className="px-4 py-3 font-black text-[#202837]">{resource?.name ?? reservation.resourceId}</td>
                      <td className="px-4 py-3">{formatDate(reservation.date)}</td>
                      <td className="px-4 py-3">{reservation.startTime}-{reservation.endTime}</td>
                      <td className="max-w-[180px] truncate px-4 py-3">{reservation.title}</td>
                      <td className="px-4 py-3"><Badge variant={reservation.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setSelected(reservation)} className="rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-black text-[#2563eb] hover:bg-blue-100">
                            Ver detalle
                          </button>
                          {reservation.status !== 'cancelled' && (
                            <button onClick={() => handleCancel(reservation.id)} className="rounded-lg bg-red-50 px-3 py-2 text-[10px] font-black text-red-600 hover:bg-red-100">
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {currentRows.length === 0 && (
            <div className="px-4 py-16 text-center text-sm font-semibold text-[#8a94a6]">No hay reservas para mostrar.</div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <p className="text-xs font-semibold text-[#8a94a6]">Pagina {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(current => current - 1)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-[#667085] disabled:opacity-40">Anterior</button>
              <button disabled={page === totalPages} onClick={() => setPage(current => current + 1)} className="rounded-lg bg-[#0070eb] px-3 py-2 text-xs font-black text-white disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        </section>
      </div>

      {selected && (
        <ReservationDetail
          reservation={selected}
          resource={resourcesById.get(selected.resourceId)}
          profile={profilesById.get(String(selected.userId))}
          onClose={() => setSelected(null)}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
