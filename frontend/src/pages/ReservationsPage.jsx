import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import Badge from '../components/common/Badge'
import { formatDate } from '../data/mockData'
import { useReservations } from '../context/ReservationsContext'
import { useAuth } from '../context/AuthContext'
import { useResources } from '../context/ResourcesContext'
import {
  canCancelReservation,
  getReservationDisplayStatus,
} from '../utils/reservationRules'

export default function ReservationsPage() {
  const { user } = useAuth()
  const { reservations, cancelReservation } = useReservations()
  const { resources } = useResources()
  const [filter, setFilter] = useState('all')
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const [notice, setNotice] = useState(null)

  const myReservations = reservations
    .filter(r => r.userId === user.id)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))

  const filtered = filter === 'all'
    ? myReservations
    : myReservations.filter(r => getReservationDisplayStatus(r) === filter)

  async function handleCancel(id) {
    const notification = await cancelReservation(id)
    setNotice(notification?.ok
      ? { type: 'success', text: 'Reserva cancelada y correo enviado.' }
      : { type: 'warning', text: 'La reserva se actualizo, pero no se pudo enviar el correo.' })
    setCancelConfirm(null)
  }

  const counts = {
    all:       myReservations.length,
    confirmed: myReservations.filter(r => getReservationDisplayStatus(r) === 'confirmed').length,
    pending:   myReservations.filter(r => r.status === 'pending').length,
    completed: myReservations.filter(r => getReservationDisplayStatus(r) === 'completed').length,
    cancelled: myReservations.filter(r => r.status === 'cancelled').length,
  }

  return (
    <div>
      <TopBar title="Mis reservas" subtitle="Historial y estado de tus reservas." />

      <div className="p-6">
        {notice && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}>
            {notice.text}
          </div>
        )}
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { value: 'all',       label: `Todas (${counts.all})` },
            { value: 'confirmed', label: `Confirmadas (${counts.confirmed})` },
            { value: 'pending',   label: `Pendientes (${counts.pending})` },
            { value: 'completed', label: `Finalizadas (${counts.completed})` },
            { value: 'cancelled', label: `Canceladas (${counts.cancelled})` },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">Sin reservas en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => {
              const res = resources.find(x => x.id === r.resourceId)
              const displayStatus = getReservationDisplayStatus(r)
              const canCancel = canCancelReservation(r)
              return (
                <div
                  key={r.id}
                  className={`bg-white border rounded-xl p-4 flex items-start gap-4 transition-opacity ${
                    r.status === 'cancelled' ? 'opacity-60 border-gray-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Icono */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    res?.type === 'room' ? 'bg-blue-100' : 'bg-violet-100'
                  }`}>
                    {res?.type === 'room' ? '🏢' : '💻'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{res?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{r.title}</p>
                      </div>
                      <Badge variant={displayStatus} />
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(r.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {r.startTime} – {r.endTime}
                      </span>
                    </div>
                  </div>

                  {/* Acción cancelar */}
                  {canCancel && cancelConfirm !== r.id && (
                    <button
                      onClick={() => setCancelConfirm(r.id)}
                      className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}

                  {canCancel && cancelConfirm === r.id && (
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className="text-xs text-gray-500">¿Seguro?</span>
                      <button
                        onClick={() => handleCancel(r.id)}
                        className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors font-medium"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setCancelConfirm(null)}
                        className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
