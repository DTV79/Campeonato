const JSON_URL = "https://dtv79.github.io/Campeonato/estado_torneo.json";
let datos = null;

document.addEventListener("DOMContentLoaded", iniciarApp);

async function iniciarApp() {
    try {
        const respuesta = await fetch(JSON_URL + "?v=" + Date.now(), {
            cache: "no-store"
        });

        if (!respuesta.ok) throw new Error("No se pudo cargar el JSON");

        datos = await respuesta.json();
        pintarInicio(datos);

    } catch (error) {
        console.error(error);
    }
}

/* =========================================================
   INICIO
========================================================= */

function pintarInicio(data) {
    pintarFecha(data.ultima_actualizacion);
    pintarEstado(data);
    pintarPodio(data);
    pintarTarjetasDashboard(data);
    mostrarBotonCruces(data);
    mostrarBotonPalas(data);
}

function pintarFecha(fechaISO) {
    const el = document.getElementById("ultimaActualizacion");
    if (!el || !fechaISO) return;

    const fecha = new Date(fechaISO);

    if (Number.isNaN(fecha.getTime())) {
        el.textContent = fechaISO;
        return;
    }

    el.textContent = fecha.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function pintarEstado(data) {
    const estado = obtenerEstadoCompeticion(data);

    setText("estadoCabecera", estado.titulo);

    const barra = document.getElementById("barraProgreso");
    if (barra) {
        barra.style.width = estado.porcentaje + "%";
        barra.className = "progreso " + estado.claseBarra;
    }

    setText("textoProgreso", estado.texto);

    const cabecera = document.querySelector(".cabecera");
    if (cabecera) {
        cabecera.classList.toggle("cabeceraFinalizada", estado.finalizado);
    }
}

function pintarPodio(data) {
    const podio = document.getElementById("podio");
    if (!podio) return;

    if (!esTorneoGrupos(data)) {
        const top3 = (data.clasificacion || []).slice(0, 3);
        const clases = ["oro", "plata", "bronce"];
        const medallas = ["🥇", "🥈", "🥉"];

        podio.innerHTML = top3.map((eq, i) => `
            <div class="equipoPodio ${clases[i]}">
                <span>${medallas[i]} ${eq.equipo}</span>
            </div>
        `).join("");

        return;
    }

    const faseActiva = obtenerFaseLigaActiva(data);
    const grupos = agruparPor(faseActiva.clasificaciones, eq => eq.grupo);

    const lideres = [...grupos.entries()]
        .sort((a, b) => ordenarNombreGrupo(a[0], b[0]))
        .map(([grupo, clasificacion]) => ({
            grupo,
            equipo: ordenarClasificacionGrupo(clasificacion)[0]?.equipo || "Sin datos"
        }));

    if (!lideres.length) {
        podio.innerHTML = `
            <div class="equipoPodio oro">
                <span>⏳ Clasificación pendiente</span>
            </div>
        `;
        return;
    }

    podio.innerHTML = lideres.map(lider => `
        <div class="equipoPodio oro">
            <span>🏆 ${nombreGrupoVisible(lider.grupo)}: ${lider.equipo}</span>
        </div>
    `).join("");
}

function pintarTarjetasDashboard(data) {
    const faseActiva = obtenerFaseLigaActiva(data);
    const clasificacion = faseActiva.clasificaciones || [];
    const partidos = quitarDescansos(faseActiva.partidos || []);
    const cruces = data.cruces || [];

    const partidosPalas = (data.palas_playa || [])
        .flatMap(ronda => ronda.partidos || []);

    const jornadaActual = obtenerJornadaActual(partidos);
    const partidosJornada = partidos.filter(p =>
        Number(p.jornada) === Number(jornadaActual)
    );

    const jugadosJornada = partidosJornada.filter(partidoFinalizado).length;
    const pendientesJornada = partidosJornada.filter(partidoPendiente).length;

    const crucesJugados = cruces.filter(partidoFinalizado).length;
    const palasJugados = partidosPalas.filter(partidoFinalizado).length;

    if (esTorneoGrupos(data)) {
        const gruposClasificacion = agruparPor(clasificacion, eq => eq.grupo);
        const totalEquipos = new Set(
            clasificacion.map(eq => normalizar(eq.equipo))
        ).size;

        setHTML(
            "resumenClasificacion",
            `🏆 ${gruposClasificacion.size} ${
                faseActiva.clave === "regrupos" ? "ReGrupos" : "grupos"
            }<br>${totalEquipos} equipos`
        );
    } else {
        const lider = clasificacion.length
            ? clasificacion[0].equipo
            : "Sin datos";

        setHTML(
            "resumenClasificacion",
            `🥇 ${lider}<br>${clasificacion.length} equipos`
        );
    }

    setHTML(
        "resumenPartidos",
        `${faseActiva.nombre} · Jornada ${jornadaActual}<br>` +
        `${jugadosJornada} jugados · ${pendientesJornada} pendientes`
    );

    setHTML(
        "resumenCruces",
        cruces.length
            ? `${crucesJugados} jugados · ${cruces.length - crucesJugados} pendientes`
            : "Pendientes de generar"
    );

    setHTML(
        "resumenPalas",
        partidosPalas.length
            ? `${palasJugados} jugados · ${partidosPalas.length - palasJugados} pendientes`
            : "Todavía no iniciada"
    );
}

/* =========================================================
   NAVEGACIÓN Y EVENTOS
========================================================= */

document.addEventListener("click", function(e) {
    const btnInfoOrden = e.target.closest("#btnInfoOrden");

    if (btnInfoOrden) {
        mostrarInfoOrden();
        return;
    }

    const cerrarInfo = e.target.closest("#cerrarInfoOrden");

    if (cerrarInfo || e.target.classList.contains("overlayInfo")) {
        cerrarInfoOrden();
        return;
    }

    const btnCompleta = e.target.closest("#btnVistaCompleta");

    if (btnCompleta) {
        pintarClasificacionCompleta();
        return;
    }

    const btnResumida = e.target.closest("#btnVistaResumida");

    if (btnResumida) {
        pintarPantallaClasificacion(
            document.getElementById("contenidoDetalle")
        );
        return;
    }

    const cabeceraJornada = e.target.closest(".cabeceraJornada");

    if (cabeceraJornada) {
        const bloque = cabeceraJornada.closest(".bloqueJornada");
        const lista = bloque?.querySelector(":scope > .listaPartidos");
        const flecha = cabeceraJornada.querySelector(".flechaJornada");

        if (!lista) return;

        lista.classList.toggle("oculto");

        if (flecha) {
            flecha.textContent = lista.classList.contains("oculto")
                ? "▶"
                : "▼";
        }

        return;
    }

    const card = e.target.closest(".cardAcceso");

    if (card) {
        abrirDetalle(card.dataset.seccion);
        activarNav(card.dataset.seccion);
        return;
    }

    const nav = e.target.closest(".navBtn");

    if (nav) {
        const pantalla = nav.dataset.pantalla;

        activarNav(pantalla);

        if (pantalla === "inicio") mostrarInicio();
        if (pantalla === "clasificacion") abrirDetalle("clasificacion");
        if (pantalla === "partidos") abrirDetalle("partidos");
        if (pantalla === "cruces") abrirDetalle("cruces");
        if (pantalla === "palas") abrirDetalle("palas");
        if (pantalla === "mas") abrirDetalle("mas");

        return;
    }

    const fila = e.target.closest(".filaClasificacion");

    if (fila) {
        const detalle = fila.querySelector(".detalleClasif");
        const toggle = fila.querySelector(".toggleDetalles");

        if (!detalle || !toggle) return;

        detalle.classList.toggle("oculto");

        toggle.textContent = detalle.classList.contains("oculto")
            ? "▼ Ver estadísticas"
            : "▲ Ocultar estadísticas";
    }
});

function abrirDetalle(seccion) {
    document.querySelector(".cabecera")?.classList.add("oculto");
    document.querySelector(".gridDashboard")?.classList.add("oculto");
    document.querySelector(".podioCard")?.classList.add("oculto");

    const detalle = document.getElementById("vistaDetalle");
    const contenido = document.getElementById("contenidoDetalle");

    if (!detalle || !contenido) return;

    detalle.classList.remove("oculto");

    if (seccion === "clasificacion") {
        pintarPantallaClasificacion(contenido);
    }

    if (seccion === "partidos") {
        pintarPantallaPartidos(contenido);
    }

    if (seccion === "cruces") {
        pintarPantallaCruces(contenido);
    }

    if (seccion === "palas") {
        pintarPantallaPalas(contenido);
    }

    if (seccion === "mas") {
        contenido.innerHTML = `
            <h2>☰ Más</h2>

            <div class="listaClasificacion">
                <div class="filaClasificacion">⚔️ Eliminatorias</div>
                <div class="filaClasificacion">🏖️ Copa Palas Playa</div>
                <div class="filaClasificacion">📜 Normas</div>
                <div class="filaClasificacion">🏆 Campeones</div>
                <div class="filaClasificacion">📷 Fotos</div>
            </div>
        `;
    }
}

/* =========================================================
   CLASIFICACIÓN
========================================================= */

function pintarPantallaClasificacion(contenido) {
    if (esTorneoGrupos(datos)) {
        pintarPantallaClasificacionGrupos(contenido);
        return;
    }

    pintarPantallaClasificacionLiguilla(contenido);
}

function pintarPantallaClasificacionLiguilla(contenido) {
    const mostrarCoef = mostrarCoeficiente();

    let html = `
        <h2>📊 Clasificación</h2>

        <div class="modoOrden">
            <div>
                <span>🏆 Sistema de clasificación</span>
                <strong>${textoModoOrden(datos.modo_orden)}</strong>
            </div>

            <button
                class="btnInfoOrden"
                id="btnInfoOrden"
                type="button"
            >
                ℹ️
            </button>
        </div>

        <button class="btnVistaCompleta" id="btnVistaCompleta">
            📋 Ver clasificación completa
        </button>

        <div class="listaClasificacion">
    `;

    (datos.clasificacion || []).forEach(eq => {
        const mov = obtenerMovimiento(eq);

        const medalla =
            eq.posicion_actual == 1 ? "🥇" :
            eq.posicion_actual == 2 ? "🥈" :
            eq.posicion_actual == 3 ? "🥉" :
            eq.posicion_actual + ".";

        html += `
            <article class="filaClasificacion">
                <div class="lineaEquipo">
                    <div class="equipoFila">
                        ${medalla} ${eq.equipo}
                    </div>

                    <div class="${mov.clase} movimientoFila">
                        ${mov.texto}
                    </div>
                </div>

                <div class="datosFila">
                    🔢 ${eq.puntos_totales} pts ·
                    🎾 ${eq.pj} PJ
                    ${eq.descanso > 0 ? ` · 💤 ${eq.descanso}` : ""}
                </div>

                <div class="etiquetaEspecial">
                    ${obtenerEtiqueta(eq)}
                </div>

                ${pintarDetalleEstadisticas(eq, mostrarCoef)}
            </article>
        `;
    });

    html += `</div>`;

    contenido.innerHTML = html;
}

function pintarPantallaClasificacionGrupos(contenido) {
    const fases = obtenerFasesLiga(datos);
    const faseActiva = obtenerFaseLigaActiva(datos);

    let html = `
        <h2>📊 Clasificaciones</h2>

        <div class="modoOrden">
            <div>
                <span>🏆 Sistema de clasificación</span>
                <strong>
                    Por grupos · Puntos, diferencia de sets y
                    diferencia de juegos
                </strong>
            </div>
        </div>

        <button class="btnVistaCompleta" id="btnVistaCompleta">
            📋 Ver tablas completas
        </button>

        <div class="listaJornadas">
    `;

    fases.forEach(fase => {
        const grupos = [
            ...agruparPor(
                fase.clasificaciones,
                eq => eq.grupo
            ).entries()
        ].sort((a, b) => ordenarNombreGrupo(a[0], b[0]));

        if (!grupos.length) return;

        html += `
            <section class="bloqueFase">
                <h3>${fase.icono} ${fase.nombre}</h3>
        `;

        grupos.forEach(([grupo, clasificacion]) => {
            const clasificacionOrdenada =
                ordenarClasificacionGrupo(clasificacion);

            const abierta = fase.clave === faseActiva.clave;

            html += `
                <section class="bloqueJornada">
                    <div class="cabeceraJornada ${
                        abierta ? "enJuego" : "finalizada"
                    }">
                        <div>
                            <span class="chipJornada">
                                ${
                                    abierta
                                        ? "🟢 Fase actual"
                                        : "✅ Fase anterior"
                                }
                            </span>

                            <h3>${nombreGrupoVisible(grupo)}</h3>

                            <p>
                                ${clasificacionOrdenada.length} equipos
                            </p>
                        </div>

                        <span class="flechaJornada">
                            ${abierta ? "▼" : "▶"}
                        </span>
                    </div>

                    <div class="listaPartidos ${
                        abierta ? "" : "oculto"
                    }">
                        <div class="listaClasificacion">
                            ${
                                clasificacionOrdenada.map(eq =>
                                    pintarFilaClasificacionGrupo(
                                        eq,
                                        fase,
                                        clasificacionOrdenada.length
                                    )
                                ).join("")
                            }
                        </div>
                    </div>
                </section>
            `;
        });

        html += `</section>`;
    });

    html += `</div>`;

    contenido.innerHTML = html;
}

function pintarFilaClasificacionGrupo(eq, fase, totalEquipos) {
    const fila = normalizarClasificacionGrupo(eq);

    const medalla =
        fila.posicion_actual == 1 ? "🥇" :
        fila.posicion_actual == 2 ? "🥈" :
        fila.posicion_actual == 3 ? "🥉" :
        fila.posicion_actual + ".";

    return `
        <article class="filaClasificacion">
            <div class="lineaEquipo">
                <div class="equipoFila">
                    ${medalla} ${fila.equipo}
                </div>

                <div class="movimientoFila igual">
                    ${fila.puntos_totales} pts
                </div>
            </div>

            <div class="datosFila">
                🎾 ${fila.pj} PJ ·
                ✅ ${fila.pg} PG ·
                ❌ ${fila.pp} PP
            </div>

            <div class="etiquetaEspecial">
                ${obtenerEtiquetaGrupo(fila, fase, totalEquipos)}
            </div>

            ${pintarDetalleEstadisticas(fila, false)}
        </article>
    `;
}

function pintarDetalleEstadisticas(eq, mostrarCoef) {
    return `
        <div class="toggleDetalles">
            ▼ Ver estadísticas
        </div>

        <div class="detalleClasif oculto">
            <div class="grupoStats">
                <h5>Partidos</h5>

                <div>
                    <span>Ganados</span>
                    <strong>${eq.pg}</strong>
                </div>

                <div>
                    <span>Perdidos</span>
                    <strong>${eq.pp}</strong>
                </div>
            </div>

            ${
                mostrarCoef
                    ? `
                        <div class="grupoStats">
                            <h5>Coeficiente</h5>

                            <div>
                                <span>Coeficiente</span>
                                <strong>${eq.coeficiente}</strong>
                            </div>
                        </div>
                    `
                    : ""
            }

            <div class="grupoStats">
                <h5>Sets</h5>

                <div>
                    <span>Ganados</span>
                    <strong>${eq.sets_ganados}</strong>
                </div>

                <div>
                    <span>Perdidos</span>
                    <strong>${eq.sets_perdidos}</strong>
                </div>

                <div>
                    <span>Diferencia</span>
                    <strong>${formatoDiff(eq.sets_diff)}</strong>
                </div>
            </div>

            <div class="grupoStats">
                <h5>Juegos</h5>

                <div>
                    <span>Ganados</span>
                    <strong>${eq.puntos_ganados}</strong>
                </div>

                <div>
                    <span>Perdidos</span>
                    <strong>${eq.puntos_perdidos}</strong>
                </div>

                <div>
                    <span>Diferencia</span>
                    <strong>${formatoDiff(eq.puntos_diff)}</strong>
                </div>
            </div>
        </div>
    `;
}

function pintarClasificacionCompleta() {
    if (esTorneoGrupos(datos)) {
        pintarClasificacionCompletaGrupos();
        return;
    }

    pintarClasificacionCompletaLiguilla();
}

function pintarClasificacionCompletaLiguilla() {
    const contenido = document.getElementById("contenidoDetalle");
    const mostrarCoef = mostrarCoeficiente();

    let html = `
        <h2>📋 Clasificación completa</h2>

        <div class="tablaScroll">
            <table class="tablaClasificacion">
                <thead>
                    <tr>
                        <th>MOV</th>
                        <th>POS</th>
                        <th>EQUIPO</th>
                        <th>PTOS</th>
                        ${mostrarCoef ? "<th>COEF</th>" : ""}
                        <th>PJ</th>
                        <th>PG</th>
                        <th>PP</th>
                        <th>DES</th>
                        <th>SG</th>
                        <th>SP</th>
                        <th>SD</th>
                        <th>JGan</th>
                        <th>JPer</th>
                        <th>JDif</th>
                    </tr>
                </thead>

                <tbody>
    `;

    (datos.clasificacion || []).forEach(eq => {
        const mov = obtenerMovimiento(eq);

        html += `
            <tr>
                <td>
                    <span class="${mov.clase} movTabla">
                        ${mov.texto}
                    </span>
                </td>

                <td>
                    <strong>${eq.posicion_actual}</strong>
                </td>

                <td class="equipoTabla">
                    ${eq.equipo}
                </td>

                <td>${eq.puntos_totales}</td>

                ${
                    mostrarCoef
                        ? `<td>${eq.coeficiente}</td>`
                        : ""
                }

                <td>${eq.pj}</td>
                <td>${eq.pg}</td>
                <td>${eq.pp}</td>
                <td>${eq.descanso}</td>
                <td>${eq.sets_ganados}</td>
                <td>${eq.sets_perdidos}</td>
                <td>${formatoDiff(eq.sets_diff)}</td>
                <td>${eq.puntos_ganados}</td>
                <td>${eq.puntos_perdidos}</td>
                <td>${formatoDiff(eq.puntos_diff)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        <button class="btnVistaCompleta" id="btnVistaResumida">
            ← Volver a vista resumida
        </button>
    `;

    contenido.innerHTML = html;
}

function pintarClasificacionCompletaGrupos() {
    const contenido = document.getElementById("contenidoDetalle");
    const fases = obtenerFasesLiga(datos);

    let html = `
        <h2>📋 Clasificaciones completas</h2>
    `;

    fases.forEach(fase => {
        const grupos = [
            ...agruparPor(
                fase.clasificaciones,
                eq => eq.grupo
            ).entries()
        ].sort((a, b) => ordenarNombreGrupo(a[0], b[0]));

        if (!grupos.length) return;

        html += `
            <h3>${fase.icono} ${fase.nombre}</h3>
        `;

        grupos.forEach(([grupo, clasificacion]) => {
            html += `
                <h4>${nombreGrupoVisible(grupo)}</h4>

                <div class="tablaScroll">
                    <table class="tablaClasificacion">
                        <thead>
                            <tr>
                                <th>POS</th>
                                <th>EQUIPO</th>
                                <th>PTOS</th>
                                <th>PJ</th>
                                <th>PG</th>
                                <th>PP</th>
                                <th>SF</th>
                                <th>SC</th>
                                <th>SD</th>
                                <th>JF</th>
                                <th>JC</th>
                                <th>JD</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${
                                ordenarClasificacionGrupo(
                                    clasificacion
                                ).map(eq => {
                                    const fila =
                                        normalizarClasificacionGrupo(eq);

                                    return `
                                        <tr>
                                            <td>
                                                <strong>
                                                    ${fila.posicion_actual}
                                                </strong>
                                            </td>

                                            <td class="equipoTabla">
                                                ${fila.equipo}
                                            </td>

                                            <td>${fila.puntos_totales}</td>
                                            <td>${fila.pj}</td>
                                            <td>${fila.pg}</td>
                                            <td>${fila.pp}</td>
                                            <td>${fila.sets_ganados}</td>
                                            <td>${fila.sets_perdidos}</td>
                                            <td>${formatoDiff(fila.sets_diff)}</td>
                                            <td>${fila.puntos_ganados}</td>
                                            <td>${fila.puntos_perdidos}</td>
                                            <td>${formatoDiff(fila.puntos_diff)}</td>
                                        </tr>
                                    `;
                                }).join("")
                            }
                        </tbody>
                    </table>
                </div>
            `;
        });
    });

    html += `
        <button class="btnVistaCompleta" id="btnVistaResumida">
            ← Volver a vista resumida
        </button>
    `;

    contenido.innerHTML = html;
}

/* =========================================================
   PARTIDOS
========================================================= */

function pintarPantallaPartidos(contenido) {
    if (esTorneoGrupos(datos)) {
        pintarPantallaPartidosGrupos(contenido);
        return;
    }

    pintarPantallaPartidosLiguilla(contenido);
}

function pintarPantallaPartidosLiguilla(contenido) {
    const partidos = datos.partidos || [];
    const partidosNoDescanso = quitarDescansos(partidos);
    const jornadaActual = obtenerJornadaActual(partidosNoDescanso);
    const jornadas = obtenerJornadas(partidos);

    const partidosJornadaActual = partidosNoDescanso.filter(p =>
        Number(p.jornada) === Number(jornadaActual)
    );

    const jugadosActual =
        partidosJornadaActual.filter(partidoFinalizado).length;

    const totalActual = partidosJornadaActual.length;

    const pendientesActual =
        partidosJornadaActual.filter(partidoPendiente).length;

    const porcentaje = totalActual > 0
        ? Math.round((jugadosActual / totalActual) * 100)
        : 0;

    let html = `
        <h2>🎾 Partidos</h2>

        ${
            pintarResumenFase(
                "Liguilla",
                jornadaActual,
                jugadosActual,
                pendientesActual,
                porcentaje
            )
        }

        <div class="listaJornadas">
    `;

    jornadas.forEach(jornada => {
        const partidosJornada = partidos.filter(p =>
            Number(p.jornada) === Number(jornada)
        );

        html += pintarBloqueJornada(
            jornada,
            partidosJornada,
            Number(jornada) === Number(jornadaActual),
            false
        );
    });

    html += `</div>`;

    contenido.innerHTML = html;
}

function pintarPantallaPartidosGrupos(contenido) {
    const fases = obtenerFasesLiga(datos);
    const faseActiva = obtenerFaseLigaActiva(datos);
    const partidosActivos = quitarDescansos(faseActiva.partidos);
    const jornadaActual = obtenerJornadaActual(partidosActivos);

    const partidosJornadaActual = partidosActivos.filter(p =>
        Number(p.jornada) === Number(jornadaActual)
    );

    const jugadosActual =
        partidosJornadaActual.filter(partidoFinalizado).length;

    const pendientesActual =
        partidosJornadaActual.filter(partidoPendiente).length;

    const totalActual = partidosJornadaActual.length;

    const porcentaje = totalActual > 0
        ? Math.round((jugadosActual / totalActual) * 100)
        : 0;

    let html = `
        <h2>🎾 Partidos</h2>

        ${
            pintarResumenFase(
                faseActiva.nombre,
                jornadaActual,
                jugadosActual,
                pendientesActual,
                porcentaje
            )
        }

        <div class="listaJornadas">
    `;

    fases.forEach(fase => {
        const jornadas = obtenerJornadas(fase.partidos);

        if (!jornadas.length) return;

        const esFaseActiva = fase.clave === faseActiva.clave;

        html += `
            <section class="bloqueFasePartidos">
                <h3>${fase.icono} ${fase.nombre}</h3>
        `;

        jornadas.forEach(jornada => {
            const partidosJornada = fase.partidos.filter(p =>
                Number(p.jornada) === Number(jornada)
            );

            html += pintarBloqueJornada(
                jornada,
                partidosJornada,
                esFaseActiva &&
                    Number(jornada) === Number(jornadaActual),
                true
            );
        });

        html += `</section>`;
    });

    html += `</div>`;

    contenido.innerHTML = html;
}

function pintarResumenFase(
    nombreFase,
    jornada,
    jugados,
    pendientes,
    porcentaje
) {
    return `
        <section class="resumenPartidos">
            <div class="estadoResumen">
                ${
                    pendientes === 0
                        ? `✅ ${nombreFase} · Jornada ${jornada} finalizada`
                        : `🟢 ${nombreFase} · Jornada ${jornada} en juego`
                }
            </div>

            <div class="barra">
                <div
                    class="progreso"
                    style="width:${porcentaje}%"
                ></div>
            </div>

            <p>
                ${jugados} jugados ·
                ${pendientes} pendientes ·
                ${porcentaje}%
            </p>
        </section>
    `;
}

function pintarBloqueJornada(
    jornada,
    partidosJornada,
    abierta,
    separarPorGrupo
) {
    const noDescanso = quitarDescansos(partidosJornada);
    const jugados = noDescanso.filter(partidoFinalizado).length;
    const pendientes = noDescanso.filter(partidoPendiente).length;
    const total = noDescanso.length;

    let estadoJornada = "⏳ Próxima";
    let claseEstado = "proxima";

    if (pendientes === 0 && total > 0) {
        estadoJornada = "✅ Finalizada";
        claseEstado = "finalizada";
    }

    if (abierta && pendientes > 0) {
        estadoJornada = "🟢 En juego";
        claseEstado = "enJuego";
    }

    let contenidoPartidos = "";

    if (separarPorGrupo) {
        const grupos = [
            ...agruparPor(
                partidosJornada,
                p => p.grupo || "Sin grupo"
            ).entries()
        ].sort((a, b) => ordenarNombreGrupo(a[0], b[0]));

        contenidoPartidos = grupos.map(
            ([grupo, partidosGrupo]) => `
                <div class="grupoPartidos">
                    <h4>${nombreGrupoVisible(grupo)}</h4>

                    ${
                        ordenarPartidos(partidosGrupo)
                            .map(p => pintarCardPartido(p))
                            .join("")
                    }
                </div>
            `
        ).join("");
    } else {
        contenidoPartidos = ordenarPartidos(partidosJornada)
            .map(p => pintarCardPartido(p))
            .join("");
    }

    return `
        <section class="bloqueJornada">
            <div class="cabeceraJornada ${claseEstado}">
                <div>
                    <span class="chipJornada">
                        ${estadoJornada}
                    </span>

                    <h3>Jornada ${jornada}</h3>

                    <p>${jugados}/${total} partidos</p>
                </div>

                <span class="flechaJornada">
                    ${abierta ? "▼" : "▶"}
                </span>
            </div>

            <div class="listaPartidos ${
                abierta ? "" : "oculto"
            }">
                ${contenidoPartidos}
            </div>
        </section>
    `;
}

function pintarCardPartido(p) {
    if (partidoEsDescanso(p)) {
        const equipoDescansa =
            p.local ||
            p.visitante ||
            p.equipo ||
            "";

        return `
            <article class="cardPartido descanso">
                <div class="estadoPartido">
                    💤 Descanso
                </div>

                <div class="equipoPartido">
                    ${equipoDescansa}
                </div>

                ${
                    p.grupo
                        ? `
                            <div class="datosFila">
                                ${nombreGrupoVisible(p.grupo)}
                            </div>
                        `
                        : ""
                }
            </article>
        `;
    }

    const localJugadores = dividirEquipo(p.local);
    const visitanteJugadores = dividirEquipo(p.visitante);
    const sets = obtenerSets(p.resultado);

    const finalizado = partidoFinalizado(p);
    const claseEstado = finalizado ? "jugado" : "pendiente";
    const textoEstado = finalizado
        ? "✅ Finalizado"
        : "⏳ Pendiente";

    const localGana =
        p.ganador &&
        normalizar(p.ganador) === normalizar(p.local);

    const visitanteGana =
        p.ganador &&
        normalizar(p.ganador) === normalizar(p.visitante);

    return `
        <article class="cardPartido marcador ${claseEstado}">
            <div class="estadoPartido">
                ${textoEstado}
            </div>

            ${pintarMetaPartido(p)}

            <div class="marcadorHeader">
                <div></div>
                <div>I</div>
                <div>II</div>
                <div>III</div>
            </div>

            <div class="filaMarcador ${
                localGana ? "ganadorFila" : ""
            }">
                <div class="nombreEquipoMarcador">
                    ${
                        localJugadores
                            .map(j => `<strong>${j}</strong>`)
                            .join("")
                    }
                </div>

                <div>${sets[0].local}</div>
                <div>${sets[1].local}</div>
                <div>${sets[2].local}</div>
            </div>

            <div class="filaMarcador ${
                visitanteGana ? "ganadorFila" : ""
            }">
                <div class="nombreEquipoMarcador">
                    ${
                        visitanteJugadores
                            .map(j => `<strong>${j}</strong>`)
                            .join("")
                    }
                </div>

                <div>${sets[0].visitante}</div>
                <div>${sets[1].visitante}</div>
                <div>${sets[2].visitante}</div>
            </div>
        </article>
    `;
}

function pintarMetaPartido(p) {
    const partes = [];

    if (p.grupo) {
        partes.push(nombreGrupoVisible(p.grupo));
    }

    if (
        p.pista !== null &&
        p.pista !== undefined &&
        p.pista !== ""
    ) {
        partes.push(`Pista ${p.pista}`);
    }

    if (
        p.duracion_min !== null &&
        p.duracion_min !== undefined &&
        p.duracion_min !== ""
    ) {
        partes.push(`${p.duracion_min} min`);
    }

    if (!partes.length) return "";

    return `
        <div class="datosFila">
            ${partes.join(" · ")}
        </div>
    `;
}

/* =========================================================
   ELIMINATORIAS
========================================================= */

function pintarPantallaCruces(contenido) {
    const cruces = datos.cruces || [];

    if (!cruces.length) {
        contenido.innerHTML = `
            <h2>⚔️ Eliminatorias</h2>

            <section class="tarjetaVacia">
                <h3>⏳ Todavía no generadas</h3>

                <p>
                    Las eliminatorias aparecerán aquí cuando
                    se creen desde Excel.
                </p>
            </section>
        `;

        return;
    }

    const fases = [...new Set(cruces.map(c => c.fase))];
    const faseActual = obtenerFaseActualCruces(cruces);

    let html = `
        <h2>⚔️ Eliminatorias</h2>

        <div class="listaJornadas">
    `;

    fases.forEach(fase => {
        const abierta = fase === faseActual;

        const partidosFase = cruces.filter(c =>
            c.fase === fase
        );

        const jugados =
            partidosFase.filter(partidoFinalizado).length;

        const pendientes = partidosFase.length - jugados;

        html += `
            <section class="bloqueJornada">
                <div class="cabeceraJornada ${
                    pendientes === 0
                        ? "finalizada"
                        : "enJuego"
                }">
                    <div>
                        <span class="chipJornada">
                            ${
                                pendientes === 0
                                    ? "✅ Finalizada"
                                    : "🟢 En juego"
                            }
                        </span>

                        <h3>${fase}</h3>

                        <p>
                            ${jugados}/${partidosFase.length}
                            partidos
                        </p>
                    </div>

                    <span class="flechaJornada">
                        ${abierta ? "▼" : "▶"}
                    </span>
                </div>

                <div class="listaPartidos ${
                    abierta ? "" : "oculto"
                }">
                    ${
                        partidosFase
                            .map(p => pintarCardCruce(p))
                            .join("")
                    }
                </div>
            </section>
        `;
    });

    html += `</div>`;

    contenido.innerHTML = html;
}

function pintarCardCruce(p) {
    const local =
        p.local ||
        p.equipo1 ||
        p.equipo_a ||
        p.jugador1 ||
        "";

    const visitante =
        p.visitante ||
        p.equipo2 ||
        p.equipo_b ||
        p.jugador2 ||
        "";

    const sets = obtenerSets(p.resultado);

    const finalizado = partidoFinalizado(p);
    const claseEstado = finalizado ? "jugado" : "pendiente";

    const textoEstado = finalizado
        ? "✅ Finalizado"
        : "⏳ Pendiente";

    const localGana =
        p.ganador &&
        normalizar(p.ganador) === normalizar(local);

    const visitanteGana =
        p.ganador &&
        normalizar(p.ganador) === normalizar(visitante);

    return `
        <article class="cardPartido marcador ${claseEstado}">
            <div class="estadoPartido">
                ${textoEstado}
            </div>

            ${pintarMetaPartido(p)}

            <div class="marcadorHeader">
                <div></div>
                <div>I</div>
                <div>II</div>
                <div>III</div>
            </div>

            <div class="filaMarcador ${
                localGana ? "ganadorFila" : ""
            }">
                <div class="nombreEquipoMarcador">
                    ${
                        dividirEquipo(local)
                            .map(j => `<strong>${j}</strong>`)
                            .join("")
                    }
                </div>

                <div>${sets[0].local}</div>
                <div>${sets[1].local}</div>
                <div>${sets[2].local}</div>
            </div>

            <div class="filaMarcador ${
                visitanteGana ? "ganadorFila" : ""
            }">
                <div class="nombreEquipoMarcador">
                    ${
                        dividirEquipo(visitante)
                            .map(j => `<strong>${j}</strong>`)
                            .join("")
                    }
                </div>

                <div>${sets[0].visitante}</div>
                <div>${sets[1].visitante}</div>
                <div>${sets[2].visitante}</div>
            </div>
        </article>
    `;
}

function obtenerFaseActualCruces(cruces) {
    const fases = [...new Set(cruces.map(c => c.fase))];

    for (const fase of fases) {
        const partidosFase = cruces.filter(c =>
            c.fase === fase
        );

        const hayPendientes =
            partidosFase.some(partidoPendiente);

        if (hayPendientes) return fase;
    }

    return fases[fases.length - 1] || "";
}

function mostrarBotonCruces(data) {
    const btn = document.querySelector(".navCruces");

    if (!btn) return;

    const cruces = data.cruces || [];

    btn.classList.toggle(
        "oculto",
        cruces.length === 0
    );
}

/* =========================================================
   PALAS DE PLAYA
========================================================= */

function pintarPantallaPalas(contenido) {
    const rondas = datos.palas_playa || [];

    if (!rondas.length) {
        contenido.innerHTML = `
            <h2>🏖️ Copa Palas Playa</h2>

            <section class="tarjetaVacia">
                <h3>⏳ Todavía no iniciada</h3>

                <p>
                    Aquí aparecerán los partidos cuando
                    se genere la Copa Palas Playa desde Excel.
                </p>
            </section>
        `;

        return;
    }

    const rondaActual = obtenerRondaActualPalas(rondas);

    let html = `
        <h2>🏖️ Copa Palas Playa</h2>

        <section class="resumenPartidos resumenPalas">
            <div class="estadoResumen">
                🥄 El que pierde sigue jugando
            </div>

            <p>
                Ganar un partido significa salvarse del
                farolillo.
            </p>
        </section>

        <div class="listaJornadas">
    `;

    rondas.forEach(ronda => {
        const partidos = ronda.partidos || [];

        const abierta =
            Number(ronda.ronda) === Number(rondaActual);

        const jugados =
            partidos.filter(partidoFinalizado).length;

        const pendientes =
            partidos.filter(partidoPendiente).length;

        let estadoRonda = "⏳ Próxima";
        let claseEstado = "proxima";

        if (pendientes === 0 && partidos.length > 0) {
            estadoRonda = "✅ Finalizada";
            claseEstado = "finalizada";
        }

        if (abierta && pendientes > 0) {
            estadoRonda = "🟢 En juego";
            claseEstado = "enJuego";
        }

        html += `
            <section class="bloqueJornada">
                <div class="cabeceraJornada ${claseEstado}">
                    <div>
                        <span class="chipJornada">
                            ${estadoRonda}
                        </span>

                        <h3>
                            ${
                                ronda.nombre ||
                                "Ronda " + ronda.ronda
                            }
                        </h3>

                        <p>
                            ${jugados}/${partidos.length}
                            partidos
                        </p>

                        ${
                            ronda.descansa
                                ? `
                                    <p>
                                        💤 Descansa:
                                        <strong>
                                            ${ronda.descansa}
                                        </strong>
                                    </p>
                                `
                                : ""
                        }
                    </div>

                    <span class="flechaJornada">
                        ${abierta ? "▼" : "▶"}
                    </span>
                </div>

                <div class="listaPartidos ${
                    abierta ? "" : "oculto"
                }">
                    ${
                        partidos
                            .map(p => pintarCardPalas(p))
                            .join("")
                    }
                </div>
            </section>
        `;
    });

    html += `</div>`;

    contenido.innerHTML = html;
}

function obtenerRondaActualPalas(rondas) {
    for (const ronda of rondas) {
        const partidos = ronda.partidos || [];

        if (partidos.some(partidoPendiente)) {
            return ronda.ronda;
        }
    }

    return rondas[rondas.length - 1]?.ronda || 1;
}

function pintarCardPalas(p) {
    const local =
        p.local ||
        p.equipo1 ||
        p.equipo_a ||
        p.jugador1 ||
        "";

    const visitante =
        p.visitante ||
        p.equipo2 ||
        p.equipo_b ||
        p.jugador2 ||
        "";

    const sets = obtenerSets(p.resultado);
    const finalizado = partidoFinalizado(p);

    const textoEstado = finalizado
        ? "✅ Finalizado"
        : "⏳ Pendiente";

    const localGana =
        p.ganador &&
        normalizar(p.ganador) === normalizar(local);

    const visitanteGana =
        p.ganador &&
        normalizar(p.ganador) === normalizar(visitante);

    const localPierde =
        finalizado && visitanteGana;

    const visitantePierde =
        finalizado && localGana;

    const salvado =
        localGana
            ? local
            : visitanteGana
                ? visitante
                : "";

    const sigue =
        localPierde
            ? local
            : visitantePierde
                ? visitante
                : "";

    const esFinalPalas =
        finalizado && p.es_final === true;

    return `
        <article class="cardPartido marcador pendientePalas">
            <div class="estadoPartido">
                ${textoEstado}
            </div>

            ${pintarMetaPartido(p)}

            <div class="marcadorHeader">
                <div></div>
                <div>I</div>
                <div>II</div>
                <div>III</div>
            </div>

            <div class="filaMarcador ${
                localPierde ? "perdedorPalas" : ""
            }">
                <div class="nombreEquipoMarcador">
                    ${
                        dividirEquipo(local)
                            .map(j => `<strong>${j}</strong>`)
                            .join("")
                    }
                </div>

                <div>${sets[0].local}</div>
                <div>${sets[1].local}</div>
                <div>${sets[2].local}</div>
            </div>

            <div class="filaMarcador ${
                visitantePierde ? "perdedorPalas" : ""
            }">
                <div class="nombreEquipoMarcador">
                    ${
                        dividirEquipo(visitante)
                            .map(j => `<strong>${j}</strong>`)
                            .join("")
                    }
                </div>

                <div>${sets[0].visitante}</div>
                <div>${sets[1].visitante}</div>
                <div>${sets[2].visitante}</div>
            </div>

            ${
                finalizado
                    ? `
                        <div class="infoPalas">
                            ${
                                esFinalPalas
                                    ? `
                                        🥄 Farolillo rojo:
                                        <strong>${sigue}</strong>
                                    `
                                    : `
                                        🛟 Se salva:
                                        <strong>${salvado}</strong>
                                    `
                            }
                        </div>
                    `
                    : ""
            }
        </article>
    `;
}

function mostrarBotonPalas(data) {
    const btn = document.querySelector(".navPalas");

    if (!btn) return;

    const palas = data.palas_playa || [];

    btn.classList.toggle(
        "oculto",
        palas.length === 0
    );
}

/* =========================================================
   ESTADO GENERAL DE LA COMPETICIÓN
========================================================= */

function obtenerEstadoCompeticion(data) {
    const cruces = data.cruces || [];

    if (cruces.length) {
        return obtenerEstadoCruces(cruces);
    }

    if (esTorneoGrupos(data)) {
        return obtenerEstadoGrupos(data);
    }

    return obtenerEstadoLiguilla(data.partidos || []);
}

function obtenerEstadoLiguilla(partidosTodos) {
    const partidos = quitarDescansos(partidosTodos);

    if (!partidos.length) {
        return {
            titulo: "⏳ Liguilla pendiente",
            texto: "Todavía no hay partidos generados",
            porcentaje: 0,
            claseBarra: "barraLiguilla",
            finalizado: false
        };
    }

    const jornadaActual = obtenerJornadaActual(partidos);

    const partidosJornada = partidos.filter(p =>
        Number(p.jornada) === Number(jornadaActual)
    );

    const jugados =
        partidosJornada.filter(partidoFinalizado).length;

    const pendientes =
        partidosJornada.filter(partidoPendiente).length;

    const total = partidosJornada.length;

    const porcentaje = total > 0
        ? Math.round((jugados / total) * 100)
        : 0;

    return {
        titulo:
            pendientes === 0
                ? `✅ Jornada ${jornadaActual} finalizada`
                : `🟢 Jornada ${jornadaActual} en juego`,

        texto:
            `${jugados} de ${total} partidos de la jornada · ` +
            `${porcentaje}%`,

        porcentaje,
        claseBarra: "barraLiguilla",
        finalizado: false
    };
}

function obtenerEstadoGrupos(data) {
    const fase = obtenerFaseLigaActiva(data);
    const partidos = quitarDescansos(fase.partidos);

    if (!partidos.length) {
        return {
            titulo: `⏳ ${fase.nombre} pendiente`,
            texto: "Todavía no hay partidos generados",
            porcentaje: 0,
            claseBarra: "barraLiguilla",
            finalizado: false
        };
    }

    const pendientesFase =
        partidos.filter(partidoPendiente).length;

    const jugadosFase =
        partidos.filter(partidoFinalizado).length;

    if (pendientesFase === 0) {
        return {
            titulo: `✅ ${fase.nombre} finalizada`,
            texto:
                `${jugadosFase} de ${partidos.length} ` +
                `partidos de la fase · 100%`,
            porcentaje: 100,
            claseBarra: "barraLiguilla",
            finalizado: false
        };
    }

    const jornadaActual = obtenerJornadaActual(partidos);

    const partidosJornada = partidos.filter(p =>
        Number(p.jornada) === Number(jornadaActual)
    );

    const jugados =
        partidosJornada.filter(partidoFinalizado).length;

    const total = partidosJornada.length;

    const porcentaje = total > 0
        ? Math.round((jugados / total) * 100)
        : 0;

    return {
        titulo:
            `🟢 ${fase.nombre} · Jornada ${jornadaActual}`,

        texto:
            `${jugados} de ${total} partidos de la jornada · ` +
            `${porcentaje}%`,

        porcentaje,
        claseBarra: "barraLiguilla",
        finalizado: false
    };
}

function obtenerEstadoCruces(cruces) {
    const fases = [...new Set(cruces.map(c => c.fase))];

    for (const fase of fases) {
        const partidosFase = cruces.filter(c =>
            c.fase === fase
        );

        const jugados =
            partidosFase.filter(partidoFinalizado).length;

        const total = partidosFase.length;
        const pendientes = total - jugados;

        if (pendientes > 0) {
            const porcentaje = total > 0
                ? Math.round((jugados / total) * 100)
                : 0;

            return {
                titulo: tituloFase(fase),
                texto: textoFase(fase, jugados, total),
                porcentaje,
                claseBarra: claseBarraFase(fase),
                finalizado: false
            };
        }
    }

    const final = cruces.find(c => {
        const fase = normalizar(c.fase);

        return fase === "FINAL" ||
            fase === "GRAN FINAL";
    });

    return {
        titulo: "🏆 Campeonato finalizado",

        texto:
            final && final.ganador
                ? `🥇 Campeones: ${final.ganador}`
                : "¡Tenemos campeones!",

        porcentaje: 100,
        claseBarra: "barraFinalizado",
        finalizado: true
    };
}

function tituloFase(fase) {
    const f = normalizar(fase).toLowerCase();

    if (f.includes("octavo")) {
        return "🔵 Octavos de final";
    }

    if (f.includes("cuarto")) {
        return "🟠 Cuartos de final";
    }

    if (f.includes("semi")) {
        return "🟣 Semifinales";
    }

    if (f.includes("final")) {
        return "🟡 Gran Final";
    }

    return "🟠 " + fase;
}

function textoFase(fase, jugados, total) {
    const f = normalizar(fase).toLowerCase();

    if (f.includes("final")) {
        return jugados === 0
            ? "Pendiente el partido decisivo"
            : `${jugados} de ${total} partidos`;
    }

    return `${jugados} de ${total} partidos`;
}

function claseBarraFase(fase) {
    const f = normalizar(fase).toLowerCase();

    if (f.includes("octavo")) {
        return "barraCuartos";
    }

    if (f.includes("cuarto")) {
        return "barraCuartos";
    }

    if (f.includes("semi")) {
        return "barraSemis";
    }

    if (f.includes("final")) {
        return "barraFinal";
    }

    return "barraCuartos";
}

/* =========================================================
   ADAPTACIÓN LIGUILLA / GRUPOS / REGRUPOS
========================================================= */

function obtenerConfiguracion(data = datos) {
    return data?.configuracion || {};
}

function esTorneoGrupos(data = datos) {
    const config = obtenerConfiguracion(data);

    const tipo = normalizar(
        config.tipo_campeonato
    );

    const estructura = normalizar(
        config.estructura_primera_fase_normalizada
    );

    return (
        tipo === "GRUPOS" ||
        estructura === "DOS_GRUPOS" ||
        estructura === "CUATRO_GRUPOS" ||
        Boolean(data?.grupos)
    );
}

function obtenerFasesLiga(data = datos) {
    if (!esTorneoGrupos(data)) {
        return [{
            clave: "liguilla",
            nombre: "Liguilla",
            icono: "🎾",
            clasificaciones: data?.clasificacion || [],
            partidos: data?.partidos || []
        }];
    }

    const fases = [];

    const grupos = data?.grupos || {};
    const clasificacionesGrupos =
        grupos.clasificaciones || [];

    const partidosGrupos =
        grupos.partidos || [];

    if (
        clasificacionesGrupos.length ||
        partidosGrupos.length
    ) {
        fases.push({
            clave: "grupos",
            nombre: "Primera fase · Grupos",
            icono: "🧩",
            clasificaciones: clasificacionesGrupos,
            partidos: partidosGrupos
        });
    }

    const regrupos = data?.regrupos || {};
    const clasificacionesRegrupos =
        regrupos.clasificaciones || [];

    const partidosRegrupos =
        regrupos.partidos || [];

    if (
        clasificacionesRegrupos.length ||
        partidosRegrupos.length
    ) {
        fases.push({
            clave: "regrupos",
            nombre: "Segunda fase · ReGrupos",
            icono: "🔁",
            clasificaciones: clasificacionesRegrupos,
            partidos: partidosRegrupos
        });
    }

    if (!fases.length) {
        fases.push({
            clave: "grupos",
            nombre: "Primera fase · Grupos",
            icono: "🧩",
            clasificaciones: [],
            partidos: []
        });
    }

    return fases;
}

function obtenerFaseLigaActiva(data = datos) {
    const fases = obtenerFasesLiga(data);

    const faseConPendientes = [...fases]
        .reverse()
        .find(fase =>
            quitarDescansos(
                fase.partidos
            ).some(partidoPendiente)
        );

    if (faseConPendientes) {
        return faseConPendientes;
    }

    const ultimaConPartidos = [...fases]
        .reverse()
        .find(fase =>
            quitarDescansos(fase.partidos).length > 0
        );

    if (ultimaConPartidos) {
        return ultimaConPartidos;
    }

    const ultimaConClasificacion = [...fases]
        .reverse()
        .find(fase =>
            fase.clasificaciones.length > 0
        );

    return ultimaConClasificacion ||
        fases[fases.length - 1];
}

function normalizarClasificacionGrupo(eq) {
    return {
        ...eq,

        posicion_actual: Number(
            eq.posicion ??
            eq.posicion_actual ??
            0
        ),

        posicion_anterior: Number(
            eq.posicion ??
            eq.posicion_actual ??
            0
        ),

        puntos_totales: Number(
            eq.puntos ??
            eq.puntos_totales ??
            0
        ),

        coeficiente: 0,

        pj: Number(eq.pj ?? 0),
        pg: Number(eq.pg ?? 0),
        pp: Number(eq.pp ?? 0),
        descanso: Number(eq.descanso ?? 0),

        sets_ganados: Number(
            eq.sets_favor ??
            eq.sets_ganados ??
            0
        ),

        sets_perdidos: Number(
            eq.sets_contra ??
            eq.sets_perdidos ??
            0
        ),

        sets_diff: Number(
            eq.sets_diff ?? 0
        ),

        puntos_ganados: Number(
            eq.juegos_favor ??
            eq.puntos_ganados ??
            0
        ),

        puntos_perdidos: Number(
            eq.juegos_contra ??
            eq.puntos_perdidos ??
            0
        ),

        puntos_diff: Number(
            eq.juegos_diff ??
            eq.puntos_diff ??
            0
        )
    };
}

function ordenarClasificacionGrupo(clasificacion) {
    return [...clasificacion].sort((a, b) => {
        const posA = Number(
            a.posicion ??
            a.posicion_actual ??
            999
        );

        const posB = Number(
            b.posicion ??
            b.posicion_actual ??
            999
        );

        return posA - posB;
    });
}

function obtenerEtiquetaGrupo(eq, fase, totalEquipos) {
    const config = obtenerConfiguracion();
    const posicion = Number(eq.posicion_actual);

    if (posicion === 1) {
        return "⭐ Líder del grupo";
    }

    if (
        fase.clave === "grupos" &&
        config.hay_regrupos === true
    ) {
        const pasan = Number(
            config.equipos_pasan_a_regrupos || 0
        );

        if (pasan > 0 && posicion <= pasan) {
            return "🔁 Pasa a ReGrupos";
        }
    }

    const pasanCruces = Number(
        config.equipos_pasan_a_cruces_por_grupo || 0
    );

    if (
        (
            fase.clave === "regrupos" ||
            config.hay_regrupos !== true
        ) &&
        pasanCruces > 0 &&
        posicion <= pasanCruces
    ) {
        return "⚔️ Pasa a eliminatorias";
    }

    if (posicion === totalEquipos) {
        return "🥄 Farolillo del grupo";
    }

    return "🎾 En competición";
}

function nombreGrupoVisible(grupo) {
    const texto = String(grupo || "").trim();

    if (!texto) {
        return "Sin grupo";
    }

    if (/^regrupo/i.test(texto)) {
        return texto;
    }

    if (/^grupo/i.test(texto)) {
        return texto;
    }

    return `Grupo ${texto}`;
}

function ordenarNombreGrupo(a, b) {
    return String(a).localeCompare(
        String(b),
        "es",
        {
            numeric: true,
            sensitivity: "base"
        }
    );
}

/* =========================================================
   AUXILIARES DE PARTIDOS
========================================================= */

function obtenerJornadaActual(partidos) {
    const lista = quitarDescansos(partidos);

    const jornadas = [
        ...new Set(
            lista
                .map(p => Number(p.jornada))
                .filter(Number.isFinite)
        )
    ].sort((a, b) => a - b);

    for (const jornada of jornadas) {
        const partidosJornada = lista.filter(p =>
            Number(p.jornada) === Number(jornada)
        );

        if (partidosJornada.some(partidoPendiente)) {
            return jornada;
        }
    }

    return jornadas[jornadas.length - 1] || 1;
}

function obtenerJornadas(partidos) {
    return [
        ...new Set(
            (partidos || [])
                .map(p => Number(p.jornada))
                .filter(Number.isFinite)
        )
    ].sort((a, b) => a - b);
}

function partidoFinalizado(p) {
    return [
        "JUGADO",
        "FINALIZADO"
    ].includes(normalizar(p?.estado));
}

function partidoEsDescanso(p) {
    const estado = normalizar(p?.estado);
    const descanso = normalizar(p?.descanso);

    return (
        estado === "DESCANSO" ||
        descanso === "SI" ||
        descanso === "SÍ"
    );
}

function partidoPendiente(p) {
    return (
        !partidoEsDescanso(p) &&
        !partidoFinalizado(p)
    );
}

function quitarDescansos(partidos) {
    return (partidos || []).filter(
        p => !partidoEsDescanso(p)
    );
}

function ordenarPartidos(partidos) {
    return [...(partidos || [])].sort((a, b) => {
        const ordenA = Number(
            a.orden ??
            a.id ??
            0
        );

        const ordenB = Number(
            b.orden ??
            b.id ??
            0
        );

        return ordenA - ordenB;
    });
}

function dividirEquipo(nombre) {
    return String(nombre || "")
        .split("/")
        .map(j => j.trim())
        .filter(Boolean);
}

function obtenerSets(resultado) {
    const sets = [
        {
            local: "-",
            visitante: "-"
        },
        {
            local: "-",
            visitante: "-"
        },
        {
            local: "-",
            visitante: "-"
        }
    ];

    if (!Array.isArray(resultado)) {
        return sets;
    }

    resultado.slice(0, 3).forEach((set, i) => {
        const partes = String(set).split("-");

        sets[i].local =
            partes[0] || "-";

        sets[i].visitante =
            partes[1] || "-";
    });

    return sets;
}

function agruparPor(lista, obtenerClave) {
    const mapa = new Map();

    (lista || []).forEach(elemento => {
        const clave =
            obtenerClave(elemento) ||
            "Sin grupo";

        if (!mapa.has(clave)) {
            mapa.set(clave, []);
        }

        mapa.get(clave).push(elemento);
    });

    return mapa;
}

/* =========================================================
   AUXILIARES DE CLASIFICACIÓN Y UI
========================================================= */

function mostrarCoeficiente() {
    return (
        !esTorneoGrupos(datos) &&
        datos.modo_orden === "Opción C"
    );
}

function obtenerMovimiento(eq) {
    const actual = Number(
        eq.posicion_actual || 0
    );

    const anterior = Number(
        eq.posicion_anterior || actual
    );

    const dif = anterior - actual;

    if (dif > 0) {
        return {
            texto: "▲ " + dif,
            clase: "sube"
        };
    }

    if (dif < 0) {
        return {
            texto: "▼ " + Math.abs(dif),
            clase: "baja"
        };
    }

    return {
        texto: "—",
        clase: "igual"
    };
}

function obtenerEtiqueta(eq) {
    if (eq.posicion_actual == 1) {
        return "⭐ Líder";
    }

    if (eq.posicion_actual == 2) {
        return "🥈 Al acecho";
    }

    if (eq.posicion_actual == 3) {
        return "🥉 Podio";
    }

    if (
        eq.posicion_actual >= 4 &&
        eq.posicion_actual <= 8
    ) {
        return "⚔️ Playoff";
    }

    if (
        eq.posicion_actual ==
        (datos.clasificacion || []).length
    ) {
        return "🥄 Farolillo";
    }

    return "🚣 A remar";
}

function textoModoOrden(modo) {
    if (modo === "Opción A") {
        return "· Rendimiento proporcional";
    }

    if (modo === "Opción B") {
        return "· Constancia y participación";
    }

    if (modo === "Opción C") {
        return "· Eficacia real";
    }

    return modo || "Sistema no definido";
}

function formatoDiff(valor) {
    const n = Number(valor);

    if (!Number.isFinite(n)) {
        return "0";
    }

    if (n > 0) {
        return "+" + n;
    }

    return String(n);
}

function normalizar(txt) {
    return String(txt || "")
        .trim()
        .toUpperCase();
}

function mostrarInicio() {
    document
        .querySelector(".cabecera")
        ?.classList.remove("oculto");

    document
        .querySelector(".gridDashboard")
        ?.classList.remove("oculto");

    document
        .querySelector(".podioCard")
        ?.classList.remove("oculto");

    document
        .getElementById("vistaDetalle")
        ?.classList.add("oculto");

    activarNav("inicio");
}

function activarNav(pantalla) {
    document
        .querySelectorAll(".navBtn")
        .forEach(b =>
            b.classList.remove("navActivo")
        );

    const btn = document.querySelector(
        `.navBtn[data-pantalla="${pantalla}"]`
    );

    if (btn) {
        btn.classList.add("navActivo");
    }
}

function setHTML(id, html) {
    const el = document.getElementById(id);

    if (el) {
        el.innerHTML = html;
    }
}

function setText(id, texto) {
    const el = document.getElementById(id);

    if (el) {
        el.textContent = texto;
    }
}

/* =========================================================
   INFORMACIÓN DEL SISTEMA DE CLASIFICACIÓN
========================================================= */

function mostrarInfoOrden() {
    const info = obtenerInfoOrden(datos.modo_orden);

    const overlay = document.createElement("div");

    overlay.className = "overlayInfo";
    overlay.id = "overlayInfoOrden";

    overlay.innerHTML = `
        <div class="globoInfo">
            <button
                id="cerrarInfoOrden"
                class="cerrarInfo"
            >
                ×
            </button>

            <h3>${info.titulo}</h3>

            <p>${info.descripcion}</p>

            <div class="ejemploInfo">
                ${info.ejemplo}
            </div>

            <h4>Orden de criterios</h4>

            <ol>
                ${
                    info.criterios
                        .map(c => `<li>${c}</li>`)
                        .join("")
                }
            </ol>
        </div>
    `;

    document.body.appendChild(overlay);
}

function cerrarInfoOrden() {
    const overlay =
        document.getElementById("overlayInfoOrden");

    if (overlay) {
        overlay.remove();
    }
}

function obtenerInfoOrden(modo) {
    if (modo === "Opción A") {
        return {
            titulo:
                "Opción A · Rendimiento proporcional",

            descripcion:
                "Prioriza los puntos totales y usa el " +
                "coeficiente para compensar descansos.",

            ejemplo:
                "A: 12 pts / 6 PJ = 2,00<br>" +
                "B: 12 pts / 7 PJ = 1,71<br>" +
                "<strong>A va por delante.</strong>",

            criterios: [
                "Puntos totales",
                "Coeficiente",
                "Diferencia de sets",
                "Sets ganados",
                "Diferencia de juegos",
                "Juegos ganados",
                "Partidos jugados",
                "Sorteo"
            ]
        };
    }

    if (modo === "Opción B") {
        return {
            titulo:
                "Opción B · Constancia y participación",

            descripcion:
                "Premia a quien suma los mismos puntos " +
                "jugando más partidos.",

            ejemplo:
                "A: 12 pts / 6 PJ<br>" +
                "B: 12 pts / 7 PJ<br>" +
                "<strong>B va por delante.</strong>",

            criterios: [
                "Puntos totales",
                "Partidos jugados",
                "Diferencia de sets",
                "Sets ganados",
                "Diferencia de juegos",
                "Juegos ganados",
                "Sorteo"
            ]
        };
    }

    return {
        titulo:
            "Opción C · Eficacia real",

        descripcion:
            "Ordena principalmente por rendimiento por " +
            "partido. Es útil cuando hay descansos o " +
            "distinto número de partidos jugados.",

        ejemplo:
            "A: 12 pts / 6 PJ = 2,00<br>" +
            "B: 11 pts / 5 PJ = 2,20<br>" +
            "<strong>B va por delante.</strong>",

        criterios: [
            "Coeficiente",
            "Puntos totales",
            "Diferencia de sets",
            "Sets ganados",
            "Diferencia de juegos",
            "Juegos ganados",
            "Partidos jugados",
            "Sorteo"
        ]
    };
}
