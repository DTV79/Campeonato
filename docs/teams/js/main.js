import {
    cargarConvocatoriaTeams,
    cargarDetalleTeams,
    cargarEstadoParejasTeams,
    cargarHorariosTeams
} from "./api.js?v=20261002-1320";

import {
    renderDetalleTeams,
    renderErrorTeams,
    renderSinTeams,
    mostrarCargandoTeams
} from "./render.js?v=20261002-1320";

const estado = {
    detalle: null,
    teamId: null
};

document.addEventListener("DOMContentLoaded", iniciarTeams, { once: true });
document.getElementById("teamsReintentar")?.addEventListener("click", iniciarTeams);

async function iniciarTeams() {
    mostrarCargandoTeams();

    const parametros = new URLSearchParams(window.location.search);
    estado.teamId =
        parametros.get("team") ||
        parametros.get("teams") ||
        null;

    try {
        const [detalle, convocatoria, horarios, estadoParejas] = await Promise.all([
            cargarDetalleTeams(estado.teamId),
            cargarConvocatoriaTeams(estado.teamId),
            cargarHorariosTeams(estado.teamId),
            cargarEstadoParejasTeams(estado.teamId)
        ]);

        if (detalle) {
            detalle.convocatoria = convocatoria?.personas || [];
            detalle.asignacion_predeterminada =
                convocatoria?.asignacion_predeterminada || null;
            detalle.modo_designacion_capitanes =
                convocatoria?.modo_designacion_capitanes || "administrador";
            detalle.modo_inicio_teams =
                convocatoria?.modo_inicio_teams || "administrador";
            detalle.inicio_programado_at =
                convocatoria?.inicio_programado_at || null;

            const horariosPorPartido = new Map(
                (horarios || []).map(item => [item.partido_id, item.propuestas || []])
            );
            const parejasPorPartido = new Map(
                (estadoParejas || []).map(item => [item.partido_id, item])
            );

            detalle.partidos = (detalle.partidos || []).map(partido => {
                const estadoPareja = parejasPorPartido.get(partido.id) || {};

                return {
                    ...partido,
                    propuestas: horariosPorPartido.get(partido.id) || [],
                    presenta_primero_equipo_id:
                        estadoPareja.presenta_primero_equipo_id || null,
                    estado_parejas:
                        Array.isArray(estadoPareja.equipos)
                            ? estadoPareja.equipos
                            : []
                };
            });
        }

        estado.detalle = detalle;

        if (!detalle) {
            renderSinTeams();
            return;
        }

        renderDetalleTeams(detalle);
    } catch (error) {
        console.error("No se pudo cargar Teams.", error);
        renderErrorTeams(error);
    }
}

window.addEventListener("popstate", () => {
    iniciarTeams();
});
