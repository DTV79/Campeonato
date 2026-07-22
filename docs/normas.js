"use strict";

const URL_ESTADO_NORMAS =
    "https://dtv79.github.io/Campeonato/estado_torneo.json";

let estadoNormas = null;

iniciarPaginaNormas();

async function iniciarPaginaNormas() {
    prepararBotonesNormas();

    try {
        const respuesta = await fetch(
            `${URL_ESTADO_NORMAS}?v=${Date.now()}`,
            { cache: "no-store" }
        );

        if (!respuesta.ok) {
            throw new Error(
                `No se pudo cargar el JSON (${respuesta.status})`
            );
        }

        estadoNormas = await respuesta.json();

        pintarPaginaNormas(estadoNormas);
    } catch (error) {
        console.error(error);
        pintarErrorNormas();
    }
}

function prepararBotonesNormas() {
    document
        .getElementById("btnAbrirNormas")
        ?.addEventListener("click", () => {
            document
                .querySelectorAll(".bloqueNorma")
                .forEach(bloque => {
                    bloque.open = true;
                });
        });

    document
        .getElementById("btnCerrarNormas")
        ?.addEventListener("click", () => {
            document
                .querySelectorAll(".bloqueNorma")
                .forEach(bloque => {
                    bloque.open = false;
                });
        });
}

function pintarPaginaNormas(estado) {
    const config = estado?.configuracion || {};

    pintarNombreEdicion(config);
    pintarResumenEdicion(config);
    pintarBloquesNormas(config, estado);
}

function pintarNombreEdicion(config) {
    const nombre = textoSeguro(
        config.nombre_campeonato ||
        config.id_campeonato ||
        "Campeonato Sprint Pádel Tui"
    );

    const elemento = document.getElementById("nombreEdicion");

    if (elemento) {
        elemento.textContent = nombre;
    }

    document.title = `Reglas · ${nombre}`;
}

function pintarResumenEdicion(config) {
    const contenedor =
        document.getElementById("resumenEdicionNormas");

    if (!contenedor) return;

    const formato = obtenerFormatoCompeticion(config);
    const estado = textoSeguro(
        config.estado_torneo ||
        estadoNormas?.estado_torneo ||
        "Pendiente"
    );

    const chips = obtenerChipsResumen(config);

    contenedor.innerHTML = `
        <div class="cabeceraResumenNormas">
            <div>
                <span>FORMATO DE ESTA EDICIÓN</span>
                <h2>${escaparHTML(formato.titulo)}</h2>
            </div>

            <div class="estadoResumenNormas">
                ${escaparHTML(estado)}
            </div>
        </div>

        <p class="descripcionResumenNormas">
            ${escaparHTML(formato.descripcion)}
        </p>

        <div class="chipsNormas">
            ${chips.map(chip => `
                <span class="chipNorma">
                    ${chip.icono}
                    ${escaparHTML(chip.texto)}
                </span>
            `).join("")}
        </div>
    `;
}

function obtenerChipsResumen(config) {
    const chips = [];
    const numPistas = numeroSeguro(config.num_pistas_disponibles);
    const puntosSet = numeroSeguro(config.puntos_maximos_por_set);
    const ronda = textoSeguro(config.ronda_inicial_eliminatorias);

    if (esFormatoGrupos(config)) {
        const grupos = obtenerNumeroGrupos(config);
        const equiposGrupo = numeroSeguro(config.equipos_por_grupo);

        if (grupos > 0) {
            chips.push({
                icono: "📊",
                texto: `${grupos} ${grupos === 1 ? "grupo" : "grupos"}`
            });
        }

        if (equiposGrupo > 0) {
            chips.push({
                icono: "👥",
                texto: `${equiposGrupo} equipos por grupo`
            });
        }
    } else {
        chips.push({
            icono: "🏁",
            texto: "Clasificación única"
        });
    }

    if (esVerdadero(config.hay_regrupos)) {
        chips.push({
            icono: "🔄",
            texto: "Segunda fase de grupos"
        });
    }

    if (numPistas > 0) {
        chips.push({
            icono: "🎾",
            texto: `${numPistas} ${numPistas === 1 ? "pista" : "pistas"}`
        });
    }

    if (puntosSet > 0) {
        chips.push({
            icono: "🔢",
            texto: `Sets hasta ${puntosSet} puntos`
        });
    }

    if (ronda) {
        chips.push({
            icono: "⚔️",
            texto: `Cruces desde ${ronda}`
        });
    } else {
        chips.push({
            icono: "⚔️",
            texto: "Eliminatorias por clasificación"
        });
    }

    return chips;
}

function pintarBloquesNormas(config, estado) {
    const contenedor = document.getElementById("listaNormas");

    if (!contenedor) return;

    const secciones = construirSeccionesNormas(config, estado);

    contenedor.innerHTML = secciones
        .map((seccion, indice) => pintarSeccionNorma(seccion, indice))
        .join("");
}

function construirSeccionesNormas(config, estado) {
    const secciones = [
        construirResumenRapido(config),
        construirFormatoCompeticion(config),
        construirReglasPartido(config),
        construirClasificacion(config),
        construirEliminatorias(config),
        construirOrganizacionPartidos(config),
        construirResultados(),
        construirConducta(),
        construirConsejos()
    ];

    if (esVerdadero(config.hay_copa_palas_playa)) {
        secciones.splice(
            5,
            0,
            construirPalasPlaya(config)
        );
    }

    const adicionales = obtenerSeccionesAdicionales(estado);

    return secciones.concat(adicionales);
}

function construirResumenRapido(config) {
    const formato = obtenerFormatoCompeticion(config);
    const pistas = numeroSeguro(config.num_pistas_disponibles);
    const puntosSet = numeroSeguro(config.puntos_maximos_por_set);

    const datos = [
        datoHTML("Primera fase", formato.titulo),
        datoHTML(
            "Generación de jornadas",
            traducirModoJornadas(config.modo_generar_jornadas)
        ),
        datoHTML(
            "Criterio de cruces",
            textoSeguro(config.criterio_generar_cruces) ||
            "Según clasificación"
        )
    ];

    if (pistas > 0) {
        datos.push(
            datoHTML("Pistas disponibles", pistas)
        );
    }

    if (puntosSet > 0) {
        datos.push(
            datoHTML("Máximo por set", `${puntosSet} puntos`)
        );
    }

    return {
        icono: "⚡",
        titulo: "Resumen rápido",
        subtitulo: "Los datos principales de esta edición",
        abierto: true,
        contenido: `
            <p>
                Esta página adapta automáticamente el reglamento al formato
                configurado para el campeonato.
            </p>
            ${datos.join("")}
        `
    };
}

function construirFormatoCompeticion(config) {
    if (!esFormatoGrupos(config)) {
        return {
            icono: "🏁",
            titulo: "Formato de la competición",
            subtitulo: "Clasificación única o sistema de liguilla",
            contenido: `
                <p>
                    Todos los equipos participan en una clasificación común.
                    Las jornadas se disputan conforme al calendario generado
                    por la organización.
                </p>
                <ul>
                    <li>
                        Los resultados de cada partido se incorporan a la
                        clasificación general.
                    </li>
                    <li>
                        Las nuevas jornadas pueden enfrentar a equipos con una
                        puntuación o rendimiento similar.
                    </li>
                    <li>
                        Al finalizar la primera fase, los equipos mejor
                        clasificados accederán a las eliminatorias previstas.
                    </li>
                </ul>
            `
        };
    }

    const grupos = obtenerNumeroGrupos(config);
    const equiposGrupo = numeroSeguro(config.equipos_por_grupo);
    const pasanRegrupos = numeroSeguro(config.equipos_pasan_a_regrupos);
    const pasanCruces = numeroSeguro(
        config.equipos_pasan_a_cruces_por_grupo
    );
    const puntosArrastrados = numeroSeguro(
        config.puntos_partido_arrastrado
    );
    const hayRegrupos = esVerdadero(config.hay_regrupos);

    const reglas = [
        `Los equipos se distribuyen en ${grupos || "varios"} grupos` +
        `${equiposGrupo ? ` de ${equiposGrupo} equipos` : ""}.`,
        "Cada grupo disputa su propia clasificación durante la primera fase."
    ];

    if (hayRegrupos) {
        reglas.push(
            `${pasanRegrupos || "Los equipos indicados"} de cada grupo ` +
            "acceden a una segunda fase de grupos."
        );

        if (puntosArrastrados > 0) {
            reglas.push(
                `Los resultados arrastrados aportan ${puntosArrastrados} ` +
                `${puntosArrastrados === 1 ? "punto" : "puntos"}, ` +
                "según la configuración del torneo."
            );
        }
    }

    if (pasanCruces > 0) {
        reglas.push(
            `${pasanCruces} ${pasanCruces === 1 ? "equipo" : "equipos"} ` +
            "por grupo acceden a la fase eliminatoria."
        );
    }

    return {
        icono: "📊",
        titulo: "Formato de la competición",
        subtitulo: hayRegrupos
            ? "Primera fase y segunda fase de grupos"
            : "Fase de grupos y clasificación",
        contenido: `
            <p class="destacadoNorma">
                ${escaparHTML(obtenerFormatoCompeticion(config).descripcion)}
            </p>
            <ul>
                ${reglas.map(regla => `
                    <li>${escaparHTML(regla)}</li>
                `).join("")}
            </ul>
        `
    };
}

function construirReglasPartido(config) {
    const puntosSet = numeroSeguro(config.puntos_maximos_por_set);
    const sistema = textoSeguro(config.sistema_puntuacion) || "Normal";

    return {
        icono: "🎾",
        titulo: "Cómo se juega un partido",
        subtitulo: "Puntuación, sets y desarrollo del encuentro",
        contenido: `
            ${puntosSet > 0
                ? datoHTML("Puntuación máxima por set", `${puntosSet} puntos`)
                : ""
            }
            ${datoHTML("Sistema de puntuación", sistema)}

            <ul>
                <li>
                    Los equipos deben estar preparados cuando la organización
                    anuncie su partido o quede disponible la pista asignada.
                </li>
                <li>
                    El marcador se anotará conforme al sistema establecido
                    para la edición y deberá ser aceptado por ambas parejas.
                </li>
                <li>
                    En caso de duda durante un punto, prevalecerán el juego
                    limpio, el acuerdo entre jugadores y la decisión de la
                    organización cuando sea necesaria.
                </li>
                <li>
                    No se modificará un resultado ya confirmado sin comprobar
                    previamente el error con los participantes.
                </li>
            </ul>
        `
    };
}

function construirClasificacion(config) {
    const orden = textoSeguro(config.ordenar_clasificacion);

    return {
        icono: "📈",
        titulo: "Clasificación y desempates",
        subtitulo: "Cómo se ordenan los equipos",
        contenido: `
            ${orden
                ? datoHTML(
                    "Sistema configurado",
                    traducirOrdenClasificacion(orden)
                )
                : ""
            }

            <ol>
                <li>Puntos obtenidos en la competición.</li>
                <li>Diferencia de sets ganados y perdidos.</li>
                <li>Diferencia de puntos a favor y en contra.</li>
                <li>
                    Criterios auxiliares o enfrentamiento directo cuando sean
                    necesarios y estén disponibles.
                </li>
            </ol>

            <p class="destacadoNorma">
                La web mostrará siempre la clasificación calculada por el
                sistema oficial del campeonato.
            </p>
        `
    };
}

function construirEliminatorias(config) {
    const ronda = textoSeguro(config.ronda_inicial_eliminatorias);
    const criterio = textoSeguro(config.criterio_generar_cruces) ||
        "Por clasificación";

    return {
        icono: "⚔️",
        titulo: "Eliminatorias",
        subtitulo: "Clasificación, cruces y avance de ronda",
        contenido: `
            ${datoHTML(
                "Ronda inicial",
                ronda || "Se determinará según los clasificados"
            )}
            ${datoHTML("Generación de cruces", criterio)}

            <ul>
                <li>
                    Los cruces se generan con los equipos clasificados conforme
                    al criterio configurado para la edición.
                </li>
                <li>
                    La pareja ganadora de cada eliminatoria avanza a la ronda
                    siguiente.
                </li>
                <li>
                    La organización podrá ajustar el orden de juego para
                    aprovechar pistas libres y evitar retrasos.
                </li>
                <li>
                    La final determina al equipo campeón y al subcampeón del
                    torneo.
                </li>
            </ul>
        `
    };
}

function construirPalasPlaya(config) {
    const criterio = textoSeguro(config.criterio_palas_playa) ||
        "Por clasificación";
    const posicion = numeroSeguro(config.posicion_inicio_palas_playa);

    return {
        icono: "🏖️",
        titulo: "Copa Palas de Playa",
        subtitulo: "Cuadro complementario de la competición",
        contenido: `
            ${datoHTML("Criterio de acceso", criterio)}
            ${posicion > 0
                ? datoHTML("Desde la posición", posicion)
                : ""
            }

            <p>
                La Copa Palas de Playa solo se disputa cuando está activada en
                la configuración de la edición. Sus participantes y cruces se
                determinan conforme a la clasificación y al criterio elegido
                por la organización.
            </p>
        `
    };
}

function construirOrganizacionPartidos(config) {
    const pistas = numeroSeguro(config.num_pistas_disponibles);
    const modo = traducirModoJornadas(config.modo_generar_jornadas);

    return {
        icono: "🗓️",
        titulo: "Jornadas, pistas y horarios",
        subtitulo: "Cómo se organiza el orden de juego",
        contenido: `
            ${pistas > 0
                ? datoHTML("Pistas disponibles", pistas)
                : ""
            }
            ${datoHTML("Generación de jornadas", modo)}

            <ul>
                <li>
                    La pista asignada aparecerá en el calendario o será
                    comunicada por la organización.
                </li>
                <li>
                    El orden podrá modificarse para adelantar encuentros o
                    utilizar una pista que haya quedado libre.
                </li>
                <li>
                    Se intentará que los equipos roten y repitan lo mínimo
                    posible en una misma pista.
                </li>
                <li>
                    Los jugadores deben permanecer localizables mientras tengan
                    partidos pendientes.
                </li>
            </ul>
        `
    };
}

function construirResultados() {
    return {
        icono: "✅",
        titulo: "Comunicación de resultados",
        subtitulo: "Qué hacer al terminar cada partido",
        contenido: `
            <ol>
                <li>Comprobar el marcador entre las dos parejas.</li>
                <li>Comunicar el resultado a la organización.</li>
                <li>
                    Revisar que el partido aparezca correctamente actualizado
                    en la web.
                </li>
                <li>
                    Avisar cuanto antes si se detecta cualquier error de
                    transcripción.
                </li>
            </ol>
        `
    };
}

function construirConducta() {
    return {
        icono: "🤝",
        titulo: "Juego limpio y convivencia",
        subtitulo: "Normas generales de comportamiento",
        contenido: `
            <ul>
                <li>
                    Tratar con respeto a compañeros, rivales y organización.
                </li>
                <li>
                    Resolver las bolas dudosas con deportividad y sin prolongar
                    discusiones.
                </li>
                <li>
                    Cuidar las instalaciones y dejar libre la pista al terminar
                    el encuentro.
                </li>
                <li>
                    Evitar conductas que retrasen o dificulten el desarrollo del
                    campeonato.
                </li>
            </ul>
        `
    };
}

function construirConsejos() {
    return {
        icono: "💡",
        titulo: "Consejos para el día del torneo",
        subtitulo: "Pequeños detalles que ayudan a que todo fluya",
        contenido: `
            <ul>
                <li>Consulta la web antes de cada partido.</li>
                <li>Calienta con tiempo y ten preparado tu material.</li>
                <li>Lleva agua y algo de comida para toda la jornada.</li>
                <li>
                    Comunica cualquier incidencia antes de que afecte al
                    calendario.
                </li>
                <li>
                    Después de jugar, revisa cuándo podría ser tu siguiente
                    encuentro.
                </li>
            </ul>
        `
    };
}

function obtenerSeccionesAdicionales(estado) {
    const candidatos = [
        estado?.reglas?.secciones,
        estado?.normativa?.secciones,
        estado?.configuracion?.reglas_secciones
    ];

    const lista = candidatos.find(Array.isArray) || [];

    return lista
        .filter(seccion => seccion && seccion.mostrar !== false)
        .map(seccion => ({
            icono: textoSeguro(seccion.icono) || "📌",
            titulo: textoSeguro(seccion.titulo) || "Regla adicional",
            subtitulo: textoSeguro(seccion.subtitulo) ||
                "Información específica de esta edición",
            contenido: contenidoAdicionalSeguro(seccion),
            abierto: esVerdadero(seccion.abierto)
        }));
}

function contenidoAdicionalSeguro(seccion) {
    if (Array.isArray(seccion.puntos)) {
        return `
            <ul>
                ${seccion.puntos.map(punto => `
                    <li>${escaparHTML(punto)}</li>
                `).join("")}
            </ul>
        `;
    }

    return `<p>${escaparHTML(seccion.texto || "")}</p>`;
}

function pintarSeccionNorma(seccion, indice) {
    return `
        <details
            class="bloqueNorma"
            ${seccion.abierto || indice === 0 ? "open" : ""}
        >
            <summary>
                <span class="iconoBloqueNorma" aria-hidden="true">
                    ${seccion.icono}
                </span>

                <span class="tituloBloqueNorma">
                    <strong>${escaparHTML(seccion.titulo)}</strong>
                    <small>${escaparHTML(seccion.subtitulo)}</small>
                </span>

                <span class="flechaBloqueNorma" aria-hidden="true">›</span>
            </summary>

            <div class="contenidoNorma">
                ${seccion.contenido}
            </div>
        </details>
    `;
}

function obtenerFormatoCompeticion(config) {
    if (esFormatoGrupos(config)) {
        const grupos = obtenerNumeroGrupos(config);
        const equipos = numeroSeguro(config.equipos_por_grupo);
        const hayRegrupos = esVerdadero(config.hay_regrupos);

        const titulo =
            `${grupos || "Varios"} ${grupos === 1 ? "grupo" : "grupos"}` +
            `${equipos ? ` · ${equipos} equipos por grupo` : ""}`;

        const descripcion = hayRegrupos
            ? "La competición comienza por grupos y continúa con una segunda fase de grupos antes de las eliminatorias."
            : "La competición comienza por grupos y los mejores clasificados avanzan a las eliminatorias.";

        return { titulo, descripcion };
    }

    return {
        titulo: "Liguilla o clasificación única",
        descripcion:
            "Todos los equipos compiten en una clasificación general antes de las eliminatorias."
    };
}

function esFormatoGrupos(config) {
    const valores = [
        config.tipo_campeonato,
        config.estructura_primera_fase,
        config.estructura_primera_fase_normalizada
    ]
        .map(normalizarTexto)
        .join(" ");

    return valores.includes("GRUPO");
}

function obtenerNumeroGrupos(config) {
    const directo = numeroSeguro(config.num_grupos_iniciales);

    if (directo > 0) return directo;

    const estructura = normalizarTexto(
        config.estructura_primera_fase
    );

    const coincidencia = estructura.match(/\d+/);

    return coincidencia
        ? Number(coincidencia[0])
        : 0;
}

function traducirModoJornadas(valor) {
    const normalizado = normalizarTexto(valor);

    if (normalizado.includes("SUIZO")) {
        return "Sistema suizo";
    }

    if (normalizado.includes("ALEATOR")) {
        return "Generación aleatoria";
    }

    return textoSeguro(valor) || "Según el calendario del torneo";
}

function traducirOrdenClasificacion(valor) {
    const normalizado = normalizarTexto(valor);

    if (normalizado === "OPCION A") {
        return "Puntos, sets y diferencia de puntos";
    }

    return textoSeguro(valor);
}

function datoHTML(etiqueta, valor) {
    if (
        valor === "" ||
        valor === null ||
        valor === undefined
    ) {
        return "";
    }

    return `
        <div class="datoNorma">
            <span>${escaparHTML(etiqueta)}</span>
            <strong>${escaparHTML(valor)}</strong>
        </div>
    `;
}

function pintarErrorNormas() {
    const resumen = document.getElementById("resumenEdicionNormas");
    const lista = document.getElementById("listaNormas");
    const nombre = document.getElementById("nombreEdicion");

    if (nombre) {
        nombre.textContent = "No se pudo leer la edición actual";
    }

    if (resumen) {
        resumen.innerHTML = `
            <div class="errorNormas">
                No se pudo cargar la configuración del campeonato.
                Revisa la conexión y vuelve a intentarlo.
            </div>
        `;
    }

    if (lista) {
        lista.innerHTML = `
            <details class="bloqueNorma" open>
                <summary>
                    <span class="iconoBloqueNorma">📜</span>
                    <span class="tituloBloqueNorma">
                        <strong>Reglas generales</strong>
                        <small>Información básica del campeonato</small>
                    </span>
                    <span class="flechaBloqueNorma">›</span>
                </summary>
                <div class="contenidoNorma">
                    <p>
                        Consulta con la organización el formato, los horarios y
                        las reglas específicas de la edición.
                    </p>
                </div>
            </details>
        `;
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
