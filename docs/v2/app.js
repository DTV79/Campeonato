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
        document.body.innerHTML = `
            <div class="contenedor">
                <section class="tarjeta">
                    <h3>⚠️ Error cargando datos</h3>
                    <p>${error.message}</p>
                </section>
            </div>
        `;
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

    if (!fechaISO) {
        el.textContent = "--";
        return;
    }

    const fecha = new Date(fechaISO);
    el.textContent = fecha.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function pintarEstado(data) {
    const partidos = (data.partidos || []).filter(p =>
        String(p.estado).toLowerCase() !== "descanso"
    );

    const jugados = partidos.filter(p =>
        String(p.estado).toLowerCase() === "jugado"
    ).length;

    const total = partidos.length;
    const pendientes = total - jugados;
    const jornadaActual = obtenerJornadaActual(partidos);
    const porcentaje = total > 0 ? Math.round((jugados / total) * 100) : 0;

    setText(
        "estadoCabecera",
        pendientes === 0
            ? "✅ Jornada " + jornadaActual + " finalizada"
            : "🟢 Jornada " + jornadaActual + " en juego"
    );

    const barra = document.getElementById("barraProgreso");
    if (barra) barra.style.width = porcentaje + "%";

    setText("textoProgreso", `${jugados} de ${total} partidos disputados · ${porcentaje}%`);
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

    if (!clasificacion.length) {
        podio.textContent = "Sin clasificación";
        return;
    }

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
    const partidos = (data.partidos || []).filter(p =>
        String(p.estado).toLowerCase() !== "descanso"
    );
    const cruces = data.cruces || [];
    const palas = data.palas_playa || [];

    const lider = clasificacion.length ? clasificacion[0].equipo : "Sin datos";

    const jugados = partidos.filter(p =>
        String(p.estado).toLowerCase() === "jugado"
    ).length;

    const pendientes = partidos.length - jugados;
    const jornadaActual = obtenerJornadaActual(partidos);

    const crucesJugados = cruces.filter(p =>
        ["finalizado", "jugado"].includes(String(p.estado).toLowerCase())
    ).length;

    const palasJugados = palas.filter(p =>
        ["finalizado", "jugado"].includes(String(p.estado).toLowerCase())
    ).length;

    setHTML("resumenClasificacion", `🥇 ${lider}<br>${clasificacion.length} equipos`);
    setHTML("resumenPartidos", `Jornada ${jornadaActual}<br>${jugados} jugados · ${pendientes} pendientes`);

    setHTML(
        "resumenCruces",
        cruces.length
            ? `${crucesJugados} jugados · ${cruces.length - crucesJugados} pendientes`
            : "Pendientes de generar"
    );

    setHTML(
        "resumenPalas",
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
    const cabecera = document.querySelector(".cabecera");
    const dashboard = document.querySelector(".gridDashboard");
    const podio = document.querySelector(".podioCard");
    const detalle = document.getElementById("vistaDetalle");
    const contenido = document.getElementById("contenidoDetalle");

    cabecera.classList.add("oculto");
    dashboard.classList.add("oculto");
    podio.classList.add("oculto");
    detalle.classList.remove("oculto");

    if (seccion === "clasificacion") pintarPantallaClasificacion(contenido);
    if (seccion === "partidos") contenido.innerHTML = "<h2>🎾 Partidos</h2>";
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

function pintarPantallaClasificacion(contenido) {
    let html = `
        <h2>📊 Clasificación</h2>

       <div class="modoOrden">
    <div>
        <span>🏆 Sistema de clasificación</span>
        <strong>${textoModoOrden(datos.modo_orden)}</strong>
    </div>

    <button class="btnInfoOrden" id="btnInfoOrden" type="button">
        ℹ️
    </button>
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

                    <div class="grupoStats">
                        <h5>Coeficiente</h5>
                        <div><span>Coeficiente</span><strong>${eq.coeficiente}</strong></div>
                    </div>

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
                        <th>COEF</th>
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
                <td>
                <span class="${mov.clase} movTabla">${mov.texto}</span>
                </td>
                <td>
                <strong>${eq.posicion_actual}</strong>
                </td>
                <td class="equipoTabla">${eq.equipo}</td>
                <td>${eq.puntos_totales}</td>
                <td>${eq.coeficiente}</td>
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

function formatoDiff(valor) {
    const n = Number(valor);
    if (n > 0) return "+" + n;
    return String(n);
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function setText(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}



function textoModoOrden(modo) {
    if (modo === "Opción A") return "Opción A · Rendimiento proporcional";
    if (modo === "Opción B") return "Opción B · Constancia y participación";
    if (modo === "Opción C") return "Opción C · Eficacia real";
    return modo || "Sistema no definido";
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
            descripcion: "Prioriza la eficacia por partido jugado, pero manteniendo los puntos totales como primer criterio.",
            ejemplo: "A: 12 pts / 6 PJ = 2,00<br>B: 12 pts / 7 PJ = 1,71<br><strong>A va por delante.</strong>",
            criterios: [
                "Puntos totales",
                "Coeficiente de puntos",
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
            titulo: "Opción B · Constancia y participación",
            descripcion: "Premia a quien suma los mismos puntos jugando más partidos.",
            ejemplo: "A: 12 pts / 6 PJ<br>B: 12 pts / 7 PJ<br><strong>B va por delante.</strong>",
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
        titulo: "Opción C · Eficacia real",
        descripcion: "Ordena principalmente por rendimiento por partido. Es útil cuando hay descansos o equipos con distinto número de partidos.",
        ejemplo: "A: 12 pts / 6 PJ = 2,00<br>B: 11 pts / 5 PJ = 2,20<br><strong>B va por delante.</strong>",
        criterios: [
            "Coeficiente puro",
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
