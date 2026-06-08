# La Polla — panel personal (P1)

Front estático y privado para monitorear desde el celular el estado de **mis** apuestas en
la polla del Mundial 2026. No es público ni de marketing: solo lee un JSON generado por el
modelo. Es uno de los tres productos del monorepo (P1 polla · P2 research · P3 mundial).

## Qué muestra
- **Hero**: mis puntos reales, proyección al cierre, Δ vs esperado, "actualizado hace…".
- **Próximos cierres**: partidos que arrancan en <48 h, con mi pick y cuenta regresiva.
- **Mis apuestas vs puntos reales**: tabla ordenable (en celular usa código de 3 letras).
- **Cambios del modelo**: qué ajustó y por qué, con el salto de puntos esperados (toca para expandir).

## De dónde salen los datos
`apps/polla/data/polla.json` lo genera el modelo:

```bash
python3 export/build_data.py     # lee state/state.json + state/changes.jsonl
```

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
