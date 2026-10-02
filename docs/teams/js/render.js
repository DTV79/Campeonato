import { etiquetaEstadoGeneral, formatearFechaSolo } from "./model.js?v=20261002-1545";
import { renderPreparacion } from "./render/preparacion.js?v=20261002-1545";
import { renderMarcador } from "./render/marcador.js?v=20261002-1545";
import { renderPlantillas } from "./render/plantillas.js?v=20261002-1545";
import { renderPartidos } from "./render/partidos.js?v=20261002-1545";

const nodos = {
    nombre: document.getElementById("teamsNombre"),
    subtitulo: document.getElementById("teamsSubtitulo"),
    estado: document.getElementById("teamsEstado"),
    cargando: document.getElementById("teamsCargando"),
    error: document.getElementById("teamsError"),
    errorTexto: document.getElementById("teamsErrorTexto"),
    contenido: document.getElementById("teamsContenido"),
    preparacion: document.getElementById("teamsPreparacion"),
    marcador: document.getElementById("teamsMarcador"),
    plantillas: document.getElementById("teamsPlantillas"),
    partidos: document.getElementById("teamsPartidos")
};

function mostrar(nodo, visible) {
    nodo?.classList.toggle("oculto", !visible);
}

function aplicarEstadoGeneral(estado) {
    if (!nodos.estado) return;

    nodos.estado.textContent = etiquetaEstadoGeneral(estado);
    nodos.estado.className = "estadoGeneral";

    if (estado === "en_curso") nodos.estado.classList.add("estadoEnJuego");
    else if (estado === "finalizado") nodos.estado.classList.add("estadoFinalizadoGeneral");
    else nodos.estado.classList.add("estadoNeutro");
}

export function mostrarCargandoTeams() {
    mostrar(nodos.cargando, true);
    mostrar(nodos.error, false);
    mostrar(nodos.contenido, false);

    if (nodos.nombre) nodos.nombre.textContent = "Teams";
    if (nodos.subtitulo) {
        nodos.subtitulo.textContent =
            "Enfrentamientos, marcador y evolución de la Copa por Equipos.";
    }
    if (nodos.estado) {
        nodos.estado.textContent = "Cargando…";
        nodos.estado.className = "estadoGeneral estadoCargando";
    }
}

export function renderErrorTeams(error) {
    mostrar(nodos.cargando, false);
    mostrar(nodos.contenido, false);
    mostrar(nodos.error, true);

    if (nodos.estado) {
        nodos.estado.textContent = "Sin conexión";
        nodos.estado.className = "estadoGeneral estadoIncidencia";
    }

    if (nodos.errorTexto) {
        nodos.errorTexto.textContent =
            error?.message || "No se pudo cargar la información de Teams.";
    }
}

export function renderSinTeams(ediciones = []) {
    mostrar(nodos.cargando, false);
    mostrar(nodos.error, true);
    mostrar(nodos.contenido, false);

    if (nodos.nombre) nodos.nombre.textContent = "Teams";
    if (nodos.estado) {
        nodos.estado.textContent = "Sin edición activa";
        nodos.estado.className = "estadoGeneral estadoNeutro";
    }
    if (nodos.errorTexto) {
        nodos.errorTexto.textContent = ediciones.length
            ? "La edición solicitada no está disponible públicamente."
            : "Todavía no hay una edición de Teams publicada.";
    }
}

export function renderDetalleTeams(detalle) {
    mostrar(nodos.cargando, false);
    mostrar(nodos.error, false);
    mostrar(nodos.contenido, true);

    if (nodos.nombre) {
        nodos.nombre.textContent = detalle?.nombre || "Teams";
    }

    if (nodos.subtitulo) {
        const inicio = formatearFechaSolo(detalle?.fecha_inicio);
        const fin = formatearFechaSolo(detalle?.fecha_fin);

        nodos.subtitulo.textContent =
            inicio && fin && inicio !== fin
                ? `${inicio} · ${fin}`
                : inicio || "Copa por equipos de Sprint Pádel";
    }

    aplicarEstadoGeneral(detalle?.estado);

    const estado = String(detalle?.estado || "");
    const esPreparacion = ["preparacion", "convocatoria", "draft"].includes(estado);
    const bloquePlantillas = nodos.plantillas?.closest(".teamsBloque");
    const bloquePartidos = nodos.partidos?.closest(".teamsBloque");

    mostrar(nodos.preparacion, esPreparacion);
    mostrar(nodos.marcador, !esPreparacion);
    mostrar(bloquePlantillas, !esPreparacion);
    mostrar(bloquePartidos, !esPreparacion);

    if (esPreparacion) {
        renderPreparacion(detalle);
        return;
    }

    renderMarcador(detalle);
    renderPlantillas(detalle);
    renderPartidos(detalle);
}