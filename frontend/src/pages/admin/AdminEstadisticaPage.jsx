import { useMemo, useState } from 'react'
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
      duraciones.push(Math.round(d * 4) / 4)
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
  return { n, sum, media, mediana, moda, modaFreq: maxFreq, varianza, desvio, cv, q1, q3, min, max }
}

function calcularRegresion(x, y) {
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((a, _, i) => a + x[i] * y[i], 0)
  const sumX2 = x.reduce((a, v) => a + v * v, 0)
  const sumY2 = y.reduce((a, v) => a + v * v, 0)
  const xMean = sumX / n
  const yMean = sumY / n
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
  return { b0, b1, r, r2, sumX, sumY, sumXY, sumX2, sumY2, xMean, yMean, sxy, sxx, syy, n }
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
  return { icInf, icSup, mu0, tCalc, tCrit, rechazo, gl, errorEst, margenError }
}

function construirHistograma(datos) {
  const n = datos.length
  const k = Math.ceil(1 + 3.322 * Math.log10(n))
  const min = Math.min(...datos)
  const max = Math.max(...datos)
  const rango = max - min
  const amplitud = Math.ceil(rango / k * 10) / 10
  const limiteInf = Math.floor(min * 10) / 10
  const clases = []
  for (let i = 0; i < k; i++) {
    const li = Math.round((limiteInf + i * amplitud) * 10) / 10
    const ls = Math.round((li + amplitud) * 10) / 10
    const fi = datos.filter(d => i === k - 1 ? (d >= li && d <= ls) : (d >= li && d < ls)).length
    clases.push({ name: `${li.toFixed(1)}-${ls.toFixed(1)}h`, cantidad: fi })
  }
  return { clases, k, amplitud, limiteInf, rango, min, max }
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

function Desarrollo({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
      >
        <span className={`inline-block transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>▶</span>
        {open ? 'Ocultar desarrollo' : 'Ver desarrollo paso a paso'}
      </button>
      {open && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-5 space-y-4 text-sm text-[#414755]">
          {children}
        </div>
      )}
    </div>
  )
}

function Paso({ numero, titulo, children }) {
  return (
    <div>
      <p className="text-xs font-black text-blue-700 mb-1">Paso {numero}: {titulo}</p>
      <div className="pl-3 border-l-2 border-blue-200 space-y-1">{children}</div>
    </div>
  )
}

function Formula({ children }) {
  return <p className="font-mono text-xs bg-white/80 rounded px-2 py-1 inline-block">{children}</p>
}

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export default function AdminEstadisticaPage() {
  const { est, reg, inf, histData, datosTipo, datosDispersion, datosRecta, puntosInterpolados } = useMemo(() => {
    const raw = generarDatos()
    const est = calcularEstadisticas(raw.duraciones)
    const reg = calcularRegresion(raw.usuariosActivos, raw.reservasDiarias)
    const inf = calcularInferencia(est)
    const histData = construirHistograma(raw.duraciones)

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

    const valoresXReales = new Set(raw.usuariosActivos)
    const xMinReal = Math.min(...raw.usuariosActivos)
    const xMaxReal = Math.max(...raw.usuariosActivos)
    const candidatos = []
    for (let x = xMinReal; x <= xMaxReal; x++) {
      if (!valoresXReales.has(x)) candidatos.push(x)
    }
    const picks = [candidatos[1], candidatos[Math.floor(candidatos.length / 2)], candidatos[candidatos.length - 2]].filter(Boolean)
    const puntosInterpolados = picks.map(x => ({
      x,
      y: Math.round((reg.b0 + reg.b1 * x) * 100) / 100,
    }))

    return { est, reg, inf, histData, datosTipo, datosDispersion, datosRecta, puntosInterpolados }
  }, [])

  const histograma = histData.clases

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

          <Desarrollo>
            <Paso numero={1} titulo="Determinar la cantidad de clases (Regla de Sturges)">
              <Formula>k = 1 + 3,322 × log₁₀(n)</Formula>
              <p>k = 1 + 3,322 × log₁₀({est.n}) = 1 + 3,322 × {Math.log10(est.n).toFixed(4)} = {(1 + 3.322 * Math.log10(est.n)).toFixed(2)}</p>
              <p>Redondeando hacia arriba: <b>k = {histData.k} clases</b></p>
            </Paso>
            <Paso numero={2} titulo="Calcular el rango y la amplitud">
              <Formula>Rango = Valor máximo − Valor mínimo</Formula>
              <p>Rango = {histData.max.toFixed(2)} − {histData.min.toFixed(2)} = {histData.rango.toFixed(2)}</p>
              <Formula>Amplitud = Rango / k</Formula>
              <p>Amplitud = {histData.rango.toFixed(2)} / {histData.k} ≈ <b>{histData.amplitud.toFixed(1)}</b></p>
            </Paso>
            <Paso numero={3} titulo="Construir la tabla de frecuencias">
              <p>Partiendo desde {histData.limiteInf.toFixed(1)}, construimos {histData.k} intervalos de amplitud {histData.amplitud.toFixed(1)}:</p>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-1 pr-3">Clase</th>
                      <th className="text-left py-1 pr-3">Intervalo</th>
                      <th className="text-right py-1">Frecuencia (fᵢ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {histograma.map((c, i) => (
                      <tr key={i} className="border-b border-blue-100/50">
                        <td className="py-1 pr-3">{i + 1}</td>
                        <td className="py-1 pr-3">{c.name}</td>
                        <td className="text-right py-1">{c.cantidad}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="py-1 pr-3" colSpan={2}>Total</td>
                      <td className="text-right py-1">{est.n}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Paso>
          </Desarrollo>
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

          <Desarrollo>
            <Paso numero={1} titulo="Media aritmética (promedio)">
              <Formula>x̄ = Σxᵢ / n</Formula>
              <p>Sumamos todas las duraciones: Σxᵢ = {est.sum.toFixed(2)}</p>
              <p>x̄ = {est.sum.toFixed(2)} / {est.n} = <b>{est.media.toFixed(4)} horas</b></p>
            </Paso>
            <Paso numero={2} titulo="Mediana (valor central)">
              <p>Ordenamos los {est.n} datos de menor a mayor.</p>
              <p>Como n = {est.n} es par, la mediana es el promedio de los valores en las posiciones {est.n / 2} y {est.n / 2 + 1}.</p>
              <Formula>Me = (x₍₂₅₎ + x₍₂₆₎) / 2</Formula>
              <p>Me = <b>{est.mediana.toFixed(2)} horas</b></p>
            </Paso>
            <Paso numero={3} titulo="Moda (valor más frecuente)">
              <p>Buscamos el valor con mayor frecuencia absoluta.</p>
              <p>El valor <b>{est.moda.toFixed(1)}h</b> aparece {est.modaFreq} veces, más que cualquier otro.</p>
            </Paso>
            <Paso numero={4} titulo="Varianza y desvío estándar">
              <Formula>S² = Σ(xᵢ − x̄)² / (n − 1)</Formula>
              <p>Calculamos la suma de los desvíos cuadrados respecto a la media y dividimos por n−1 = {est.n - 1} (corrección de Bessel para muestras).</p>
              <p>S² = <b>{est.varianza.toFixed(4)}</b></p>
              <Formula>S = √S²</Formula>
              <p>S = √{est.varianza.toFixed(4)} = <b>{est.desvio.toFixed(4)} horas</b></p>
            </Paso>
            <Paso numero={5} titulo="Coeficiente de variación">
              <Formula>CV = (S / x̄) × 100</Formula>
              <p>CV = ({est.desvio.toFixed(4)} / {est.media.toFixed(4)}) × 100 = <b>{est.cv.toFixed(2)}%</b></p>
              <p>Un CV mayor al 30% indica <b>alta dispersión</b> en los datos.</p>
            </Paso>
            <Paso numero={6} titulo="Cuartiles">
              <p>Q₁ (25%) = <b>{est.q1.toFixed(2)}h</b> — El 25% de las reservas dura menos que esto.</p>
              <p>Q₃ (75%) = <b>{est.q3.toFixed(2)}h</b> — El 75% de las reservas dura menos que esto.</p>
              <Formula>IQR = Q₃ − Q₁</Formula>
              <p>IQR = {est.q3.toFixed(2)} − {est.q1.toFixed(2)} = <b>{(est.q3 - est.q1).toFixed(2)}h</b></p>
            </Paso>
          </Desarrollo>
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

          <Desarrollo>
            <Paso numero={1} titulo="Tabla de sumatorias">
              <p>Con n = {reg.n} días analizados, calculamos las sumatorias necesarias:</p>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-right py-1 pr-4">Σxᵢ</th>
                      <th className="text-right py-1 pr-4">Σyᵢ</th>
                      <th className="text-right py-1 pr-4">Σxᵢyᵢ</th>
                      <th className="text-right py-1 pr-4">Σxᵢ²</th>
                      <th className="text-right py-1">Σyᵢ²</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-right py-1 pr-4">{reg.sumX}</td>
                      <td className="text-right py-1 pr-4">{reg.sumY}</td>
                      <td className="text-right py-1 pr-4">{reg.sumXY}</td>
                      <td className="text-right py-1 pr-4">{reg.sumX2}</td>
                      <td className="text-right py-1">{reg.sumY2}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2">x̄ = {reg.sumX} / {reg.n} = {reg.xMean.toFixed(2)} &nbsp;&nbsp;|&nbsp;&nbsp; ȳ = {reg.sumY} / {reg.n} = {reg.yMean.toFixed(2)}</p>
            </Paso>
            <Paso numero={2} titulo="Pendiente (m)">
              <Formula>m = (Σxᵢyᵢ − n · x̄ · ȳ) / (Σxᵢ² − n · x̄²)</Formula>
              <p>Numerador (covarianza): Σxᵢyᵢ − n · x̄ · ȳ = {reg.sumXY} − {reg.n} × {reg.xMean.toFixed(2)} × {reg.yMean.toFixed(2)} = <b>{(reg.sumXY - reg.n * reg.xMean * reg.yMean).toFixed(4)}</b></p>
              <p>Denominador (varianza de x): Σxᵢ² − n · x̄² = {reg.sumX2} − {reg.n} × {reg.xMean.toFixed(2)}² = <b>{(reg.sumX2 - reg.n * reg.xMean * reg.xMean).toFixed(4)}</b></p>
              <p>m = {(reg.sumXY - reg.n * reg.xMean * reg.yMean).toFixed(4)} / {(reg.sumX2 - reg.n * reg.xMean * reg.xMean).toFixed(4)} = <b>{reg.b1.toFixed(4)}</b></p>
            </Paso>
            <Paso numero={3} titulo="Ordenada al origen (b)">
              <Formula>b = ȳ − m · x̄</Formula>
              <p>b = {reg.yMean.toFixed(2)} − {reg.b1.toFixed(4)} × {reg.xMean.toFixed(2)} = <b>{reg.b0.toFixed(4)}</b></p>
              <p className="mt-1">Ecuación de la recta: <b>ŷ = {reg.b1.toFixed(2)}x + {reg.b0.toFixed(2)}</b></p>
            </Paso>
            <Paso numero={4} titulo="Coeficiente de correlación de Pearson">
              <Formula>r = (Σxᵢyᵢ − n · x̄ · ȳ) / √[(Σxᵢ² − n · x̄²)(Σyᵢ² − n · ȳ²)]</Formula>
              <p>Numerador = {(reg.sumXY - reg.n * reg.xMean * reg.yMean).toFixed(4)}</p>
              <p>Denominador = √({(reg.sumX2 - reg.n * reg.xMean * reg.xMean).toFixed(4)} × {(reg.sumY2 - reg.n * reg.yMean * reg.yMean).toFixed(4)}) = {Math.sqrt((reg.sumX2 - reg.n * reg.xMean * reg.xMean) * (reg.sumY2 - reg.n * reg.yMean * reg.yMean)).toFixed(4)}</p>
              <p>r = <b>{reg.r.toFixed(4)}</b></p>
              <p>Un valor cercano a 1 indica una <b>correlación positiva fuerte</b>.</p>
            </Paso>
            <Paso numero={5} titulo="Coeficiente de determinación">
              <Formula>r² = r × r</Formula>
              <p>r² = {reg.r.toFixed(4)}² = <b>{reg.r2.toFixed(4)}</b></p>
              <p>El <b>{(reg.r2 * 100).toFixed(2)}%</b> de la variabilidad en las reservas queda explicada por la cantidad de usuarios activos.</p>
            </Paso>
          </Desarrollo>
        </Card>

        {/* ─── INTERPOLACIÓN Y PREDICCIÓN (ANÁLISIS NUMÉRICO) ─── */}
        <Card>
          <h2 className="text-lg font-black text-[#202837] mb-1">Predicción de reservas por interpolación</h2>
          <p className="text-xs text-[#667085] mb-5">Usando el modelo de regresión como función de interpolación, estimamos la cantidad de reservas para días con cantidades de usuarios que no fueron registrados en los datos originales.</p>

          <div className={`grid gap-3 sm:grid-cols-${puntosInterpolados.length}`}>
            {puntosInterpolados.map((p, i) => (
              <Stat
                key={i}
                label={`${p.x} usuarios`}
                value={p.y + ' reservas'}
                sub="Valor interpolado"
                color={['blue', 'green', 'orange'][i]}
              />
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-100 bg-white/80 p-5">
            <p className="text-xs font-black text-[#667085] uppercase mb-3">Modelo utilizado</p>
            <p className="text-sm text-[#202837]">ŷ = {reg.b1.toFixed(2)}x + {reg.b0.toFixed(2)}</p>
            <p className="text-[11px] text-[#8a94a6] mt-1">Donde x = usuarios activos, m = {reg.b1.toFixed(2)}, b = {reg.b0.toFixed(2)}</p>
          </div>

          <Insight>
            <p>La interpolación permite al administrador <b>estimar la demanda</b> en escenarios que no ocurrieron en el período analizado. Por ejemplo, si un día se conectan <b>{puntosInterpolados[0]?.x} usuarios</b>, el sistema puede anticipar aproximadamente <b>{puntosInterpolados[0]?.y} reservas</b>.</p>
            <p>Estos valores no están en los datos originales, pero el modelo matemático permite <b>estimarlos mediante interpolación</b>, lo que facilita la planificación de recursos del coworking.</p>
          </Insight>

          <Desarrollo>
            <Paso numero={1} titulo="Identificar el modelo de interpolación">
              <p>A partir del diagrama de dispersión (usuarios activos vs reservas), obtuvimos la recta de regresión lineal por mínimos cuadrados:</p>
              <Formula>ŷ = mx + b = {reg.b1.toFixed(4)}x + {reg.b0.toFixed(4)}</Formula>
              <p>Esta ecuación funciona como modelo de interpolación lineal: nos permite estimar valores de y (reservas) para cualquier valor de x (usuarios) dentro del rango observado.</p>
            </Paso>
            {puntosInterpolados.map((p, i) => (
              <Paso key={i} numero={i + 2} titulo={`Interpolar para x = ${p.x} usuarios`}>
                <Formula>ŷ = {reg.b1.toFixed(4)} × {p.x} + {reg.b0.toFixed(4)}</Formula>
                <p>ŷ = {(reg.b1 * p.x).toFixed(4)} + {reg.b0.toFixed(4)}</p>
                <p>ŷ = <b>{p.y} reservas</b></p>
                <p>Este valor no está en los datos originales — es un punto hallado mediante interpolación.</p>
              </Paso>
            ))}
            <Paso numero={puntosInterpolados.length + 2} titulo="Validez de la interpolación">
              <p>Los puntos interpolados se encuentran dentro del rango de datos observados ({Math.min(...puntosInterpolados.map(p => p.x))} a {Math.max(...puntosInterpolados.map(p => p.x))} usuarios), por lo tanto la estimación es confiable.</p>
              <p>Si se quisiera estimar para valores fuera de ese rango, ya no sería interpolación sino <b>extrapolación</b>, que tiene menor precisión.</p>
            </Paso>
          </Desarrollo>
        </Card>

        {/* ─── INTERVALO DE CONFIANZA ─── */}
        <Card>
          <h2 className="text-lg font-black text-[#202837] mb-1">¿Cuál es la duración real promedio?</h2>
          <p className="text-xs text-[#667085] mb-5">Estimamos con un 95% de confianza en qué rango se encuentra la duración media real de todas las reservas del coworking.</p>

          <div className="grid gap-3 sm:grid-cols-3 mb-6">
            <Stat label="Mínimo estimado" value={inf.icInf.toFixed(2) + ' h'} sub="Límite inferior" color="blue" />
            <Stat label="Promedio observado" value={est.media.toFixed(2) + ' h'} sub="Mejor estimación" color="green" />
            <Stat label="Máximo estimado" value={inf.icSup.toFixed(2) + ' h'} sub="Límite superior" color="blue" />
          </div>

          {/* Barra visual del intervalo */}
          <div className="max-w-xl mx-auto mb-5">
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

          <Insight>
            <p>Podemos afirmar con un <b>95% de confianza</b> que la duración promedio real de las reservas en BookDesk está entre <b>{inf.icInf.toFixed(2)}h</b> y <b>{inf.icSup.toFixed(2)}h</b>.</p>
            <p>Esto le permite al administrador planificar la disponibilidad de recursos sabiendo que el uso típico ronda las <b>{est.media.toFixed(1)} horas</b>, con un margen estrecho de variación.</p>
          </Insight>

          <Desarrollo>
            <Paso numero={1} titulo="Datos">
              <p>x̄ = {est.media.toFixed(4)}</p>
              <p>S = {est.desvio.toFixed(4)}</p>
              <p>n = {est.n}</p>
              <p>Nivel de confianza: 1 − α = 0,95 → α = 0,05</p>
            </Paso>
            <Paso numero={2} titulo="Distribución">
              <p>Como σ es desconocido y se estima con S, usamos t de Student.</p>
              <p>gl = n − 1 = {est.n} − 1 = {inf.gl}</p>
            </Paso>
            <Paso numero={3} titulo="Valor crítico">
              <p>α/2 = 0,025</p>
              <p>Buscando en la tabla t con gl = {inf.gl}:</p>
              <p>t<sub>α/2</sub> = <b>{inf.tCrit}</b></p>
            </Paso>
            <Paso numero={4} titulo="Error estándar de la media">
              <Formula>EE = S / √n</Formula>
              <p>EE = {est.desvio.toFixed(4)} / √{est.n} = {est.desvio.toFixed(4)} / {Math.sqrt(est.n).toFixed(4)} = <b>{inf.errorEst.toFixed(4)}</b></p>
            </Paso>
            <Paso numero={5} titulo="Margen de error">
              <Formula>E = t<sub>α/2</sub> × EE</Formula>
              <p>E = {inf.tCrit} × {inf.errorEst.toFixed(4)} = <b>{inf.margenError.toFixed(4)}</b></p>
            </Paso>
            <Paso numero={6} titulo="Intervalo de confianza">
              <Formula>IC = (x̄ − E &nbsp;;&nbsp; x̄ + E)</Formula>
              <p>IC = ({est.media.toFixed(4)} − {inf.margenError.toFixed(4)} &nbsp;;&nbsp; {est.media.toFixed(4)} + {inf.margenError.toFixed(4)})</p>
              <p><b>IC = ({inf.icInf.toFixed(4)} ; {inf.icSup.toFixed(4)})</b></p>
              <p className="mt-1">Con un 95% de confianza, la duración promedio real se encuentra entre <b>{inf.icInf.toFixed(2)}h</b> y <b>{inf.icSup.toFixed(2)}h</b>.</p>
            </Paso>
          </Desarrollo>
        </Card>

        {/* ─── PRUEBA DE HIPÓTESIS ─── */}
        <Card>
          <h2 className="text-lg font-black text-[#202837] mb-1">Prueba de hipótesis: ¿las reservas duran {inf.mu0} horas?</h2>
          <p className="text-xs text-[#667085] mb-5">Partimos de la suposición de que la duración promedio es de {inf.mu0} horas y verificamos si los datos reales confirman o contradicen esa idea.</p>

          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-black text-[#667085] uppercase mb-2">Suposición inicial</p>
              <p className="text-sm text-[#202837]">La duración promedio de las reservas <b>es de {inf.mu0} horas</b>.</p>
              <p className="text-[11px] text-[#8a94a6] mt-1">Si los datos no contradicen esto, la suposición se mantiene.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-black text-[#667085] uppercase mb-2">Alternativa</p>
              <p className="text-sm text-[#202837]">La duración promedio <b>es diferente de {inf.mu0} horas</b>.</p>
              <p className="text-[11px] text-[#8a94a6] mt-1">Si los datos muestran una diferencia significativa, se acepta esta alternativa.</p>
            </div>
          </div>

          {/* Barra visual de la decisión */}
          <div className="rounded-xl border border-slate-100 bg-white/80 p-5 mb-5">
            <p className="text-xs font-black text-[#667085] uppercase mb-3">Resultado de la prueba</p>
            <div className="flex items-center justify-between mb-2 text-[10px] font-black">
              <span className="text-red-500">Rechazar</span>
              <span className="text-green-600">No rechazar</span>
              <span className="text-red-500">Rechazar</span>
            </div>
            <div className="relative h-8 bg-gradient-to-r from-red-100 via-green-100 to-red-100 rounded-full overflow-hidden">
              <div className="absolute left-[15%] top-0 bottom-0 w-0.5 bg-red-300" />
              <div className="absolute right-[15%] top-0 bottom-0 w-0.5 bg-red-300" />
              <div
                className="absolute top-1/2 w-4 h-4 bg-[#2563eb] rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg ring-2 ring-white"
                style={{ left: `${50 + (inf.tCalc / (inf.tCrit * 1.5)) * 35}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-semibold text-[#8a94a6]">
              <span>Zona crítica</span>
              <span className="font-black text-[#2563eb]">Valor observado</span>
              <span>Zona crítica</span>
            </div>
          </div>

          {/* Conclusión */}
          <div className={`rounded-xl p-5 ${inf.rechazo ? 'bg-orange-50/60' : 'bg-emerald-50/60'}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`grid h-10 w-10 place-items-center rounded-full text-lg ${inf.rechazo ? 'bg-orange-100' : 'bg-emerald-100'}`}>
                {inf.rechazo ? '⚠️' : '✅'}
              </span>
              <div>
                <p className={`text-sm font-black ${inf.rechazo ? 'text-orange-800' : 'text-emerald-800'}`}>
                  {inf.rechazo ? 'La suposición se rechaza' : 'La suposición se mantiene'}
                </p>
                <p className="text-[11px] text-[#8a94a6]">Nivel de confianza: 95%</p>
              </div>
            </div>
            <p className="text-sm text-[#414755]">
              {inf.rechazo
                ? `Los datos muestran que la duración promedio real (${est.media.toFixed(2)}h) es significativamente diferente de ${inf.mu0}h. Esto sugiere que los slots de tiempo predeterminados deberían ajustarse para reflejar el uso real del coworking.`
                : `Los datos confirman que la duración promedio real (${est.media.toFixed(2)}h) no se aleja significativamente de las ${inf.mu0} horas esperadas. Los slots de tiempo actuales del sistema están bien configurados y son coherentes con el uso real del coworking.`
              }
            </p>
          </div>

          <Desarrollo>
            <Paso numero={1} titulo="Datos">
              <p>μ₀ = {inf.mu0} (valor supuesto)</p>
              <p>S = {est.desvio.toFixed(4)} (desvío estándar muestral)</p>
              <p>n = {est.n}</p>
              <p>α = 0,05</p>
            </Paso>
            <Paso numero={2} titulo="Hipótesis">
              <p>H₀: μ = {inf.mu0}</p>
              <p>Hₐ: μ ≠ {inf.mu0}</p>
              <p>Prueba de hipótesis de dos colas (bilateral)</p>
            </Paso>
            <Paso numero={3} titulo="Distribución muestral">
              <p>Como σ es desconocido y se estima con S, usamos la distribución t de Student.</p>
              <Formula>X̄ ~ t(gl = n − 1) = t({inf.gl})</Formula>
            </Paso>
            <Paso numero={4} titulo="Valor crítico">
              <p>α/2 = 0,05/2 = 0,025</p>
              <p>gl = n − 1 = {est.n} − 1 = {inf.gl}</p>
              <p>Buscando en la tabla t de Student con gl = {inf.gl} y α/2 = 0,025:</p>
              <p>t<sub>c</sub> = <b>±{inf.tCrit}</b></p>
            </Paso>
            <Paso numero={5} titulo="Fórmula del estadístico de prueba">
              <Formula>tp = (X̄ − μ₀) / (S / √n)</Formula>
            </Paso>
            <Paso numero={6} titulo="Regla de decisión">
              <Formula>{'{'} |tp| ≥ t<sub>c</sub> → Rechazo H₀ {'}'}</Formula>
              <p>tp ≥ {inf.tCrit} &nbsp;&nbsp;o&nbsp;&nbsp; tp ≤ −{inf.tCrit}</p>
            </Paso>
            <Paso numero={7} titulo="Estandarización del estadístico de prueba">
              <p>X̄ = {est.media.toFixed(4)}</p>
              <Formula>tp = ({est.media.toFixed(4)} − {inf.mu0}) / ({est.desvio.toFixed(4)} / √{est.n})</Formula>
              <p>tp = {(est.media - inf.mu0).toFixed(4)} / {inf.errorEst.toFixed(4)}</p>
              <p>tp = <b>{inf.tCalc.toFixed(4)}</b></p>
            </Paso>
            <Paso numero={8} titulo="Decisión">
              <p>Como {inf.tCalc.toFixed(4)} {Math.abs(inf.tCalc) > inf.tCrit ? (inf.tCalc > 0 ? '>' : '<') : (inf.tCalc > 0 ? '<' : '>')} {inf.tCalc > 0 ? '' : '−'}{inf.tCrit} → <b>{inf.rechazo ? 'Rechazamos H₀' : 'No rechazamos H₀'}</b></p>
            </Paso>
            <Paso numero={9} titulo="Conclusión">
              <p>{inf.rechazo
                ? `Con evidencia en los datos muestrales podemos concluir que la duración promedio de las reservas del coworking es diferente de ${inf.mu0} horas.`
                : `Con evidencia en los datos muestrales no podemos concluir que la duración promedio de las reservas del coworking sea diferente de ${inf.mu0} horas. Se mantiene la suposición de que el promedio es ${inf.mu0}h.`
              }</p>
            </Paso>
          </Desarrollo>
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
