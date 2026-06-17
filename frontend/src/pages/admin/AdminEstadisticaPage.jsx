import { useMemo, useState } from 'react'
import TopBar from '../../components/layout/TopBar'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, ReferenceLine,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area,
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

// ─── Cálculos estadísticos ──────────────────────────────────────────────────
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
  return { b0, b1, r, r2, xMean, yMean }
}

function calcularInferencia(est) {
  const { n, media, desvio } = est
  const gl = n - 1
  const tCrit = 2.0096 // t(0.025, 49)
  const errorEst = desvio / Math.sqrt(n)
  const margenError = tCrit * errorEst
  const icInf = media - margenError
  const icSup = media + margenError

  const mu0 = 3.0
  const tCalc = (media - mu0) / errorEst
  const pValor = tCalc > 0
    ? 2 * (1 - tStudentCDF(Math.abs(tCalc), gl))
    : 2 * tStudentCDF(tCalc, gl)
  const rechazo = Math.abs(tCalc) > tCrit

  return { gl, tCrit, errorEst, margenError, icInf, icSup, mu0, tCalc, pValor, rechazo }
}

function tStudentCDF(t, df) {
  const x = df / (df + t * t)
  return 1 - 0.5 * incompleteBeta(df / 2, 0.5, x)
}

function incompleteBeta(a, b, x) {
  if (x === 0 || x === 1) return x
  const lbeta = lgamma(a + b) - lgamma(a) - lgamma(b)
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta)
  let f = 1, c = 1, d = 1
  for (let i = 0; i <= 200; i++) {
    const m = Math.floor(i / 2)
    let numerator
    if (i === 0) numerator = 1
    else if (i % 2 === 0) numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m))
    else numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1))
    d = 1 + numerator * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d
    c = 1 + numerator / c; if (Math.abs(c) < 1e-30) c = 1e-30
    f *= c * d
    if (Math.abs(c * d - 1) < 1e-8) break
  }
  return front * (f - 1) / a
}

function lgamma(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x, tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015
  for (let j = 0; j < 6; j++) ser += c[j] / ++y
  return -tmp + Math.log(2.5066282746310005 * ser / x)
}

function construirTablaFrecuencias(datos) {
  const n = datos.length
  const k = Math.ceil(1 + 3.322 * Math.log10(n))
  const min = Math.min(...datos)
  const max = Math.max(...datos)
  const rango = max - min
  const amplitud = Math.ceil(rango / k * 10) / 10

  const limiteInf = Math.floor(min * 10) / 10
  const clases = []
  let acum = 0
  for (let i = 0; i < k; i++) {
    const li = Math.round((limiteInf + i * amplitud) * 10) / 10
    const ls = Math.round((li + amplitud) * 10) / 10
    const fi = datos.filter(d => i === k - 1 ? (d >= li && d <= ls) : (d >= li && d < ls)).length
    acum += fi
    clases.push({
      clase: `[${li.toFixed(1)} - ${ls.toFixed(1)})`,
      marca: (li + ls) / 2,
      fi,
      Fi: acum,
      hi: fi / n,
      Hi: acum / n,
      hiPorc: (fi / n * 100),
    })
  }
  return clases
}

// ─── Componentes de sección ─────────────────────────────────────────────────
function Seccion({ numero, titulo, puntos, children }) {
  return (
    <section className="mt-6 rounded-[24px] border border-white/80 bg-white/72 p-6 shadow-[0_22px_60px_rgba(35,55,95,0.08)] backdrop-blur md:p-8">
      <div className="flex items-center gap-3 mb-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#2563eb] text-xs font-black text-white">{numero}</span>
        <h2 className="text-xl font-black text-[#202837]">{titulo}</h2>
        {puntos && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">{puntos} pts</span>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function MetricCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    violet: 'bg-violet-50 text-violet-700',
    slate: 'bg-slate-50 text-slate-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <div className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm">
      <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${colors[color]}`}>{label}</span>
      <p className="mt-2 text-2xl font-black text-[#202837]">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] font-semibold text-[#8a94a6]">{sub}</p>}
    </div>
  )
}

const COLORS_CHART = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

// ─── Página principal ───────────────────────────────────────────────────────
export default function AdminEstadisticaPage() {
  const [seccionActiva, setSeccionActiva] = useState('todos')

  const { datos, est, tablaFreq, reg, inf, datosHistograma, datosTipo, datosDispersion, datosRecta } = useMemo(() => {
    const raw = generarDatos()
    const est = calcularEstadisticas(raw.duraciones)
    const tablaFreq = construirTablaFrecuencias(raw.duraciones)
    const reg = calcularRegresion(raw.usuariosActivos, raw.reservasDiarias)
    const inf = calcularInferencia(est)

    const datosHistograma = tablaFreq.map(c => ({
      name: c.marca.toFixed(1) + 'h',
      frecuencia: c.fi,
      acumulado: Math.round(c.Hi * 100),
    }))

    const cSala = raw.tipos.filter(t => t === 'Sala de Reuniones').length
    const cEsc = raw.tipos.filter(t => t === 'Escritorio').length
    const datosTipo = [
      { name: 'Sala de Reuniones', value: cSala },
      { name: 'Escritorio', value: cEsc },
    ]

    const datosDispersion = raw.usuariosActivos.map((u, i) => ({
      usuarios: u,
      reservas: raw.reservasDiarias[i],
    }))

    const xMin = Math.min(...raw.usuariosActivos) - 2
    const xMax = Math.max(...raw.usuariosActivos) + 2
    const datosRecta = [
      { usuarios: xMin, prediccion: reg.b0 + reg.b1 * xMin },
      { usuarios: xMax, prediccion: reg.b0 + reg.b1 * xMax },
    ]

    return { datos: raw, est, tablaFreq, reg, inf, datosHistograma, datosTipo, datosDispersion, datosRecta }
  }, [])

  const secciones = [
    { id: 'todos', label: 'Todo' },
    { id: 'recoleccion', label: '1. Datos' },
    { id: 'descriptiva', label: '2. Descriptiva' },
    { id: 'regresion', label: '3. Regresión' },
    { id: 'inferencial', label: '4. Inferencial' },
    { id: 'integracion', label: '5. Integración' },
  ]

  const mostrar = (id) => seccionActiva === 'todos' || seccionActiva === id

  return (
    <div>
      <TopBar
        title="Análisis Estadístico"
        subtitle="Trabajo Integrador — Probabilidad y Estadística"
      />

      <div className="p-4 md:p-8">
        {/* Nav de secciones */}
        <div className="flex flex-wrap gap-2 mb-2">
          {secciones.map(s => (
            <button
              key={s.id}
              onClick={() => setSeccionActiva(s.id)}
              className={`rounded-full px-4 py-2 text-xs font-black transition-all ${
                seccionActiva === s.id
                  ? 'bg-[#2563eb] text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]'
                  : 'bg-white/70 text-[#667085] hover:bg-white hover:text-[#202837]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ─── 1. RECOLECCIÓN ─── */}
        {mostrar('recoleccion') && (
          <Seccion numero="1" titulo="Recolección y Organización de Datos" puntos="2">
            <div className="rounded-xl bg-blue-50/60 p-4 mb-5">
              <p className="text-sm font-bold text-[#202837]">Variable identificada: <span className="text-[#2563eb]">Duración de las reservas (horas)</span></p>
              <p className="mt-1 text-xs text-[#667085]">Variable cuantitativa continua — {est.n} observaciones del sistema BookDesk. La duración de cada reserva es un indicador clave para la gestión eficiente de salas y escritorios del coworking.</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-black text-[#414755] mb-3">Histograma de duraciones</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={datosHistograma}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="frecuencia" fill="#2563eb" radius={[6, 6, 0, 0]} name="Frecuencia" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-sm font-black text-[#414755] mb-3">Distribución por tipo de recurso</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={datosTipo} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {datosTipo.map((_, i) => <Cell key={i} fill={COLORS_CHART[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <h3 className="text-sm font-black text-[#414755] mb-3">Muestra de datos (primeras 10 observaciones)</h3>
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f1f3fe] text-[#667085]">
                  <tr>
                    {['#', 'Tipo de Recurso', 'Duración (h)'].map(h => (
                      <th key={h} className="px-4 py-2.5 font-black uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.duraciones.slice(0, 10).map((d, i) => (
                    <tr key={i} className="border-t border-slate-100 font-semibold text-[#414755]">
                      <td className="px-4 py-2">{i + 1}</td>
                      <td className="px-4 py-2">{datos.tipos[i]}</td>
                      <td className="px-4 py-2 font-black text-[#202837]">{d.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        )}

        {/* ─── 2. ESTADÍSTICA DESCRIPTIVA ─── */}
        {mostrar('descriptiva') && (
          <Seccion numero="2" titulo="Estadística Descriptiva" puntos="3">
            {/* Tabla de frecuencias */}
            <h3 className="text-sm font-black text-[#414755] mb-3">a) Distribución de frecuencias</h3>
            <p className="text-xs text-[#667085] mb-3">Regla de Sturges: k = 1 + 3.322 × log₁₀({est.n}) = {Math.ceil(1 + 3.322 * Math.log10(est.n))} clases</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f1f3fe] text-[#667085]">
                  <tr>
                    {['Clase', 'Marca (xᵢ)', 'fᵢ', 'Fᵢ', 'hᵢ', 'Hᵢ', 'hᵢ%'].map(h => (
                      <th key={h} className="px-3 py-2.5 font-black uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tablaFreq.map((c, i) => (
                    <tr key={i} className="border-t border-slate-100 font-semibold text-[#414755]">
                      <td className="px-3 py-2">{c.clase}</td>
                      <td className="px-3 py-2">{c.marca.toFixed(2)}</td>
                      <td className="px-3 py-2 font-black text-[#202837]">{c.fi}</td>
                      <td className="px-3 py-2">{c.Fi}</td>
                      <td className="px-3 py-2">{c.hi.toFixed(4)}</td>
                      <td className="px-3 py-2">{c.Hi.toFixed(4)}</td>
                      <td className="px-3 py-2">{c.hiPorc.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Histograma con ojiva */}
            <div className="mt-6">
              <h3 className="text-sm font-black text-[#414755] mb-3">Histograma con Ojiva (frecuencia acumulada %)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={datosHistograma}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'Frecuencia (fᵢ)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 110]} tick={{ fontSize: 11 }} label={{ value: 'Acumulado %', angle: 90, position: 'insideRight', style: { fontSize: 11 } }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="frecuencia" fill="#2563eb" radius={[6, 6, 0, 0]} name="Frecuencia absoluta" />
                  <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="% Acumulado" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Medidas estadísticas */}
            <h3 className="text-sm font-black text-[#414755] mt-6 mb-3">b) Medidas estadísticas</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Media (x̄)" value={est.media.toFixed(2) + ' h'} sub="Tendencia central" color="blue" />
              <MetricCard label="Mediana (Me)" value={est.mediana.toFixed(2) + ' h'} sub="Valor central" color="green" />
              <MetricCard label="Moda (Mo)" value={est.moda.toFixed(2) + ' h'} sub={`Frecuencia: ${est.modaFreq}`} color="orange" />
              <MetricCard label="Desvío (s)" value={est.desvio.toFixed(2) + ' h'} sub="Dispersión estándar" color="violet" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-3">
              <MetricCard label="Varianza (s²)" value={est.varianza.toFixed(4)} sub="Dispersión cuadrática" color="slate" />
              <MetricCard label="CV" value={est.cv.toFixed(2) + '%'} sub={est.cv > 30 ? 'Alta dispersión' : est.cv > 15 ? 'Dispersión moderada' : 'Baja dispersión'} color="red" />
              <MetricCard label="Q1" value={est.q1.toFixed(2) + ' h'} sub="Primer cuartil (25%)" color="blue" />
              <MetricCard label="Q3" value={est.q3.toFixed(2) + ' h'} sub="Tercer cuartil (75%)" color="blue" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
              <MetricCard label="Mínimo" value={est.min.toFixed(2) + ' h'} color="slate" />
              <MetricCard label="Máximo" value={est.max.toFixed(2) + ' h'} color="slate" />
              <MetricCard label="Rango" value={(est.max - est.min).toFixed(2) + ' h'} color="slate" />
            </div>

            {/* Interpretación */}
            <div className="mt-6 rounded-xl bg-emerald-50/60 p-4">
              <h3 className="text-sm font-black text-emerald-800 mb-2">c) Análisis del comportamiento</h3>
              <ul className="text-xs text-[#414755] space-y-2 list-disc pl-4">
                <li>La duración promedio es <b>{est.media.toFixed(2)}h</b> con mediana <b>{est.mediana.toFixed(2)}h</b>. La media es {est.media > est.mediana ? 'mayor' : 'menor'} que la mediana, indicando asimetría {est.media > est.mediana ? 'positiva (cola a la derecha)' : 'negativa'}.</li>
                <li>El CV = <b>{est.cv.toFixed(1)}%</b> indica alta dispersión, reflejando la diversidad de usos: reuniones breves (salas) vs. jornadas completas (escritorios).</li>
                <li>El 50% central de las reservas dura entre <b>{est.q1.toFixed(2)}h</b> y <b>{est.q3.toFixed(2)}h</b> (RIQ = {(est.q3 - est.q1).toFixed(2)}h).</li>
                <li>BookDesk debería ofrecer slots flexibles de {est.min.toFixed(1)}h a {est.max.toFixed(1)}h, concentrando la oferta alrededor de {est.media.toFixed(1)}h.</li>
              </ul>
            </div>
          </Seccion>
        )}

        {/* ─── 3. REGRESIÓN Y CORRELACIÓN ─── */}
        {mostrar('regresion') && (
          <Seccion numero="3" titulo="Regresión y Correlación" puntos="2">
            <div className="rounded-xl bg-blue-50/60 p-4 mb-5">
              <p className="text-sm font-bold text-[#202837]">X = Usuarios activos/día | Y = Reservas diarias</p>
              <p className="mt-1 text-xs text-[#667085]">Se analiza si existe relación lineal entre la cantidad de usuarios que acceden al sistema y las reservas generadas, para predecir demanda y planificar recursos.</p>
            </div>

            {/* Diagrama de dispersión */}
            <h3 className="text-sm font-black text-[#414755] mb-3">a) Diagrama de dispersión con recta de regresión</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="usuarios" name="Usuarios activos" type="number" tick={{ fontSize: 11 }}
                  label={{ value: 'Usuarios Activos (X)', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }} />
                <YAxis dataKey="reservas" name="Reservas" type="number" tick={{ fontSize: 11 }}
                  label={{ value: 'Reservas (Y)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={datosDispersion} fill="#2563eb" fillOpacity={0.7} r={5} name="Observaciones" />
                <ReferenceLine
                  segment={datosRecta.map(d => ({ x: d.usuarios, y: d.prediccion }))}
                  stroke="#ef4444" strokeWidth={2}
                />
              </ScatterChart>
            </ResponsiveContainer>

            {/* Ecuación y coeficientes */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Pendiente (b₁)" value={reg.b1.toFixed(4)} sub="Reservas por usuario" color="blue" />
              <MetricCard label="Ordenada (b₀)" value={reg.b0.toFixed(4)} sub="Intersección con Y" color="green" />
              <MetricCard label="r (Pearson)" value={reg.r.toFixed(4)} sub={`Correlación ${Math.abs(reg.r) >= 0.7 ? 'fuerte' : Math.abs(reg.r) >= 0.4 ? 'moderada' : 'débil'} ${reg.r > 0 ? 'positiva' : 'negativa'}`} color="violet" />
              <MetricCard label="r²" value={reg.r2.toFixed(4)} sub={`Explica ${(reg.r2 * 100).toFixed(1)}% de variabilidad`} color="orange" />
            </div>

            <div className="mt-5 rounded-xl bg-violet-50/60 p-4">
              <p className="text-sm font-black text-violet-800 mb-1">b) Ecuación de regresión lineal</p>
              <p className="text-lg font-black text-[#202837] font-mono">ŷ = {reg.b0.toFixed(4)} + {reg.b1.toFixed(4)} · x</p>
              <p className="mt-2 text-xs text-[#414755]">Por cada usuario activo adicional, se esperan aproximadamente <b>{reg.b1.toFixed(2)}</b> reservas más por día.</p>
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50/60 p-4">
              <p className="text-sm font-black text-emerald-800 mb-1">c) Interpretación</p>
              <ul className="text-xs text-[#414755] space-y-1 list-disc pl-4">
                <li>r = {reg.r.toFixed(4)}: correlación <b>{Math.abs(reg.r) >= 0.7 ? 'fuerte' : 'moderada'} positiva</b>.</li>
                <li>r² = {reg.r2.toFixed(4)}: el modelo explica el <b>{(reg.r2 * 100).toFixed(1)}%</b> de la variabilidad en las reservas.</li>
                <li>El modelo es <b>{reg.r2 > 0.5 ? 'útil' : 'limitado'}</b> para predecir reservas a partir de usuarios activos en BookDesk.</li>
              </ul>
            </div>
          </Seccion>
        )}

        {/* ─── 4. ESTADÍSTICA INFERENCIAL ─── */}
        {mostrar('inferencial') && (
          <Seccion numero="4" titulo="Estadística Inferencial" puntos="2">
            {/* Intervalo de confianza */}
            <h3 className="text-sm font-black text-[#414755] mb-3">a) Intervalo de confianza al 95%</h3>
            <div className="rounded-xl bg-blue-50/60 p-4 mb-4">
              <p className="text-xs text-[#667085]">¿Cuál es la duración media real de las reservas en BookDesk?</p>
              <p className="mt-2 text-xs text-[#414755]">
                n = {est.n} | x̄ = {est.media.toFixed(4)}h | s = {est.desvio.toFixed(4)}h | α = 0.05 | gl = {inf.gl} | t<sub>crít</sub> = {inf.tCrit.toFixed(4)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 mb-5">
              <MetricCard label="Límite inferior" value={inf.icInf.toFixed(2) + ' h'} color="blue" />
              <MetricCard label="Media muestral" value={est.media.toFixed(2) + ' h'} sub="Estimación puntual" color="green" />
              <MetricCard label="Límite superior" value={inf.icSup.toFixed(2) + ' h'} color="blue" />
            </div>

            {/* Visual del IC */}
            <div className="relative mx-auto max-w-lg h-16 flex items-center">
              <div className="absolute left-0 right-0 h-2 bg-slate-100 rounded-full" />
              <div
                className="absolute h-2 bg-blue-200 rounded-full"
                style={{
                  left: `${((inf.icInf - (inf.icInf - 1)) / ((inf.icSup + 1) - (inf.icInf - 1))) * 100}%`,
                  right: `${((inf.icSup + 1 - inf.icSup) / ((inf.icSup + 1) - (inf.icInf - 1))) * 100}%`,
                }}
              />
              <div
                className="absolute w-4 h-4 bg-[#2563eb] rounded-full shadow-lg -translate-x-1/2"
                style={{ left: `${((est.media - (inf.icInf - 1)) / ((inf.icSup + 1) - (inf.icInf - 1))) * 100}%` }}
              />
              <div className="absolute left-0 text-[10px] font-bold text-[#667085] -bottom-1">{inf.icInf.toFixed(2)}h</div>
              <div className="absolute right-0 text-[10px] font-bold text-[#667085] -bottom-1">{inf.icSup.toFixed(2)}h</div>
              <div
                className="absolute text-[10px] font-black text-[#2563eb] -top-1 -translate-x-1/2"
                style={{ left: `${((est.media - (inf.icInf - 1)) / ((inf.icSup + 1) - (inf.icInf - 1))) * 100}%` }}
              >
                x̄ = {est.media.toFixed(2)}h
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-emerald-50/60 p-4 mb-6">
              <p className="text-xs text-[#414755]"><b>Interpretación:</b> Con un 95% de confianza, la duración media poblacional de las reservas en BookDesk se encuentra entre <b>{inf.icInf.toFixed(2)}h</b> y <b>{inf.icSup.toFixed(2)}h</b>.</p>
            </div>

            {/* Prueba de hipótesis */}
            <h3 className="text-sm font-black text-[#414755] mb-3">b) Prueba de hipótesis</h3>
            <div className="rounded-xl bg-orange-50/60 p-4 mb-4">
              <p className="text-xs text-[#667085]">¿La duración media es significativamente diferente de {inf.mu0} horas?</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm font-mono text-[#202837]">
                <span>H₀: μ = {inf.mu0}</span>
                <span>H₁: μ ≠ {inf.mu0}</span>
                <span>α = 0.05</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
              <MetricCard label="t calculado" value={inf.tCalc.toFixed(4)} color="blue" />
              <MetricCard label="t crítico" value={'±' + inf.tCrit.toFixed(4)} color="orange" />
              <MetricCard label="p-valor" value={inf.pValor.toFixed(4)} sub={inf.pValor < 0.05 ? 'p < α → Significativo' : 'p > α → No significativo'} color={inf.pValor < 0.05 ? 'red' : 'green'} />
              <MetricCard label="Decisión" value={inf.rechazo ? 'Rechazar H₀' : 'No rechazar H₀'} sub={inf.rechazo ? 'Evidencia suficiente' : 'Evidencia insuficiente'} color={inf.rechazo ? 'red' : 'green'} />
            </div>

            {/* Gráfico visual de la decisión */}
            <div className="rounded-xl border border-slate-100 bg-white/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-red-500 uppercase">Rechazo</span>
                <span className="text-[10px] font-black text-green-500 uppercase">No rechazo</span>
                <span className="text-[10px] font-black text-red-500 uppercase">Rechazo</span>
              </div>
              <div className="relative h-8 bg-gradient-to-r from-red-100 via-green-100 to-red-100 rounded-full overflow-hidden">
                <div className="absolute left-[15%] top-0 bottom-0 w-px bg-red-400" title={`-t_crit = -${inf.tCrit.toFixed(2)}`} />
                <div className="absolute right-[15%] top-0 bottom-0 w-px bg-red-400" title={`+t_crit = ${inf.tCrit.toFixed(2)}`} />
                <div
                  className="absolute top-1/2 w-3 h-3 bg-[#2563eb] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg ring-2 ring-white"
                  style={{ left: `${50 + (inf.tCalc / (inf.tCrit * 1.5)) * 35}%` }}
                  title={`t_calc = ${inf.tCalc.toFixed(4)}`}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-bold text-[#667085]">-{inf.tCrit.toFixed(2)}</span>
                <span className="text-[10px] font-black text-[#2563eb]">t = {inf.tCalc.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-[#667085]">+{inf.tCrit.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-emerald-50/60 p-4">
              <p className="text-sm font-black text-emerald-800 mb-1">c) Interpretación</p>
              <p className="text-xs text-[#414755]">
                {inf.rechazo
                  ? `Con α = 0.05, se rechaza H₀. La duración media difiere significativamente de ${inf.mu0}h. Las políticas de reserva deberían ajustarse.`
                  : `Con α = 0.05, no se rechaza H₀. No hay evidencia de que la duración media difiera de ${inf.mu0}h. La política actual de slots de ${inf.mu0}h es adecuada para BookDesk.`
                }
              </p>
            </div>
          </Seccion>
        )}

        {/* ─── 5. INTEGRACIÓN ─── */}
        {mostrar('integracion') && (
          <Seccion numero="5" titulo="Integración con Ingeniería de Software II" puntos="1">
            <div className="space-y-4">
              {[
                {
                  titulo: 'Gestión de recursos',
                  desc: `La duración media de ${est.media.toFixed(2)}h (CV = ${est.cv.toFixed(1)}%) permite configurar slots óptimos, evitando fragmentación o bloqueos prolongados.`,
                  icon: '📊',
                },
                {
                  titulo: 'Predicción de demanda',
                  desc: `El modelo de regresión (r² = ${reg.r2.toFixed(2)}) permite estimar reservas según usuarios activos. Se puede integrar como módulo predictivo en el dashboard admin.`,
                  icon: '📈',
                },
                {
                  titulo: 'Decisiones basadas en datos',
                  desc: `La prueba de hipótesis proporciona evidencia estadística para validar políticas de reserva. El administrador tiene respaldo cuantitativo.`,
                  icon: '🎯',
                },
                {
                  titulo: 'Mejora continua',
                  desc: `Los intervalos de confianza (${inf.icInf.toFixed(2)}h - ${inf.icSup.toFixed(2)}h) permiten monitorear cambios en el uso del sistema y alertar desviaciones.`,
                  icon: '🔄',
                },
                {
                  titulo: 'Optimización del sistema',
                  desc: `El 50% de reservas dura entre ${est.q1.toFixed(2)}h y ${est.q3.toFixed(2)}h. BookDesk podría sugerir duraciones automáticas según tipo de recurso y patrones históricos.`,
                  icon: '⚡',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 rounded-xl bg-white/80 border border-slate-100 p-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-black text-[#202837]">{item.titulo}</p>
                    <p className="mt-1 text-xs text-[#667085]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Seccion>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-[11px] text-[#8a94a6] font-semibold pb-4">
          Trabajo Integrador — Probabilidad y Estadística — Universidad de la Cuenca del Plata — 2026
        </div>
      </div>
    </div>
  )
}
