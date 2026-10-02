import { esc } from "../model.js?v=20261002-1530";

export function htmlConvocatorias(convocatorias) {
    return `
        <section class="convocatoriasZona" id="zona-convocatorias">
            <div class="convocatoriasZonaTitulo">
                <div>
                    <span>CONVOCATORIA</span>
                    <h2>¿Quieres participar?</h2>
                </div>
                <small>Responde desde aquí</small>
            </div>

            ${convocatorias.map(convocatoria => htmlConvocatoria(convocatoria)).join("")}
        </section>
    `;
}

function htmlConvocatoria(convocatoria) {
    const respuesta = convocatoria?.respuesta || "";
    const fecha = formatoFechaConvocatoria(convocatoria?.fecha_inicio);
    const textos = {
        elegible: "Te has apuntado",
        no_disponible: "Has indicado que no puedes",
        pendiente: "Todavía no lo sabes"
    };

    const predeterminado =
        convocatoria?.metodo_formacion === "predeterminado";
    const asignacion =
        convocatoria?.asignacion_predeterminada || "admin";
    const equipos = Array.isArray(convocatoria?.equipos)
        ? convocatoria.equipos
        : [];
    const equipoActual = convocatoria?.equipo_preasignado || null;

    let bloqueEquipo = "";

    if (predeterminado && asignacion === "admin") {
        bloqueEquipo = equipoActual
            ? `
                <div class="convocatoriaEquipoAsignado">
                    <small>Tu equipo</small>
                    <strong>${esc(equipoActual.nombre || "Equipo")}</strong>
                </div>
              `
            : `
                <div class="convocatoriaEquipoAsignado pendiente">
                    <small>Tu equipo</small>
                    <strong>Pendiente de asignación por el administrador</strong>
                </div>
              `;
    }

    if (predeterminado && asignacion === "jugador") {
        bloqueEquipo = `
            <label class="convocatoriaElegirEquipo">
                <span>¿Con qué equipo participas?</span>
                <select data-convocatoria-equipo>
                    <option value="">Selecciona tu equipo</option>
                    ${equipos.map(e => `
                        <option
                            value="${esc(e.id)}"
                            ${equipoActual?.id === e.id ? "selected" : ""}
                        >
                            ${esc(e.nombre || ("Equipo " + (e.lado || "")))}
                        </option>
                    `).join("")}
                </select>
            </label>
        `;
    }

    const puedeApuntarse =
        !predeterminado ||
        asignacion !== "admin" ||
        Boolean(equipoActual?.id);

    return `
        <article class="convocatoriaCard">
            <div class="convocatoriaInfo">
                <div>
                    <span class="convocatoriaAbierta">● Convocatoria abierta</span>
                    <h3>${esc(convocatoria?.nombre || "Teams")}</h3>
                    ${fecha ? `<small>📅 ${esc(fecha)}</small>` : ""}
                </div>

                <p>
                    ${respuesta
                        ? `Respuesta actual: <strong>${esc(textos[respuesta] || respuesta)}</strong>`
                        : "Todavía no has respondido a esta convocatoria."}
                </p>
            </div>

            ${bloqueEquipo}

            <div class="convocatoriaOpciones">
                <button
                    type="button"
                    class="convocatoriaOpcion meApunto ${respuesta === "elegible" ? "activo" : ""}"
                    data-action="convocatoria"
                    data-team-id="${esc(convocatoria.id)}"
                    data-estado="elegible"
                    ${puedeApuntarse ? "" : "disabled"}
                >✅ Me apunto</button>

                <button
                    type="button"
                    class="convocatoriaOpcion noPuedo ${respuesta === "no_disponible" ? "activo" : ""}"
                    data-action="convocatoria"
                    data-team-id="${esc(convocatoria.id)}"
                    data-estado="no_disponible"
                >❌ No puedo</button>

                <button
                    type="button"
                    class="convocatoriaOpcion noSe ${respuesta === "pendiente" ? "activo" : ""}"
                    data-action="convocatoria"
                    data-team-id="${esc(convocatoria.id)}"
                    data-estado="pendiente"
                >🤔 Todavía no sé</button>
            </div>

            ${!puedeApuntarse
                ? '<small class="convocatoriaNota aviso">El administrador debe asignarte un equipo antes de que puedas apuntarte.</small>'
                : respuesta
                    ? '<small class="convocatoriaNota">Puedes cambiar tu respuesta mientras la convocatoria siga abierta.</small>'
                    : ""}
        </article>
    `;
}

function formatoFechaConvocatoria(valor) {
    const texto = String(valor || "").trim();
    const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return texto;
    return `${m[3]}/${m[2]}/${m[1]}`;
}