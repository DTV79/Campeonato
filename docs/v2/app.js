const JSON_URL = "../estado_torneo.json";

let datos = null;

document.addEventListener("DOMContentLoaded", iniciarApp);

async function iniciarApp() {
    try {
        const respuesta = await fetch(JSON_URL + "?v=" + Date.now());

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el JSON");
        }

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

    const estadoCabecera = document.getElementById("estadoCabecera");
    const barraProgreso = document.getElementById("barraProgreso");
    const textoProgreso = document.getElementById("textoProgreso");

    if (estadoCabecera) {
        estadoCabecera.textContent =
            pendientes === 0
                ? "✅ Jornada " + jornadaActual + " finalizada"
                : "🟢 Jornada " + jornadaActual + " en juego";
    }

    if (barraProgreso) {
        barraProgreso.style.width = porcentaje + "%";
    }

    if (textoProgreso) {
        textoProgreso.textContent =
            `${jugados} de ${total} partidos disputados · ${porcentaje}%`;
    }
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

    const crucesPendientes = cruces.length - crucesJugados;

    const palasJugados = palas.filter(p =>
        ["finalizado", "jugado"].includes(String(p.estado).toLowerCase())
    ).length;

    const palasPendientes = palas.length - palasJugados;

    setHTML("resumenClasificacion", `🥇 ${lider}<br>${clasificacion.length} equipos`);

    setHTML("resumenPartidos", `Jornada ${jornadaActual}<br>${jugados} jugados · ${pendientes} pendientes`);

    setHTML(
        "resumenCruces",
        cruces.length
            ? `${crucesJugados} jugados · ${crucesPendientes} pendientes`
            : "Pendientes de generar"
    );

    setHTML(
        "resumenPalas",
        palas.length
            ? `${palasJugados} jugados · ${palasPendientes} pendientes`
            : "Todavía no iniciada"
    );
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}


document.addEventListener("click", function(e) {

    const card = e.target.closest(".cardAcceso");
    if (card) {
        abrirDetalle(card.dataset.seccion);
        return;
    }

    const botonVolver = e.target.closest("#btnVolver");
    if (botonVolver) {
        mostrarInicio();
        return;
    }

    const nav = e.target.closest(".navBtn");
    if (nav) {
        document.querySelectorAll(".navBtn").forEach(b => b.classList.remove("navActivo"));
        nav.classList.add("navActivo");

        if (nav.dataset.pantalla === "inicio") {
            mostrarInicio();
        }
    }
});

function abrirDetalle(seccion) {

    const cabecera = document.querySelector(".cabecera");
    const dashboard = document.querySelector(".gridDashboard");
    const podio = document.querySelector(".tarjeta");
    const detalle = document.getElementById("vistaDetalle");
    const contenido = document.getElementById("contenidoDetalle");

    cabecera.classList.add("oculto");
    dashboard.classList.add("oculto");
    podio.classList.add("oculto");

    detalle.classList.remove("oculto");

    if (seccion === "clasificacion") {

    let html = `
        <h2>📊 Clasificación</h2>

        <div class="modoOrden">
            🏆 ${datos.modo_orden}
        </div>

        <div class="listaClasificacion">
    `;

    datos.clasificacion.forEach(eq => {

    let movimiento = "—";
    let clase = "igual";

    const dif = eq.posicion_anterior - eq.posicion_actual;

    if (dif > 0){
        movimiento = "▲ " + dif;
        clase = "sube";
    }

    if (dif < 0){
        movimiento = "▼ " + Math.abs(dif);
        clase = "baja";
    }

    const medalla =
        eq.posicion_actual == 1 ? "🥇" :
        eq.posicion_actual == 2 ? "🥈" :
        eq.posicion_actual == 3 ? "🥉" :
        eq.posicion_actual + ".";

    let textoEtiqueta = "";

if (eq.posicion_actual == 1) {
    textoEtiqueta = "⭐ Líder";
} else if (eq.posicion_actual == 2) {
    textoEtiqueta = "🥈 Al acecho";
} else if (eq.posicion_actual == 3) {
    textoEtiqueta = "🥉 En el podio";
} else if (eq.posicion_actual >= 4 && eq.posicion_actual <= 8) {
    textoEtiqueta = "⚔️ Zona Playoff";
} else if (eq.posicion_actual == datos.clasificacion.length) {
    textoEtiqueta = "🥄 Farolillo provisional";
} else {
    textoEtiqueta = "🚣 A remar";
}

const etiqueta = `<div class="etiquetaEspecial">${textoEtiqueta}</div>`;

    html += `
    <div class="filaClasificacion">

        <div class="filaTop">
    <div class="infoEquipo">
        <div class="lineaEquipo">
            <div class="equipoFila">${medalla} ${eq.equipo}</div>
            <div class="${clase} movimientoFila">${movimiento}</div>
        </div>

        <div class="datosFila">
            🏆 ${eq.puntos_totales} pts · 🎾 ${eq.pj} PJ${eq.descanso > 0 ? ` · 💤 ${eq.descanso}` : ""}
        </div>

        ${etiqueta}
    </div>
</div>

<div class="toggleDetalles">
    ▼ Ver estadísticas
</div>

        <div class="detalleClasif oculto">
            <div><span>PG</span><strong>${eq.pg}</strong></div>
            <div><span>PP</span><strong>${eq.pp}</strong></div>
            <div><span>Coeficiente</span><strong>${eq.coeficiente}</strong></div>
            <div><span>Sets</span><strong>${eq.sets_ganados} - ${eq.sets_perdidos} (${eq.sets_diff})</strong></div>
            <div><span>Juegos</span><strong>${eq.puntos_ganados} - ${eq.puntos_perdidos} (${eq.puntos_diff})</strong></div>
        </div>

    </div>
    `;
});

    html += "</div>";

    contenido.innerHTML = html;

}

    if (seccion === "partidos") {
        contenido.innerHTML = "<h2>🎾 Partidos</h2>";
    }

    if (seccion === "cruces") {
        contenido.innerHTML = "<h2>⚔️ Eliminatorias</h2>";
    }

    if (seccion === "palas") {
        contenido.innerHTML = "<h2>🏖️ Copa Palas Playa</h2>";
    }
}

function mostrarInicio() {

    document.querySelector(".cabecera").classList.remove("oculto");
    document.querySelector(".gridDashboard").classList.remove("oculto");
    document.querySelector(".tarjeta").classList.remove("oculto");

    document.getElementById("vistaDetalle").classList.add("oculto");

    document.querySelectorAll(".navBtn").forEach(b => b.classList.remove("navActivo"));

    const btnInicio = document.querySelector('.navBtn[data-pantalla="inicio"]');
    if (btnInicio) btnInicio.classList.add("navActivo");
}


document.addEventListener("click", function(e) {
    const fila = e.target.closest(".filaClasificacion");
    if (!fila) return;

    const detalle = fila.querySelector(".detalleClasif");
    const toggle = fila.querySelector(".toggleDetalles");

    if (!detalle || !toggle) return;

    detalle.classList.toggle("oculto");

    toggle.textContent = detalle.classList.contains("oculto")
        ? "▼ Ver estadísticas"
        : "▲ Ocultar estadísticas";
});
