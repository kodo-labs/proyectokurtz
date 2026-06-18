// ─── Usuarios ────────────────────────────────────────────────────────────────
import { getSlotReservation as findSlotReservation, isSlotOccupied as checkSlotOccupied } from '../utils/reservationRules.js'

export const USERS = [
  {
    id: 1,
    name: 'Miembro Demo',
    email: 'memberdemo@bookdesk.com',
    password: 'memberdemo',
    role: 'member',
    avatar: 'MD',
  },
  {
    id: 2,
    name: 'Marcos Diaz',
    email: 'marcos@bookdesk.com',
    password: '1234',
    role: 'member',
    avatar: 'MD',
  },
  {
    id: 3,
    name: 'Admin Demo',
    email: 'admindemo@bookdesk.com',
    password: 'admindemo',
    role: 'admin',
    avatar: 'AD',
  },
]

// ─── Recursos ─────────────────────────────────────────────────────────────────
export const RESOURCES = [
  {
    id: 'sala-alpha',
    name: 'Sala Alpha',
    type: 'room',
    capacity: 8,
    floor: 2,
    amenities: ['Proyector', 'Pizarrón', 'AC', 'Video conferencia'],
    description: 'Sala de reuniones equipada para equipos medianos.',
    image: null,
  },
  {
    id: 'sala-beta',
    name: 'Sala Beta',
    type: 'room',
    capacity: 4,
    floor: 1,
    amenities: ['TV 55"', 'Pizarrón', 'AC'],
    description: 'Sala compacta, ideal para reuniones pequeñas o entrevistas.',
    image: null,
  },
  {
    id: 'sala-gamma',
    name: 'Sala Gamma',
    type: 'room',
    capacity: 12,
    floor: 3,
    amenities: ['Proyector 4K', 'AC', 'Video conferencia', 'Sistema de audio'],
    description: 'Sala grande para workshops, demos o reuniones de equipo.',
    image: null,
  },
  {
    id: 'escritorio-a1',
    name: 'Escritorio A1',
    type: 'desk',
    capacity: 1,
    floor: 1,
    amenities: ['Monitor 27"', 'Teclado', 'Mouse'],
    description: 'Escritorio en zona tranquila, vista al parque.',
    image: null,
  },
  {
    id: 'escritorio-a2',
    name: 'Escritorio A2',
    type: 'desk',
    capacity: 1,
    floor: 1,
    amenities: ['Monitor 24"'],
    description: 'Escritorio estándar cerca de la ventana.',
    image: null,
  },
  {
    id: 'escritorio-a3',
    name: 'Escritorio A3',
    type: 'desk',
    capacity: 1,
    floor: 1,
    amenities: ['Monitor 27"', 'Teclado mecánico', 'Mouse'],
    description: 'Escritorio premium en zona silenciosa.',
    image: null,
  },
  {
    id: 'escritorio-b1',
    name: 'Escritorio B1',
    type: 'desk',
    capacity: 1,
    floor: 2,
    amenities: ['Monitor 24"', 'Teclado'],
    description: 'Escritorio en planta alta, zona colaborativa.',
    image: null,
  },
  {
    id: 'escritorio-b2',
    name: 'Escritorio B2',
    type: 'desk',
    capacity: 1,
    floor: 2,
    amenities: ['Monitor 24"'],
    description: 'Escritorio en planta alta, cerca de la cocina.',
    image: null,
  },
]

// ─── Reservas (semana actual) ────────────────────────────────────────────────
// status: 'confirmed' | 'pending' | 'cancelled'
const _w = WEEK_DAYS
export const INITIAL_RESERVATIONS = [
  // Sala Alpha
  {
    id: 'r001',
    resourceId: 'sala-alpha',
    userId: 1,
    date: _w[0].date,
    startTime: '09:00',
    endTime: '11:00',
    status: 'confirmed',
    title: 'Sprint Planning',
  },
  {
    id: 'r002',
    resourceId: 'sala-alpha',
    userId: 2,
    date: _w[0].date,
    startTime: '14:00',
    endTime: '16:00',
    status: 'confirmed',
    title: 'Reunión de equipo',
  },
  {
    id: 'r003',
    resourceId: 'sala-alpha',
    userId: 2,
    date: _w[2].date,
    startTime: '10:00',
    endTime: '12:00',
    status: 'confirmed',
    title: 'Demo cliente',
  },
  // Sala Beta
  {
    id: 'r004',
    resourceId: 'sala-beta',
    userId: 1,
    date: _w[1].date,
    startTime: '11:00',
    endTime: '13:00',
    status: 'confirmed',
    title: 'Entrevista candidato',
  },
  {
    id: 'r005',
    resourceId: 'sala-beta',
    userId: 2,
    date: _w[3].date,
    startTime: '09:00',
    endTime: '10:00',
    status: 'pending',
    title: 'Llamada con proveedor',
  },
  // Sala Gamma (bloqueada por admin el jueves)
  {
    id: 'r006',
    resourceId: 'sala-gamma',
    userId: 3,
    date: _w[3].date,
    startTime: '08:00',
    endTime: '18:00',
    status: 'confirmed',
    title: 'BLOQUEADO — Mantenimiento',
    isBlocked: true,
  },
  {
    id: 'r007',
    resourceId: 'sala-gamma',
    userId: 1,
    date: _w[4].date,
    startTime: '10:00',
    endTime: '13:00',
    status: 'confirmed',
    title: 'Workshop UX',
  },
  // Escritorios
  {
    id: 'r008',
    resourceId: 'escritorio-a1',
    userId: 2,
    date: _w[0].date,
    startTime: '08:00',
    endTime: '18:00',
    status: 'confirmed',
    title: 'Jornada completa',
  },
  {
    id: 'r009',
    resourceId: 'escritorio-a2',
    userId: 1,
    date: _w[1].date,
    startTime: '08:00',
    endTime: '14:00',
    status: 'confirmed',
    title: 'Media jornada',
  },
  {
    id: 'r010',
    resourceId: 'escritorio-a3',
    userId: 1,
    date: _w[2].date,
    startTime: '09:00',
    endTime: '17:00',
    status: 'confirmed',
    title: 'Trabajo remoto',
  },
]

// ─── Horarios disponibles ────────────────────────────────────────────────────
export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
]

function getCurrentWeekDays() {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
  return labels.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return { label, date: `${yyyy}-${mm}-${dd}` }
  })
}

export const WEEK_DAYS = getCurrentWeekDays()

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function formatShortDate(dateStr) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

export function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                  'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

export function isSlotOccupied(reservations, resourceId, date, startTime) {
  return checkSlotOccupied(reservations, resourceId, date, startTime)
}

export function getSlotReservation(reservations, resourceId, date, startTime) {
  return findSlotReservation(reservations, resourceId, date, startTime)
}
