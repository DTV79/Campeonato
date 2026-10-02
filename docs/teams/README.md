# Teams · Web pública

Módulo público independiente dentro de Sprint Pádel.

## Entrada

- `../teams.html`

## JavaScript

- `js/config.js`: configuración y nombres de RPC.
- `js/api.js`: acceso a Supabase.
- `js/model.js`: normalización, etiquetas y reglas de presentación.
- `js/render.js`: coordinador de la interfaz.
- `js/render/preparacion.js`: reglas y convocatoria pública.
- `js/render/marcador.js`: marcador general y estadísticas de la serie.
- `js/render/plantillas.js`: composición de equipos.
- `js/render/partidos.js`: tarjetas de partidos, fechas, sets y estados.
- `js/main.js`: arranque y carga de la edición.

## CSS

- `css/base.css`: variables, reset y navegación base.
- `css/layout.css`: estructura general y rejillas.
- `css/components.css`: componentes.
- `css/responsive.css`: comportamiento móvil.

## Criterio de arquitectura

`render.js` se limita a coordinar los bloques principales. Cada zona visual
del Teams público tiene su propio módulo y no depende del JavaScript general
del campeonato.

## Base de datos

La web pública consume RPC de lectura específicas de Teams. Las alineaciones
no se exponen hasta que corresponde publicarlas.

Los resultados impugnados pueden mostrarse como provisionales, pero el motivo
de la incidencia no se expone en la web pública.
