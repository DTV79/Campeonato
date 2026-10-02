import {
    alineacionPorLado,
    claseEstado,
    colorSeguro,
    equiposPorLado,
    esc,
    esCapitan,
    estadoPartido,
    fechaHora,
    fechaInput,
    jugadorEsDeMiEquipo,
    parejaTexto,
    puedeGestionarHorario,
    puedeIntroducirResultado,
    puedePresentar,
    respuestaJugador,
    resultadoVisible
} from "../model.js?v=20261002-1530";

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

function htmlAccionAlineacion(team, partido) {
    if (!esCapitan(team)) return "";

    const editable = ["pendiente_alineaciones", "alineaciones_cerradas"].includes(partido?.estado);
    if (!editable) return "";

    const puede = puedePresentar(team, partido);
    const jugadores = (team?.companeros || []).filter(j => j.disponible && !j.reserva);
    const actual = partido?.mi_alineacion || [];

    if (!puede) {
        return `
            <div class="avisoZona">
                <strong>Esperando al otro capitán</strong>
                <span>El otro equipo debe presentar primero su pareja.</span>
            </div>
        `;
    }

    return `
        <details class="accionPanel" ${actual.length ? "" : "open"}>
            <summary>
                <span>👥 ${actual.length ? "Modificar pareja" : "Presentar pareja"}</span>
                <b>Capitán</b>
            </summary>

            <form class="formAccion" data-form="alineacion" data-partido-id="${esc(partido.id)}">
                <div class="dosCampos">
                    ${selectJugador("jugador1", jugadores, actual[0]?.id, "Jugador 1")}
                    ${selectJugador("jugador2", jugadores, actual[1]?.id, "Jugador 2")}
                </div>
                <button class="btnPrimario" type="submit">Guardar pareja</button>
                <p class="mensajeForm" data-form-mensaje></p>
            </form>
        </details>
    `;
}

function selectJugador(nombre, jugadores, seleccionado, etiqueta) {
    return `
        <label>
            <span>${esc(etiqueta)}</span>
            <select name="${nombre}" required>
                <option value="">Selecciona</option>
                ${jugadores.map(j => `
                    <option value="${esc(j.id)}" ${j.id === seleccionado ? "selected" : ""}>
                        ${esc(j.nombre)}
                    </option>
                `).join("")}
            </select>
        </label>
    `;
}

function htmlAccionHorario(team, partido, jugador) {
    if (!puedeGestionarHorario(partido)) return "";

    if (partido?.estado === "programado") {
        return `
            <details class="accionPanel">
                <summary>
                    <span>🗓️ Gestionar cita</span>
                    <b>Partido programado</b>
                </summary>

                <div class="botonesAccion">
                    <button
                        class="btnSecundario"
                        type="button"
                        data-action="mostrar-reprogramar"
                        data-partido-id="${esc(partido.id)}"
                    >Modificar fecha</button>

                    <button
                        class="btnSecundario"
                        type="button"
                        data-action="editar-pista"
                        data-partido-id="${esc(partido.id)}"
                        data-pista="${esc(partido?.pista || "")}"
                    >Club/pista</button>

                    <button
                        class="btnPeligro"
                        type="button"
                        data-action="quitar-horario"
                        data-partido-id="${esc(partido.id)}"
                    >Eliminar fecha</button>
                </div>

                <form class="formAccion oculto" data-form="pista" data-partido-id="${esc(partido.id)}">
                    <label>
                        <span>Club/pista · opcional</span>
                        <input name="pista" value="${esc(partido?.pista || "")}" placeholder="Dejar vacío para borrar">
                    </label>
                    <button class="btnPrimario" type="submit">Guardar club/pista</button>
                    <p class="mensajeForm" data-form-mensaje></p>
                </form>

                <form class="formAccion oculto" data-form="reprogramar" data-partido-id="${esc(partido.id)}">
                    <div class="dosCampos">
                        <label>
                            <span>Nueva fecha y hora</span>
                            <input name="fecha" type="datetime-local" value="${esc(fechaInput(partido?.fecha_hora))}" required>
                        </label>
                        <label>
                            <span>Club/pista · opcional</span>
                            <input name="pista" value="${esc(partido?.pista || "")}" placeholder="Ej. Mais que Auga">
                        </label>
                    </div>
                    <button class="btnPrimario" type="submit">Proponer cambio</button>
                    <p class="mensajeForm" data-form-mensaje></p>
                </form>
            </details>
        `;
    }

    const propuestas = (partido?.propuestas || []).filter(p => p.estado === "propuesta");

    return `
        <details class="accionPanel" open>
            <summary>
                <span>🗓️ Concertar partido</span>
                <b>1 aceptación por equipo</b>
            </summary>

            <div class="propuestasLista">
                ${propuestas.length
                    ? propuestas.map(p => htmlPropuesta(p, team, partido, jugador)).join("")
                    : '<div class="miniVacio">Todavía no hay propuestas de fecha.</div>'}
            </div>

            <form class="formAccion" data-form="horario" data-partido-id="${esc(partido.id)}">
                <div class="dosCampos">
                    <label>
                        <span>Fecha y hora</span>
                        <input name="fecha" type="datetime-local" required>
                    </label>
                    <label>
                        <span>Club/pista · opcional</span>
                        <input name="pista" placeholder="Ej. Mais que Auga">
                    </label>
                </div>
                <button class="btnPrimario" type="submit">Proponer fecha</button>
                <p class="mensajeForm" data-form-mensaje></p>
            </form>
        </details>
    `;
}

function htmlPropuesta(propuesta, team, partido, jugador) {
    const respuesta = respuestaJugador(propuesta, jugador?.id);
    const respuestas = Array.isArray(propuesta?.respuestas) ? propuesta.respuestas : [];
    const idsPropios = new Set((partido?.mi_alineacion || []).map(j => j?.id).filter(Boolean));
    const idsRivales = new Set((partido?.alineacion_rival || []).map(j => j?.id).filter(Boolean));
    const aceptaPropio = respuestas.some(r => r?.disponible === true && idsPropios.has(r?.id_jugador));
    const aceptaRival = respuestas.some(r => r?.disponible === true && idsRivales.has(r?.id_jugador));

    return `
        <div class="propuestaHorario">
            <div class="propuestaDatos">
                <strong>${esc(fechaHora(propuesta?.fecha_hora))}</strong>
                <span>
                    ${propuesta?.pista ? "📍 " + esc(propuesta.pista) + " · " : ""}
                    Propone ${esc(propuesta?.propuesta_por_nombre || "un jugador")}
                </span>
                <div class="propuestaEquiposEstado">
                    <span class="${aceptaPropio ? "aceptado" : ""}">
                        ${aceptaPropio ? "✓" : "○"} ${esc(team?.equipo?.nombre || "Tu equipo")}
                        <small>${aceptaPropio ? "Aceptada" : "Pendiente"}</small>
                    </span>
                    <span class="${aceptaRival ? "aceptado" : ""}">
                        ${aceptaRival ? "✓" : "○"} ${esc(team?.rival?.nombre || "Rival")}
                        <small>${aceptaRival ? "Aceptada" : "Pendiente"}</small>
                    </span>
                </div>
            </div>
            <div class="propuestaEstado">
                ${aceptaPropio ? `
                    <b class="equipoYaAcepto">Tu equipo ya ha aceptado esta fecha</b>
                ` : `
                    <b>Falta una aceptación de tu equipo</b>
                    <div>
                        <button
                            type="button"
                            class="btnMini ${respuesta?.disponible === true ? "activo" : ""}"
                            data-action="responder-horario"
                            data-propuesta-id="${esc(propuesta.id)}"
                            data-disponible="1"
                        >✓ Nos viene bien</button>
                        <button
                            type="button"
                            class="btnMini ${respuesta?.disponible === false ? "activo no" : ""}"
                            data-action="responder-horario"
                            data-propuesta-id="${esc(propuesta.id)}"
                            data-disponible="0"
                        >✕ No puedo</button>
                    </div>
                `}
            </div>
        </div>
    `;
}

function htmlAccionResultado(team, partido) {
    if (!puedeIntroducirResultado(partido)) return "";

    const equipos = equiposPorLado(team);

    return `
        <details class="accionPanel">
            <summary>
                <span>🎾 Introducir resultado</span>
                <b>Cualquiera de los 4</b>
            </summary>

            <form class="formAccion" data-form="resultado" data-partido-id="${esc(partido.id)}">
                <div class="resultadoCabeceraForm">
                    <span>Equipo</span><b>Set 1</b><b>Set 2</b><b>Set 3</b>
                </div>
                ${filaResultadoForm("A", equipos.A, partido)}
                ${filaResultadoForm("B", equipos.B, partido)}

                <p class="ayudaTie">
                    Si un set termina empatado, deja el marcador real empatado e indica debajo el tie-break.
                </p>

                <div class="tresCampos">
                    <label>
                        <span>Finalización</span>
                        <select name="finalizacion">
                            <option value="normal">Normal</option>
                            <option value="wo">W.O.</option>
                            <option value="retirada">Retirada</option>
                            <option value="suspendido">Suspendido</option>
                            <option value="no_finalizado">No finalizado</option>
                        </select>
                    </label>
                    <label>
                        <span>Ganador · solo W.O./Retirada</span>
                        <select name="ganador">
                            <option value="">Automático / no aplica</option>
                            <option value="${esc(equipos.A?.id || "")}">${esc(equipos.A?.nombre || "Equipo A")}</option>
                            <option value="${esc(equipos.B?.id || "")}">${esc(equipos.B?.nombre || "Equipo B")}</option>
                        </select>
                    </label>
                    <label>
                        <span>Duración · min</span>
                        <input name="duracion" type="number" min="1" max="600" value="${partido?.duracion_min || ""}">
                    </label>
                </div>

                <label>
                    <span>Club/pista · opcional</span>
                    <input name="pista" value="${esc(partido?.pista || "")}" placeholder="Club o pista">
                </label>

                <label>
                    <span>Observaciones</span>
                    <textarea name="observaciones" rows="3" placeholder="Solo si necesitas dejar alguna observación"></textarea>
                </label>

                <button class="btnPrimario" type="submit">Enviar resultado al rival</button>
                <p class="mensajeForm" data-form-mensaje></p>
            </form>
        </details>
    `;
}

function filaResultadoForm(lado, equipo, partido) {
    const sets = partido?.sets || [];
    return `
        <div class="filaResultadoForm">
            <strong>${esc(equipo?.nombre || `Equipo ${lado}`)}</strong>
            ${[1,2,3].map(numero => {
                const set = sets.find(s => Number(s.numero) === numero);
                const puntos = lado === "A" ? set?.a : set?.b;
                const tie = lado === "A" ? set?.tiebreak_a : set?.tiebreak_b;
                return `
                    <div class="inputSet">
                        <input
                            aria-label="Set ${numero} equipo ${lado}"
                            name="${lado.toLowerCase()}${numero}"
                            type="number"
                            min="0"
                            value="${puntos ?? ""}"
                            placeholder="–"
                        >
                        <input
                            aria-label="Tie-break set ${numero} equipo ${lado}"
                            name="tb${lado.toLowerCase()}${numero}"
                            type="number"
                            min="0"
                            value="${tie ?? ""}"
                            placeholder="TB"
                        >
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function htmlResultado(team, partido) {
    const equipos = equiposPorLado(team);
    const sets = partido?.sets || [];

    return `
        <div class="resultadoZona">
            <div class="resultadoFila">
                <strong>${esc(equipos.A?.nombre || "Equipo A")}</strong>
                ${[1,2,3].map(n => htmlPuntuacion(sets.find(s => Number(s.numero) === n), "A")).join("")}
            </div>
            <div class="resultadoFila">
                <strong>${esc(equipos.B?.nombre || "Equipo B")}</strong>
                ${[1,2,3].map(n => htmlPuntuacion(sets.find(s => Number(s.numero) === n), "B")).join("")}
            </div>
        </div>
    `;
}

function htmlPuntuacion(set, lado) {
    if (!set) return "<span>–</span>";
    const puntos = lado === "A" ? set.a : set.b;
    const tie = lado === "A" ? set.tiebreak_a : set.tiebreak_b;
    return `
        <span class="scoreSet">
            ${Number(puntos)}
            ${Number.isInteger(tie) ? `<sup>${tie}</sup>` : ""}
        </span>
    `;
}

function htmlConfirmacion(partido) {
    return `
        <div class="confirmacionResultado">
            <div>
                <strong>¿El resultado es correcto?</strong>
                <span>Debe confirmarlo un jugador del equipo rival al que lo introdujo.</span>
            </div>

            <div class="botonesAccion">
                <button
                    type="button"
                    class="btnConfirmar"
                    data-action="confirmar-resultado"
                    data-partido-id="${esc(partido.id)}"
                >✓ Confirmar resultado</button>
            </div>

            <details class="impugnarPanel">
                <summary>Impugnar resultado</summary>
                <form class="formAccion" data-form="impugnar" data-partido-id="${esc(partido.id)}">
                    <label>
                        <span>Motivo de la impugnación</span>
                        <textarea name="motivo" rows="4" required placeholder="Explica qué parte del resultado no es correcta"></textarea>
                    </label>
                    <button class="btnPeligro" type="submit">⚠ Impugnar resultado</button>
                    <p class="mensajeForm" data-form-mensaje></p>
                </form>
            </details>
        </div>
    `;
}