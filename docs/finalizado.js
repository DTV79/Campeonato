/* =========================================================
   PORTADA ESPECIAL · CAMPEONATO FINALIZADO
   Se activa únicamente cuando estado_torneo = "Finalizado".
========================================================= */

(() => {
    "use strict";

    if (window.__portadaFinalizadaInstalada) return;
    window.__portadaFinalizadaInstalada = true;

    const CLAVE_CONFETI = "sprintPadelConfetiFinal";
    let funcionesEnvuelta = false;

    esperarDatos();

    function esperarDatos(intentos = 0) {
        if (typeof datos !== "undefined" && datos) {
            instalarPortadaFinalizada();
            return;
        }

        if (intentos < 200) {
            window.setTimeout(() => esperarDatos(intentos + 1), 100);
        }
    }

    function instalarPortadaFinalizada() {
        if (!esCampeonatoFinalizado()) {
            limpiarModoFinalizado();
            return;
        }

        envolverNavegacion();
        aplicarPortadaFinalizada();
        prepararBotonCelebrar();
    }

    function esCampeonatoFinalizado() {
        const config = datos?.configuracion || {};
        const estado =
            config.estado_torneo ||
            config.estado ||
            datos?.estado_torneo ||
            "";

        return normalizarFinal(estado).includes("FINALIZ");
    }

    function envolverNavegacion() {
        if (funcionesEnvuelta) return;
        funcionesEnvuelta = true;

        if (typeof pintarInicio === "function") {
            const pintarInicioOriginal = pintarInicio;

            pintarInicio = function (...argumentos) {
                const resultado = pintarInicioOriginal.apply(this, argumentos);
                window.setTimeout(aplicarPortadaFinalizada, 0);
                return resultado;
            };
        }

        if (typeof ocultarInicio === "function") {
            const ocultarInicioOriginal = ocultarInicio;

            ocultarInicio = function (...argumentos) {
                const resultado = ocultarInicioOriginal.apply(this, argumentos);
                document
                    .getElementById("portadaFinalizada")
                    ?.classList.add("oculto");
                document.body.classList.remove("enInicioFinalizado");
                return resultado;
            };
        }

        if (typeof mostrarInicio === "function") {
            const mostrarInicioOriginal = mostrarInicio;

            mostrarInicio = function (...argumentos) {
                const resultado = mostrarInicioOriginal.apply(this, argumentos);
                document.body.classList.add("enInicioFinalizado");
                document
                    .getElementById("portadaFinalizada")
                    ?.classList.remove("oculto");
                window.setTimeout(aplicarPortadaFinalizada, 0);
                return resultado;
            };
        }
    }

    function aplicarPortadaFinalizada() {
        if (!esCampeonatoFinalizado()) return;

        const resumen = obtenerResumenFinal();

        document.body.classList.remove("modoPretorneo");
        document.body.classList.add("modoFinalizado", "enInicioFinalizado");

        pintarCabeceraFinal(resumen);
        pintarCelebracionFinal(resumen);
        configurarTarjetasFinales(resumen);

        document
            .querySelector(".podioCard")
            ?.classList.add("oculto");

        lanzarConfetiUnaVez();
    }

    function obtenerResumenFinal() {
        const config = datos?.configuracion || {};
        const cruces = Array.isArray(datos?.cruces)
            ? datos.cruces
            : [];

        const partidoFinal = obtenerPartidoFinal(cruces);
        const campeones = obtenerCampeones(partidoFinal);
        const subcampeones = obtenerSubcampeones(partidoFinal, campeones);
        const resultadoFinal = obtenerResultadoPartido(partidoFinal);
        const partidos = obtenerTodosLosPartidos();
        const partidosJugados = partidos.filter(esPartidoJugadoFinal).length;
        const equipos = Array.isArray(datos?.equipos)
            ? datos.equipos.filter(equipo => textoFinal(equipo?.equipo))
            : [];

        const anio =
            config.anio_campeonato ||
            new Date().getFullYear();

        const nombre =
            config.nombre_campeonato ||
            config.id_campeonato ||
            "Campeonato Sprint Pádel Tui";

        const foto =
            config.foto_campeones ||
            config.imagen_campeones ||
            config.url_foto_campeones ||
            datos?.foto_campeones ||
            "";

        return {
            anio,
            nombre,
            fecha: config.fecha_campeonato || "",
            lugar: config.lugar_campeonato || "",
            campeones,
            subcampeones,
            resultadoFinal,
            partidoFinal,
            totalEquipos: equipos.length,
            partidosJugados,
            totalPartidos: partidos.length,
            pistas: Number(config.num_pistas_disponibles) || 0,
            foto
        };
    }

    function obtenerPartidoFinal(cruces) {
        const finales = cruces.filter(partido => {
            const fase = normalizarFinal(partido?.fase);
            return fase === "FINAL" || fase === "GRAN FINAL";
        });

        return finales.at(-1) || null;
    }

    function obtenerCampeones(partidoFinal) {
        return textoFinal(
            partidoFinal?.ganador ||
            datos?.campeon ||
            datos?.campeones ||
            datos?.ganador_torneo
        ) || "Campeones por confirmar";
    }

    function obtenerSubcampeones(partidoFinal, campeones) {
        if (!partidoFinal) return "Subcampeones por confirmar";

        const local = textoFinal(
            partidoFinal.local ||
            partidoFinal.equipo1 ||
            partidoFinal.equipo_a
        );

        const visitante = textoFinal(
            partidoFinal.visitante ||
            partidoFinal.equipo2 ||
            partidoFinal.equipo_b
        );

        if (!local && !visitante) {
            return "Subcampeones por confirmar";
        }

        if (mismoEquipo(local, campeones)) {
            return visitante || "Subcampeones por confirmar";
        }

        if (mismoEquipo(visitante, campeones)) {
            return local || "Subcampeones por confirmar";
        }

        return textoFinal(partidoFinal.perdedor) ||
            visitante ||
            local ||
            "Subcampeones por confirmar";
    }

    function obtenerResultadoPartido(partido) {
        const resultado = partido?.resultado;

        if (Array.isArray(resultado)) {
            return resultado
                .map(textoFinal)
                .filter(Boolean)
                .join(" · ");
        }

        return textoFinal(
            resultado ||
            partido?.marcador ||
            partido?.resultado_final
        );
    }

    function obtenerTodosLosPartidos() {
        const todos = [];

        agregarPartidos(todos, datos?.partidos);
        agregarPartidos(todos, datos?.grupos?.partidos);
        agregarPartidos(todos, datos?.regrupos?.partidos);
        agregarPartidos(todos, datos?.cruces);

        if (Array.isArray(datos?.palas_playa)) {
            datos.palas_playa.forEach(ronda => {
                agregarPartidos(todos, ronda?.partidos);
            });
        }

        const unicos = new Map();

        todos.forEach((partido, indice) => {
            if (esDescansoFinal(partido)) return;

            const clave = [
                normalizarFinal(partido?.fase),
                partido?.id ?? indice,
                normalizarFinal(partido?.local || partido?.equipo1),
                normalizarFinal(partido?.visitante || partido?.equipo2)
            ].join("|");

            if (!unicos.has(clave)) {
                unicos.set(clave, partido);
            }
        });

        return [...unicos.values()];
    }

    function agregarPartidos(destino, origen) {
        if (Array.isArray(origen)) {
            destino.push(...origen);
        }
    }

    function esDescansoFinal(partido) {
        return normalizarFinal(partido?.estado) === "DESCANSO" ||
            normalizarFinal(partido?.descanso) === "SI" ||
            normalizarFinal(partido?.ganador) === "DESCANSO";
    }

    function esPartidoJugadoFinal(partido) {
        const estado = normalizarFinal(partido?.estado);

        return estado === "JUGADO" ||
            estado === "FINALIZADO" ||
            Boolean(textoFinal(partido?.ganador));
    }

    function pintarCabeceraFinal(resumen) {
        const cabecera = document.querySelector(".cabecera");
        const barra = document.getElementById("barraProgreso");

        cabecera?.classList.add("cabeceraFinalizada", "cabeceraCelebracion");

        ponerTexto("estadoCabecera", "🏆 CAMPEONATO FINALIZADO");

        ponerTexto(
            "textoProgreso",
            resumen.campeones && !resumen.campeones.includes("confirmar")
                ? `🥇 Campeones: ${resumen.campeones}`
                : "La edición ha llegado a su final"
        );

        if (barra) {
            barra.style.width = "100%";
            barra.className = "progreso barraFinalizado";
        }
    }

    function pintarCelebracionFinal(resumen) {
        const contenedor = document.querySelector(".contenedor");
        const grid = document.querySelector(".gridDashboard");

        if (!contenedor || !grid) return;

        let portada = document.getElementById("portadaFinalizada");

        if (!portada) {
            portada = document.createElement("section");
            portada.id = "portadaFinalizada";
            portada.className = "portadaFinalizada";
            contenedor.insertBefore(portada, grid);
        }

        const hayFinal = Boolean(resumen.partidoFinal);
        const hayFoto = Boolean(textoFinal(resumen.foto));
        const etiquetaEdicion = resumen.anio
            ? `EDICIÓN ${escaparFinal(resumen.anio)} FINALIZADA`
            : "EDICIÓN FINALIZADA";

        portada.innerHTML = `
            <div class="cieloConfeti" id="cieloConfeti" aria-hidden="true"></div>

            <article class="coronaCampeones">
                <div class="destello destelloUno" aria-hidden="true"></div>
                <div class="destello destelloDos" aria-hidden="true"></div>

                <span class="selloEdicion">${etiquetaEdicion}</span>
                <div class="trofeoFinal" aria-hidden="true">🏆</div>
                <p class="tituloCampeones">CAMPEONES ${escaparFinal(resumen.anio)}</p>
                <h1>${escaparFinal(resumen.campeones)}</h1>

                ${hayFoto ? `
                    <figure class="fotoCampeones">
                        <img
                            src="${escaparAtributoFinal(resumen.foto)}"
                            alt="Campeones ${escaparAtributoFinal(resumen.anio)}"
                            onerror="this.closest('figure').remove()"
                        >
                    </figure>
                ` : ""}

                <p class="textoCorona">
                    Ganadores de ${escaparFinal(resumen.nombre)}
                </p>

                <button class="btnCelebrar" id="btnCelebrarFinal" type="button">
                    🎉 Celebrar de nuevo
                </button>
            </article>

            ${hayFinal ? pintarTarjetaGranFinal(resumen) : ""}

            <article class="cifrasFinales">
                <h2>El campeonato en cifras</h2>

                <div class="rejillaCifras">
                    <div>
                        <strong>${resumen.totalEquipos || "—"}</strong>
                        <span>Equipos</span>
                    </div>
                    <div>
                        <strong>${resumen.partidosJugados || "—"}</strong>
                        <span>Partidos disputados</span>
                    </div>
                    <div>
                        <strong>${resumen.pistas || "—"}</strong>
                        <span>Pistas</span>
                    </div>
                </div>
            </article>

            <article class="mensajeDespedida">
                <span aria-hidden="true">🎾</span>
                <p>
                    Gracias a todos los participantes por hacer posible esta edición.
                    Enhorabuena a los campeones y a todos los equipos por el gran ambiente vivido.
                </p>
                <strong>Nos vemos en la próxima edición.</strong>
                ${pintarFechaLugar(resumen)}
            </article>
        `;
    }

    function pintarTarjetaGranFinal(resumen) {
        const partido = resumen.partidoFinal || {};
        const local = textoFinal(
            partido.local ||
            partido.equipo1 ||
            partido.equipo_a
        ) || "Finalista";

        const visitante = textoFinal(
            partido.visitante ||
            partido.equipo2 ||
            partido.equipo_b
        ) || "Finalista";

        return `
            <article class="granFinalCelebracion">
                <div class="cabeceraGranFinal">
                    <span>GRAN FINAL</span>
                    <strong>Partido finalizado</strong>
                </div>

                ${pintarEquipoFinal(local, resumen.campeones)}

                <div class="marcadorFinal">
                    ${escaparFinal(resumen.resultadoFinal || "Resultado registrado")}
                </div>

                ${pintarEquipoFinal(visitante, resumen.campeones)}
            </article>
        `;
    }

    function pintarEquipoFinal(equipo, campeones) {
        const esCampeon = mismoEquipo(equipo, campeones);

        return `
            <div class="equipoGranFinal ${esCampeon ? "equipoCampeonFinal" : "equipoSubcampeonFinal"}">
                <span>${esCampeon ? "🏆" : "🥈"}</span>
                <div>
                    <small>${esCampeon ? "CAMPEONES" : "SUBCAMPEONES"}</small>
                    <strong>${escaparFinal(equipo)}</strong>
                </div>
            </div>
        `;
    }

    function pintarFechaLugar(resumen) {
        const detalles = [resumen.fecha, resumen.lugar]
            .map(textoFinal)
            .filter(Boolean);

        if (!detalles.length) return "";

        return `<small>${escaparFinal(detalles.join(" · "))}</small>`;
    }

    function configurarTarjetasFinales(resumen) {
        const tarjetaCompeticion = document.getElementById("tarjetaCompeticion");
        const tarjetaPartidos = document.getElementById("tarjetaPartidos");
        const tarjetaCruces = document.getElementById("tarjetaEquipos");
        const tarjetaPalas = document.getElementById("tarjetaEspecial");
        const tarjetaEquiposFinal = obtenerTarjetaEquiposFinal();

        document.querySelector(".gridDashboard")?.classList.add("gridFinalizado");

        configurarTarjeta(
            tarjetaCompeticion,
            "📊",
            esModoGruposFinal() ? "Clasificaciones finales" : "Clasificación definitiva",
            esModoGruposFinal()
                ? "Consulta el resultado final de cada grupo"
                : "Consulta la posición final de todos los equipos",
            "competicion"
        );

        configurarTarjeta(
            tarjetaPartidos,
            "🎾",
            "Todos los resultados",
            `${resumen.partidosJugados || 0} partidos disputados`,
            "partidos"
        );

        configurarTarjeta(
            tarjetaCruces,
            "🏆",
            "Camino hacia el título",
            "Consulta el cuadro completo hasta la final",
            "eliminatorias"
        );

        if (tarjetaCruces) {
            tarjetaCruces.classList.remove("cardPalas", "tarjetaBloqueada");
            tarjetaCruces.classList.add("cardCruces", "cardCaminoTitulo");
            tarjetaCruces.removeAttribute("aria-disabled");
        }

        const hayPalas = Array.isArray(datos?.palas_playa) && datos.palas_playa.length > 0;

        if (tarjetaPalas && hayPalas) {
            configurarTarjeta(
                tarjetaPalas,
                "🏖️",
                "Copa Palas Playa",
                "Consulta el resultado final de la copa",
                "palas"
            );
            tarjetaPalas.classList.remove("tarjetaBloqueada");
            tarjetaPalas.removeAttribute("aria-disabled");
        }

        configurarTarjeta(
            tarjetaEquiposFinal,
            "👥",
            "Equipos",
            "Consulta todos los equipos participantes",
            "equipos"
        );
    }

    function obtenerTarjetaEquiposFinal() {
        let tarjeta =
            document.getElementById("tarjetaRanking") ||
            document.getElementById("tarjetaEquiposFinal");

        if (!tarjeta) {
            const grid = document.querySelector(".gridDashboard");
            if (!grid) return null;

            tarjeta = document.createElement("div");
            tarjeta.id = "tarjetaEquiposFinal";
            tarjeta.className = "cardAcceso cardEquiposFinal";
            tarjeta.innerHTML = `
                <div class="iconoAcceso">👥</div>
                <div>
                    <h4>Equipos</h4>
                    <p>Consulta todos los equipos participantes</p>
                </div>
                <span class="flecha">→</span>
            `;

            grid.appendChild(tarjeta);
        }

        tarjeta.classList.remove(
            "oculto",
            "cardRanking",
            "tarjetaBloqueada"
        );
        tarjeta.classList.add("cardEquiposFinal");
        tarjeta.removeAttribute("aria-disabled");

        return tarjeta;
    }

    function configurarTarjeta(tarjeta, icono, titulo, resumen, seccion) {
        if (!tarjeta) return;

        const nodoIcono = tarjeta.querySelector(".iconoAcceso");
        const nodoTitulo = tarjeta.querySelector("h4");
        const nodoResumen = tarjeta.querySelector("p");

        if (nodoIcono) nodoIcono.textContent = icono;
        if (nodoTitulo) nodoTitulo.textContent = titulo;
        if (nodoResumen) nodoResumen.textContent = resumen;

        tarjeta.dataset.seccion = seccion;
    }

    function esModoGruposFinal() {
        const config = datos?.configuracion || {};
        const tipo =
            config.tipo_campeonato ||
            config.sistema_primera_fase ||
            config.formato_inicial ||
            "";

        return normalizarFinal(tipo).includes("GRUPO") ||
            Boolean(datos?.grupos?.clasificaciones?.length);
    }

    function prepararBotonCelebrar() {
        document.addEventListener("click", evento => {
            if (!evento.target.closest("#btnCelebrarFinal")) return;
            lanzarConfeti(true);
        });
    }

    function lanzarConfetiUnaVez() {
        const config = datos?.configuracion || {};
        const campeonato =
            config.id_campeonato ||
            config.nombre_campeonato ||
            config.anio_campeonato ||
            "actual";

        const clave = `${CLAVE_CONFETI}:${campeonato}`;

        try {
            if (sessionStorage.getItem(clave)) return;
            sessionStorage.setItem(clave, "1");
        } catch (error) {
            // La celebración seguirá funcionando aunque el navegador bloquee sessionStorage.
        }

        lanzarConfeti(false);
    }

    function lanzarConfeti(forzar) {
        if (!esCampeonatoFinalizado()) return;

        const cielo = document.getElementById("cieloConfeti");
        if (!cielo) return;

        cielo.innerHTML = "";
        cielo.classList.add("confetiActivo");

        const cantidad = forzar ? 95 : 75;
        const fragmento = document.createDocumentFragment();

        for (let indice = 0; indice < cantidad; indice += 1) {
            const pieza = document.createElement("i");
            pieza.className = "piezaConfeti";
            pieza.style.setProperty("--x", `${Math.random() * 100}%`);
            pieza.style.setProperty("--giro", `${Math.random() * 720 - 360}deg`);
            pieza.style.setProperty("--retardo", `${Math.random() * 0.9}s`);
            pieza.style.setProperty("--duracion", `${2.8 + Math.random() * 1.8}s`);
            pieza.style.setProperty("--escala", `${0.65 + Math.random() * 0.9}`);
            pieza.style.setProperty("--tono", `${Math.floor(Math.random() * 6)}`);
            fragmento.appendChild(pieza);
        }

        cielo.appendChild(fragmento);

        window.setTimeout(() => {
            cielo.classList.remove("confetiActivo");
            cielo.innerHTML = "";
        }, 5200);
    }

    function limpiarModoFinalizado() {
        document.body.classList.remove("modoFinalizado", "enInicioFinalizado");
        document.getElementById("portadaFinalizada")?.remove();
    }

    function ponerTexto(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    }

    function mismoEquipo(equipoA, equipoB) {
        return Boolean(equipoA && equipoB) &&
            normalizarFinal(equipoA) === normalizarFinal(equipoB);
    }

    function textoFinal(valor) {
        return String(valor ?? "").trim();
    }

    function normalizarFinal(valor) {
        return textoFinal(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replaceAll("_", " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function escaparFinal(valor) {
        return textoFinal(valor)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function escaparAtributoFinal(valor) {
        return escaparFinal(valor).replaceAll("`", "&#096;");
    }
})();

/* =========================================================
   AJUSTES V2 · PORTADA DE CAMPEONATO FINALIZADO
   - Cabecera compacta
   - Marcador claro de la Gran Final
   - Estadísticas completas de todas las fases
   - Reconocimiento humorístico de Palas Playa
========================================================= */

(() => {
    "use strict";

    if (window.__finalizadoV2Instalado) return;
    window.__finalizadoV2Instalado = true;

    let ajustePendiente = false;

    esperarPortada();

    const observador = new MutationObserver(programarAjustes);
    observador.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    document.addEventListener(
        "click",
        gestionarClickNavegacionFinal
    );

    function esperarPortada(intentos = 0) {
        if (typeof datos !== "undefined" && datos) {
            aplicarAjustes();
            return;
        }

        if (intentos < 200) {
            window.setTimeout(() => esperarPortada(intentos + 1), 100);
        }
    }

    function programarAjustes() {
        if (ajustePendiente) return;
        ajustePendiente = true;

        window.requestAnimationFrame(() => {
            ajustePendiente = false;
            aplicarAjustes();
        });
    }

    function aplicarAjustes() {
        if (!esFinalizado()) return;

        compactarCabecera();
        configurarRankingNavegacionFinal();
        sincronizarNavegacionFinal();
        limpiarPantallaMasFinal();
        agregarEquiposPantallaMas();

        const portada = document.getElementById("portadaFinalizada");
        if (!portada) return;

        const resumen = calcularResumenCompleto();

        renovarGranFinal(portada, resumen);
        renovarCifras(portada, resumen);
        pintarFarolilloPalas(portada, resumen);
    }

    function esFinalizado() {
        const config = datos?.configuracion || {};
        const estado =
            config.estado_torneo ||
            config.estado ||
            datos?.estado_torneo ||
            "";

        return normalizarV2(estado).includes("FINALIZ");
    }

    /* =====================================================
       CABECERA COMPACTA
    ===================================================== */

    function compactarCabecera() {
        const cabecera = document.querySelector(".cabecera");
        if (!cabecera) return;

        cabecera.classList.add("cabeceraFinalCompacta");

        ponerTextoV2("estadoCabecera", "🏆 CAMPEONATO FINALIZADO");
        ponerTextoV2("textoProgreso", "");

        const barra = document.getElementById("barraProgreso");
        if (barra) barra.style.width = "100%";
    }

    /* =====================================================
       RESUMEN Y ESTADÍSTICAS
    ===================================================== */

    function calcularResumenCompleto() {
        const partidos = reunirPartidosTorneo();
        const jugados = partidos.filter(esPartidoJugadoV2);
        const partidosConDuracion = jugados.filter(
            partido => numeroV2(partido?.duracion_min) > 0
        );

        let totalMinutos = 0;
        let totalSets = 0;
        let totalPuntos = 0;
        let partidosConResultado = 0;
        let partidoMasLargo = null;
        let partidoMasCorto = null;

        partidosConDuracion.forEach(partido => {
            const minutos = numeroV2(partido.duracion_min);
            totalMinutos += minutos;

            if (
                !partidoMasLargo ||
                minutos > numeroV2(partidoMasLargo.duracion_min)
            ) {
                partidoMasLargo = partido;
            }

            if (
                !partidoMasCorto ||
                minutos < numeroV2(partidoMasCorto.duracion_min)
            ) {
                partidoMasCorto = partido;
            }
        });

        jugados.forEach(partido => {
            const sets = obtenerSetsPartido(partido);

            if (sets.length) {
                partidosConResultado += 1;
            }

            totalSets += sets.length;

            sets.forEach(set => {
                totalPuntos += set.local + set.visitante;
            });
        });

        const mediaMinutos = partidosConDuracion.length
            ? Math.round(totalMinutos / partidosConDuracion.length)
            : 0;

        const mediaPuntos = partidosConResultado
            ? Math.round(totalPuntos / partidosConResultado)
            : 0;

        const config = datos?.configuracion || {};
        const cruces = Array.isArray(datos?.cruces)
            ? datos.cruces
            : [];

        const final = obtenerPartidoFinalV2(cruces);
        const campeones = textoV2(
            final?.ganador ||
            datos?.campeon ||
            datos?.campeones ||
            datos?.ganador_torneo
        );

        return {
            final,
            campeones,
            totalEquipos: Array.isArray(datos?.equipos)
                ? datos.equipos.filter(equipo => textoV2(equipo?.equipo)).length
                : 0,
            pistas: numeroV2(config.num_pistas_disponibles),
            partidosJugados: jugados.length,
            totalMinutos,
            totalSets,
            totalPuntos,
            mediaMinutos,
            mediaPuntos,
            partidoMasLargo,
            partidoMasCorto,
            ultimoPalas: obtenerUltimoEquipoPalas()
        };
    }

    function reunirPartidosTorneo() {
        const candidatos = [];

        agregarPartidosV2(candidatos, datos?.partidos, "liga");
        agregarPartidosV2(candidatos, datos?.grupos?.partidos, "grupos");
        agregarPartidosV2(candidatos, datos?.regrupos?.partidos, "regrupos");
        agregarPartidosV2(candidatos, datos?.cruces, "cruces");

        if (Array.isArray(datos?.palas_playa)) {
            datos.palas_playa.forEach((ronda, indiceRonda) => {
                agregarPartidosV2(
                    candidatos,
                    ronda?.partidos,
                    `palas-${indiceRonda}`
                );
            });
        }

        const unicos = new Map();

        candidatos.forEach(({ partido, origen }, indice) => {
            if (!partido || esDescansoV2(partido)) return;

            const clave = [
                normalizarV2(partido.fase || origen),
                partido.id ?? partido.orden ?? indice,
                normalizarV2(nombreLocalV2(partido)),
                normalizarV2(nombreVisitanteV2(partido)),
                normalizarV2(JSON.stringify(partido.resultado || []))
            ].join("|");

            if (!unicos.has(clave)) {
                unicos.set(clave, partido);
            }
        });

        return [...unicos.values()];
    }

    function agregarPartidosV2(destino, partidos, origen) {
        if (!Array.isArray(partidos)) return;

        partidos.forEach(partido => {
            destino.push({ partido, origen });
        });
    }

    function esDescansoV2(partido) {
        return normalizarV2(partido?.estado) === "DESCANSO" ||
            normalizarV2(partido?.descanso) === "SI" ||
            normalizarV2(partido?.ganador) === "DESCANSO";
    }

    function esPartidoJugadoV2(partido) {
        const estado = normalizarV2(partido?.estado);

        return !esDescansoV2(partido) && (
            estado === "JUGADO" ||
            estado === "FINALIZADO" ||
            Boolean(textoV2(partido?.ganador)) ||
            obtenerSetsPartido(partido).length > 0
        );
    }

    function obtenerSetsPartido(partido) {
        let resultados = partido?.resultado;

        if (!Array.isArray(resultados)) {
            resultados = textoV2(resultados)
                .split(/[·,;/|]+/)
                .map(valor => valor.trim())
                .filter(Boolean);
        }

        return resultados
            .map(resultado => {
                if (Array.isArray(resultado) && resultado.length >= 2) {
                    return {
                        local: numeroV2(resultado[0]),
                        visitante: numeroV2(resultado[1])
                    };
                }

                const coincidencia = textoV2(resultado).match(
                    /(\d+)\s*[-–:]\s*(\d+)/
                );

                if (!coincidencia) return null;

                return {
                    local: numeroV2(coincidencia[1]),
                    visitante: numeroV2(coincidencia[2])
                };
            })
            .filter(set => set && (set.local > 0 || set.visitante > 0));
    }

    /* =====================================================
       MARCADOR DE LA GRAN FINAL
    ===================================================== */

    function renovarGranFinal(portada, resumen) {
        const tarjeta = portada.querySelector(".granFinalCelebracion");
        if (!tarjeta || tarjeta.dataset.v2 === "1" || !resumen.final) return;

        const local = nombreLocalV2(resumen.final) || "Finalista";
        const visitante = nombreVisitanteV2(resumen.final) || "Finalista";
        const sets = obtenerSetsPartido(resumen.final);
        const numeroSets = Math.max(sets.length, 1);

        tarjeta.dataset.v2 = "1";
        tarjeta.classList.add("marcadorGranFinalV2");
        tarjeta.style.setProperty("--sets-final", numeroSets);

        tarjeta.innerHTML = `
            <div class="tituloMarcadorFinal">
                <div>
                    <span>🏆 GRAN FINAL</span>
                    <strong>Resultado definitivo</strong>
                </div>
                <small>FINALIZADA</small>
            </div>

            <div class="cabeceraSetsFinal">
                <span>EQUIPO</span>
                ${sets.length
                    ? sets.map((_, indice) => `<span>SET ${indice + 1}</span>`).join("")
                    : "<span>RESULTADO</span>"
                }
            </div>

            ${pintarFilaMarcadorV2(
                local,
                sets,
                "local",
                mismoEquipoV2(local, resumen.campeones)
            )}

            ${pintarFilaMarcadorV2(
                visitante,
                sets,
                "visitante",
                mismoEquipoV2(visitante, resumen.campeones)
            )}
        `;
    }

    function pintarFilaMarcadorV2(equipo, sets, lado, esCampeon) {
        const valores = sets.length
            ? sets.map(set => {
                const valor = set[lado];
                const rival = lado === "local"
                    ? set.visitante
                    : set.local;

                return `
                    <span class="puntoSetFinal ${valor > rival ? "setGanadoFinal" : ""}">
                        ${valor}
                    </span>
                `;
            }).join("")
            : "<span class=\"puntoSetFinal\">—</span>";

        return `
            <div class="filaMarcadorFinal ${esCampeon ? "filaCampeonaFinal" : "filaSubcampeonaFinal"}">
                <div class="nombreEquipoMarcador">
                    <span aria-hidden="true">${esCampeon ? "🏆" : "🥈"}</span>
                    <div>
                        <small>${esCampeon ? "CAMPEONES" : "SUBCAMPEONES"}</small>
                        <strong>${escaparV2(equipo)}</strong>
                    </div>
                </div>
                ${valores}
            </div>
        `;
    }

    function obtenerPartidoFinalV2(cruces) {
        return cruces
            .filter(partido => {
                const fase = normalizarV2(partido?.fase);
                return fase === "FINAL" || fase === "GRAN FINAL";
            })
            .at(-1) || null;
    }

    /* =====================================================
       CAMPEONATO EN CIFRAS
    ===================================================== */

    function renovarCifras(portada, resumen) {
        const tarjeta = portada.querySelector(".cifrasFinales");
        if (!tarjeta || tarjeta.dataset.v2 === "1") return;

        tarjeta.dataset.v2 = "1";
        tarjeta.classList.add("cifrasFinalesV2");

        tarjeta.innerHTML = `
            <h2>El campeonato en cifras</h2>
            <p class="subtituloCifras">
                Liga, grupos, cruces y Copa Palas Playa
            </p>

            <div class="rejillaCifras rejillaCifrasAmpliada">
                ${pintarCifraV2(resumen.totalEquipos || "—", "Equipos", "👥")}
                ${pintarCifraV2(resumen.partidosJugados || "—", "Partidos", "🎾")}
                ${pintarCifraV2(resumen.totalSets || "—", "Sets jugados", "🔢")}
                ${pintarCifraV2(formatearNumeroV2(resumen.totalPuntos), "Puntos jugados", "🔥")}
                ${pintarCifraV2(formatearTiempoV2(resumen.totalMinutos), "Tiempo total jugado", "⏱️")}
                ${pintarCifraV2(
                    resumen.mediaMinutos ? `${resumen.mediaMinutos} min` : "—",
                    "Duración media",
                    "📊"
                )}
                ${pintarCifraV2(
                    resumen.mediaPuntos || "—",
                    "Puntos por partido",
                    "🎯"
                )}
                ${pintarCifraV2(resumen.pistas || "—", "Pistas utilizadas", "📍")}
                ${pintarCifraV2(
                    resumen.partidoMasLargo
                        ? `${numeroV2(resumen.partidoMasLargo.duracion_min)} min`
                        : "—",
                    "Partido más largo",
                    "⌛"
                )}
                ${pintarCifraV2(
                    resumen.partidoMasCorto
                        ? `${numeroV2(resumen.partidoMasCorto.duracion_min)} min`
                        : "—",
                    "Partido más corto",
                    "⚡"
                )}
            </div>

            <div class="detalleExtremosPartidos">
                ${pintarDetallePartidoExtremo(
                    "⌛",
                    "El partido más largo",
                    resumen.partidoMasLargo
                )}
                ${pintarDetallePartidoExtremo(
                    "⚡",
                    "El partido más corto",
                    resumen.partidoMasCorto
                )}
            </div>
        `;
    }

    function pintarDetallePartidoExtremo(
        icono,
        titulo,
        partido
    ) {
        if (!partido) return "";

        const local =
            nombreLocalV2(partido) ||
            "Equipo 1";

        const visitante =
            nombreVisitanteV2(partido) ||
            "Equipo 2";

        return `
            <div class="detallePartidoExtremo">
                <span>${icono} ${escaparV2(titulo)}</span>
                <strong class="equipoPartidoExtremo">
                    ${escaparV2(local)}
                </strong>
                <strong class="equipoPartidoExtremo equipoPartidoExtremoSegundo">
                    ${escaparV2(visitante)}
                </strong>
            </div>
        `;
    }

    function pintarCifraV2(valor, etiqueta, icono) {
        return `
            <div class="cifraAmpliada">
                <span class="iconoCifra">${icono}</span>
                <strong>${escaparV2(valor)}</strong>
                <span>${escaparV2(etiqueta)}</span>
            </div>
        `;
    }

    function formatearTiempoV2(minutos) {
        const total = numeroV2(minutos);
        if (!total) return "—";

        const horas = Math.floor(total / 60);
        const resto = total % 60;

        if (!horas) return `${resto} min`;
        if (!resto) return `${horas} h`;
        return `${horas} h ${resto} min`;
    }

    function formatearNumeroV2(valor) {
        const numero = numeroV2(valor);
        return numero
            ? numero.toLocaleString("es-ES")
            : "—";
    }

    /* =====================================================
       PALAS PLAYA · ÚLTIMO EQUIPO CON HUMOR
    ===================================================== */

    function obtenerUltimoEquipoPalas() {
        const config = datos?.configuracion || {};
        const valorCopa = config.hay_copa_palas_playa;
        const hayCopa = valorCopa === true ||
            normalizarV2(valorCopa) === "SI";

        if (!hayCopa || !Array.isArray(datos?.palas_playa)) return "";

        const partidos = [];

        datos.palas_playa.forEach(ronda => {
            if (Array.isArray(ronda?.partidos)) {
                ronda.partidos.forEach(partido => {
                    if (esPartidoJugadoV2(partido)) partidos.push(partido);
                });
            }
        });

        const ultimo = partidos.at(-1);
        if (!ultimo) return "";

        const perdedorExplicito = textoV2(
            ultimo.perdedor ||
            ultimo.ultimo_equipo ||
            ultimo.farolillo
        );

        if (perdedorExplicito) return perdedorExplicito;

        const local = nombreLocalV2(ultimo);
        const visitante = nombreVisitanteV2(ultimo);
        const ganador = textoV2(ultimo.ganador) || calcularGanadorV2(ultimo);

        if (mismoEquipoV2(local, ganador)) return visitante;
        if (mismoEquipoV2(visitante, ganador)) return local;

        return "";
    }

    function calcularGanadorV2(partido) {
        const sets = obtenerSetsPartido(partido);
        let local = 0;
        let visitante = 0;

        sets.forEach(set => {
            if (set.local > set.visitante) local += 1;
            if (set.visitante > set.local) visitante += 1;
        });

        if (local === visitante) return "";
        return local > visitante
            ? nombreLocalV2(partido)
            : nombreVisitanteV2(partido);
    }

    function pintarFarolilloPalas(portada, resumen) {
        if (!resumen.ultimoPalas) return;

        let tarjeta = portada.querySelector("#farolilloPalasFinal");
        if (tarjeta) return;

        tarjeta = document.createElement("article");
        tarjeta.id = "farolilloPalasFinal";
        tarjeta.className = "farolilloPalasFinal";
        tarjeta.innerHTML = `
            <div class="cucharaFarolillo" aria-hidden="true">🥄</div>
            <div>
                <span>PREMIO A LA CONSTANCIA</span>
                <h2>${escaparV2(resumen.ultimoPalas)}</h2>
                <p>
                    En Palas Playa perder también tenía premio…
                    y ellos consiguieron llegar hasta el final por el camino más difícil.
                </p>
                <strong>Farolillo rojo de honor 🏖️</strong>
            </div>
        `;

        const despedida = portada.querySelector(".mensajeDespedida");
        portada.insertBefore(tarjeta, despedida || null);
    }


    /* =====================================================
       NAVEGACIÓN FINALIZADA
       Ranking sustituye a Equipos en la barra inferior.
       Equipos se añade como acceso grande dentro de Más.
    ===================================================== */

    function configurarRankingNavegacionFinal() {
        const config = datos?.configuracion || {};
        const rankingVisible =
            config.mostrar_ranking_historico === true ||
            normalizarV2(
                config.mostrar_ranking_historico
            ) === "SI";

        if (!rankingVisible) return;

        const boton =
            document.querySelector(
                '.bottomNav .navBtn[data-pantalla="equipos"]'
            ) ||
            document.querySelector(
                ".bottomNav .navRankingFinal"
            );

        if (!boton) return;

        boton.classList.add("navRankingFinal");
        boton.dataset.pantalla = "ranking";
        boton.setAttribute(
            "aria-label",
            "Ranking histórico"
        );
        boton.title = "Ranking histórico";

        const icono = boton.querySelector("span");
        const texto = boton.querySelector("small");

        if (icono && icono.textContent !== "🏆") {
            icono.textContent = "🏆";
        }

        if (texto && texto.textContent !== "Ranking") {
            texto.textContent = "Ranking";
        }
    }

    function limpiarPantallaMasFinal() {
        if (
            typeof estadoUI === "undefined" ||
            estadoUI.pantalla !== "mas"
        ) {
            return;
        }

        const lista = document.querySelector(
            "#contenidoDetalle .listaOpcionesMas"
        );

        if (!lista) return;

        lista.querySelectorAll(".opcionMas").forEach(opcion => {
            const destino = normalizarV2(
                opcion.dataset.destinoPantalla
            );
            const texto = normalizarV2(opcion.textContent);

            if (
                destino === "RANKING" ||
                texto.includes("RANKING HISTORICO")
            ) {
                opcion.remove();
                return;
            }

            opcion.querySelector(":scope > b")?.remove();
        });
    }

    function agregarEquiposPantallaMas() {
        if (
            typeof estadoUI === "undefined" ||
            estadoUI.pantalla !== "mas"
        ) {
            return;
        }

        const lista = document.querySelector(
            "#contenidoDetalle .listaOpcionesMas"
        );

        if (
            !lista ||
            lista.querySelector(
                "#opcionEquiposMasFinal"
            )
        ) {
            return;
        }

        const boton = document.createElement("button");
        boton.id = "opcionEquiposMasFinal";
        boton.className =
            "opcionMas opcionEquiposMasFinal";
        boton.type = "button";
        boton.dataset.destinoPantalla = "equipos";
        boton.innerHTML = `
            <span>👥</span>
            <strong>Equipos</strong>
        `;

        lista.prepend(boton);
    }

    function gestionarClickNavegacionFinal(evento) {
        const ranking = evento.target.closest(
            '.bottomNav .navBtn[data-pantalla="ranking"]'
        );

        const equipos = evento.target.closest(
            "#opcionEquiposMasFinal"
        );

        if (!ranking && !equipos) return;

        window.setTimeout(
            sincronizarNavegacionFinal,
            0
        );
    }

    function sincronizarNavegacionFinal() {
        if (typeof estadoUI === "undefined") return;

        const pantalla = estadoUI.pantalla;

        if (pantalla === "ranking") {
            activarBotonNavegacionFinal(
                document.querySelector(
                    '.bottomNav .navBtn[data-pantalla="ranking"]'
                )
            );
            return;
        }

        if (pantalla === "equipos") {
            activarBotonNavegacionFinal(
                document.querySelector(
                    '.bottomNav .navBtn[data-pantalla="mas"]'
                )
            );
        }
    }

    function activarBotonNavegacionFinal(boton) {
        if (!boton) return;

        document
            .querySelectorAll(".bottomNav .navBtn")
            .forEach(elemento => {
                elemento.classList.toggle(
                    "navActivo",
                    elemento === boton
                );
            });
    }

    /* =====================================================
       UTILIDADES
    ===================================================== */

    function nombreLocalV2(partido) {
        return textoV2(
            partido?.local ||
            partido?.equipo1 ||
            partido?.equipo_a
        );
    }

    function nombreVisitanteV2(partido) {
        return textoV2(
            partido?.visitante ||
            partido?.equipo2 ||
            partido?.equipo_b
        );
    }

    function mismoEquipoV2(a, b) {
        return Boolean(a && b) &&
            normalizarV2(a) === normalizarV2(b);
    }

    function ponerTextoV2(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    }

    function numeroV2(valor) {
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : 0;
    }

    function textoV2(valor) {
        return String(valor ?? "").trim();
    }

    function normalizarV2(valor) {
        return textoV2(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replaceAll("_", " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function escaparV2(valor) {
        return textoV2(valor)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
})();
