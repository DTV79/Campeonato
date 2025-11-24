// =====================================================
//   URL donde se encuentra el JSON generado por Excel
// =====================================================
const DATA_URL = "./estado_torneo.json";

// =====================================================
//   Cargar datos desde JSON
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
//   Cambiar pestañas
// =====================================================
function mostrar(pagina) {
    document.querySelectorAll(".pagina")
        .forEach(p => p.style.display = "none");

    document.getElementById(pagina).style.display = "block";
}

// =====================================================
//   CLASIFICACIÓN — TABLA
// =====================================================
function mostrarClasificacion(lista, fechaActualizacion) {
    const div = document.getElementById("clasificacion");

    // --- Formateo de fecha ---
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

    div.innerHTML = `
        <h2>Clasificación</h2>
        <p class="fecha-actualizacion"><em>Actualizado: ${fechaFormateada}</em></p>
    `;

    // ============================================================
    //   CALCULAR MOVIMIENTOS: ▲ ▼ =
    // ============================================================
    lista.forEach(eq => {
        const actual = Number(eq.posicion_actual || 0);
        const anterior = Number(eq.posicion_anterior || 0);

        eq.movIcon = "";
        eq.movVal = "";
        eq.movClass = "";

        if (anterior === 0 || eq.pj === 0) {
            // Jornada 1 → sin iconos
            return;
        }

        const dif = anterior - actual;

        if (dif > 0) {
            eq.movIcon = "▲";      // sube
            eq.movVal = dif;
            eq.movClass = "mov-sube";

        } else if (dif < 0) {
            eq.movIcon = "▼";      // baja
            eq.movVal = Math.abs(dif);
            eq.movClass = "mov-baja";

        } else {
            eq.movIcon = "=";      // igual
            eq.movVal = "";
            eq.movClass = "mov-igual";
        }
    });

    // ============================================================
    //   GENERAR TABLA HTML
    // ============================================================
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
                <td class="mov ${eq.movClass}">
                    <span class="mov-icon">${eq.movIcon}</span>
                    <span class="mov-val">${eq.movVal}</span>
                </td>
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
//   PARTIDOS
// =====================================================
function mostrarPartidos(lista) {
    const div = document.getElementById("partidos");

    // Agrupar por jornada
    const jornadas = {};
    lista.forEach(p => {
        const j = Number(p.jornada);
        if (!jornadas[j]) jornadas[j] = [];
        jornadas[j].push(p);
    });

    const jornadasOrdenadas = Object.keys(jornadas)
        .map(Number)
        .sort((a, b) => a - b);

    if (!jornadasOrdenadas.length) {
        div.innerHTML = "<p>No hay partidos.</p>";
        return;
    }

    // Pestañas
    let tabs = `<div class="tabs">`;
    jornadasOrdenadas.forEach((j, idx) => {
        tabs += `
            <button class="tab-btn ${idx === 0 ? "activa" : ""}"
                    onclick="cambiarJornada(${j}, event)">
                Jornada ${j}
            </button>`;
    });
    tabs += `</div>`;

    // Contenido
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

function cambiarJornada(num, ev) {
    document.querySelectorAll(".jornada-contenido")
        .forEach(x => x.style.display = "none");

    document.getElementById("jornada_" + num).style.display = "block";

    document.querySelectorAll(".tab-btn")
        .forEach(btn => btn.classList.remove("activa"));

    if (ev?.target) ev.target.classList.add("activa");
}

// Render de cada jornada
function generarHTMLJornada(partidos) {
    let html = "";

    partidos.forEach(p => {

        // DESCANSO
        if (p.estado === "descanso" || p.visitante === "DESCANSO") {
            html += `
                <div class="partido">
                    <div class="descanso-line">
                        <span class="descanso-label">DESCANSAN:</span>
                        <span class="descanso-equipo">${p.local}</span>
                    </div>
                </div>`;
            return;
        }

        // PROCESAR SETS
        const sets = p.resultado || [];
        const getSet = (i, pos) => {
            if (!sets[i]) return "";
            const partes = sets[i].split("-");
            return partes[pos] || "";
        };

        // GANADOR
        let localGan = 0, visitGan = 0;
        sets.forEach(s => {
            if (!s) return;
            const [a, b] = s.split("-").map(Number);
            if (a > b) localGan++;
            if (b > a) visitGan++;
        });

        let claseLocal = "";
        let claseVisit = "";

        if (p.estado === "jugado") {
            claseLocal = localGan > visitGan ? "ganador" : "";
            claseVisit = visitGan > localGan ? "ganador" : "";
        }

        html += `
        <div class="partido">

            <div class="fila fila-head">
                <span class="equipo-col">EQUIPOS</span>
                <span class="set-col">I</span>
                <span class="set-col">II</span>
                <span class="set-col">III</span>
                <span class="set-col">IV</span>
                <span class="set-col">V</span>
            </div>

            <div class="separador-grueso"></div>

            <div class="fila">
                <span class="equipo-col ${claseLocal}">${p.local}</span>
                <span class="set-col">${getSet(0,0)}</span>
                <span class="set-col">${getSet(1,0)}</span>
                <span class="set-col">${getSet(2,0)}</span>
                <span class="set-col">${getSet(3,0)}</span>
                <span class="set-col">${getSet(4,0)}</span>
            </div>

            <div class="fila">
                <span class="equipo-col ${claseVisit}">${p.visitante}</span>
                <span class="set-col">${getSet(0,1)}</span>
                <span class="set-col">${getSet(1,1)}</span>
                <span class="set-col">${getSet(2,1)}</span>
                <span class="set-col">${getSet(3,1)}</span>
                <span class="set-col">${getSet(4,1)}</span>
            </div>

            ${p.estado === "pendiente" ? `<div class="pendiente-line">⏳ Pendiente</div>` : ""}

            <div class="separador-fino"></div>
            <div class="separador-fino"></div>
        </div>
        `;
    });

    return html;
}

// =====================================================
//   Carga inicial
// =====================================================
cargarDatos();
