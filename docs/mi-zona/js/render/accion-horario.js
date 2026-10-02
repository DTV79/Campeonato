import { esc, fechaHora, fechaInput, puedeGestionarHorario, respuestaJugador } from "../model.js?v=20261002-1620";

export function htmlAccionHorario(team, partido, jugador) {
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