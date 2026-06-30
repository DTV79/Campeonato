const JSON_URL = "https://raw.githubusercontent.com/DTV79/Campeonato/main/docs/estado_torneo.json";
let datos = null;

document.addEventListener("DOMContentLoaded", iniciarApp);

async function iniciarApp() {
    try {
        const respuesta = await fetch(JSON_URL + "?v=" + Date.now());
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
    if (seccion === "cruces") contenido.innerHTML = "<h2>⚔️ Eliminatorias</h2>";
    if (seccion === "palas") contenido.innerHTML = "<h2>🏖️ Copa Palas Playa</h2>";

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

    let html = `
        <h2>🎾 Partidos</h2>
        <div class="listaJornadas">
    `;

    jornadas.forEach(jornada => {
        const partidosJornada = partidos.filter(p => p.jornada === jornada);
        const jugados = partidosJornada.filter(p => String(p.estado).toLowerCase() === "jugado").length;
        const pendientes = partidosJornada.filter(p => String(p.estado).toLowerCase() === "pendiente").length;
        const abierta = Number(jornada) === Number(jornadaActual);

        html += `
            <section class="bloqueJornada">
                <div class="cabeceraJornada">
                    <div>
                        <h3>Jornada ${jornada}</h3>
                        <p>${jugados} jugados · ${pendientes} pendientes</p>
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

    const resultado = Array.isArray(p.resultado) && p.resultado.length
        ? p.resultado.join(" · ")
        : "Pendiente";

    const claseEstado = estado === "jugado" ? "jugado" : "pendiente";
    const textoEstado = estado === "jugado" ? "✅ Finalizado" : "⏳ Pendiente";

    return `
        <article class="cardPartido ${claseEstado}">
            <div class="estadoPartido">${textoEstado}</div>

            <div class="versusPartido">
                <div class="equipoPartido">${p.local}</div>
                <div class="vs">vs</div>
                <div class="equipoPartido">${p.visitante}</div>
            </div>

            <div class="resultadoPartido">${resultado}</div>

            ${p.ganador ? `<div class="ganadorPartido">🏆 Gana ${p.ganador}</div>` : ""}
        </article>
    `;
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
    if (modo === "Opción A") return "Opción A · Rendimiento proporcional";
    if (modo === "Opción B") return "Opción B · Constancia y participación";
    if (modo === "Opción C") return "Opción C · Eficacia real";
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
