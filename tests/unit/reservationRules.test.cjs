let getSlotReservation
let getReservationDisplayStatus
let canCancelReservation
let isSlotOccupied
let isValidReservationRange
let parseTimeToMinutes
let reservationHasEnded

beforeAll(async () => {
  const rules = await import('../../frontend/src/utils/reservationRules.js')
  getSlotReservation = rules.getSlotReservation
  getReservationDisplayStatus = rules.getReservationDisplayStatus
  canCancelReservation = rules.canCancelReservation
  isSlotOccupied = rules.isSlotOccupied
  isValidReservationRange = rules.isValidReservationRange
  parseTimeToMinutes = rules.parseTimeToMinutes
  reservationHasEnded = rules.reservationHasEnded
})

const reservations = [
  {
    id: 'r-confirmed',
    resourceId: 'sala-alpha',
    date: '2026-04-07',
    startTime: '09:00',
    endTime: '11:00',
    status: 'confirmed',
    title: 'Reunion de equipo',
  },
  {
    id: 'r-cancelled',
    resourceId: 'sala-alpha',
    date: '2026-04-07',
    startTime: '12:00',
    endTime: '13:00',
    status: 'cancelled',
    title: 'Reserva cancelada',
  },
  {
    id: 'r-other-resource',
    resourceId: 'sala-beta',
    date: '2026-04-07',
    startTime: '09:00',
    endTime: '10:00',
    status: 'confirmed',
    title: 'Otra sala',
  },
]

describe('reservationRules', () => {
  it('detecta como ocupado un horario dentro de una reserva confirmada', () => {
    expect(isSlotOccupied(reservations, 'sala-alpha', '2026-04-07', '10:00')).toBe(true)
  })

  it('detecta como disponible un horario posterior al final exacto de la reserva', () => {
    expect(isSlotOccupied(reservations, 'sala-alpha', '2026-04-07', '11:00')).toBe(false)
  })

  it('ignora reservas canceladas al calcular disponibilidad', () => {
    expect(isSlotOccupied(reservations, 'sala-alpha', '2026-04-07', '12:00')).toBe(false)
  })

  it('devuelve la reserva que ocupa el limite inicial del horario', () => {
    const reservation = getSlotReservation(reservations, 'sala-alpha', '2026-04-07', '09:00')

    expect(reservation.id).toBe('r-confirmed')
  })

  it('valida como correcto un rango con hora final posterior', () => {
    expect(isValidReservationRange('09:00', '10:00')).toBe(true)
  })

  it('rechaza como invalido un rango con inicio y fin iguales', () => {
    expect(isValidReservationRange('09:00', '09:00')).toBe(false)
  })

  it('rechaza horas fuera del rango valido del dia', () => {
    expect(parseTimeToMinutes('24:00')).toBeNull()
  })

  it('marca como finalizada una reserva confirmada cuyo horario ya termino', () => {
    const now = new Date(2026, 3, 7, 11, 0)

    expect(reservationHasEnded(reservations[0], now)).toBe(true)
    expect(getReservationDisplayStatus(reservations[0], now)).toBe('completed')
  })

  it('mantiene confirmada una reserva antes de su hora de finalizacion', () => {
    const now = new Date(2026, 3, 7, 10, 59)

    expect(getReservationDisplayStatus(reservations[0], now)).toBe('confirmed')
  })

  it('no permite cancelar una reserva cuando el horario ya termino', () => {
    const now = new Date(2026, 3, 7, 11, 0)

    expect(canCancelReservation(reservations[0], now)).toBe(false)
  })
})
