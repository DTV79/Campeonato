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

const partidos = document.getElementById("teamsPartidos");

export function renderPartidos(detalle) {
    const partidos = detalle?.partidos || [];
    const equipoA = equipoPorLado(detalle, "A");
    const equipoB = equipoPorLado(detalle, "B");

    if (!partidos.length) {
        partidos.innerHTML =
            '<div class="vacio">Todavía no hay partidos creados.</div>';
        return;
    }

    partidos.innerHTML = partidos
        .map(partido => htmlPartido(partido, equipoA, equipoB, detalle))
        .join("");
}

function htmlPartido(partido, equipoA, equipoB, detalle) {
    const alineacionA = alineacionPorLado(partido, "A");
    const alineacionB = alineacionPorLado(partido, "B");
    const resultado = tipoResultado(partido);
    const fecha = formatearFechaHora(partido?.fecha_hora);
    const pista = String(partido?.pista || "").trim();
    const duracion = Number(partido?.duracion_min || 0);
    const finalizacion = resumenFinalizacion(partido?.finalizacion);
    const propuestas = Array.isArray(partido?.propuestas)
        ? partido.propuestas.filter(p => p?.estado === "propuesta")
        : [];

    const meta = [
        fecha ? {
            clase: "fechaPartidoDestacada",
            texto: `🗓️ ${escaparHtml(fecha)}`
        } : null,
        pista ? {
            clase: "",
            texto: `📍 ${escaparHtml(pista)}`
        } : null,
        duracion > 0 ? {
            clase: "",
            texto: `⏱️ ${duracion} min`
        } : null
    ].filter(Boolean);

    return `
        <article class="partidoCard">
            <div class="partidoCabecera">
                <div>
                    <small>PARTIDO ${Number(partido?.numero || 0)}</small>
                    <strong>${escaparHtml(equipoA?.nombre || "Equipo A")} vs ${escaparHtml(equipoB?.nombre || "Equipo B")}</strong>
                </div>
                <span class="estadoPartido ${claseEstadoPartido(partido)}">
                    ${escaparHtml(etiquetaEstadoPartido(partido))}
                </span>
            </div>

            ${meta.length ? `
                <div class="partidoMeta">
                    ${meta.map(item => `<span class="${item.clase}">${item.texto}</span>`).join("")}
                </div>
            ` : ""}

            ${propuestas.length
                ? htmlPropuestasPartidoPublico(propuestas, equipoA, equipoB)
                : ""}

            ${htmlAvisoResultado(resultado)}

            ${htmlMarcadorPartido(
                equipoA,
                equipoB,
                alineacionA,
                alineacionB,
                partido?.sets || [],
                partido,
                detalle
            )}

            ${finalizacion ? `
                <div class="finalizacionPartido">${escaparHtml(finalizacion)}</div>
            ` : ""}
        </article>
    `;
}

function htmlPropuestasPartidoPublico(propuestas, equipoA, equipoB) {
    return `
        <div class="propuestasPartidoPublico">
            ${propuestas.map(propuesta => `
                <div class="propuestaPartidoPublico">
                    <div class="propuestaPartidoFecha">
                        <small>FECHA PROPUESTA</small>
                        <strong>${escaparHtml(formatearFechaHora(propuesta?.fecha_hora) || "Fecha pendiente")}</strong>
                        ${propuesta?.pista
                            ? `<span>📍 ${escaparHtml(propuesta.pista)}</span>`
                            : ""}
                    </div>

                    <div class="aceptacionEquiposHorario">
                        ${htmlEstadoAceptacionEquipo(equipoA, propuesta?.acepta_a)}
                        ${htmlEstadoAceptacionEquipo(equipoB, propuesta?.acepta_b)}
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

function htmlEstadoAceptacionEquipo(equipo, aceptado) {
    return `
        <span class="${aceptado ? "aceptado" : ""}">
            <i>${aceptado ? "✓" : "○"}</i>
            <b>${escaparHtml(equipo?.nombre || "Equipo")}</b>
            <small>${aceptado ? "Aceptada" : "Pendiente"}</small>
        </span>
    `;
}

function htmlAvisoResultado(resultado) {
    if (resultado === "impugnado") {
        return `
            <div class="avisoResultado avisoImpugnado">
                <span class="simboloAviso" aria-hidden="true">⚠︎</span>
                <strong>RESULTADO IMPUGNADO</strong>
                <span>- Resultado provisional</span>
            </div>
        `;
    }

    if (resultado === "provisional") {
        return `
            <div class="avisoResultado avisoProvisional">
                <strong>Resultado provisional</strong>
                <span>· Pendiente de confirmación</span>
            </div>
        `;
    }

    if (resultado === "definitivo") {
        return `
            <div class="avisoResultado avisoDefinitivo">
                <strong>Resultado definitivo</strong>
            </div>
        `;
    }

    return "";
}

function htmlMarcadorPartido(
    equipoA,
    equipoB,
    alineacionA,
    alineacionB,
    sets,
    partido,
    detalle
) {
    return `
        <div class="marcadorPartidoCompacto">
            <div class="marcadorPartidoCabecera">
                <span class="cabeceraPareja">PAREJA</span>
                <span>SET 1</span>
                <span>SET 2</span>
                <span>SET 3</span>
            </div>

            ${htmlFilaEquipoPartido("A", equipoA, alineacionA, sets, partido, detalle)}
            ${htmlFilaEquipoPartido("B", equipoB, alineacionB, sets, partido, detalle)}
        </div>
    `;
}

function htmlFilaEquipoPartido(
    lado,
    equipo,
    jugadores,
    sets,
    partido,
    detalle
) {
    const color = colorSeguro(equipo?.color, lado);
    const nombres = jugadores.map(item => item?.jugador).filter(Boolean);
    const pareja = nombres.length
        ? nombres.map(escaparHtml).join(
            ' <span class="separadorPareja">/</span> '
        )
        : htmlEstadoParejaOculta(partido, detalle, equipo, lado);

    return `
        <div class="filaEquipoPartido filaEquipo${lado}" style="--equipo-color:${color}">
            <div class="infoEquipoPartido">
                <div class="nombreEquipoPartido">
                    <span class="puntoEquipo" aria-hidden="true"></span>
                    <span>
                        <small>Equipo ${escaparHtml(lado)}</small>
                        <b>${escaparHtml(equipo?.nombre || `Equipo ${lado}`)}</b>
                    </span>
                </div>

                <strong class="nombresParejaPartido">
                    ${pareja}
                </strong>
            </div>

            ${[1, 2, 3]
                .map(numero => htmlPuntuacionSet(sets, numero, lado))
                .join("")}
        </div>
    `;
}

function htmlEstadoParejaOculta(
    partido,
    detalle,
    equipo,
    lado
) {
    const estados = Array.isArray(partido?.estado_parejas)
        ? partido.estado_parejas
        : [];

    const propio = estados.find(item =>
        item?.equipo_id === equipo?.id ||
        String(item?.lado || "").toUpperCase() === lado
    );

    const rival = estados.find(item =>
        item?.equipo_id !== propio?.equipo_id
    );

    const presentada = propio?.presentada === true;
    const rivalPresentada = rival?.presentada === true;

    if (presentada) {
        return `
            <span class="estadoParejaOculta parejaPresentada">
                <span>✓ Pareja presentada</span>
                <small>${rivalPresentada
                    ? "Se mostrará cuando corresponda"
                    : "Esperando al equipo rival"
                }</small>
            </span>
        `;
    }

    const sistema =
        String(detalle?.sistema_eleccion_parejas || "");
    const primeroId =
        partido?.presenta_primero_equipo_id || null;

    let detalleEstado = "";

    if (
        sistema !== "secreto" &&
        primeroId
    ) {
        const esPrimero =
            String(equipo?.id || "") ===
            String(primeroId);

        const primero = estados.find(item =>
            String(item?.equipo_id || "") ===
            String(primeroId)
        );

        if (esPrimero || primero?.presentada === true) {
            detalleEstado = "Le corresponde presentar ahora";
        } else {
            detalleEstado = "Esperando al equipo rival";
        }
    }

    return `
        <span class="estadoParejaOculta parejaPendiente">
            <span>⏳ Pendiente de presentar</span>
            ${detalleEstado
                ? `<small>${escaparHtml(detalleEstado)}</small>`
                : ""
            }
        </span>
    `;
}

function htmlPuntuacionSet(sets, numero, lado) {
    const set = Array.isArray(sets)
        ? sets.find(item => Number(item?.numero) === numero)
        : null;

    if (!set) {
        return `
            <div class="puntuacionSet vacia">
                <strong>–</strong>
            </div>
        `;
    }

    const esA = lado === "A";
    const puntos = Number(esA ? set?.puntos_a : set?.puntos_b);
    const puntosRival = Number(esA ? set?.puntos_b : set?.puntos_a);
    const tie = esA ? set?.tiebreak_a : set?.tiebreak_b;
    const tieRival = esA ? set?.tiebreak_b : set?.tiebreak_a;

    let ganador = puntos > puntosRival;

    if (
        puntos === puntosRival &&
        Number.isInteger(tie) &&
        Number.isInteger(tieRival)
    ) {
        ganador = tie > tieRival;
    }

    return `
        <div class="puntuacionSet${ganador ? " ganadorSet" : ""}">
            <strong>
                <span>${puntos}</span>
                ${Number.isInteger(tie)
                    ? `<sup class="tiebreakSuperindice">${tie}</sup>`
                    : ""}
            </strong>
        </div>
    `;
}