# Mi Zona · Sprint Pádel

Módulo privado e independiente dentro de Sprint Pádel.

## Estructura

- `mi-zona.html`: contenedor y navegación global.
- `mi-zona/js/config.js`: configuración y nombres de RPC.
- `mi-zona/js/api.js`: comunicación con Supabase.
- `mi-zona/js/session.js`: sesión local.
- `mi-zona/js/model.js`: reglas y utilidades de dominio.
- `mi-zona/js/proxima-accion.js`: cálculo y tarjeta "Tu próxima acción".
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
- `mi-zona/js/actions.js`: eventos y llamadas de las acciones del jugador/capitán.
- `mi-zona/js/main.js`: ciclo de vida.
- `mi-zona/css/*`: estilos separados por responsabilidad.

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
