# Referencias y alineación de la evaluación

## Referencia central (cómo evaluar)
**Álvarez, Galaz, Durán et al. (2024).** *Data science approach to simulating the FIFA World
Cup Qatar 2022 at a website in tribute to Maradona.* **Computational Statistics** (Springer).
DOI: 10.1007/s00180-024-01557-3. Sitio: `301060.exactas.uba.ar` (301060 = natalicio de
Maradona, 30-10-1960).

Qué hace y por qué nos sirve de patrón:
- Construye sobre **Dixon & Coles (1997)** un **Poisson con ataque/defensa por equipo +
  ventaja de localía**.
- Calibración que pondera **importancia del partido** y **recencia** (decaimiento temporal).
- **Simulación Monte Carlo** del torneo → probabilidades de ganar partido / avanzar / ser campeón.
- **Evaluación**: su desempeño *iguala o supera al Poisson tradicional y es comparable a las
  casas de apuestas*. → baselines = **Poisson** y **mercado**; métrica de calidad probabilística.

**Esto valida nuestro diseño:** su modelo ≡ nuestro **M1** (Dixon-Coles completo con importancia
y recencia); sus baselines ≡ nuestros **M0** (Poisson) y **M3** (mercado).

## Otras referencias
- **Dixon, M. & Coles, S. (1997).** *Modelling Association Football Scores and Inefficiencies
  in the Football Betting Market.* JRSS-C. (Base de M0/M1: corrección τ para marcadores bajos.)
- **Constantinou, A. & Fenton, N. (2012).** *Solving the problem of inadequate scoring rules
  for assessing probabilistic football forecast models.* (Uso del **RPS** como métrica ordinal
  correcta para 1X2; comparación contra casas.)
- **Karlis & Ntzoufras (2003).** Poisson bivariado (base de M2).
- **Baio & Blangiardo (2010).** Modelo jerárquico bayesiano de fútbol (base de M2, shrinkage).

## Alineación de nuestra evaluación (lo que adoptamos)
1. **Métrica primaria: RPS** (Ranked Probability Score) para 1X2 — ordinal, penaliza según la
   distancia del error (lo correcto para resultados ordenados). Complementos: log-loss/ignorancia,
   Brier y curvas de calibración.
2. **Baselines obligatorias**: M0 (Poisson/Elo) y M3 (mercado de-vig). Un modelo "sirve" si le
   gana al Poisson y se acerca o supera al mercado en RPS.
3. **Validación walk-forward** (origen móvil) + *hold-out* final. Nada de ajustar y evaluar en
   el mismo set.
4. **Pesos por importancia y recencia** en el ajuste (como el paper de referencia).
5. **Nivel torneo**: además de partido a partido, simular Monte Carlo y evaluar probabilidades
   de avanzar/campeón contra lo ocurrido y contra las casas.
6. **Apuestas**: sobre lo anterior, medir **CLV** y ROI del paper-trading (extiende la evaluación
   del paper hacia el brazo de mercado, que es nuestra contribución nueva).
