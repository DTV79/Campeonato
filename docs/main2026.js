// =====================================================
//   URL donde se encuentra el JSON generado por Excel
// =====================================================
const DATA_URL = "./estado_torneo.json";

// =====================================================
//   Cargar datos desde el JSON
// =====================================================
async function cargarDatos() {
    try {
        const res = await fetch(DATA_URL + "?v=" + Date.now());
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
//   Cambiar de pestaña (Clasificación / Partidos)
// =====================================================
function mostrar(pagina) {
    document.querySelectorAll(".pagina")
        .forEach(p => p.style.display = "none");

    document.getElementById(pagina).style.display = "block";
}

// =====================================================
//   CLASIFICACIÓN — TABLA COMPLETA
// =====================================================
function mostrarClasificacion(lista, fechaActualizacion) {
    const div = document.getElementById("clasificacion");

    // Formatear fecha
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

    div.innerHTML = `
        <h2>Clasificación</h2>
        <p class="fecha-actualizacion"><em>Actualizado: ${fechaFormateada}</em></p>
    `;

    // Calcular flechas sin eliminar filas
    lista.forEach(eq => {
        const actual = Number(eq.posicion_actual || 0);
        const anterior = Number(eq.posicion_anterior || 0);
        eq.mov = "";
        eq.movClass = "";

        if (anterior > 0 && eq.pj > 0) {
            if (actual < anterior) {
                eq.mov = "▲";
                eq.movClass = "sube";
            } else if (actual > anterior) {
                eq.mov = "▼";
                eq.movClass = "baja";
            } else {
                eq.mov = "=";
                eq.movClass = "igual";
            }
        } else {
            // Jornada 1 → sin flecha
            eq.mov = "";
            eq.movClass = "";
        }
    });

    // Generar HTML de la tabla
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

    html += `
                </tbody>
            </table>
        </div>
    `;

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
//   PARTIDOS — pestañas por jornada + tabla de sets
// =====================================================
function mostrarPartidos(lista) {
    const div = document.getElementById("partidos");

    // 1) Agrupar por jornada
    const jornadas = {};
    lista.forEach(p => {
        const j = Number(p.jornada || 0);
        if (!jornadas[j]) jornadas[j] = [];
        jornadas[j].push(p);
    });

    const jornadasOrdenadas = Object.keys(jornadas)
        .map(Number)
        .sort((a, b) => a - b);

    if (jornadasOrdenadas.length === 0) {
        div.innerHTML = "<p>No hay partidos.</p>";
        return;
    }

    // 2) Crear pestañas
    let tabs = `<div class="tabs">`;
    jornadasOrdenadas.forEach((j, idx) => {
        tabs += `
            <button class="tab-btn ${idx === 0 ? "activa" : ""}"
                    onclick="cambiarJornada(${j}, event)">
                Jornada ${j}
            </button>`;
    });
    tabs += `</div>`;

    // 3) Crear contenedores de cada jornada
    let contenido = "";
    jornadasOrdenadas.forEach((j, idx) => {
        contenido += `
            <div id="jornada_${j}" class="jornada-contenido"
                 style="display:${idx === 0 ? "block" : "none"};">
                ${generarHTMLJornada(jornadas[j])}
            </div>`;
    });

    div.innerHTML = tabs + contenido;
}

// Cambiar entre jornadas
function cambiarJornada(num, ev) {
    document.querySelectorAll(".jornada-contenido")
        .forEach(x => x.style.display = "none");

    const cont = document.getElementById("jornada_" + num);
    if (cont) cont.style.display = "block";

    document.querySelectorAll(".tab-btn")
        .forEach(btn => btn.classList.remove("activa"));

    if (ev && ev.target) {
        ev.target.classList.add("activa");
    }
}

// Generar HTML de todos los partidos de una jornada
function generarHTMLJornada(partidos) {
    let html = "";
    let equipoDescanso = null;

    partidos.forEach(p => {
        // Detectar descanso
        if (p.estado === "descanso" || String(p.descanso).toLowerCase() === "sí") {
            // El equipo que descansa viene en local (o visitante si algún día cambias)
            equipoDescanso = p.local || p.visitante || null;
            return; // no pintamos como partido normal
        }

        const sets = Array.isArray(p.resultado) ? p.resultado : [];

        // Contar sets ganados
        let localSetsGanados = 0;
        let visitSetsGanados = 0;

        sets.forEach(s => {
            const [aStr, bStr] = String(s).split("-");
            const a = Number(aStr);
            const b = Number(bStr);
            if (!Number.isNaN(a) && !Number.isNaN(b)) {
                if (a > b) localSetsGanados++;
                else if (b > a) visitSetsGanados++;
            }
        });

        let claseLocal = "";
        let claseVisit = "";

        if (p.estado === "jugado") {
            if (localSetsGanados > visitSetsGanados) {
                claseLocal = "ganador";
                claseVisit = "perdedor";
            } else if (visitSetsGanados > localSetsGanados) {
                claseVisit = "ganador";
                claseLocal = "perdedor";
            }
        }

        // Crear columnas de sets (hasta 5)
        const getColumns = (index) => {
            if (sets[index]) {
                const [aStr, bStr] = String(sets[index]).split("-");
                const a = aStr !== undefined ? aStr.trim() : "";
                const b = bStr !== undefined ? bStr.trim() : "";
                return [a, b];
            }
            return ["", ""];
        };

        const col1 = getColumns(0);
        const col2 = getColumns(1);
        const col3 = getColumns(2);
        const col4 = getColumns(3);
        const col5 = getColumns(4);

        // ---- BLOQUE DEL PARTIDO ----
        html += `
        <div class="partido">

            <!-- CABECERA -->
            <div class="fila fila-head">
                <span class="equipo-col">EQUIPOS</span>
                <span class="set-col">I</span>
                <span class="set-col">II</span>
                <span class="set-col">III</span>
                <span class="set-col">IV</span>
                <span class="set-col">V</span>
            </div>

            <!-- EQUIPO LOCAL -->
            <div class="fila">
                <span class="equipo-col ${claseLocal}">${p.local}</span>
                <span class="set-col">${col1[0]}</span>
                <span class="set-col">${col2[0]}</span>
                <span class="set-col">${col3[0]}</span>
                <span class="set-col">${col4[0]}</span>
                <span class="set-col">${col5[0]}</span>
            </div>

            <!-- EQUIPO VISITANTE -->
            <div class="fila">
                <span class="equipo-col ${claseVisit}">${p.visitante}</span>
                <span class="set-col">${col1[1]}</span>
                <span class="set-col">${col2[1]}</span>
                <span class="set-col">${col3[1]}</span>
                <span class="set-col">${col4[1]}</span>
                <span class="set-col">${col5[1]}</span>
            </div>

            ${p.estado === "pendiente"
                ? `<div class="pendiente-line">⏳ Pendiente</div>`
                : ""}

        </div>
        `;
    });

    // Línea de descanso al final de la jornada
    if (equipoDescanso) {
        html += `
        <div class="descanso-line">
            <span class="descanso-label">DESCANSA:</span>
            <span class="descanso-equipo">${equipoDescanso}</span>
        </div>
        `;
    }

    return html;
}

// =====================================================
//   Ejecutar carga inicial
// =====================================================
cargarDatos();


