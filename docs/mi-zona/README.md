# Mi Zona · Sprint Pádel

Módulo privado e independiente de Teams.

## Estructura

- `mi-zona.html`: contenedor y navegación global.
- `mi-zona/js/config.js`: configuración y nombres de RPC.
- `mi-zona/js/api.js`: comunicación con Supabase.
- `mi-zona/js/session.js`: sesión local.
- `mi-zona/js/model.js`: reglas de presentación y utilidades.
- `mi-zona/js/render.js`: renderizado de login, equipos y partidos.
- `mi-zona/js/actions.js`: acciones del jugador/capitán.
- `mi-zona/js/main.js`: ciclo de vida.
- `mi-zona/css/*`: estilos separados por responsabilidad.

## Permisos

- Jugador: consulta, disponibilidad propia, propuestas de fecha, disponibilidad para fechas y resultados de los partidos que disputa.
- Capitán: todo lo anterior y además presentación de parejas y disponibilidad de su plantilla.
- Administración: no entra por Mi Zona; mantiene sus herramientas separadas.

## Resultado

Un jugador de la pareja introduce el resultado. Debe confirmarlo un jugador de la pareja rival. Si se impugna, el resultado no queda oficial y se crea una incidencia para Administración.
