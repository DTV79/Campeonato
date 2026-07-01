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

function pintarInicio(data) {
    pintarFecha(data.ultima_actualizacion);
    pintarEstado(data);
    pintarPodio(data.clasificacion || []);
    pintarTarjetasDashboard(data);
    mostrarBotonCruces(data);
}

function pintarFecha(fechaISO) {
    const el = document.getElementById("ultimaActualizacion");
    if (!el) return;

    const fecha = new Date(fechaISO);
    el.textContent = fecha.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function pintarEstado(data) {
    const partidos = (data.partidos || []).filter(p => String(p.estado).toLowerCase() !== "descanso");
    const jornadaActual = obtenerJornadaActual(partidos);

    const partidosJornada = partidos.filter(p => Number(p.jornada) === Number(jornadaActual));
    const jugados = partidosJornada.filter(p => String(p.estado).toLowerCase() === "jugado").length;
    const total = partidosJornada.length;
    const porcentaje = total > 0 ? Math.round((jugados / total) * 100) : 0;

    setText("estadoCabecera", jugados === total
        ? `✅ Jornada ${jornadaActual} finalizada`
        : `🟢 Jornada ${jornadaActual} en juego`
    );

    const barra = document.getElementById("barraProgreso");
    if (barra) barra.style.width = porcentaje + "%";

    setText("textoProgreso", `${jugados} de ${total} partidos de la jornada · ${porcentaje}%`);
}

function obtenerJornadaActual(partidos) {
    const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a, b) => a - b);

    for (const j of jornadas) {
        const partidosJornada = partidos.filter(p =>
            p.jornada === j &&
            String(p.estado).toLowerCase() !== "descanso"
        );

        const hayPendientes = partidosJornada.some(p =>
            String(p.estado).toLowerCase() !== "jugado"
        );

        if (hayPendientes) return j;
    }

    return jornadas[jornadas.length - 1] || 1;
}

function pintarPodio(clasificacion) {
    const podio = document.getElementById("podio");
    if (!podio) return;

    const top3 = clasificacion.slice(0, 3);
    const clases = ["oro", "plata", "bronce"];
    const medallas = ["🥇", "🥈", "🥉"];

    podio.innerHTML = top3.map((eq, i) => `
        <div class="equipoPodio ${clases[i]}">
            <span>${medallas[i]} ${eq.equipo}</span>
        </div>
    `).join("");
}

function pintarTarjetasDashboard(data) {
    const clasificacion = data.clasificacion || [];
    const partidos = (data.partidos || []).filter(p => String(p.estado).toLowerCase() !== "descanso");
    const cruces = data.cruces || [];
    const palas = data.palas_playa || [];

    const lider = clasificacion.length ? clasificacion[0].equipo : "Sin datos";
    const jornadaActual = obtenerJornadaActual(partidos);

    const partidosJornada = partidos.filter(p => Number(p.jornada) === Number(jornadaActual));
    const jugadosJornada = partidosJornada.filter(p => String(p.estado).toLowerCase() === "jugado").length;
    const pendientesJornada = partidosJornada.length - jugadosJornada;

    const crucesJugados = cruces.filter(p =>
        ["finalizado", "jugado"].includes(String(p.estado).toLowerCase())
    ).length;

    const palasJugados = palas.filter(p =>
        ["finalizado", "jugado"].includes(String(p.estado).toLowerCase())
    ).length;

    setHTML("resumenClasificacion", `🥇 ${lider}<br>${clasificacion.length} equipos`);
    setHTML("resumenPartidos", `Jornada ${jornadaActual}<br>${jugadosJornada} jugados · ${pendientesJornada} pendientes`);

    setHTML("resumenCruces",
        cruces.length
            ? `${crucesJugados} jugados · ${cruces.length - crucesJugados} pendientes`
            : "Pendientes de generar"
    );

    setHTML("resumenPalas",
        palas.length
            ? `${palasJugados} jugados · ${palas.length - palasJugados} pendientes`
            : "Todavía no iniciada"
    );
}

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
        pintarPantallaClasificacion(document.getElementById("contenidoDetalle"));
        return;
    }

    const cabeceraJornada = e.target.closest(".cabeceraJornada");
    if (cabeceraJornada) {
        const bloque = cabeceraJornada.closest(".bloqueJornada");
        const lista = bloque.querySelector(".listaPartidos");
        const flecha = bloque.querySelector(".flechaJornada");

        lista.classList.toggle("oculto");
        flecha.textContent = lista.classList.contains("oculto") ? "▶" : "▼";
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
    document.querySelector(".cabecera").classList.add("oculto");
    document.querySelector(".gridDashboard").classList.add("oculto");
    document.querySelector(".podioCard").classList.add("oculto");

    const detalle = document.getElementById("vistaDetalle");
    const contenido = document.getElementById("contenidoDetalle");

    detalle.classList.remove("oculto");

    if (seccion === "clasificacion") pintarPantallaClasificacion(contenido);
    if (seccion === "partidos") pintarPantallaPartidos(contenido);
    if (seccion === "cruces") pintarPantallaCruces(contenido);
    if (seccion === "palas") pintarPantallaPalas(contenido);

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

/* =========================
   CLASIFICACIÓN
========================= */

function pintarPantallaClasificacion(contenido) {
    const mostrarCoef = mostrarCoeficiente();

    let html = `
        <h2>📊 Clasificación</h2>

        <div class="modoOrden">
            <div>
                <span>🏆 Sistema de clasificación</span>
                <strong>${textoModoOrden(datos.modo_orden)}</strong>
            </div>

            <button class="btnInfoOrden" id="btnInfoOrden" type="button">ℹ️</button>
        </div>

        <button class="btnVistaCompleta" id="btnVistaCompleta">
            📋 Ver clasificación completa
        </button>

        <div class="listaClasificacion">
    `;

    datos.clasificacion.forEach(eq => {
        const mov = obtenerMovimiento(eq);

        const medalla =
            eq.posicion_actual == 1 ? "🥇" :
            eq.posicion_actual == 2 ? "🥈" :
            eq.posicion_actual == 3 ? "🥉" :
            eq.posicion_actual + ".";

        html += `
            <article class="filaClasificacion">
                <div class="lineaEquipo">
                    <div class="equipoFila">${medalla} ${eq.equipo}</div>
                    <div class="${mov.clase} movimientoFila">${mov.texto}</div>
                </div>

                <div class="datosFila">
                    🔢 ${eq.puntos_totales} pts · 🎾 ${eq.pj} PJ${eq.descanso > 0 ? ` · 💤 ${eq.descanso}` : ""}
                </div>

                <div class="etiquetaEspecial">${obtenerEtiqueta(eq)}</div>

                <div class="toggleDetalles">▼ Ver estadísticas</div>

                <div class="detalleClasif oculto">
                    <div class="grupoStats">
                        <h5>Partidos</h5>
                        <div><span>Ganados</span><strong>${eq.pg}</strong></div>
                        <div><span>Perdidos</span><strong>${eq.pp}</strong></div>
                    </div>

                    ${mostrarCoef ? `
                    <div class="grupoStats">
                        <h5>Coeficiente</h5>
                        <div><span>Coeficiente</span><strong>${eq.coeficiente}</strong></div>
                    </div>` : ""}

                    <div class="grupoStats">
                        <h5>Sets</h5>
                        <div><span>Ganados</span><strong>${eq.sets_ganados}</strong></div>
                        <div><span>Perdidos</span><strong>${eq.sets_perdidos}</strong></div>
                        <div><span>Diferencia</span><strong>${formatoDiff(eq.sets_diff)}</strong></div>
                    </div>

                    <div class="grupoStats">
                        <h5>Juegos</h5>
                        <div><span>Ganados</span><strong>${eq.puntos_ganados}</strong></div>
                        <div><span>Perdidos</span><strong>${eq.puntos_perdidos}</strong></div>
                        <div><span>Diferencia</span><strong>${formatoDiff(eq.puntos_diff)}</strong></div>
                    </div>
                </div>
            </article>
        `;
    });

    html += `</div>`;
    contenido.innerHTML = html;
}

function pintarClasificacionCompleta() {
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
                        <th>PGan</th>
                        <th>PPer</th>
                        <th>PDif</th>
                    </tr>
                </thead>
                <tbody>
    `;

    datos.clasificacion.forEach(eq => {
        const mov = obtenerMovimiento(eq);

        html += `
            <tr>
                <td><span class="${mov.clase} movTabla">${mov.texto}</span></td>
                <td><strong>${eq.posicion_actual}</strong></td>
                <td class="equipoTabla">${eq.equipo}</td>
                <td>${eq.puntos_totales}</td>
                ${mostrarCoef ? `<td>${eq.coeficiente}</td>` : ""}
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

/* =========================
   PARTIDOS
========================= */

function pintarPantallaPartidos(contenido) {
    const partidos = datos.partidos || [];
    const partidosNoDescanso = partidos.filter(p => String(p.estado).toLowerCase() !== "descanso");
    const jornadaActual = obtenerJornadaActual(partidosNoDescanso);
    const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a, b) => a - b);

    const partidosJornadaActual = partidosNoDescanso.filter(p => Number(p.jornada) === Number(jornadaActual));
    const jugadosActual = partidosJornadaActual.filter(p => String(p.estado).toLowerCase() === "jugado").length;
    const totalActual = partidosJornadaActual.length;
    const pendientesActual = totalActual - jugadosActual;
    const porcentaje = totalActual > 0 ? Math.round((jugadosActual / totalActual) * 100) : 0;

    let html = `
        <h2>🎾 Partidos</h2>

        <section class="resumenPartidos">
            <div class="estadoResumen">
            ${pendientesActual === 0 ? "✅ Jornada " + jornadaActual + " finalizada" : "🟢 Jornada " + jornadaActual + " en juego"}
            </div>
            <div class="barra">
                <div class="progreso" style="width:${porcentaje}%"></div>
            </div>
            <p>${jugadosActual} jugados · ${pendientesActual} pendientes · ${porcentaje}%</p>
        </section>

        <div class="listaJornadas">
    `;

    jornadas.forEach(jornada => {
        const partidosJornada = partidos.filter(p => Number(p.jornada) === Number(jornada));
        const noDescanso = partidosJornada.filter(p => String(p.estado).toLowerCase() !== "descanso");

        const jugados = noDescanso.filter(p => String(p.estado).toLowerCase() === "jugado").length;
        const pendientes = noDescanso.filter(p => String(p.estado).toLowerCase() === "pendiente").length;
        const total = noDescanso.length;

        const abierta = Number(jornada) === Number(jornadaActual);

        let estadoJornada = "⏳ Próxima";
        let claseEstado = "proxima";

        if (pendientes === 0 && total > 0) {
            estadoJornada = "✅ Finalizada";
            claseEstado = "finalizada";
        }

        if (Number(jornada) === Number(jornadaActual) && pendientes > 0) {
            estadoJornada = "🟢 En juego";
            claseEstado = "enJuego";
        }

        html += `
            <section class="bloqueJornada">
                <div class="cabeceraJornada ${claseEstado}">
                    <div>
                        <span class="chipJornada">${estadoJornada}</span>
                        <h3>Jornada ${jornada}</h3>
                        <p>${jugados}/${total} partidos</p>
                    </div>
                    <span class="flechaJornada">${abierta ? "▼" : "▶"}</span>
                </div>

                <div class="listaPartidos ${abierta ? "" : "oculto"}">
                    ${partidosJornada.map(p => pintarCardPartido(p)).join("")}
                </div>
            </section>
        `;
    });

    html += `</div>`;
    contenido.innerHTML = html;
}

function pintarCardPartido(p) {
    const estado = String(p.estado).toLowerCase();

    if (estado === "descanso") {
        return `
            <article class="cardPartido descanso">
                <div class="estadoPartido">💤 Descanso</div>
                <div class="equipoPartido">${p.local}</div>
            </article>
        `;
    }

    const localJugadores = dividirEquipo(p.local);
    const visitanteJugadores = dividirEquipo(p.visitante);
    const sets = obtenerSets(p.resultado);

    const claseEstado = estado === "jugado" ? "jugado" : "pendiente";
    const textoEstado = estado === "jugado" ? "✅ Finalizado" : "⏳ Pendiente";

    const localGana = p.ganador && normalizar(p.ganador) === normalizar(p.local);
    const visitanteGana = p.ganador && normalizar(p.ganador) === normalizar(p.visitante);

    return `
        <article class="cardPartido marcador ${claseEstado}">

            <div class="estadoPartido">${textoEstado}</div>

            <div class="marcadorHeader">
                <div></div>
                <div>I</div>
                <div>II</div>
                <div>III</div>
            </div>

            <div class="filaMarcador ${localGana ? "ganadorFila" : ""}">
                <div class="nombreEquipoMarcador">
                ${localJugadores.map(j => `<strong>${j}</strong>`).join("")}
                </div>
                <div>${sets[0].local}</div>
                <div>${sets[1].local}</div>
                <div>${sets[2].local}</div>
            </div>

            <div class="filaMarcador ${visitanteGana ? "ganadorFila" : ""}">
                <div class="nombreEquipoMarcador">
                ${visitanteJugadores.map(j => `<strong>${j}</strong>`).join("")}
                </div>
                <div>${sets[0].visitante}</div>
                <div>${sets[1].visitante}</div>
                <div>${sets[2].visitante}</div>
            </div>

        </article>
    `;
}

function dividirEquipo(nombre) {
    return String(nombre || "")
        .split("/")
        .map(j => j.trim())
        .filter(Boolean);
}

function obtenerSets(resultado) {
    const sets = [
        { local: "-", visitante: "-" },
        { local: "-", visitante: "-" },
        { local: "-", visitante: "-" }
    ];

    if (!Array.isArray(resultado)) return sets;

    resultado.slice(0, 3).forEach((set, i) => {
        const partes = String(set).split("-");
        sets[i].local = partes[0] || "-";
        sets[i].visitante = partes[1] || "-";
    });

    return sets;
}

function normalizar(txt) {
    return String(txt || "").trim().toUpperCase();
}

/* =========================
   AUXILIARES
========================= */

function mostrarCoeficiente() {
    return datos.modo_orden === "Opción C";
}

function obtenerMovimiento(eq) {
    const dif = eq.posicion_anterior - eq.posicion_actual;
    if (dif > 0) return { texto: "▲ " + dif, clase: "sube" };
    if (dif < 0) return { texto: "▼ " + Math.abs(dif), clase: "baja" };
    return { texto: "—", clase: "igual" };
}

function obtenerEtiqueta(eq) {
    if (eq.posicion_actual == 1) return "⭐ Líder";
    if (eq.posicion_actual == 2) return "🥈 Al acecho";
    if (eq.posicion_actual == 3) return "🥉 Podio";
    if (eq.posicion_actual >= 4 && eq.posicion_actual <= 8) return "⚔️ Playoff";
    if (eq.posicion_actual == datos.clasificacion.length) return "🥄 Farolillo";
    return "🚣 A remar";
}

function textoModoOrden(modo) {
    if (modo === "Opción A") return "· Rendimiento proporcional";
    if (modo === "Opción B") return "· Constancia y participación";
    if (modo === "Opción C") return "· Eficacia real";
    return modo || "Sistema no definido";
}

function formatoDiff(valor) {
    const n = Number(valor);
    if (n > 0) return "+" + n;
    return String(n);
}

function mostrarInicio() {
    document.querySelector(".cabecera").classList.remove("oculto");
    document.querySelector(".gridDashboard").classList.remove("oculto");
    document.querySelector(".podioCard").classList.remove("oculto");
    document.getElementById("vistaDetalle").classList.add("oculto");
    activarNav("inicio");
}

function activarNav(pantalla) {
    document.querySelectorAll(".navBtn").forEach(b => b.classList.remove("navActivo"));
    const btn = document.querySelector(`.navBtn[data-pantalla="${pantalla}"]`);
    if (btn) btn.classList.add("navActivo");
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function setText(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}


function mostrarInfoOrden() {
    const info = obtenerInfoOrden(datos.modo_orden);

    const overlay = document.createElement("div");
    overlay.className = "overlayInfo";
    overlay.id = "overlayInfoOrden";

    overlay.innerHTML = `
        <div class="globoInfo">
            <button id="cerrarInfoOrden" class="cerrarInfo">×</button>

            <h3>${info.titulo}</h3>
            <p>${info.descripcion}</p>

            <div class="ejemploInfo">
                ${info.ejemplo}
            </div>

            <h4>Orden de criterios</h4>
            <ol>
                ${info.criterios.map(c => `<li>${c}</li>`).join("")}
            </ol>
        </div>
    `;

    document.body.appendChild(overlay);
}

function cerrarInfoOrden() {
    const overlay = document.getElementById("overlayInfoOrden");
    if (overlay) overlay.remove();
}

function obtenerInfoOrden(modo) {
    if (modo === "Opción A") {
        return {
            titulo: "Opción A · Rendimiento proporcional",
            descripcion: "Prioriza los puntos totales y usa el coeficiente para compensar descansos.",
            ejemplo: "A: 12 pts / 6 PJ = 2,00<br>B: 12 pts / 7 PJ = 1,71<br><strong>A va por delante.</strong>",
            criterios: ["Puntos totales", "Coeficiente", "Diferencia de sets", "Sets ganados", "Diferencia de juegos", "Juegos ganados", "Partidos jugados", "Sorteo"]
        };
    }

    if (modo === "Opción B") {
        return {
            titulo: "Opción B · Constancia y participación",
            descripcion: "Premia a quien suma los mismos puntos jugando más partidos.",
            ejemplo: "A: 12 pts / 6 PJ<br>B: 12 pts / 7 PJ<br><strong>B va por delante.</strong>",
            criterios: ["Puntos totales", "Partidos jugados", "Diferencia de sets", "Sets ganados", "Diferencia de juegos", "Juegos ganados", "Sorteo"]
        };
    }

    return {
        titulo: "Opción C · Eficacia real",
        descripcion: "Ordena principalmente por rendimiento por partido. Es útil cuando hay descansos o distinto número de partidos jugados.",
        ejemplo: "A: 12 pts / 6 PJ = 2,00<br>B: 11 pts / 5 PJ = 2,20<br><strong>B va por delante.</strong>",
        criterios: ["Coeficiente", "Puntos totales", "Diferencia de sets", "Sets ganados", "Diferencia de juegos", "Juegos ganados", "Partidos jugados", "Sorteo"]
    };
}


function pintarPantallaCruces(contenido) {
    const cruces = datos.cruces || [];

    if (!cruces.length) {
        contenido.innerHTML = `
            <h2>⚔️ Eliminatorias</h2>
            <section class="tarjetaVacia">
                <h3>⏳ Todavía no generadas</h3>
                <p>Las eliminatorias aparecerán aquí cuando se creen desde Excel.</p>
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
        const partidosFase = cruces.filter(c => c.fase === fase);
        const jugados = partidosFase.filter(c =>
            ["finalizado", "jugado"].includes(String(c.estado).toLowerCase())
        ).length;

        const pendientes = partidosFase.length - jugados;

        html += `
            <section class="bloqueJornada">
                <div class="cabeceraJornada ${pendientes === 0 ? "finalizada" : "enJuego"}">
                    <div>
                        <span class="chipJornada">
                            ${pendientes === 0 ? "✅ Finalizada" : "🟢 En juego"}
                        </span>
                        <h3>${fase}</h3>
                        <p>${jugados}/${partidosFase.length} partidos</p>
                    </div>
                    <span class="flechaJornada">${abierta ? "▼" : "▶"}</span>
                </div>

                <div class="listaPartidos ${abierta ? "" : "oculto"}">
                    ${partidosFase.map(p => pintarCardCruce(p)).join("")}
                </div>
            </section>
        `;
    });

    html += `</div>`;
    contenido.innerHTML = html;
}

function pintarCardCruce(p) {
    const local = p.local || p.equipo1 || p.equipo_a || p.jugador1 || "";
    const visitante = p.visitante || p.equipo2 || p.equipo_b || p.jugador2 || "";
    const estado = String(p.estado).toLowerCase();
    const sets = obtenerSets(p.resultado);

    const finalizado = ["finalizado", "jugado"].includes(estado);
    const claseEstado = finalizado ? "jugado" : "pendiente";
    const textoEstado = finalizado ? "✅ Finalizado" : "⏳ Pendiente";

    const localGana = p.ganador && normalizar(p.ganador) === normalizar(local);
    const visitanteGana = p.ganador && normalizar(p.ganador) === normalizar(visitante);

    return `
        <article class="cardPartido marcador ${claseEstado}">

            <div class="estadoPartido">${textoEstado}</div>

            <div class="marcadorHeader">
                <div></div>
                <div>I</div>
                <div>II</div>
                <div>III</div>
            </div>

            <div class="filaMarcador ${localGana ? "ganadorFila" : ""}">
                <div class="nombreEquipoMarcador">
                    ${dividirEquipo(local).map(j => `<strong>${j}</strong>`).join("")}
                </div>
                <div>${sets[0].local}</div>
                <div>${sets[1].local}</div>
                <div>${sets[2].local}</div>
            </div>

            <div class="filaMarcador ${visitanteGana ? "ganadorFila" : ""}">
                <div class="nombreEquipoMarcador">
                    ${dividirEquipo(visitante).map(j => `<strong>${j}</strong>`).join("")}
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
        const partidosFase = cruces.filter(c => c.fase === fase);

        const hayPendientes = partidosFase.some(c =>
            !["finalizado", "jugado"].includes(String(c.estado).toLowerCase())
        );

        if (hayPendientes) return fase;
    }

    return fases[fases.length - 1] || "";
}


function mostrarBotonCruces(data) {
    const btn = document.querySelector(".navCruces");
    if (!btn) return;

    const cruces = data.cruces || [];

    if (cruces.length > 0) {
        btn.classList.remove("oculto");
    } else {
        btn.classList.add("oculto");
    }
}


function pintarPantallaPalas(contenido) {
    const rondas = datos.palas_playa || [];

    if (!rondas.length) {
        contenido.innerHTML = `
            <h2>🏖️ Copa Palas Playa</h2>
            <section class="tarjetaVacia">
                <h3>⏳ Todavía no iniciada</h3>
                <p>Aquí aparecerán los partidos cuando se genere la Copa Palas Playa desde Excel.</p>
            </section>
        `;
        return;
    }

    const rondaActual = obtenerRondaActualPalas(rondas);

    let html = `
        <h2>🏖️ Copa Palas Playa</h2>

        <section class="resumenPartidos resumenPalas">
            <div class="estadoResumen">🥄 El que pierde sigue jugando</div>
            <p>Ganar un partido significa salvarse del farolillo.</p>
        </section>

        <div class="listaJornadas">
    `;

    rondas.forEach(ronda => {
        const partidos = ronda.partidos || [];
        const abierta = Number(ronda.ronda) === Number(rondaActual);

        const jugados = partidos.filter(p =>
            ["jugado", "finalizado"].includes(String(p.estado).toLowerCase())
        ).length;

        const pendientes = partidos.length - jugados;

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
                        <span class="chipJornada">${estadoRonda}</span>
                        <h3>${ronda.nombre || "Ronda " + ronda.ronda}</h3>
                        <p>${jugados}/${partidos.length} partidos</p>
                        ${ronda.descansa ? `<p>💤 Descansa: <strong>${ronda.descansa}</strong></p>` : ""}
                    </div>
                    <span class="flechaJornada">${abierta ? "▼" : "▶"}</span>
                </div>

                <div class="listaPartidos ${abierta ? "" : "oculto"}">
                    ${partidos.map(p => pintarCardPalas(p)).join("")}
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

        const hayPendientes = partidos.some(p =>
            !["jugado", "finalizado"].includes(String(p.estado).toLowerCase())
        );

        if (hayPendientes) return ronda.ronda;
    }

    return rondas[rondas.length - 1]?.ronda || 1;
}


function pintarCardPalas(p) {
    const local = p.local || p.equipo1 || p.equipo_a || p.jugador1 || "";
    const visitante = p.visitante || p.equipo2 || p.equipo_b || p.jugador2 || "";
    const estado = String(p.estado).toLowerCase();
    const sets = obtenerSets(p.resultado);

    const finalizado = ["finalizado", "jugado"].includes(estado);
    const textoEstado = finalizado ? "✅ Finalizado" : "⏳ Pendiente";

    const localGana = p.ganador && normalizar(p.ganador) === normalizar(local);
    const visitanteGana = p.ganador && normalizar(p.ganador) === normalizar(visitante);

    const localPierde = finalizado && visitanteGana;
    const visitantePierde = finalizado && localGana;

    const salvado = localGana ? local : visitanteGana ? visitante : "";
    const sigue = localPierde ? local : visitantePierde ? visitante : "";

    return `
        <article class="cardPartido marcador pendientePalas">

            <div class="estadoPartido">${textoEstado}</div>

            <div class="marcadorHeader">
                <div></div>
                <div>I</div>
                <div>II</div>
                <div>III</div>
            </div>

            <div class="filaMarcador ${localPierde ? "perdedorPalas" : ""}">
                <div class="nombreEquipoMarcador">
                    ${dividirEquipo(local).map(j => `<strong>${j}</strong>`).join("")}
                </div>
                <div>${sets[0].local}</div>
                <div>${sets[1].local}</div>
                <div>${sets[2].local}</div>
            </div>

            <div class="filaMarcador ${visitantePierde ? "perdedorPalas" : ""}">
                <div class="nombreEquipoMarcador">
                    ${dividirEquipo(visitante).map(j => `<strong>${j}</strong>`).join("")}
                </div>
                <div>${sets[0].visitante}</div>
                <div>${sets[1].visitante}</div>
                <div>${sets[2].visitante}</div>
            </div>

            ${finalizado ? `
                <div class="infoPalas">
                    🛟 Se salva: <strong>${salvado}</strong><br>
                    🥄 Sigue en la lucha: <strong>${sigue}</strong>
                </div>
            ` : ""}
        </article>
    `;
}
