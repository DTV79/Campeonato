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

const marcador = document.getElementById("teamsMarcador");

export function renderMarcador(detalle) {
    const equipoA = equipoPorLado(detalle, "A");
    const equipoB = equipoPorLado(detalle, "B");

    if (!equipoA || !equipoB) {
        marcador.innerHTML =
            '<div class="vacio">Los dos equipos todavía no están configurados.</div>';
        return;
    }

    const victoriasA = victoriasEquipo(detalle, equipoA.id);
    const victoriasB = victoriasEquipo(detalle, equipoB.id);
    const jugados = Number(detalle?.jugados_confirmados || 0);
    const total = Number(detalle?.numero_partidos || 0);
    const finalizado = detalle?.estado === "finalizado";
    const progreso = finalizado
        ? 100
        : total > 0
            ? Math.min(100, Math.max(0, (jugados / total) * 100))
            : 0;
    const resumenPartidos = finalizado
        ? `${jugados} ${jugados === 1 ? "partido confirmado" : "partidos confirmados"} · serie finalizada`
        : `${jugados} de ${total || "—"} partidos confirmados`;

    const ganador = ganadorTeams(detalle);
    let cierre = "La Copa está en juego.";

    if (detalle?.estado === "finalizado") {
        cierre = ganador?.empate
            ? "La edición terminó empatada."
            : ganador?.nombre
                ? `🏆 ${escaparHtml(ganador.nombre)} gana esta edición de Teams.`
                : "Edición finalizada.";
    }

    marcador.innerHTML = `
        <div class="marcadorCabecera">
            <span>MARCADOR GENERAL</span>
            <strong>${resumenPartidos}</strong>
        </div>

        <div class="marcadorDuelo">
            ${htmlEquipoMarcador(equipoA, victoriasA)}
            <div class="marcadorCentro">
                <span class="marcadorNumero">${victoriasA}</span>
                <span class="marcadorSeparador">–</span>
                <span class="marcadorNumero">${victoriasB}</span>
            </div>
            ${htmlEquipoMarcador(equipoB, victoriasB)}
        </div>

        <div class="barraProgreso" aria-label="Progreso de la Copa">
            <span style="width:${progreso}%"></span>
        </div>

        ${htmlEstadisticasTeams(detalle, equipoA, equipoB)}

        <div class="marcadorPie">${cierre}</div>
    `;
}

function htmlEstadisticasTeams(detalle, equipoA, equipoB) {
    const estadA = calcularEstadisticasEquipo(detalle, equipoA, "A");
    const estadB = calcularEstadisticasEquipo(detalle, equipoB, "B");

    const filas = [
        ["Partidos ganados", estadA.partidosGanados, estadB.partidosGanados],
        ["Sets ganados", estadA.setsGanados, estadB.setsGanados],
        ["Juegos ganados", estadA.juegosGanados, estadB.juegosGanados],
        ["Tie-breaks ganados", estadA.tiebreaksGanados, estadB.tiebreaksGanados],
        ["Jugadores utilizados", estadA.jugadoresUtilizados, estadB.jugadoresUtilizados]
    ];

    return `
        <div class="estadisticasTeams">
            <div class="estadisticasTeamsTitulo">
                <span>ESTADÍSTICAS DE LA EDICIÓN</span>
                <small>Solo cuentan partidos confirmados</small>
            </div>

            <div class="estadisticasTeamsCabecera">
                <strong>${escaparHtml(equipoA?.nombre || "Equipo A")}</strong>
                <span></span>
                <strong>${escaparHtml(equipoB?.nombre || "Equipo B")}</strong>
            </div>

            <div class="estadisticasTeamsFilas">
                ${filas.map(([etiqueta, valorA, valorB]) => `
                    <div class="estadisticaTeamsFila">
                        <b>${valorA}</b>
                        <span>${escaparHtml(etiqueta)}</span>
                        <b>${valorB}</b>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function calcularEstadisticasEquipo(detalle, equipo, lado) {
    const partidosConfirmados = (detalle?.partidos || [])
        .filter(partido => partido?.estado === "finalizado");

    let setsGanados = 0;
    let juegosGanados = 0;
    let tiebreaksGanados = 0;
    const jugadores = new Set();

    for (const partido of partidosConfirmados) {
        for (const jugador of alineacionPorLado(partido, lado)) {
            if (jugador?.id_jugador) jugadores.add(jugador.id_jugador);
        }

        for (const set of partido?.sets || []) {
            const esA = lado === "A";
            const puntos = Number(esA ? set?.puntos_a : set?.puntos_b);
            const puntosRival = Number(esA ? set?.puntos_b : set?.puntos_a);
            const tie = esA ? set?.tiebreak_a : set?.tiebreak_b;
            const tieRival = esA ? set?.tiebreak_b : set?.tiebreak_a;

            juegosGanados += Number.isFinite(puntos) ? puntos : 0;

            if (puntos > puntosRival) {
                setsGanados += 1;
            } else if (
                puntos === puntosRival &&
                Number.isInteger(tie) &&
                Number.isInteger(tieRival) &&
                tie > tieRival
            ) {
                setsGanados += 1;
            }

            if (
                Number.isInteger(tie) &&
                Number.isInteger(tieRival) &&
                tie > tieRival
            ) {
                tiebreaksGanados += 1;
            }
        }
    }

    const partidosGanados = victoriasEquipo(detalle, equipo?.id);
    const puntosPorVictoria = Number(detalle?.puntos_por_victoria || 1);
    const puntosTeams = partidosGanados * puntosPorVictoria;

    return {
        partidosGanados,
        setsGanados,
        juegosGanados,
        puntosTeams: Number.isInteger(puntosTeams) ? puntosTeams : puntosTeams.toFixed(1),
        tiebreaksGanados,
        jugadoresUtilizados: jugadores.size
    };
}

function htmlEquipoMarcador(equipo, victorias) {
    const lado = String(equipo?.lado || "A").toUpperCase();
    const color = colorSeguro(equipo?.color, lado);

    return `
        <div class="marcadorEquipo marcadorEquipo${lado}" style="--equipo-color:${color}">
            <span class="puntoEquipo" aria-hidden="true"></span>
            <div>
                <small>Equipo ${escaparHtml(lado)}</small>
                <strong>${escaparHtml(equipo?.nombre || `Equipo ${lado}`)}</strong>
                <span>${victorias} ${victorias === 1 ? "victoria" : "victorias"}</span>
            </div>
        </div>
    `;
}