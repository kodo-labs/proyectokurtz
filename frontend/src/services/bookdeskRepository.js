import { INITIAL_RESERVATIONS, RESOURCES, USERS } from '../data/mockData'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { withTimeout } from '../utils/async'

function translateAuthError(message) {
  const normalized = message?.toLowerCase() ?? ''

  if (normalized.includes('email not confirmed')) {
    return 'Correo no confirmado.'
  }
  if (normalized.includes('invalid login credentials')) {
    return 'Credenciales incorrectas.'
  }
  if (normalized.includes('user already registered') || normalized.includes('already registered')) {
    return 'Ya existe una cuenta con ese correo.'
  }
  if (normalized.includes('password')) {
    return 'La contrasena no cumple los requisitos.'
  }
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'No se pudo conectar con Supabase. Revisa tu conexion e intenta nuevamente.'
  }

  return message || 'Ocurrio un error. Intentalo nuevamente.'
}

function toReservation(row) {
  return {
    id: row.id,
    resourceId: row.resource_id,
    userId: row.user_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    title: row.title,
    isBlocked: row.is_blocked,
  }
}

function fromReservation(reservation) {
  return {
    id: reservation.id,
    resource_id: reservation.resourceId,
    user_id: reservation.userId,
    date: reservation.date,
    start_time: reservation.startTime,
    end_time: reservation.endTime,
    status: reservation.status,
    title: reservation.title,
    is_blocked: Boolean(reservation.isBlocked),
  }
}

function toResource(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    capacity: row.capacity,
    floor: row.floor,
    amenities: row.amenities ?? [],
    description: row.description ?? '',
    image: row.image ?? null,
  }
}

function fromResource(resource) {
  return {
    id: resource.id,
    name: resource.name,
    type: resource.type,
    capacity: Number(resource.capacity),
    floor: Number(resource.floor),
    amenities: resource.amenities ?? [],
    description: resource.description ?? '',
    image: resource.image ?? null,
  }
}

function toProfile(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
  }
}

export async function signIn(email, password) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000,
        'La conexion con Supabase demoro demasiado. Intentalo nuevamente.'
      )
      if (error) return { ok: false, error: translateAuthError(error.message) }

      let profile = null
      try {
        const profileResult = await withTimeout(
          supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle(),
          10000,
          'No se pudo cargar el perfil.'
        )
        profile = profileResult.data
      } catch {
        // Auth succeeded; use metadata defaults if the optional profile query fails.
      }

      return {
        ok: true,
        user: {
          id: profile?.id ?? data.user.id,
          name: profile?.name ?? data.user.email,
          email: data.user.email,
          role: profile?.role ?? 'member',
          avatar: profile?.avatar ?? data.user.email?.slice(0, 2).toUpperCase(),
        },
      }
    } catch (error) {
      return { ok: false, error: translateAuthError(error.message) }
    }
  }

  const found = USERS.find(user => user.email === email && user.password === password)
  if (found) return { ok: true, user: found }
  return { ok: false, error: 'Credenciales incorrectas.' }
}

export async function signOut() {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut()
  }
}

export async function getUserFromSession(session) {
  const authUser = session?.user
  if (!authUser) return null
  let profile = null

  try {
    const result = await withTimeout(
      supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle(),
      10000,
      'No se pudo cargar el perfil.'
    )
    profile = result.data
  } catch {
    // Keep the authenticated session usable with metadata defaults.
  }

  return {
    id: profile?.id ?? authUser.id,
    name: profile?.name ?? authUser.email,
    email: authUser.email,
    role: profile?.role ?? 'member',
    avatar: profile?.avatar ?? authUser.email?.slice(0, 2).toUpperCase(),
  }
}

export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null
  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      10000,
      'No se pudo restaurar la sesion.'
    )
    if (error) return null
    return getUserFromSession(data.session)
  } catch {
    return null
  }
}

export async function signUp({ name, email, password }) {
  if (!isSupabaseConfigured) {
    return { ok: true }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })

  if (error) return { ok: false, error: translateAuthError(error.message) }

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email,
      role: 'member',
      avatar: name
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    })
  }

  return { ok: true }
}

export async function fetchReservations() {
  if (!isSupabaseConfigured) return INITIAL_RESERVATIONS

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data.map(toReservation)
}

export async function fetchResources() {
  if (!isSupabaseConfigured) return RESOURCES

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('floor', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data.map(toResource)
}

export async function fetchProfiles() {
  if (!isSupabaseConfigured) {
    return USERS.map(({ password, ...user }) => user)
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,email,role,avatar')
    .order('name', { ascending: true })

  if (error) throw error
  return data.map(toProfile)
}

export async function createResource(resource) {
  if (!isSupabaseConfigured) return resource

  const { data, error } = await supabase
    .from('resources')
    .insert(fromResource(resource))
    .select()
    .single()

  if (error) throw error
  return toResource(data)
}

export async function updateResource(resource) {
  if (!isSupabaseConfigured) return resource

  const { data, error } = await supabase
    .from('resources')
    .update(fromResource(resource))
    .eq('id', resource.id)
    .select()
    .single()

  if (error) throw error
  return toResource(data)
}

export async function deleteResource(id) {
  if (!isSupabaseConfigured) return

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createReservation(reservation) {
  if (!isSupabaseConfigured) return reservation

  const { data, error } = await supabase
    .from('reservations')
    .insert(fromReservation(reservation))
    .select()
    .single()

  if (error) throw error
  return toReservation(data)
}

export async function updateReservationStatus(id, status) {
  if (!isSupabaseConfigured) return

  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}
