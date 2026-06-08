# Programa de investigación: estrategia óptima para pollas y mercados de apuestas

Dos objetivos:
1. **Ganar la polla** con los amigos (caso de uso vivo, un solo modelo).
2. **Paper** que demuestre una estrategia óptima para (a) pollas de pronósticos y
   (b) batir a casas de apuestas reales (vía *paper-trading*, sin dinero real).

Decisiones fijadas: **paper-trading** (simulado); cuotas vía **the-odds-api**; **stack
híbrido** (investigación con numpy/pandas/scipy/statsmodels/sklearn + DB; runtime de la polla
en GitHub Actions se mantiene liviano).

---

## 1. Arquitectura: un core, dos brazos

```
                ┌───────────────────────── CORE PROBABILÍSTICO ─────────────────────────┐
                │  Model zoo (varios modelos), interfaz común:                           │
                │    model.predict(match) -> matriz P(marcador) y P(1X2) calibradas      │
                └───────────────┬───────────────────────────────┬───────────────────────┘
                                │                               │
        ┌───────────────────────▼─────────┐        ┌────────────▼──────────────────────────┐
        │ BRAZO POLLA (1 modelo elegido)   │        │ BRAZO APUESTAS (todos en paralelo)     │
        │  decisión *pool-aware*:          │        │  por modelo: valor vs cuota (de-vig),  │
        │  maximizar P(quedar 1°)          │        │  staking (Kelly frac.), paper-trading, │
        │  -> picks (runtime actual)       │        │  ledger, ROI/CLV -> comparar modelos   │
        └──────────────────────────────────┘        └────────────────────────────────────────┘
                                │                               │
                ┌───────────────▼───────────────────────────────▼───────────────────────┐
                │  EVALUACIÓN COMÚN: backtest walk-forward, RPS/Brier/log-loss,          │
                │  ROI/CLV/Sharpe, tests estadísticos, reproducibilidad                  │
                └───────────────────────────────────────────────────────────────────────┘
```

**Idea rectora:** el mismo core alimenta dos *capas de decisión* con objetivos distintos —
la polla maximiza probabilidad de ganar el torneo de amigos; las apuestas maximizan retorno
ajustado por riesgo frente al mercado. Varios modelos compiten en el brazo de apuestas; el
mejor (o el más robusto) se usa en la polla.

---

## 2. Componentes a construir

### 2.1 Datos (Fase 0)
- **Resultados históricos de selecciones** (entrenamiento/backtest): dataset tipo
  "International football results 1872–presente" + ratings Elo históricos.
- **Cuotas**: the-odds-api (1X2 y, si hay, correct score / over-under), en vivo e histórico.
- **Metadata**: sede, altitud, fecha, torneo, importancia, descanso/viaje.
- **DB** (SQLite en investigación): tablas `matches`, `odds`, `predictions`, `bets`, `runs`,
  `experiments`. El runtime de la polla sigue con sus JSONL livianos.

### 2.2 Model zoo (varios modelos en paralelo)
Interfaz común `predict(match) -> {grid, p1x2}`; cada uno se evalúa igual.
- **M0 — baseline**: el actual (Elo→Poisson→Dixon-Coles simétrico). Punto de comparación.
- **M1 — Dixon-Coles completo**: ataque/defensa por equipo + ventaja local + ρ + decaimiento
  temporal, ajustado por MLE.
- **M2 — bivariado / bayesiano jerárquico**: fuerzas con *shrinkage* (mejor con pocos datos).
- **M3 — mercado**: probabilidad implícita de las cuotas, sin margen (Shin/power). **El modelo
  a batir.**
- **M4 — ML**: gradient boosting sobre features (Elo, forma, xG si hay, descanso, sede).
- **M5 — ensemble/stacking**: combina los anteriores con pesos aprendidos.

### 2.3 Calibración y evaluación (Fase 0, transversal)
- **Predicción**: RPS (ordinal, el correcto para 1X2), Brier, log-loss, curvas de calibración.
- **Apuestas**: ROI/yield, **CLV** (valor vs línea de cierre — la métrica reina, menos ruidosa
  que el ROI), Sharpe, max drawdown, % de aciertos de valor.
- **Backtest walk-forward** (origen móvil): ajustar en el pasado, evaluar en el futuro. Elimina
  la fuga del grid-search actual.
- **Tests**: Diebold-Mariano para comparar modelos; intervalos por bootstrap.

### 2.4 Brazo Polla — decisión consciente de la polla (Fase 4)
- **Objetivo**: maximizar **P(quedar 1°)**, no los puntos esperados.
- **Modelo de rivales**: estimar qué apuestan (la mayoría tira a favoritos/modal).
- **Monte Carlo** de posiciones finales dado un set de picks propios + el estado del torneo.
- **Optimización** de picks (búsqueda/greedy) según vayas adelante (cubrirte) o atrás (riesgo
  contrario en partidos de alta varianza).
- Se enchufa al runtime actual (`iterate.py`), que ya carga, versiona y notifica.

### 2.5 Brazo Apuestas — paper-trading (Fases 2–3)
- Por modelo y partido: `edge = P(modelo) − P(implícita de-vig)`; apostar si `edge > umbral`.
- **Staking**: Kelly fraccional (p. ej. ¼) con tope de bankroll y de exposición.
- **Ledger** de apuestas simuladas: stake, cuota tomada, cierre, resultado, P&L, CLV.
- **Todos los modelos corren en paralelo**, cada uno con bankroll virtual → ranking por CLV/ROI.
- Sin dinero real. Si alguna vez se considerara real, es decisión aparte (legalidad en Chile,
  ToS de la plataforma, juego responsable).

### 2.6 Reproducibilidad (transversal)
- Semillas fijas, versionado de datos y config de experimentos, notebooks que regeneran todas
  las figuras/tablas del paper desde la DB.

---

## 3. El paper (estructura tentativa)
- **Tesis / contribuciones**: (1) un marco de decisión *pool-aware* que maximiza P(ganar) y
  supera empíricamente a maximizar EV; (2) un framework multi-modelo con paper-trading que
  logra **CLV positivo** frente al mercado fuera de muestra.
- **Secciones**: introducción · trabajo relacionado (Dixon-Coles 1997; Constantinou & Fenton;
  eficiencia de mercados de apuestas; estrategia de pools) · datos · modelos · evaluación de
  predicción · estrategia de polla · resultados de apuestas (CLV/ROI) · ablations · discusión ·
  ética y limitaciones · reproducibilidad.
- **Baselines**: mercado, marcador modal, EV-only, modelo único — para mostrar el aporte de
  cada componente.

---

## 4. Plan por fases (entregables + métrica de éxito)

| Fase | Qué | Entregable | Éxito |
|---|---|---|---|
| **0 — Infra** | Stack híbrido, DB, pipeline de datos (resultados históricos + the-odds-api), backtest walk-forward | Baseline M0 reproducible y su calibración | RPS/CLV de M0 medidos sin fuga |
| **1 — Core models** | M1 (Dixon-Coles completo) y M3 (mercado) | Comparación out-of-sample vs M0 | M1 ≥ M0 en RPS; M3 como techo |
| **2 — Apuestas** | Motor de paper-trading (valor + Kelly + ledger), correr M0/M1/M3 en paralelo | Tabla CLV/ROI por modelo | Algún modelo con **CLV > 0** estable |
| **3 — Modelos avanzados** | M2 (bayesiano), M4 (ML), M5 (ensemble) | Mejor modelo seleccionado | Supera a M1 y al mercado en CLV |
| **4 — Polla pool-aware** | Modelo de rivales + Monte Carlo + optimización P(ganar); integrar al runtime | Picks pool-aware en producción | P(ganar) simulada > estrategia EV |
| **5 — Paper** | Experimentos finales, ablations, figuras, redacción | Borrador del paper | Resultados reproducibles end-to-end |

Regla de oro en todas: **una mejora a la vez, medida fuera de muestra; se conserva solo lo que
supera la línea base.**

---

## 5. Riesgos y ética
- **Paper-trading** → sin riesgo financiero ni legal. Real es una decisión separada y posterior.
- **the-odds-api**: respetar límites/ToS; cachear cuotas en la DB.
- **Sobreajuste**: walk-forward estricto + un *hold-out* final intocable hasta el cierre.
- **Datos del paper**: el "Mundial 2026" de la polla es un *bracket custom* (no el sorteo real),
  así que el backtest del paper usa **torneos/partidos históricos reales**; la polla actual es
  el caso de uso vivo, no la evidencia del paper.

---

## 6. Conexión con lo ya construido
- El runtime actual (GitHub Actions + `src/iterate.py`) **es el brazo Polla con M0**; se le
  enchufa la capa pool-aware (Fase 4) y se puede cambiar el modelo del zoo.
- El historial incremental (`state/predictions_log.jsonl`) ya sirve como insumo de análisis.
- El motor actual ([src/engine.py](../src/engine.py)) se conserva como **M0**; los modelos
  nuevos viven en `research/models/` con la interfaz común.

---

## 7. Estructura de carpetas propuesta
```
research/
  data/         # datasets descargados + DB sqlite (gitignored los pesados)
  ingest/       # pipelines: resultados historicos, the-odds-api
  models/       # M0..M5 con interfaz comun predict()
  backtest/     # walk-forward, metricas (RPS/Brier/CLV), tests
  betting/      # value detection, staking (Kelly), ledger paper-trading
  pool/         # opponent modeling, montecarlo posiciones, optimizacion P(ganar)
  experiments/  # configs + notebooks que regeneran figuras del paper
paper/          # manuscrito y figuras
```
El paquete de la polla (`src/`, `submit/`, `.github/`) no se toca salvo la integración de Fase 4.
