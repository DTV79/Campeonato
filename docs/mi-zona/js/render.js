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
} from "./model.js?v=20261001-1945";

const app = document.getElementById("miZonaApp");

export function renderCargando(texto = "Cargando Mi Zona…") {
    app.innerHTML = `
        <section class="estadoPagina">
            <div class="spinner" aria-hidden="true"></div>
            <p>${esc(texto)}</p>
        </section>
    `;
}

export function renderError(mensaje, reintentar = true) {
    app.innerHTML = `
        <section class="estadoPagina estadoError">
            <strong>No se pudo completar la operación</strong>
            <p>${esc(mensaje || "Ha ocurrido un error.")}</p>
            ${reintentar ? '<button type="button" data-action="reintentar">Reintentar</button>' : ""}
        </section>
    `;
}

export function renderLogin(jugadores = [], mensaje = "") {
    const opcionesLogin = jugadores.map(j => `
        <option value="${esc(j.id)}">${esc(j.alias || j.nombre || j.nombre_oficial)}</option>
    `).join("");

    const opcionesAlta = jugadores.map(j => {
        const alias = j.alias || j.nombre || j.nombre_oficial;
        const nombre = j.nombre_oficial || "";
        const texto = nombre && nombre !== alias
            ? `${alias} — ${nombre}`
            : alias;

        return `
            <option value="${esc(j.id)}">${esc(texto)}</option>
        `;
    }).join("");

    app.innerHTML = `
        <section class="loginCard">
            <a class="volver" href="index.html">← Sprint Pádel</a>
            <div class="loginIcono">🔐</div>
            <p class="eyebrow">SPRINT PÁDEL</p>
            <h1>Mi Zona</h1>
            <p class="intro">
                Entra con tu PIN personal. Si es tu primera vez, solicita el acceso
                y el administrador te facilitará un código de verificación.
            </p>

            <form class="loginForm" data-form="login">
                <label>
                    <span>Jugador</span>
                    <select name="jugador" required>
                        <option value="">Selecciona tu nombre</option>
                        ${opcionesLogin}
                    </select>
                </label>

                <label>
                    <span>PIN personal</span>
                    <input
                        name="pin"
                        type="password"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        maxlength="8"
                        autocomplete="current-password"
                        placeholder="••••"
                        required
                    >
                </label>

                <p class="mensajeForm ${mensaje ? "visible" : ""}" data-login-mensaje>
                    ${esc(mensaje)}
                </p>

                <button class="btnPrimario" type="submit">Entrar a Mi Zona</button>
            </form>

            <details class="altaPanel">
                <summary>¿Es tu primera vez? Crear mi acceso</summary>

                <form class="loginForm altaForm" data-form="solicitar-alta">
                    <label>
                        <span>Jugador</span>
                        <select name="jugador" required>
                            <option value="">Selecciona tu nombre</option>
                            ${opcionesAlta}
                        </select>
                    </label>

                    <div class="dosCampos">
                        <label>
                            <span>Elige tu PIN</span>
                            <input
                                name="pin"
                                type="password"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="8"
                                placeholder="4–8 cifras"
                                required
                            >
                        </label>

                        <label>
                            <span>Repite tu PIN</span>
                            <input
                                name="pin2"
                                type="password"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="8"
                                placeholder="4–8 cifras"
                                required
                            >
                        </label>
                    </div>

                    <p class="mensajeForm" data-solicitud-mensaje></p>
                    <button class="btnPrimario" type="submit">Solicitar acceso</button>
                </form>

                <div class="altaCodigoPanel oculto" data-alta-codigo-panel>
                    <div class="altaCodigoEstado">
                        <span>✓ Solicitud enviada</span>
                        <strong data-alta-jugador></strong>
                        <p>
                            El administrador ya puede ver que estás solicitando el alta.
                            Cuando te facilite el código, introdúcelo aquí.
                        </p>
                    </div>

                    <form class="loginForm altaForm" data-form="completar-alta">
                        <input type="hidden" name="jugador">

                        <label>
                            <span>Código de acceso</span>
                            <input
                                name="codigo"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="6"
                                placeholder="6 cifras"
                                autocomplete="one-time-code"
                                required
                            >
                        </label>

                        <p class="mensajeForm" data-codigo-mensaje></p>
                        <button class="btnPrimario" type="submit">Activar Mi Zona</button>
                    </form>
                </div>

                <small class="notaLogin">
                    Tu PIN lo eliges tú. El administrador no puede verlo.
                </small>
            </details>

            <small class="notaLogin">
                ¿Has olvidado tu PIN? Pide al administrador que restablezca tu acceso.
            </small>
        </section>
    `;
}

export function renderZona(datos) {
    const jugador = datos?.jugador || {};
    const teams = Array.isArray(datos?.teams) ? datos.teams : [];
    const convocatorias = Array.isArray(datos?.convocatorias) ? datos.convocatorias : [];
    const preparacion = Array.isArray(datos?.preparacion) ? datos.preparacion : [];

    app.innerHTML = `
        <section class="zonaHero">
            <div>
                <p class="eyebrow">MI ZONA</p>
                <h1>Hola, ${esc(jugador.nombre || "Jugador")}</h1>
                <p>Equipos, partidos y acciones pendientes de Teams.</p>
            </div>
            <div class="zonaHeroAcciones">
                <details class="seguridadZona">
                    <summary>🔐 Seguridad</summary>
                    <form class="formAccion" data-form="cambiar-pin">
                        <label>
                            <span>PIN actual</span>
                            <input
                                name="pinActual"
                                type="password"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="8"
                                required
                            >
                        </label>

                        <div class="dosCampos">
                            <label>
                                <span>Nuevo PIN</span>
                                <input
                                    name="pinNuevo"
                                    type="password"
                                    inputmode="numeric"
                                    pattern="[0-9]*"
                                    maxlength="8"
                                    required
                                >
                            </label>
                            <label>
                                <span>Repite el nuevo PIN</span>
                                <input
                                    name="pinNuevo2"
                                    type="password"
                                    inputmode="numeric"
                                    pattern="[0-9]*"
                                    maxlength="8"
                                    required
                                >
                            </label>
                        </div>

                        <button class="btnPrimario" type="submit">Cambiar PIN</button>
                        <p class="mensajeForm" data-form-mensaje></p>
                    </form>
                </details>
                <button class="btnSalir" type="button" data-action="salir">Salir</button>
            </div>
        </section>

        <section class="zonaContenido">
            ${convocatorias.length ? htmlConvocatorias(convocatorias) : ""}
            ${preparacion.length ? htmlPreparacionTeams(preparacion) : ""}
            ${teams.length
                ? teams.map(team => htmlTeam(team, jugador)).join("")
                : (convocatorias.length || preparacion.length)
                    ? ""
                    : '<div class="vacio">No tienes convocatorias ni ediciones de Teams activas.</div>'}
        </section>
    `;
}

function htmlConvocatorias(convocatorias) {
    return `
        <section class="convocatoriasZona">
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

function htmlPreparacionTeams(lista) {
    return `
        <section class="preparacionTeamsZona">
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

function htmlTeam(team, jugador) {
    const equipo = team?.equipo || {};
    const rival = team?.rival || {};
    const color = colorSeguro(equipo.color, equipo.lado);
    const partidos = Array.isArray(team?.partidos) ? team.partidos : [];

    return `
        <article class="teamCard" style="--equipo-color:${color}">
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
                <small>${capitan ? "Gestionas la disponibilidad" : "Tu disponibilidad"}</small>
            </div>

            <div class="plantillaMiZona">
                ${companeros.map(miembro => {
                    const puedeCambiar = capitan || miembro.id === jugador?.id;
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

function htmlPartido(team, partido, jugador) {
    const equipos = equiposPorLado(team);
    const parejaA = alineacionPorLado(team, partido, "A");
    const parejaB = alineacionPorLado(team, partido, "B");
    const programado = partido?.estado === "programado";
    const resultadoPendiente = partido?.estado === "pendiente_confirmacion";
    const introducidoPorMiEquipo = jugadorEsDeMiEquipo(team, partido?.resultado_introducido_por);
    const rivalPuedeConfirmar = resultadoPendiente && partido?.yo_juego && !introducidoPorMiEquipo;

    return `
        <article class="partidoZona" data-partido-id="${esc(partido.id)}">
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
