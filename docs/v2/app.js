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
    const boton = e.target.closest(".navBtn");
    if (!boton) return;

    document.querySelectorAll(".navBtn").forEach(b => {
        b.classList.remove("navActivo");
    });

    boton.classList.add("navActivo");
});
