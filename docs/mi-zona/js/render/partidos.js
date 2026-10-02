import {
    alineacionPorLado,
    claseEstado,
    colorSeguro,
    equiposPorLado,
    esc,
    estadoPartido,
    fechaHora,
    jugadorEsDeMiEquipo,
    parejaTexto,
    resultadoVisible
} from "../model.js?v=20261002-1610";
import {
    htmlAccionAlineacion,
    htmlAccionHorario,
    htmlAccionResultado,
    htmlConfirmacion
} from "./partido-acciones.js?v=20261002-1610";
import { htmlResultado } from "./partido-resultado.js?v=20261002-1610";

export function htmlPartido(team, partido, jugador) {
    const equipos = equiposPorLado(team);
    const parejaA = alineacionPorLado(team, partido, "A");
    const parejaB = alineacionPorLado(team, partido, "B");
    const programado = partido?.estado === "programado";
    const resultadoPendiente = partido?.estado === "pendiente_confirmacion";
    const introducidoPorMiEquipo = jugadorEsDeMiEquipo(team, partido?.resultado_introducido_por);
    const rivalPuedeConfirmar = resultadoPendiente && partido?.yo_juego && !introducidoPorMiEquipo;

    return `
        <article class="partidoZona" id="zona-partido-${esc(partido.id)}" data-partido-id="${esc(partido.id)}">
            <div class="partidoZonaCabecera">
                <div>
                    <small>PARTIDO ${Number(partido?.numero || 0)}</small>
                    <strong>${esc(equipos.A?.nombre || "Equipo A")} vs ${esc(equipos.B?.nombre || "Equipo B")}</strong>
                </div>
                <span class="badgeEstado ${claseEstado(partido?.estado)}">
                    ${esc(estadoPartido(partido?.estado))}
                </span>
            </div>

            ${programado ? htmlCita(partido) : ""}

            <div class="parejasZona">
                ${htmlParejaZona("A", equipos.A, parejaA)}
                ${htmlParejaZona("B", equipos.B, parejaB)}
            </div>

            ${resultadoVisible(partido) ? htmlResultado(team, partido) : ""}

            ${partido?.impugnado ? `
                <div class="avisoZona avisoImpugnado">
                    <strong>⚠ RESULTADO IMPUGNADO</strong>
                    <span>Resultado provisional. La incidencia está pendiente de Administración.</span>
                </div>
            ` : ""}

            <div class="accionesPartido">
                ${htmlAccionAlineacion(team, partido)}
                ${htmlAccionHorario(team, partido, jugador)}
                ${htmlAccionResultado(team, partido)}
                ${rivalPuedeConfirmar ? htmlConfirmacion(partido) : ""}
                ${resultadoPendiente && introducidoPorMiEquipo ? `
                    <div class="avisoZona">
                        <strong>Resultado enviado</strong>
                        <span>Está pendiente de confirmación por el equipo rival.</span>
                    </div>
                ` : ""}
            </div>
        </article>
    `;
}

function htmlParejaZona(lado, equipo, pareja) {
    const color = colorSeguro(equipo?.color, lado);
    return `
        <div class="parejaZona" style="--pareja-color:${color}">
            <span>Equipo ${esc(lado)}</span>
            <b>${esc(equipo?.nombre || `Equipo ${lado}`)}</b>
            <strong>${esc(parejaTexto(pareja))}</strong>
        </div>
    `;
}

function htmlCita(partido) {
    return `
        <div class="citaProgramada">
            <div>
                <span>📅 Partido programado</span>
                <strong>${esc(fechaHora(partido?.fecha_hora) || "Fecha pendiente")}</strong>
            </div>
            <em>${partido?.pista ? "📍 " + esc(partido.pista) : "Club/pista pendiente"}</em>
        </div>
    `;
}