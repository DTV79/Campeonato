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
} from "./model.js?v=20261001-1910";

const nodos = {
    nombre: document.getElementById("teamsNombre"),
    subtitulo: document.getElementById("teamsSubtitulo"),
    estado: document.getElementById("teamsEstado"),
    cargando: document.getElementById("teamsCargando"),
    error: document.getElementById("teamsError"),
    errorTexto: document.getElementById("teamsErrorTexto"),
    contenido: document.getElementById("teamsContenido"),
    preparacion: document.getElementById("teamsPreparacion"),
    caracteristicas: document.getElementById("teamsCaracteristicas"),
    convocatoria: document.getElementById("teamsConvocatoria"),
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

    const estado = String(detalle?.estado || "");
    const esPreparacion = ["preparacion", "convocatoria", "draft"].includes(estado);
    const bloquePlantillas = nodos.plantillas?.closest(".teamsBloque");
    const bloquePartidos = nodos.partidos?.closest(".teamsBloque");

    mostrar(nodos.preparacion, esPreparacion);
    mostrar(nodos.marcador, !esPreparacion);
    mostrar(bloquePlantillas, !esPreparacion);
    mostrar(bloquePartidos, !esPreparacion);

    if (esPreparacion) {
        renderPreparacion(detalle);
        return;
    }

    renderMarcador(detalle);
    renderPlantillas(detalle);
    renderPartidos(detalle);
}

function renderPreparacion(detalle) {
    renderCaracteristicas(detalle);
    renderConvocatoriaPublica(detalle);
}

function renderCaracteristicas(detalle) {
    if (!nodos.caracteristicas) return;

    const modalidad = {
        numero_fijo: `${Number(detalle?.numero_partidos || 0)} partidos`,
        mejor_de: `Mejor de ${Number(detalle?.numero_partidos || 0)} partidos`,
        mejor_de_jugar_todos: `Mejor de ${Number(detalle?.numero_partidos || 0)} · se juegan todos`,
        numero_fijo_desempate: `${Number(detalle?.numero_partidos || 0)} partidos + desempate`
    }[detalle?.modalidad] || `${Number(detalle?.numero_partidos || 0)} partidos`;

    const repeticionJugador = detalle?.repetir_jugadores === "maximo"
        ? `Máximo ${Number(detalle?.max_partidos_jugador || 0)} partidos por jugador`
        : detalle?.repetir_jugadores === "no"
            ? "Sin repetir jugadores"
            : "Se pueden repetir jugadores";

    const parejas = detalle?.repetir_pareja
        ? "Se puede repetir pareja"
        : "No se puede repetir pareja";

    const rotacion = detalle?.todos_antes_repetir
        ? "Todos deben jugar antes de repetir jugador"
        : "No es obligatorio rotar a todos antes de repetir";

    const sistemaParejas = {
        secreto: "Parejas secretas",
        alterno: "Presentación alterna de parejas",
        ganador_primero: "El ganador anterior presenta primero"
    }[detalle?.sistema_eleccion_parejas] || "Sistema de parejas definido por la organización";

    const segundaVe = detalle?.sistema_eleccion_parejas !== "secreto"
        ? (detalle?.segundo_ve_pareja
            ? "El segundo equipo ve la pareja rival antes de presentar"
            : "El segundo equipo no ve la pareja rival")
        : "";

    const computos = [
        detalle?.computa_estadisticas ? "estadísticas" : "",
        detalle?.computa_ranking ? "ranking" : "",
        detalle?.computa_isp ? "ISP" : ""
    ].filter(Boolean);

    const items = [
        ["Formato", modalidad],
        ["Plantillas", `${Number(detalle?.jugadores_por_equipo || 0)} jugadores por equipo${Number(detalle?.reservas_por_equipo || 0) ? ` + ${Number(detalle.reservas_por_equipo)} reserva(s)` : ""}`],
        ["Participación", repeticionJugador],
        ["Parejas", parejas],
        ["Rotación", rotacion],
        ["Elección de parejas", sistemaParejas],
        segundaVe ? ["Presentación", segundaVe] : null,
        ["Plazo para presentar", `${Number(detalle?.plazo_presentar_horas || 0)} horas`],
        ["Acordar partido", `${Number(detalle?.plazo_acordar_dias || 0)} días`],
        ["Jugar partido", `${Number(detalle?.plazo_jugar_dias || 0)} días desde el anterior/acuerdo`],
        ["Computa para", computos.length ? computos.join(" · ") : "No computa en históricos"]
    ].filter(Boolean);

    nodos.caracteristicas.innerHTML = items.map(([titulo, valor]) => `
        <div class="caracteristicaTeam">
            <small>${escaparHtml(titulo)}</small>
            <strong>${escaparHtml(valor)}</strong>
        </div>
    `).join("");
}

function renderConvocatoriaPublica(detalle) {
    if (!nodos.convocatoria) return;

    const personas = Array.isArray(detalle?.convocatoria)
        ? detalle.convocatoria
        : [];

    const grupos = [
        {
            estado: "elegible",
            titulo: "Me apunto",
            icono: "✅",
            clase: "convocatoriaSi"
        },
        {
            estado: "pendiente",
            titulo: "En duda",
            icono: "🤔",
            clase: "convocatoriaDuda"
        },
        {
            estado: "no_disponible",
            titulo: "No puedo",
            icono: "❌",
            clase: "convocatoriaNo"
        }
    ];

    nodos.convocatoria.innerHTML = grupos.map(grupo => {
        const lista = personas.filter(p => p?.estado === grupo.estado);

        return `
            <article class="convocatoriaGrupo ${grupo.clase}">
                <div class="convocatoriaGrupoTitulo">
                    <span>${grupo.icono}</span>
                    <div>
                        <small>${escaparHtml(grupo.titulo)}</small>
                        <strong>${lista.length}</strong>
                    </div>
                </div>

                <div class="convocatoriaNombres">
                    ${lista.length
                        ? lista.map(p => `<span>${escaparHtml(p?.nombre || "Jugador")}</span>`).join("")
                        : '<em>Nadie todavía</em>'}
                </div>
            </article>
        `;
    }).join("");
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

            ${htmlMarcadorPartido(
                equipoA,
                equipoB,
                alineacionA,
                alineacionB,
                partido?.sets || []
            )}

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

function htmlMarcadorPartido(
    equipoA,
    equipoB,
    alineacionA,
    alineacionB,
    sets
) {
    return `
        <div class="marcadorPartidoCompacto">
            <div class="marcadorPartidoCabecera">
                <span class="cabeceraPareja">PAREJA</span>
                <span>SET 1</span>
                <span>SET 2</span>
                <span>SET 3</span>
            </div>

            ${htmlFilaEquipoPartido("A", equipoA, alineacionA, sets)}
            ${htmlFilaEquipoPartido("B", equipoB, alineacionB, sets)}
        </div>
    `;
}

function htmlFilaEquipoPartido(lado, equipo, jugadores, sets) {
    const color = colorSeguro(equipo?.color, lado);
    const nombres = jugadores.map(item => item?.jugador).filter(Boolean);

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
                    ${nombres.length
                        ? nombres.map(escaparHtml).join(' <span class="separadorPareja">/</span> ')
                        : "Pareja pendiente"}
                </strong>
            </div>

            ${[1, 2, 3]
                .map(numero => htmlPuntuacionSet(sets, numero, lado))
                .join("")}
        </div>
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
