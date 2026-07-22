"use strict";

const URL_ESTADO_NORMAS =
    "https://dtv79.github.io/Campeonato/estado_torneo.json";

const SISTEMAS_PUNTUACION = {
    NORMAL: {
        nombre: "Normal",
        resumen:
            "La victoria siempre vale 3 puntos, con independencia de si el partido fue claro o ajustado. El equipo derrotado no suma y el descanso vale 0 puntos.",
        filas: [
            ["Victoria sin ceder sets", 3, 0],
            ["Victoria cediendo algún set", 3, 0],
            ["Descanso programado", 0, "—"]
        ],
        clave:
            "Premia únicamente ganar el partido. El resultado por sets no modifica los puntos de clasificación."
    },
    EQUITATIVO: {
        nombre: "Equitativo",
        resumen:
            "Mantiene 3 puntos para cualquier victoria y 0 para cualquier derrota, pero concede 2 puntos al equipo que descansa.",
        filas: [
            ["Victoria sin ceder sets", 3, 0],
            ["Victoria cediendo algún set", 3, 0],
            ["Descanso programado", 2, "—"]
        ],
        clave:
            "Compensa el descanso, pero no diferencia entre una victoria clara y una victoria ajustada."
    },
    COMPETITIVO: {
        nombre: "Competitivo",
        resumen:
            "Distingue entre una victoria clara y una victoria ajustada. Si el perdedor gana algún set, obtiene 1 punto y el ganador recibe 2; si no gana ningún set, el reparto es 3-0. El descanso vale 2 puntos.",
        filas: [
            ["Victoria sin ceder sets", 3, 0],
            ["Victoria cediendo algún set", 2, 1],
            ["Descanso programado", 2, "—"]
        ],
        clave:
            "Premia tanto la victoria como la capacidad de competir y ganar sets, incluso cuando se pierde el partido."
    }
};

const ORDENES_CLASIFICACION = {
    "OPCION A": {
        nombre: "Opción A · Rendimiento proporcional",
        resumen:
            "Primero manda la puntuación total. Si hay empate, se compara la eficacia por partido jugado para compensar a los equipos que hayan tenido descansos.",
        criterios: [
            "Puntos totales",
            "Coeficiente de puntos: puntos totales ÷ partidos jugados",
            "Diferencia de sets",
            "Sets ganados",
            "Diferencia de juegos o puntos",
            "Juegos o puntos ganados",
            "Partidos jugados, colocando primero al que haya disputado más",
            "Sorteo como último recurso"
        ],
        ejemplo:
            "Dos equipos tienen 12 puntos. Uno los consiguió en 6 partidos y otro en 7. Se coloca primero el de 6 partidos porque tiene mejor coeficiente."
    },
    "OPCION B": {
        nombre: "Opción B · Constancia y participación",
        resumen:
            "Primero manda la puntuación total. Si hay empate, se coloca por delante al equipo que haya disputado más partidos.",
        criterios: [
            "Puntos totales",
            "Partidos jugados, colocando primero al que haya disputado más",
            "Diferencia de sets",
            "Sets ganados",
            "Diferencia de juegos o puntos",
            "Juegos o puntos ganados",
            "Sorteo como último recurso"
        ],
        ejemplo:
            "Dos equipos tienen 12 puntos. Uno ha jugado 6 partidos y otro 7. Se coloca primero el de 7 partidos."
    },
    "OPCION C": {
        nombre: "Opción C · Eficacia real",
        resumen:
            "El primer criterio es el rendimiento medio por partido. Un equipo puede estar por delante con menos puntos totales si su coeficiente es superior.",
        criterios: [
            "Coeficiente puro: puntos totales ÷ partidos jugados",
            "Puntos totales",
            "Diferencia de sets",
            "Sets ganados",
            "Diferencia de juegos o puntos",
            "Juegos o puntos ganados",
            "Partidos jugados, con menor peso que en las opciones A y B",
            "Sorteo como último recurso"
        ],
        ejemplo:
            "Un equipo suma 12 puntos en 6 partidos, coeficiente 2,00. Otro suma 11 en 5, coeficiente 2,20. Se coloca primero el segundo."
    }
};

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
    const sistema = obtenerSistemaPuntuacion(config);

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

        if (esVerdadero(config.hay_regrupos)) {
            chips.push({
                icono: "🔄",
                texto: "Segunda fase de ReGrupos"
            });
        }
    } else {
        chips.push({
            icono: "🏁",
            texto: "Clasificación única"
        });

        chips.push({
            icono: "🔀",
            texto: traducirModoJornadas(config.modo_generar_jornadas)
        });
    }

    chips.push({
        icono: "🏅",
        texto: `Puntuación ${sistema.nombre.toLowerCase()}`
    });

    if (numPistas > 0) {
        chips.push({
            icono: "🎾",
            texto: `${numPistas} ${numPistas === 1 ? "pista" : "pistas"}`
        });
    }

    if (puntosSet > 0) {
        chips.push({
            icono: "🔢",
            texto: `Máximo ${puntosSet} por set`
        });
    }

    if (ronda) {
        chips.push({
            icono: "⚔️",
            texto: `Cruces desde ${ronda}`
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
        construirSistemaPuntuacion(config),
        construirClasificacion(config),
        construirEliminatorias(config)
    ];

    if (!esFormatoGrupos(config)) {
        secciones.push(construirGeneracionJornadas(config));
    }

    if (esVerdadero(config.hay_copa_palas_playa)) {
        secciones.push(construirPalasPlaya(config));
    }

    secciones.push(
        construirOrganizacionPartidos(config),
        construirResultados(),
        construirConducta(),
        construirConsejos()
    );

    const adicionales = obtenerSeccionesAdicionales(estado);

    return secciones.concat(adicionales);
}

function construirResumenRapido(config) {
    const formato = obtenerFormatoCompeticion(config);
    const pistas = numeroSeguro(config.num_pistas_disponibles);
    const puntosSet = numeroSeguro(config.puntos_maximos_por_set);
    const sistema = obtenerSistemaPuntuacion(config);
    const datos = [
        datoHTML("Primera fase", formato.titulo),
        datoHTML("Sistema de puntuación", sistema.nombre),
        datoHTML(
            "Criterio de cruces",
            textoSeguro(config.criterio_generar_cruces) ||
            "Por clasificación"
        )
    ];

    if (!esFormatoGrupos(config)) {
        datos.splice(
            1,
            0,
            datoHTML(
                "Generación de jornadas",
                traducirModoJornadas(config.modo_generar_jornadas)
            )
        );
    }

    if (pistas > 0) {
        datos.push(datoHTML("Pistas disponibles", pistas));
    }

    if (puntosSet > 0) {
        datos.push(
            datoHTML(
                "Máximo permitido por set",
                `${puntosSet} puntos`
            )
        );
    }

    return {
        icono: "⚡",
        titulo: "Resumen rápido",
        subtitulo: "Los datos principales de esta edición",
        abierto: true,
        contenido: `
            <p>
                El reglamento se adapta automáticamente a la configuración
                guardada para esta edición.
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
            subtitulo: "Liguilla con una clasificación única",
            contenido: `
                <p>
                    Todos los equipos forman parte de una misma clasificación.
                    Cada resultado suma conforme al sistema de puntuación elegido.
                </p>
                <ul>
                    <li>
                        Las jornadas se generan mediante el modo Suizo o
                        Aleatorio configurado para la edición.
                    </li>
                    <li>
                        El sistema intenta evitar enfrentamientos repetidos y
                        repartir los descansos de forma justa.
                    </li>
                    <li>
                        Al finalizar la liguilla, los equipos mejor clasificados
                        acceden a la ronda eliminatoria indicada.
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
        "Cada grupo tiene su propia clasificación y disputa un calendario de enfrentamientos internos.",
        "El modo Suizo o Aleatorio no interviene en la fase de grupos."
    ];

    if (hayRegrupos) {
        reglas.push(
            `${pasanRegrupos || "Los equipos indicados"} de cada grupo ` +
            "acceden a una segunda fase de ReGrupos."
        );

        if (puntosArrastrados > 0) {
            reglas.push(
                "Si dos equipos coinciden en un ReGrupo después de haberse " +
                "enfrentado en la primera fase, el partido no se repite. " +
                `El ganador de aquel encuentro recibe ${puntosArrastrados} ` +
                `${puntosArrastrados === 1 ? "punto" : "puntos"} de arrastre. ` +
                "Ese resultado no vuelve a sumar partidos, victorias, sets ni juegos."
            );
        }
    }

    if (pasanCruces > 0) {
        reglas.push(
            `${pasanCruces} ${pasanCruces === 1 ? "equipo" : "equipos"} ` +
            "por grupo o ReGrupo acceden a la fase eliminatoria."
        );
    }

    return {
        icono: "📊",
        titulo: "Formato de la competición",
        subtitulo: hayRegrupos
            ? "Primera fase y segunda fase de ReGrupos"
            : "Fase de grupos y clasificación independiente",
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

function construirSistemaPuntuacion(config) {
    const sistema = obtenerSistemaPuntuacion(config);
    const puntosSet = numeroSeguro(config.puntos_maximos_por_set);

    return {
        icono: "🏅",
        titulo: "Sistema de puntuación",
        subtitulo: `Cómo funciona el modo ${sistema.nombre}`,
        contenido: `
            ${datoHTML("Sistema activo", sistema.nombre)}

            <p>${escaparHTML(sistema.resumen)}</p>

            ${pintarTablaPuntuacion(sistema)}

            <p class="destacadoNorma">
                ${escaparHTML(sistema.clave)}
            </p>

            <ul>
                <li>
                    El descanso suma los puntos indicados, pero no cuenta como
                    partido jugado.
                </li>
                <li>
                    Una victoria sin ceder sets incluye resultados como 2-0 o
                    3-0. Una victoria cediendo algún set incluye resultados
                    como 2-1, 3-1 o 3-2.
                </li>
                ${puntosSet > 0 ? `
                    <li>
                        No se podrá registrar en un set una puntuación superior
                        a ${puntosSet}; el programa la considerará incorrecta.
                    </li>
                ` : ""}
            </ul>
        `
    };
}

function pintarTablaPuntuacion(sistema) {
    return `
        <div class="tablaNormasContenedor">
            <table class="tablaNormas tablaPuntuacionNormas">
                <thead>
                    <tr>
                        <th>Situación</th>
                        <th>Ganador / equipo</th>
                        <th>Perdedor</th>
                    </tr>
                </thead>
                <tbody>
                    ${sistema.filas.map(fila => `
                        <tr>
                            <td>${escaparHTML(fila[0])}</td>
                            <td>${escaparHTML(fila[1])}</td>
                            <td>${escaparHTML(fila[2])}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function construirClasificacion(config) {
    if (esFormatoGrupos(config)) {
        return construirClasificacionGrupos();
    }

    const orden = obtenerOrdenClasificacion(config);

    return {
        icono: "📈",
        titulo: "Clasificación y desempates",
        subtitulo: orden.nombre,
        contenido: `
            ${datoHTML("Orden configurado", orden.nombre)}

            <p>${escaparHTML(orden.resumen)}</p>

            ${pintarListaCriterios(orden.criterios)}

            <div class="ejemploNorma">
                <strong>Ejemplo</strong>
                <p>${escaparHTML(orden.ejemplo)}</p>
            </div>

            <p class="destacadoNorma">
                Este selector solo se aplica cuando el campeonato se disputa
                en formato Liguilla.
            </p>
        `
    };
}

function construirClasificacionGrupos() {
    const criterios = [
        "Puntos totales",
        "Diferencia de sets",
        "Diferencia de juegos o puntos",
        "Sets ganados",
        "Juegos o puntos ganados"
    ];

    return {
        icono: "📈",
        titulo: "Clasificación de los grupos",
        subtitulo: "Orden oficial dentro de cada grupo o ReGrupo",
        contenido: `
            <p>
                Cada grupo se ordena de forma independiente. La opción A, B o
                C de la hoja Configuración no se utiliza en el formato Grupos.
            </p>

            ${pintarListaCriterios(criterios)}

            <p class="destacadoNorma">
                Si dos equipos continúan completamente igualados después de
                aplicar todos los criterios, la organización resolverá el
                orden definitivo.
            </p>
        `
    };
}

function pintarListaCriterios(criterios) {
    return `
        <div class="bloqueCriteriosNorma">
            <strong>Orden de los criterios</strong>
            <ol class="listaCriteriosNorma">
                ${criterios.map(criterio => `
                    <li>${escaparHTML(criterio)}</li>
                `).join("")}
            </ol>
        </div>
    `;
}

function construirEliminatorias(config) {
    const ronda = textoSeguro(config.ronda_inicial_eliminatorias);
    const criterio = textoSeguro(config.criterio_generar_cruces) ||
        "Por clasificación";
    const reglas = obtenerReglasCruces(config, criterio);

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
                ${reglas.map(regla => `
                    <li>${escaparHTML(regla)}</li>
                `).join("")}
                <li>
                    La pareja ganadora de cada eliminatoria avanza a la ronda
                    siguiente hasta la final.
                </li>
            </ul>
        `
    };
}

function obtenerReglasCruces(config, criterio) {
    const reglas = [];
    const noEnfrentados = normalizarTexto(criterio)
        .includes("NO ENFRENTADOS");

    if (esFormatoGrupos(config)) {
        const grupos = obtenerNumeroGrupos(config);
        const pasan = numeroSeguro(
            config.equipos_pasan_a_cruces_por_grupo
        );
        const hayRegrupos = esVerdadero(config.hay_regrupos);

        if (hayRegrupos || grupos === 2) {
            if (pasan === 2) {
                reglas.push(
                    hayRegrupos
                        ? "En los ReGrupos, el 1.º de uno se enfrenta al 2.º del otro y viceversa."
                        : "El 1.º del Grupo A se enfrenta al 2.º del Grupo B y el 1.º del B al 2.º del A."
                );
            } else {
                reglas.push(
                    "Los clasificados de un grupo se cruzan con los del otro: el mejor clasificado se enfrenta al último clasificado disponible, el segundo al penúltimo y así sucesivamente."
                );
            }
        } else if (grupos === 4 && pasan === 2) {
            reglas.push(
                "El patrón inicial es 1.º A contra 2.º B, 1.º B contra 2.º A, 1.º C contra 2.º D y 1.º D contra 2.º C."
            );
        } else {
            reglas.push(
                "Los cruces se forman respetando la posición obtenida en cada grupo y el patrón configurado para la ronda."
            );
        }
    } else {
        reglas.push(
            "Los equipos clasificados se ordenan por su posición en la liguilla y el mejor se enfrenta al último clasificado disponible, el segundo al penúltimo y así sucesivamente."
        );
    }

    if (noEnfrentados) {
        reglas.push(
            "El programa intenta sustituir el cruce tradicional por enfrentamientos entre equipos que todavía no hayan jugado entre sí."
        );
        reglas.push(
            "Si no es posible evitar todas las repeticiones, selecciona la combinación que reduce al mínimo los partidos repetidos."
        );
    } else {
        reglas.push(
            "Se respeta el criterio tradicional de cruces por clasificación."
        );
    }

    return reglas;
}

function construirGeneracionJornadas(config) {
    const modo = normalizarTexto(config.modo_generar_jornadas);
    const esSuizo = modo.includes("SUIZO");

    const contenidoSuizo = `
        <p>
            Los equipos se ordenan por su puntuación actual y se emparejan con
            rivales de rendimiento parecido.
        </p>
        <ol>
            <li>Se ordenan los equipos de mayor a menor puntuación.</li>
            <li>
                Se buscan enfrentamientos entre equipos con puntuaciones
                similares.
            </li>
            <li>
                El motor evita, siempre que sea posible, que dos equipos se
                enfrenten más de una vez.
            </li>
            <li>
                Si hay un número impar, descansa el peor clasificado de los que
                menos descansos hayan tenido.
            </li>
        </ol>
        <p class="destacadoNorma">
            Su objetivo es que las jornadas sean progresivamente más
            equilibradas y competitivas.
        </p>
    `;

    const contenidoAleatorio = `
        <p>
            Los equipos se barajan antes de generar los partidos. La
            puntuación actual no decide quién se enfrenta a quién.
        </p>
        <ol>
            <li>Se crea un orden aleatorio de los equipos.</li>
            <li>
                Se utiliza el mismo motor inteligente que intenta evitar
                enfrentamientos repetidos.
            </li>
            <li>Los descansos se siguen repartiendo de forma justa.</li>
            <li>
                El resultado ofrece más variedad y un mayor factor sorpresa.
            </li>
        </ol>
        <p class="destacadoNorma">
            Es un modo más amistoso y menos condicionado por la clasificación.
        </p>
    `;

    return {
        icono: "🔀",
        titulo: "Generación de jornadas",
        subtitulo: traducirModoJornadas(config.modo_generar_jornadas),
        contenido: `
            ${datoHTML(
                "Modo activo",
                traducirModoJornadas(config.modo_generar_jornadas)
            )}
            ${esSuizo ? contenidoSuizo : contenidoAleatorio}
            <p class="notaNorma">
                Este apartado solo aparece en campeonatos de Liguilla. En el
                formato Grupos se utiliza el calendario propio de cada grupo.
            </p>
        `
    };
}

function construirPalasPlaya(config) {
    const criterio = textoSeguro(config.criterio_palas_playa) ||
        textoSeguro(config.criterio_generar_cruces) ||
        "Por clasificación";
    const posicion = numeroSeguro(config.posicion_inicio_palas_playa);
    const noEnfrentados = normalizarTexto(criterio)
        .includes("NO ENFRENTADOS");

    return {
        icono: "🏖️",
        titulo: "Copa Palas de Playa",
        subtitulo: "Competición inversa por el Farolillo Rojo",
        contenido: `
            ${datoHTML("Criterio de cruces", criterio)}
            ${posicion > 0
                ? datoHTML(
                    "Equipos participantes",
                    `Desde la posición ${posicion} de la clasificación`
                )
                : ""
            }

            <p>
                Esta competición opcional permite que los equipos que no
                acceden al cuadro principal continúen jugando y determina el
                Farolillo Rojo del campeonato.
            </p>

            <ol>
                <li>La competición se desarrolla por rondas eliminatorias.</li>
                <li>El equipo que gana queda eliminado de Palas de Playa.</li>
                <li>El equipo que pierde continúa en la siguiente ronda.</li>
                <li>
                    El último equipo que permanece en competición es proclamado
                    Farolillo Rojo.
                </li>
                <li>
                    Si hay un número impar de equipos, descansa el mejor
                    clasificado de los que siguen en competición.
                </li>
            </ol>

            <p class="destacadoNorma">
                ${noEnfrentados
                    ? "El programa intenta evitar enfrentamientos ya disputados y, si no puede evitarlos todos, minimiza las repeticiones."
                    : "Los emparejamientos siguen el orden de la clasificación final."
                }
            </p>
        `
    };
}

function construirOrganizacionPartidos(config) {
    const pistas = numeroSeguro(config.num_pistas_disponibles);

    return {
        icono: "🗓️",
        titulo: "Pistas y orden de juego",
        subtitulo: "Cómo se organiza el desarrollo del campeonato",
        contenido: `
            ${pistas > 0
                ? datoHTML("Pistas disponibles", pistas)
                : ""
            }

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
            ? "La competición comienza por grupos y continúa con una segunda fase de ReGrupos antes de las eliminatorias."
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

function obtenerSistemaPuntuacion(config) {
    const clave = normalizarTexto(config.sistema_puntuacion) || "NORMAL";

    return SISTEMAS_PUNTUACION[clave] || {
        ...SISTEMAS_PUNTUACION.NORMAL,
        nombre: textoSeguro(config.sistema_puntuacion) || "Normal"
    };
}

function obtenerOrdenClasificacion(config) {
    const clave = normalizarTexto(config.ordenar_clasificacion) ||
        "OPCION A";

    return ORDENES_CLASIFICACION[clave] || {
        ...ORDENES_CLASIFICACION["OPCION A"],
        nombre: textoSeguro(config.ordenar_clasificacion) ||
            ORDENES_CLASIFICACION["OPCION A"].nombre
    };
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
