# KodoLabs

## Proyecto BookDesk — Sistema de reservas para espacio de coworking

Sistema web para que los miembros de un espacio de coworking puedan reservar salas y escritorios. Reemplaza la gestión actual por WhatsApp y evita conflictos de doble reserva.

---

### Integrantes

| Nombre           | Rol           | GitHub           |
|------------------|---------------|------------------|
| Franco Olexyn    | Scrum Master  | @francoolexyn    |
| Santino Martins  | Dev Lead      | @santi-ms        |
| Santiago Tarnoski| QA Lead       | @santiagotarnoski|
| Santino Roa      | UX Lead       | @sansonlol       |

---

### Descripción del sistema

Sistema de reservas para espacio de coworking que permite a los miembros ver la disponibilidad de salas y escritorios en un calendario semanal, realizar y cancelar reservas con confirmación, y a los administradores gestionar recursos (salas/escritorios), ver historial de reservas y bloquear horarios o días.

---
Patrones de uso a utilizar: Factory Method y Observer
---
Caso de uso a desarrollar: Un miembro elige un recurso (sala o escritorio) un horario y el sistema verifica que no haya conflicto y confirma.

### Enlaces

- **Tablero Kanban (GitHub Projects): https://github.com/users/francoolexyn/projects/3/views/1

## Mejora integradora

BookDesk incorpora una capa de asistencia y comunicacion inteligente:

- Emails reales con Resend al confirmar o cancelar reservas.
- Aviso por email y campana para cada administrador cuando ingresa una reserva.
- Auditoria de envios y campana de notificaciones.
- Asistente con Claude limitado al dominio del coworking y a los datos autorizados.
- Gestion administrativa de reservas con busqueda, filtros, detalle y cancelacion.
- Panel administrador de reportes con filtros y exportacion CSV anonimizada.
- Vercel Functions para mantener las claves fuera del bundle de React.

### Ejecucion local

```bash
cd frontend
npm install
npm run dev
```

Las funciones `/api` requieren Vercel Dev o un despliegue Preview:

```bash
npx vercel dev
```

### Verificacion

```bash
cd frontend
npm test
npm run build
npm run export:statistics
```

La configuracion completa esta en
[`docs/MEJORA_INTEGRADORA_SETUP.md`](docs/MEJORA_INTEGRADORA_SETUP.md).
