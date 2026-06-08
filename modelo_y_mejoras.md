# Modelo de predicción: estado actual y plan de mejoras

> Objetivo de este documento: (1) entender con precisión cómo predice hoy el sistema,
> (2) listar sus límites, (3) proponer mejoras priorizadas por impacto/esfuerzo, y (4) un
> plan por fases para incorporarlas **midiendo** cada cambio. No implementa nada todavía.

---

## 1. Cómo predice hoy (anatomía)

Pipeline determinista, en [src/engine.py](../src/engine.py):

```
Elo(local), Elo(visita)              data/elo_seed.json (seed manual; lo refresca la nube)
   │  elo_to_lambdas()               + ventaja de local solo para anfitriones
   ▼
λ_local, λ_visita                    tasas de goles esperados
   │  score_matrix()                 Poisson × corrección Dixon-Coles (ρ) para 0-0/1-1
   ▼
P[i][j]  (matriz de marcadores)
   │  optimize()                     argmax de PUNTOS ESPERADOS del puntaje de la polla
   ▼
marcador recomendado
```

**Detalle de cada paso:**
- **Elo → goles** (`elo_to_lambdas`): `dr = (Elo_local + ventaja) − Elo_visita`;
  `λ_local = base·e^{k·dr}`, `λ_visita = base·e^{−k·dr}`. Forma **multiplicativa**: el
  producto `λ_local·λ_visita = base²` es constante → asume **goles totales fijos**, y la
  diferencia de Elo solo reparte la "supremacía". Constantes en
  [data/config.json](../data/config.json): `base_goals=1.30`, `elo_to_goals_k=0.0017`,
  `home_advantage_elo=60` (solo anfitriones).
- **Matriz Dixon-Coles** (`score_matrix`): Poisson independiente por equipo + factor `τ` con
  `ρ=−0.13` que sube 0-0 y 1-1 (los marcadores bajos que el Poisson simple subestima).
- **Optimizador EV** (`optimize`): elige el marcador `(h,a)` que maximiza
  `EP = 5·P(resultado) + 2·P(goles_local) + 2·P(goles_visita) + 1·P(diferencia)`.
  **No** predice el marcador más probable, sino el de mayor puntaje esperado.
- **Overrides** ([data/overrides.json](../data/overrides.json)): la rutina nube traduce
  noticias (lesiones, rotaciones) a `lambda_*_mult` o `elo_*_delta` por partido.
- **Aprendizaje** ([src/calibration.py](../src/calibration.py)): con resultados reales calcula
  Brier/RPS, valida que la jugada EV rinde más que la modal, y hace grid-search de
  `base_goals`/`k` minimizando RPS. El Elo se refresca desde eloratings.net.

---

## 2. Fortalezas y límites de hoy

**Fortalezas:** principiado y auditable; EV-óptimo (no modal); corrección de marcadores bajos;
calibrable; determinista; admite ajuste por noticias.

**Límites (oportunidades):**
1. **Elo seed manual** y aproximado; las constantes del mapeo **no están ajustadas a datos**,
   son a ojo.
2. **Goles totales asumidos constantes** (forma multiplicativa): ignora que ciertos equipos
   y emparejamientos producen más/menos goles.
3. **Sin ataque/defensa por equipo**: el Dixon-Coles "de verdad" estima fuerza ofensiva y
   defensiva de cada selección; aquí solo usamos diferencia de Elo (λ simétricas). Se pierde
   el perfil goleador/defensivo propio de cada equipo.
4. **ρ fijo** (−0.13) y **sin decaimiento temporal** (forma reciente pesa igual que la vieja).
5. **No usa cuotas de mercado** (el mejor predictor individual) cuando existen.
6. **Sin cuantificar la incertidumbre** ni *shrinkage*: el Elo temprano es ruidoso.
7. **Overrides heurísticos** (juicio del LLM), no calibrados a un efecto medible.
8. **Fuga de datos en el tuning**: el grid-search ajusta y evalúa sobre los **mismos**
   partidos resueltos → riesgo de sobreajuste; falta validación walk-forward.
9. **Objetivo = puntos esperados, no ganar la polla.** Maximizar EV es "jugar a no perder".
   Como compites contra otras personas, **ganar** puede requerir diferenciarte (apuestas
   contrarias calculadas) según el marcador del torneo y lo que apuesten los rivales.

---

## 3. Mejoras propuestas (priorizadas)

**Tier 0 — Medir antes de tocar (imprescindible):**
- **Backtesting**: arnés que reproduce partidos/torneos pasados y mide RPS, Brier y **puntos
  de la polla** del modelo. Sin esto no sabemos si un cambio mejora o empeora.
- **Validación walk-forward**: ajustar parámetros en el pasado y evaluar en el futuro
  (eliminar la fuga del grid-search actual).

**Tier 1 — Alto impacto, esfuerzo bajo/medio:**
- **A. Ajustar el mapeo Elo→goles a datos reales** (MLE/regresión Poisson sobre amistosos e
  internacionales recientes) en vez de constantes a ojo.
- **B. Ataque/defensa por equipo** (Dixon-Coles completo): λ_local depende del ataque local y
  la defensa visitante. Captura "Alemania mete muchos", "Italia recibe pocos".
- **C. Blend con mercado**: cuando haya cuotas 1X2, mezclar probabilidad de mercado con la del
  modelo (el mercado suele ganarle a cualquier modelo individual).

**Tier 2 — Medio:**
- **D. Elo mejor**: actualización con peso por diferencia de goles e importancia del partido;
  *shrinkage* hacia priors al inicio.
- **E. Efectos de sede**: anfitrión, altitud (p. ej. Ciudad de México), viaje/descanso.
- **F. Ajustar ρ y agregar decaimiento temporal** (forma reciente pondera más).
- **G. Cuantificar overrides**: tabla "figura ofensiva fuera = −X% ataque" en vez de ad-hoc.

**Tier 3 — Estratégico (mayor techo para GANAR la polla):**
- **H. Objetivo consciente de la polla**: modelar qué apostarán los rivales (la mayoría tira a
  favoritos/modal) y optimizar **probabilidad de quedar primero**, no puntos esperados. Si vas
  atrás, conviene riesgo contrario en partidos de alta varianza; si vas adelante, cubrirte.
- **I. Simulación Monte Carlo de la polla**: simular resultados restantes y posiciones finales
  para evaluar estrategias de apuesta de punta a punta.
- **J. Ensamble**: combinar Elo-Poisson + mercado + un modelo ML con features (xG, ranking,
  forma) con pesos aprendidos por calibración.

---

## 4. Método para decidir qué incorporar
1. Construir el backtest (Tier 0) y fijar la **línea base** (RPS/puntos actuales).
2. Agregar **una mejora a la vez** y medir el delta en datos **fuera de muestra**.
3. Conservar solo lo que supere la línea base. Documentar el uplift de cada cambio.
4. El objetivo consciente de la polla (H/I) es el de mayor techo, pero requiere la simulación.

---

## 5. Plan por fases (sin tocar el motor todavía)

- **Fase A — Entender y medir.** Backtest + validación walk-forward; reporte de calibración
  del modelo actual sobre los partidos ya jugados; baseline de RPS/puntos. *(Entregable: arnés
  de backtest + informe de línea base.)*
- **Fase B — Datos.** Ingerir un dataset histórico de partidos de selecciones (resultados,
  sede, fechas) para poder ajustar parámetros y per-team attack/defense.
- **Fase C — Mejoras del core.** Ajustar mapeo Elo→goles, ataque/defensa por equipo, ρ y
  decaimiento; blend con mercado si hay cuotas. Cada uno validado contra la baseline.
- **Fase D — Estrategia de polla.** Modelado de rivales + Monte Carlo de posiciones →
  apuestas que maximizan probabilidad de ganar (no solo puntos).
- **Fase E — Validación continua.** Walk-forward durante el torneo; mantener solo lo que ayuda;
  reentrenar con cada jornada.

> **Idea clave a no perder de vista:** maximizar *puntos esperados* (lo de hoy) ≠ maximizar
> *probabilidad de ganar la polla*. Lo primero es una base sólida; lo segundo (Tier 3) es lo
> que de verdad gana ligas de amigos, y es donde más se puede mejorar.
