// =====================================================
//   URL donde se encuentra el JSON generado por Excel
// =====================================================
const DATA_URL = "https://dtv79.github.io/Campeonato/docs/estado_torneo.json";

// =====================================================
//   Cargar datos desde el JSON
// =====================================================
async function cargarDatos() {
    try {
        const res = await fetch(DATA_URL + "?v=" + Date.now()); // evitar caché
        const data = await res.json();

        mostrarClasificacion(data.clasificacion, data.ultima_actualizacion);
        mostrarPartidos(data.partidos);

    } catch (err) {
        console.error("Error cargando JSON:", err);
        document.getElementById("clasificacion").innerHTML =
            "<p>Error cargando datos del servidor.</p>";
    }
}

// =====================================================
//   Cambiar de pestaña
// =====================================================
function mostrar(pagina) {
    document.querySelectorAll('.pagina')
        .forEach(p => p.style.display = 'none');

    document.getElementById(pagina).style.display = 'block';
}

// =====================================================
//   CLASIFICACIÓN — TABLA COMPLETA
// =====================================================
function mostrarClasificacion(lista, fechaActualizacion) {
    const div = document.getElementById("clasificacion");

    // === FORMATEAR FECHA A dd/mm/aaaa hh:mm ===
    let fechaFormateada = "Fecha desconocida";

    if (fechaActualizacion && fechaActualizacion.trim() !== "") {
        const f = new Date(fechaActualizacion);

        if (!isNaN(f.getTime())) {
            const dd = String(f.getDate()).padStart(2, "0");
            const mm = String(f.getMonth() + 1).padStart(2, "0");
            const yyyy = f.getFullYear();
            const hh = String(f.getHours()).padStart(2, "0");
            const min = String(f.getMinutes()).padStart(2, "0");

            fechaFormateada = `${dd}/${mm}/${yyyy} ${hh}:${min}`;
        }
    }

    // === Cabecera + Fecha ===
    div.innerHTML = `
        <h2>Clasificación</h2>
        <p class="fecha-actualizacion"><em>Actualizado: ${fechaFormateada}</em></p>
    `;

    // === Flechas según posición actual vs anterior ===
    lista.forEach(eq => {
        const actual = Number(eq.posicion_actual || 0);
        const anterior = Number(eq.posicion_anterior || 0);

        if (!anterior || anterior === actual) {
            eq.mov = "=";
            eq.movClass = "igual";
        } else if (actual < anterior) {
            eq.mov = "▲";
            eq.movClass = "sube";
        } else {
            eq.mov = "▼";
            eq.movClass = "baja";
        }
    });

    // === INICIO TABLA ===
    let html = `
        <div class="tabla-container">
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>POS</th>
                        <th>EQUIPO</th>
                        <th>PTOS</th>
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

    // === Filas de clasificación ===
    lista.forEach((eq, index) => {
        html += `
            <tr>
                <td class="mov ${eq.movClass}">${eq.mov}</td>
                <td><strong>${index + 1}</strong></td>
                <td><strong>${eq.equipo}</strong></td>
                <td><strong>${eq.puntos_totales}</strong></td>
                <td>${eq.pj}</td>
                <td>${eq.pg}</td>
                <td>${eq.pp}</td>
                <td>${eq.descanso}</td>
                <td>${eq.sets_ganados}</td>
                <td>${eq.sets_perdidos}</td>
                <td>${eq.sets_diff}</td>
                <td>${eq.puntos_ganados}</td>
                <td>${eq.puntos_perdidos}</td>
                <td>${eq.puntos_diff}</td>
            </tr>
        `;
    });

    // === Final tabla ===
    html += `
                </tbody>
            </table>
        </div>
    `;

    // === Leyenda pequeña y en cursiva ===
    html += `
        <div class="leyenda">
            <em>
            PTOS: Puntos Totales / PJ: Partidos Jugados /
            PG: Partidos Ganados / PP: Partidos Perdidos /
            Des: Descanso / SG: Sets Ganados /
            SP: Sets Perdidos / SD: Diferencia de Sets /
            PGan: Puntos Ganados / PPer: Puntos Perdidos /
            PDif: Diferencia de Puntos
            </em>
        </div>
    `;

    div.innerHTML += html;
}

// =====================================================
//   PARTIDOS — (más adelante lo completaremos)
// =====================================================
function mostrarPartidos(lista) {
    const div = document.getElementById("partidos");
    div.innerHTML = "<h2>Partidos</h2>";
}

// =====================================================
//   Ejecutar carga inicial
// =====================================================
cargarDatos();
