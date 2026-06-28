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

        if (document.getElementById("clasificacion")) {
            mostrarClasificacion(
                data.clasificacion || [],
                data.ultima_actualizacion,
                data.modo_orden
            );
        }

        if (document.getElementById("partidos")) {
            window.datosCruces = data.cruces || [];
            mostrarPartidos(data.partidos || []);
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
//   CLASIFICACIÓN
// =====================================================
function mostrarClasificacion(lista, fechaActualizacion, modoOrden) {
    const div = document.getElementById("clasificacion");
    if (!div) return;

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

    const mostrarCoef = (modoOrden === "Opción C");

    div.innerHTML = `
        <p class="fecha-actualizacion"><em>Actualizado: ${fechaFormateada}</em></p>
    `;

    lista.forEach(eq => {
        const actual = Number(eq.posicion_actual || 0);
        const anterior = Number(eq.posicion_anterior || 0);

        eq.movIcon = "";
        eq.movVal = "";
        eq.movClass = "";

        if (anterior === 0 || eq.pj === 0) return;

        const dif = anterior - actual;

        if (dif > 0) {
            eq.movIcon = "▲";
            eq.movVal = dif;
            eq.movClass = "mov-sube";
        } else if (dif < 0) {
            eq.movIcon = "▼";
            eq.movVal = -dif;
            eq.movClass = "mov-baja";
        } else {
            eq.movIcon = "=";
            eq.movVal = "";
            eq.movClass = "mov-igual";
        }
    });

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
                ${mostrarCoef ? `<td>${Number(eq.coeficiente).toFixed(2)}</td>` : ""}
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
            PTOS: Puntos Totales /
            COEF: Coeficiente Eficacia /
            PJ: Partidos Jugados /
            PG: Partidos Ganados /
            PP: Partidos Perdidos /
            Des: Descansos /
            SG: Sets Ganados /
            SP: Sets Perdidos /
            SD: Diferencia de Sets /
            PGan: Puntos Ganados /
            PPer: Puntos Perdidos /
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
    if (!div) return;

    const jornadas = {};

    lista.forEach(p => {
        const j = Number(p.jornada);
        if (!jornadas[j]) jornadas[j] = [];
        jornadas[j].push(p);
    });

    const jornadasOrdenadas = Object.keys(jornadas)
        .map(Number)
        .sort((a, b) => a - b);

    const hayCruces = window.datosCruces && window.datosCruces.length > 0;

    if (!jornadasOrdenadas.length && !hayCruces) {
        div.innerHTML = "<p>No hay partidos.</p>";
        return;
    }

    let tabs = `<div class="tabs">`;
    let contenido = "";

    jornadasOrdenadas.forEach((j, idx) => {
        tabs += `
            <button class="tab-btn ${idx === 0 ? "activa" : ""}"
                    onclick="cambiarJornada('jornada_${j}', event)">
                Jornada ${j}
            </button>`;

        contenido += `
            <div id="jornada_${j}" class="jornada-contenido"
                 style="display:${idx === 0 ? "block" : "none"};">
                ${generarHTMLJornada(jornadas[j])}
            </div>`;
    });

    if (hayCruces) {
        const activaFinal = jornadasOrdenadas.length === 0;

        tabs += `
            <button class="tab-btn ${activaFinal ? "activa" : ""}"
                    onclick="cambiarJornada('fase_final', event)">
                Mata-Mata
            </button>`;

        contenido += `
            <div id="fase_final" class="jornada-contenido"
                 style="display:${activaFinal ? "block" : "none"};">
                ${generarHTMLCruces(window.datosCruces)}
            </div>`;
    }

    tabs += `</div>`;

    div.innerHTML = tabs + contenido;
}

function cambiarJornada(id, ev) {
    document.querySelectorAll(".jornada-contenido")
        .forEach(x => x.style.display = "none");

    const bloque = document.getElementById(id);
    if (bloque) bloque.style.display = "block";

    document.querySelectorAll(".tab-btn")
        .forEach(btn => btn.classList.remove("activa"));

    if (ev && ev.target) ev.target.classList.add("activa");
}

// =====================================================
//   Render partidos
// =====================================================
function generarHTMLJornada(partidos) {
    let html = "";

    partidos.forEach(p => {
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

        const sets = p.resultado || [];

        const getSet = (i, pos) => {
            if (!sets[i]) return "";
            const partes = sets[i].split("-");
            return partes[pos] || "";
        };

        const haySet4 = sets.length >= 4 && sets[3] !== "";
        const haySet5 = sets.length >= 5 && sets[4] !== "";

        const totalCols = 3 + (haySet4 ? 1 : 0) + (haySet5 ? 1 : 0);
        const gridStyle = `grid-template-columns: 3fr repeat(${totalCols}, 1fr);`;

        let localGan = 0;
        let visitGan = 0;

        sets.forEach(s => {
            if (!s) return;
            const partes = s.split("-").map(Number);
            const a = partes[0];
            const b = partes[1];

            if (a > b) localGan++;
            if (b > a) visitGan++;
        });

        let claseLocal = "";
        let claseVisit = "";

        const estado = String(p.estado || "").toLowerCase();

        if (estado === "jugado" || estado === "finalizado") {
            claseLocal = localGan > visitGan ? "ganador" : "";
            claseVisit = visitGan > localGan ? "ganador" : "";
        }

        html += `
        <div class="partido">
            <div class="fila fila-head" style="${gridStyle}">
                <span class="equipo-col">EQUIPOS</span>
                <span class="set-col">I</span>
                <span class="set-col">II</span>
                <span class="set-col">III</span>
                ${haySet4 ? `<span class="set-col">IV</span>` : ""}
                ${haySet5 ? `<span class="set-col">V</span>` : ""}
            </div>

           <div class="fila ${claseLocal}" style="${gridStyle}">
                <span class="equipo-col">${p.local}</span>
                <span class="set-col">${getSet(0,0)}</span>
                <span class="set-col">${getSet(1,0)}</span>
                <span class="set-col">${getSet(2,0)}</span>
                ${haySet4 ? `<span class="set-col">${getSet(3,0)}</span>` : ""}
                ${haySet5 ? `<span class="set-col">${getSet(4,0)}</span>` : ""}
            </div>

            <div class="fila ${claseVisit}" style="${gridStyle}">
                <span class="equipo-col">${p.visitante}</span>
                <span class="set-col">${getSet(0,1)}</span>
                <span class="set-col">${getSet(1,1)}</span>
                <span class="set-col">${getSet(2,1)}</span>
                ${haySet4 ? `<span class="set-col">${getSet(3,1)}</span>` : ""}
                ${haySet5 ? `<span class="set-col">${getSet(4,1)}</span>` : ""}
            </div>
            ${
                estado === "pendiente"
                    ? `<div class="pendiente-line">⏳ Pendiente</div>`
                    : ""
            }
        </div>`;
    });

    return html;
}

// =====================================================
//   Fase Final
// =====================================================

function generarHTMLCruces(lista) {
    const fasesOrden = ["Cuartos de Final", "Semifinales", "Final"];
    let html = "";

    fasesOrden.forEach(fase => {
        const partidosFase = lista.filter(p => p.fase === fase);

        if (partidosFase.length) {
            html += `
                <div class="mata-fase">
                    <h2>${iconoFase(fase)} ${fase}</h2>
                    ${generarHTMLJornada(partidosFase)}
                </div>
            `;
        }
    });

    const final = lista.find(p => p.fase === "Final");

    if (final && final.ganador) {
        html += `
            <div class="campeon-box">
                <div class="campeon-label">👑 THE CHAMPIONS OF THE 2025 SPRINT PADEL TOURNAMENT ARE …</div>
                <div class="campeon-nombre">${final.ganador}</div>
            </div>
        `;
    }

    return html;
}

function iconoFase(fase) {
    if (fase === "Cuartos de Final") return "⚔️";
    if (fase === "Semifinales") return "🔥";
    if (fase === "Final") return "👑";
    return "🎾";
}



// =====================================================
//   Carga inicial
// =====================================================
cargarDatos();
