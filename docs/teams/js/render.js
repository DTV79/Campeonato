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
} from "./model.js";

const nodos = {
    nombre: document.getElementById("teamsNombre"),
    subtitulo: document.getElementById("teamsSubtitulo"),
    estado: document.getElementById("teamsEstado"),
    cargando: document.getElementById("teamsCargando"),
    error: document.getElementById("teamsError"),
    errorTexto: document.getElementById("teamsErrorTexto"),
    contenido: document.getElementById("teamsContenido"),
    marcador: document.getElementById("teamsMarcador"),
    plantillas: document.getElementById("teamsPlantillas"),
    partidos: document.getElementById("teamsPartidos"),
    ediciones: document.getElementById("teamsEdiciones")
};

function mostrar(nodo, visible) {
    nodo?.classList.toggle("oculto", !visible);
}

function aplicarEstadoGeneral(estado) {
    if (!nodos.estado) return;

    nodos.estado.textContent = etiquetaEstadoGeneral(estado);
    nodos.estado.className = "estadoGeneral";

    if (estado === "en_curso") nodos.estado.classList.add("estadoEnJuego");
    else if (estado === "finalizado") nodos.estado.classList.add("estadoFinalizadoGeneral");
    else nodos.estado.classList.add("estadoNeutro");
}

export function mostrarCargandoTeams() {
    mostrar(nodos.cargando, true);
    mostrar(nodos.error, false);
    mostrar(nodos.contenido, false);

    if (nodos.nombre) nodos.nombre.textContent = "Teams";
    if (nodos.subtitulo) {
        nodos.subtitulo.textContent =
            "Enfrentamientos, marcador y evolución de la Copa por Equipos.";
    }
    if (nodos.estado) {
        nodos.estado.textContent = "Cargando…";
        nodos.estado.className = "estadoGeneral estadoCargando";
    }
}

export function renderErrorTeams(error) {
    mostrar(nodos.cargando, false);
    mostrar(nodos.contenido, false);
    mostrar(nodos.error, true);

    if (nodos.estado) {
        nodos.estado.textContent = "Sin conexión";
        nodos.estado.className = "estadoGeneral estadoIncidencia";
    }

    if (nodos.errorTexto) {
        nodos.errorTexto.textContent =
            error?.message || "No se pudo cargar la información de Teams.";
    }
}

export function renderSinTeams(ediciones = []) {
    mostrar(nodos.cargando, false);
    mostrar(nodos.error, true);
    mostrar(nodos.contenido, false);

    if (nodos.nombre) nodos.nombre.textContent = "Teams";
    if (nodos.estado) {
        nodos.estado.textContent = "Sin edición activa";
        nodos.estado.className = "estadoGeneral estadoNeutro";
    }
    if (nodos.errorTexto) {
        nodos.errorTexto.textContent = ediciones.length
            ? "La edición solicitada no está disponible públicamente."
            : "Todavía no hay una edición de Teams publicada.";
    }
}

export function renderDetalleTeams(detalle) {
    mostrar(nodos.cargando, false);
    mostrar(nodos.error, false);
    mostrar(nodos.contenido, true);

    if (nodos.nombre) {
        nodos.nombre.textContent = detalle?.nombre || "Teams";
    }

    if (nodos.subtitulo) {
        const inicio = formatearFechaSolo(detalle?.fecha_inicio);
        const fin = formatearFechaSolo(detalle?.fecha_fin);

        nodos.subtitulo.textContent =
            inicio && fin && inicio !== fin
                ? `${inicio} · ${fin}`
                : inicio || "Copa por equipos de Sprint Pádel";
    }

    aplicarEstadoGeneral(detalle?.estado);
    renderMarcador(detalle);
    renderPlantillas(detalle);
    renderPartidos(detalle);
}

function renderMarcador(detalle) {
    const equipoA = equipoPorLado(detalle, "A");
    const equipoB = equipoPorLado(detalle, "B");

    if (!equipoA || !equipoB) {
        nodos.marcador.innerHTML =
            '<div class="vacio">Los dos equipos todavía no están configurados.</div>';
        return;
    }

    const victoriasA = victoriasEquipo(detalle, equipoA.id);
    const victoriasB = victoriasEquipo(detalle, equipoB.id);
    const jugados = Number(detalle?.jugados_confirmados || 0);
    const total = Number(detalle?.numero_partidos || 0);
    const progreso = total > 0
        ? Math.min(100, Math.max(0, (jugados / total) * 100))
        : 0;

    const ganador = ganadorTeams(detalle);
    let cierre = "La Copa está en juego.";

    if (detalle?.estado === "finalizado") {
        cierre = ganador?.empate
            ? "La edición terminó empatada."
            : ganador?.nombre
                ? `🏆 ${escaparHtml(ganador.nombre)} gana esta edición de Teams.`
                : "Edición finalizada.";
    }

    nodos.marcador.innerHTML = `
        <div class="marcadorCabecera">
            <span>MARCADOR GENERAL</span>
            <strong>${jugados} de ${total || "—"} partidos confirmados</strong>
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

        <div class="marcadorPie">${cierre}</div>
    `;
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

function renderPlantillas(detalle) {
    const equipos = [...(detalle?.equipos || [])]
        .sort((a, b) => String(a?.lado).localeCompare(String(b?.lado)));

    if (!equipos.length) {
        nodos.plantillas.innerHTML =
            '<div class="vacio">Las plantillas todavía no están publicadas.</div>';
        return;
    }

    nodos.plantillas.innerHTML = equipos.map(equipo => {
        const lado = String(equipo?.lado || "A").toUpperCase();
        const color = colorSeguro(equipo?.color, lado);
        const miembros = equipo?.miembros || [];

        return `
            <article class="plantillaCard" style="--equipo-color:${color}">
                <div class="plantillaTitulo">
                    <span class="puntoEquipo" aria-hidden="true"></span>
                    <div>
                        <small>Equipo ${escaparHtml(lado)}</small>
                        <h3>${escaparHtml(equipo?.nombre || `Equipo ${lado}`)}</h3>
                    </div>
                </div>

                <div class="jugadoresLista">
                    ${miembros.map(miembro => `
                        <div class="jugadorFila">
                            <span class="jugadorNombre">${escaparHtml(miembro?.nombre || "Jugador")}</span>
                            <span class="jugadorEtiquetas">
                                ${miembro?.es_capitan ? '<em class="etiquetaCapitan">★ Capitán</em>' : ""}
                                ${miembro?.es_reserva ? '<em class="etiquetaReserva">Reserva</em>' : ""}
                            </span>
                        </div>
                    `).join("") || '<div class="jugadorFila tenue">Plantilla pendiente</div>'}
                </div>
            </article>
        `;
    }).join("");
}

function renderPartidos(detalle) {
    const partidos = detalle?.partidos || [];
    const equipoA = equipoPorLado(detalle, "A");
    const equipoB = equipoPorLado(detalle, "B");

    if (!partidos.length) {
        nodos.partidos.innerHTML =
            '<div class="vacio">Todavía no hay partidos creados.</div>';
        return;
    }

    nodos.partidos.innerHTML = partidos
        .map(partido => htmlPartido(partido, equipoA, equipoB))
        .join("");
}

function htmlPartido(partido, equipoA, equipoB) {
    const alineacionA = alineacionPorLado(partido, "A");
    const alineacionB = alineacionPorLado(partido, "B");
    const resultado = tipoResultado(partido);
    const fecha = formatearFechaHora(partido?.fecha_hora);
    const pista = String(partido?.pista || "").trim();
    const duracion = Number(partido?.duracion_min || 0);
    const finalizacion = resumenFinalizacion(partido?.finalizacion);

    const meta = [
        fecha ? `🗓️ ${escaparHtml(fecha)}` : "",
        pista ? `📍 ${escaparHtml(pista)}` : "",
        duracion > 0 ? `⏱️ ${duracion} min` : ""
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
                    ${meta.map(item => `<span>${item}</span>`).join("")}
                </div>
            ` : ""}

            ${htmlAvisoResultado(resultado)}

            <div class="partidoParejas">
                ${htmlPareja("A", equipoA, alineacionA)}
                <span class="versus">VS</span>
                ${htmlPareja("B", equipoB, alineacionB)}
            </div>

            ${htmlSets(partido?.sets || [])}

            ${finalizacion ? `
                <div class="finalizacionPartido">${escaparHtml(finalizacion)}</div>
            ` : ""}
        </article>
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

function htmlPareja(lado, equipo, jugadores) {
    const color = colorSeguro(equipo?.color, lado);
    const nombres = jugadores.map(item => item?.jugador).filter(Boolean);

    return `
        <div class="parejaPartido pareja${lado}" style="--equipo-color:${color}">
            <span class="puntoEquipo" aria-hidden="true"></span>
            <small>${escaparHtml(equipo?.nombre || `Equipo ${lado}`)}</small>
            <strong>
                ${nombres.length
                    ? nombres.map(escaparHtml).join(" <span class=\"separadorPareja\">+</span> ")
                    : "Pareja pendiente"}
            </strong>
        </div>
    `;
}

function htmlSets(sets) {
    if (!Array.isArray(sets) || !sets.length) {
        return '<div class="sinResultado">Resultado pendiente</div>';
    }

    return `
        <div class="setsPartido">
            ${sets.map(set => {
                const tieA = set?.tiebreak_a;
                const tieB = set?.tiebreak_b;
                const tieneTie = Number.isInteger(tieA) && Number.isInteger(tieB);

                return `
                    <div class="setCaja">
                        <small>SET ${Number(set?.numero || 0)}</small>
                        <strong>
                            <span>${Number(set?.puntos_a ?? 0)}</span>
                            <i>–</i>
                            <span>${Number(set?.puntos_b ?? 0)}</span>
                        </strong>
                        ${tieneTie
                            ? `<em>TB ${tieA}–${tieB}</em>`
                            : "<em>&nbsp;</em>"}
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

export function renderEdicionesTeams(ediciones, activaId) {
    if (!nodos.ediciones) return;

    if (!Array.isArray(ediciones) || !ediciones.length) {
        nodos.ediciones.innerHTML =
            '<div class="vacio">Todavía no hay ediciones anteriores.</div>';
        return;
    }

    nodos.ediciones.innerHTML = ediciones.map(edicion => {
        const activa = edicion?.id === activaId;
        const fecha = formatearFechaSolo(edicion?.fecha_inicio);

        return `
            <button
                type="button"
                class="edicionBoton${activa ? " activa" : ""}"
                data-team-id="${escaparHtml(edicion?.id || "")}"
                ${activa ? 'aria-current="page"' : ""}
            >
                <span>
                    <small>${escaparHtml(etiquetaEstadoGeneral(edicion?.estado))}</small>
                    <strong>${escaparHtml(edicion?.nombre || "Teams")}</strong>
                </span>
                <em>${escaparHtml(fecha || "")}</em>
                <b>${activa ? "Actual" : "Ver →"}</b>
            </button>
        `;
    }).join("");
}
