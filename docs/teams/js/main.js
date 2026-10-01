import {
    cargarDetalleTeams,
    cargarEdicionesTeams
} from "./api.js?v=20261001-1910";

import {
    renderDetalleTeams,
    renderEdicionesTeams,
    renderErrorTeams,
    renderSinTeams,
    mostrarCargandoTeams
} from "./render.js?v=20261001-1902";

const estado = {
    detalle: null,
    ediciones: [],
    teamId: null
};

document.addEventListener("DOMContentLoaded", iniciarTeams, { once: true });
document.getElementById("teamsReintentar")?.addEventListener("click", iniciarTeams);
document.getElementById("teamsEdiciones")?.addEventListener("click", gestionarCambioEdicion);

async function iniciarTeams() {
    mostrarCargandoTeams();

    const parametros = new URLSearchParams(window.location.search);
    estado.teamId = parametros.get("teams") || null;

    try {
        const [detalle, ediciones] = await Promise.all([
            cargarDetalleTeams(estado.teamId),
            cargarEdicionesTeams()
        ]);

        estado.detalle = detalle;
        estado.ediciones = ediciones;

        if (!detalle) {
            renderSinTeams(ediciones);
            return;
        }

        renderDetalleTeams(detalle);
        renderEdicionesTeams(ediciones, detalle.id);
    } catch (error) {
        console.error("No se pudo cargar Teams.", error);
        renderErrorTeams(error);
    }
}

async function gestionarCambioEdicion(evento) {
    const boton = evento.target.closest("[data-team-id]");
    if (!boton) return;

    const teamId = boton.dataset.teamId || "";
    if (!teamId || teamId === estado.detalle?.id) return;

    boton.disabled = true;

    try {
        const detalle = await cargarDetalleTeams(teamId);
        if (!detalle) {
            throw new Error("La edición seleccionada no está disponible.");
        }

        estado.teamId = teamId;
        estado.detalle = detalle;

        const url = new URL(window.location.href);
        url.searchParams.set("teams", teamId);
        window.history.pushState({}, "", url);

        renderDetalleTeams(detalle);
        renderEdicionesTeams(estado.ediciones, detalle.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        console.error("No se pudo cambiar de edición.", error);
        renderErrorTeams(error);
    } finally {
        boton.disabled = false;
    }
}

window.addEventListener("popstate", () => {
    iniciarTeams();
});
