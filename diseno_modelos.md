# Diseño de los modelos (paper)

Especificación de los modelos del *zoo*, su **interfaz común**, las features, la conexión
con las apuestas y la evaluación. Convención: cada modelo produce **lo mismo** —una
distribución sobre marcadores— y de ahí se derivan todos los mercados y la decisión.

---

## 1. El objeto común: distribución de marcador

Todo modelo `M` implementa:

```
M.predict(ctx) -> ScoreGrid
```

donde `ctx` es el contexto del partido (local, visita, fecha, neutral, sede, competición,
importancia) y `ScoreGrid` es una matriz `P[i][j] = P(local marca i, visita marca j)` sobre
una grilla `0..G` (típicamente G=10), normalizada.

**Por qué a nivel de marcador y no de 1X2:** todos los mercados son *funcionales* de `P`, así
que un solo objeto sirve para todo:

| Mercado | Derivación desde `P` |
|---|---|
| 1X2 (local/empate/visita) | suma sobre `i>j`, `i=j`, `i<j` |
| Doble oportunidad | sumas de los anteriores |
| Over/Under L goles | `P(i+j > L)` |
| Ambos marcan (BTTS) | `P(i≥1, j≥1)` |
| Marcador exacto | `P[i][j]` |
| Hándicap asiático | distribución de `i−j` desplazada |
| **Puntaje de la polla** | `5·P(signo) + 2·P(i=h)+2·P(j=a) + 1·P(i−j=h−a)` |

Así el **brazo polla** y el **brazo apuestas** consumen el mismo objeto; solo cambia la capa
de decisión encima.

API de `ScoreGrid`: `.outcome()`, `.over(line)`, `.btts()`, `.correct_score(i,j)`,
`.supremacy()` (dist. de `i−j`), `.asian_handicap(line)`, `.top_scores(n)`, `.pool_ev(scoring)`.

---

## 2. Notación

- `λ_h, λ_a`: goles esperados de local y visita.
- `att_i, def_i`: fuerza ofensiva y defensiva del equipo `i` (en log-tasa).
- `h`: ventaja de localía; `ρ`: corrección Dixon-Coles para marcadores bajos.
- `ξ`: decaimiento temporal (pondera partidos recientes); `w_t = exp(−ξ·Δt)`.
- `μ`: tasa base de goles del torneo/era.

---

## 3. Los modelos

### M0 — Baseline (Elo simétrico) · *ya existe* (`src/engine.py`)
`log λ_h = log μ + k·dr`, `log λ_a = log μ − k·dr` con `dr = Elo_h − Elo_a + ventaja`.
Producto `λ_h·λ_a = μ²` constante → goles totales fijos, sin ataque/defensa por equipo.
DC con `ρ` fijo. **Punto de comparación.**

### M1 — Dixon-Coles completo (modelo de trabajo)
$$\log\lambda_h = \mu + h + att_{local} + def_{visita},\quad \log\lambda_a = \mu + att_{visita} + def_{local}$$
- Marginales Poisson + factor `τ(i,j;ρ)` de Dixon-Coles para 0-0/1-1.
- **Decaimiento temporal** `ξ`: el log-likelihood pondera cada partido por `w_t`.
- Restricción `Σ att_i = 0` (identificabilidad). Ajuste por **MLE** (`scipy.optimize`).
- Variante de importancia: peso menor a amistosos vs partidos oficiales.
- Capta perfiles propios ("equipo goleador", "equipo que recibe poco"). **El workhorse.**

### M2 — Bayesiano jerárquico (pocos datos → *shrinkage*)
- `att_i ~ N(μ_att, σ_att)`, `def_i ~ N(μ_def, σ_def)` con hiperprioris → encoge fuerzas de
  equipos con pocos partidos hacia la media (clave en selecciones).
- Opcional **Poisson bivariado** (Karlis–Ntzoufras) para correlación local-visita en vez del
  parche `τ`.
- Opcional **fuerzas dinámicas** (espacio de estados, Koopman–Lit) que evolucionan en el tiempo.
- Implementación: PyMC/NumPyro (MCMC) o *empirical Bayes* liviano si el cómputo apura.

### M3 — Mercado (el benchmark a batir)
- Probabilidad implícita de las cuotas, **sin margen**. Métodos: multiplicativo, aditivo,
  **Shin** y **power** (los dos últimos calibran mejor; recomendados para 1X2).
- A nivel de marcador: si hay cuotas de *correct score*, se usan directo; si no, se ajusta una
  DC cuyas 1X2 + Over/Under reproduzcan el mercado (resolver `λ_h, λ_a, ρ` que casen con la
  probabilidad implícita). Resultado: un `ScoreGrid` "del mercado".
- Es el modelo más fuerte individualmente y la fuente del **CLV**.

### M4 — Machine Learning (features)
- **Objetivo recomendado**: predecir `λ_h, λ_a` con dos regresores y mantener la estructura
  Poisson/DC para obtener la grilla completa (interpretable y consistente con el resto).
  Alternativas: multinomial ordinal para 1X2, o multinomial directo de marcador (muy disperso).
- Algoritmo: **gradient boosting** (LightGBM/XGBoost) o GBT de sklearn.
- **Dos variantes para el paper**: *sin* cuotas como feature (¿el modelo bate al mercado por sí
  solo?) y *con* cuotas (¿agrega valor sobre el mercado?).

### M5 — Ensemble / stacking
- Combinar `p_k` de los modelos: **lineal** `Σ w_k p_k` o **log-lineal** `∝ Π p_k^{w_k}`.
- Pesos `w_k` en el símplex, ajustados minimizando RPS/log-loss en validación (stacking).
- Suele ganarle a cualquier modelo individual; el "producto final".

---

## 4. Features y covariables (para M1–M4)

| Grupo | Variables |
|---|---|
| Fuerza | Elo y ΔElo, ranking FIFA, att/def estimados (de M1/M2) |
| Forma | goles a favor/en contra rolling (k partidos), racha, xG si hay |
| Contexto | local/visita/neutral, sede, **altitud**, viaje/descanso, competición, importancia |
| Mercado | cuotas de-vig (solo en la variante "con mercado") |

---

## 5. Entrenamiento e inferencia
- **Walk-forward**: reajustar con cadencia (p. ej. mensual/por fecha FIFA); predecir solo hacia
  adelante. Nada de ajustar y evaluar sobre el mismo set.
- **Decaimiento temporal** en todos los que se ajustan (forma reciente pesa más).
- **Neutral/sede**: `h=0` en cancha neutral salvo anfitrión; altitud como covariable.
- **Amistosos**: peso menor que partidos oficiales.
- **Cold-start** (equipo con pocos partidos): prior/shrinkage (lo natural en M2; en M1 vía
  regularización).

---

## 6. De la predicción a la apuesta (brazo apuestas)
- **Valor**: por mercado, `edge = p_modelo − p_implícita_devig`. Apostar si `edge > umbral` y
  hay liquidez mínima.
- **Staking — Kelly fraccional**: con cuota decimal `o` (b = o−1) y prob `p`,
  `f* = (p·o − 1)/(o − 1)`; usar `¼–½·f*`, tope por apuesta y por exposición, bankroll virtual.
- **CLV (métrica reina)**: `CLV = o_tomada / o_cierre − 1` (o en prob). Mide si tomaste valor
  *antes* de que el mercado se moviera; es mucho menos ruidoso que el ROI.
- **Portafolio**: varios mercados por partido (1X2, O/U, correct score) → controlar correlación
  (no sobre-apostar el mismo evento) y exposición total.
- **Todos los modelos corren en paralelo**, cada uno con su bankroll → ranking por CLV/ROI.

---

## 7. Evaluación uniforme
- **Predicción**: RPS (ordinal, el indicado para 1X2), log-loss, Brier, curvas de calibración.
- **Apuestas**: ROI/yield, **CLV**, Sharpe, max drawdown, hit rate de valor.
- **Comparación**: Diebold–Mariano entre modelos; intervalos por bootstrap.
- Todo **walk-forward** + un *hold-out* final intocable.

---

## 8. Riesgos de modelado
- **Fuga**: incluir cuotas como feature hace difícil "batir al mercado" → variantes con/sin.
- **Sobreajuste**: regularización + walk-forward + hold-out.
- **Muestra chica** de selecciones → shrinkage (M2).
- **Cambios de régimen** (torneos vs amistosos, rotaciones) → pesos por importancia.

---

## 9. Orden de implementación sugerido
`M0 (existe)` → **`M3 mercado`** (benchmark + base de apuestas) → **`M1 DC completo`** (workhorse)
→ `M4 ML` → `M2 bayesiano` → `M5 ensemble`.
Razón: el mercado se necesita temprano (es el patrón de oro y lo que las apuestas comparan);
M1 es el caballo de batalla; M2/M4/M5 son refinamientos.

---

## 10. Estado del esqueleto (código)
Interfaz y primeros modelos en `research/` (livianos, sin dependencias pesadas todavía):
- `research/models/base.py` — `ScoreGrid` + clase abstracta `Model`.
- `research/models/m0_elo.py` — M0 envolviendo el motor actual.
- `research/models/market.py` — de-vig (multiplicativo / Shin / power) → base de M3.
- `research/betting/staking.py` — Kelly fraccional y CLV.
Las dependencias científicas (numpy/scipy/statsmodels/sklearn/PyMC) entran al ajustar M1/M2/M4.
