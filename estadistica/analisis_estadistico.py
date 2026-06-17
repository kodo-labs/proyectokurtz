"""
Trabajo Integrador - Probabilidad y Estadística
Universidad de la Cuenca del Plata - Facultad de Ingeniería y Tecnología
Carrera: Ingeniería en Sistemas de Información

Proyecto: BookDesk - Sistema de Reservas para Coworking
Variable principal: Duración de las reservas (en horas)
Variables para regresión: Usuarios activos diarios (X) vs Reservas diarias (Y)

Herramientas: Python (numpy, pandas, matplotlib, scipy)
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import seaborn as sns
from scipy import stats
from datetime import datetime, timedelta
import os
import warnings
warnings.filterwarnings('ignore')

sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['font.size'] = 11
plt.rcParams['figure.dpi'] = 150

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'resultados')
os.makedirs(OUTPUT_DIR, exist_ok=True)

np.random.seed(42)

# =============================================================================
# 1. RECOLECCIÓN Y ORGANIZACIÓN DE DATOS (2 puntos)
# =============================================================================
print("=" * 70)
print("1. RECOLECCIÓN Y ORGANIZACIÓN DE DATOS")
print("=" * 70)

print("""
Variable identificada: DURACIÓN DE LAS RESERVAS (en horas)
- Tipo: Variable cuantitativa continua
- Contexto: En el sistema BookDesk, los usuarios reservan salas de reuniones
  y escritorios en un espacio de coworking. La duración de cada reserva es
  un indicador clave para la gestión eficiente de los recursos.
- Relevancia: Conocer la distribución de duraciones permite optimizar la
  disponibilidad de espacios, ajustar políticas de reserva y mejorar la
  planificación del coworking.
""")

n = 50

duraciones = np.concatenate([
    np.random.normal(loc=2.0, scale=0.6, size=20),   # Reuniones cortas (salas)
    np.random.normal(loc=4.0, scale=1.0, size=15),   # Jornadas parciales (escritorios)
    np.random.normal(loc=6.5, scale=0.8, size=10),   # Jornadas completas
    np.random.normal(loc=1.5, scale=0.3, size=5),    # Reservas express
])
duraciones = np.clip(duraciones, 0.5, 8.0)
duraciones = np.round(duraciones, 2)

tipos_recurso = (
    ['Sala de Reuniones'] * 20 +
    ['Escritorio Individual'] * 15 +
    ['Escritorio Individual'] * 10 +
    ['Sala de Reuniones'] * 5
)

fecha_base = datetime(2026, 3, 1)
fechas = [fecha_base + timedelta(days=np.random.randint(0, 90)) for _ in range(n)]
fechas.sort()

df = pd.DataFrame({
    'ID_Reserva': [f'RES-{str(i+1).zfill(3)}' for i in range(n)],
    'Fecha': fechas,
    'Tipo_Recurso': tipos_recurso,
    'Duracion_Horas': duraciones
})

print("Muestra de datos (primeras 10 observaciones):")
print(df.head(10).to_string(index=False))
print(f"\nTotal de observaciones: {len(df)}")
print(f"Rango de fechas: {df['Fecha'].min().strftime('%d/%m/%Y')} - {df['Fecha'].max().strftime('%d/%m/%Y')}")

df.to_csv(os.path.join(OUTPUT_DIR, 'datos_reservas.csv'), index=False, encoding='utf-8-sig')
print("\n[Datos exportados a resultados/datos_reservas.csv]")

# --- Gráfico: Histograma de duraciones ---
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

axes[0].hist(duraciones, bins=10, color='#2196F3', edgecolor='white', alpha=0.85)
axes[0].set_xlabel('Duración (horas)')
axes[0].set_ylabel('Frecuencia absoluta')
axes[0].set_title('Histograma de Duración de Reservas')
axes[0].axvline(np.mean(duraciones), color='red', linestyle='--', label=f'Media = {np.mean(duraciones):.2f} h')
axes[0].legend()

conteo_tipo = df['Tipo_Recurso'].value_counts()
axes[1].bar(conteo_tipo.index, conteo_tipo.values, color=['#2196F3', '#FF9800'], edgecolor='white')
axes[1].set_xlabel('Tipo de Recurso')
axes[1].set_ylabel('Cantidad de Reservas')
axes[1].set_title('Distribución por Tipo de Recurso')
for i, v in enumerate(conteo_tipo.values):
    axes[1].text(i, v + 0.5, str(v), ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, '01_histograma_y_tipo.png'), bbox_inches='tight')
plt.close()
print("[Gráfico guardado: 01_histograma_y_tipo.png]")


# =============================================================================
# 2. ESTADÍSTICA DESCRIPTIVA (3 puntos)
# =============================================================================
print("\n" + "=" * 70)
print("2. ESTADÍSTICA DESCRIPTIVA")
print("=" * 70)

# 2a) Distribución de frecuencias
print("\n--- 2a) Distribución de Frecuencias ---")

num_clases = int(1 + 3.322 * np.log10(n))
print(f"Número de clases (Regla de Sturges): k = 1 + 3.322 * log10({n}) = {num_clases}")

rango = duraciones.max() - duraciones.min()
amplitud = np.ceil(rango / num_clases * 10) / 10
print(f"Rango: {rango:.2f} h")
print(f"Amplitud de clase: {amplitud:.1f} h")

limite_inf = np.floor(duraciones.min() * 10) / 10
bins_freq = [round(limite_inf + i * amplitud, 1) for i in range(num_clases + 1)]
if bins_freq[-1] < duraciones.max():
    bins_freq[-1] = round(duraciones.max() + 0.1, 1)

freq_abs, _ = np.histogram(duraciones, bins=bins_freq)
freq_rel = freq_abs / n
freq_porc = freq_rel * 100
freq_abs_acum = np.cumsum(freq_abs)
freq_rel_acum = np.cumsum(freq_rel)

marcas_clase = [(bins_freq[i] + bins_freq[i+1]) / 2 for i in range(len(bins_freq)-1)]

tabla_freq = pd.DataFrame({
    'Clase': [f'[{bins_freq[i]:.1f} - {bins_freq[i+1]:.1f})' for i in range(len(bins_freq)-1)],
    'Marca de Clase (xi)': [f'{mc:.2f}' for mc in marcas_clase],
    'fi (Frec. Abs.)': freq_abs,
    'Fi (Frec. Abs. Acum.)': freq_abs_acum,
    'hi (Frec. Rel.)': [f'{fr:.4f}' for fr in freq_rel],
    'Hi (Frec. Rel. Acum.)': [f'{fra:.4f}' for fra in freq_rel_acum],
    'hi% (Frec. Porc.)': [f'{fp:.2f}%' for fp in freq_porc],
})

print("\nTabla de Distribución de Frecuencias:")
print(tabla_freq.to_string(index=False))

# --- Gráfico: Histograma con ojiva ---
fig, ax1 = plt.subplots(figsize=(12, 6))
ax1.bar(marcas_clase, freq_abs, width=amplitud * 0.85, color='#2196F3', edgecolor='white', alpha=0.85, label='Frecuencia absoluta')
ax1.set_xlabel('Duración de reserva (horas)')
ax1.set_ylabel('Frecuencia absoluta (fi)', color='#2196F3')
ax1.tick_params(axis='y', labelcolor='#2196F3')

ax2 = ax1.twinx()
ax2.plot(marcas_clase, freq_rel_acum * 100, color='#F44336', marker='o', linewidth=2, label='Ojiva (% acumulado)')
ax2.set_ylabel('Frecuencia relativa acumulada (%)', color='#F44336')
ax2.tick_params(axis='y', labelcolor='#F44336')
ax2.set_ylim(0, 110)

lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')

plt.title('Distribución de Frecuencias y Ojiva - Duración de Reservas')
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, '02_frecuencias_ojiva.png'), bbox_inches='tight')
plt.close()
print("[Gráfico guardado: 02_frecuencias_ojiva.png]")

# 2b) Medidas de tendencia central, posición y dispersión
print("\n--- 2b) Medidas Estadísticas ---")

media = np.mean(duraciones)
mediana = np.median(duraciones)
moda_result = stats.mode(np.round(duraciones, 1), keepdims=True)
moda = moda_result.mode[0]
moda_count = moda_result.count[0]
desvio_std = np.std(duraciones, ddof=1)
varianza = np.var(duraciones, ddof=1)
cv = (desvio_std / media) * 100
q1 = np.percentile(duraciones, 25)
q3 = np.percentile(duraciones, 75)
riq = q3 - q1
minimo = duraciones.min()
maximo = duraciones.max()
rango_val = maximo - minimo

print(f"""
MEDIDAS DE TENDENCIA CENTRAL:
  Media aritmética (x̄):    {media:.4f} horas
  Mediana (Me):             {mediana:.4f} horas
  Moda (Mo):                {moda:.2f} horas (frecuencia: {moda_count})

MEDIDAS DE POSICIÓN:
  Primer cuartil (Q1):      {q1:.4f} horas
  Segundo cuartil (Q2=Me):  {mediana:.4f} horas
  Tercer cuartil (Q3):      {q3:.4f} horas
  Rango intercuartílico:    {riq:.4f} horas

MEDIDAS DE DISPERSIÓN:
  Rango:                    {rango_val:.4f} horas
  Varianza muestral (s²):  {varianza:.4f}
  Desvío estándar (s):     {desvio_std:.4f} horas
  Coeficiente de variación: {cv:.2f}%
""")

asimetria = stats.skew(duraciones)
curtosis = stats.kurtosis(duraciones)
print(f"MEDIDAS DE FORMA:")
print(f"  Coeficiente de asimetría: {asimetria:.4f}", end="")
if asimetria > 0:
    print(" (asimetría positiva - cola hacia la derecha)")
elif asimetria < 0:
    print(" (asimetría negativa - cola hacia la izquierda)")
else:
    print(" (distribución simétrica)")
print(f"  Curtosis:                 {curtosis:.4f}", end="")
if curtosis > 0:
    print(" (leptocúrtica)")
elif curtosis < 0:
    print(" (platicúrtica)")
else:
    print(" (mesocúrtica)")

# --- Gráfico: Boxplot ---
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

bp = axes[0].boxplot(duraciones, vert=True, patch_artist=True,
                     boxprops=dict(facecolor='#2196F3', alpha=0.7),
                     medianprops=dict(color='red', linewidth=2),
                     whiskerprops=dict(linewidth=1.5),
                     capprops=dict(linewidth=1.5))
axes[0].set_ylabel('Duración (horas)')
axes[0].set_title('Diagrama de Caja - Duración de Reservas')
axes[0].set_xticklabels(['Todas las reservas'])
axes[0].axhline(media, color='green', linestyle='--', alpha=0.7, label=f'Media = {media:.2f}')
axes[0].legend()

datos_sala = df[df['Tipo_Recurso'] == 'Sala de Reuniones']['Duracion_Horas']
datos_escr = df[df['Tipo_Recurso'] == 'Escritorio Individual']['Duracion_Horas']
bp2 = axes[1].boxplot([datos_sala, datos_escr], vert=True, patch_artist=True,
                      boxprops=dict(alpha=0.7),
                      medianprops=dict(color='red', linewidth=2))
colors = ['#2196F3', '#FF9800']
for patch, color in zip(bp2['boxes'], colors):
    patch.set_facecolor(color)
axes[1].set_xticklabels(['Sala de Reuniones', 'Escritorio Individual'])
axes[1].set_ylabel('Duración (horas)')
axes[1].set_title('Boxplot por Tipo de Recurso')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, '03_boxplot.png'), bbox_inches='tight')
plt.close()
print("[Gráfico guardado: 03_boxplot.png]")

# 2c) Análisis del comportamiento
print("\n--- 2c) Análisis del Comportamiento ---")
if media > mediana:
    tipo_asimetria = "con asimetría positiva"
elif media < mediana:
    tipo_asimetria = "con asimetría negativa"
else:
    tipo_asimetria = "aproximadamente simétrica"
if cv > 30:
    nivel_dispersion = "alta"
elif cv > 15:
    nivel_dispersion = "moderada"
else:
    nivel_dispersion = "baja"
print(f"""
INTERPRETACIÓN EN EL CONTEXTO DEL PROYECTO BookDesk:

1. La duración promedio de las reservas es de {media:.2f} horas, con una mediana de
   {mediana:.2f} horas. La diferencia entre media y mediana sugiere una distribución
   {tipo_asimetria}.

2. El coeficiente de variación es {cv:.2f}%, lo que indica una dispersión
   {nivel_dispersion} en las duraciones.
   Esto refleja la diversidad de usos del coworking (reuniones breves vs. jornadas completas).

3. El 50% de las reservas tienen una duración entre {q1:.2f} y {q3:.2f} horas
   (rango intercuartílico = {riq:.2f} h).

4. Para el sistema BookDesk, esto sugiere que los slots de reserva deberían
   ofrecer flexibilidad, con opciones desde {minimo:.1f}h hasta {maximo:.1f}h,
   pero concentrando la oferta alrededor de {media:.1f} horas.
""")


# =============================================================================
# 3. REGRESIÓN Y CORRELACIÓN (2 puntos)
# =============================================================================
print("=" * 70)
print("3. REGRESIÓN Y CORRELACIÓN")
print("=" * 70)

print("""
Variables seleccionadas:
  X = Número de usuarios activos por día
  Y = Número de reservas diarias

Contexto: Se analiza si existe una relación lineal entre la cantidad de
usuarios que acceden al sistema BookDesk en un día y la cantidad de
reservas que se generan. Esto permite predecir la demanda de reservas
y planificar la disponibilidad de recursos.
""")

n_dias = 30
usuarios_activos = np.random.randint(5, 35, size=n_dias)
usuarios_activos.sort()

reservas_diarias = (0.6 * usuarios_activos +
                    np.random.normal(0, 2, size=n_dias) +
                    3)
reservas_diarias = np.clip(reservas_diarias, 1, None).astype(int)

df_reg = pd.DataFrame({
    'Dia': range(1, n_dias + 1),
    'Usuarios_Activos_X': usuarios_activos,
    'Reservas_Diarias_Y': reservas_diarias
})

print("Datos bivariados (primeras 10 observaciones):")
print(df_reg.head(10).to_string(index=False))

X = usuarios_activos.astype(float)
Y = reservas_diarias.astype(float)
n_reg = len(X)

x_mean = np.mean(X)
y_mean = np.mean(Y)

Sxy = np.sum((X - x_mean) * (Y - y_mean))
Sxx = np.sum((X - x_mean) ** 2)
Syy = np.sum((Y - y_mean) ** 2)

b1 = Sxy / Sxx
b0 = y_mean - b1 * x_mean

print(f"\n--- 3b) Ecuación de Regresión Lineal ---")
print(f"\n  Método de Mínimos Cuadrados:")
print(f"  Σ(xi - x̄)(yi - ȳ) = {Sxy:.4f}")
print(f"  Σ(xi - x̄)² = {Sxx:.4f}")
print(f"  b1 (pendiente) = Sxy/Sxx = {b1:.4f}")
print(f"  b0 (ordenada al origen) = ȳ - b1·x̄ = {b0:.4f}")
print(f"\n  Ecuación: ŷ = {b0:.4f} + {b1:.4f} · x")
print(f"  Interpretación: Por cada usuario activo adicional, se esperan")
print(f"  aproximadamente {b1:.2f} reservas más por día.")

# 3c) Coeficiente de correlación
r = Sxy / np.sqrt(Sxx * Syy)
r2 = r ** 2

print(f"\n--- 3c) Coeficiente de Correlación ---")
print(f"\n  r (Pearson) = Sxy / √(Sxx·Syy) = {r:.4f}")
print(f"  r² (Coeficiente de determinación) = {r2:.4f}")
print(f"\n  Interpretación:")
if abs(r) >= 0.7:
    fuerza = "fuerte"
elif abs(r) >= 0.4:
    fuerza = "moderada"
else:
    fuerza = "débil"
direccion = "positiva (directa)" if r > 0 else "negativa (inversa)"
utilidad = "útil" if r2 > 0.5 else "limitado"
print(f"  - Existe una correlación {fuerza} y {direccion} entre")
print(f"    usuarios activos y reservas diarias (r = {r:.4f}).")
print(f"  - El modelo explica el {r2*100:.2f}% de la variabilidad en las reservas.")
print(f"  - El modelo es {utilidad} para predecir reservas a partir")
print(f"    de la cantidad de usuarios activos en BookDesk.")

# Verificación con scipy
slope_sp, intercept_sp, r_sp, p_value_sp, std_err_sp = stats.linregress(X, Y)
print(f"\n  Verificación (scipy.stats.linregress):")
print(f"  b0 = {intercept_sp:.4f}, b1 = {slope_sp:.4f}, r = {r_sp:.4f}, p-valor = {p_value_sp:.6f}")

# --- Gráfico: Diagrama de dispersión con recta ---
fig, ax = plt.subplots(figsize=(10, 7))
ax.scatter(X, Y, color='#2196F3', s=80, alpha=0.7, edgecolors='white', linewidth=1, zorder=5, label='Observaciones')

x_line = np.linspace(X.min() - 1, X.max() + 1, 100)
y_line = b0 + b1 * x_line
ax.plot(x_line, y_line, color='#F44336', linewidth=2, label=f'ŷ = {b0:.2f} + {b1:.2f}x')

ax.set_xlabel('Usuarios Activos por Día (X)')
ax.set_ylabel('Reservas Diarias (Y)')
ax.set_title(f'Diagrama de Dispersión y Regresión Lineal\nr = {r:.4f} | r² = {r2:.4f}')
ax.legend()
ax.grid(True, alpha=0.3)

textstr = f'ŷ = {b0:.2f} + {b1:.2f}x\nr = {r:.4f}\nr² = {r2:.4f}\np = {p_value_sp:.4f}'
props = dict(boxstyle='round', facecolor='wheat', alpha=0.8)
ax.text(0.05, 0.95, textstr, transform=ax.transAxes, fontsize=10,
        verticalalignment='top', bbox=props)

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, '04_regresion_correlacion.png'), bbox_inches='tight')
plt.close()
print("\n[Gráfico guardado: 04_regresion_correlacion.png]")

df_reg.to_csv(os.path.join(OUTPUT_DIR, 'datos_regresion.csv'), index=False, encoding='utf-8-sig')


# =============================================================================
# 4. ESTADÍSTICA INFERENCIAL (2 puntos)
# =============================================================================
print("\n" + "=" * 70)
print("4. ESTADÍSTICA INFERENCIAL")
print("=" * 70)

# 4a) Intervalo de confianza
print("\n--- 4a) Intervalo de Confianza ---")
print(f"""
Pregunta de interés: ¿Cuál es la duración media real de las reservas
en el sistema BookDesk?

Se construye un intervalo de confianza al 95% para la media poblacional (μ)
de la duración de las reservas.

Datos:
  n = {n}
  x̄ = {media:.4f} horas
  s = {desvio_std:.4f} horas
  Nivel de confianza: 95% (α = 0.05)
""")

alpha = 0.05
gl = n - 1
t_critico = stats.t.ppf(1 - alpha / 2, gl)
error_estandar = desvio_std / np.sqrt(n)
margen_error = t_critico * error_estandar
ic_inf = media - margen_error
ic_sup = media + margen_error

print(f"  Distribución: t-Student (σ poblacional desconocido)")
print(f"  Grados de libertad: gl = n - 1 = {gl}")
print(f"  Valor crítico: t(α/2, {gl}) = {t_critico:.4f}")
print(f"  Error estándar: s/√n = {error_estandar:.4f}")
print(f"  Margen de error: E = t · s/√n = {margen_error:.4f}")
print(f"\n  IC 95% para μ: ({ic_inf:.4f} ; {ic_sup:.4f})")
print(f"\n  Interpretación: Con un 95% de confianza, la duración media")
print(f"  poblacional de las reservas en BookDesk se encuentra entre")
print(f"  {ic_inf:.2f} y {ic_sup:.2f} horas.")

# --- Gráfico: Intervalo de confianza ---
fig, ax = plt.subplots(figsize=(10, 4))
ax.errorbar(media, 0, xerr=margen_error, fmt='o', color='#2196F3',
            markersize=12, capsize=15, capthick=2, elinewidth=2, label=f'IC 95%: ({ic_inf:.2f} ; {ic_sup:.2f})')
ax.axvline(media, color='#F44336', linestyle='--', alpha=0.7, label=f'x̄ = {media:.2f}')
ax.fill_betweenx([-0.3, 0.3], ic_inf, ic_sup, alpha=0.2, color='#2196F3')
ax.set_xlabel('Duración media de reservas (horas)')
ax.set_title('Intervalo de Confianza al 95% para la Media Poblacional (μ)')
ax.set_yticks([])
ax.legend(loc='upper right')
ax.set_xlim(ic_inf - 1, ic_sup + 1)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, '05_intervalo_confianza.png'), bbox_inches='tight')
plt.close()
print("[Gráfico guardado: 05_intervalo_confianza.png]")

# 4b) Prueba de hipótesis
print("\n--- 4b) Prueba de Hipótesis ---")

mu_0 = 3.0
print(f"""
Pregunta: ¿La duración media de las reservas es significativamente
diferente de {mu_0} horas (media hora de jornada estándar)?

Formulación de hipótesis:
  H₀: μ = {mu_0} (la duración media es {mu_0} horas)
  H₁: μ ≠ {mu_0} (la duración media es diferente de {mu_0} horas)

Tipo de prueba: Bilateral (dos colas)
Nivel de significación: α = 0.05
""")

t_calc = (media - mu_0) / (desvio_std / np.sqrt(n))
p_valor = 2 * stats.t.sf(abs(t_calc), gl)

print(f"  Estadístico de prueba:")
print(f"  t = (x̄ - μ₀) / (s/√n) = ({media:.4f} - {mu_0}) / ({desvio_std:.4f}/√{n})")
print(f"  t = {t_calc:.4f}")
print(f"\n  Valor crítico: t(α/2, {gl}) = ±{t_critico:.4f}")
print(f"  p-valor: {p_valor:.6f}")
print(f"\n  Regla de decisión:")
comparador = ">" if abs(t_calc) > t_critico else "<"
print(f"  |t_calc| = {abs(t_calc):.4f} {comparador} t_crit = {t_critico:.4f}")

if p_valor < alpha:
    decision = "SE RECHAZA H₀"
    conclusion = (f"Con un nivel de significación del 5%, existe evidencia estadística\n"
                  f"  suficiente para afirmar que la duración media de las reservas en\n"
                  f"  BookDesk es significativamente diferente de {mu_0} horas.")
else:
    decision = "NO SE RECHAZA H₀"
    conclusion = (f"Con un nivel de significación del 5%, no existe evidencia estadística\n"
                  f"  suficiente para afirmar que la duración media de las reservas en\n"
                  f"  BookDesk sea significativamente diferente de {mu_0} horas.")

print(f"\n  Decisión: {decision}")
comp_p = "<" if p_valor < alpha else ">"
print(f"  p-valor ({p_valor:.6f}) {comp_p} α ({alpha})")
print(f"\n  Conclusión: {conclusion}")

# Verificación con scipy
t_scipy, p_scipy = stats.ttest_1samp(duraciones, mu_0)
print(f"\n  Verificación (scipy.stats.ttest_1samp):")
print(f"  t = {t_scipy:.4f}, p-valor = {p_scipy:.6f}")

# --- Gráfico: Distribución t y regiones ---
fig, ax = plt.subplots(figsize=(10, 5))
x_t = np.linspace(-4, 4, 1000)
y_t = stats.t.pdf(x_t, gl)
ax.plot(x_t, y_t, 'k-', linewidth=2, label=f't-Student (gl={gl})')
ax.fill_between(x_t, y_t, where=(x_t <= -t_critico), alpha=0.3, color='red', label=f'Región de rechazo (α/2 = {alpha/2})')
ax.fill_between(x_t, y_t, where=(x_t >= t_critico), alpha=0.3, color='red')
ax.fill_between(x_t, y_t, where=(x_t > -t_critico) & (x_t < t_critico), alpha=0.15, color='green', label='Región de no rechazo')
ax.axvline(t_calc, color='blue', linestyle='--', linewidth=2, label=f't_calc = {t_calc:.4f}')
ax.axvline(-t_critico, color='red', linestyle=':', linewidth=1.5)
ax.axvline(t_critico, color='red', linestyle=':', linewidth=1.5)
ax.set_xlabel('Valor t')
ax.set_ylabel('Densidad')
ax.set_title(f'Prueba de Hipótesis Bilateral - H₀: μ = {mu_0}\n{decision} (p = {p_valor:.4f})')
ax.legend(loc='upper right', fontsize=9)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, '06_prueba_hipotesis.png'), bbox_inches='tight')
plt.close()
print("\n[Gráfico guardado: 06_prueba_hipotesis.png]")

# 4c) Interpretación en contexto
print("\n--- 4c) Interpretación en el Contexto del Proyecto ---")
if p_valor < alpha:
    txt_hipotesis = f"La duración media real difiere de las {mu_0} horas supuestas."
    txt_implicacion = "Esto sugiere que las políticas de reserva deberían ajustarse para reflejar el uso real."
else:
    txt_hipotesis = f"No hay evidencia de que la duración media difiera de {mu_0} horas."
    txt_implicacion = f"Esto valida que la política actual de slots de {mu_0} horas es adecuada."
print(f"""
Los resultados de la estadística inferencial aplicados al sistema BookDesk indican:

1. INTERVALO DE CONFIANZA: Podemos afirmar con un 95% de confianza que la
   duración media real de las reservas se encuentra entre {ic_inf:.2f} y {ic_sup:.2f}
   horas. Esto permite al administrador del coworking planificar la disponibilidad
   de recursos con un margen razonable de certeza.

2. PRUEBA DE HIPÓTESIS: {decision.lower()}. {txt_hipotesis}
   {txt_implicacion}

3. IMPLICACIÓN PARA BookDesk: Estos análisis proporcionan una base cuantitativa
   para tomar decisiones sobre la configuración de slots de tiempo, la asignación
   de recursos y la optimización del sistema de reservas.
""")


# =============================================================================
# 5. INTEGRACIÓN CON INGENIERÍA DE SOFTWARE II (1 punto)
# =============================================================================
print("=" * 70)
print("5. INTEGRACIÓN CON INGENIERÍA DE SOFTWARE II")
print("=" * 70)
print(f"""
El análisis estadístico realizado sobre los datos del sistema BookDesk
contribuye a la mejora del proyecto de software de las siguientes maneras:

1. GESTIÓN DE RECURSOS: La estadística descriptiva revela que la duración
   media de las reservas es {media:.2f} horas (CV = {cv:.1f}%). Esto permite
   configurar slots de tiempo óptimos en el sistema, evitando tanto
   fragmentación excesiva como reservas demasiado largas que bloqueen recursos.

2. PREDICCIÓN DE DEMANDA: El modelo de regresión (r² = {r2:.2f}) permite
   estimar la cantidad de reservas esperadas según los usuarios activos.
   Esto se puede integrar como un módulo de predicción en el dashboard
   administrativo para anticipar picos de demanda.

3. TOMA DE DECISIONES BASADA EN DATOS: La prueba de hipótesis proporciona
   evidencia estadística para validar o ajustar las políticas de reserva.
   En lugar de decisiones arbitrarias, el administrador cuenta con respaldo
   cuantitativo.

4. MEJORA CONTINUA: Los intervalos de confianza permiten monitorear la
   evolución del uso del sistema. Se podría implementar un módulo de
   reportes en BookDesk que calcule automáticamente estas métricas y
   alerte cuando se detecten cambios significativos.

5. OPTIMIZACIÓN DEL SISTEMA: Los datos muestran que el 50% de las reservas
   dura entre {q1:.2f} y {q3:.2f} horas. El sistema podría sugerir
   automáticamente duraciones de reserva basadas en el tipo de recurso
   y los patrones históricos, mejorando la experiencia del usuario.
""")


# =============================================================================
# RESUMEN FINAL
# =============================================================================
print("=" * 70)
print("RESUMEN DE ARCHIVOS GENERADOS")
print("=" * 70)

archivos = [
    ('datos_reservas.csv', 'Datos de la muestra (50 reservas)'),
    ('datos_regresion.csv', 'Datos bivariados (30 días)'),
    ('01_histograma_y_tipo.png', 'Histograma de duraciones y tipo de recurso'),
    ('02_frecuencias_ojiva.png', 'Distribución de frecuencias con ojiva'),
    ('03_boxplot.png', 'Diagramas de caja'),
    ('04_regresion_correlacion.png', 'Diagrama de dispersión y regresión lineal'),
    ('05_intervalo_confianza.png', 'Intervalo de confianza al 95%'),
    ('06_prueba_hipotesis.png', 'Prueba de hipótesis bilateral'),
]

for archivo, desc in archivos:
    ruta = os.path.join(OUTPUT_DIR, archivo)
    existe = "✓" if os.path.exists(ruta) else "✗"
    print(f"  {existe} {archivo:40s} - {desc}")

print(f"\nTodos los archivos se encuentran en: {OUTPUT_DIR}/")
print("\n" + "=" * 70)
print("FIN DEL ANÁLISIS ESTADÍSTICO")
print("=" * 70)
