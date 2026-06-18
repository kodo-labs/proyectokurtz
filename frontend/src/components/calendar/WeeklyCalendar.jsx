import { WEEK_DAYS, TIME_SLOTS, isSlotOccupied, getSlotReservation, formatShortDate } from '../../data/mockData'
import { useAuth } from '../../context/AuthContext'

/**
 * Calendario semanal de disponibilidad para un recurso dado.
 *
 * Props:
 *  - resourceId: string
 *  - reservations: array
 *  - onSlotClick: (date, startTime) => void  (opcional, solo si se puede reservar)
 *  - selectedSlots: [{ date, startTime }]     (slots seleccionados en el flujo de booking)
 */
export default function WeeklyCalendar({ resourceId, reservations, onSlotClick, selectedSlots = [] }) {
  const { user } = useAuth()

  function getSlotStyle(date, time) {
    const reservation = getSlotReservation(reservations, resourceId, date, time)

    if (!reservation) return 'available'
    if (reservation.isBlocked) return 'blocked'
    if (reservation.userId === user?.id) return 'mine'
    return 'occupied'
  }

  function isSelected(date, time) {
    return selectedSlots.some(s => s.date === date && s.startTime === time)
  }

  const SLOT_STYLES = {
    available: 'bg-green-100 hover:bg-green-200 border-green-200 text-green-700 cursor-pointer',
    occupied:  'bg-red-100 border-red-200 text-red-600 cursor-not-allowed',
    blocked:   'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed',
    mine:      'bg-blue-100 border-blue-200 text-blue-700 cursor-pointer',
    selected:  'bg-brand-600 border-brand-700 text-white cursor-pointer',
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Header: días */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-gray-200 rounded-t-lg overflow-hidden">
          <div className="bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-500 text-center">Hora</div>
          {WEEK_DAYS.map(day => (
            <div key={day.date} className="bg-gray-50 px-2 py-2 text-center">
              <p className="text-xs font-bold text-gray-700">{day.label}</p>
              <p className="text-xs text-gray-400">{formatShortDate(day.date)}</p>
            </div>
          ))}
        </div>

        {/* Cuerpo: filas de horas */}
        <div className="border border-gray-200 rounded-b-lg overflow-hidden">
          {TIME_SLOTS.slice(0, -1).map((time, idx) => (
            <div
              key={time}
              className={`grid grid-cols-[80px_repeat(5,1fr)] gap-px bg-gray-100 ${
                idx !== TIME_SLOTS.length - 2 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* Hora */}
              <div className="bg-white px-2 py-1.5 text-xs text-gray-500 font-medium flex items-center justify-center">
                {time}
              </div>

              {/* Celdas por día */}
              {WEEK_DAYS.map(day => {
                const style = getSlotStyle(day.date, time)
                const selected = isSelected(day.date, time)
                const reservation = getSlotReservation(reservations, resourceId, day.date, time)
                const clickable = (style === 'available' || style === 'mine') && onSlotClick
                const appliedStyle = selected ? SLOT_STYLES.selected : SLOT_STYLES[style]

                return (
                  <div
                    key={day.date}
                    className={`bg-white px-1.5 py-1.5 text-xs border ${appliedStyle} transition-colors min-h-[40px] flex items-center justify-center`}
                    onClick={() => clickable && onSlotClick(day.date, time)}
                    title={reservation?.title ?? (style === 'available' ? 'Disponible — click para reservar' : '')}
                  >
                    {selected && (
                      <span className="font-medium truncate">Seleccionado</span>
                    )}
                    {!selected && reservation && (
                      <span className="truncate text-center leading-tight">
                        {reservation.isBlocked ? '🔒' : style === 'mine' ? '✓ Yo' : '✗'}
                      </span>
                    )}
                    {!selected && !reservation && (
                      <span className="text-green-500 text-base">·</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-200 border border-green-300" />
            Disponible
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-200 border border-red-300" />
            Ocupado
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-200 border border-blue-300" />
            Mi reserva
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300" />
            Bloqueado
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-brand-600 border border-brand-700" />
            Seleccionado
          </div>
        </div>
      </div>
    </div>
  )
}
