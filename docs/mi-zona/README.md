# Mi Zona · Sprint Pádel

Módulo privado e independiente dentro de Sprint Pádel.

## Estructura

- `mi-zona.html`: contenedor y navegación global.
- `mi-zona/js/config.js`: configuración y nombres de RPC.
- `mi-zona/js/api.js`: comunicación con Supabase.
- `mi-zona/js/session.js`: sesión local.
- `mi-zona/js/model.js`: reglas y utilidades de dominio.
- `mi-zona/js/proxima-accion.js`: orquestador de "Tu próxima acción".
- `mi-zona/js/proxima-accion/teams.js`: acciones y estados derivados de partidos Teams.
- `mi-zona/js/proxima-accion/preparacion.js`: acciones previas al inicio.
- `mi-zona/js/proxima-accion/convocatorias.js`: acciones de convocatoria.
- `mi-zona/js/proxima-accion/render.js`: tarjeta visual.
- `mi-zona/js/proxima-accion/utils.js`: utilidades puras.
- `mi-zona/js/render.js`: coordinador de render.
- `mi-zona/js/render/core.js`: carga, errores y acceso.
- `mi-zona/js/render/convocatorias.js`: convocatorias.
- `mi-zona/js/render/preparacion.js`: capitanes e inicio.
- `mi-zona/js/render/teams.js`: tarjeta de competición y plantilla.
- `mi-zona/js/render/partidos.js`: coordinador de la tarjeta de partido.
- `mi-zona/js/render/accion-alineacion.js`: presentación de parejas.
- `mi-zona/js/render/accion-horario.js`: propuestas y gestión de fecha.
- `mi-zona/js/render/accion-resultado.js`: envío y confirmación del resultado.
- `mi-zona/js/render/partido-resultado.js`: marcador mostrado en el partido.
- `mi-zona/js/actions.js`: enlace de los eventos delegados.
- `mi-zona/js/actions/click.js`: acciones de los botones.
- `mi-zona/js/actions/submit.js`: envío de los formularios.
- `mi-zona/js/actions/formulario.js`: mensajes, bloqueo y ejecución.
- `mi-zona/js/actions/sets.js`: lectura de los marcadores.
- `mi-zona/js/main.js`: ciclo de vida.
- `mi-zona/css/components.css`: índice de los bloques de `mi-zona/css/components/`, en el orden original.
- `mi-zona/css/proxima-accion.css`: estilos exclusivos de la tarjeta "Tu próxima acción".
- `mi-zona/css/*`: resto de estilos separados por responsabilidad.

## Criterio de arquitectura

Los coordinadores no concentran ya toda la interfaz. Cada bloque funcional
vive en un módulo propio, manteniendo las reglas de dominio, el acceso a datos
y los eventos separados del renderizado.

## Permisos

- Jugador: consulta, disponibilidad propia, propuestas de fecha, respuesta a fechas y resultados de los partidos que disputa.
- Capitán: todo lo anterior y además presentación de parejas y disponibilidad de su plantilla.
- Administración: mantiene sus herramientas separadas.

## Resultado

Un jugador de la pareja introduce el resultado. Debe confirmarlo un jugador de
la pareja rival. Si se impugna, el resultado no queda oficial y se crea una
incidencia para Administración.
