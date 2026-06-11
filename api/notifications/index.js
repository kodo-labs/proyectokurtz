import { readJsonBody, requireMethod, sendJson } from '../../server/http.js'
import { selectRows, updateRows, verifyRequestUser } from '../../server/supabaseAdmin.js'

function inFilter(values) {
  const unique = [...new Set(values.filter(Boolean))]
  return unique.length ? `in.(${unique.join(',')})` : ''
}

async function enrichNotifications(notifications) {
  if (!notifications.length) return []

  const reservationFilter = inFilter(notifications.map(item => item.reservation_id))
  const actorFilter = inFilter(notifications.map(item => item.actor_id))
  const reservations = reservationFilter
    ? await selectRows('reservations', {
        select: 'id,resource_id,date,start_time,end_time,title',
        id: reservationFilter,
      })
    : []
  const resourceFilter = inFilter(reservations.map(item => item.resource_id))
  const [resources, actors] = await Promise.all([
    resourceFilter
      ? selectRows('resources', {
          select: 'id,name,type',
          id: resourceFilter,
        })
      : Promise.resolve([]),
    actorFilter
      ? selectRows('profiles', {
          select: 'id,name,email',
          id: actorFilter,
        })
      : Promise.resolve([]),
  ])

  const reservationsById = new Map(reservations.map(item => [item.id, item]))
  const resourcesById = new Map(resources.map(item => [item.id, item]))
  const actorsById = new Map(actors.map(item => [String(item.id), item]))

  return notifications.map(notification => {
    const reservation = reservationsById.get(notification.reservation_id)
    const resource = resourcesById.get(reservation?.resource_id)
    const actor = actorsById.get(String(notification.actor_id))
    return {
      ...notification,
      actor_name: actor?.name ?? '',
      resource_name: resource?.name ?? '',
      reservation_date: reservation?.date ?? '',
      reservation_start_time: reservation?.start_time ?? '',
      reservation_end_time: reservation?.end_time ?? '',
    }
  })
}

export default async function handler(request, response) {
  if (!requireMethod(request, response, ['GET', 'POST'])) return

  try {
    const { profile } = await verifyRequestUser(request)

    if (request.method === 'GET') {
      const query = {
        select: '*',
        order: 'created_at.desc',
        limit: '20',
      }

      if (profile.role === 'admin') {
        query.or = `(user_id.eq.${profile.id},actor_id.eq.${profile.id})`
      } else {
        query.user_id = `eq.${profile.id}`
      }

      const notifications = await selectRows('notification_logs', query)
      return sendJson(response, 200, {
        notifications: await enrichNotifications(notifications),
      })
    }

    const { action } = readJsonBody(request)
    if (action !== 'mark-all-read') {
      return sendJson(response, 400, { error: 'Accion invalida.' })
    }

    const filters = {
      read_at: 'is.null',
    }
    if (profile.role === 'admin') {
      filters.or = `(user_id.eq.${profile.id},actor_id.eq.${profile.id})`
    } else {
      filters.user_id = `eq.${profile.id}`
    }

    await updateRows('notification_logs', filters, {
      read_at: new Date().toISOString(),
    })

    return sendJson(response, 200, { ok: true })
  } catch (error) {
    return sendJson(response, error.status ?? 500, {
      error: error.message ?? 'No se pudieron cargar las notificaciones.',
    })
  }
}
