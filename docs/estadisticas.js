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

const MAX_ETIQUETAS_VISIBLES_EQUIPO_ESTADISTICAS = 4;

const DEFINICIONES_ETIQUETAS_EQUIPOS_ESTADISTICAS = [
    {
        clave: "mas_victorias",
        icono: "🏆",
        nombre: "Más victorias",
        criterio: "Equipo con mayor número total de partidos ganados en la competición principal. Premia la cantidad absoluta de victorias, aunque otro equipo pudiera tener un porcentaje de éxito parecido."
    },
    {
        clave: "mejor_porcentaje",
        icono: "📊",
        nombre: "Más regular",
        criterio: "Equipo con mayor proporción de victorias sobre partidos jugados. Se calcula como victorias divididas entre partidos disputados y se exige un mínimo de 3 partidos. En caso de empate se priorizan más victorias y después más partidos."
    },
    {
        clave: "invictos",
        icono: "👑",
        nombre: "Invictos",
        criterio: "Equipos que terminaron sin ninguna derrota y disputaron al menos 3 partidos. Puede aparecer en más de un equipo si todos cumplen esa condición."
    },
    {
        clave: "mejor_ataque",
        icono: "⚡",
        nombre: "Mejor ataque",
        criterio: "Mayor media de puntos anotados por set. Se usa la media por set, y no por partido, para comparar de forma justa encuentros de dos y tres sets. Se exigen al menos 3 partidos."
    },
    {
        clave: "mejor_defensa",
        icono: "🛡️",
        nombre: "Mejor defensa",
        criterio: "Menor media de puntos recibidos por set. Aquí gana el valor más bajo. Se calcula por set para que los distintos formatos de partido sean comparables y se exigen al menos 3 partidos."
    },
    {
        clave: "mejor_balance_sets",
        icono: "📈",
        nombre: "Mejor balance de sets",
        criterio: "Mayor diferencia acumulada entre sets ganados y sets perdidos. Por ejemplo, 12 sets a favor y 5 en contra producen un balance de +7."
    },
    {
        clave: "mejor_balance_puntos",
        icono: "➕",
        nombre: "Mejor balance de puntos",
        criterio: "Mayor diferencia acumulada entre puntos anotados y puntos recibidos durante toda la competición principal."
    },
    {
        clave: "mas_contundentes",
        icono: "💥",
        nombre: "Más contundentes",
        criterio: "Mayor porcentaje de sus victorias conseguido sin ceder ningún set. Cuenta igual una victoria 3-0, 2-0 o cualquier formato equivalente. Se exigen al menos 3 victorias; en empate se priorizan más victorias limpias y después mejor diferencia de sets."
    },
    {
        clave: "reyes_decisivo",
        icono: "🧠",
        nombre: "Reyes del decisivo",
        criterio: "Mejor porcentaje de victorias en partidos que llegaron empatados 1-1 después de los dos primeros sets y se resolvieron en el tercero. Se exigen al menos 2 partidos decisivos."
    },
    {
        clave: "remontadores",
        icono: "🔄",
        nombre: "Remontadores",
        criterio: "Mayor número de partidos ganados después de perder el primer set. Se exigen al menos 2 remontadas para que la etiqueta aparezca."
    },
    {
        clave: "mejor_racha",
        icono: "🔥",
        nombre: "Mejor racha",
        criterio: "Mayor número de victorias consecutivas siguiendo el orden deportivo real: fases, jornadas y rondas eliminatorias. Se exige una racha mínima de 2 victorias."
    },
    {
        clave: "mata_gigantes",
        icono: "🐉",
        nombre: "Mata-gigantes",
        criterio: "Premia victorias realmente destacadas frente a rivales del top 3 que terminaron al menos dos posiciones por encima. Se exigen 2 victorias válidas contra, como mínimo, 2 rivales distintos. La posición utilizada es la final guardada en HIST_EQUIPOS."
    },
    {
        clave: "mas_victorias_limpias",
        icono: "🧹",
        nombre: "Más victorias limpias",
        criterio: "Mayor número total de victorias sin perder ningún set. Cuenta una victoria 3-0, 2-0 o cualquier resultado equivalente. A diferencia de Más contundentes, aquí importa la cantidad y no el porcentaje."
    },
    {
        clave: "mejor_arranque",
        icono: "🚀",
        nombre: "Mejor arranque",
        criterio: "Mayor porcentaje de primeros sets ganados sobre partidos disputados. Se exigen al menos 3 partidos y, en caso de empate, se prioriza el mayor número absoluto de primeros sets ganados."
    },
    {
        clave: "mejor_cierre",
        icono: "🔒",
        nombre: "Mejor cierre",
        criterio: "Mayor porcentaje de victorias entre los partidos en los que el equipo ganó el primer set. Mide su capacidad para conservar una ventaja inicial. Se exigen al menos 3 primeros sets ganados."
    },
    {
        clave: "mas_luchadores",
        icono: "⚔️",
        nombre: "Más luchadores",
        criterio: "Mayor porcentaje de partidos en los que ambos equipos consiguieron ganar al menos un set. Refleja encuentros disputados y con reacción de ambos lados. Se exigen al menos 2 partidos de este tipo."
    },
    {
        clave: "mas_dominantes",
        icono: "🎯",
        nombre: "Más dominante",
        criterio: "Equipo que ganó el mayor porcentaje de todos los puntos disputados. Se calcula como puntos anotados dividido entre puntos anotados más puntos recibidos. No mide solo las victorias: también refleja cuánto controló los marcadores. Se exigen al menos 3 partidos."
    },
    {
        clave: "partidos_infarto",
        icono: "😅",
        nombre: "Partidos de infarto",
        criterio: "Mayor número de partidos cuyo margen medio fue de 2 puntos o menos por set. Señala a los equipos que más veces estuvieron en encuentros especialmente igualados. Se exigen al menos 2 partidos así."
    }
];

let ultimoFocoModalEtiquetasEquiposEstadisticas = null;

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

document.addEventListener(
    "keydown",
    gestionarTecladoEstadisticas
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

        configurarNavegacionEstadisticas();
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


/* =========================================================
   NAVEGACIÓN INFERIOR
   Mantiene exactamente la misma navegación que index.html
   según el estado del campeonato.
========================================================= */

function configurarNavegacionEstadisticas() {
    const botones = [
        document.getElementById("navEstadisticas1"),
        document.getElementById("navEstadisticas2"),
        document.getElementById("navEstadisticas3"),
        document.getElementById("navEstadisticas4"),
        document.getElementById("navEstadisticas5")
    ];

    const config =
        estadoCampeonato?.configuracion || {};

    botones.forEach(boton => {
        if (!boton) return;

        boton.classList.remove(
            "oculto",
            "navActivo"
        );

        boton.removeAttribute(
            "aria-current"
        );
    });

    if (esWebPreviaEstadisticas()) {
        configurarBotonNavegacionEstadisticas(
            botones[0],
            "🏠",
            "Inicio",
            "index.html"
        );

        configurarBotonNavegacionEstadisticas(
            botones[1],
            "📖",
            "Historia",
            "historia.html",
            !esSiEstadisticas(
                config.mostrar_historia
            )
        );

        configurarBotonNavegacionEstadisticas(
            botones[2],
            "📜",
            "Normas",
            "normas.html",
            !esSiEstadisticas(
                config.mostrar_normativa
            )
        );

        configurarBotonNavegacionEstadisticas(
            botones[3],
            "🏆",
            "Campeones",
            "campeones.html",
            !esSiEstadisticas(
                config.mostrar_campeones
            )
        );

        configurarBotonNavegacionEstadisticas(
            botones[4],
            "☰",
            "Más",
            "index.html?pantalla=mas",
            false,
            true
        );

        return;
    }

    configurarBotonNavegacionEstadisticas(
        botones[0],
        "🏠",
        "Inicio",
        "index.html"
    );

    configurarBotonNavegacionEstadisticas(
        botones[1],
        "📊",
        esModoGruposEstadisticas()
            ? "Grupos"
            : "Clasificación",
        "index.html?pantalla=competicion"
    );

    configurarBotonNavegacionEstadisticas(
        botones[2],
        "🎾",
        "Partidos",
        "index.html?pantalla=partidos"
    );

    configurarBotonNavegacionEstadisticas(
        botones[3],
        "👥",
        "Equipos",
        "index.html?pantalla=equipos"
    );

    configurarBotonNavegacionEstadisticas(
        botones[4],
        "☰",
        "Más",
        "index.html?pantalla=mas",
        false,
        true
    );
}


function configurarBotonNavegacionEstadisticas(
    boton,
    icono,
    texto,
    href,
    oculto = false,
    activo = false
) {
    if (!boton) return;

    const elementoIcono =
        boton.querySelector("span");

    const elementoTexto =
        boton.querySelector("small");

    if (elementoIcono) {
        elementoIcono.textContent =
            icono;
    }

    if (elementoTexto) {
        elementoTexto.textContent =
            texto;
    }

    boton.href = href;

    boton.classList.toggle(
        "oculto",
        oculto
    );

    boton.classList.toggle(
        "navActivo",
        activo
    );

    if (activo) {
        boton.setAttribute(
            "aria-current",
            "page"
        );
    } else {
        boton.removeAttribute(
            "aria-current"
        );
    }
}


function obtenerEstadoTorneoEstadisticas() {
    const config =
        estadoCampeonato?.configuracion || {};

    const valor =
        config.estado_torneo ||
        config.estado ||
        "En juego";

    return normalizarEstadisticas(valor)
        .replaceAll("_", " ")
        .replace(/\s+/g, " ");
}


function esWebPreviaEstadisticas() {
    const estado =
        obtenerEstadoTorneoEstadisticas();

    return (
        estado === "PRETORNEO" ||
        estado.includes("INSCRIP")
    );
}


function esModoGruposEstadisticas() {
    const config =
        estadoCampeonato?.configuracion || {};

    const modo = normalizarEstadisticas(
        config.modo_torneo ||
        config.formato_inicial ||
        config.sistema_primera_fase ||
        config.sistema_1_fase ||
        ""
    );

    return modo.includes("GRUPO");
}


function esSiEstadisticas(valor) {
    if (valor === true) return true;

    return [
        "SI",
        "SÍ",
        "TRUE",
        "1"
    ].includes(
        normalizarEstadisticas(valor)
    );
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
        titulo.textContent =
            "Estadísticas";
    }

    if (subtitulo) {
        subtitulo.textContent =
            "Resultados, rendimiento y curiosidades";
    }

    if (generado) {
        generado.textContent =
            formatearFechaHoraEstadisticas(
                estadisticas?.generado
            ) || "—";
    }

    document.title =
        "Estadísticas · Sprint Pádel Tui";
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
    : [
        formatearFechaCampeonatoEstadisticas(
            ambito.fecha
        ),
        ambito.tipo,
        ambito.estructura
    ]
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

    const records =
        calcularEtiquetasEquiposEstadisticas(
            campeonato,
            equipos
        );

    return `
        <section class="cabeceraPanelEstadisticas">
            <div>
                <small>RENDIMIENTO</small>
                <h1>Estadísticas de equipos</h1>
                <p>${equipos.length} equipos ordenados por victorias. Palas de Playa no interviene.</p>
            </div>

            <div class="accionesCabeceraPanelEstadisticas">
                <button
                    type="button"
                    class="btnInfoEtiquetasEquiposEstadisticas"
                    id="btnInfoEtiquetasEquiposEstadisticas"
                    aria-label="Consultar cómo se calculan las etiquetas"
                >
                    ℹ️
                </button>
                <span aria-hidden="true">👥</span>
            </div>
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
    const etiquetas =
        obtenerEtiquetasEquipoEstadisticas(
            equipo,
            records
        );

    const visibles = etiquetas.slice(
        0,
        MAX_ETIQUETAS_VISIBLES_EQUIPO_ESTADISTICAS
    );

    const adicionales = etiquetas.slice(
        MAX_ETIQUETAS_VISIBLES_EQUIPO_ESTADISTICAS
    );

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
               <b class="porcentajeParejaEstadisticas">
                <strong>${formatearPorcentajeEstadisticas(
                    equipo.porcentaje_victorias
                )}</strong>
                <small>Victorias</small>
                </b>
            </div>

            ${etiquetas.length
                ? `
                    <div class="etiquetasEquipoEstadisticas">
                        ${visibles.map(etiqueta =>
                            pintarEtiquetaEquipoEstadisticas(
                                etiqueta,
                                false
                            )
                        ).join("")}

                        ${adicionales.map(etiqueta =>
                            pintarEtiquetaEquipoEstadisticas(
                                etiqueta,
                                true
                            )
                        ).join("")}

                        ${adicionales.length
                            ? `
                                <button
                                    type="button"
                                    class="btnMasEtiquetasEquipoEstadisticas"
                                    data-toggle-etiquetas-equipo
                                    data-total-ocultas="${adicionales.length}"
                                    aria-expanded="false"
                                >
                                    +${adicionales.length} más
                                </button>
                            `
                            : ""
                        }
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
                    "pts/set"
                )}
                ${pintarDatoEquipoEstadisticas(
                    "Defensa",
                    formatearDecimalEstadisticas(
                        equipo.media_puntos_contra
                    ),
                    "pts recibidos/set"
                )}
            </div>
        </article>
    `;
}

function pintarEtiquetaEquipoEstadisticas(
    etiqueta,
    esAdicional
) {
    return `
        <span
            ${esAdicional
                ? "data-etiqueta-equipo-adicional hidden"
                : ""
            }
        >
            ${escaparHTMLEstadisticas(
                `${etiqueta.icono} ${etiqueta.nombre}`
            )}
        </span>
    `;
}

function obtenerEtiquetasEquipoEstadisticas(
    equipo,
    records
) {
    return DEFINICIONES_ETIQUETAS_EQUIPOS_ESTADISTICAS
        .filter(definicion =>
            estaEnRecordEquipoEstadisticas(
                equipo,
                records?.[definicion.clave]
            )
        );
}

function calcularEtiquetasEquiposEstadisticas(
    campeonato,
    equiposOrdenados
) {
    const extras = new Map();

    equiposOrdenados.forEach(equipo => {
        extras.set(
            normalizarEstadisticas(equipo.equipo),
            {
                partidos_decisivos: 0,
                victorias_decisivo: 0,
                remontadas: 0,
                primeros_sets_ganados: 0,
                victorias_tras_ganar_primero: 0,
                victorias_limpias: 0,
                racha_actual: 0,
                mejor_racha: 0,
                partidos_repartidos: 0,
                partidos_infarto: 0,
                mata_gigantes: 0,
                brecha_mata_gigantes: 0,
                rivales_mata_gigantes: new Set()
            }
        );
    });

    const posicionesFinales = new Map();

    equiposOrdenados.forEach(equipo => {
        const posicion = numeroEstadisticas(
            equipo.posicion_final
        );

        if (posicion > 0) {
            posicionesFinales.set(
                normalizarEstadisticas(equipo.equipo),
                posicion
            );
        }
    });

    const partidos = (Array.isArray(campeonato?.partidos)
        ? campeonato.partidos
        : [])
        .filter(partido =>
            !esPartidoPalasPlayaEtiquetasEquipoEstadisticas(
                partido
            )
        )
        .sort(compararOrdenDeportivoPartidosEstadisticas);

    partidos.forEach(partido => {
        const clave1 = normalizarEstadisticas(
            partido.equipo1
        );

        const clave2 = normalizarEstadisticas(
            partido.equipo2
        );

        const extra1 = extras.get(clave1);
        const extra2 = extras.get(clave2);

        if (!extra1 || !extra2) return;

        const sets =
            analizarResultadoEtiquetasEquipoEstadisticas(
                partido.resultado
            );

        if (!sets.length) return;

        const sets1 = Number.isFinite(
            Number(partido.sets_equipo1)
        )
            ? numeroEstadisticas(
                partido.sets_equipo1
            )
            : sets.filter(
                set => set.puntos1 > set.puntos2
            ).length;

        const sets2 = Number.isFinite(
            Number(partido.sets_equipo2)
        )
            ? numeroEstadisticas(
                partido.sets_equipo2
            )
            : sets.filter(
                set => set.puntos2 > set.puntos1
            ).length;

        let ganador = normalizarEstadisticas(
            partido.ganador
        );

        if (
            ganador !== clave1 &&
            ganador !== clave2
        ) {
            ganador = sets1 > sets2
                ? clave1
                : clave2;
        }

        const perdedor = ganador === clave1
            ? clave2
            : clave1;

        const primerSet = sets[0];

        if (primerSet) {
            const ganadorPrimerSet =
                primerSet.puntos1 > primerSet.puntos2
                    ? clave1
                    : clave2;

            extras
                .get(ganadorPrimerSet)
                .primeros_sets_ganados += 1;

            if (ganador === ganadorPrimerSet) {
                extras
                    .get(ganador)
                    .victorias_tras_ganar_primero += 1;
            } else {
                extras
                    .get(ganador)
                    .remontadas += 1;
            }
        }

        const dosPrimeros = sets.slice(0, 2);
        const esDecisivo =
            dosPrimeros.length === 2 &&
            dosPrimeros.filter(
                set => set.puntos1 > set.puntos2
            ).length === 1 &&
            dosPrimeros.filter(
                set => set.puntos2 > set.puntos1
            ).length === 1;

        if (esDecisivo) {
            extra1.partidos_decisivos += 1;
            extra2.partidos_decisivos += 1;

            extras
                .get(ganador)
                .victorias_decisivo += 1;
        }

        if (
            Math.min(sets1, sets2) === 0
        ) {
            extras
                .get(ganador)
                .victorias_limpias += 1;
        }

        if (sets1 > 0 && sets2 > 0) {
            extra1.partidos_repartidos += 1;
            extra2.partidos_repartidos += 1;
        }

        const margenMedio = sets.reduce(
            (total, set) =>
                total + Math.abs(
                    set.puntos1 - set.puntos2
                ),
            0
        ) / sets.length;

        if (margenMedio <= 2) {
            extra1.partidos_infarto += 1;
            extra2.partidos_infarto += 1;
        }

        [clave1, clave2].forEach(clave => {
            const extra = extras.get(clave);

            if (clave === ganador) {
                extra.racha_actual += 1;
                extra.mejor_racha = Math.max(
                    extra.mejor_racha,
                    extra.racha_actual
                );
            } else {
                extra.racha_actual = 0;
            }
        });

        const posicionGanador =
            posicionesFinales.get(ganador);

        const posicionPerdedor =
            posicionesFinales.get(perdedor);

        const diferenciaPosiciones =
            posicionGanador - posicionPerdedor;

        if (
            Number.isFinite(posicionGanador) &&
            Number.isFinite(posicionPerdedor) &&
            posicionPerdedor <= 3 &&
            diferenciaPosiciones >= 2
        ) {
            const extraGanador = extras.get(ganador);

            extraGanador.mata_gigantes += 1;
            extraGanador.brecha_mata_gigantes +=
                diferenciaPosiciones;
            extraGanador.rivales_mata_gigantes.add(
                perdedor
            );
        }
    });

    const extraEquipo = equipo =>
        extras.get(
            normalizarEstadisticas(equipo.equipo)
        ) || {};

    const minimoPartidos = 3;

    return {
        mas_victorias: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo =>
                        numeroEstadisticas(equipo.pg),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(equipo.pg) > 0
        ),

        mejor_porcentaje: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        equipo.pg,
                        equipo.pj
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(equipo.pg),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(equipo.pj),
                    maximo: true
                }
            ],
            equipo =>
                numeroEstadisticas(equipo.pj) >= minimoPartidos &&
                numeroEstadisticas(equipo.pg) > 0
        ),

        invictos: equiposOrdenados.filter(equipo =>
            numeroEstadisticas(equipo.pj) >= minimoPartidos &&
            numeroEstadisticas(equipo.pp) === 0
        ),

        mejor_ataque: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        equipo.puntos_favor,
                        equipo.sets_jugados
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(equipo.pj) >= minimoPartidos
        ),

        mejor_defensa: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        equipo.puntos_contra,
                        equipo.sets_jugados
                    ),
                    maximo: false
                }
            ],
            equipo => numeroEstadisticas(equipo.pj) >= minimoPartidos
        ),

        mejor_balance_sets: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => numeroEstadisticas(
                        equipo.diferencia_sets
                    ),
                    maximo: true
                }
            ]
        ),

        mejor_balance_puntos: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => numeroEstadisticas(
                        equipo.diferencia_puntos
                    ),
                    maximo: true
                }
            ]
        ),

        mas_contundentes: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        extraEquipo(equipo).victorias_limpias,
                        equipo.pg
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).victorias_limpias
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(
                        equipo.diferencia_sets
                    ),
                    maximo: true
                }
            ],
            equipo =>
                numeroEstadisticas(equipo.pg) >= 3 &&
                numeroEstadisticas(
                    extraEquipo(equipo).victorias_limpias
                ) > 0
        ),

        reyes_decisivo: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        extraEquipo(equipo).victorias_decisivo,
                        extraEquipo(equipo).partidos_decisivos
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).victorias_decisivo
                    ),
                    maximo: true
                }
            ],
            equipo =>
                numeroEstadisticas(
                    extraEquipo(equipo).partidos_decisivos
                ) >= 2
        ),

        remontadores: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).remontadas
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(
                extraEquipo(equipo).remontadas
            ) >= 2
        ),

        mejor_racha: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).mejor_racha
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(
                extraEquipo(equipo).mejor_racha
            ) >= 2
        ),

        mata_gigantes: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).mata_gigantes
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).brecha_mata_gigantes
                    ),
                    maximo: true
                }
            ],
            equipo =>
                numeroEstadisticas(
                    extraEquipo(equipo).mata_gigantes
                ) >= 2 &&
                (
                    extraEquipo(equipo)
                        .rivales_mata_gigantes?.size || 0
                ) >= 2
        ),

        mas_victorias_limpias: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).victorias_limpias
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(
                extraEquipo(equipo).victorias_limpias
            ) > 0
        ),

        mejor_arranque: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        extraEquipo(equipo).primeros_sets_ganados,
                        equipo.pj
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).primeros_sets_ganados
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(equipo.pj) >= minimoPartidos
        ),

        mejor_cierre: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        extraEquipo(equipo)
                            .victorias_tras_ganar_primero,
                        extraEquipo(equipo)
                            .primeros_sets_ganados
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo)
                            .victorias_tras_ganar_primero
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(
                extraEquipo(equipo).primeros_sets_ganados
            ) >= 3
        ),

        mas_luchadores: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        extraEquipo(equipo).partidos_repartidos,
                        equipo.pj
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).partidos_repartidos
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(
                extraEquipo(equipo).partidos_repartidos
            ) >= 2
        ),

        mas_dominantes: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => cocienteEtiquetasEquipoEstadisticas(
                        equipo.puntos_favor,
                        numeroEstadisticas(equipo.puntos_favor) +
                            numeroEstadisticas(equipo.puntos_contra)
                    ),
                    maximo: true
                },
                {
                    valor: equipo => numeroEstadisticas(
                        equipo.diferencia_puntos
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(equipo.pj) >= minimoPartidos
        ),

        partidos_infarto: seleccionarEquiposPorCriteriosEstadisticas(
            equiposOrdenados,
            [
                {
                    valor: equipo => numeroEstadisticas(
                        extraEquipo(equipo).partidos_infarto
                    ),
                    maximo: true
                }
            ],
            equipo => numeroEstadisticas(
                extraEquipo(equipo).partidos_infarto
            ) >= 2
        )
    };
}

function seleccionarEquiposPorCriteriosEstadisticas(
    equipos,
    criterios,
    esElegible = () => true
) {
    const candidatos = equipos.filter(esElegible);

    if (!candidatos.length) {
        return [];
    }

    let restantes = [...candidatos];

    for (const criterio of criterios) {
        const evaluados = restantes
            .map(equipo => ({
                equipo,
                valor: Number(
                    criterio.valor(equipo)
                )
            }))
            .filter(item =>
                Number.isFinite(item.valor)
            );

        if (!evaluados.length) {
            return [];
        }

        const extremo = evaluados.reduce(
            (acumulado, item) =>
                criterio.maximo === false
                    ? Math.min(acumulado, item.valor)
                    : Math.max(acumulado, item.valor),
            criterio.maximo === false
                ? Infinity
                : -Infinity
        );

        restantes = evaluados
            .filter(item =>
                Math.abs(item.valor - extremo) <
                    0.0000001
            )
            .map(item => item.equipo);

        if (restantes.length <= 1) {
            break;
        }
    }

    return restantes;
}

function esPartidoPalasPlayaEtiquetasEquipoEstadisticas(
    partido
) {
    const fase = normalizarEstadisticas(
        partido?.fase
    )
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return fase.includes("PALAS") &&
        fase.includes("PLAYA");
}

function compararOrdenDeportivoPartidosEstadisticas(
    partido1,
    partido2
) {
    const orden1 = obtenerOrdenDeportivoPartidoEstadisticas(
        partido1
    );

    const orden2 = obtenerOrdenDeportivoPartidoEstadisticas(
        partido2
    );

    for (let i = 0; i < orden1.length; i += 1) {
        if (orden1[i] !== orden2[i]) {
            return orden1[i] - orden2[i];
        }
    }

    return String(partido1?.id_partido || "")
        .localeCompare(
            String(partido2?.id_partido || ""),
            "es",
            { numeric: true }
        );
}

function obtenerOrdenDeportivoPartidoEstadisticas(
    partido
) {
    const fase = normalizarEstadisticas(
        partido?.fase
    )
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const ronda = normalizarEstadisticas(
        partido?.grupo_ronda
    )
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    let bloqueFase = 90;
    let bloqueRonda = 0;

    if (fase.includes("LIGUILLA")) {
        bloqueFase = 10;
    } else if (
        fase === "GRUPOS" ||
        fase.includes("PRIMERA FASE")
    ) {
        bloqueFase = 20;
    } else if (fase.includes("REGRUPO")) {
        bloqueFase = 30;
    } else if (
        fase.includes("CRUCE") ||
        fase.includes("MATA") ||
        ronda.includes("OCTAV") ||
        ronda.includes("CUART") ||
        ronda.includes("SEMI") ||
        ronda.includes("FINAL")
    ) {
        bloqueFase = 40;

        if (ronda.includes("OCTAV")) {
            bloqueRonda = 10;
        } else if (ronda.includes("CUART")) {
            bloqueRonda = 20;
        } else if (ronda.includes("SEMI")) {
            bloqueRonda = 30;
        } else if (ronda.includes("FINAL")) {
            bloqueRonda = 40;
        }
    }

    return [
        bloqueFase,
        bloqueRonda,
        numeroEstadisticas(partido?.jornada),
        numeroEstadisticas(partido?.orden)
    ];
}

function cocienteEtiquetasEquipoEstadisticas(
    numerador,
    denominador
) {
    const numeroNumerador =
        numeroEstadisticas(numerador);

    const numeroDenominador =
        numeroEstadisticas(denominador);

    if (numeroDenominador <= 0) {
        return NaN;
    }

    return numeroNumerador /
        numeroDenominador;
}

function analizarResultadoEtiquetasEquipoEstadisticas(
    resultado
) {
    return String(resultado || "")
        .split("/")
        .map(bloque => {
            const coincidencia = bloque
                .trim()
                .match(
                    /^(\d+)\s*-\s*(\d+)$/
                );

            if (!coincidencia) {
                return null;
            }

            return {
                puntos1: Number(coincidencia[1]),
                puntos2: Number(coincidencia[2])
            };
        })
        .filter(Boolean);
}

function mostrarInfoEtiquetasEquiposEstadisticas() {
    if (
        document.getElementById(
            "overlayEtiquetasEquiposEstadisticas"
        )
    ) {
        return;
    }

    ultimoFocoModalEtiquetasEquiposEstadisticas =
        document.activeElement;

    const criteriosJSON =
        estadisticas?.criterios
            ?.etiquetas_equipos || {};

    document.body.insertAdjacentHTML(
        "beforeend",
        `
            <div
                class="overlayEtiquetasEquiposEstadisticas"
                id="overlayEtiquetasEquiposEstadisticas"
                role="presentation"
            >
                <section
                    class="modalEtiquetasEquiposEstadisticas"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="tituloModalEtiquetasEquiposEstadisticas"
                >
                    <div class="cabeceraModalEtiquetasEquiposEstadisticas">
                        <div>
                            <small>CRITERIOS</small>
                            <h2 id="tituloModalEtiquetasEquiposEstadisticas">
                                Etiquetas de los equipos
                            </h2>
                            <p>
                                Se aplican los desempates indicados en cada criterio. Si el empate continúa, la etiqueta se comparte.
                            </p>
                        </div>

                        <button
                            type="button"
                            id="cerrarModalEtiquetasEquiposEstadisticas"
                            aria-label="Cerrar información"
                        >
                            ×
                        </button>
                    </div>

                    <div class="listaCriteriosEtiquetasEquiposEstadisticas">
                        ${DEFINICIONES_ETIQUETAS_EQUIPOS_ESTADISTICAS
                            .map(definicion => `
                                <article>
                                    <span aria-hidden="true">
                                        ${definicion.icono}
                                    </span>
                                    <div>
                                        <strong>
                                            ${escaparHTMLEstadisticas(
                                                definicion.nombre
                                            )}
                                        </strong>
                                        <p>
                                            ${escaparHTMLEstadisticas(
                                                criteriosJSON[
                                                    definicion.clave
                                                ] ||
                                                definicion.criterio
                                            )}
                                        </p>
                                    </div>
                                </article>
                            `)
                            .join("")}
                    </div>

                    <p class="notaModalEtiquetasEquiposEstadisticas">
                        Las etiquetas y los datos de equipo excluyen Palas de Playa. Ataque y defensa se calculan por set para comparar formatos de partido distintos.
                    </p>
                </section>
            </div>
        `
    );

    document.body.classList.add(
        "modalEtiquetasEquiposEstadisticasAbierto"
    );

    document
        .getElementById(
            "cerrarModalEtiquetasEquiposEstadisticas"
        )
        ?.focus();
}

function cerrarInfoEtiquetasEquiposEstadisticas() {
    const overlay = document.getElementById(
        "overlayEtiquetasEquiposEstadisticas"
    );

    if (!overlay) return;

    overlay.remove();

    document.body.classList.remove(
        "modalEtiquetasEquiposEstadisticasAbierto"
    );

    if (
        ultimoFocoModalEtiquetasEquiposEstadisticas &&
        typeof ultimoFocoModalEtiquetasEquiposEstadisticas
            .focus === "function"
    ) {
        ultimoFocoModalEtiquetasEquiposEstadisticas
            .focus();
    }

    ultimoFocoModalEtiquetasEquiposEstadisticas =
        null;
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

function alternarEtiquetasEquipoEstadisticas(
    boton
) {
    const contenedor = boton.closest(
        ".etiquetasEquipoEstadisticas"
    );

    if (!contenedor) return;

    const adicionales = [
        ...contenedor.querySelectorAll(
            "[data-etiqueta-equipo-adicional]"
        )
    ];

    const estabaExpandido =
        boton.getAttribute("aria-expanded") ===
        "true";

    adicionales.forEach(etiqueta => {
        etiqueta.hidden = estabaExpandido;
    });

    boton.setAttribute(
        "aria-expanded",
        String(!estabaExpandido)
    );

    boton.textContent = estabaExpandido
        ? `+${numeroEstadisticas(
            boton.dataset.totalOcultas
        )} más`
        : "Ver menos";
}

function gestionarTecladoEstadisticas(evento) {
    if (
        evento.key === "Escape" &&
        document.getElementById(
            "overlayEtiquetasEquiposEstadisticas"
        )
    ) {
        cerrarInfoEtiquetasEquiposEstadisticas();
    }
}

function gestionarClickEstadisticas(evento) {
    const botonMasEtiquetas = evento.target.closest(
        "[data-toggle-etiquetas-equipo]"
    );

    if (botonMasEtiquetas) {
        alternarEtiquetasEquipoEstadisticas(
            botonMasEtiquetas
        );
        return;
    }

    const botonInfoEtiquetas = evento.target.closest(
        "#btnInfoEtiquetasEquiposEstadisticas"
    );

    if (botonInfoEtiquetas) {
        mostrarInfoEtiquetasEquiposEstadisticas();
        return;
    }

    const cerrarModalEtiquetas = evento.target.closest(
        "#cerrarModalEtiquetasEquiposEstadisticas"
    );

    const overlayEtiquetas =
        evento.target.id ===
        "overlayEtiquetasEquiposEstadisticas";

    if (
        cerrarModalEtiquetas ||
        overlayEtiquetas
    ) {
        cerrarInfoEtiquetasEquiposEstadisticas();
        return;
    }

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

function formatearFechaCampeonatoEstadisticas(valor) {
    const texto =
        String(valor || "").trim();

    const partes =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

    if (!partes) {
        return texto;
    }

    const anio = partes[1];
    const mes = partes[2];
    const dia = partes[3];

    return `${dia}/${mes}/${anio}`;
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
