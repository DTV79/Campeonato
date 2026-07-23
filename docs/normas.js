"use strict";

const URL_ESTADO_NORMAS =
    "https://dtv79.github.io/Campeonato/estado_torneo.json";
const URL_REGLAS_NORMAS =
    "https://dtv79.github.io/Campeonato/reglas.json";

let datosNormas = null;
let estadoNormas = null;
let configNormas = {};
let elementosNormas = [];
let elementosPorId = new Map();

iniciarPaginaNormas();

async function iniciarPaginaNormas() {
    prepararBotonesNormas();

    try {
        const [estado, reglas] = await Promise.all([
            cargarJSONNormas(URL_ESTADO_NORMAS),
            cargarJSONNormas(URL_REGLAS_NORMAS)
        ]);

        estadoNormas = estado || {};
        datosNormas = reglas || {};
        configNormas = {
            ...(datosNormas.configuracion || {}),
            ...(estadoNormas.configuracion || {})
        };

        elementosNormas = Array.isArray(datosNormas.elementos)
            ? [...datosNormas.elementos]
            : [];

        elementosNormas.sort((a, b) =>
            numeroSeguro(a.orden_seccion) - numeroSeguro(b.orden_seccion) ||
            numeroSeguro(a.orden_elemento) - numeroSeguro(b.orden_elemento) ||
            textoSeguro(a.id).localeCompare(textoSeguro(b.id), "es")
        );

        elementosPorId = new Map(
            elementosNormas.map(elemento => [elemento.id, elemento])
        );

        pintarPaginaNormas();
    } catch (error) {
        console.error(error);
        pintarErrorNormas();
    }
}

async function cargarJSONNormas(url) {
    const respuesta = await fetch(
        `${url}?v=${Date.now()}`,
        { cache: "no-store" }
    );

    if (!respuesta.ok) {
        throw new Error(
            `No se pudo cargar ${url} (${respuesta.status})`
        );
    }

    return respuesta.json();
}

function prepararBotonesNormas() {
    document
        .getElementById("btnAbrirNormas")
        ?.addEventListener("click", () => {
            document.querySelectorAll(".bloqueNorma")
                .forEach(bloque => {
                    bloque.open = true;
                });
        });

    document
        .getElementById("btnCerrarNormas")
        ?.addEventListener("click", () => {
            document.querySelectorAll(".bloqueNorma")
                .forEach(bloque => {
                    bloque.open = false;
                });
        });
}

function pintarPaginaNormas() {
    pintarNombreEdicion();
    pintarResumenEdicion();
    pintarBloquesNormas();
    pintarAvisoOrganizacion();
}

function pintarNombreEdicion() {
    const fallback =
        textoElemento("PAG_001") ||
        "Campeonato Sprint Pádel Tui";

    const nombre = textoSeguro(
        configNormas.nombre_campeonato ||
        configNormas.id_campeonato ||
        fallback
    );

    const elemento = document.getElementById("nombreEdicion");

    if (elemento) {
        elemento.textContent = nombre;
    }

    document.title =
        textoElemento("PAG_002") ||
        `Reglas · ${nombre}`;
}

function pintarResumenEdicion() {
    const contenedor =
        document.getElementById("resumenEdicionNormas");

    if (!contenedor) return;

    const elementosResumen = elementosNormas.filter(
        elemento => elemento.seccion === "Resumen superior"
    );
    const chips = elementosNormas.filter(
        elemento => elemento.seccion === "Chips resumen"
    );

    const etiqueta =
        elementosResumen.find(e => e.tipo === "Etiqueta")?.texto ||
        "FORMATO DE ESTA EDICIÓN";

    const titulo =
        elementosResumen.find(e =>
            ["Título", "Título dinámico"].includes(e.tipo)
        )?.texto ||
        obtenerTituloFormato();

    const descripcion =
        elementosResumen.find(e =>
            ["Descripción", "Párrafo"].includes(e.tipo)
        )?.texto ||
        obtenerDescripcionFormato();

    const estado = textoSeguro(
        configNormas.estado_torneo ||
        estadoNormas.estado_torneo ||
        "Pendiente"
    );

    contenedor.innerHTML = `
        <div class="cabeceraResumenNormas">
            <div>
                <span>${escaparHTML(etiqueta)}</span>
                <h2>${escaparHTML(titulo)}</h2>
            </div>

            <div class="estadoResumenNormas">
                ${escaparHTML(estado)}
            </div>
        </div>

        <p class="descripcionResumenNormas">
            ${escaparHTML(descripcion)}
        </p>

        <div class="chipsNormas">
            ${chips.map(chip => `
                <span class="chipNorma">
                    ${escaparHTML(chip.icono || "")}
                    ${escaparHTML(chip.texto)}
                </span>
            `).join("")}
        </div>
    `;
}

function pintarBloquesNormas() {
    const contenedor = document.getElementById("listaNormas");

    if (!contenedor) return;

    const grupos = new Map();

    elementosNormas
        .filter(elemento =>
            numeroSeguro(elemento.orden_seccion) > 0 &&
            elemento.seccion !== "Aviso organización"
        )
        .forEach(elemento => {
            const clave =
                `${elemento.orden_seccion}__${elemento.seccion}`;

            if (!grupos.has(clave)) {
                grupos.set(clave, {
                    nombre: elemento.seccion,
                    orden: numeroSeguro(elemento.orden_seccion),
                    elementos: []
                });
            }

            grupos.get(clave).elementos.push(elemento);
        });

    const secciones = [...grupos.values()]
        .sort((a, b) => a.orden - b.orden);

    contenedor.innerHTML = secciones
        .map((seccion, indice) =>
            pintarSeccionNorma(seccion, indice)
        )
        .join("");
}

function pintarSeccionNorma(seccion, indice) {
    const tituloElemento = seccion.elementos.find(e =>
        ["Título", "Título dinámico"].includes(e.tipo)
    );
    const subtituloElemento = seccion.elementos.find(e =>
        ["Subtítulo", "Subtítulo dinámico"].includes(e.tipo)
    );

    const titulo =
        tituloElemento?.texto ||
        seccion.nombre ||
        "Reglas";

    const subtitulo =
        subtituloElemento?.texto ||
        "Información del campeonato";

    const icono =
        tituloElemento?.icono ||
        seccion.elementos.find(e => textoSeguro(e.icono))?.icono ||
        "📌";

    const contenido = seccion.elementos.filter(e =>
        ![
            "Título",
            "Título dinámico",
            "Subtítulo",
            "Subtítulo dinámico"
        ].includes(e.tipo)
    );

    return `
        <details
            class="bloqueNorma"
            ${indice === 0 ? "open" : ""}
        >
            <summary>
                <span class="iconoBloqueNorma" aria-hidden="true">
                    ${escaparHTML(icono)}
                </span>

                <span class="tituloBloqueNorma">
                    <strong>${escaparHTML(titulo)}</strong>
                    <small>${escaparHTML(subtitulo)}</small>
                </span>

                <span class="flechaBloqueNorma" aria-hidden="true">›</span>
            </summary>

            <div class="contenidoNorma">
                ${pintarContenidoSeccion(contenido)}
            </div>
        </details>
    `;
}

function pintarContenidoSeccion(elementos) {
    let html = "";
    let indice = 0;

    while (indice < elementos.length) {
        const elemento = elementos[indice];
        const tipo = textoSeguro(elemento.tipo);

        if (["Viñeta", "Viñeta dinámica"].includes(tipo)) {
            const lista = [];

            while (
                indice < elementos.length &&
                ["Viñeta", "Viñeta dinámica"].includes(
                    textoSeguro(elementos[indice].tipo)
                )
            ) {
                lista.push(elementos[indice].texto);
                indice += 1;
            }

            html += `
                <ul>
                    ${lista.map(texto =>
                        `<li>${escaparHTML(texto)}</li>`
                    ).join("")}
                </ul>
            `;
            continue;
        }

        if (tipo === "Paso") {
            const lista = [];

            while (
                indice < elementos.length &&
                textoSeguro(elementos[indice].tipo) === "Paso"
            ) {
                lista.push(elementos[indice].texto);
                indice += 1;
            }

            html += `
                <ol>
                    ${lista.map(texto =>
                        `<li>${escaparHTML(texto)}</li>`
                    ).join("")}
                </ol>
            `;
            continue;
        }

        if (tipo === "Criterio") {
            const lista = [];

            while (
                indice < elementos.length &&
                textoSeguro(elementos[indice].tipo) === "Criterio"
            ) {
                lista.push(elementos[indice].texto);
                indice += 1;
            }

            html += `
                <div class="bloqueCriteriosNorma">
                    <ol class="listaCriteriosNorma">
                        ${lista.map(texto =>
                            `<li>${escaparHTML(texto)}</li>`
                        ).join("")}
                    </ol>
                </div>
            `;
            continue;
        }

        if (tipo === "Etiqueta") {
            const siguiente = elementos[indice + 1];
            let valor = valorDinamicoEtiqueta(elemento.id);

            if (
                !valor &&
                siguiente &&
                siguiente.tipo === "Valor dinámico"
            ) {
                valor = siguiente.texto;
                indice += 1;
            }

            html += valor
                ? datoHTML(elemento.texto, valor)
                : `<div class="etiquetaOpcionalNorma">
                    ${escaparHTML(elemento.texto)}
                   </div>`;

            indice += 1;
            continue;
        }

        if (tipo === "Cabecera tabla") {
            const cabeceras = [];

            while (
                indice < elementos.length &&
                textoSeguro(elementos[indice].tipo) ===
                    "Cabecera tabla"
            ) {
                cabeceras.push(elementos[indice].texto);
                indice += 1;
            }

            html += pintarTablaPuntuacion(cabeceras);
            continue;
        }

        html += pintarElementoIndividual(elemento);
        indice += 1;
    }

    return html;
}

function pintarElementoIndividual(elemento) {
    const tipo = textoSeguro(elemento.tipo);
    const texto = escaparHTML(elemento.texto);

    switch (tipo) {
        case "Párrafo":
        case "Descripción":
            return `<p>${texto}</p>`;

        case "Destacado":
        case "Mensaje":
            return `<div class="destacadoNorma">${texto}</div>`;

        case "Nota":
            return `<div class="notaNorma">${texto}</div>`;

        case "Ejemplo":
            return `
                <div class="ejemploNorma">
                    <strong>Ejemplo</strong>
                    <p>${texto}</p>
                </div>
            `;

        case "Nombre opción":
            return `
                <div class="etiquetaOpcionalNorma">
                    ${texto}
                </div>
            `;

        case "Valor dinámico":
            return `<p><strong>${texto}</strong></p>`;

        case "Texto alternativo":
        case "Mensaje técnico":
        case "Título navegador":
            return "";

        default:
            return texto ? `<p>${texto}</p>` : "";
    }
}

function pintarTablaPuntuacion(cabeceras) {
    const sistema = normalizarTexto(
        configNormas.sistema_puntuacion
    );

    const filas = (datosNormas.puntuacion || [])
        .filter(fila =>
            normalizarTexto(fila.sistema) === sistema
        );

    if (!filas.length) return "";

    const encabezados = cabeceras.length >= 3
        ? cabeceras
        : ["Situación", "Ganador / equipo", "Perdedor"];

    return `
        <div class="tablaNormasContenedor">
            <table class="tablaNormas tablaPuntuacionNormas">
                <thead>
                    <tr>
                        <th>${escaparHTML(encabezados[0])}</th>
                        <th>${escaparHTML(encabezados[1])}</th>
                        <th>${escaparHTML(encabezados[2])}</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas.map(fila => `
                        <tr>
                            <td>${escaparHTML(fila.situacion)}</td>
                            <td>${escaparHTML(fila.ganador)}</td>
                            <td>${escaparHTML(fila.perdedor)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function valorDinamicoEtiqueta(id) {
    switch (id) {
        case "RAP_LAB_001":
            return esFormatoGrupos()
                ? obtenerTituloFormato()
                : "Liguilla / clasificación única";

        case "RAP_LAB_002":
        case "JOR_003":
            return traducirModoJornadas(
                configNormas.modo_generar_jornadas
            );

        case "RAP_LAB_003":
        case "PUN_003":
            return textoSeguro(
                configNormas.sistema_puntuacion
            );

        case "RAP_LAB_004":
        case "ELI_005":
        case "PAL_003":
            return textoSeguro(
                configNormas.criterio_generar_cruces
            ) || textoElemento("RAP_DEF_001");

        case "RAP_LAB_005":
        case "PIS_003":
            return numeroSeguro(
                configNormas.num_pistas_disponibles
            ) || "";

        case "RAP_LAB_006":
            return numeroSeguro(
                configNormas.puntos_maximos_por_set
            ) || "";

        case "ELI_003":
            return textoSeguro(
                configNormas.ronda_inicial_eliminatorias
            ) || textoElemento("ELI_004");

        default:
            return "";
    }
}

function datoHTML(etiqueta, valor) {
    return `
        <div class="datoNorma">
            <span>${escaparHTML(etiqueta)}</span>
            <strong>${escaparHTML(valor)}</strong>
        </div>
    `;
}

function pintarAvisoOrganizacion() {
    const aviso = document.getElementById("avisoOrganizacion");
    const regla = elementosPorId.get("AVISO_001");

    if (!aviso) return;

    if (!regla?.texto) {
        aviso.hidden = true;
        return;
    }

    aviso.hidden = false;
    aviso.innerHTML = `
        <span aria-hidden="true">
            ${escaparHTML(regla.icono || "ℹ️")}
        </span>
        <p>${escaparHTML(regla.texto)}</p>
    `;
}

function obtenerTituloFormato() {
    if (esFormatoGrupos()) {
        const grupos = numeroSeguro(
            configNormas.num_grupos_iniciales
        );
        const equipos = numeroSeguro(
            configNormas.equipos_por_grupo
        );

        return `${grupos || "Varios"} ${
            grupos === 1 ? "grupo" : "grupos"
        }${equipos ? ` · ${equipos} equipos por grupo` : ""}`;
    }

    return "Liguilla o clasificación única";
}

function obtenerDescripcionFormato() {
    if (esFormatoGrupos()) {
        return esVerdadero(configNormas.hay_regrupos)
            ? "La competición comienza por grupos y continúa con una segunda fase de ReGrupos antes de las eliminatorias."
            : "La competición comienza por grupos y los mejores clasificados avanzan a las eliminatorias.";
    }

    return "Todos los equipos compiten en una clasificación general antes de las eliminatorias.";
}

function esFormatoGrupos() {
    return [
        configNormas.tipo_campeonato,
        configNormas.estructura_primera_fase
    ]
        .map(normalizarTexto)
        .join(" ")
        .includes("GRUPO");
}

function traducirModoJornadas(valor) {
    const normalizado = normalizarTexto(valor);

    if (normalizado.includes("SUIZO")) {
        return "Sistema suizo";
    }

    if (normalizado.includes("ALEATOR")) {
        return "Generación aleatoria";
    }

    return textoSeguro(valor) ||
        "Según el calendario del torneo";
}

function textoElemento(id) {
    return textoSeguro(elementosPorId.get(id)?.texto);
}

function pintarErrorNormas() {
    const resumen =
        document.getElementById("resumenEdicionNormas");
    const lista = document.getElementById("listaNormas");
    const nombre = document.getElementById("nombreEdicion");
    const aviso = document.getElementById("avisoOrganizacion");

    if (nombre) {
        nombre.textContent =
            "No se pudo leer el reglamento actual";
    }

    if (resumen) {
        resumen.innerHTML = `
            <div class="errorNormas">
                No se pudo cargar reglas.json.
                Actualiza la web desde Excel y vuelve a intentarlo.
            </div>
        `;
    }

    if (lista) {
        lista.innerHTML = `
            <details class="bloqueNorma" open>
                <summary>
                    <span class="iconoBloqueNorma">📜</span>
                    <span class="tituloBloqueNorma">
                        <strong>Reglas del campeonato</strong>
                        <small>Manual no disponible</small>
                    </span>
                    <span class="flechaBloqueNorma">›</span>
                </summary>
                <div class="contenidoNorma">
                    <p>
                        Consulta con la organización las reglas
                        específicas de esta edición.
                    </p>
                </div>
            </details>
        `;
    }

    if (aviso) {
        aviso.hidden = true;
    }
}

function esVerdadero(valor) {
    if (valor === true) return true;

    return ["SI", "TRUE", "1", "YES"].includes(
        normalizarTexto(valor)
    );
}

function numeroSeguro(valor) {
    const numero = Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;
}

function textoSeguro(valor) {
    return String(valor ?? "").trim();
}

function normalizarTexto(valor) {
    return textoSeguro(valor)
        .toLocaleUpperCase("es")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

