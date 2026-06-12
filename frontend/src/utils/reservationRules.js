export function parseTimeToMinutes(time) {
  if (typeof time !== 'string') return null

  const match = time.match(/^(\d{2}):(\d{2})$/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return hours * 60 + minutes
}

export function isValidReservationRange(startTime, endTime) {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)

  if (start === null || end === null) return false

  return end > start
}

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLocalTime(date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function reservationHasEnded(reservation, now = new Date()) {
  if (
    !reservation ||
    reservation.isBlocked ||
    typeof reservation.date !== 'string' ||
    parseTimeToMinutes(reservation.endTime) === null
  ) {
    return false
  }

  const currentDate = formatLocalDate(now)
  if (reservation.date < currentDate) return true
  if (reservation.date > currentDate) return false

  return reservation.endTime <= formatLocalTime(now)
}

export function getReservationDisplayStatus(reservation, now = new Date()) {
  if (reservation?.status === 'confirmed' && reservationHasEnded(reservation, now)) {
    return 'completed'
  }

  return reservation?.status
}

export function canCancelReservation(reservation, now = new Date()) {
  return (
    ['confirmed', 'pending'].includes(reservation?.status) &&
    !reservationHasEnded(reservation, now)
  )
}

export function reservationContainsSlot(reservation, startTime) {
  const slotStart = parseTimeToMinutes(startTime)
  const reservationStart = parseTimeToMinutes(reservation.startTime)
  const reservationEnd = parseTimeToMinutes(reservation.endTime)

  if (slotStart === null || reservationStart === null || reservationEnd === null) {
    return false
  }

  return slotStart >= reservationStart && slotStart < reservationEnd
}

export function isSlotOccupied(reservations, resourceId, date, startTime) {
  return reservations.some(reservation => {
    if (
      reservation.resourceId !== resourceId ||
      reservation.date !== date ||
      reservation.status === 'cancelled'
    ) {
      return false
    }

    return reservationContainsSlot(reservation, startTime)
  })
}

export function getSlotReservation(reservations, resourceId, date, startTime) {
  return reservations.find(reservation => {
    if (
      reservation.resourceId !== resourceId ||
      reservation.date !== date ||
      reservation.status === 'cancelled'
    ) {
      return false
    }

    return reservationContainsSlot(reservation, startTime)
  })
}
