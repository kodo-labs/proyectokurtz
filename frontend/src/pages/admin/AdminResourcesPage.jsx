import { useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import Badge from '../../components/common/Badge'
import { useReservations } from '../../context/ReservationsContext'
import { useResources } from '../../context/ResourcesContext'
import { reservationHasEnded } from '../../utils/reservationRules'

const emptyForm = { name: '', type: 'room', capacity: 4, floor: 1, description: '', amenities: '' }

export default function AdminResourcesPage() {
  const { reservations } = useReservations()
  const { resources, addResource, saveResource, removeResource } = useResources()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setSaveError('')
    setShowForm(true)
  }

  function openEdit(resource) {
    setEditingId(resource.id)
    setForm({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      floor: resource.floor,
      description: resource.description,
      amenities: resource.amenities.join(', '),
    })
    setSaveError('')
    setShowForm(true)
  }

  async function handleSave() {
    setSaveError('')
    setSaving(true)
    const amenities = form.amenities.split(',').map(item => item.trim()).filter(Boolean)
    const payload = {
      ...form,
      amenities,
      capacity: Number(form.capacity),
      floor: Number(form.floor),
    }

    try {
      if (editingId) {
        await saveResource({ id: editingId, ...payload })
      } else {
        await addResource({ id: `resource-${Date.now()}`, ...payload, image: null })
      }
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setSaveError('')
    try {
      await removeResource(id)
      setDeleteConfirm(null)
    } catch (err) {
      setSaveError(err.message)
    }
  }

  function getReservationCount(resourceId) {
    return reservations.filter(r =>
      r.resourceId === resourceId &&
      r.status !== 'cancelled' &&
      !r.isBlocked &&
      !reservationHasEnded(r)
    ).length
  }

  return (
    <div>
      <TopBar
        title="Recursos"
        subtitle="Gestion de salas, escritorios y disponibilidad."
        action={
          <button
            onClick={openCreate}
            className="hidden rounded-full bg-[#2563eb] px-4 py-2 text-xs font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition-transform hover:-translate-y-0.5 sm:block"
          >
            Nuevo recurso
          </button>
        }
      />

      <div className="p-4 md:p-8">
        <section className="mb-5 rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-[0_26px_70px_rgba(35,55,95,0.10)] backdrop-blur md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563eb]">Inventario</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-[#202837]">{resources.length} recursos activos</h2>
              <p className="mt-2 text-sm font-semibold text-[#667085]">Administra capacidad, amenidades y espacios disponibles para reservas.</p>
            </div>
            <button
              onClick={openCreate}
              className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-black text-white shadow-[0_16px_32px_rgba(37,99,235,0.28)] sm:hidden"
            >
              Nuevo recurso
            </button>
          </div>
        </section>

        {saveError && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {saveError}
          </div>
        )}

        {showForm && (
          <section className="mb-5 rounded-[24px] border border-white/80 bg-white/78 p-5 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
            <h3 className="text-lg font-black text-[#202837]">{editingId ? 'Editar recurso' : 'Nuevo recurso'}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre" className="rounded-xl border border-white bg-white/85 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-200" />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="rounded-xl border border-white bg-white/85 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-200">
                <option value="room">Sala de reuniones</option>
                <option value="desk">Escritorio</option>
              </select>
              <input type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="Capacidad" className="rounded-xl border border-white bg-white/85 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-200" />
              <input type="number" min="1" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="Piso" className="rounded-xl border border-white bg-white/85 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-200" />
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripcion" className="rounded-xl border border-white bg-white/85 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-200 md:col-span-2" />
              <input value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="Amenidades separadas por coma" className="rounded-xl border border-white bg-white/85 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-200 md:col-span-2" />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleSave} disabled={!form.name.trim() || saving} className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-black text-white disabled:opacity-40">
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear recurso'}
              </button>
              <button onClick={() => setShowForm(false)} className="rounded-xl bg-white px-5 py-3 text-sm font-black text-[#667085]">
                Cancelar
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map(resource => (
            <article key={resource.id} className="rounded-[24px] border border-white/80 bg-white/72 p-5 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
              <div className="mb-5 flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-[#2563eb]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
                    <path d="M9 7h1M14 7h1M9 11h1M14 11h1M10 21v-5h4v5" />
                  </svg>
                </div>
                <Badge variant={resource.type} />
              </div>
              <h3 className="text-lg font-black text-[#202837]">{resource.name}</h3>
              <p className="mt-2 line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-[#667085]">{resource.description}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/80 p-3">
                  <p className="text-lg font-black text-[#202837]">{resource.floor}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a94a6]">Piso</p>
                </div>
                <div className="rounded-xl bg-white/80 p-3">
                  <p className="text-lg font-black text-[#202837]">{resource.capacity}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a94a6]">Cupo</p>
                </div>
                <div className="rounded-xl bg-white/80 p-3">
                  <p className="text-lg font-black text-[#202837]">{getReservationCount(resource.id)}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8a94a6]">Activas</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {resource.amenities.slice(0, 4).map(item => (
                  <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-[#667085]">{item}</span>
                ))}
              </div>
              <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                <button onClick={() => openEdit(resource)} className="flex-1 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-[#2563eb]">Editar</button>
                {deleteConfirm === resource.id ? (
                  <>
                    <button onClick={() => handleDelete(resource.id)} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white">Si</button>
                    <button onClick={() => setDeleteConfirm(null)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#667085]">No</button>
                  </>
                ) : (
                  <button onClick={() => setDeleteConfirm(resource.id)} className="flex-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600">Eliminar</button>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
