import {
    cargarConvocatoriaTeams,
    cargarDetalleTeams
} from "./api.js?v=20261002-0845";

import {
    renderDetalleTeams,
    renderErrorTeams,
    renderSinTeams,
    mostrarCargandoTeams
} from "./render.js?v=20261002-1000";

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
        const [detalle, convocatoria] = await Promise.all([
            cargarDetalleTeams(estado.teamId),
            cargarConvocatoriaTeams(estado.teamId)
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
