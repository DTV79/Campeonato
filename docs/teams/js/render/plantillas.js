import {
    alineacionPorLado,
    claseEstadoPartido,
    colorSeguro,
    equipoPorLado,
    escaparHtml,
    etiquetaEstadoGeneral,
    etiquetaEstadoPartido,
    formatearFechaHora,
    formatearFechaSolo,
    ganadorTeams,
    resumenFinalizacion,
    tipoResultado,
    victoriasEquipo
} from "../model.js?v=20261002-1545";

const plantillas = document.getElementById("teamsPlantillas");

export function renderPlantillas(detalle) {
    const equipos = [...(detalle?.equipos || [])]
        .sort((a, b) => String(a?.lado).localeCompare(String(b?.lado)));

    if (!equipos.length) {
        plantillas.innerHTML =
            '<div class="vacio">Las plantillas todavía no están publicadas.</div>';
        return;
    }

    plantillas.innerHTML = equipos.map(equipo => {
        const lado = String(equipo?.lado || "A").toUpperCase();
        const color = colorSeguro(equipo?.color, lado);
        const miembros = equipo?.miembros || [];

        return `
            <article class="plantillaCard" style="--equipo-color:${color}">
                <div class="plantillaTitulo">
                    <span class="puntoEquipo" aria-hidden="true"></span>
                    <div>
                        <small>Equipo ${escaparHtml(lado)}</small>
                        <h3>${escaparHtml(equipo?.nombre || `Equipo ${lado}`)}</h3>
                    </div>
                </div>

                <div class="jugadoresLista">
                    ${miembros.map(miembro => `
                        <div class="jugadorFila">
                            <span class="jugadorNombre">${escaparHtml(miembro?.nombre || "Jugador")}</span>
                            <span class="jugadorEtiquetas">
                                ${miembro?.es_capitan ? '<em class="etiquetaCapitan">★ Capitán</em>' : ""}
                                ${miembro?.es_reserva ? '<em class="etiquetaReserva">Reserva</em>' : ""}
                            </span>
                        </div>
                    `).join("") || '<div class="jugadorFila tenue">Plantilla pendiente</div>'}
                </div>
            </article>
        `;
    }).join("");
}