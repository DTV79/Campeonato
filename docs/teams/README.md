# Teams · Web pública

Este bloque es independiente de la web principal del campeonato.

## Entrada

- `../teams.html`

## JavaScript

- `js/config.js`: configuración y nombres de RPC.
- `js/api.js`: acceso a Supabase.
- `js/model.js`: normalización, etiquetas y reglas de presentación.
- `js/render.js`: pintado de la interfaz.
- `js/main.js`: arranque, estado de página y cambio de edición.

## CSS

- `css/base.css`: variables, reset y navegación base.
- `css/layout.css`: estructura general y rejillas.
- `css/components.css`: marcador, equipos, partidos, sets y ediciones.
- `css/responsive.css`: comportamiento móvil.

## Base de datos

La web pública solo consume RPC de lectura:

- `web_teams_detalle_publico(uuid)`
- `web_teams_ediciones_publicas()`

Las alineaciones no se exponen hasta que el partido tenga
`alineaciones_publicadas_at`.

Los resultados impugnados pueden mostrarse como provisionales, pero el motivo
de la incidencia no se expone en la web pública.
