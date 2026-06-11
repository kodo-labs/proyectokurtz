# Configuracion de la mejora integradora

## Arquitectura

React nunca recibe las claves de Resend, Anthropic ni la clave `service_role`.
El navegador envia el JWT de Supabase a funciones ubicadas en `/api`. Cada
funcion valida la sesion antes de consultar datos o invocar servicios externos.

Endpoints:

- `POST /api/notifications/reservation`
- `GET /api/notifications`
- `POST /api/notifications`
- `POST /api/chat`

## 1. Supabase

1. Abrir SQL Editor.
2. Ejecutar nuevamente `docs/supabase-schema.sql`.
3. Confirmar que existan `profiles`, `resources`, `reservations` y
   `notification_logs`.
4. Verificar que RLS este habilitado.
5. En Project Settings > API Keys copiar la clave secreta `service_role`.

La clave `service_role` solo se configura en Vercel como
`SUPABASE_SERVICE_ROLE_KEY`. Nunca debe comenzar con `VITE_`.

## 2. Resend

1. Agregar el dominio propio en Resend > Domains.
2. Crear en DNS los registros SPF y DKIM indicados por Resend.
3. Esperar el estado `Verified`.
4. Elegir un remitente del dominio, por ejemplo:
   `BookDesk <reservas@notificaciones.tudominio.com>`.
5. Crear una API key con permiso de envio.

Variables:

```env
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=BookDesk <reservas@notificaciones.tudominio.com>
```

El endpoint usa la clave de idempotencia
`bookdesk:{evento}:{reservationId}:{userId}`. El log unico por evento, reserva
y destinatario evita correos duplicados aun cuando el navegador reintenta.

Cuando un miembro confirma una reserva:

- El miembro recibe el correo de confirmacion.
- Cada perfil con rol `admin` recibe un correo de nueva reserva.
- La campana del administrador muestra quien reservo, el recurso y el horario.
- La campana se actualiza automaticamente cada 20 segundos y al volver a la
  pestana.

## 3. Anthropic

Crear una API key en Anthropic Console y configurar:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxx
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

El servidor limita el historial a 10 mensajes, cada mensaje a 1000 caracteres
y la respuesta a 450 tokens. El prompt prohibe ejecutar acciones y revelar
datos de otras personas.

## 4. Variables de Vercel

En Project Settings > Environment Variables agregar para Production y Preview:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICABLE
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=BookDesk <reservas@notificaciones.tudominio.com>
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxx
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
```

Despues de guardar las variables hay que hacer Redeploy. `vercel.json` excluye
`/api/*` del rewrite de la SPA.

## 5. Pruebas manuales

1. Iniciar sesion como miembro.
2. Crear una reserva.
3. Comprobar la fila en `reservations` y el correo de confirmacion del miembro.
4. Iniciar sesion como administrador y comprobar el correo de nueva reserva,
   el registro `new_reservation` en `notification_logs` y la campana.
5. Abrir `/admin/reservations`, buscar la reserva y revisar su detalle.
6. Cancelar la misma reserva y comprobar el correo de cancelacion del miembro.
7. Reintentar el endpoint con el mismo evento: no debe crear correos duplicados.
8. Consultar al asistente por reservas propias.
9. Consultar una accion ("cancela mi reserva"): debe explicar el camino, no
   ejecutarla.
10. Iniciar sesion como administrador y abrir `/admin/reports`.
11. Aplicar filtros y exportar el CSV.

## 6. Exportacion reproducible

```bash
cd frontend
npm run export:statistics
```

Con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` usa la base real. Sin esas
variables genera `exports/reservas-estadistica.csv` con datos demo.

## Referencias

- [Resend: enviar email](https://resend.com/docs/api-reference/emails/send-email)
- [Resend: verificar dominio](https://resend.com/docs/dashboard/domains/introduction)
- [Claude: modelos disponibles](https://platform.claude.com/docs/en/models-overview)
- [Vercel Functions con Vite](https://vercel.com/docs/frameworks/vite)
- [Variables de entorno en Vercel](https://vercel.com/docs/projects/environment-variables)
