# Estrategia de datos de cuotas (sin API key)

No tenemos key de cuotas, y scrapear sitios de casas en vivo es frágil y sujeto a ToS. La
solución limpia y estándar en la literatura es **football-data.co.uk**, que **publica** cuotas
de múltiples casas (incl. **Pinnacle**, la referencia *sharp*) en CSVs gratuitos, con
**apertura y cierre**. Dos tracks:

## Track A — Histórico (para backtest y paper)
- CSVs por liga/temporada: `https://www.football-data.co.uk/mmz4281/{season}/{div}.csv`
  (ej. `2324/E0.csv` = Premier 2023-24). Incluyen resultado + cuotas:
  - **Pinnacle** apertura `PSH/PSD/PSA` y **cierre** `PSCH/PSCD/PSCA` (línea de cierre = patrón
    de oro para CLV).
  - Bet365 `B365*`, y promedios/máximos de mercado `Avg*`, `Max*`.
- Ligas de clubes (EPL, La Liga, Serie A, Bundesliga, Ligue 1, …) → **miles de partidos con
  cuotas reales**. Es el dataset del **brazo de apuestas** del paper (no requiere scraping).
- Carga: `research/ingest/football_data.py` → tabla `fd` en SQLite.

## Track B — En vivo (job horario)
- `https://www.football-data.co.uk/fixtures.csv`: próximos partidos con cuotas de casas, se
  actualiza durante la semana.
- **Job horario** (GitHub Actions, cron `0 * * * *`) que baja el `fixtures.csv`, toma un
  **snapshot con timestamp** de las cuotas de cada partido próximo y lo **agrega** (append) a
  `research/odds_snapshots/<fecha>.jsonl` (git-native, incremental).
- Con la serie temporal de snapshots reconstruimos el **movimiento de la línea** y el **CLV**
  (cuota tomada vs cierre) para el paper-trading en vivo.
- Implementación: `research/ingest/snapshot_odds.py` + `.github/workflows/odds_snapshot.yml`.

## Por qué así y no scraping de casas
- **Legal/robusto**: football-data publica estos datos; no violamos ToS de casas ni peleamos
  anti-bot.
- **Reproducible**: cualquiera puede rehacer el backtest del paper desde los mismos CSVs.
- **Sharp**: trae Pinnacle (mercado eficiente), ideal como benchmark (M3) y para medir CLV.
- Si en el futuro se quiere una casa puntual no cubierta, se agrega un *source* al
  `snapshot_odds.py` (interfaz pluggable), asumiendo su fragilidad/ToS.

## Nota de costos (Actions)
El job horario son ~24 corridas/día (repo privado: ojo con los 2000 min/mes del free tier
sumado al `iterate` cada 4h). Opciones: dejarlo cada 1 h y, si aprieta, bajar a cada 2-3 h, o
hacer el repo público (no hay secretos en el repo; las credenciales viven en Secrets/Keychain).
