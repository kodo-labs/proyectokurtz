import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import ResourceCard from '../components/booking/ResourceCard'
import WeeklyCalendar from '../components/calendar/WeeklyCalendar'
import BookingModal from '../components/booking/BookingModal'
import { useReservations } from '../context/ReservationsContext'
import { useAuth } from '../context/AuthContext'
import { useResources } from '../context/ResourcesContext'

const STEPS = ['Recurso', 'Horario', 'Confirmar']

export default function BookingPage() {
  const { user } = useAuth()
  const { reservations, addReservation } = useReservations()
  const { resources } = useResources()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [resourceType, setResourceType] = useState('all')
  const [selectedResourceId, setSelectedResourceId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedStart, setSelectedStart] = useState(null)
  const [selectedEnd, setSelectedEnd] = useState(null)
  const [duration, setDuration] = useState(1.0)
  const [showModal, setShowModal] = useState(false)
  const [success, setSuccess] = useState(null)

  const resource = resources.find(r => r.id === selectedResourceId)

  const filteredResources = resourceType === 'all'
    ? resources
    : resources.filter(r => r.type === resourceType)

  const DURATION_OPTIONS = []
  for (let d = 0.5; d <= 8; d += 0.25) {
    const hours = Math.floor(d)
    const mins = Math.round((d - hours) * 60)
    let label
    if (hours === 0) label = `${mins} min`
    else if (mins === 0) label = `${hours}h`
    else label = `${hours}h ${mins}min`
    DURATION_OPTIONS.push({ value: d, label })
  }

  function calcEndTime(startTime, dur) {
    const [h, m] = startTime.split(':').map(Number)
    const totalMin = h * 60 + m + dur * 60
    const endH = Math.floor(totalMin / 60)
    const endM = totalMin % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  function handleSlotClick(date, startTime) {
    setSelectedDate(date)
    setSelectedStart(startTime)
    setSelectedEnd(calcEndTime(startTime, duration))
  }

  function handleDurationChange(newDur) {
    setDuration(newDur)
    if (selectedStart) {
      setSelectedEnd(calcEndTime(selectedStart, newDur))
    }
  }

  async function handleConfirm(title) {
    const res = await addReservation({
      resourceId: selectedResourceId,
      userId: user.id,
      date: selectedDate,
      startTime: selectedStart,
      endTime: selectedEnd,
      title: title || 'Reserva',
    })
    setShowModal(false)
    setSuccess(res)
  }

  function reset() {
    setStep(0)
    setSelectedResourceId(null)
    setSelectedDate(null)
    setSelectedStart(null)
    setSelectedEnd(null)
    setSuccess(null)
  }

  if (success) {
    return (
      <div>
        <TopBar title="Nueva reserva" />
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva confirmada!</h2>
            <p className="text-gray-500 mb-1">
              <span className="font-semibold text-gray-700">{resource?.name}</span>
            </p>
            <p className="text-gray-500 mb-6">
              {success.date.slice(8)}/04 · {success.startTime}–{success.endTime}
            </p>
            <div className={`mb-6 rounded-lg border px-4 py-3 text-left text-sm ${
              success.notification?.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              <p className="mb-1 font-semibold">
                {success.notification?.ok ? 'Correo de confirmacion enviado' : 'Reserva guardada'}
              </p>
              <p className="text-xs">
                {success.notification?.ok
                  ? 'La confirmacion fue enviada al correo asociado a tu cuenta.'
                  : success.notification?.skipped
                    ? 'Las notificaciones por email no estan disponibles en el modo demo.'
                    : 'La reserva se actualizo, pero no se pudo enviar el correo.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Nueva reserva
              </button>
              <button
                onClick={() => navigate('/reservations')}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
              >
                Ver mis reservas
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="Nueva reserva" subtitle="Seguí los pasos para reservar un espacio." />

      {/* Steps */}
      <div className="px-6 pt-5">
        <div className="flex items-center gap-0 max-w-lg">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'bg-brand-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-sm font-medium ${
                  i === step ? 'text-brand-700' : i < step ? 'text-green-600' : 'text-gray-400'
                }`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6">

        {/* Paso 1: Elegir recurso */}
        {step === 0 && (
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">¿Qué espacio necesitás?</h2>
            <p className="text-sm text-gray-500 mb-4">Elegí una sala de reuniones o un escritorio.</p>

            <div className="flex gap-2 mb-4">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'room', label: '🏢 Salas' },
                { value: 'desk', label: '💻 Escritorios' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setResourceType(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    resourceType === f.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredResources.map(r => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  selected={selectedResourceId === r.id}
                  onClick={() => setSelectedResourceId(r.id)}
                />
              ))}
            </div>

            <button
              disabled={!selectedResourceId}
              onClick={() => setStep(1)}
              className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Paso 2: Elegir horario */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setStep(0)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Volver
              </button>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {resource?.name} — Elegí un horario
                </h2>
                <p className="text-sm text-gray-500">Hacé click en un slot verde disponible.</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración de la reserva</label>
              <select
                value={duration}
                onChange={e => handleDurationChange(parseFloat(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
              >
                {DURATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
              <WeeklyCalendar
                resourceId={selectedResourceId}
                reservations={reservations}
                onSlotClick={handleSlotClick}
                selectedSlots={selectedDate && selectedStart ? [{ date: selectedDate, startTime: selectedStart }] : []}
              />
            </div>

            {selectedDate && selectedStart && (
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm text-brand-800">
                  Seleccionaste: <strong>{selectedDate.slice(8)}/04</strong> de <strong>{selectedStart}</strong> a <strong>{selectedEnd}</strong> ({DURATION_OPTIONS.find(o => o.value === duration)?.label})
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Confirmar →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <BookingModal
          resource={resource}
          date={selectedDate}
          startTime={selectedStart}
          endTime={selectedEnd}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
