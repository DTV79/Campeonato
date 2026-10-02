import {
    cargarConvocatoriaTeams,
    cargarDetalleTeams,
    cargarHorariosTeams
} from "./api.js?v=20261002-1135";

import {
    renderDetalleTeams,
    renderErrorTeams,
    renderSinTeams,
    mostrarCargandoTeams
} from "./render.js?v=20261002-1120";

const estado = {
    detalle: null,
    teamId: null
};

document.addEventListener("DOMContentLoaded", iniciarTeams, { once: true });
document.getElementById("teamsReintentar")?.addEventListener("click", iniciarTeams);

async function iniciarTeams() {
    mostrarCargandoTeams();

    const parametros = new URLSearchParams(window.location.search);
    estado.teamId = parametros.get("teams") || null;

    try {
        const [detalle, convocatoria, horarios] = await Promise.all([
            cargarDetalleTeams(estado.teamId),
            cargarConvocatoriaTeams(estado.teamId),
            cargarHorariosTeams(estado.teamId)
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
            detalle.partidos = (detalle.partidos || []).map(partido => ({
                ...partido,
                propuestas: horariosPorPartido.get(partido.id) || []
            }));
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
