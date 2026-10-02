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
- `mi-zona/js/render/partidos.js`: partidos y acciones asociadas.
- `mi-zona/js/actions.js`: acciones del jugador/capitán.
- `mi-zona/js/main.js`: ciclo de vida.
- `mi-zona/css/*`: estilos separados por responsabilidad.

## Criterio de arquitectura

`render.js` no contiene ya toda la interfaz. Actúa únicamente como coordinador
y delega cada bloque funcional en su módulo. Los módulos de dominio y las
acciones siguen separados del pintado de la interfaz.

## Permisos

- Jugador: consulta, disponibilidad propia, propuestas de fecha, respuesta a fechas y resultados de los partidos que disputa.
- Capitán: todo lo anterior y además presentación de parejas y disponibilidad de su plantilla.
- Administración: mantiene sus herramientas separadas.

## Resultado

Un jugador de la pareja introduce el resultado. Debe confirmarlo un jugador de
la pareja rival. Si se impugna, el resultado no queda oficial y se crea una
incidencia para Administración.
