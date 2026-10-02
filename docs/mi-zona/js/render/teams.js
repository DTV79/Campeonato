import { colorSeguro, esc, esCapitan } from "../model.js?v=20261002-1530";
import { htmlPartido } from "./partidos.js?v=20261002-1620";

export function htmlTeam(team, jugador) {
    const equipo = team?.equipo || {};
    const rival = team?.rival || {};
    const color = colorSeguro(equipo.color, equipo.lado);
    const partidos = Array.isArray(team?.partidos) ? team.partidos : [];

    return `
        <article class="teamCard" id="zona-team-${esc(team.id)}" style="--equipo-color:${color}">
            <header class="teamCabecera">
                <div>
                    <span class="teamEstado">${esc(String(team?.estado || "").replaceAll("_", " "))}</span>
                    <h2>${esc(team?.nombre || "Teams")}</h2>
                </div>
                <span class="puntoGrande" aria-hidden="true"></span>
            </header>

            <div class="dueloEquipos">
                <div>
                    <small>Tu equipo</small>
                    <strong>${esc(equipo.nombre || "Equipo")}</strong>
                    ${equipo.es_capitan ? '<em>★ Capitán</em>' : ""}
                </div>
                <span>vs</span>
                <div class="rival">
                    <small>Rival</small>
                    <strong>${esc(rival.nombre || "Equipo rival")}</strong>
                </div>
            </div>

            ${htmlPlantilla(team, jugador)}

            <section class="bloqueTeam">
                <div class="bloqueTitulo">
                    <div>
                        <span>PARTIDOS</span>
                        <h3>Tu competición</h3>
                    </div>
                    <small>${partidos.length} ${partidos.length === 1 ? "partido" : "partidos"}</small>
                </div>

                <div class="listaPartidos">
                    ${partidos.map(partido => htmlPartido(team, partido, jugador)).join("")}
                </div>
            </section>
        </article>
    `;
}

function htmlPlantilla(team, jugador) {
    const companeros = Array.isArray(team?.companeros) ? team.companeros : [];
    const capitan = esCapitan(team);

    return `
        <section class="bloqueTeam">
            <div class="bloqueTitulo">
                <div>
                    <span>PLANTILLA</span>
                    <h3>${esc(team?.equipo?.nombre || "Tu equipo")}</h3>
                </div>
                <small>${team?.estado === "finalizado"
                    ? "Edición finalizada"
                    : capitan
                        ? "Gestionas la disponibilidad"
                        : "Tu disponibilidad"}</small>
            </div>

            <div class="plantillaMiZona">
                ${companeros.map(miembro => {
                    const puedeCambiar =
                        team?.estado !== "finalizado" &&
                        (capitan || miembro.id === jugador?.id);
                    return `
                        <div class="miembroFila">
                            <div>
                                <strong>${esc(miembro.nombre)}</strong>
                                <span>
                                    ${miembro.capitan ? "★ Capitán" : "Jugador"}
                                    ${miembro.reserva ? " · Reserva" : ""}
                                </span>
                            </div>
                            <button
                                type="button"
                                class="estadoDisponibilidad ${miembro.disponible ? "disponible" : "noDisponible"}"
                                data-action="disponibilidad"
                                data-team-id="${esc(team.id)}"
                                data-jugador-id="${esc(miembro.id)}"
                                data-disponible="${miembro.disponible ? "1" : "0"}"
                                ${puedeCambiar ? "" : "disabled"}
                            >
                                ${miembro.disponible ? "Disponible" : "No disponible"}
                            </button>
                        </div>
                    `;
                }).join("")}
            </div>
        </section>
    `;
}