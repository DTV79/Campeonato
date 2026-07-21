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
        let partidoMasLargo = null;

        partidosConDuracion.forEach(partido => {
            const minutos = numeroV2(partido.duracion_min);
            totalMinutos += minutos;

            if (
                !partidoMasLargo ||
                minutos > numeroV2(partidoMasLargo.duracion_min)
            ) {
                partidoMasLargo = partido;
            }
        });

        jugados.forEach(partido => {
            const sets = obtenerSetsPartido(partido);
            totalSets += sets.length;

            sets.forEach(set => {
                totalPuntos += set.local + set.visitante;
            });
        });

        const mediaMinutos = partidosConDuracion.length
            ? Math.round(totalMinutos / partidosConDuracion.length)
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
            partidoMasLargo,
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

        const nombrePartidoLargo = resumen.partidoMasLargo
            ? `${nombreLocalV2(resumen.partidoMasLargo)} vs ${nombreVisitanteV2(resumen.partidoMasLargo)}`
            : "";

        tarjeta.innerHTML = `
            <h2>El campeonato en cifras</h2>
            <p class="subtituloCifras">
                Suma de la liga, los grupos, los cruces y la Copa Palas Playa
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
                ${pintarCifraV2(resumen.pistas || "—", "Pistas utilizadas", "📍")}
                ${pintarCifraV2(
                    resumen.partidoMasLargo
                        ? `${numeroV2(resumen.partidoMasLargo.duracion_min)} min`
                        : "—",
                    "Partido más largo",
                    "⌛"
                )}
            </div>

            ${nombrePartidoLargo ? `
                <div class="detallePartidoLargo">
                    <span>⌛ El partido más largo fue</span>
                    <strong>${escaparV2(nombrePartidoLargo)}</strong>
                </div>
            ` : ""}
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
