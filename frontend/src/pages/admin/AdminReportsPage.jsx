import { useMemo, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import { useReservations } from '../../context/ReservationsContext'
import { useResources } from '../../context/ResourcesContext'
import {
  buildStatisticsRows,
  calculateStatistics,
  downloadCsv,
  filterStatisticsRows,
} from '../../utils/statisticsExport'

function ReportMetric({ label, value, detail, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-50 text-slate-700',
  }

  return (
    <article className="rounded-2xl border border-white/80 bg-white/72 p-5 shadow-[0_18px_45px_rgba(35,55,95,0.08)] backdrop-blur">
      <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${tones[tone]}`}>{label}</span>
      <p className="mt-4 truncate text-2xl font-black text-[#202837]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#8a94a6]">{detail}</p>
    </article>
  )
}

export default function AdminReportsPage() {
  const { reservations } = useReservations()
  const { resources } = useResources()
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    resourceId: '',
    type: '',
    status: '',
  })

  const rows = useMemo(
    () => buildStatisticsRows(reservations, resources),
    [reservations, resources]
  )
  const filteredRows = useMemo(
    () => filterStatisticsRows(rows, filters),
    [rows, filters]
  )
  const metrics = useMemo(
    () => calculateStatistics(filteredRows),
    [filteredRows]
  )

  function updateFilter(key, value) {
    setFilters(current => ({ ...current, [key]: value }))
  }

  return (
    <div>
      <TopBar
        title="Reportes"
        subtitle="Metricas operativas y exportacion anonimizada."
        action={
          <button
            onClick={() => downloadCsv(filteredRows)}
            className="hidden rounded-full bg-[#2563eb] px-4 py-2 text-xs font-black text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition-transform hover:-translate-y-0.5 sm:block"
          >
            Exportar CSV
          </button>
        }
      />

      <div className="p-4 md:p-8">
        <section className="rounded-[28px] border border-white/80 bg-white/72 p-6 shadow-[0_26px_70px_rgba(35,55,95,0.10)] backdrop-blur md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-[#2563eb]">Estadistica</p>
              <h2 className="mt-3 text-3xl font-black text-[#202837]">Uso real del coworking, listo para analizar.</h2>
              <p className="mt-2 text-sm font-semibold text-[#667085]">Los identificadores personales se anonimizan antes de exportar.</p>
            </div>
            <button onClick={() => downloadCsv(filteredRows)} className="rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-black text-white shadow-[0_16px_32px_rgba(37,99,235,0.28)] sm:hidden">
              Exportar CSV
            </button>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="text-xs font-black text-[#667085]">
              Desde
              <input type="date" value={filters.from} onChange={event => updateFilter('from', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-3 py-2.5 font-semibold text-[#202837] outline-none focus:ring-2 focus:ring-blue-200" />
            </label>
            <label className="text-xs font-black text-[#667085]">
              Hasta
              <input type="date" value={filters.to} onChange={event => updateFilter('to', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-3 py-2.5 font-semibold text-[#202837] outline-none focus:ring-2 focus:ring-blue-200" />
            </label>
            <label className="text-xs font-black text-[#667085]">
              Recurso
              <select value={filters.resourceId} onChange={event => updateFilter('resourceId', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-3 py-2.5 font-semibold text-[#202837] outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">Todos</option>
                {resources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-black text-[#667085]">
              Tipo
              <select value={filters.type} onChange={event => updateFilter('type', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-3 py-2.5 font-semibold text-[#202837] outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">Todos</option>
                <option value="sala">Sala</option>
                <option value="escritorio">Escritorio</option>
              </select>
            </label>
            <label className="text-xs font-black text-[#667085]">
              Estado
              <select value={filters.status} onChange={event => updateFilter('status', event.target.value)} className="mt-1.5 w-full rounded-xl border border-white bg-white/90 px-3 py-2.5 font-semibold text-[#202837] outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">Todos</option>
                <option value="confirmed">Confirmada</option>
                <option value="pending">Pendiente</option>
                <option value="completed">Finalizada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ReportMetric label="Reservas" value={metrics.totalReservations} detail="en el periodo" tone="blue" />
          <ReportMetric label="Horas" value={metrics.reservedHours} detail="reservadas activas" tone="green" />
          <ReportMetric label="Cancelaciones" value={metrics.cancellations} detail="reservas canceladas" tone="orange" />
          <ReportMetric label="Bloqueos" value={metrics.blocks} detail="mantenimiento" tone="violet" />
          <ReportMetric label="Mas utilizado" value={metrics.mostUsedResource} detail="por tiempo reservado" tone="slate" />
        </section>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-white/80 bg-white/72 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="text-lg font-black text-[#202837]">Vista previa</h3>
              <p className="text-xs font-semibold text-[#8a94a6]">{filteredRows.length} registros listos para exportar</p>
            </div>
            <button onClick={() => setFilters({ from: '', to: '', resourceId: '', type: '', status: '' })} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-[#667085]">
              Limpiar filtros
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="bg-[#f1f3fe] text-[#667085]">
                <tr>
                  {['Fecha', 'Recurso', 'Tipo', 'Horario', 'Duracion', 'Estado', 'Bloqueo', 'Usuario'].map(label => (
                    <th key={label} className="px-4 py-3 font-black uppercase">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice(0, 12).map(row => (
                  <tr key={row.reservationId} className="border-t border-slate-100 font-semibold text-[#414755]">
                    <td className="px-4 py-3">{row.date}</td>
                    <td className="px-4 py-3 font-black text-[#202837]">{row.resourceName}</td>
                    <td className="px-4 py-3">{row.resourceType}</td>
                    <td className="px-4 py-3">{row.startTime}-{row.endTime}</td>
                    <td className="px-4 py-3">{row.durationMinutes} min</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">{row.isBlocked}</td>
                    <td className="px-4 py-3 font-mono text-[10px]">{row.anonymizedUserId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
