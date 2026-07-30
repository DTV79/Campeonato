const URL_ESTADO_ESTADISTICAS = "estado_torneo.json";
const URL_DATOS_ESTADISTICAS = "estadisticas.json";
const CLAVE_ACCESO_MANTENIMIENTO_ESTADISTICAS =
    "campeonato_acceso_mantenimiento";

let estadoCampeonato = null;
let estadisticas = null;

const estadoVistaEstadisticas = {
    ambito: "global",
    idCampeonato: "",
    pestana: "resumen"
};

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        iniciarPaginaEstadisticas,
        { once: true }
    );
} else {
    iniciarPaginaEstadisticas();
}

document.addEventListener(
    "click",
    gestionarClickEstadisticas
);

document.addEventListener(
    "change",
    gestionarCambioEstadisticas
);

async function iniciarPaginaEstadisticas() {
    try {
        const estadoInicial =
            window.estadoInicialEstadisticas ||
            null;

        const [estado, origenEstadisticas] =
            await Promise.all([
                estadoInicial || cargarJSONEstadisticas(
                    URL_ESTADO_ESTADISTICAS
                ),
                cargarJSONEstadisticas(
                    URL_DATOS_ESTADISTICAS
                )
            ]);

        estadoCampeonato = estado || {};
        estadisticas = origenEstadisticas || {};

        if (
            modoMantenimientoEstadisticasActivo() &&
            !tieneAccesoMantenimientoEstadisticas()
        ) {
            pintarMantenimientoEstadisticas();
            return;
        }

        inicializarEstadoVistaEstadisticas();
        pintarCabeceraEstadisticas();
        pintarPaginaEstadisticas();
    } catch (error) {
        console.error(
            "No se pudo cargar la página de estadísticas.",
            error
        );

        pintarErrorEstadisticas();
    } finally {
        document.body.classList.remove(
            "appCargando"
        );
    }
}

async function cargarJSONEstadisticas(url) {
    const respuesta = await fetch(
        `${url}?v=${Date.now()}`,
        { cache: "no-store" }
    );

    if (!respuesta.ok) {
        throw new Error(
            `No se pudo cargar ${url} (${respuesta.status})`
        );
    }

    return respuesta.json();
}

function inicializarEstadoVistaEstadisticas() {
    const campeonatos = obtenerCampeonatosEstadisticas();
    const parametros = new URLSearchParams(
        window.location.search
    );

    const ambitoSolicitado =
        parametros.get("ambito");

    const idSolicitado =
        parametros.get("campeonato");

    const pestanaSolicitada =
        parametros.get("seccion");

    if (
        ambitoSolicitado === "campeonato" &&
        campeonatos.length
    ) {
        estadoVistaEstadisticas.ambito =
            "campeonato";
    }

    const campeonatoValido = campeonatos.find(
        campeonato =>
            String(campeonato.id_campeonato) ===
            String(idSolicitado)
    );

    estadoVistaEstadisticas.idCampeonato =
        campeonatoValido?.id_campeonato ||
        campeonatos[0]?.id_campeonato ||
        "";

    const pestanasValidas =
        obtenerPestanasEstadisticas();

    if (
        pestanasValidas.some(
            pestana =>
                pestana.clave === pestanaSolicitada
        )
    ) {
        estadoVistaEstadisticas.pestana =
            pestanaSolicitada;
    }
}

function obtenerCampeonatosEstadisticas() {
    return [...(estadisticas?.campeonatos || [])]
        .sort((a, b) =>
            numeroEstadisticas(b.anio) -
                numeroEstadisticas(a.anio) ||
            String(b.id_campeonato || "")
                .localeCompare(
                    String(a.id_campeonato || ""),
                    "es",
                    { numeric: true }
                )
        );
}

function obtenerCampeonatoSeleccionado() {
    return obtenerCampeonatosEstadisticas()
        .find(
            campeonato =>
                String(campeonato.id_campeonato) ===
                String(
                    estadoVistaEstadisticas.idCampeonato
                )
        ) || null;
}

function pintarCabeceraEstadisticas() {
    const config =
        estadoCampeonato?.configuracion || {};

    const nombre = String(
        config.nombre_campeonato ||
        "Sprint Pádel Tui"
    ).trim();

    const titulo = document.getElementById(
        "tituloEstadisticas"
    );

    const subtitulo = document.getElementById(
        "subtituloEstadisticas"
    );

    const generado = document.getElementById(
        "fechaGeneracionEstadisticas"
    );

    if (titulo) {
        titulo.textContent = "Estadísticas";
    }

    if (subtitulo) {
        subtitulo.textContent = nombre;
    }

    if (generado) {
        generado.textContent =
            formatearFechaHoraEstadisticas(
                estadisticas?.generado
            ) || "—";
    }

    document.title =
        `Estadísticas · ${nombre}`;
}

function pintarPaginaEstadisticas() {
    const contenido = document.getElementById(
        "contenidoEstadisticas"
    );

    if (!contenido) return;

    const campeonatos =
        obtenerCampeonatosEstadisticas();

    if (!estadisticas?.global && !campeonatos.length) {
        contenido.innerHTML = pintarVacioEstadisticas(
            "Estadísticas pendientes",
            "Todavía no hay campeonatos cerrados guardados en el histórico."
        );
        return;
    }

    const pestanas = obtenerPestanasEstadisticas();

    if (
        !pestanas.some(
            pestana =>
                pestana.clave ===
                estadoVistaEstadisticas.pestana
        )
    ) {
        estadoVistaEstadisticas.pestana =
            "resumen";
    }

    contenido.innerHTML = `
        ${pintarSelectorAmbitoEstadisticas()}
        ${pintarSelectorPestanasEstadisticas(pestanas)}
        <div id="panelEstadisticas">
            ${pintarPanelEstadisticas()}
        </div>
    `;

    actualizarURLPaginaEstadisticas();
}

function pintarSelectorAmbitoEstadisticas() {
    const campeonatos =
        obtenerCampeonatosEstadisticas();

    const esGlobal =
        estadoVistaEstadisticas.ambito ===
        "global";

    return `
        <section class="controlAmbitoEstadisticas">
            <div class="cabeceraControlEstadisticas">
                <div>
                    <small>ÁMBITO</small>
                    <strong>
                        ${esGlobal
                            ? "Todos los campeonatos"
                            : "Campeonato seleccionado"
                        }
                    </strong>
                </div>
                <span>📊</span>
            </div>

            <div class="botonesAmbitoEstadisticas">
                <button
                    type="button"
                    class="btnAmbitoEstadisticas ${
                        esGlobal ? "activo" : ""
                    }"
                    data-ambito-estadisticas="global"
                >
                    🌍 Global
                </button>

                <button
                    type="button"
                    class="btnAmbitoEstadisticas ${
                        !esGlobal ? "activo" : ""
                    }"
                    data-ambito-estadisticas="campeonato"
                    ${campeonatos.length ? "" : "disabled"}
                >
                    🏆 Por campeonato
                </button>
            </div>

            ${!esGlobal && campeonatos.length
                ? `
                    <label class="selectorCampeonatoEstadisticas">
                        <span>Edición</span>
                        <select id="selectorCampeonatoEstadisticas">
                            ${campeonatos.map(campeonato => `
                                <option
                                    value="${escaparAtributoEstadisticas(
                                        campeonato.id_campeonato
                                    )}"
                                    ${
                                        String(campeonato.id_campeonato) ===
                                        String(
                                            estadoVistaEstadisticas.idCampeonato
                                        )
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escaparHTMLEstadisticas(
                                        campeonato.nombre ||
                                        campeonato.id_campeonato
                                    )}
                                </option>
                            `).join("")}
                        </select>
                    </label>
                `
                : ""
            }
        </section>
    `;
}

function obtenerPestanasEstadisticas() {
    const global =
        estadoVistaEstadisticas.ambito ===
        "global";

    const pestanas = [
        {
            clave: "resumen",
            icono: "📊",
            texto: "Resumen"
        }
    ];

    if (!global) {
        pestanas.push({
            clave: "equipos",
            icono: "👥",
            texto: "Equipos"
        });
    }

    pestanas.push(
        {
            clave: "partidos",
            icono: "🎾",
            texto: "Partidos"
        },
        {
            clave: "pistas",
            icono: "🏟️",
            texto: "Pistas"
        },
        {
            clave: "parejas",
            icono: "🤝",
            texto: "Parejas"
        },
        {
            clave: "records",
            icono: "⭐",
            texto: "Récords"
        }
    );

    return pestanas;
}

function pintarSelectorPestanasEstadisticas(pestanas) {
    return `
        <nav
            class="selectorPestanasEstadisticas"
            aria-label="Secciones de estadísticas"
        >
            ${pestanas.map(pestana => `
                <button
                    type="button"
                    class="btnPestanaEstadisticas ${
                        estadoVistaEstadisticas.pestana ===
                        pestana.clave
                            ? "activo"
                            : ""
                    }"
                    data-pestana-estadisticas="${pestana.clave}"
                >
                    <span>${pestana.icono}</span>
                    ${pestana.texto}
                </button>
            `).join("")}
        </nav>
    `;
}

function pintarPanelEstadisticas() {
    const ambito = obtenerAmbitoDatosEstadisticas();

    if (!ambito) {
        return pintarVacioEstadisticas(
            "Sin datos",
            "No se encontraron estadísticas para el ámbito seleccionado."
        );
    }

    switch (estadoVistaEstadisticas.pestana) {
        case "equipos":
            return pintarEquiposEstadisticas(ambito);
        case "partidos":
            return pintarPartidosEstadisticas(ambito);
        case "pistas":
            return pintarPistasEstadisticas(ambito);
        case "parejas":
            return pintarParejasEstadisticas(ambito);
        case "records":
            return pintarRecordsEstadisticas(ambito);
        default:
            return pintarResumenEstadisticas(ambito);
    }
}

function obtenerAmbitoDatosEstadisticas() {
    if (
        estadoVistaEstadisticas.ambito ===
        "global"
    ) {
        return estadisticas?.global || null;
    }

    return obtenerCampeonatoSeleccionado();
}

function pintarResumenEstadisticas(ambito) {
    const esGlobal =
        estadoVistaEstadisticas.ambito ===
        "global";

    const resumen = ambito?.resumen || {};

    const titulo = esGlobal
        ? "Resumen histórico"
        : ambito.nombre || "Resumen del campeonato";

    const descripcion = esGlobal
        ? construirPeriodoGlobalEstadisticas(resumen)
        : [ambito.fecha, ambito.tipo, ambito.estructura]
            .filter(Boolean)
            .join(" · ");

    const metricas = esGlobal
        ? [
            ["🏆", "Campeonatos", resumen.campeonatos_finalizados],
            ["🎾", "Partidos", resumen.partidos_jugados],
            ["👤", "Jugadores", resumen.jugadores_distintos],
            ["🤝", "Parejas", resumen.parejas_distintas],
            ["📚", "Sets", resumen.sets_jugados],
            ["🔢", "Puntos", resumen.puntos_disputados]
        ]
        : [
            ["👥", "Equipos", resumen.equipos_participantes],
            ["👤", "Jugadores", resumen.jugadores_participantes],
            ["🎾", "Partidos", resumen.partidos_jugados],
            ["📚", "Sets", resumen.sets_jugados],
            ["🔢", "Puntos", resumen.puntos_disputados],
            [
                "⏱️",
                "Duración media",
                formatearDuracionEstadisticas(
                    resumen.duracion_media_min
                )
            ]
        ];

    return `
        <section class="cabeceraResumenEstadisticas">
            <div>
                <small>${esGlobal ? "GLOBAL" : "EDICIÓN"}</small>
                <h1>${escaparHTMLEstadisticas(titulo)}</h1>
                <p>${escaparHTMLEstadisticas(descripcion || "")}</p>
            </div>
            <span>${esGlobal ? "🌍" : "🏆"}</span>
        </section>

        ${!esGlobal
            ? pintarPalmaresCampeonatoEstadisticas(ambito)
            : ""
        }

        <section class="gridMetricasEstadisticas">
            ${metricas.map(([icono, etiqueta, valor]) =>
                pintarMetricaEstadisticas(
                    icono,
                    etiqueta,
                    valor
                )
            ).join("")}
        </section>

        <section class="bloqueEstadisticas">
            <div class="tituloBloqueEstadisticas">
                <div>
                    <small>DISTRIBUCIÓN</small>
                    <h2>Partidos por fase</h2>
                </div>
                <span>🧭</span>
            </div>

            ${pintarFasesEstadisticas(
                ambito.por_fase || []
            )}
        </section>

        <section class="bloqueEstadisticas">
            <div class="tituloBloqueEstadisticas">
                <div>
                    <small>COMPETICIÓN</small>
                    <h2>Tipo de partidos</h2>
                </div>
                <span>🎾</span>
            </div>

            <div class="gridComparativaEstadisticas">
                ${pintarComparativaEstadisticas(
                    "Competición principal",
                    resumen.partidos_competicion_principal,
                    resumen.partidos_jugados,
                    "🏁"
                )}
                ${pintarComparativaEstadisticas(
                    "Palas de playa",
                    resumen.partidos_palas_playa,
                    resumen.partidos_jugados,
                    "🏖️"
                )}
            </div>
        </section>

        ${pintarAvisoDatosTiempoEstadisticas(resumen)}
    `;
}

function construirPeriodoGlobalEstadisticas(resumen) {
    const primero = numeroEstadisticas(
        resumen.primer_anio
    );

    const ultimo = numeroEstadisticas(
        resumen.ultimo_anio
    );

    if (!primero && !ultimo) {
        return "Todos los campeonatos finalizados";
    }

    if (primero === ultimo) {
        return `Datos históricos de ${primero}`;
    }

    return `Datos acumulados de ${primero} a ${ultimo}`;
}

function pintarPalmaresCampeonatoEstadisticas(campeonato) {
    if (!campeonato.campeon && !campeonato.subcampeon) {
        return "";
    }

    return `
        <section class="palmaresEstadisticas">
            <article>
                <span>🏆</span>
                <small>CAMPEONES</small>
                <strong>${escaparHTMLEstadisticas(
                    campeonato.campeon || "—"
                )}</strong>
            </article>
            <article>
                <span>🥈</span>
                <small>SUBCAMPEONES</small>
                <strong>${escaparHTMLEstadisticas(
                    campeonato.subcampeon || "—"
                )}</strong>
            </article>
        </section>
    `;
}

function pintarMetricaEstadisticas(
    icono,
    etiqueta,
    valor
) {
    const texto = valor === null || valor === undefined || valor === ""
        ? "—"
        : valor;

    return `
        <article class="metricaEstadisticas">
            <span>${icono}</span>
            <small>${escaparHTMLEstadisticas(etiqueta)}</small>
            <strong>${escaparHTMLEstadisticas(texto)}</strong>
        </article>
    `;
}

function pintarFasesEstadisticas(fases) {
    if (!fases.length) {
        return pintarVacioEstadisticas(
            "Sin fases",
            "No hay información por fases."
        );
    }

    const maxPartidos = Math.max(
        ...fases.map(fase =>
            numeroEstadisticas(fase.partidos)
        ),
        1
    );

    return `
        <div class="listaFasesEstadisticas">
            ${fases.map(fase => {
                const partidos = numeroEstadisticas(
                    fase.partidos
                );

                const porcentaje = Math.round(
                    partidos / maxPartidos * 100
                );

                return `
                    <article class="faseEstadisticas">
                        <div class="cabeceraFaseEstadisticas">
                            <strong>${escaparHTMLEstadisticas(
                                fase.fase || "Fase"
                            )}</strong>
                            <b>${partidos} partidos</b>
                        </div>
                        <div class="barraEstadisticas">
                            <span style="width:${porcentaje}%"></span>
                        </div>
                        <div class="datosFaseEstadisticas">
                            <span>${numeroEstadisticas(fase.sets)} sets</span>
                            <span>${numeroEstadisticas(fase.puntos)} puntos</span>
                            ${pintarDuracionMediaFaseEstadisticas(
                                fase.duracion_media_min
                            )}
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
    `;
}

function pintarDuracionMediaFaseEstadisticas(valor) {
    const minutos = Number(valor);

    if (!Number.isFinite(minutos) || minutos <= 0) {
        return `
            <span class="sinDuracionFaseEstadisticas">
                ⏱️ No disponemos de datos de duración
            </span>
        `;
    }

    return `
        <span>
            ⏱️ ${escaparHTMLEstadisticas(
                formatearDuracionEstadisticas(minutos)
            )} de media
        </span>
    `;
}

function pintarComparativaEstadisticas(
    titulo,
    valor,
    total,
    icono
) {
    const numeroValor = numeroEstadisticas(valor);
    const numeroTotal = numeroEstadisticas(total);
    const porcentaje = numeroTotal
        ? Math.round(numeroValor / numeroTotal * 100)
        : 0;

    return `
        <article>
            <span>${icono}</span>
            <small>${escaparHTMLEstadisticas(titulo)}</small>
            <strong>${numeroValor}</strong>
            <b>${porcentaje}% del total</b>
        </article>
    `;
}

function pintarAvisoDatosTiempoEstadisticas(resumen) {
    const hayPistas =
        resumen.datos_pistas_disponibles === true;

    const hayDuracion =
        resumen.datos_duracion_disponibles === true;

    if (hayPistas && hayDuracion) {
        return "";
    }

    const faltan = [];

    if (!hayPistas) faltan.push("pistas");
    if (!hayDuracion) faltan.push("duraciones");

    return `
        <section class="avisoDatosEstadisticas">
            <span>ℹ️</span>
            <div>
                <strong>Datos históricos incompletos</strong>
                <p>
                    No hay ${escaparHTMLEstadisticas(
                        unirListaEstadisticas(faltan)
                    )} guardadas para este ámbito. Las estadísticas deportivas sí están disponibles.
                </p>
            </div>
        </section>
    `;
}

function pintarEquiposEstadisticas(campeonato) {
    const equipos = [...(campeonato?.equipos || [])]
        .sort((a, b) =>
            numeroEstadisticas(b.pg) -
                numeroEstadisticas(a.pg) ||
            numeroEstadisticas(
                b.porcentaje_victorias
            ) -
                numeroEstadisticas(
                    a.porcentaje_victorias
                ) ||
            numeroEstadisticas(b.diferencia_sets) -
                numeroEstadisticas(a.diferencia_sets) ||
            numeroEstadisticas(b.diferencia_puntos) -
                numeroEstadisticas(a.diferencia_puntos)
        );

    if (!equipos.length) {
        return pintarVacioEstadisticas(
            "Sin equipos",
            "No hay estadísticas de equipos para este campeonato."
        );
    }

    const records = campeonato?.records?.equipos || {};

    return `
        <section class="cabeceraPanelEstadisticas">
            <div>
                <small>RENDIMIENTO</small>
                <h1>Estadísticas de equipos</h1>
                <p>${equipos.length} equipos ordenados por victorias.</p>
            </div>
            <span>👥</span>
        </section>

        <div class="listaEquiposEstadisticas">
            ${equipos.map((equipo, indice) =>
                pintarEquipoEstadisticas(
                    equipo,
                    indice + 1,
                    records
                )
            ).join("")}
        </div>
    `;
}

function pintarEquipoEstadisticas(
    equipo,
    posicion,
    records
) {
    const etiquetas = [];

    if (
        estaEnRecordEquipoEstadisticas(
            equipo,
            records.mas_victorias
        )
    ) {
        etiquetas.push("🏆 Más victorias");
    }

    if (
        estaEnRecordEquipoEstadisticas(
            equipo,
            records.mejor_ataque
        )
    ) {
        etiquetas.push("⚡ Mejor ataque");
    }

    if (
        estaEnRecordEquipoEstadisticas(
            equipo,
            records.mejor_defensa
        )
    ) {
        etiquetas.push("🛡️ Mejor defensa");
    }

    return `
        <article class="equipoEstadisticas">
            <div class="cabeceraEquipoEstadisticas">
                <span>${posicion}º</span>
                <div>
                    <strong>${escaparHTMLEstadisticas(
                        equipo.equipo
                    )}</strong>
                    <small>
                        ${numeroEstadisticas(equipo.pj)} PJ ·
                        ${numeroEstadisticas(equipo.pg)} PG ·
                        ${numeroEstadisticas(equipo.pp)} PP
                    </small>
                </div>
                <b class="porcentajeEquipoEstadisticas">
                    <strong>${formatearPorcentajeEstadisticas(
                        equipo.porcentaje_victorias
                    )}</strong>
                    <small>Victorias</small>
                </b>
            </div>

            ${etiquetas.length
                ? `
                    <div class="etiquetasEquipoEstadisticas">
                        ${etiquetas.map(etiqueta =>
                            `<span>${escaparHTMLEstadisticas(etiqueta)}</span>`
                        ).join("")}
                    </div>
                `
                : ""
            }

            <div class="gridDatosEquipoEstadisticas">
                ${pintarDatoEquipoEstadisticas(
                    "Sets",
                    `${numeroEstadisticas(equipo.sets_favor)}–${numeroEstadisticas(equipo.sets_contra)}`,
                    formatearDiferenciaEstadisticas(
                        equipo.diferencia_sets
                    )
                )}
                ${pintarDatoEquipoEstadisticas(
                    "Puntos",
                    `${numeroEstadisticas(equipo.puntos_favor)}–${numeroEstadisticas(equipo.puntos_contra)}`,
                    formatearDiferenciaEstadisticas(
                        equipo.diferencia_puntos
                    )
                )}
                ${pintarDatoEquipoEstadisticas(
                    "Ataque",
                    formatearDecimalEstadisticas(
                        equipo.media_puntos_favor
                    ),
                    "pts/partido"
                )}
                ${pintarDatoEquipoEstadisticas(
                    "Defensa",
                    formatearDecimalEstadisticas(
                        equipo.media_puntos_contra
                    ),
                    "pts recibidos"
                )}
            </div>
        </article>
    `;
}

function pintarDatoEquipoEstadisticas(
    titulo,
    valor,
    detalle
) {
    return `
        <div>
            <small>${escaparHTMLEstadisticas(titulo)}</small>
            <strong>${escaparHTMLEstadisticas(valor)}</strong>
            <span>${escaparHTMLEstadisticas(detalle)}</span>
        </div>
    `;
}

function estaEnRecordEquipoEstadisticas(
    equipo,
    lista
) {
    return (lista || []).some(
        candidato =>
            normalizarEstadisticas(candidato.equipo) ===
            normalizarEstadisticas(equipo.equipo)
    );
}

function pintarPartidosEstadisticas(ambito) {
    const esGlobal =
        estadoVistaEstadisticas.ambito ===
        "global";

    const records = ambito?.records?.partidos || {};

    return `
        <section class="cabeceraPanelEstadisticas">
            <div>
                <small>ENCUENTROS</small>
                <h1>Estadísticas de partidos</h1>
                <p>
                    ${esGlobal
                        ? "Récords acumulados de todos los campeonatos."
                        : "Partidos destacados y resultados de esta edición."
                    }
                </p>
            </div>
            <span>🎾</span>
        </section>

        ${pintarRecordsPartidosEstadisticas(records)}

        ${!esGlobal
            ? pintarPartidosAgrupadosPorFaseEstadisticas(ambito)
            : ""
        }
    `;
}

function pintarRecordsPartidosEstadisticas(records) {
    const tarjetas = [
        [
            "🤏",
            "Partido más igualado",
            records.mas_igualados,
            partido =>
                `${formatearNumeroDecimalEstadisticas(partido.margen_medio_set)} puntos de margen medio por set`
        ],
        [
            "💥",
            "Mayor diferencia",
            records.mayor_diferencia,
            partido =>
                `${formatearNumeroDecimalEstadisticas(partido.margen_medio_set)} puntos de margen medio por set`
        ],
        [
            "🔥",
            "Más puntos",
            records.mas_puntos,
            partido =>
                `${numeroEstadisticas(partido.total_puntos)} puntos totales`
        ],
        [
            "🧊",
            "Menos puntos",
            records.menos_puntos,
            partido =>
                `${numeroEstadisticas(partido.total_puntos)} puntos totales`
        ],
        [
            "⏳",
            "Partido más largo",
            records.mas_largos,
            partido =>
                formatearDuracionEstadisticas(
                    partido.duracion_min
                )
        ],
        [
            "⚡",
            "Partido más corto",
            records.mas_cortos,
            partido =>
                formatearDuracionEstadisticas(
                    partido.duracion_min
                )
        ]
    ];

    const disponibles = tarjetas.filter(
        tarjeta =>
            Array.isArray(tarjeta[2]) &&
            tarjeta[2].length
    );

    if (!disponibles.length) {
        return pintarVacioEstadisticas(
            "Sin récords de partidos",
            "Todavía no hay partidos suficientes para calcular estos récords."
        );
    }

    return `
        <div class="gridRecordsPartidosEstadisticas">
            ${disponibles.map(([
                icono,
                titulo,
                lista,
                obtenerValor
            ]) =>
                pintarRecordPartidoEstadisticas(
                    icono,
                    titulo,
                    lista,
                    obtenerValor
                )
            ).join("")}
        </div>
    `;
}

function pintarRecordPartidoEstadisticas(
    icono,
    titulo,
    partidos,
    obtenerValor
) {
    return `
        <article class="recordPartidoEstadisticas">
            <div class="cabeceraRecordPartidoEstadisticas">
                <span>${icono}</span>
                <small>${escaparHTMLEstadisticas(titulo)}</small>
            </div>

            ${partidos.map(partido => `
                <div class="detalleRecordPartidoEstadisticas">
                    <strong>
                        ${escaparHTMLEstadisticas(partido.equipo1)}
                        <em>vs</em>
                        ${escaparHTMLEstadisticas(partido.equipo2)}
                    </strong>
                    <b>${escaparHTMLEstadisticas(
                        partido.resultado || "—"
                    )}</b>
                    <p>
                        ${escaparHTMLEstadisticas(
                            [
                                obtenerValor(partido),
                                detallePartidoEstadisticas(partido),
                                obtenerPistaYDuracionPartidoEstadisticas(
                                    partido
                                )
                            ]
                                .filter(Boolean)
                                .join(" · ")
                        )}
                    </p>
                </div>
            `).join("")}
        </article>
    `;
}

function pintarPartidosAgrupadosPorFaseEstadisticas(campeonato) {
    const partidos = campeonato?.partidos || [];

    if (!partidos.length) {
        return pintarVacioEstadisticas(
            "Sin partidos",
            "No hay partidos guardados para este campeonato."
        );
    }

    const grupos = new Map();

    partidos.forEach(partido => {
        const fase = String(partido.fase || "Sin fase").trim() || "Sin fase";
        if (!grupos.has(fase)) grupos.set(fase, []);
        grupos.get(fase).push(partido);
    });

    return `
        <section class="bloqueEstadisticas">
            <div class="tituloBloqueEstadisticas">
                <div>
                    <small>RESULTADOS</small>
                    <h2>Partidos por fase</h2>
                </div>
                <span>🎾</span>
            </div>

            <div class="listaFasesPartidosEstadisticas">
                ${[...grupos.entries()].map(([fase, lista], indice) => `
                    <details class="detalleFasePartidosEstadisticas" ${indice === 0 ? "open" : ""}>
                        <summary>
                            <span>${escaparHTMLEstadisticas(fase)}</span>
                            <b>${lista.length} ${lista.length === 1 ? "partido" : "partidos"}</b>
                        </summary>
                        <div class="listaPartidosEstadisticas">
                            ${lista.map(pintarPartidoEstadisticas).join("")}
                        </div>
                    </details>
                `).join("")}
            </div>
        </section>
    `;
}

function pintarPartidoEstadisticas(partido) {
    const pistaYDuracion =
        obtenerPistaYDuracionPartidoEstadisticas(
            partido
        );

    return `
        <article>
            <div class="cabeceraPartidoEstadisticas">
                <small>${escaparHTMLEstadisticas(
                    detallePartidoEstadisticas(partido)
                )}</small>
            </div>
            <strong>
                ${escaparHTMLEstadisticas(partido.equipo1)}
                <em>vs</em>
                ${escaparHTMLEstadisticas(partido.equipo2)}
            </strong>
            <b>${escaparHTMLEstadisticas(
                partido.resultado || "—"
            )}</b>
            <p>
                Ganador: ${escaparHTMLEstadisticas(
                    partido.ganador || "—"
                )}
                ${pistaYDuracion
                    ? ` · ${escaparHTMLEstadisticas(
                        pistaYDuracion
                    )}`
                    : ""
                }
            </p>
        </article>
    `;
}

function obtenerPistaYDuracionPartidoEstadisticas(
    partido
) {
    const datos = [];

    const pista = String(
        partido?.pista ?? ""
    ).trim();

    if (pista) {
        datos.push(`Pista ${pista}`);
    }

    const duracion = Number(
        partido?.duracion_min
    );

    if (
        Number.isFinite(duracion) &&
        duracion > 0
    ) {
        datos.push(
            formatearDuracionEstadisticas(
                duracion
            )
        );
    }

    return datos.join(" · ");
}

function formatearNumeroDecimalEstadisticas(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return "—";

    return numero.toLocaleString("es-ES", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
    });
}

function detallePartidoEstadisticas(partido) {
    return [
        partido.fase,
        partido.grupo_ronda
            ? `${partido.grupo_ronda}`
            : "",
        numeroEstadisticas(partido.jornada)
            ? `Jornada ${numeroEstadisticas(partido.jornada)}`
            : ""
    ].filter(Boolean).join(" · ");
}

function pintarPistasEstadisticas(ambito) {
    const resumen = ambito?.resumen || {};
    const pistas = ambito?.pistas || [];
    const records = ambito?.records?.pistas || {};

    if (!pistas.length) {
        return `
            <section class="cabeceraPanelEstadisticas">
                <div>
                    <small>PISTAS Y TIEMPOS</small>
                    <h1>Estadísticas de pistas</h1>
                    <p>Uso, carga acumulada y velocidad media.</p>
                </div>
                <span>🏟️</span>
            </section>

            ${pintarVacioEstadisticas(
                "Datos de pistas no disponibles",
                "Los partidos históricos de este ámbito no tienen pista o duración guardada. Esta sección se completará automáticamente en los campeonatos que sí registren esos datos."
            )}
        `;
    }

    return `
        <section class="cabeceraPanelEstadisticas">
            <div>
                <small>PISTAS Y TIEMPOS</small>
                <h1>Estadísticas de pistas</h1>
                <p>La rapidez se calcula mediante la duración media por partido.</p>
            </div>
            <span>🏟️</span>
        </section>

        <section class="gridMetricasEstadisticas">
            ${pintarMetricaEstadisticas(
                "🎾",
                "Con pista",
                resumen.partidos_con_pista
            )}
            ${pintarMetricaEstadisticas(
                "⏱️",
                "Con duración",
                resumen.partidos_con_duracion
            )}
            ${pintarMetricaEstadisticas(
                "⌛",
                "Duración total",
                formatearDuracionEstadisticas(
                    resumen.duracion_total_min
                )
            )}
            ${pintarMetricaEstadisticas(
                "📊",
                "Media por partido",
                formatearDuracionEstadisticas(
                    resumen.duracion_media_min
                )
            )}
        </section>

        ${pintarRecordsPistasEstadisticas(records)}

        <div class="listaPistasEstadisticas">
            ${pistas.map(pista => `
                <article class="pistaEstadisticas">
                    <div class="cabeceraPistaEstadisticas">
                        <span>🏟️</span>
                        <div>
                            <small>PISTA</small>
                            <strong>${escaparHTMLEstadisticas(
                                pista.pista
                            )}</strong>
                        </div>
                        <b>${numeroEstadisticas(pista.partidos)} partidos</b>
                    </div>
                    <div class="gridDatosPistaEstadisticas">
                        ${pintarDatoPistaEstadisticas(
                            "Sets",
                            pista.sets
                        )}
                        ${pintarDatoPistaEstadisticas(
                            "Puntos",
                            pista.puntos
                        )}
                        ${pintarDatoPistaEstadisticas(
                            "Duración total",
                            formatearDuracionEstadisticas(
                                pista.duracion_total_min
                            )
                        )}
                        ${pintarDatoPistaEstadisticas(
                            "Media",
                            formatearDuracionEstadisticas(
                                pista.duracion_media_min
                            )
                        )}
                        ${pintarDatoPistaEstadisticas(
                            "Más largo",
                            formatearDuracionEstadisticas(
                                pista.partido_mas_largo_min
                            )
                        )}
                        ${pintarDatoPistaEstadisticas(
                            "Más corto",
                            formatearDuracionEstadisticas(
                                pista.partido_mas_corto_min
                            )
                        )}
                    </div>
                </article>
            `).join("")}
        </div>
    `;
}

function pintarRecordsPistasEstadisticas(records) {
    const items = [];

    (records.mas_utilizada || []).forEach(pista => {
        items.push([
            "🔥",
            "Más utilizada",
            `Pista ${pista.pista}`,
            `${numeroEstadisticas(pista.partidos)} partidos`
        ]);
    });

    (records.mas_rapida?.pistas || []).forEach(pista => {
        items.push([
            "⚡",
            "Más rápida",
            `Pista ${pista.pista}`,
            formatearDuracionEstadisticas(
                pista.duracion_media_min
            )
        ]);
    });

    (records.mas_lenta?.pistas || []).forEach(pista => {
        items.push([
            "🐢",
            "Más lenta",
            `Pista ${pista.pista}`,
            formatearDuracionEstadisticas(
                pista.duracion_media_min
            )
        ]);
    });

    if (!items.length) return "";

    return `
        <section class="gridRecordsSimplesEstadisticas">
            ${items.map(([icono, titulo, nombre, valor]) => `
                <article>
                    <span>${icono}</span>
                    <small>${escaparHTMLEstadisticas(titulo)}</small>
                    <strong>${escaparHTMLEstadisticas(nombre)}</strong>
                    <b>${escaparHTMLEstadisticas(valor)}</b>
                </article>
            `).join("")}
        </section>
    `;
}

function pintarDatoPistaEstadisticas(titulo, valor) {
    return `
        <div>
            <small>${escaparHTMLEstadisticas(titulo)}</small>
            <strong>${escaparHTMLEstadisticas(
                valor === null || valor === undefined
                    ? "—"
                    : valor
            )}</strong>
        </div>
    `;
}

function pintarParejasEstadisticas(ambito) {
    const parejas = [...(ambito?.parejas || [])]
        .sort((a, b) =>
            numeroEstadisticas(b.pj) -
                numeroEstadisticas(a.pj) ||
            numeroEstadisticas(b.pg) -
                numeroEstadisticas(a.pg) ||
            String(a.pareja || "")
                .localeCompare(
                    String(b.pareja || ""),
                    "es"
                )
        );

    const rivalidades = [
        ...(ambito?.rivalidades_jugadores || [])
    ].sort((a, b) =>
        numeroEstadisticas(b.enfrentamientos) -
            numeroEstadisticas(a.enfrentamientos) ||
        String(a.rivalidad || "")
            .localeCompare(
                String(b.rivalidad || ""),
                "es"
            )
    );

    const enfrentamientos = [
        ...(ambito?.enfrentamientos_equipos || [])
    ].sort((a, b) =>
        numeroEstadisticas(b.enfrentamientos) -
            numeroEstadisticas(a.enfrentamientos) ||
        String(a.enfrentamiento || "")
            .localeCompare(
                String(b.enfrentamiento || ""),
                "es"
            )
    );

    return `
        <section class="cabeceraPanelEstadisticas">
            <div>
                <small>COMPAÑEROS Y RIVALES</small>
                <h1>Parejas y enfrentamientos</h1>
                <p>Rendimiento conjunto, compañeros habituales y rivalidades del campeonato.</p>
            </div>
            <span>🤝</span>
        </section>

        <section class="bloqueEstadisticas">
            <div class="tituloBloqueEstadisticas">
                <div>
                    <small>PAREJAS</small>
                    <h2>Rendimiento conjunto</h2>
                </div>
                <span>👥</span>
            </div>

            <div class="listaParejasEstadisticas">
                ${parejas.length
                    ? parejas.map(pintarParejaEstadisticas).join("")
                    : pintarVacioEstadisticas(
                        "Sin parejas",
                        "No hay parejas registradas."
                    )
                }
            </div>
        </section>

        ${pintarRivalidadesEstadisticas(
            rivalidades,
            enfrentamientos
        )}
    `;
}

function pintarParejaEstadisticas(pareja) {
    return `
        <article>
            <div class="cabeceraParejaEstadisticas">
                <span>🤝</span>
                <div>
                    <strong>${escaparHTMLEstadisticas(
                        pareja.pareja
                    )}</strong>
                    <small>${numeroEstadisticas(pareja.pj)} partidos juntos</small>
                </div>
                <b class="porcentajeParejaEstadisticas">
                    <strong>${formatearPorcentajeEstadisticas(
                        pareja.porcentaje_victorias
                    )}</strong>
                    <small>Victorias</small>
                </b>
            </div>
            <div class="datosParejaEstadisticas">
                <span>✅ ${numeroEstadisticas(pareja.pg)} PG</span>
                <span>❌ ${numeroEstadisticas(pareja.pp)} PP</span>
                <span>📚 ${numeroEstadisticas(pareja.sets_favor)}–${numeroEstadisticas(pareja.sets_contra)} sets</span>
            </div>
        </article>
    `;
}

function pintarRivalidadesEstadisticas(
    rivalidades,
    enfrentamientos
) {
    const maxRivalidad = numeroEstadisticas(
        rivalidades[0]?.enfrentamientos
    );

    const maxEnfrentamiento = numeroEstadisticas(
        enfrentamientos[0]?.enfrentamientos
    );

    const rivalidadesDestacadas = rivalidades
        .filter(item =>
            numeroEstadisticas(item.enfrentamientos) ===
            maxRivalidad
        )
        .slice(0, 12);

    const enfrentamientosDestacados = enfrentamientos
        .filter(item =>
            numeroEstadisticas(item.enfrentamientos) ===
            maxEnfrentamiento
        )
        .slice(0, 12);

    return `
        <section class="bloqueEstadisticas">
            <div class="tituloBloqueEstadisticas">
                <div>
                    <small>RIVALIDADES</small>
                    <h2>Enfrentamientos más repetidos</h2>
                </div>
                <span>⚔️</span>
            </div>

            <div class="columnasRivalidadesEstadisticas">
                <article>
                    <h3>Jugadores rivales</h3>
                    ${rivalidadesDestacadas.length
                        ? rivalidadesDestacadas.map(item => `
                            <div>
                                <strong>${escaparHTMLEstadisticas(
                                    item.rivalidad
                                )}</strong>
                                <span>${numeroEstadisticas(
                                    item.enfrentamientos
                                )} enfrentamientos</span>
                            </div>
                        `).join("")
                        : `<p>Sin datos.</p>`
                    }
                </article>

                <article>
                    <h3>Equipos rivales</h3>
                    ${enfrentamientosDestacados.length
                        ? enfrentamientosDestacados.map(item => `
                            <div>
                                <strong>${escaparHTMLEstadisticas(
                                    item.enfrentamiento
                                )}</strong>
                                <span>${numeroEstadisticas(
                                    item.enfrentamientos
                                )} enfrentamientos</span>
                            </div>
                        `).join("")
                        : `<p>Sin datos.</p>`
                    }
                </article>
            </div>
        </section>
    `;
}

function pintarRecordsEstadisticas(ambito) {
    const records = ambito?.records || {};
    const tarjetas = [];

    if (records.equipos) {
        agregarRecordsEquiposEstadisticas(
            tarjetas,
            records.equipos
        );
    }

    agregarRecordsJugadoresEstadisticas(
        tarjetas,
        records.jugadores || {}
    );

    agregarRecordsParejasEstadisticas(
        tarjetas,
        records.parejas_y_rivalidades || {}
    );

    return `
        <section class="cabeceraPanelEstadisticas">
            <div>
                <small>LO MEJOR DEL HISTÓRICO</small>
                <h1>Récords y curiosidades</h1>
                <p>Las marcas más destacadas de cada edición.</p>
            </div>
            <span>⭐</span>
        </section>

        <div class="gridRecordsGeneralesEstadisticas">
            ${tarjetas.length
                ? tarjetas.join("")
                : pintarVacioEstadisticas(
                    "Récords pendientes",
                    "Todavía no hay suficientes datos para calcular récords."
                )
            }
        </div>

        ${pintarRecordsPartidosEstadisticas(
            records.partidos || {}
        )}
    `;
}

function agregarRecordsEquiposEstadisticas(
    tarjetas,
    records
) {
    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🏆",
        "Equipo con más victorias",
        records.mas_victorias,
        item => item.equipo,
        item => `${numeroEstadisticas(item.pg)} victorias`
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "⚡",
        "Mejor ataque",
        records.mejor_ataque,
        item => item.equipo,
        item => `${formatearDecimalEstadisticas(
            item.media_puntos_favor
        )} puntos por partido`
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🛡️",
        "Mejor defensa",
        records.mejor_defensa,
        item => item.equipo,
        item => `${formatearDecimalEstadisticas(
            item.media_puntos_contra
        )} recibidos por partido`
    );
}

function agregarRecordsJugadoresEstadisticas(
    tarjetas,
    records
) {
    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🎾",
        "Jugador con más partidos",
        records.mas_partidos,
        item => item.jugador,
        item => `${numeroEstadisticas(item.pj)} partidos`
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "✅",
        "Jugador con más victorias",
        records.mas_victorias,
        item => item.jugador,
        item => `${numeroEstadisticas(item.pg)} victorias`
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🔥",
        "Mayor racha de victorias",
        records.mayor_racha_victorias,
        item => item.jugador,
        item => `${numeroEstadisticas(
            item.mejor_racha_victorias
        )} seguidas`
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🏆",
        "Más títulos",
        records.mas_titulos,
        item => item.jugador,
        item => `${numeroEstadisticas(item.titulos)} títulos`
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🥈",
        "Más finales",
        records.mas_finales,
        item => item.jugador,
        item => `${numeroEstadisticas(item.finales)} finales`
    );

    const porcentaje =
        records.mejor_porcentaje_victorias || {};

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "📈",
        "Mejor porcentaje de victorias",
        porcentaje.jugadores,
        item => item.jugador,
        item => `${formatearPorcentajeEstadisticas(
            item.porcentaje_victorias
        )} · ${numeroEstadisticas(item.pj)} PJ`,
        porcentaje.minimo_partidos
            ? `Mínimo ${numeroEstadisticas(
                porcentaje.minimo_partidos
            )} partidos`
            : ""
    );
}

function agregarRecordsParejasEstadisticas(
    tarjetas,
    records
) {
    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🤝",
        "Pareja con más partidos",
        records.mas_partidos_juntos,
        item => item.pareja,
        item => `${numeroEstadisticas(item.pj)} partidos`
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🏅",
        "Pareja con más victorias",
        records.mas_victorias,
        item => item.pareja,
        item => `${numeroEstadisticas(item.pg)} victorias`
    );

    const porcentaje =
        records.mejor_porcentaje_victorias || {};

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "📈",
        "Mejor porcentaje como pareja",
        porcentaje.parejas,
        item => item.pareja,
        item => `${formatearPorcentajeEstadisticas(
            item.porcentaje_victorias
        )} · ${numeroEstadisticas(item.pj)} PJ`,
        porcentaje.minimo_partidos
            ? `Mínimo ${numeroEstadisticas(
                porcentaje.minimo_partidos
            )} partidos`
            : ""
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "⚔️",
        "Rivalidad de jugadores",
        records.rivalidad_jugadores_mas_repetida,
        item => item.rivalidad,
        item => `${numeroEstadisticas(
            item.enfrentamientos
        )} enfrentamientos`
    );

    agregarTarjetaListaRecordEstadisticas(
        tarjetas,
        "🥊",
        "Enfrentamiento de equipos",
        records.enfrentamiento_equipos_mas_repetido,
        item => item.enfrentamiento,
        item => `${numeroEstadisticas(
            item.enfrentamientos
        )} enfrentamientos`
    );
}

function agregarTarjetaListaRecordEstadisticas(
    tarjetas,
    icono,
    titulo,
    lista,
    obtenerNombre,
    obtenerValor,
    nota = ""
) {
    if (!Array.isArray(lista) || !lista.length) {
        return;
    }

    tarjetas.push(`
        <article class="recordGeneralEstadisticas">
            <div class="iconoRecordGeneralEstadisticas">
                ${icono}
            </div>
            <small>${escaparHTMLEstadisticas(titulo)}</small>
            <div class="ganadoresRecordEstadisticas">
                ${lista.slice(0, 8).map(item => `
                    <div>
                        <strong>${escaparHTMLEstadisticas(
                            obtenerNombre(item)
                        )}</strong>
                        <span>${escaparHTMLEstadisticas(
                            obtenerValor(item)
                        )}</span>
                    </div>
                `).join("")}
            </div>
            ${nota
                ? `<p>${escaparHTMLEstadisticas(nota)}</p>`
                : ""
            }
        </article>
    `);
}

function gestionarClickEstadisticas(evento) {
    const botonAmbito = evento.target.closest(
        "[data-ambito-estadisticas]"
    );

    if (botonAmbito) {
        const ambito =
            botonAmbito.dataset.ambitoEstadisticas;

        if (
            ambito === "campeonato" &&
            !obtenerCampeonatosEstadisticas().length
        ) {
            return;
        }

        estadoVistaEstadisticas.ambito = ambito;
        estadoVistaEstadisticas.pestana = "resumen";
        pintarPaginaEstadisticas();
        return;
    }

    const botonPestana = evento.target.closest(
        "[data-pestana-estadisticas]"
    );

    if (botonPestana) {
        estadoVistaEstadisticas.pestana =
            botonPestana.dataset.pestanaEstadisticas;

        pintarPaginaEstadisticas();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function gestionarCambioEstadisticas(evento) {
    if (
        evento.target.id !==
        "selectorCampeonatoEstadisticas"
    ) {
        return;
    }

    estadoVistaEstadisticas.idCampeonato =
        evento.target.value;

    estadoVistaEstadisticas.pestana =
        "resumen";

    pintarPaginaEstadisticas();
}

function actualizarURLPaginaEstadisticas() {
    const url = new URL(window.location.href);

    url.searchParams.set(
        "ambito",
        estadoVistaEstadisticas.ambito
    );

    url.searchParams.set(
        "seccion",
        estadoVistaEstadisticas.pestana
    );

    if (
        estadoVistaEstadisticas.ambito ===
        "campeonato"
    ) {
        url.searchParams.set(
            "campeonato",
            estadoVistaEstadisticas.idCampeonato
        );
    } else {
        url.searchParams.delete("campeonato");
    }

    try {
        window.history.replaceState(
            {},
            document.title,
            url.pathname + url.search + url.hash
        );
    } catch (error) {
        console.warn(
            "No se pudo actualizar la URL de estadísticas.",
            error
        );
    }
}

function pintarErrorEstadisticas() {
    const contenido = document.getElementById(
        "contenidoEstadisticas"
    );

    if (!contenido) return;

    contenido.innerHTML = pintarVacioEstadisticas(
        "No se pudieron cargar las estadísticas",
        "Comprueba que estadisticas.json esté publicado y vuelve a intentarlo."
    );
}

function pintarVacioEstadisticas(titulo, texto) {
    return `
        <section class="vacioEstadisticas">
            <span>📭</span>
            <div>
                <h2>${escaparHTMLEstadisticas(titulo)}</h2>
                <p>${escaparHTMLEstadisticas(texto)}</p>
            </div>
        </section>
    `;
}

function modoMantenimientoEstadisticasActivo() {
    const valor =
        estadoCampeonato?.configuracion
            ?.modo_mantenimiento;

    if (valor === true) return true;

    return ["si", "sí", "true", "1"].includes(
        String(valor || "")
            .trim()
            .toLowerCase()
    );
}

function tieneAccesoMantenimientoEstadisticas() {
    try {
        return localStorage.getItem(
            CLAVE_ACCESO_MANTENIMIENTO_ESTADISTICAS
        ) === "si";
    } catch (error) {
        return false;
    }
}

function pintarMantenimientoEstadisticas() {
    const config =
        estadoCampeonato?.configuracion || {};

    document.body.classList.remove(
        "appCargando"
    );

    document.body.classList.add(
        "modoMantenimiento"
    );

    document.body.innerHTML = `
        <main class="pantallaMantenimiento">
            <section class="tarjetaMantenimiento">
                <div class="iconoMantenimiento">🛠️</div>
                <p class="marcaMantenimiento">
                    ${escaparHTMLEstadisticas(
                        config.nombre_campeonato ||
                        "Sprint Pádel Tui"
                    )}
                </p>
                <h1>${escaparHTMLEstadisticas(
                    config.titulo_mantenimiento ||
                    "Web en mantenimiento"
                )}</h1>
                <p class="mensajeMantenimiento">
                    ${escaparHTMLEstadisticas(
                        config.mensaje_mantenimiento ||
                        "Estamos realizando algunos ajustes."
                    )}
                </p>
                <small class="pieMantenimiento">
                    Gracias por tu paciencia.
                </small>
            </section>
        </main>
    `;
}

function formatearFechaHoraEstadisticas(valor) {
    if (!valor) return "";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
        return String(valor);
    }

    return fecha.toLocaleString(
        "es-ES",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function formatearPorcentajeEstadisticas(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) return "0%";

    const porcentaje = Math.abs(numero) <= 1
        ? numero * 100
        : numero;

    return `${porcentaje.toLocaleString(
        "es-ES",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        }
    )}%`;
}

function formatearDuracionEstadisticas(valor) {
    const minutos = Number(valor);

    if (!Number.isFinite(minutos) || minutos <= 0) {
        return "—";
    }

    const horas = Math.floor(minutos / 60);
    const resto = Math.round(minutos % 60);

    if (!horas) return `${Math.round(minutos)} min`;
    if (!resto) return `${horas} h`;

    return `${horas} h ${resto} min`;
}

function formatearDecimalEstadisticas(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) return "—";

    return numero.toLocaleString(
        "es-ES",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}

function formatearDiferenciaEstadisticas(valor) {
    const numero = numeroEstadisticas(valor);
    return numero > 0 ? `+${numero}` : String(numero);
}

function numeroEstadisticas(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}

function normalizarEstadisticas(valor) {
    return String(valor || "")
        .trim()
        .toLocaleUpperCase("es")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function unirListaEstadisticas(lista) {
    if (!lista.length) return "datos";
    if (lista.length === 1) return lista[0];
    return `${lista.slice(0, -1).join(", ")} y ${lista.at(-1)}`;
}

function escaparHTMLEstadisticas(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escaparAtributoEstadisticas(valor) {
    return escaparHTMLEstadisticas(valor);
}
