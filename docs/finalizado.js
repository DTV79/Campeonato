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

            <div class="honoresFinales">
                <article class="honor honorOro">
                    <span class="medallaHonor">🥇</span>
                    <small>CAMPEONES</small>
                    <strong>${escaparFinal(resumen.campeones)}</strong>
                </article>

                <article class="honor honorPlata">
                    <span class="medallaHonor">🥈</span>
                    <small>SUBCAMPEONES</small>
                    <strong>${escaparFinal(resumen.subcampeones)}</strong>
                </article>
            </div>

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
