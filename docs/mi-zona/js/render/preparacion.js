import { esc, fechaHora } from "../model.js?v=20261002-1530";

export function htmlPreparacionTeams(lista) {
    return `
        <section class="preparacionTeamsZona" id="zona-preparacion">
            <div class="convocatoriasZonaTitulo">
                <div>
                    <span>PREPARACIÓN</span>
                    <h2>Tu equipo antes de empezar</h2>
                </div>
                <small>Capitanes e inicio</small>
            </div>
            ${lista.map(htmlPreparacionTeam).join("")}
        </section>
    `;
}

function htmlPreparacionTeam(team) {
    const modoCapitan = team?.modo_designacion_capitanes || "administrador";
    const modoInicio = team?.modo_inicio_teams || "administrador";
    const equipo = team?.equipo || {};
    const candidatos = Array.isArray(team?.candidatos) ? team.candidatos : [];
    const miVoto = team?.mi_voto || "";
    const capitan = candidatos.find(c => c.id === equipo.capitan_id);
    const listos = Array.isArray(team?.capitanes_listos) ? team.capitanes_listos : [];
    const miEstado = listos.find(x => x.equipo_id === equipo.id);
    const ambosListos = listos.length === 2 && listos.every(x => x.listo);

    let bloqueCapitan = "";

    if (modoCapitan === "eleccion_equipo" && !equipo.capitan_id) {
        bloqueCapitan = `
            <div class="preparacionAccion">
                <div>
                    <small>ELECCIÓN DE CAPITÁN</small>
                    <strong>Vota al capitán de ${esc(equipo.nombre || "tu equipo")}</strong>
                    <p>Tu voto puede cambiarse mientras la votación siga abierta.</p>
                </div>
                <div class="votacionCapitanMiZona">
                    ${candidatos.map(candidato => `
                        <button
                            type="button"
                            class="${miVoto === candidato.id ? "activo" : ""}"
                            data-action="votar-capitan"
                            data-team-id="${esc(team.id)}"
                            data-candidato-id="${esc(candidato.id)}"
                        >
                            ${esc(candidato.nombre)}
                            ${miVoto === candidato.id ? "<span>✓ Tu voto</span>" : ""}
                        </button>
                    `).join("")}
                </div>
                <p class="errorAccion"></p>
            </div>
        `;
    } else {
        const textoModo = {
            administrador: "Lo designa el administrador",
            predefinidos: "Definido de antemano",
            sorteo: "Elegido por sorteo",
            eleccion_equipo: "Elegido por el equipo"
        }[modoCapitan] || "Capitán";

        bloqueCapitan = `
            <div class="preparacionResumenFila">
                <span>Capitán</span>
                <strong>${esc(capitan?.nombre || (equipo.capitan_id ? "Asignado" : "Pendiente"))}</strong>
                <small>${esc(textoModo)}</small>
            </div>
        `;
    }

    let bloqueInicio = "";

    if (modoInicio === "capitanes") {
        const preparado = Boolean(miEstado?.listo);
        bloqueInicio = `
            <div class="preparacionAccion">
                <div>
                    <small>INICIO DEL TEAMS</small>
                    <strong>${ambosListos ? "Los dos equipos están preparados" : "Esperando confirmación de los capitanes"}</strong>
                    <p>
                        ${team.plantillas_cerradas && team.reglas_revisadas
                            ? "Cuando ambos capitanes confirmen, se creará automáticamente el Partido 1."
                            : "El administrador debe cerrar las plantillas y revisar las reglas antes del inicio."}
                    </p>
                </div>
                <div class="estadoCapitanesListos">
                    ${listos.map(item => `
                        <span class="${item.listo ? "listo" : ""}">
                            ${item.listo ? "✓" : "○"} ${esc(item.equipo || "Equipo")}
                        </span>
                    `).join("")}
                </div>
                ${equipo.es_capitan && team.plantillas_cerradas && team.reglas_revisadas ? `
                    <button
                        type="button"
                        class="btnPrimario"
                        data-action="capitan-listo"
                        data-team-id="${esc(team.id)}"
                        data-listo="${preparado ? "0" : "1"}"
                    >
                        ${preparado ? "Marcar mi equipo como no preparado" : "Mi equipo está preparado"}
                    </button>
                ` : ""}
                <p class="errorAccion"></p>
            </div>
        `;
    } else if (modoInicio === "programado") {
        bloqueInicio = `
            <div class="preparacionResumenFila">
                <span>Inicio</span>
                <strong>Programado</strong>
                <small>${esc(fechaHora(team.inicio_programado_at) || "Fecha pendiente")}</small>
            </div>
        `;
    } else {
        bloqueInicio = `
            <div class="preparacionResumenFila">
                <span>Inicio</span>
                <strong>Lo inicia el administrador</strong>
                <small>El Partido 1 se creará automáticamente al comenzar.</small>
            </div>
        `;
    }

    return `
        <article class="preparacionTeamCard">
            <header>
                <div>
                    <span>TEAMS</span>
                    <h3>${esc(team?.nombre || "Teams")}</h3>
                </div>
                <em>${esc(equipo.nombre || "Tu equipo")}</em>
            </header>
            ${bloqueCapitan}
            ${bloqueInicio}
        </article>
    `;
}