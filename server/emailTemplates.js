function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(date) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}

export function buildReservationEmail({ event, profile, reservation, resource, bookedBy }) {
  const isAdminNotice = event === 'new_reservation'
  const confirmed = event === 'confirmed'
  const title = isAdminNotice
    ? 'Nueva reserva recibida'
    : confirmed
      ? 'Reserva confirmada'
      : 'Reserva cancelada'
  const accent = event === 'cancelled' ? '#ba1a1a' : '#0070eb'
  const intro = isAdminNotice
    ? `${escapeHtml(bookedBy?.name || 'Un miembro')} realizo una nueva reserva.`
    : confirmed
      ? 'Tu espacio quedo reservado correctamente.'
      : 'La reserva fue cancelada correctamente.'
  const name = escapeHtml(profile.name || 'Miembro')
  const resourceName = escapeHtml(resource.name || 'Espacio')
  const reservationTitle = escapeHtml(reservation.title || 'Reserva')
  const date = escapeHtml(formatDate(reservation.date))
  const schedule = `${escapeHtml(reservation.start_time)} a ${escapeHtml(reservation.end_time)}`

  return {
    subject: `BookDesk | ${title}: ${resource.name}`,
    text: `${title}. ${bookedBy?.name ? `${bookedBy.name}, ` : ''}${resource.name}, ${formatDate(reservation.date)}, ${reservation.start_time} a ${reservation.end_time}.`,
    html: `
      <div style="background:#f5f7ff;padding:32px;font-family:Inter,Arial,sans-serif;color:#181c23">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e0e2ed;border-radius:16px;overflow:hidden">
          <div style="padding:24px 28px;background:#f9f9ff;border-bottom:1px solid #e6e8f3">
            <div style="font-size:20px;font-weight:800;color:#181c23">BookDesk</div>
            <div style="font-size:12px;color:#717786;margin-top:4px">Coworking inteligente</div>
          </div>
          <div style="padding:30px 28px">
            <div style="display:inline-block;padding:7px 10px;border-radius:8px;background:${accent}14;color:${accent};font-size:12px;font-weight:700">
              ${title}
            </div>
            <h1 style="font-size:25px;line-height:1.25;margin:18px 0 8px">${name}, ${intro}</h1>
            <p style="color:#5f6878;line-height:1.6;margin:0 0 24px">Estos son los detalles registrados en BookDesk.</p>
            <div style="background:#f7f9ff;border-radius:12px;padding:20px">
              <div style="font-weight:800;font-size:18px">${resourceName}</div>
              <div style="color:#717786;margin-top:4px">${reservationTitle}</div>
              ${isAdminNotice ? `<div style="margin-top:18px;font-size:14px"><strong>Miembro:</strong> ${escapeHtml(bookedBy?.name || 'Sin nombre')}</div>` : ''}
              <div style="margin-top:18px;font-size:14px"><strong>Fecha:</strong> ${date}</div>
              <div style="margin-top:8px;font-size:14px"><strong>Horario:</strong> ${schedule}</div>
            </div>
          </div>
        </div>
      </div>
    `,
  }
}
