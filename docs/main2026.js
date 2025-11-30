// =====================================================
//   URL donde se encuentra el JSON generado por Excel
// =====================================================
const DATA_URL = "./estado_torneo.json";

// =====================================================
//   Cargar datos desde JSON (adaptado a páginas separadas)
// =====================================================
async function cargarDatos() {
    try {
        const res = await fetch(DATA_URL + "?v=" + Date.now());
        const data = await res.json();

        // Cargar solo lo que corresponda según el HTML
        if (document.getElementById("clasificacion")) {
            mostrarClasificacion(
                data.clasificacion,
                data.ultima_actualizacion,
                data.modo_orden
            );
        }

        if (document.getElementById("partidos")) {
            mostrarPartidos(data.partidos);
        }

    } catch (err) {
        console.error("Error cargando JSON:", err);

        if (document.getElementById("clasificacion")) {
            document.getElementById("clasificacion").innerHTML =
                "<p>Error cargando datos del servidor.</p>";
        }

        if (document.getElementById("partidos")) {
            document.getElementById("partidos").innerHTML =
                "<p>Error cargando datos del servidor.</p>";
        }
    }
}


// =====================================================
//   Cambiar pestañas de jornadas
// =====================================================
function mostrar(pagina) {
    document.querySelectorAll(".pagina")
        .forEach(p => p.style.display = "none");

    document.getElementById(pagina).style.display = "block";
}


// =====================================================
//   CLASIFICACIÓN — TABLA
// =====================================================
function mostrarClasificacion(lista, fechaActualizacion, modoOrden) {
    const div = document.getElementById("clasificacion");

    // --- Fecha formateada ---
    let fechaFormateada = "Fecha desconocida";
    if (fechaActualizacion) {
        const f = new Date(fechaActualizacion);
        if (!isNaN(f)) {
            fechaFormateada =
                `${String(f.getDate()).padStart(2,"0")}/` +
                `${String(f.getMonth()+1).padStart(2,"0")}/` +
                `${f.getFullYear()} ` +
                `${String(f.getHours()).padStart(2,"0")}:` +
                `${String(f.getMinutes()).padStart(2,"0")}`;
        }
    }

    // ¿Se debe mostrar el coeficiente?
    const mostrarCoef = (modoOrden === "Opción C");

    div.innerHTML = `
        <h2>Clasificación</h2>
        <p class="fecha-actualizacion"><em>Actualizado: ${fechaFormateada}</em></p>
    `;

    // ================================
    // Cálculo de movimientos ▲ ▼ =
    // ================================
    lista.forEach(eq => {
        const actual = Number(eq.posicion_actual || 0);
        const anterior = Number(eq.posicion_anterior || 0);

        eq.movIcon = "";
        eq.movVal = "";
        eq.movClass = "";

        if (anterior === 0 || eq.pj === 0) return;

        const dif = anterior - actual;

        if (dif > 0) {
            eq.movIcon = "▲"; eq.movVal = dif; eq.movClass = "mov-sube";
        } else if (dif < 0) {
            eq.movIcon = "▼"; eq.movVal = -dif; eq.movClass = "mov-baja";
        } else {
            eq.movIcon = "="; eq.movVal = ""; eq.movClass = "mov-igual";
        }
    });

    // ================================
    //   CABECERA DE TABLA
    // ================================
    let html = `
        <div class="tabla-container">
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>POS</th>
                        <th>EQUIPO</th>
                        <th>PTOS</th>
                        ${mostrarCoef ? `<th>COEF</th>` : ""}
                        <th>PJ</th>
                        <th>PG</th>
                        <th>PP</th>
                        <th>Des</th>
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

    // ================================
    //   Filas de datos
    // ================================
    lista.forEach((eq, index) => {
        html += `
            <tr>
                <td class="mov ${eq.movClass}">
                    <span class="mov-icon">${eq.movIcon}</span>
                    <span class="mov-val">${eq.movVal}</span>
                </td>
                <td><strong>${index + 1}</strong></td>
                <td><strong>${eq.equipo}</strong></td>
                <td><strong>${eq.puntos_totales}</stro_

