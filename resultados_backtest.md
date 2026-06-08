# Resultados del backtest (línea base del paper)

Walk-forward sin fuga: M1 (Dixon-Coles) ajustado en temporadas 21/22–23/24 y evaluado en
24/25 (fuera de muestra). Métrica **RPS** (1X2). Datos reales de clubes con cuotas
(football-data.co.uk). Reproducible con `python3 research/backtest/walkforward.py`.

## RPS (más bajo = mejor)

| Liga | RPS M1 | RPS mercado (Pinnacle cierre) | RPS naive | n |
|---|---|---|---|---|
| Bundesliga (D1) | 0.2150 | 0.2021 | 0.2394 | 306 |
| Premier (E0) | 0.2128 | 0.1962 | 0.2358 | 380 |
| Ligue 1 (F1) | 0.2128 | 0.2008 | 0.2363 | 306 |
| Serie A (I1) | 0.1900 | 0.1838 | 0.2283 | 380 |
| La Liga (SP1) | 0.1992 | 0.1873 | 0.2287 | 380 |
| **TOTAL** | **0.2053** | **0.1934** | **0.2334** | **1752** |

## Lectura
- **M1 es un modelo legítimo**: bate al naive por ~0.028 de RPS.
- **El mercado sigue arriba** por ~0.012: es el techo *sharp* a alcanzar. Coincide con la
  literatura y con el paper de referencia (Galaz/Durán et al.): un Dixon-Coles bien ajustado
  *iguala o mejora al Poisson tradicional y queda cerca de las casas*.
- **Implicancia**: (1) anclar la polla al mercado mejora las apuestas (ya implementado);
  (2) el brazo de apuestas debe buscar los pocos partidos donde M1/ensemble disienta del
  mercado con fundamento (valor), midiendo CLV.

## Paso 4 — Peso óptimo del blend (modelo+mercado)
Barrido de `w` en `w·mercado(cierre) + (1-w)·M1` (RPS, 1752 partidos):
la curva es plana entre 0.70 y 1.00; el **óptimo es w≈1.0** (RPS 0.1934). Contra el cierre
*sharp*, el modelo no aporta RPS. → Para la polla anclamos fuerte al mercado (`market_weight`
subido a **0.75**; se mantiene algo de modelo por los overrides/noticias). Reproducible:
`python3 research/backtest/blend_weight.py`.

## Paso 2 — Backtest de apuestas (CLV) vs Pinnacle
Apostando donde M1 ve valor (EV>3%) contra la **apertura** de Pinnacle, Kelly ¼:
- **1945 apuestas · ROI −9.5% · CLV medio −0.77% · CLV>0 solo 45.9%**.
- Lectura honesta: **M1 NO le gana al cierre de Pinnacle**. Cuando M1 disiente del mercado,
  el mercado suele tener razón (la línea se mueve en contra de las apuestas de M1). Batir una
  casa *sharp* requiere casas blandas / mercados ineficientes / mejor información, no un modelo
  solo. Esto define el brazo de apuestas del paper. Reproducible:
  `python3 research/betting/backtest_bets.py`.

## Paso 1 — M4 (ML) + M5 (ensemble)
M4 = gradient boosting (HistGB) sobre forma reciente (GF/GA/pts rolling) + mercado de apertura.
M5 = pool lineal de [M1, M4, mercado_apertura] con pesos ajustados en validación temporal
(40% del test) y evaluados en el resto (1023 partidos). RPS:

| modelo | RPS (eval) |
|---|---|
| M1 Dixon-Coles | 0.2125 |
| **M4 (ML)** | **0.2031** |
| **Ensemble M5** | **0.1989** |
| Mercado apertura | 0.1991 |
| Mercado cierre (benchmark) | 0.1974 |

Pesos óptimos del ensemble: **[M1=0.0, M4=0.1, mercado=0.9]** → recupera el mercado. El M4 mejora
a M1; el ensemble **supera levemente a la apertura** (0.1989<0.1991) pero **no al cierre**
(0.1974). Con info pre-cierre te acercas mucho; la línea de cierre sigue siendo el techo.
Reproducible: `python3 research/backtest/ensemble.py`.

## Paso 3 — M2 bayesiano (shrinkage) en selecciones
Dixon-Coles con penalización L2 (= MAP jerárquico) sobre internacionales (train 2021-06→2024-06,
test→2026-06). RPS:

| modelo | RPS total | RPS data-poor |
|---|---|---|
| M1 (l2=0) | 0.1672 | 0.1515 |
| M2 (l2=8) | 0.1931 | 0.2140 |
| M2 (l2=20) | 0.2046 | 0.2197 |

**El shrinkage hacia la media global empeora.** El fútbol de selecciones tiene dispersión de
fuerza enorme; los equipos con pocos datos suelen ser minnows genuinamente extremos, y encoger
hacia el promedio borra señal (de ahí que el subconjunto data-poor se degrade más). **Conclusión
para el paper:** un M2 útil debe encoger hacia un **prior informativo (Elo/FIFA), no la media
global**. Reproducible: `python3 research/backtest/internationals.py`.

> Nota: el RPS de internacionales (~0.167) es más bajo que el de clubes (~0.20) porque hay más
> partidos desbalanceados (resultado "obvio"), más fáciles de predecir.

## Motor de bankroll — retorno esperado por estrategia
$1000 inicial, Kelly ¼, EV>2%, temporada 24/25 (1752 partidos), apostando al MEJOR precio
disponible (line shopping) vs al cierre de Pinnacle. `research/betting/{engine,simulate}.py`.

| estrategia | final $ | ROI capital | yield | apuestas | maxDD |
|---|---|---|---|---|---|
| M1 @ Pinnacle cierre | 10 | −99% | −8.0% | 1595 | 0.99 |
| M1 @ mejor precio (cierre) | 21 | −98% | −5.8% | 1703 | 0.99 |
| M1 @ mejor precio (apertura) | 17 | −98% | −6.4% | 1676 | 0.99 |
| **Mercado-justo @ mejor precio** | **997** | **−0.3%** | −0.1% | 689 | 0.21 |

**Conclusiones (núcleo del brazo de apuestas):**
1. Un modelo que apuesta sus desacuerdos con el mercado **se funde** (su edge es ilusorio);
   Kelly sobre un edge falso lleva a ruina (maxDD 99%).
2. **Line shopping con probabilidad del mercado ≈ break-even** (−0.3%, maxDD 21%): tomar el
   mejor precio casi anula el vig.
3. **La ganancia exige casas menos eficientes** (mayor brecha mejor-precio vs justa) o un
   modelo que de verdad supere al mercado. Es la dirección del paper.

> Nota CLV: comparar el mejor precio contra el cierre de Pinnacle da CLV+ casi mecánico
> (max≥Pinnacle); el ROI/capital es la señal honesta, no ese CLV.

## Bankroll por modelo — 5 ligas, temporada 24/25
$1000 al inicio de temporada, apuesta al MEJOR precio (line shopping), Kelly ¼, EV>2%, 1705
partidos. `research/backtest/club_models.py` (arma el dataset) + `research/betting/simulate_models.py`.

| modelo | final $ | ROI | yield | apuestas | maxDD |
|---|---|---|---|---|---|
| **m4 (ML)** | **1350** | **+35%** | +0.9% | 1684 | **0.81** |
| ensemble (M1+M4+mercado) | 1084 | +8.4% | +0.3% | 1622 | 0.70 |
| market (line shopping) | 1011 | +1.1% | +0.3% | 674 | 0.19 |
| m1 (Dixon-Coles) | 43 | −96% | −3.4% | 1657 | 0.99 |

**Hallazgos:**
- **M4 (ML, forma + mercado) genera retorno (+35%)** apostando al mejor precio — el primer
  modelo que parece encontrar valor real. PERO con **drawdown brutal (81%)**: es de alta
  varianza. *Caveat fuerte:* una sola temporada, M4 usa la cuota de apertura como feature, y
  1684 apuestas no bastan para declarar edge durable. **Hay que validarlo walk-forward en varias
  temporadas** antes de confiar.
- **market (line shopping)** es el ancla segura: ~flat-positivo (+1%) con maxDD bajo (19%).
- **m1/elo se funden**: no apostar modelos estructurales puros.

**Estrategia óptima (return/riesgo), del barrido:**
- **Kelly ≤ ¼**; Kelly ½ siempre destruye (sobre-apuesta → ruina).
- Más filtro de edge → menos apuestas, menos drawdown. min_edge 0.10 + Kelly 0.10 ≈ plano con
  maxDD 6%; min_edge 0 + Kelly ¼ ≈ +4% con maxDD 24%.
- **Conclusión de calibración:** la palanca de riesgo es la fracción de Kelly y el umbral de
  edge, no el modelo; M4 es el candidato a edge real pero exige validación y control de riesgo
  (Kelly bajo) por su varianza.

## Bankroll WALK-FORWARD multi-temporada (5 ligas, 20/21–24/25)
Reajuste por temporada con datos previos (expanding window, sin fuga), $1000 reset por
temporada, mejor precio, Kelly 0.20, EV>3%. `research/backtest/walkforward_bankroll.py`.

| modelo | 20/21 | 21/22 | 22/23 | 23/24 | 24/25 | media | peor DD |
|---|---|---|---|---|---|---|---|
| **market** | +23% | −4% | +87% | −15% | −0% | +18% | **0.36** |
| m1 | −91% | +553% | −98% | −100% | −95% | +34% | 1.00 |
| m4_mkt | −28% | +458% | −12% | +78% | −73% | +85% | 0.90 |
| m4_form | −100% | −97% | −91% | −100% | −100% | −98% | 1.00 |
| logreg | −44% | +544% | −46% | +33% | −40% | +89% | 0.78 |
| ensemble | +31% | +818% | −52% | −79% | −62% | +131% | 0.85 |

**Hallazgo central (corrige el +35% de M4):**
- El "+35%" de M4 de una sola temporada **era VARIANZA, no edge.** Las medias altas (m4 +85%,
  logreg +89%, ensemble +131%) las infla **una sola temporada (21/22)** donde TODOS los modelos
  explotaron +400/+800% — y en las demás se funden (−50% a −100%, drawdown ~1.00 = ruina total).
  Que todos salten juntos en 21/22 huele a anomalía de mercado/varianza, no a skill.
- **m4_form (sin mercado) pierde TODAS las temporadas** (−98%): un modelo que no usa el mercado
  no le gana al mercado. Confirma que la info del mercado es esencial.
- **market (line shopping) es el ÚNICO consistente y survivable**: +23/−4/+87/−15/−0,
  drawdown máximo 0.36 (vs ~1.0 de los demás). Su media (+18%) está inflada por el +87% de 22/23;
  la mediana es ~break-even. Es positivo-modesto con riesgo controlado.

**Conclusión de calibración (la importante):** batir al mercado con estos modelos **no se
sostiene fuera de muestra** — los "edges" son ruido que se ve lindo en una temporada y arruina
en las otras. La única estrategia robusta es **line shopping con probabilidad de mercado +
Kelly bajo**. El brazo de apuestas del paper debe enfocarse ahí (mejor precio, casas blandas,
control de riesgo), no en un modelo que "le gane" al mercado.

## Diagnóstico de la varianza (¿por qué explota?)
`research/backtest/diagnose_variance.py` — yield PLANO (1u/apuesta, sin Kelly) sobre 8730 apuestas:

| modelo | cuota media | %longshot(>4) | acierto | yield@mejor-precio | yield@cierre |
|---|---|---|---|---|---|
| market | 4.72 | 42% | 29% | +0.21% | +0.00% |
| m1 | 4.91 | 46% | 28% | −1.98% | −6.95% |
| m4_mkt | 4.29 | 33% | 33% | +2.18% | −1.18% |
| m4_form | 5.13 | 49% | 26% | −4.06% | −8.43% |
| ensemble | 4.94 | 44% | 28% | −0.29% | −4.55% |

**Causa de las explosiones (3 piezas):**
1. **Sin Kelly, los "edges" desaparecen**: el yield plano de todos está en ~0% (−4% a +2%). Las
   explosiones de +400/+800% por temporada eran **Kelly compuesto** sobre ~1700 apuestas
   amplificando un edge ≈0 en un paseo aleatorio de cola gorda (una temporada sube 9×, otra a 0).
2. **Apostar al precio MÁXIMO sesga a longshots**: `p×max_odds>1` se cumple sobre todo en cuotas
   altas (cuota media ~4.8, ~45% son longshots). Los longshots ganan poco y pagan mucho → varianza
   extrema. Por eso *todos* los modelos saltan juntos en 21/22: esa temporada los longshots pegaron.
3. **El único edge real y estable es el line shopping**: el salto yield@mejor-precio vs @cierre es
   ~+5% en los modelos (m1: −6.95→−1.98). Tomar el mejor precio quita casi todo el vig, pero no
   crea ganancia por si solo.

**Restringiendo a cuotas ≤4 (sin longshots), stake plano, mejor precio:** la varianza se desploma
y `market` da **yield +2.04%** (acierto 39%) — el candidato a estrategia desplegable: line
shopping, cuotas moderadas, stake plano/bajo. Los modelos siguen ≤0.

**Conclusión:** la varianza es del **staking (Kelly) + longshots**, no del modelo. Estrategia
robusta = line shopping, cuotas moderadas, stake plano/Kelly muy bajo. Edge real ≈ pequeño y
proviene del precio, no de predecir mejor que el mercado.

## Comparacion completa: modelo x banda de cuota (yield plano)
`research/backtest/compare_strategies.py`. Yield plano (sin Kelly), mejor precio:

| modelo | todas | ≤2.5 | ≤4 | 2.5-4 | >4 longshot |
|---|---|---|---|---|---|
| market | +0.3% | **+2.5%** | +2.3% | +1.3% | **−4.3%** |
| m4_mkt | +2.3% | +2.0% | +1.5% | +2.6% | +3.3% |
| m1 | −2.3% | −0.8% | +0.1% | +2.3% | −4.9% |
| m4_form | −4.3% | −2.4% | −1.3% | −0.3% | −4.8% |
| logreg | +0.2% | +1.3% | +0.9% | −0.1% | +0.9% |
| ensemble | +0.0% | +0.4% | −0.3% | −0.3% | −0.8% |

**Consistencia por temporada, banda ≤4:**

| modelo | yield | temps+ | 20/21 21/22 22/23 23/24 24/25 |
|---|---|---|---|
| **market** | **+2.3%** | **5/5** | +2.6 +2.7 +1.3 +1.7 +3.0 |
| m4_mkt | +1.5% | 3/5 | −0.4 +3.0 −0.5 +5.7 0.0 |
| m1 | +0.1% | 3/5 | −1.9 +4.8 +0.9 +1.1 −4.8 |
| logreg | +0.9% | 3/5 | −1.2 +2.6 +0.8 +7.9 −5.3 |
| ensemble | −0.3% | 2/5 | −3.4 +5.1 +2.2 −0.3 −6.0 |

**Hallazgo robusto del paper:** **line shopping (mejor precio) con probabilidad de mercado, en
cuotas ≤4 (favoritos/moderadas), es positivo en LAS 5 temporadas (+2.3% yield).** Es el único
edge estable. Los longshots (>4) pierden para casi todos (−4 a −5%) = la fuente de la varianza.
Los modelos sofisticados no agregan edge consistente; el valor está en **el precio, no en
predecir mejor**. Estrategia desplegable = mejor precio + prob de mercado + cuotas ≤4 + stake
plano/Kelly bajo.

## Caracterizacion por familias + Router (mixture-of-experts)
`research/backtest/segment_analysis.py` (donde rinde cada modelo) + `research/backtest/router.py`
(gating por reglas, validado walk-forward: aprende en 20/21-22/23, evalua en 23/24-24/25).

**Caracterizacion (yield plano, in-sample):** emergen familias — m4_mkt fuerte en favoritos
pesados/cuota baja (+6/+7%); market/ensemble en empates (+6/+8%); apostar A FAVOR del mercado
gana (+3%) y CONTRA pierde; enorme variacion por liga (Ligue 1 +6/+8%, La Liga −5%).

**Pero el router NO sobrevive fuera de muestra (regimen cuotas ≤4, TEST 23/24-24/25):**

| estrategia | yield TEST |
|---|---|
| **market (siempre, ≤4)** | **+2.3%** |
| m4_mkt | +1.3% |
| router[mejor modelo x familia] | −0.4% a −2.2% |
| market-gated[salta familias malas] | +0.4% a +1.7% |

**Conclusion (negativo robusto, valioso para el paper):** las ventajas por familia son
**in-sample (no estacionarias)**; rutear al "mejor experto por tipo de partido" **overfittea y
pierde** fuera de muestra, y hasta gatear *donde* apostar empeora. **La estrategia mas simple —
line shopping + prob de mercado + cuotas ≤4, apostar todo — es la robusta (+2.3%, se sostiene en
temporadas no vistas).** El edge es estructural (el precio), no predictivo ni por segmento.
Donde si podria haber edge mayor: mercados/ligas menos eficientes (sin explorar aun).

## Mercados: Europa vs Sudamerica/Mexico (line shopping)
`research/ingest/football_data_extra.py` (ingesta ARG/BRA/MEX, 16.386 partidos) +
`research/backtest/markets.py`. Yield plano, prob de mercado @ mejor precio, desde 2019:

| mercado | n | premio% | yield ≤4 | yield todas | %longshot |
|---|---|---|---|---|---|
| EPL (E0) | 2280 | 4.55% | +1.71% | +2.37% | 38% |
| La Liga (SP1) | 2280 | 4.03% | +2.06% | −1.32% | 29% |
| Serie A (I1) | 2280 | 4.14% | +5.47% | +2.09% | 33% |
| Bundesliga (D1) | 1836 | 4.49% | +3.33% | +3.85% | 34% |
| Ligue 1 (F1) | 2031 | 4.04% | −0.59% | +4.85% | 32% |
| **Argentina** | 3556 | 3.52% | **+4.89%** | **+7.69%** | 14% |
| **Brasil** | 2837 | 3.49% | +3.92% | +2.84% | 22% |
| **Mexico** | 2484 | 2.69% | +5.00% | +2.33% | 21% |

**Hallazgo:** ARG/BRA/MEX dan yields ≤4 mas altos (+4-5%) que el promedio europeo (~+2.3%) y con
menos longshots. El "premio" del mejor-precio es *menor* (menos casas las cubren), pero la linea
de cierre es **menos sharp** → mas batible. Confirma la hipotesis: **mercados menos eficientes =
mas edge** (Chile no esta en football-data).

## Dos routers (mixture-of-experts) como modelos
`research/backtest/router.py`. Walk-forward (train 20/21-22/23, test 23/24-24/25, cuotas ≤4):

| modelo | yield TEST |
|---|---|
| market (simple) | +2.3% |
| m4_mkt | +1.3% |
| **router 1 — gating por reglas (familia→experto)** | −0.4% a −2.2% (OVERFIT) |
| **router 2 — STACKING (logistica combina m1+m4+market)** | **+3.8%** |

**Contraste central:** el **gating DURO** (rutear al mejor experto por familia) sobreajusta y
pierde; el **stacking SUAVE** (una logistica aprende a combinar las probabilidades de los
modelos) **generaliza y supera al mercado** (+3.8% vs +2.3%) fuera de muestra. → El segundo
router (stacking) es el mejor modelo del brazo de apuestas hasta ahora.

## Prediccion en torneos de selecciones (RPS, sin cuotas)
`research/backtest/tournaments.py`. Por edicion (2018+), M1 ajustado con internacionales previas
(sin fuga). Se compara RPS torneo vs amistosos de los 90 dias previos (MISMO modelo) y vs ligas.

| torneo | n | RPS M1 | RPS naive | amistosos previos |
|---|---|---|---|---|
| **FIFA World Cup** | 128 | **0.2100** | 0.2428 | 0.1645 |
| UEFA Euro | 102 | 0.1844 | 0.2349 | 0.1425 |
| **Copa América** | 86 | **0.1549** | 0.2241 | 0.1464 |
| African Cup of Nations | 208 | 0.1852 | 0.2206 | 0.1504 |
| AFC Asian Cup | 102 | 0.1726 | 0.2367 | 0.1521 |
| **TODOS los torneos** | 626 | 0.1839 | 0.2306 | 0.1518 |
| Ref. ligas de clubes | | ~0.205 | | mercado ~0.193 |

**Hallazgos:**
- **El Mundial es el MAS dificil de predecir** (0.2100), incluso mas que las ligas de clubes
  (0.205): mejores equipos, parejos, eliminacion directa, cancha neutral.
- **Copa América / Asian Cup son los mas faciles** (0.155 / 0.173): mayor dispersion de fuerza
  (favoritos enormes vs minnows).
- **Control limpio:** con el MISMO modelo, mismo periodo y equipos, los **torneos (0.184) son
  bastante mas dificiles que los amistosos previos (0.152)** — la naturaleza competitiva/
  eliminatoria reduce la predictibilidad (~+0.03 RPS).
- **M1 aporta mas en selecciones que en clubes**: bate al naive por ~0.047 (vs ~0.028 en clubes),
  porque la dispersion de fuerza internacional es mayor.
- Limite: sin cuotas historicas gratis de torneos -> es calidad de prediccion (RPS), no apuestas.
  El brazo de apuestas del Mundial 2026 corre EN VIVO (the-odds-api).

## Caracterizacion para el Mundial 2026 (fase y balance)
`research/backtest/characterize.py`. M1 en todos los torneos (eliminatoria = ambos equipos con
≥3 partidos en la edicion). RPS, % sorpresa (cae el favorito), % empate.

**Torneos — grupo vs eliminatoria:** grupo RPS 0.181 (M1 bate naive por 0.054); eliminatoria
0.191 (bate naive solo por 0.028 -> el modelo aporta LA MITAD en eliminatorias; mas empates).

**Torneos — por balance (lo decisivo):**
| balance | RPS M1 | RPS naive | sorpresa% |
|---|---|---|---|
| favorito fuerte | 0.1467 | 0.2267 | 28% |
| favorito medio | 0.1891 | 0.2314 | 46% |
| parejo | 0.2153 | 0.2335 | **57%** |

**Mundial:** grupo RPS 0.214 (bate naive 0.259); **eliminatoria 0.198 PEOR que naive 0.195** ->
el modelo tiene valor NEGATIVO en los mata-mata del Mundial (son casi una moneda al aire).

**Ligas (clubes) por balance:** favFuerte M1 0.150 / mkt 0.140; favMedio 0.224 / 0.212;
parejo 0.235 / 0.221. Mismo patron: el mercado gana en todos los buckets.

**Conclusion para la estrategia del Mundial 2026:** la predictibilidad la manda el **balance**,
no el modelo ni la competicion: favoritos claros = predecibles (~0.147); parejos = casi azar
(sorpresa 57%, M1 ≈ naive). En eliminatorias del Mundial el modelo es inutil. ->
**El "router" del Mundial debe gatear por BALANCE (estructural y estable en torneos Y ligas),
no por familia (que overfittea):** apostar line shopping en **partidos con favorito claro,
cuotas ≤4, fase de grupos**; **saltar parejos y eliminatorias** (azar). El gate de balance es
implementable en vivo (la fuerza del favorito sale de las ~25 casas que capturamos).

## Matriz torneos x modelos (RPS)
`research/backtest/matrix.py` -> `research/results/tournament_matrix.json` (para la pagina).
Modelos basados en resultados (sin cuotas en torneos), por edicion 2018+ sin fuga.

| torneo | naive | Elo (M0) | M1 | M2 (shrink) | ensemble | n |
|---|---|---|---|---|---|---|
| Mundial | 0.2428 | 0.2089 | 0.2100 | 0.2233 | 0.2093 | 128 |
| Eurocopa | 0.2349 | 0.1880 | **0.1844** | 0.1943 | 0.1865 | 102 |
| Copa América | 0.2241 | **0.1497** | 0.1549 | 0.1818 | 0.1583 | 86 |
| Copa África | 0.2206 | 0.1896 | **0.1852** | 0.1968 | 0.1877 | 208 |
| Copa Asia | 0.2367 | 0.1801 | **0.1726** | 0.2135 | 0.1821 | 102 |
| **TODOS** | 0.2306 | 0.1863 | **0.1839** | 0.2025 | 0.1870 | 626 |

**Hallazgos:** **M1 (Dixon-Coles) es el mejor predictor de torneos** (0.184), con Elo/M0 segundo
muy cerca (0.186; mejor en Copa América). **M2 (shrinkage) empeora** en todos -> confirmado: el
prior de media global no sirve en selecciones (dispersion grande). El ensemble queda como M1
(lo arrastra M2; un ensemble Elo+M1 sin M2 seria el mejor). Todos baten al naive con holgura.
El Mundial sigue siendo el mas dificil (mejor modelo 0.209 vs Copa América 0.150).

**Para el Mundial 2026:** probabilidad = mercado en vivo (mejor que cualquier modelo) o, sin
cuotas, M1/Elo; la DECISION de apostar la da el gate de balance (favorito claro + cuota ≤4 +
grupos). Ya implementado como modelo `gated` en el bankroll en vivo.

## Próximos pasos del modelado
- **M5 ensemble** (M1 + mercado + M4 ML) para cerrar/cruzar la brecha de 0.012.
- **M2 bayesiano** (shrinkage) para selecciones (pocos datos) → aplicar al Mundial.
- **Walk-forward más fino** (reajuste mensual) y calibración del `market_weight` del blend.
- **Backtest de apuestas**: value + Kelly + CLV sobre los mismos datos con cuotas.
