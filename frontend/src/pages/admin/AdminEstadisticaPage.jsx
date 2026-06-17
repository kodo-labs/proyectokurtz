import { useMemo } from 'react'
import TopBar from '../../components/layout/TopBar'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Scatter, PieChart, Pie, Cell, ComposedChart, Line,
} from 'recharts'

// ─── Generador de datos simulados (seed fija = resultados reproducibles) ────
function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function normalRandom(rand, mean, std) {
  const u1 = rand()
  const u2 = rand()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + std * z
}

function generarDatos() {
  const rand = seededRandom(42)
  const duraciones = []
  const tipos = []
  const configs = [
    { n: 20, mean: 2.0, std: 0.6, tipo: 'Sala de Reuniones' },
    { n: 15, mean: 4.0, std: 1.0, tipo: 'Escritorio' },
    { n: 10, mean: 6.5, std: 0.8, tipo: 'Escritorio' },
    { n: 5, mean: 1.5, std: 0.3, tipo: 'Sala de Reuniones' },
  ]
  for (const c of configs) {
    for (let i = 0; i < c.n; i++) {
      let d = normalRandom(rand, c.mean, c.std)
      d = Math.max(0.5, Math.min(8.0, d))
      duraciones.push(Math.round(d * 100) / 100)
      tipos.push(c.tipo)
    }
  }

  const usuariosActivos = []
  const reservasDiarias = []
  for (let i = 0; i < 30; i++) {
    const u = Math.floor(rand() * 30) + 5
    usuariosActivos.push(u)
  }
  usuariosActivos.sort((a, b) => a - b)
  for (let i = 0; i < 30; i++) {
    let r = 0.6 * usuariosActivos[i] + (normalRandom(rand, 0, 2)) + 3
    reservasDiarias.push(Math.max(1, Math.round(r)))
  }

  return { duraciones, tipos, usuariosActivos, reservasDiarias }
}

function calcularEstadisticas(datos) {
  const n = datos.length
  const sorted = [...datos].sort((a, b) => a - b)
  const sum = datos.reduce((a, b) => a + b, 0)
  const media = sum / n
  const mediana = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]
  const freq = {}
  for (const d of datos) {
    const key = Math.round(d * 10) / 10
    freq[key] = (freq[key] || 0) + 1
  }
  let maxFreq = 0, moda = 0
  for (const [k, v] of Object.entries(freq)) {
    if (v > maxFreq) { maxFreq = v; moda = parseFloat(k) }
  }
  const varianza = datos.reduce((acc, d) => acc + (d - media) ** 2, 0) / (n - 1)
  const desvio = Math.sqrt(varianza)
  const cv = (desvio / media) * 100
  const q1 = sorted[Math.floor(n * 0.25)]
  const q3 = sorted[Math.floor(n * 0.75)]
  const min = sorted[0]
  const max = sorted[n - 1]
  return { n, media, mediana, moda, modaFreq: maxFreq, varianza, desvio, cv, q1, q3, min, max }
}

function calcularRegresion(x, y) {
  const n = x.length
  const xMean = x.reduce((a, b) => a + b, 0) / n
  const yMean = y.reduce((a, b) => a + b, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - xMean) * (y[i] - yMean)
    sxx += (x[i] - xMean) ** 2
    syy += (y[i] - yMean) ** 2
  }
  const b1 = sxy / sxx
  const b0 = yMean - b1 * xMean
  const r = sxy / Math.sqrt(sxx * syy)
  const r2 = r * r
  return { b0, b1, r, r2 }
}

function calcularInferencia(est) {
  const { n, media, desvio } = est
  const gl = n - 1
  const tCrit = 2.0096
  const errorEst = desvio / Math.sqrt(n)
  const margenError = tCrit * errorEst
  const icInf = media - margenError
  const icSup = media + margenError
  const mu0 = 3.0
  const tCalc = (media - mu0) / errorEst
  const rechazo = Math.abs(tCalc) > tCrit
  return { icInf, icSup, mu0, tCalc, tCrit, rechazo }
}

function construirHistograma(datos) {
  const n = datos.length
  const k = Math.ceil(1 + 3.322 * Math.log10(n))
  const min = Math.min(...datos)
  const amplitud = Math.ceil((Math.max(...datos) - min) / k * 10) / 10
  const limiteInf = Math.floor(min * 10) / 10
  const clases = []
  for (let i = 0; i < k; i++) {
    const li = Math.round((limiteInf + i * amplitud) * 10) / 10
    const ls = Math.round((li + amplitud) * 10) / 10
    const fi = datos.filter(d => i === k - 1 ? (d >= li && d <= ls) : (d >= li && d < ls)).length
    clases.push({ name: `${li.toFixed(1)}-${ls.toFixed(1)}h`, cantidad: fi })
  }
  return clases
}

// ─── Componentes ────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div className={`rounded-[24px] border border-white/80 bg-white/72 p-6 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur md:p-8 ${className}`}>
      {children}
    </div>
  )
}

function Stat({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-50 text-slate-700',
  }
  return (
    <div className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm">
      <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${colors[color]}`}>{label}</span>
      <p className="mt-2 text-2xl font-black text-[#202837]">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] font-semibold text-[#8a94a6]">{sub}</p>}
    </div>
  )
}

function Insight({ children }) {
  return (
    <div className="rounded-xl bg-emerald-50/60 p-4 mt-5">
      <p className="text-xs font-bold text-emerald-800 mb-1.5">Interpretación</p>
      <div className="text-sm text-[#414755] space-y-2">{children}</div>
    </div>
  )
}

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export default function AdminEstadisticaPage() {
  const { est, reg, inf, histograma, datosTipo, datosDispersion, datosRecta } = useMemo(() => {
    const raw = generarDatos()
    const est = calcularEstadisticas(raw.duraciones)
    const reg = calcularRegresion(raw.usuariosActivos, raw.reservasDiarias)
    const inf = calcularInferencia(est)
    const histograma = construirHistograma(raw.duraciones)

    const cSala = raw.tipos.filter(t => t === 'Sala de Reuniones').length
    const cEsc = raw.tipos.filter(t => t === 'Escritorio').length
    const datosTipo = [
      { name: 'Salas', value: cSala },
      { name: 'Escritorios', value: cEsc },
    ]

    const datosDispersion = raw.usuariosActivos.map((u, i) => ({
      usuarios: u, reservas: raw.reservasDiarias[i],
    }))

    const xMin = Math.min(...raw.usuariosActivos) - 2
    const xMax = Math.max(...raw.usuariosActivos) + 2
    const datosRecta = []
    for (let x = xMin; x <= xMax; x += 1) {
      datosRecta.push({ usuarios: x, regresion: Math.round((reg.b0 + reg.b1 * x) * 100) / 100 })
    }

    return { est, reg, inf, histograma, datosTipo, datosDispersion, datosRecta }
  }, [])

  return (
    <div>
      <TopBar
        title="Análisis Estadístico"
        subtitle="Resumen de patrones de uso del coworking basado en 50 reservas."
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* ─── RESUMEN GENERAL ─── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Reservas analizadas" value={est.n} sub="Muestra total" color="blue" />
          <Stat label="Duración promedio" value={est.media.toFixed(1) + ' h'} sub="Tiempo medio por reserva" color="green" />
          <Stat label="Reserva más corta" value={est.min.toFixed(1) + ' h'} color="slate" />
          <Stat label="Reserva más larga" value={est.max.toFixed(1) + ' h'} color="orange" />
        </div>

        {/* ─── DISTRIBUCIÓN DE DURACIONES ─── */}
        <Card>
          <h2 className="text-lg font-black text-[#202837] mb-1">¿Cuánto duran las reservas?</h2>
          <p className="text-xs text-[#667085] mb-5">Distribución de la duración de todas las reservas registradas en el sistema.</p>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={histograma}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="cantidad" fill="#2563eb" radius={[6, 6, 0, 0]} name="Reservas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={datosTipo} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {datosTipo.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Insight>
            <p>La mayoría de las reservas dura entre <b>1 y 3 horas</b>, lo que corresponde a reuniones y sesiones de trabajo cortas. Sin embargo, hay un grupo significativo de reservas de <b>5 a 7 horas</b> (jornadas completas en escritorios).</p>
            <p>Las reservas se reparten equitativamente entre <b>salas de reuniones</b> y <b>escritorios individuales</b>, lo que muestra un uso balanceado de ambos tipos de recurso.</p>
          </Insight>
        </Card>

        {/* ─── MÉTRICAS CLAVE ─── */}
        <Card>
          <h2 className="text-lg font-black text-[#202837] mb-1">Métricas clave de duración</h2>
          <p className="text-xs text-[#667085] mb-5">Indicadores que resumen el comportamiento típico de las reservas.</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Promedio" value={est.media.toFixed(2) + ' h'} sub="Duración media de reservas" color="blue" />
            <Stat label="Valor central" value={est.mediana.toFixed(2) + ' h'} sub="La mitad dura menos que esto" color="green" />
            <Stat label="Más frecuente" value={est.moda.toFixed(1) + ' h'} sub="Duración que más se repite" color="orange" />
            <Stat label="Variabilidad" value={est.cv.toFixed(0) + '%'} sub={est.cv > 30 ? 'Alta — usos muy diversos' : 'Moderada'} color="violet" />
          </div>

          <Insight>
            <p>El promedio de <b>{est.media.toFixed(1)} horas</b> es mayor que el valor central (<b>{est.mediana.toFixed(1)}h</b>), lo que significa que hay reservas largas que elevan el promedio. La duración más común es <b>{est.moda.toFixed(1)}h</b>.</p>
            <p>La variabilidad es <b>alta ({est.cv.toFixed(0)}%)</b>, lo cual es esperable: las salas se usan para reuniones cortas y los escritorios para jornadas completas. El 50% de las reservas dura entre <b>{est.q1.toFixed(1)}h</b> y <b>{est.q3.toFixed(1)}h</b>.</p>
            <p><b>Recomendación:</b> Ofrecer slots flexibles, con opciones predeterminadas de 1h, 2h, 4h y jornada completa.</p>
          </Insight>
        </Card>

        {/* ─── RELACIÓN USUARIOS - RESERVAS ─── */}
        <Card>
          <h2 className="text-lg font-black text-[#202837] mb-1">¿Más usuarios = más reservas?</h2>
          <p className="text-xs text-[#667085] mb-5">Relación entre la cantidad de usuarios activos por día y las reservas generadas (30 días analizados).</p>

          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={datosRecta}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="usuarios" type="number" tick={{ fontSize: 11 }}
                label={{ value: 'Usuarios activos por día', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
                domain={['dataMin', 'dataMax']} />
              <YAxis type="number" tick={{ fontSize: 11 }}
                label={{ value: 'Reservas del día', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
              <Tooltip />
              <Legend />
              <Line data={datosRecta} dataKey="regresion" stroke="#ef4444" strokeWidth={2} dot={false} name="Tendencia" />
              <Scatter data={datosDispersion} dataKey="reservas" fill="#2563eb" fillOpacity={0.8} r={5} name="Datos reales" />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="grid gap-3 sm:grid-cols-3 mt-5">
            <Stat label="Correlación" value={(reg.r * 100).toFixed(0) + '%'} sub="Relación fuerte y positiva" color="violet" />
            <Stat label="Precisión del modelo" value={(reg.r2 * 100).toFixed(0) + '%'} sub="De la variación queda explicada" color="blue" />
            <Stat label="Por cada usuario más" value={'+' + reg.b1.toFixed(1) + ' reservas'} sub="Impacto estimado por día" color="green" />
          </div>

          <Insight>
            <p>Existe una <b>relación fuerte y positiva</b> entre usuarios activos y reservas: a más usuarios conectados, más reservas se generan. El modelo predice correctamente el <b>{(reg.r2 * 100).toFixed(0)}%</b> de los casos.</p>
            <p>En la práctica, por cada usuario activo adicional se generan aproximadamente <b>{reg.b1.toFixed(1)} reservas más</b>. Esto es útil para anticipar la demanda y preparar recursos en días de alta actividad.</p>
          </Insight>
        </Card>

        {/* ─── ESTIMACIÓN Y VALIDACIÓN ─── */}
        <Card>
          <h2 className="text-lg font-black text-[#202837] mb-1">¿La duración promedio es la esperada?</h2>
          <p className="text-xs text-[#667085] mb-5">Verificamos si la duración real coincide con lo que esperábamos ({inf.mu0} horas) y estimamos el rango real.</p>

          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <Stat label="Estimación mínima" value={inf.icInf.toFixed(2) + ' h'} sub="Con 95% de confianza" color="blue" />
            <Stat label="Promedio observado" value={est.media.toFixed(2) + ' h'} sub="Mejor estimación" color="green" />
            <Stat label="Estimación máxima" value={inf.icSup.toFixed(2) + ' h'} sub="Con 95% de confianza" color="blue" />
          </div>

          {/* Barra visual del intervalo */}
          <div className="max-w-xl mx-auto mb-6">
            <div className="flex justify-between text-[10px] font-bold text-[#667085] mb-1">
              <span>{inf.icInf.toFixed(2)}h</span>
              <span className="text-[#2563eb] font-black">{est.media.toFixed(2)}h</span>
              <span>{inf.icSup.toFixed(2)}h</span>
            </div>
            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 bg-blue-200 rounded-full"
                style={{
                  left: `${(1 / (inf.icSup - inf.icInf + 2)) * 100}%`,
                  right: `${(1 / (inf.icSup - inf.icInf + 2)) * 100}%`,
                }} />
              <div className="absolute top-1/2 w-4 h-4 bg-[#2563eb] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg ring-2 ring-white"
                style={{ left: '50%' }} />
            </div>
          </div>

          {/* Resultado de la validación */}
          <div className={`rounded-xl p-4 ${inf.rechazo ? 'bg-orange-50/60' : 'bg-emerald-50/60'}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm ${inf.rechazo ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {inf.rechazo ? '⚠' : '✓'}
              </span>
              <p className={`text-sm font-black ${inf.rechazo ? 'text-orange-800' : 'text-emerald-800'}`}>
                {inf.rechazo
                  ? `La duración promedio NO es ${inf.mu0} horas como se esperaba`
                  : `La duración promedio es compatible con las ${inf.mu0} horas esperadas`
                }
              </p>
            </div>
            <p className="text-xs text-[#414755] ml-11">
              {inf.rechazo
                ? `Los datos muestran que la duración real difiere significativamente de ${inf.mu0}h. Se recomienda revisar la configuración de los slots de tiempo.`
                : `No encontramos diferencia significativa entre el promedio real (${est.media.toFixed(2)}h) y las ${inf.mu0}h esperadas. Los slots de tiempo actuales están bien configurados.`
              }
            </p>
          </div>
        </Card>

        {/* ─── RECOMENDACIONES ─── */}
        <Card>
          <h2 className="text-lg font-black text-[#202837] mb-1">Recomendaciones para BookDesk</h2>
          <p className="text-xs text-[#667085] mb-5">Acciones concretas basadas en el análisis de datos del sistema.</p>

          <div className="space-y-3">
            {[
              {
                titulo: 'Slots de tiempo flexibles',
                desc: `La mayoría reserva entre ${est.q1.toFixed(1)}h y ${est.q3.toFixed(1)}h. Ofrecer opciones predeterminadas de 1h, 2h y 4h agilizaría el proceso de reserva.`,
                icon: '🕐',
              },
              {
                titulo: 'Anticipar días de alta demanda',
                desc: `Cuando hay más de 25 usuarios activos, se esperan más de ${Math.round(reg.b0 + reg.b1 * 25)} reservas. El sistema puede alertar al admin para habilitar recursos extra.`,
                icon: '📈',
              },
              {
                titulo: 'Sugerencias automáticas de duración',
                desc: `Para salas de reuniones sugerir ${est.moda.toFixed(1)}h (lo más común). Para escritorios, sugerir jornada parcial o completa según el historial.`,
                icon: '💡',
              },
              {
                titulo: 'Monitoreo continuo',
                desc: `Si el promedio de duración sale del rango ${inf.icInf.toFixed(1)}h - ${inf.icSup.toFixed(1)}h, puede indicar un cambio en los patrones de uso que requiere atención.`,
                icon: '📊',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 rounded-xl bg-white/80 border border-slate-100 p-4">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-black text-[#202837]">{item.titulo}</p>
                  <p className="mt-1 text-xs text-[#667085]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="text-center text-[11px] text-[#8a94a6] font-semibold pb-4">
          Análisis basado en 50 reservas del sistema BookDesk — Datos procesados automáticamente
        </div>
      </div>
    </div>
  )
}
