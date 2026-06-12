import {
  anonymizeUserId,
  buildStatisticsRows,
  calculateDurationMinutes,
  calculateStatistics,
  filterStatisticsRows,
  toCsv,
} from '../../frontend/src/utils/statisticsExport.js'

const resources = [
  { id: 'sala-a', name: 'Sala Norte, Piso 2', type: 'room', floor: 2, capacity: 8 },
  { id: 'desk-a', name: 'Escritorio A', type: 'desk', floor: 1, capacity: 1 },
]

const reservations = [
  {
    id: 'r1',
    resourceId: 'sala-a',
    userId: 'usuario-real-1',
    date: '2026-06-09',
    startTime: '09:00',
    endTime: '10:30',
    status: 'confirmed',
    isBlocked: false,
  },
  {
    id: 'r2',
    resourceId: 'desk-a',
    userId: 'usuario-real-2',
    date: '2026-06-10',
    startTime: '11:00',
    endTime: '12:00',
    status: 'cancelled',
    isBlocked: false,
  },
]

describe('statisticsExport', () => {
  it('calcula la duracion exacta de una reserva', () => {
    expect(calculateDurationMinutes('09:00', '10:30')).toBe(90)
  })

  it('devuelve cero para un rango horario invalido', () => {
    expect(calculateDurationMinutes('10:00', '09:00')).toBe(0)
  })

  it('anonimiza de forma estable sin exponer el identificador original', () => {
    const anonymized = anonymizeUserId('usuario-real-1')
    expect(anonymized).toMatch(/^USR-[A-F0-9]{8}$/)
    expect(anonymized).not.toContain('usuario-real-1')
    expect(anonymizeUserId('usuario-real-1')).toBe(anonymized)
  })

  it('combina reservas y recursos con campos estadisticos', () => {
    const [row] = buildStatisticsRows(reservations, resources)
    expect(row).toMatchObject({
      resourceName: 'Sala Norte, Piso 2',
      resourceType: 'Sala',
      durationMinutes: 90,
      dayOfWeek: 'martes',
    })
  })

  it('filtra por fecha, recurso, tipo y estado', () => {
    const rows = buildStatisticsRows(reservations, resources, new Date(2026, 5, 9, 9, 30))
    const filtered = filterStatisticsRows(rows, {
      from: '2026-06-09',
      to: '2026-06-09',
      resourceId: 'sala-a',
      type: 'sala',
      status: 'confirmed',
    })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].reservationId).toBe('r1')
  })

  it('escapa comas y conserva encabezados en el CSV', () => {
    const csv = toCsv(buildStatisticsRows(reservations, resources))
    expect(csv).toContain('ID de reserva,Fecha,Dia de semana')
    expect(csv).toContain('"Sala Norte, Piso 2"')
  })

  it('calcula metricas excluyendo cancelaciones de las horas activas', () => {
    const metrics = calculateStatistics(
      buildStatisticsRows(reservations, resources, new Date(2026, 5, 9, 9, 30))
    )
    expect(metrics.totalReservations).toBe(2)
    expect(metrics.reservedHours).toBe(1.5)
    expect(metrics.cancellations).toBe(1)
    expect(metrics.mostUsedResource).toBe('Sala Norte, Piso 2')
  })
})
