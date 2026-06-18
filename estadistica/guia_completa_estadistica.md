# Qué decir en cada sección de la página de Análisis Estadístico de BookDesk

BookDesk es un sistema de reservas para un coworking. El módulo de estadística analiza 50 reservas del sistema para encontrar patrones de uso. La página está en /estadistica.

Se analizan dos cosas: la duración de las reservas (50 reservas) y la relación entre usuarios activos y reservas por día (30 días). Las reservas se hacen en bloques de 15 minutos, mínimo media hora y máximo 8 horas.

---

## Sección 1: Las 4 tarjetas de arriba (Resumen General)

Acá se ven 4 indicadores:
- Reservas analizadas: 50. Es el tamaño de la muestra. Se usan 50 porque supera el mínimo de 30 que pide el Teorema Central del Límite para poder hacer inferencia estadística después.
- Duración promedio: 3.5 horas. Es la media aritmética de las 50 duraciones.
- Reserva más corta: 0.5 horas (media hora).
- Reserva más larga: 8.0 horas (jornada completa).

Debajo hay un desplegable donde se pueden ver las 50 reservas individuales con su tipo de recurso (sala o escritorio) y duración.

---

## Sección 2: ¿Cuánto duran las reservas? (Histograma y Torta)

### El histograma (gráfico de barras)

Muestra cómo se distribuyen las duraciones agrupadas en intervalos.

Para construirlo se usó la Regla de Sturges para determinar cuántas clases usar:
- k = 1 + 3.322 × log10(50) = 6.64, que se redondea a 7 clases.
- El rango es 8.00 - 0.50 = 7.50 horas.
- La amplitud de cada clase es 7.50 / 7 = 1.1 horas aproximadamente.

La tabla de frecuencias queda así:

| Intervalo | Frecuencia |
|-----------|------------|
| 0.5 a 1.6h | 7 |
| 1.6 a 2.7h | 17 |
| 2.7 a 3.8h | 8 |
| 3.8 a 4.9h | 5 |
| 4.9 a 6.0h | 4 |
| 6.0 a 7.1h | 7 |
| 7.1 a 8.2h | 2 |
| Total | 50 |

La barra más alta es la de 1.6 a 2.7 horas con 17 reservas. Son las reuniones cortas en salas. Hay un segundo grupo importante en 6 a 7 horas que son las jornadas completas en escritorios. La distribución está sesgada a la derecha: hay más reservas cortas que largas.

### El gráfico de torta

Muestra que hay 25 reservas de salas de reuniones y 25 de escritorios. El uso está balanceado entre ambos tipos de recurso.

---

## Sección 3: Métricas clave de duración (Estadística descriptiva)

Hay 4 tarjetas y un desplegable con todos los cálculos.

### Promedio: 3.50 horas

La media aritmética. Se suman todas las duraciones (175 horas en total) y se divide por 50.
- Fórmula: x̄ = Σxi / n = 175.00 / 50 = 3.5000 horas.

### Mediana: 3.00 horas

Es el valor central cuando se ordenan los 50 datos de menor a mayor. Como 50 es par, se promedian los valores en las posiciones 25 y 26.
- La mediana es menor que la media. Eso indica que hay reservas largas que tiran el promedio hacia arriba. La distribución está sesgada a la derecha.

### Moda: 2.0 horas

Es el valor que más se repite. Las reservas de 2 horas son las más comunes porque corresponden a reuniones típicas en salas.

### Variabilidad: 56% (Coeficiente de Variación)

Mide cuánta dispersión hay en los datos respecto al promedio.

Primero se calcula la varianza: S² = Σ(xi - x̄)² / (n - 1) = 3.8597. Se divide por n-1 = 49 y no por n = 50 porque es la corrección de Bessel, que se usa cuando trabajamos con una muestra en lugar de la población completa.

Después el desvío estándar: S = √3.8597 = 1.9646 horas.

Y el coeficiente de variación: CV = (1.9646 / 3.5000) × 100 = 56.13%.

Un CV mayor a 30% indica alta dispersión. El 56% es alto pero esperable: en el coworking conviven reuniones cortas de 1-2 horas con jornadas completas de 6-8 horas, entonces es lógico que haya mucha variabilidad.

### Cuartiles (en el desplegable)

- Q1 = 2.00 horas: el 25% de las reservas dura menos de 2 horas.
- Q3 = 5.25 horas: el 75% de las reservas dura menos de 5.25 horas.
- IQR = Q3 - Q1 = 3.25 horas: el 50% central de los datos se concentra en un rango de 3.25 horas.

### Tabla resumen de valores

| Medida | Valor |
|--------|-------|
| n | 50 |
| Suma total | 175.00 h |
| Media | 3.5000 h |
| Mediana | 3.00 h |
| Moda | 2.0 h |
| Varianza | 3.8597 |
| Desvío estándar | 1.9646 h |
| CV | 56.13% |
| Mínimo | 0.50 h |
| Máximo | 8.00 h |
| Rango | 7.50 h |
| Q1 | 2.00 h |
| Q3 | 5.25 h |

---

## Sección 4: ¿Más usuarios = más reservas? (Regresión y correlación)

Acá se usan datos diferentes: 30 días de operación del coworking. Para cada día se tienen dos variables: cantidad de usuarios activos ese día (x) y cantidad de reservas que se hicieron (y). El objetivo es ver si hay una relación entre ambas.

### El diagrama de dispersión

Cada punto azul es un día. La posición horizontal es la cantidad de usuarios y la vertical es la cantidad de reservas. Se ve una tendencia ascendente clara: los días con más usuarios tienen más reservas.

Se ven 26 puntos en lugar de 30 porque hay 4 pares de días que tienen exactamente los mismos valores y se superponen visualmente.

### Cálculo de la recta de regresión

Se ajusta una recta ŷ = mx + b por mínimos cuadrados. Las sumatorias con los 30 datos son:
- Σx = 523, Σy = 400, Σxy = 8275, Σx² = 10995, Σy² = 6302
- Medias: x̄ = 17.43, ȳ = 13.33

La pendiente se calcula con la fórmula:
m = (Σxy - n · x̄ · ȳ) / (Σx² - n · x̄²)
m = (8275 - 30 × 17.43 × 13.33) / (10995 - 30 × 17.43²)
m = 1301.67 / 1877.37
m = 0.6934

La pendiente de 0.69 significa que por cada usuario activo adicional se generan aproximadamente 0.7 reservas más en el día.

La ordenada al origen:
b = ȳ - m · x̄ = 13.33 - 0.6934 × 17.43 = 1.2459

La ecuación del modelo es: ŷ = 0.6934x + 1.2459

### Coeficiente de correlación de Pearson

r = (Σxy - n · x̄ · ȳ) / √[(Σx² - n · x̄²) · (Σy² - n · ȳ²)]
r = 1301.67 / √(1877.37 × 968.69)
r = 1301.67 / 1348.56
r = 0.9652

Un valor de r cercano a 1 indica una correlación positiva muy fuerte. 0.97 es excelente.

### Coeficiente de determinación

r² = 0.9652² = 0.9317

El 93% de la variabilidad en las reservas se explica por la cantidad de usuarios activos. Solo el 7% se debe a otros factores.

### Las 3 tarjetas de resumen
- Correlación: 97% (relación fuerte y positiva)
- Precisión del modelo: 93% (porcentaje de la variación que explica el modelo)
- Por cada usuario más: +0.7 reservas (impacto estimado por día)

En el desplegable se muestra un segundo gráfico con la recta de regresión (línea roja) superpuesta sobre los puntos para visualizar el ajuste.

---

## Sección 5: Predicción por interpolación (Análisis Numérico)

Acá se usa la recta de regresión como función de interpolación para estimar reservas en escenarios que no ocurrieron.

### Qué es la interpolación

Interpolación es estimar valores que no tenemos pero que caen dentro del rango de datos observados (entre 5 y 33 usuarios en nuestro caso). Se diferencia de la extrapolación, que estima fuera del rango y es menos confiable.

### Cómo se hace

Se buscan valores de usuarios que nunca ocurrieron en los 30 días (por ejemplo, nunca hubo un día con exactamente 10 usuarios) y se reemplaza x en la ecuación:

Para x = 10 usuarios:
ŷ = 0.6934 × 10 + 1.2459 = 8.18 reservas

Para x = 25 usuarios:
ŷ = 0.6934 × 25 + 1.2459 = 18.58 reservas

Estos valores no están en los datos originales. Son estimaciones obtenidas mediante interpolación.

### Por qué se usa mínimos cuadrados

Mínimos cuadrados es un método numérico de ajuste de curvas. A diferencia de Lagrange o Newton que pasan exactamente por cada punto, mínimos cuadrados busca la mejor aproximación global minimizando el error. Es más adecuado cuando los datos tienen variabilidad, como en nuestro caso donde no todos los días con la misma cantidad de usuarios tienen la misma cantidad de reservas.

### Para qué sirve

Le permite al administrador del coworking anticipar la demanda. Si ve que hoy se conectaron 25 usuarios, puede estimar que va a haber unas 19 reservas y preparar recursos.

---

## Sección 6: Intervalo de Confianza al 95%

Hasta ahora todo fue estadística descriptiva (describir la muestra). Ahora pasamos a estadística inferencial: queremos estimar algo sobre toda la población de reservas del coworking, no solo las 50 que analizamos.

### Qué muestra la pantalla

Tres tarjetas:
- Mínimo estimado: 2.94 horas
- Promedio observado: 3.50 horas
- Máximo estimado: 4.06 horas

Y una barra visual con el punto azul (media) y el rango del intervalo.

Esto significa: la duración promedio real de todas las reservas del coworking está entre 2.94 y 4.06 horas, con un 95% de confianza.

### Cálculo paso a paso

Paso 1 — Datos: x̄ = 3.5000, S = 1.9646, n = 50, confianza = 95% (α = 0.05).

Paso 2 — Se usa t de Student porque no conocemos el desvío poblacional σ, solo el muestral S. Los grados de libertad son gl = n - 1 = 49.

Paso 3 — Valor crítico: buscamos en la tabla t con gl = 49 y α/2 = 0.025. El resultado es t = 2.0096.

Paso 4 — Error estándar: EE = S / √n = 1.9646 / √50 = 0.2778. Mide qué tan precisa es nuestra media muestral.

Paso 5 — Margen de error: E = t × EE = 2.0096 × 0.2778 = 0.5583. Es lo que se suma y resta a la media.

Paso 6 — Intervalo: IC = (3.50 - 0.56 ; 3.50 + 0.56) = (2.94 ; 4.06).

### Qué significa el 95%

Si repitiéramos el proceso 100 veces (tomar 50 reservas y calcular el IC), en 95 de esas veces el intervalo contendría la media real. Es la confiabilidad del método.

---

## Sección 7: Prueba de Hipótesis

La prueba de hipótesis responde una pregunta concreta: ¿la duración promedio real es 3 horas, o es diferente?

### Las dos hipótesis

- H₀ (hipótesis nula): μ = 3. La duración promedio real es 3 horas. Se asume verdadera hasta que los datos la contradigan.
- Hₐ (hipótesis alternativa): μ ≠ 3. La duración promedio real es diferente de 3 horas.
- Es bilateral (dos colas) porque nos importa si es diferente en cualquier dirección.

### Cálculo paso a paso

Paso 1 — Datos: μ₀ = 3 (valor supuesto), S = 1.9646, n = 50, α = 0.05.

Paso 2 — Hipótesis: H₀: μ = 3, Hₐ: μ ≠ 3, prueba bilateral.

Paso 3 — Se usa t de Student porque σ es desconocido. gl = n - 1 = 49.

Paso 4 — Valor crítico: buscamos en la tabla t con gl = 49 y α/2 = 0.025. El resultado es tc = ±2.0096. Si nuestro estadístico cae más allá de estos límites, rechazamos H₀.

Paso 5 — La fórmula del estadístico de prueba es: tp = (X̄ - μ₀) / (S / √n). Lo que hace es medir qué tan lejos está el promedio observado del valor supuesto, medido en unidades de error estándar.

Paso 6 — Regla de decisión: si |tp| ≥ 2.0096 se rechaza H₀. Si |tp| < 2.0096 no se rechaza.

Paso 7 — Cálculo: tp = (3.5000 - 3) / (1.9646 / √50) = 0.5000 / 0.2778 = 1.7996. El promedio observado está a 1.80 errores estándar del valor supuesto.

Paso 8 — Decisión: |1.7996| = 1.80 < 2.0096. No llegamos al límite. No rechazamos H₀.

Paso 9 — Conclusión: no hay evidencia suficiente para decir que el promedio real es diferente de 3 horas. Aunque el promedio observado es 3.50, esa diferencia de media hora no es estadísticamente significativa considerando la variabilidad de los datos.

### La barra visual

La barra roja-verde-roja muestra las zonas de decisión:
- Zonas rojas en los extremos: zona de rechazo (más allá de ±2.0096)
- Zona verde en el centro: zona de no rechazo
- Punto azul: nuestro tp = 1.7996
- El punto está en la zona verde, por eso no rechazamos.

### Por qué no se rechaza si el promedio es 3.50

Porque la variabilidad es alta (CV = 56%). Con tanta dispersión, una diferencia de media hora puede ser simplemente producto del azar del muestreo. Si tuviéramos más datos o menos dispersión, la misma diferencia probablemente sí sería significativa.

### Qué significa para el sistema

Los slots de tiempo del sistema están bien configurados. No hay evidencia de que el uso real se aleje de las 3 horas promedio.

---

## Sección 8: Recomendaciones para BookDesk

Son conclusiones prácticas que conectan el análisis con el sistema:

1. Ofrecer slots predeterminados de 1h, 2h y 4h, porque el 50% de las reservas dura entre 2h y 5.25h.
2. Alertar al administrador cuando hay más de 25 usuarios activos, porque el modelo predice más de 18 reservas.
3. Sugerir 2 horas para salas (la moda) y jornada completa para escritorios.
4. Monitorear si el promedio sale del rango 2.94h a 4.06h, porque indicaría un cambio en los patrones de uso.

---

## Cómo se relacionan las tres materias

Probabilidad y Estadística: estadística descriptiva (media, mediana, moda, varianza, desvío, CV, cuartiles, histograma), regresión lineal, correlación de Pearson, intervalo de confianza con t de Student, y prueba de hipótesis bilateral.

Análisis Numérico: ajuste de la recta por mínimos cuadrados (método numérico de aproximación) e interpolación lineal para estimar valores no observados dentro del rango de datos.

Ingeniería de Software II: desarrollo del sistema completo con React, visualización interactiva con gráficos, despliegue en la nube con Vercel, y el módulo de estadística como funcionalidad que aporta valor al administrador del coworking.
