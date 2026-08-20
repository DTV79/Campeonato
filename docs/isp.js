/* =========================================================
   ISP WEB — ÍNDICE SPRINT PÁDEL
   Complemento de app.js
========================================================= */

(() => {
    "use strict";

    const JSON_ISP_URL =
        "https://dtv79.github.io/Campeonato/isp.json";

    let datosISP = null;
    let promesaISP = null;

    const pintarPantallaRankingOriginal =
        typeof window.pintarPantallaRanking === "function"
            ? window.pintarPantallaRanking
            : null;

    if (!pintarPantallaRankingOriginal) {
        console.error(
            "ISP: no se encontró pintarPantallaRanking()."
        );
        return;
    }

    /* =====================================================
       ENVOLVER LA PANTALLA DE RANKING EXISTENTE
    ===================================================== */

    async function pintarPantallaRankingConISP() {
        await pintarPantallaRankingOriginal();

        const contenido = obtenerContenidoISP();
        if (!contenido) return;

        insertarSelectorRankingISP(
            contenido,
            "historico"
        );
    }

    window.pintarPantallaRanking =
        pintarPantallaRankingConISP;

    /* =====================================================
       EVENTOS
    ===================================================== */

    document.addEventListener(
        "click",
        gestionarClickISP
    );

    async function gestionarClickISP(evento) {
        const selector =
            evento.target.closest(
                "[data-ranking-modo]"
            );

        if (selector) {
            evento.preventDefault();

            const modo =
                selector.dataset.rankingModo;

            if (modo === "isp") {
                await pintarPantallaISP();
            } else {
                await pintarPantallaRankingConISP();
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }

        const jugador =
            evento.target.closest(
                "[data-isp-jugador]"
            );

        if (jugador) {
            evento.preventDefault();

            await pintarDetalleJugadorISP(
                jugador.dataset.ispJugador
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }

        const volver =
            evento.target.closest(
                "#btnVolverISP"
            );

        if (volver) {
            evento.preventDefault();

            await pintarPantallaISP();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }

        const info =
            evento.target.closest(
                "#btnInfoISP"
            );

        if (info) {
            evento.preventDefault();
            await mostrarInfoISP();
            return;
        }

        const cerrar =
            evento.target.closest(
                "#cerrarInfoISP"
            );

        if (
            cerrar ||
            evento.target.id ===
                "overlayInfoISP"
        ) {
            cerrarInfoISP();
        }
    }

    /* =====================================================
       CARGA DE DATOS
    ===================================================== */

    async function cargarDatosISP() {
        if (datosISP) return datosISP;

        if (!promesaISP) {
            promesaISP = fetch(
                `${JSON_ISP_URL}?v=${Date.now()}`,
                {
                    cache: "no-store"
                }
            )
                .then(respuesta => {
                    if (!respuesta.ok) {
                        throw new Error(
                            `No se pudo cargar ISP (${respuesta.status})`
                        );
                    }

                    return respuesta.json();
                })
                .then(origen => {
                    datosISP = origen;
                    return origen;
                })
                .catch(error => {
                    promesaISP = null;
                    throw error;
                });
        }

        return promesaISP;
    }

    /* =====================================================
       PANTALLA GENERAL ISP
    ===================================================== */

    async function pintarPantallaISP() {
        const contenido =
            obtenerContenidoISP();

        if (!contenido) return;

        contenido.innerHTML = `
            ${pintarSelectorRankingISP("isp")}

            <section class="tarjetaVacia cargandoRanking">
                <h3>⚡ Cargando ISP</h3>
                <p>
                    Estamos calculando el nivel competitivo
                    de los jugadores.
                </p>
            </section>
        `;

        try {
            const origen =
                await cargarDatosISP();

            contenido.innerHTML =
                construirPantallaISP(origen);

        } catch (error) {
            console.error(error);

            contenido.innerHTML = `
                ${pintarSelectorRankingISP("isp")}

                <h2>⚡ Índice Sprint Pádel</h2>

                ${pintarVacioISP(
                    "No se pudo cargar el ISP",
                    "Comprueba que isp.json esté publicado y vuelve a intentarlo."
                )}
            `;
        }
    }

    function construirPantallaISP(origen) {
        const ranking =
            prepararRankingConEmpatesISP(
                origen?.ranking || []
            );

        const resumen =
            origen?.resumen || {};

        if (!ranking.length) {
            return `
                ${pintarSelectorRankingISP("isp")}

                <h2>⚡ Índice Sprint Pádel</h2>

                ${pintarVacioISP(
                    "ISP pendiente",
                    "Todavía no hay partidos históricos suficientes para calcularlo."
                )}
            `;
        }

        const top3 =
            ranking.filter(
                jugador =>
                    numeroISP(
                        jugador._posicionCompartida
                    ) <= 3
            );

        const lideres =
            ranking.filter(
                jugador =>
                    numeroISP(
                        jugador._posicionCompartida
                    ) === 1
            );

        return `
            ${pintarSelectorRankingISP("isp")}

            <div class="cabeceraTituloRanking cabeceraTituloISP">
                <div>
                    <small>NIVEL COMPETITIVO</small>
                    <h2>⚡ Índice Sprint Pádel</h2>
                </div>

                <button
                    class="btnInfoOrden btnInfoISP"
                    id="btnInfoISP"
                    type="button"
                    aria-label="Información sobre el Índice Sprint Pádel"
                    title="Cómo se calcula el ISP"
                >ℹ️</button>
            </div>

            <section class="resumenISP">
                <div>
                    <span>Líder</span>
                    <strong>
                        ${escaparISP(
                            lideres.length
                                ? lideres
                                    .map(
                                        jugador =>
                                            jugador.jugador
                                    )
                                    .join(" / ")
                                : (
                                    resumen.lider ||
                                    ranking[0]?.jugador ||
                                    "—"
                                )
                        )}
                    </strong>
                    <small>
                        ${formatearISP(
                            resumen.isp_lider ??
                            ranking[0]?.isp
                        )} ISP
                    </small>
                </div>

                <div>
                    <span>Jugadores</span>
                    <strong>
                        ${numeroISP(
                            resumen.numero_jugadores
                        ) || ranking.length}
                    </strong>
                    <small>clasificados</small>
                </div>

                <div>
                    <span>Partidos</span>
                    <strong>
                        ${numeroISP(
                            resumen.numero_partidos
                        )}
                    </strong>
                    <small>computados</small>
                </div>
            </section>

            <section class="bloqueRanking bloqueISP">
                <div class="cabeceraBloqueISP">
                    <div>
                        <h3>⚡ Podio ISP</h3>
                        <p>
                            Nivel competitivo actual según
                            resultados y dificultad de los rivales.
                        </p>
                    </div>
                </div>

                <div class="podioISP">
                    ${top3.map(
                        pintarPodioJugadorISP
                    ).join("")}
                </div>
            </section>

            <section class="bloqueRanking bloqueISP">
                <div class="cabeceraBloqueRanking">
                    <div>
                        <h3>Clasificación ISP</h3>
                        <p>
                            Pulsa un jugador para ver su evolución
                            partido a partido.
                        </p>
                    </div>
                </div>

                <div class="listaISP">
                    ${ranking.map(
                        pintarFilaJugadorISP
                    ).join("")}
                </div>
            </section>

            ${pintarRecordsISP(
                origen?.historial || [],
                ranking
            )}
        `;
    }

    function pintarPodioJugadorISP(jugador) {
        const posicion =
            numeroISP(
                jugador._posicionCompartida ??
                jugador.posicion
            );
         const variacion =
             numeroDecimalISP(
                 jugador.variacion_ultimo_partido
             );

         const claseVariacion =
             variacion > 0
                 ? "ispSube"
              : variacion < 0
               ? "ispBaja"
               : "ispIgual";
       

        const medalla =
            posicion === 1
                ? "🥇"
                : posicion === 2
                    ? "🥈"
                    : "🥉";

        return `
            <button
                class="podioJugadorISP"
                data-isp-jugador="${escaparAtributoISP(
                    jugador.id_jugador
                )}"
                type="button"
            >
                <span class="medallaISP">
                    ${medalla}
                </span>

                <strong>
                    ${escaparISP(
                        jugador.jugador
                    )}
                </strong>

                <b>
                    ${formatearISP(
                        jugador.isp
                    )}
                </b>

                <small class="${claseVariacion}">
                ${pintarVariacionTextoISP(
                 variacion
                   )}
               </small>
            </button>
        `;
    }

    function pintarFilaJugadorISP(jugador) {
        const variacion =
            numeroDecimalISP(
                jugador.variacion_ultimo_partido
            );

        const claseVariacion =
            variacion > 0
                ? "ispSube"
                : variacion < 0
                    ? "ispBaja"
                    : "ispIgual";

        const estado =
            String(
                jugador.estado || ""
            ).trim();

        return `
            <button
                class="filaJugadorISP"
                data-isp-jugador="${escaparAtributoISP(
                    jugador.id_jugador
                )}"
                type="button"
            >
                <span class="puestoISP">
                    ${numeroISP(
                        jugador._posicionCompartida ??
                        jugador.posicion
                    )}
                </span>

                <span class="datosJugadorISP">
                    <strong>
                        ${escaparISP(
                            jugador.jugador
                        )}
                    </strong>

                    <small>
                        ${numeroISP(jugador.pj)} PJ ·
                        ${numeroISP(jugador.pg)} PG
                        ${estado
                            ? ` · ${escaparISP(estado)}`
                            : ""}
                    </small>
                </span>

                <span class="valorJugadorISP">
                    <strong>
                        ${formatearISP(
                            jugador.isp
                        )}
                    </strong>

                    <small class="${claseVariacion}">
                        ${pintarVariacionTextoISP(
                            variacion
                        )}
                    </small>
                </span>
            </button>
        `;
    }

    /* =====================================================
       FICHA INDIVIDUAL
    ===================================================== */

    async function pintarDetalleJugadorISP(
        idJugador
    ) {
        const contenido =
            obtenerContenidoISP();

        if (!contenido) return;

        const origen =
            await cargarDatosISP();

        const ranking =
            prepararRankingConEmpatesISP(
                origen?.ranking || []
            );

        const jugador =
            ranking.find(
                fila =>
                    String(
                        fila.id_jugador
                    ) ===
                    String(idJugador)
            );

        if (!jugador) return;

        const historial =
            (origen?.historial || [])
                .filter(
                    fila =>
                        String(
                            fila.id_jugador
                        ) ===
                        String(idJugador)
                )
                .sort(
                    (a, b) =>
                        numeroISP(
                            a.numero_partido_jugador
                        ) -
                        numeroISP(
                            b.numero_partido_jugador
                        )
                );

        const subida =
            historial.length
                ? [...historial].sort(
                    (a, b) =>
                        numeroDecimalISP(
                            b.variacion
                        ) -
                        numeroDecimalISP(
                            a.variacion
                        )
                )[0]
                : null;

        const caida =
            historial.length
                ? [...historial].sort(
                    (a, b) =>
                        numeroDecimalISP(
                            a.variacion
                        ) -
                        numeroDecimalISP(
                            b.variacion
                        )
                )[0]
                : null;

        contenido.innerHTML = `
            <button
                class="btnVolverRanking btnVolverISP"
                id="btnVolverISP"
                type="button"
            >
                ← Volver al ISP
            </button>

            ${pintarSelectorRankingISP(
                "isp"
            )}

            <section class="cabeceraJugadorISP">
                <span class="puestoJugadorISP">
                    ${numeroISP(
                        jugador._posicionCompartida ??
                        jugador.posicion
                    )}º
                </span>

                <div>
                    <small>
                        ÍNDICE SPRINT PÁDEL
                    </small>

                    <h2>
                        ${escaparISP(
                            jugador.jugador
                        )}
                    </h2>

                    <p>
                        <strong>
                            ${formatearISP(
                                jugador.isp
                            )} ISP
                        </strong>
                        ·
                        ${pintarVariacionTextoISP(
                            jugador.variacion_ultimo_partido
                        )}
                        último partido
                    </p>
                </div>
            </section>

            <section class="metricasJugadorISP">
                ${pintarMetricaISP(
                    "⚡",
                    "ISP actual",
                    formatearISP(
                        jugador.isp
                    )
                )}

                ${pintarMetricaISP(
                    "🚀",
                    "Máximo",
                    formatearISP(
                        jugador.maximo_historico
                    )
                )}

                ${pintarMetricaISP(
                    "📉",
                    "Mínimo",
                    formatearISP(
                        jugador.minimo_historico
                    )
                )}

                ${pintarMetricaISP(
                    "🎾",
                    "Partidos",
                    numeroISP(
                        jugador.pj
                    )
                )}

                ${pintarMetricaISP(
                    "✅",
                    "Ganados",
                    numeroISP(
                        jugador.pg
                    )
                )}

                ${pintarMetricaISP(
                    "📈",
                    "% victorias",
                    formatearPorcentajeISP(
                        jugador.porcentaje_victorias
                    )
                )}
            </section>

            <section class="bloqueRanking bloqueISP">
                <div class="cabeceraBloqueISP">
                    <div>
                        <h3>📈 Evolución ISP</h3>
                        <p>
                            Movimiento partido a partido desde
                            los 1.000 puntos iniciales.
                        </p>
                    </div>
                </div>

                ${pintarGraficaISP(
                    historial
                )}
            </section>

            ${
                subida || caida
                    ? `
                    <section class="bloqueRanking bloqueISP">
                        <h3>🎯 Movimientos destacados</h3>

                        <div class="recordsMovimientoISP">
                            ${pintarMovimientoDestacadoISP(
                                "🚀",
                                "Mayor subida",
                                subida
                            )}

                            ${pintarMovimientoDestacadoISP(
                                "📉",
                                "Mayor caída",
                                caida
                            )}
                        </div>
                    </section>
                `
                    : ""
            }

            <section class="bloqueRanking bloqueISP">
                <div class="cabeceraBloqueISP">
                    <div>
                        <h3>🎾 Historial de movimientos</h3>
                        <p>
                            Cómo ganó o perdió ISP en cada partido.
                        </p>
                    </div>
                </div>

                <div class="historialMovimientosISP">
                    ${historial.length
                        ? [...historial]
                            .reverse()
                            .map(
                                pintarMovimientoISP
                            )
                            .join("")
                        : pintarVacioISP(
                            "Sin movimientos",
                            "Todavía no hay partidos computados."
                        )}
                </div>
            </section>
        `;
    }

    function pintarMetricaISP(
        icono,
        titulo,
        valor
    ) {
        return `
            <article class="metricaJugadorISP">
                <span>${icono}</span>
                <small>
                    ${escaparISP(titulo)}
                </small>
                <strong>
                    ${escaparISP(
                        String(valor)
                    )}
                </strong>
            </article>
        `;
    }

    /* =====================================================
       GRÁFICA SVG SIN LIBRERÍAS
    ===================================================== */

    function pintarGraficaISP(historial) {
        if (!historial.length) {
            return pintarVacioISP(
                "Sin evolución",
                "Todavía no hay partidos suficientes."
            );
        }

        const puntos = [
            {
                n: 0,
                valor:
                    numeroDecimalISP(
                        historial[0]
                            .isp_antes
                    ) || 1000
            },
            ...historial.map(
                fila => ({
                    n:
                        numeroISP(
                            fila.numero_partido_jugador
                        ),
                    valor:
                        numeroDecimalISP(
                            fila.isp_despues
                        )
                })
            )
        ];

        const valores =
            puntos.map(
                punto => punto.valor
            );

        let minimo =
            Math.min(...valores);

        let maximo =
            Math.max(...valores);

        if (minimo === maximo) {
            minimo -= 20;
            maximo += 20;
        }

        const margen =
            Math.max(
                12,
                (maximo - minimo) *
                    0.12
            );

        minimo -= margen;
        maximo += margen;

        const ancho = 620;
        const alto = 230;
        const izquierda = 42;
        const derecha = 18;
        const arriba = 18;
        const abajo = 38;

        const areaAncho =
            ancho -
            izquierda -
            derecha;

        const areaAlto =
            alto -
            arriba -
            abajo;

        const maxN =
            Math.max(
                ...puntos.map(
                    punto => punto.n
                ),
                1
            );

        const x = n =>
            izquierda +
            (n / maxN) *
                areaAncho;

        const y = valor =>
            arriba +
            (1 -
                (valor - minimo) /
                    (maximo - minimo)) *
                areaAlto;

        const polyline =
            puntos
                .map(
                    punto =>
                        `${x(
                            punto.n
                        ).toFixed(1)},${y(
                            punto.valor
                        ).toFixed(1)}`
                )
                .join(" ");

        const niveles = [0, 0.5, 1];

        return `
            <div class="graficaISP">
                <svg
                    viewBox="0 0 ${ancho} ${alto}"
                    role="img"
                    aria-label="Evolución del Índice Sprint Pádel"
                >
                    ${niveles.map(
                        fraccion => {
                            const valor =
                                maximo -
                                (maximo - minimo) *
                                    fraccion;

                            const yy =
                                y(valor);

                            return `
                                <line
                                    x1="${izquierda}"
                                    y1="${yy}"
                                    x2="${ancho - derecha}"
                                    y2="${yy}"
                                    class="lineaGuiaISP"
                                />

                                <text
                                    x="${izquierda - 8}"
                                    y="${yy + 4}"
                                    class="textoEjeISP"
                                    text-anchor="end"
                                >
                                    ${Math.round(valor)}
                                </text>
                            `;
                        }
                    ).join("")}

                    <line
                        x1="${izquierda}"
                        y1="${arriba + areaAlto}"
                        x2="${ancho - derecha}"
                        y2="${arriba + areaAlto}"
                        class="ejeISP"
                    />

                    <polyline
                        points="${polyline}"
                        class="lineaEvolucionISP"
                    />

                    ${puntos.map(
                        punto => `
                            <circle
                                cx="${x(
                                    punto.n
                                ).toFixed(1)}"
                                cy="${y(
                                    punto.valor
                                ).toFixed(1)}"
                                r="4.5"
                                class="puntoEvolucionISP"
                            >
                                <title>
                                    Partido ${punto.n}: ${formatearISP(
                                        punto.valor
                                    )} ISP
                                </title>
                            </circle>
                        `
                    ).join("")}

                    <text
                        x="${izquierda}"
                        y="${alto - 9}"
                        class="textoEjeISP"
                    >
                        Inicio
                    </text>

                    <text
                        x="${ancho - derecha}"
                        y="${alto - 9}"
                        class="textoEjeISP"
                        text-anchor="end"
                    >
                        ${maxN} partidos
                    </text>
                </svg>
            </div>
        `;
    }

    /* =====================================================
       MOVIMIENTOS
    ===================================================== */

    function pintarMovimientoISP(fila) {
        const variacion =
            numeroDecimalISP(
                fila.variacion
            );

        const clase =
            variacion > 0
                ? "ispSube"
                : variacion < 0
                    ? "ispBaja"
                    : "ispIgual";

        const resultado =
            String(
                fila.resultado || ""
            );

        return `
            <article class="movimientoISP">
                <div class="cabeceraMovimientoISP">
                    <div>
                        <small>
                            ${escaparISP(
                                pintarContextoPartidoISP(
                                    fila
                                )
                            )}
                        </small>

                        <strong>
                            ${escaparISP(
                                resultado ||
                                "Partido"
                            )}
                        </strong>
                    </div>

                    <b class="${clase}">
                        ${pintarVariacionTextoISP(
                            variacion
                        )}
                    </b>
                </div>

                <div class="rivalesMovimientoISP">
                    <span>
                        <small>Compañero</small>
                        <strong>
                            ${escaparISP(
                                fila.companero ||
                                "—"
                            )}
                        </strong>
                    </span>

                    <span>
                        <small>Rivales</small>
                        <strong>
                            ${escaparISP(
                                fila.rivales ||
                                "—"
                            )}
                        </strong>
                    </span>
                </div>

                <div class="pieMovimientoISP">
                    <span>
                        Esperado:
                        <strong>
                            ${formatearPorcentajeISP(
                                fila.probabilidad_esperada
                            )}
                        </strong>
                    </span>

                    <span>
                        ISP:
                        <strong>
                            ${formatearISP(
                                fila.isp_antes
                            )}
                            →
                            ${formatearISP(
                                fila.isp_despues
                            )}
                        </strong>
                    </span>
                </div>
            </article>
        `;
    }

    function pintarMovimientoDestacadoISP(
        icono,
        titulo,
        fila
    ) {
        if (!fila) return "";

        return `
            <article>
                <span>${icono}</span>
                <small>
                    ${escaparISP(titulo)}
                </small>
                <strong>
                    ${pintarVariacionTextoISP(
                        fila.variacion
                    )}
                </strong>
                <p>
                    ${escaparISP(
                        pintarContextoPartidoISP(
                            fila
                        )
                    )}
                </p>
            </article>
        `;
    }

    function pintarContextoPartidoISP(
        fila
    ) {
        const partes = [];

        if (fila.anio) {
            partes.push(
                String(fila.anio)
            );
        }

        if (fila.fase) {
            partes.push(
                String(fila.fase)
            );
        }

        if (fila.grupo_ronda) {
            partes.push(
                String(
                    fila.grupo_ronda
                )
            );
        }

        if (
            numeroISP(fila.jornada)
        ) {
            partes.push(
                `J${numeroISP(
                    fila.jornada
                )}`
            );
        }

        return partes.join(" · ");
    }

    /* =====================================================
       RÉCORDS ISP
    ===================================================== */

    function pintarRecordsISP(
        historial,
        ranking
    ) {
        if (!ranking.length) return "";

        const valorMaximoHistorico =
            Math.max(
                ...ranking.map(
                    jugador =>
                        numeroDecimalISP(
                            jugador.maximo_historico
                        )
                )
            );

        const jugadoresMaximo =
            ranking.filter(
                jugador =>
                    mismoNivelMostradoISP(
                        jugador.maximo_historico,
                        valorMaximoHistorico
                    )
            );

        const movimientos =
            [...(historial || [])];

        const valorMayorSubida =
            movimientos.length
                ? Math.max(
                    ...movimientos.map(
                        movimiento =>
                            numeroDecimalISP(
                                movimiento.variacion
                            )
                    )
                )
                : null;

        const jugadoresMayorSubida =
            valorMayorSubida === null
                ? []
                : nombresUnicosISP(
                    movimientos
                        .filter(
                            movimiento =>
                                mismoNivelMostradoISP(
                                    movimiento.variacion,
                                    valorMayorSubida
                                )
                        )
                        .map(
                            movimiento =>
                                movimiento.jugador
                        )
                );

        return `
            <section class="bloqueRanking bloqueISP">
                <h3>📚 Récords ISP</h3>

                <div class="recordsISP">
                    <article>
                        <span>🚀</span>
                        <small>ISP más alto alcanzado</small>
                        <strong>
                            ${escaparISP(
                                jugadoresMaximo.length
                                    ? jugadoresMaximo
                                        .map(
                                            jugador =>
                                                jugador.jugador
                                        )
                                        .join(" / ")
                                    : "—"
                            )}
                        </strong>
                        <b>
                            ${formatearISP(
                                valorMaximoHistorico
                            )} ISP
                        </b>
                    </article>

                    <article>
                        <span>💥</span>
                        <small>Mayor subida en un partido</small>
                        <strong>
                            ${escaparISP(
                                jugadoresMayorSubida.length
                                    ? jugadoresMayorSubida.join(" / ")
                                    : "—"
                            )}
                        </strong>
                        <b>
                            ${valorMayorSubida !== null
                                ? pintarVariacionTextoISP(
                                    valorMayorSubida
                                )
                                : "—"}
                        </b>
                    </article>
                </div>
            </section>
        `;
    }

    /* =====================================================
       INFORMACIÓN ISP
    ===================================================== */

    async function mostrarInfoISP() {
        const origen =
            await cargarDatosISP();

        const criterios =
            origen?.criterios || {};

        const fases =
            criterios.factores_fase || {};

        const partidosCalibracion =
            numeroISP(
                criterios.partidos_provisional
            ) || 5;

        const overlay =
            document.createElement(
                "div"
            );

        overlay.className =
            "overlayInfo";

        overlay.id =
            "overlayInfoISP";

        overlay.innerHTML = `
            <div class="globoInfo globoInfoISP">
                <button
                    id="cerrarInfoISP"
                    class="cerrarInfo"
                    type="button"
                >×</button>

                <h3>⚡ ¿Qué es el ISP?</h3>

                <p>
                    El <strong>Índice Sprint Pádel (ISP)</strong>
                    mide el nivel competitivo de cada jugador.
                    Está <strong>inspirado en el sistema Elo</strong>,
                    adaptado a nuestros campeonatos de pádel.
                </p>

                <p>
                    El nombre procede de <strong>Arpad Elo</strong>,
                    creador de un sistema de puntuación desarrollado
                    originalmente para el ajedrez. Su idea es comparar
                    el resultado real de un enfrentamiento con el
                    resultado que cabría esperar según el nivel previo
                    de los rivales.
                </p>

                <p>
                    Por eso no todas las victorias y derrotas valen lo
                    mismo: ganar a rivales con mayor nivel aporta más
                    ISP, mientras que perder contra rivales con menor
                    nivel penaliza más. Nuestro ISP añade además reglas
                    propias para el pádel por parejas y para la
                    importancia de cada fase del torneo.
                </p>

                <div class="comparacionInfoISP">
                    <div>
                        <strong>🏆 Ranking histórico</strong>
                        <span>
                            Mide méritos y puntos acumulados
                            edición tras edición.
                        </span>
                    </div>

                    <div>
                        <strong>⚡ ISP</strong>
                        <span>
                            Mide el nivel competitivo demostrado
                            según resultados y dificultad de rivales.
                        </span>
                    </div>
                </div>

                <h4>Cómo funciona</h4>

                <div class="reglasInfoISP">
                    ${pintarReglaInfoISP(
                        "Punto de partida",
                        `${numeroISP(
                            criterios.isp_inicial
                        ) || 1000} ISP`
                    )}

                    ${pintarReglaInfoISP(
                        "Periodo de calibración",
                        `Primeros ${partidosCalibracion} partidos`
                    )}

                    ${pintarReglaInfoISP(
                        "Rival de mayor nivel",
                        "Ganar da más ISP"
                    )}

                    ${pintarReglaInfoISP(
                        "Rival de menor nivel",
                        "Perder resta más ISP"
                    )}

                    ${pintarReglaInfoISP(
                        "Nivel de la pareja",
                        "Media del ISP de ambos jugadores"
                    )}

                    ${pintarReglaInfoISP(
                        "Palas de Playa",
                        criterios.palas_playa_computa === true
                            ? "Sí computa"
                            : "No computa"
                    )}
                </div>

                <h4>Contundencia del resultado</h4>

                <div class="baremoRankingInfo baremoISPInfo">
                    <div>
                        <span>Victoria / derrota ajustada</span>
                        <strong>× 1,00</strong>
                    </div>

                    <div>
                        <span>Victoria / derrota limpia</span>
                        <strong>
                            × ${formatearFactorISP(
                                criterios.factor_victoria_limpia
                            )}
                        </strong>
                    </div>
                </div>

                <p class="notaISPInfo">
                    🧹 Se considera resultado limpio un
                    <strong>3-0 en liguilla/grupos</strong> o un
                    <strong>2-0 en eliminatorias</strong>. Este factor
                    aumenta en un 10 % la variación que corresponda
                    tanto al ganador como al perdedor.
                </p>

                <h4>Importancia de la fase</h4>

                <div class="baremoRankingInfo baremoISPInfo">
                    ${pintarLineaFaseISP(
                        "Liguilla / Grupos / Regrupos",
                        fases.liguilla_grupos_regrupos
                    )}

                    ${pintarLineaFaseISP(
                        "Octavos",
                        fases.octavos
                    )}

                    ${pintarLineaFaseISP(
                        "Cuartos",
                        fases.cuartos
                    )}

                    ${pintarLineaFaseISP(
                        "Semifinal",
                        fases.semifinal
                    )}

                    ${pintarLineaFaseISP(
                        "Final",
                        fases.final
                    )}
                </div>

                <p class="notaISPInfo">
                    ✖️ <strong>Los dos factores son independientes y
                    pueden aplicarse a la vez.</strong> Por ejemplo,
                    una victoria 2-0 en semifinal aplica el factor de
                    semifinal <strong>×1,08</strong> y también el factor
                    de resultado limpio <strong>×1,10</strong>.
                </p>

                <p class="notaISPInfo">
                    🎯 Durante los primeros
                    <strong>${partidosCalibracion} partidos</strong>
                    el ISP varía más para situar rápidamente al jugador
                    en un nivel acorde a sus resultados.
                    <strong>Esos partidos cuentan completamente.</strong>
                    Después, el índice se vuelve más estable.
                </p>

                <p class="notaISPInfo">
                    👥 El nivel de una pareja se calcula con la media
                    del ISP de los dos jugadores que disputaron
                    realmente el partido. Si existe una sustitución,
                    el movimiento afecta a los jugadores que jugaron.
                </p>
            </div>
        `;

        document.body.appendChild(
            overlay
        );
    }

    function pintarReglaInfoISP(
        titulo,
        valor
    ) {
        return `
            <div>
                <span>
                    ${escaparISP(titulo)}
                </span>
                <strong>
                    ${escaparISP(
                        String(valor)
                    )}
                </strong>
            </div>
        `;
    }

    function pintarLineaFaseISP(
        titulo,
        factor
    ) {
        return `
            <div>
                <span>
                    ${escaparISP(titulo)}
                </span>
                <strong>
                    × ${formatearFactorISP(
                        factor
                    )}
                </strong>
            </div>
        `;
    }

    function cerrarInfoISP() {
        document
            .getElementById(
                "overlayInfoISP"
            )
            ?.remove();
    }

    /* =====================================================
       SELECTOR RANKING / ISP
    ===================================================== */

    function insertarSelectorRankingISP(
        contenido,
        activo
    ) {
        if (
            contenido.querySelector(
                ".selectorRankingTipo"
            )
        ) {
            return;
        }

        contenido.insertAdjacentHTML(
            "afterbegin",
            pintarSelectorRankingISP(
                activo
            )
        );
    }

    function pintarSelectorRankingISP(
        activo
    ) {
        return `
            <div
                class="selectorRankingTipo"
                role="tablist"
                aria-label="Tipo de ranking"
            >
                <button
                    class="${activo === "historico"
                        ? "activo"
                        : ""}"
                    data-ranking-modo="historico"
                    type="button"
                    role="tab"
                    aria-selected="${activo === "historico"}"
                >
                    🏆 Histórico
                </button>

                <button
                    class="${activo === "isp"
                        ? "activo"
                        : ""}"
                    data-ranking-modo="isp"
                    type="button"
                    role="tab"
                    aria-selected="${activo === "isp"}"
                >
                    ⚡ ISP
                </button>
            </div>
        `;
    }

    /* =====================================================
       EMPATES Y POSICIONES COMPARTIDAS
    ===================================================== */

    function prepararRankingConEmpatesISP(
        rankingOrigen
    ) {
        const ranking =
            [...(rankingOrigen || [])]
                .sort(
                    (a, b) => {
                        const diferencia =
                            claveNivelMostradoISP(b.isp) -
                            claveNivelMostradoISP(a.isp);

                        if (diferencia !== 0) {
                            return diferencia;
                        }

                        return String(
                            a.jugador || ""
                        ).localeCompare(
                            String(
                                b.jugador || ""
                            ),
                            "es",
                            {
                                sensitivity: "base"
                            }
                        );
                    }
                );

        let posicionCompartida = 0;
        let nivelAnterior = null;

        ranking.forEach(
            (jugador, indice) => {
                const nivelActual =
                    claveNivelMostradoISP(
                        jugador.isp
                    );

                if (
                    indice === 0 ||
                    nivelActual !== nivelAnterior
                ) {
                    posicionCompartida += 1;
                    nivelAnterior = nivelActual;
                }

                jugador._posicionCompartida =
                    posicionCompartida;
            }
        );

        return ranking;
    }

    function claveNivelMostradoISP(
        valor
    ) {
        return Math.round(
            numeroDecimalISP(valor) * 10
        );
    }

    function mismoNivelMostradoISP(
        valorA,
        valorB
    ) {
        return (
            claveNivelMostradoISP(valorA) ===
            claveNivelMostradoISP(valorB)
        );
    }

    function nombresUnicosISP(
        nombres
    ) {
        const vistos = new Set();

        return (nombres || []).filter(
            nombre => {
                const clave =
                    String(
                        nombre || ""
                    )
                        .trim()
                        .toLocaleUpperCase(
                            "es-ES"
                        );

                if (
                    !clave ||
                    vistos.has(clave)
                ) {
                    return false;
                }

                vistos.add(clave);
                return true;
            }
        );
    }


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function obtenerContenidoISP() {
        if (
            typeof window.obtenerContenidoDetalle ===
            "function"
        ) {
            return window.obtenerContenidoDetalle();
        }

        return document.getElementById(
            "contenidoDetalle"
        );
    }

    function pintarVacioISP(
        titulo,
        texto
    ) {
        return `
            <section class="tarjetaVacia">
                <h3>
                    ${escaparISP(titulo)}
                </h3>
                <p>
                    ${escaparISP(texto)}
                </p>
            </section>
        `;
    }

    function numeroISP(valor) {
        const n = Number(valor);
        return Number.isFinite(n)
            ? Math.round(n)
            : 0;
    }

    function numeroDecimalISP(valor) {
        const n = Number(valor);
        return Number.isFinite(n)
            ? n
            : 0;
    }

    function formatearISP(valor) {
        return numeroDecimalISP(
            valor
        ).toLocaleString(
            "es-ES",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }
        );
    }

    function formatearPorcentajeISP(
        valor
    ) {
        const n =
            numeroDecimalISP(valor);

        const porcentaje =
            Math.abs(n) <= 1
                ? n * 100
                : n;

        return `${porcentaje.toLocaleString(
            "es-ES",
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }
        )}%`;
    }

    function formatearFactorISP(
        valor
    ) {
        const n =
            numeroDecimalISP(valor);

        return (
            n || 1
        ).toLocaleString(
            "es-ES",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }

    function pintarVariacionTextoISP(
        valor
    ) {
        const n =
            numeroDecimalISP(valor);

        if (n > 0) {
            return `▲ +${Math.abs(n).toLocaleString(
                "es-ES",
                {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }
            )}`;
        }

        if (n < 0) {
            return `▼ -${Math.abs(n).toLocaleString(
                "es-ES",
                {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }
            )}`;
        }

        return "• 0,0";
    }

    function escaparISP(valor) {
        return String(
            valor ?? ""
        )
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }

    function escaparAtributoISP(
        valor
    ) {
        return escaparISP(valor);
    }
})();
