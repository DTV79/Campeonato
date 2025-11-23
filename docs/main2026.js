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
        // Mismo puesto pero NO es jornada 1
        eq.mov = "=";
        eq.movClass = "igual";
    }
    } else {
    // Jornada 1 → NO mostrar nada
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
//   PARTIDOS — (Mostrarlos)
// =====================================================

// Devuelve arrays de juegos por set para local y visitante
function desglosarResultado(resultadoArr) {
    const maxSets = 5;
    const localSets = new Array(maxSets).fill("");
    const visitSets = new Array(maxSets).fill("");

    if (!Array.isArray(resultadoArr)) return { localSets, visitSets };

    resultadoArr.forEach((s, idx) => {
        if (idx >= maxSets) return;
        const partes = String(s).split("-");
        if (partes.length === 2) {
            localSets[idx] = partes[0].trim();
            visitSets[idx] = partes[1].trim();
        }
    });

    return { localSets, visitSets };
}

// Calcula el ganador a partir de los sets
function calcularGanador(partido, localSets, visitSets) {
    let setsLocal = 0;
    let setsVisit = 0;

    for (let i = 0; i < localSets.length; i++) {
        const a = Number(localSets[i]);
        const b = Number(visitSets[i]);
        if (Number.isNaN(a) || Number.isNaN(b)) continue;
        if (a > b) setsLocal++;
        else if (b > a) setsVisit++;
    }

    if (setsLocal === 0 && setsVisit === 0) return null;
    if (setsLocal > setsVisit) return partido.local || null;
    if (setsVisit > setsLocal) return partido.visitante || null;
    return null; // empate raro o datos incompletos
}

function mostrarPartidos(lista) {
    const div = document.getElementById("partidos");

    // 1) Agrupar por jornada
    const jornadas = {};
    lista.forEach(p => {
        if (!jornadas[p.jornada]) jornadas[p.jornada] = [];
        jornadas[p.jornada].push(p);
    });

    // 2) Crear pestañas
    let tabs = `<div class="tabs">`;
    let first = true;

    Object.keys(jornadas).forEach(j => {
        tabs += `
            <button class="tab-btn ${first ? "activa" : ""}" onclick="cambiarJornada(${j})">
                Jornada ${j}
            </button>`;
        first = false;
    });

    tabs += `</div>`;

    // 3) Crear contenedores de cada jornada
    let contenido = "";

    Object.keys(jornadas).forEach((j, index) => {
        contenido += `
        <div id="jornada_${j}" class="jornada-contenido" style="display:${index === 0 ? "block" : "none"};">
            ${generarHTMLJornada(jornadas[j])}
        </div>`;
    });

    div.innerHTML = tabs + contenido;
}

// =============================================================
//   Cambiar entre jornadas
// =============================================================
function cambiarJornada(num) {
    document.querySelectorAll(".jornada-contenido")
        .forEach(x => x.style.display = "none");

    document.getElementById("jornada_" + num).style.display = "block";

    document.querySelectorAll(".tab-btn")
        .forEach(btn => btn.classList.remove("activa"));

    event.target.classList.add("activa");
}

// =============================================================
//   Generar HTML de una jornada completa
// =============================================================
function generarHTMLJornada(partidos) {
    let html = "";

    partidos.forEach(p => {

        let sets = p.resultado;
        let localSets = 0;
        let visitSets = 0;

        // Contar sets ganados si el partido está jugado
        sets.forEach(s => {
            let [a, b] = s.split("-").map(Number);
            if (a > b) localSets++;
            if (b > a) visitSets++;
        });

        let claseLocal = "";
        let claseVisit = "";
        let iconoEstado = "";

        if (p.estado === "jugado") {
            if (localSets > visitSets) {
                claseLocal = "ganador";
                claseVisit = "perdedor";
            } else {
                claseVisit = "ganador";
                claseLocal = "perdedor";
            }
        } else {
            iconoEstado = `<span class="pendiente">⏳ Pendiente</span>`;
        }

        // Crear columnas de sets
        let htmlSetsLocal = "";
        let htmlSetsVisit = "";

        for (let i = 0; i < 5; i++) {
            if (sets[i]) {
                let [a, b] = sets[i].split("-");
                htmlSetsLocal += `<span class="colset">${a}</span>`;
                htmlSetsVisit += `<span class="colset">${b}</span>`;
            } else {
                htmlSetsLocal += `<span class="colset">-</span>`;
                htmlSetsVisit += `<span class="colset">-</span>`;
            }
        }

        // ---- BLOQUE DEL PARTIDO ----
        html += `
        <div class="partido">

            <div class="fila-header-sets">
                <span class="col-equipos">EQUIPOS</span>
                <span class="colset">SET1</span>
                <span class="colset">SET2</span>
                <span class="colset">SET3</span>
                <span class="colset">SET4</span>
                <span class="colset">SET5</span>
            </div>

            <div class="fila-sets">
                <span class="col-equipos ${claseLocal}">${p.local}</span>
                ${htmlSetsLocal}
            </div>

            <div class="fila-sets">
                <span class="col-equipos ${claseVisit}">${p.visitante}</span>
                ${htmlSetsVisit}
            </div>

            <div class="estado-partido">${iconoEstado}</div>

        </div>
        `;
    });

    return html;
}


// =====================================================
//   Ejecutar carga inicial
// =====================================================
cargarDatos();

