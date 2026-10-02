import { equiposPorLado, esc, puedeIntroducirResultado } from "../model.js?v=20261002-1635";

export function htmlAccionResultado(team, partido) {
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

export function htmlConfirmacion(partido) {
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