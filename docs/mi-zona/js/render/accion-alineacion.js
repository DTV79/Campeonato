import { esc, esCapitan, puedePresentar } from "../model.js?v=20261002-1635";

export function htmlAccionAlineacion(team, partido) {
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