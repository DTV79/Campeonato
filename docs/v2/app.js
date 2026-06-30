const JSON_URL = "../estado_torneo.json";

let datos = null;

document.addEventListener("DOMContentLoaded", iniciarApp);

async function iniciarApp() {
    try {
        const respuesta = await fetch(JSON_URL + "?v=" + Date.now());
        datos = await respuesta.json();

        pintarInicio(datos);

    } catch (error) {
        console.error(error);
        document.body.innerHTML = `
            <div class="contenedor">
                <section class="tarjeta">
                    <h3>⚠️ Error cargando datos</h3>
                    <p>No se pudo leer estado_torneo.json</p>
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
    const partidos = (data.partidos || []).filter(p => p.estado !== "descanso");

    const jugados = partidos.filter(p => 
        String(p.estado).toLowerCase() === "jugado"
    ).length;

    const total = partidos.length;

    const pendientes = total - jugados;

    const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a,b) => a-b);

    const jornadaActual = obtenerJornadaActual(partidos);

    const porcentaje = total > 0 ? Math.round((jugados / total) * 100) : 0;

    document.getElementById("faseActual").innerHTML = `
        Jornada ${jornadaActual}
        <small>${pendientes === 0 ? "finalizada" : "en juego"}</small>
    `;

    document.getElementById("barraProgreso").style.width = porcentaje + "%";

    document.getElementById("textoProgreso").textContent =
        `${jugados} de ${total} partidos disputados · ${porcentaje}%`;
}

function obtenerJornadaActual(partidos) {
    const jornadas = [...new Set(partidos.map(p => p.jornada))].sort((a,b) => a-b);

    for (const j of jornadas) {
        const partidosJornada = partidos.filter(p => p.jornada === j && p.estado !== "descanso");
        const pendientes = partidosJornada.some(p => String(p.estado).toLowerCase() !== "jugado");

        if (pendientes) return j;
    }

    return jornadas[jornadas.length - 1] || 1;
}

function pintarPodio(clasificacion) {
    const podio = document.getElementById("podio");

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
            <strong>${eq.puntos_totales} pts</strong>
        </div>
    `).join("");
}

function pintarTarjetasDashboard(data) {

    const clasificacion = data.clasificacion || [];
    const partidos = (data.partidos || []).filter(p => p.estado !== "descanso");
    const cruces = data.cruces || [];
    const palas = data.palas_playa || [];

    const lider = clasificacion.length ? clasificacion[0].equipo : "Sin datos";

    const jugados = partidos.filter(p =>
        String(p.estado).toLowerCase() === "jugado"
    ).length;

    const pendientes = partidos.length - jugados;

    const jornadaActual = obtenerJornadaActual(partidos);

    const crucesJugados = cruces.filter(p =>
        String(p.estado).toLowerCase() === "finalizado" ||
        String(p.estado).toLowerCase() === "jugado"
    ).length;

    const crucesPendientes = cruces.length - crucesJugados;

    const palasJugados = palas.filter(p =>
        String(p.estado).toLowerCase() === "finalizado" ||
        String(p.estado).toLowerCase() === "jugado"
    ).length;

    const palasPendientes = palas.length - palasJugados;

    document.getElementById("resumenClasificacion").innerHTML =
        `🥇 ${lider}<br>${clasificacion.length} equipos`;

    document.getElementById("resumenPartidos").innerHTML =
        `Jornada ${jornadaActual}<br>${jugados} jugados · ${pendientes} pendientes`;

    document.getElementById("resumenCruces").innerHTML =
        cruces.length
            ? `${crucesJugados} jugados · ${crucesPendientes} pendientes`
            : `Pendientes de generar`;

    document.getElementById("resumenPalas").innerHTML =
        palas.length
            ? `${palasJugados} jugados · ${palasPendientes} pendientes`
            : `Todavía no iniciada`;
}
