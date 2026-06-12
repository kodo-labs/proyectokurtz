import { getReservationDisplayStatus, parseTimeToMinutes } from './reservationRules.js'

export const CSV_COLUMNS = [
  ['reservationId', 'ID de reserva'],
  ['date', 'Fecha'],
  ['dayOfWeek', 'Dia de semana'],
  ['resourceName', 'Recurso'],
  ['resourceType', 'Tipo'],
  ['floor', 'Piso'],
  ['capacity', 'Capacidad'],
  ['startTime', 'Hora de inicio'],
  ['endTime', 'Hora de fin'],
  ['durationMinutes', 'Duracion en minutos'],
  ['status', 'Estado'],
  ['isBlocked', 'Es bloqueo'],
  ['anonymizedUserId', 'ID anonimizado del usuario'],
]

const DAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const STATUS_LABELS = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
  completed: 'Finalizada',
}

export function anonymizeUserId(userId) {
  const source = String(userId ?? 'sin-usuario')
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `USR-${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}`
}

export function calculateDurationMinutes(startTime, endTime) {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  if (start === null || end === null || end <= start) return 0
  return end - start
}

export function buildStatisticsRows(reservations, resources, now = new Date()) {
  const resourcesById = new Map(resources.map(resource => [resource.id, resource]))

  return reservations.map(reservation => {
    const resource = resourcesById.get(reservation.resourceId) ?? {}
    const date = new Date(`${reservation.date}T12:00:00Z`)

    const displayStatus = getReservationDisplayStatus(reservation, now)

    return {
      reservationId: reservation.id,
      date: reservation.date,
      dayOfWeek: DAYS[date.getUTCDay()],
      resourceId: reservation.resourceId,
      resourceName: resource.name ?? reservation.resourceId,
      resourceType: resource.type === 'room' ? 'Sala' : 'Escritorio',
      floor: resource.floor ?? '',
      capacity: resource.capacity ?? '',
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      durationMinutes: calculateDurationMinutes(reservation.startTime, reservation.endTime),
      status: STATUS_LABELS[displayStatus] ?? displayStatus,
      statusCode: displayStatus,
      isBlocked: reservation.isBlocked ? 'Si' : 'No',
      anonymizedUserId: anonymizeUserId(reservation.userId),
    }
  })
}

export function filterStatisticsRows(rows, filters = {}) {
  return rows.filter(row => {
    if (filters.from && row.date < filters.from) return false
    if (filters.to && row.date > filters.to) return false
    if (filters.resourceId && row.resourceId !== filters.resourceId) return false
    if (filters.type && row.resourceType.toLowerCase() !== filters.type.toLowerCase()) return false
    if (filters.status && row.statusCode !== filters.status) return false
    return true
  })
}

export function calculateStatistics(rows) {
  const activeRows = rows.filter(row => row.statusCode !== 'cancelled' && row.isBlocked !== 'Si')
  const usage = activeRows.reduce((result, row) => {
    result[row.resourceName] = (result[row.resourceName] ?? 0) + row.durationMinutes
    return result
  }, {})
  const mostUsed = Object.entries(usage).sort((a, b) => b[1] - a[1])[0]

  return {
    totalReservations: rows.filter(row => row.isBlocked !== 'Si').length,
    reservedHours: Math.round(activeRows.reduce((total, row) => total + row.durationMinutes, 0) / 6) / 10,
    cancellations: rows.filter(row => row.statusCode === 'cancelled').length,
    blocks: rows.filter(row => row.isBlocked === 'Si').length,
    mostUsedResource: mostUsed?.[0] ?? 'Sin datos',
  }
}

function escapeCsv(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(rows) {
  const header = CSV_COLUMNS.map(([, label]) => escapeCsv(label)).join(',')
  const lines = rows.map(row =>
    CSV_COLUMNS.map(([key]) => escapeCsv(row[key])).join(',')
  )
  return [header, ...lines].join('\r\n')
}

export function downloadCsv(rows, filename = 'reservas-estadistica.csv') {
  const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
