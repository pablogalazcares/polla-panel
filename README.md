# Mis Pollas — panel personal (P1)

Front estático y privado para monitorear desde el celular el estado de **mis** apuestas en
TODAS las pollas en las que participo (hub multi-polla). No es público ni de marketing: solo
lee un JSON generado por el modelo. Es uno de los tres productos del monorepo
(P1 polla · P2 research · P3 mundial).

## Qué muestra
- **Raíz (hub)**: una tarjeta por polla (puntos, proyección, Δ, mi posición, próximo cierre,
  bonus) + **próximos cierres unificados** de todas las pollas, ordenados por urgencia.
- **Detalle de cada polla** (al tocar la tarjeta):
  - **Hero**: mis puntos, proyección, Δ vs esperado, mi posición (si la plataforma la expone).
  - **Bonus**: campeón/subcampeón/goleador/mejor jugador (cuando la polla los tiene).
  - **Próximos cierres** de esa polla, con mi pick y cuenta regresiva.
  - **Mis apuestas vs puntos reales**: tabla ordenable (en celular usa código de 3 letras).
  - **Cambios del modelo** (cuando aplica), con el salto de puntos esperados.

## De dónde salen los datos
`apps/polla/data/polla.json` (schema 2, `{schema, updated_at, pools[]}`) lo genera el modelo:

```bash
python3 export/build_data.py
```
Fuentes por polla:
- **mundial** (golpredictor): `state/state.json` + `state/changes.jsonl`.
- **pollaya** (game.pollaya.com): `state/pollaya_state.json`, snapshot que escribe
  `apps/pollaya/run.py` (decisión: snapshot en repo, no fetch en build-time). Por privacidad
  el snapshot solo lleva **mi** posición (sin nombres de otros participantes).

Agregar una polla nueva = sumar una fuente en `build_data.py`; el front itera `pools[]`.

Escribe también `data/polla.js` (un `window.__POLLA__ = …`) como respaldo para abrir el
panel con doble clic en `file://`, donde el navegador suele bloquear `fetch()` de archivos
locales. En GitHub Pages se usa `polla.json` por `fetch` (datos frescos), con respaldo en
`localStorage` para offline.

## Cómo correrlo en local
```bash
python3 export/build_data.py
cd apps/polla && python3 -m http.server 8080
# abrir http://localhost:8080
```
(El doble clic en `index.html` también funciona gracias a `data/polla.js`.)

## Tecnología
HTML + CSS + JavaScript vanilla, **sin build ni dependencias**. PWA mínima (manifest +
service worker) para "agregar a pantalla de inicio" y funcionar offline. `noindex` para que
no aparezca en buscadores.

## Despliegue
Se publica a su propio GitHub Pages (subcarpeta `/polla`) desde el workflow del monorepo,
junto al resto de los productos.
