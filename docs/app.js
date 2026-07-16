const JSON_URL = "https://dtv79.github.io/Campeonato/estado_torneo.json";

let datos = null;
let temporizadorCuentaAtras = null;

const estadoUI = {
    pantalla: "inicio",
    faseCompeticion: "",
    fasePartidos: "",
    grupoCompeticion: {},
    grupoPartidos: {}
};

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        iniciarApp,
        { once: true }
    );
} else {
    iniciarApp();
}

document.addEventListener(
    "click",
    gestionarClickGlobal
);

async function iniciarApp() {
    try {
        const respuesta = await fetch(`${JSON_URL}?v=${Date.now()}`, {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar el JSON (${respuesta.status})`);
        }

        datos = await respuesta.json();

        inicializarEstadoUI();
        pintarInicio();

        const pantallaSolicitada = new URLSearchParams(
            window.location.search
        ).get("pantalla");

        if (
            esWebPrevia() &&
            pantallaSolicitada === "mas"
        ) {
            abrirPantalla("mas");
        }
    } catch (error) {
        console.error(error);
        pintarErrorCarga();
    }
}

function inicializarEstadoUI() {
    estadoUI.faseCompeticion = obtenerFaseActualCompeticion();
    estadoUI.fasePartidos = obtenerFaseActualPartidos();

    for (const fase of ["grupos", "regrupos"]) {
        const grupos = obtenerNombresGrupos(fase);
        estadoUI.grupoCompeticion[fase] = grupos[0] || "";
        estadoUI.grupoPartidos[fase] = "todos";
    }
}

/* =========================================================
   NAVEGACIÓN Y EVENTOS
========================================================= */

function gestionarClickGlobal(evento) {
    const btnInfo = evento.target.closest("#btnInfoOrden");
    if (btnInfo) {
        mostrarInfoOrden();
        return;
    }

    const cerrarInfo = evento.target.closest("#cerrarInfoOrden");
    if (cerrarInfo || evento.target.classList.contains("overlayInfo")) {
        cerrarInfoOrden();
        return;
    }

    const btnCompleta = evento.target.closest("#btnVistaCompleta");
    if (btnCompleta) {
        pintarClasificacionCompletaActual();
        return;
    }

    const btnResumida = evento.target.closest("#btnVistaResumida");
    if (btnResumida) {
        pintarPantallaCompeticion();
        return;
    }

    const selectorFase = evento.target.closest("[data-selector-fase]");
    if (selectorFase) {
        cambiarFaseSelector(selectorFase);
        return;
    }

    const selectorGrupo = evento.target.closest("[data-selector-grupo]");
    if (selectorGrupo) {
        cambiarGrupoSelector(selectorGrupo);
        return;
    }

    const cabeceraJornada = evento.target.closest(".cabeceraJornada");
    if (cabeceraJornada) {
        alternarJornada(cabeceraJornada);
        return;
    }

    const filaClasificacion = evento.target.closest(
        ".filaClasificacion[data-desplegable='true']"
    );
    if (filaClasificacion) {
        alternarDetalleClasificacion(filaClasificacion);
        return;
    }

    const opcionMas = evento.target.closest("[data-destino-pantalla]");
    if (opcionMas) {
        const pantalla = opcionMas.dataset.destinoPantalla;
        const fase = opcionMas.dataset.destinoFase || "";
        abrirPantalla(pantalla, fase);
        return;
    }

        const enlaceDirecto = evento.target.closest("[data-href]");
    if (enlaceDirecto) {
        const href = enlaceDirecto.dataset.href;
        if (href) window.location.href = href;
        return;
    }

    const card = evento.target.closest(".cardAcceso");
    if (card) {
        const seccion = card.dataset.seccion;

        if (seccion === "especial") {
            abrirEspecialDesdePortada();
        } else if (seccion === "competicion") {
            abrirPantalla("competicion", obtenerFaseClasificacionPrincipal());
        } else {
            abrirPantalla(seccion);
        }
        return;
    }

    const nav = evento.target.closest(".navBtn");
    if (nav) {
        const pantalla = nav.dataset.pantalla;
        abrirPantalla(
            pantalla,
            pantalla === "competicion" ? obtenerFaseClasificacionPrincipal() : ""
        );
    }
}

function abrirPantalla(pantalla, fase = "") {
    if (!datos) return;

    if (pantalla === "inicio") {
        mostrarInicio();
        return;
    }

    ocultarInicio();
    activarNav(pantalla);
        estadoUI.pantalla = pantalla;

    if (esWebPrevia()) {
        if (pantalla === "pretorneo_info") {
            pintarPantallaInformacionPretorneo();
        } else if (pantalla === "pretorneo_inscripcion") {
            pintarPantallaInscripciones();
        } else if (pantalla === "mas") {
            pintarPantallaMas();
        } else {
            mostrarInicio();
        }
        return;
    }

    if (pantalla === "competicion") {
        if (fase) estadoUI.faseCompeticion = fase;
        pintarPantallaCompeticion();
    } else if (pantalla === "partidos") {
        if (fase) estadoUI.fasePartidos = fase;
        pintarPantallaPartidos();
    } else if (pantalla === "equipos") {
        pintarPantallaEquipos();
    } else if (pantalla === "mas") {
        pintarPantallaMas();
    }
}

function abrirEspecialDesdePortada() {
    const tarjeta = document.getElementById("tarjetaEspecial");
    const pantalla = tarjeta?.dataset.destinoPantalla || "competicion";
    const fase = tarjeta?.dataset.destinoFase || "";
    abrirPantalla(pantalla, fase);
}

function ocultarInicio() {
    document.querySelector(".cabecera")?.classList.add("oculto");
    document.querySelector(".gridDashboard")?.classList.add("oculto");
    document.querySelector(".podioCard")?.classList.add("oculto");
    document.getElementById("vistaDetalle")?.classList.remove("oculto");
}

function mostrarInicio() {
    estadoUI.pantalla = "inicio";

    document.querySelector(".cabecera")?.classList.remove("oculto");
    document.querySelector(".gridDashboard")?.classList.remove("oculto");
    document.querySelector(".podioCard")?.classList.remove("oculto");
    document.getElementById("vistaDetalle")?.classList.add("oculto");

    activarNav("inicio");
    pintarInicio();
}

function activarNav(pantalla) {
    document.querySelectorAll(".navBtn").forEach(btn => {
        btn.classList.remove("navActivo");
    });

    document
        .querySelector(`.navBtn[data-pantalla="${pantalla}"]`)
        ?.classList.add("navActivo");
}

function cambiarFaseSelector(boton) {
    const contexto = boton.dataset.selectorFase;
    const fase = boton.dataset.fase;

    if (contexto === "competicion") {
        estadoUI.faseCompeticion = fase;
        pintarPantallaCompeticion();
    } else if (contexto === "partidos") {
        estadoUI.fasePartidos = fase;
        pintarPantallaPartidos();
    }
}

function cambiarGrupoSelector(boton) {
    const contexto = boton.dataset.selectorGrupo;
    const fase = boton.dataset.fase;
    const grupo = boton.dataset.grupo;

    if (contexto === "competicion") {
        estadoUI.grupoCompeticion[fase] = grupo;
        pintarPantallaCompeticion();
    } else if (contexto === "partidos") {
        estadoUI.grupoPartidos[fase] = grupo;
        pintarPantallaPartidos();
    } else if (contexto === "equipos") {
        estadoUI.grupoEquipos = grupo;
        pintarPantallaEquipos();
    }
}

function alternarJornada(cabecera) {
    const bloque = cabecera.closest(".bloqueJornada");
    const lista = bloque?.querySelector(":scope > .listaPartidos");
    const flecha = cabecera.querySelector(".flechaJornada");

    if (!lista) return;

    lista.classList.toggle("oculto");
    if (flecha) {
        flecha.textContent = lista.classList.contains("oculto") ? "▶" : "▼";
    }
}

function alternarDetalleClasificacion(fila) {
    const detalle = fila.querySelector(".detalleClasif");
    const toggle = fila.querySelector(".toggleDetalles");

    if (!detalle || !toggle) return;

    detalle.classList.toggle("oculto");
    toggle.textContent = detalle.classList.contains("oculto")
        ? "▼ Ver estadísticas"
        : "▲ Ocultar estadísticas";
}

function alternarDetalleEquipo(card) {
    const detalle = card.querySelector(".detalleEquipo");
    const flecha = card.querySelector(".flechaEquipo");

    if (!detalle) return;

    detalle.classList.toggle("oculto");
    if (flecha) {
        flecha.textContent = detalle.classList.contains("oculto") ? "▶" : "▼";
    }
}


function pintarIdentidadCampeonato() {
    const config = obtenerConfiguracion();

    const nombreCompleto = String(
        config.nombre_campeonato ||
        "II CAMPEONATO - Sprint Pádel Tui"
    ).trim();

    /*
       El nombre se divide mediante guiones:

       Parte 1: título superior pequeño
       Parte 2: título principal grande
       Parte 3: subtítulo pequeño
    */

    const partes = nombreCompleto
        .split(/\s*[-–—]\s*/)
        .map(parte => parte.trim());

    const tieneVariasPartes = partes.length >= 2;

    const superior = tieneVariasPartes
        ? partes[0]
        : "CAMPEONATO";

    const principal = tieneVariasPartes
        ? partes[1]
        : partes[0];

    /*
       Si hubiese más de tres partes, se unen a partir
       de la tercera para no perder ningún texto.
    */

    const inferior = partes
        .slice(2)
        .filter(Boolean)
        .join(" - ");

    document.title = partes
        .filter(Boolean)
        .join(" · ");

    setTextClase(
        "tituloSuperior",
        superior
    );

    setTextClase(
        "tituloPrincipal",
        principal
    );

    const subtitulo = document.querySelector(".subtitulo");

    if (subtitulo) {
        subtitulo.textContent = inferior;

        subtitulo.classList.toggle(
            "oculto",
            !inferior
        );
    }

    const textoNav = document.querySelector(
        '.navBtn[data-pantalla="competicion"] small'
    );

    if (textoNav) {
        textoNav.textContent = "Clasificación";
    }
}

function setTextClase(clase, texto) {
    const elemento = document.querySelector(`.${clase}`);
    if (elemento) elemento.textContent = texto;
}

function obtenerFaseClasificacionPrincipal() {
    if (!esModoGrupos()) return "liguilla";
    return hayRegruposGenerados() ? "regrupos" : "grupos";
}

function hayRegruposGenerados() {
    return obtenerClasificacionFase("regrupos").length > 0 ||
        obtenerPartidosFase("regrupos").length > 0 ||
        obtenerEquiposAsignadosFase("regrupos").length > 0;
}

function debeMostrarCrucesPendientes() {
    if ((datos?.cruces || []).length) return true;

    if (esModoGrupos()) {
        const config = obtenerConfiguracion();
        return config.hay_regrupos
            ? hayRegruposGenerados()
            : obtenerNombresGrupos("grupos").length > 0;
    }

    const partidos = quitarDescansos(obtenerPartidosFase("liguilla"));
    return partidos.length > 0 && partidos.every(partidoFinalizado);
}

function hayPartidosJugadosEnFase(fase) {
    return quitarDescansos(obtenerPartidosFase(fase)).some(partidoFinalizado);
}

function hayPartidosJugadosEnGrupo(fase, grupo) {
    return quitarDescansos(obtenerPartidosFase(fase)).some(partido =>
        partido.grupo === grupo && partidoFinalizado(partido)
    );
}

function obtenerEquiposAsignadosFase(fase) {
    if (fase === "grupos") {
        return datos?.equipos || [];
    }

    if (fase === "regrupos") {
        const regrupos = datos?.regrupos || {};
        const candidatos = [
            regrupos.equipos,
            regrupos.asignaciones,
            regrupos.integrantes
        ];

        const lista = candidatos.find(Array.isArray);
        return lista || [];
    }

    return [];
}

function obtenerFilasGrupoParaMostrar(fase, grupo) {
    const clasificacion = obtenerClasificacionFase(fase).filter(
        fila => fila.grupo === grupo
    );

    if (clasificacion.length) return clasificacion;

    return obtenerEquiposAsignadosFase(fase)
        .filter(equipo => equipo.grupo === grupo)
        .map(normalizarEquipoComoClasificacion);
}

function normalizarEquipoComoClasificacion(equipo, indice = 0) {
    return {
        ...equipo,
        fase: equipo.fase || "",
        grupo: equipo.grupo || "",
        posicion: 0,
        posicion_actual: 0,
        posicion_anterior: 0,
        puntos: 0,
        puntos_totales: 0,
        pj: 0,
        pg: 0,
        pp: 0,
        sets_favor: 0,
        sets_contra: 0,
        sets_diff: 0,
        juegos_favor: 0,
        juegos_contra: 0,
        juegos_diff: 0,
        orden: numero(equipo.orden) || indice + 1
    };
}

function pintarFilaEquipoGrupoSinClasificacion(fila) {
    return `
        <article class="filaClasificacion">
            <div class="lineaEquipo">
                <div class="equipoFila">👥 ${escaparHTML(fila.equipo)}</div>
            </div>
            <div class="datosFila">${escaparHTML(nombreGrupoVisible(fila.grupo))}</div>
        </article>
    `;
}

/* =========================================================
   PORTADA
========================================================= */

function pintarInicio() {
    pintarIdentidadCampeonato();

    if (esWebPrevia()) {
        pintarInicioPretorneo();
        return;
    }

    detenerCuentaAtrasCampeonato();
    restaurarBloqueActualizacionCompeticion();

    document
        .querySelector(".podioCard")
        ?.classList.remove("oculto");

    pintarFecha(datos.ultima_actualizacion);
    configurarPortadaCompeticion();
    pintarEstadoCabecera();
    pintarTarjetasDashboard();
    pintarResumenPortada();
}

function pintarFecha(fechaISO) {
    const elemento = document.getElementById("ultimaActualizacion");
    if (!elemento || !fechaISO) return;

    const fecha = new Date(fechaISO);

    elemento.textContent = Number.isNaN(fecha.getTime())
        ? fechaISO
        : fecha.toLocaleString("es-ES", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
}

function pintarEstadoCabecera() {
    const estado = obtenerEstadoCompeticion();

    setText("estadoCabecera", estado.titulo);
    setText("textoProgreso", estado.texto);

    const barra = document.getElementById("barraProgreso");
    if (barra) {
        barra.style.width = `${estado.porcentaje}%`;
        barra.className = `progreso ${estado.claseBarra}`;
    }

    document
        .querySelector(".cabecera")
        ?.classList.toggle("cabeceraFinalizada", estado.finalizado);
}

function pintarTarjetasDashboard() {
    const config = obtenerConfiguracion();
    const equipos = datos.equipos || [];
    const faseActual = obtenerFaseActualCompeticion();
    const faseClasificacion = obtenerFaseClasificacionPrincipal();
    const partidosActuales = obtenerPartidosFase(faseActual);
    const partidosSinDescanso = quitarDescansos(partidosActuales);

    setText("tituloTarjetaCompeticion", "Clasificación");

    if (esModoGrupos()) {
        const grupos = obtenerNombresGrupos(faseClasificacion);
        setHTML(
            "resumenCompeticion",
            `${escaparHTML(nombreFase(faseClasificacion))}<br>` +
            `${grupos.length} ${grupos.length === 1 ? "grupo" : "grupos"} · ` +
            `${equipos.length} equipos`
        );
    } else {
        const lider = datos.clasificacion?.[0]?.equipo || "Sin datos";
        setHTML(
            "resumenCompeticion",
            `🥇 ${escaparHTML(lider)}<br>${equipos.length} equipos participantes`
        );
    }

    if (!partidosSinDescanso.length) {
        setHTML(
            "resumenPartidos",
            `${escaparHTML(nombreFase(faseActual))}<br>Jornadas pendientes de generar`
        );
    } else if (["liguilla", "grupos", "regrupos"].includes(faseActual)) {
        const jornada = obtenerJornadaActual(partidosSinDescanso);
        const partidosJornada = partidosSinDescanso.filter(
            partido => Number(partido.jornada) === Number(jornada)
        );
        const jugados = partidosJornada.filter(partidoFinalizado).length;
        const pendientes = partidosJornada.filter(partidoPendiente).length;

        setHTML(
            "resumenPartidos",
            `Jornada ${jornada}<br>${jugados} jugados · ${pendientes} pendientes`
        );
    } else {
        const totalJugados = partidosSinDescanso.filter(partidoFinalizado).length;
        setHTML(
            "resumenPartidos",
            `${escaparHTML(nombreFase(faseActual))}<br>${totalJugados} jugados · ` +
            `${partidosSinDescanso.length - totalJugados} pendientes`
        );
    }

    const gruposIniciales = esModoGrupos()
        ? new Set(equipos.map(equipo => equipo.grupo).filter(Boolean)).size
        : 0;

    setHTML(
        "resumenEquipos",
        esModoGrupos()
            ? `${equipos.length} equipos<br>${gruposIniciales} grupos iniciales`
            : `${equipos.length} equipos<br>Ver participantes`
    );

    pintarTarjetaEspecial(config);
}

function pintarTarjetaEspecial(config) {
    const tarjeta = document.getElementById("tarjetaEspecial");
    const icono = document.getElementById("iconoTarjetaEspecial");
    const titulo = document.getElementById("tituloTarjetaEspecial");
    const resumen = document.getElementById("resumenEspecial");

    if (!tarjeta || !icono || !titulo || !resumen) return;

    tarjeta.classList.remove("cardCruces", "cardPalas", "cardClasificacion");

    if ((datos.cruces || []).length) {
        const cruces = datos.cruces || [];
        const jugados = cruces.filter(partidoFinalizado).length;

        tarjeta.classList.add("cardCruces");
        tarjeta.dataset.destinoPantalla = "competicion";
        tarjeta.dataset.destinoFase = "cruces";
        icono.textContent = "⚔️";
        titulo.textContent = "Eliminatorias";
        resumen.innerHTML = `${jugados} jugados · ${cruces.length - jugados} pendientes`;
        return;
    }

    if (esModoGrupos() && config.hay_regrupos && !hayRegruposGenerados()) {
        tarjeta.classList.add("cardClasificacion");
        tarjeta.dataset.destinoPantalla = "competicion";
        tarjeta.dataset.destinoFase = "regrupos";
        icono.textContent = "🔁";
        titulo.textContent = "ReGrupos";
        resumen.innerHTML = "Pendientes de generar";
        return;
    }

    if (debeMostrarCrucesPendientes()) {
        tarjeta.classList.add("cardCruces");
        tarjeta.dataset.destinoPantalla = "competicion";
        tarjeta.dataset.destinoFase = "cruces";
        icono.textContent = "⚔️";
        titulo.textContent = "Eliminatorias";
        resumen.innerHTML = config.ronda_inicial_eliminatorias
            ? `${escaparHTML(config.ronda_inicial_eliminatorias)} pendientes de generar`
            : "Pendientes de generar";
        return;
    }

    if ((datos.palas_playa || []).length) {
        tarjeta.classList.add("cardPalas");
        tarjeta.dataset.destinoPantalla = "competicion";
        tarjeta.dataset.destinoFase = "palas";
        icono.textContent = "🏖️";
        titulo.textContent = "Copa Palas Playa";
        resumen.innerHTML = "Competición del farolillo";
        return;
    }

    tarjeta.classList.add("cardCruces");
    tarjeta.dataset.destinoPantalla = "competicion";
    tarjeta.dataset.destinoFase = "cruces";
    icono.textContent = "⚔️";
    titulo.textContent = "Siguiente fase";
    resumen.innerHTML = config.ronda_inicial_eliminatorias
        ? `${escaparHTML(config.ronda_inicial_eliminatorias)} pendientes de generar`
        : "Pendiente de iniciar";
}

function pintarResumenPortada() {
    const fase = obtenerFaseActualCompeticion();

    if (fase === "cruces") {
        pintarResumenCrucesPortada();
        return;
    }

    if (fase === "palas") {
        pintarResumenPalasPortada();
        return;
    }

    if (esModoGrupos()) {
        const faseGrupos = fase === "regrupos" ? "regrupos" : "grupos";
        const nombresGrupos = obtenerNombresGrupos(faseGrupos);
        const faseIniciada = hayPartidosJugadosEnFase(faseGrupos);

        if (!faseIniciada) {
            setText(
                "tituloPodio",
                faseGrupos === "regrupos"
                    ? "🔁 Equipos de los ReGrupos"
                    : "👥 Equipos de cada grupo"
            );

            const htmlEquipos = nombresGrupos.map(grupo => {
                const filas = obtenerFilasGrupoParaMostrar(faseGrupos, grupo);
                const nombres = filas.map(fila => escaparHTML(fila.equipo));

                return `
                    <div class="equipoPodio">
                        <span>
                            <strong>${escaparHTML(nombreGrupoVisible(grupo))}</strong><br>
                            ${nombres.length ? nombres.join("<br>") : "Equipos pendientes"}
                        </span>
                    </div>
                `;
            }).join("");

            setHTML(
                "podio",
                htmlEquipos || pintarVacioInline(
                    faseGrupos === "regrupos"
                        ? "ReGrupos pendientes de generar"
                        : "Equipos pendientes de asignar"
                )
            );
            return;
        }

        setText(
            "tituloPodio",
            faseGrupos === "regrupos"
                ? "🔁 Líderes de ReGrupos"
                : "📊 Líderes de cada grupo"
        );

        const html = nombresGrupos.map(grupo => {
            const filas = ordenarClasificacionGrupo(
                obtenerFilasGrupoParaMostrar(faseGrupos, grupo)
            );
            const lider = filas[0];

            return `
                <div class="equipoPodio oro">
                    <span>
                        🏆 ${escaparHTML(nombreGrupoVisible(grupo))}:<br>
                        <strong>${escaparHTML(lider?.equipo || "Sin datos")}</strong>
                    </span>
                </div>
            `;
        }).join("");

        setHTML("podio", html || pintarVacioInline("Clasificaciones pendientes"));
        return;
    }

    setText("tituloPodio", "🥇 Clasificación provisional");

    const top3 = (datos.clasificacion || []).slice(0, 3);
    const clases = ["oro", "plata", "bronce"];
    const medallas = ["🥇", "🥈", "🥉"];

    setHTML(
        "podio",
        top3.length
            ? top3.map((equipo, indice) => `
                <div class="equipoPodio ${clases[indice]}">
                    <span>${medallas[indice]} ${escaparHTML(equipo.equipo)}</span>
                </div>
            `).join("")
            : pintarVacioInline("Clasificación pendiente")
    );
}

function pintarResumenCrucesPortada() {
    const cruces = datos.cruces || [];
    const final = cruces.find(partido => normalizar(partido.fase) === "FINAL");
    const finalizado = cruces.length > 0 && cruces.every(partidoFinalizado);

    if (finalizado && final?.ganador) {
        setText("tituloPodio", "🏆 Campeones del torneo");
        setHTML(
            "podio",
            `<div class="equipoPodio oro"><span>🥇 ${escaparHTML(final.ganador)}</span></div>`
        );
        return;
    }

    const faseActual = obtenerFaseActualCruces(cruces);
    const partidosFase = cruces.filter(partido => partido.fase === faseActual);

    setText("tituloPodio", `⚔️ ${tituloFaseSinIcono(faseActual)}`);
    setHTML(
        "podio",
        partidosFase.map(partido => `
            <div class="equipoPodio">
                <span>
                    ${escaparHTML(partido.local || "Por definir")}<br>
                    <small>vs</small><br>
                    ${escaparHTML(partido.visitante || "Por definir")}
                </span>
            </div>
        `).join("") || pintarVacioInline("Cruces pendientes")
    );
}

function pintarResumenPalasPortada() {
    setText("tituloPodio", "🏖️ Copa Palas Playa");
    setHTML(
        "podio",
        `<div class="equipoPodio"><span>🥄 El que pierde continúa jugando</span></div>`
    );
}

/* =========================================================
   MODO PRETORNEO E INSCRIPCIONES
========================================================= */

function pintarInicioPretorneo() {
    const inscripcionesAbiertas = esEstadoInscripciones();

    document.body.classList.add("modoPretorneo");

    document
        .querySelector(".cabecera")
        ?.classList.add("cabeceraPretorneo");

    document
        .querySelector(".cabecera")
        ?.classList.remove("cabeceraFinalizada");

    document
        .querySelector(".podioCard")
        ?.classList.add("oculto");

    configurarNavegacionPretorneo();
    configurarTarjetasPretorneo();
    iniciarCuentaAtrasCampeonato();

    setText(
        "estadoCabecera",
        inscripcionesAbiertas
            ? "🟢 Inscripciones abiertas"
            : "🟠 Información previa"
    );
}

function configurarPortadaCompeticion() {
    document
        .querySelector(".podioCard")
        ?.classList.remove("oculto");

    document.body.classList.remove("modoPretorneo");

    document
        .querySelector(".cabecera")
        ?.classList.remove("cabeceraPretorneo");

    configurarNavegacionCompeticion();

    const tarjetas = [
        ...document.querySelectorAll(
            ".gridDashboard .cardAcceso"
        )
    ];

    configurarTarjetaPortada(
        tarjetas[0],
        "📊",
        "Clasificación",
        "Cargando...",
        "competicion"
    );

    configurarTarjetaPortada(
        tarjetas[1],
        "🎾",
        "Partidos",
        "Cargando...",
        "partidos"
    );

    configurarTarjetaPortada(
        tarjetas[2],
        "👥",
        "Equipos",
        "Cargando...",
        "equipos"
    );

    configurarTarjetaPortada(
        tarjetas[3],
        "⚔️",
        "Siguiente fase",
        "Pendiente de iniciar",
        "especial"
    );
}

function configurarTarjetasPretorneo() {
    const tarjetas = [
        ...document.querySelectorAll(
            ".gridDashboard .cardAcceso"
        )
    ];

    const inscripcionesAbiertas = esEstadoInscripciones();

    configurarTarjetaPortada(
        tarjetas[0],
        "📅",
        "Campeonato",
        "Información de la próxima edición",
        "pretorneo_info"
    );

    configurarTarjetaPortada(
        tarjetas[1],
        "✍️",
        "Inscripciones",
        inscripcionesAbiertas
            ? "El plazo de inscripción está abierto"
            : "En breve se abrirá el plazo de inscripciones",
        inscripcionesAbiertas
            ? "pretorneo_inscripcion"
            : ""
    );

    if (!inscripcionesAbiertas && tarjetas[1]) {
        tarjetas[1].classList.add("tarjetaBloqueada");
        tarjetas[1].setAttribute("aria-disabled", "true");

        delete tarjetas[1].dataset.seccion;
        delete tarjetas[1].dataset.href;
    }

    tarjetas[2]?.classList.add("oculto");
    tarjetas[3]?.classList.add("oculto");
}

function configurarTarjetaPortada(
    tarjeta,
    icono,
    titulo,
    resumen,
    seccion = "",
    href = ""
) {
    if (!tarjeta) return;

    tarjeta.classList.remove(
        "oculto",
        "tarjetaBloqueada"
    );

    tarjeta.removeAttribute("aria-disabled");

    const iconoElemento =
        tarjeta.querySelector(".iconoAcceso");

    const tituloElemento =
        tarjeta.querySelector("h4");

    const resumenElemento =
        tarjeta.querySelector("p");

    if (iconoElemento) {
        iconoElemento.textContent = icono;
    }

    if (tituloElemento) {
        tituloElemento.textContent = titulo;
    }

    if (resumenElemento) {
        resumenElemento.innerHTML = resumen;
    }

    if (seccion) {
        tarjeta.dataset.seccion = seccion;
    } else {
        delete tarjeta.dataset.seccion;
    }

    if (href) {
        tarjeta.dataset.href = href;
    } else {
        delete tarjeta.dataset.href;
    }

    delete tarjeta.dataset.destinoPantalla;
    delete tarjeta.dataset.destinoFase;
}

function configurarNavegacionPretorneo() {
    const botones = [
        ...document.querySelectorAll(
            ".bottomNav .navBtn"
        )
    ];

    const config = obtenerConfiguracion();

    configurarBotonNav(
        botones[0],
        "🏠",
        "Inicio",
        "inicio"
    );

    configurarBotonNav(
        botones[1],
        "📖",
        "Historia",
        "",
        "historia.html"
    );

    botones[1]?.classList.toggle(
        "oculto",
        !esSi(config.mostrar_historia)
    );

    configurarBotonNav(
        botones[2],
        "📜",
        "Normas",
        "",
        "normas.html"
    );

    botones[2]?.classList.toggle(
        "oculto",
        !esSi(config.mostrar_normativa)
    );

    configurarBotonNav(
        botones[3],
        "🏆",
        "Campeones",
        "",
        "campeones.html"
    );

    botones[3]?.classList.toggle(
        "oculto",
        !esSi(config.mostrar_campeones)
    );

    configurarBotonNav(
        botones[4],
        "☰",
        "Más",
        "mas"
    );
}

function configurarNavegacionCompeticion() {
    const botones = [
        ...document.querySelectorAll(
            ".bottomNav .navBtn"
        )
    ];

    configurarBotonNav(
        botones[0],
        "🏠",
        "Inicio",
        "inicio"
    );

    configurarBotonNav(
        botones[1],
        "📊",
        "Clasificación",
        "competicion"
    );

    configurarBotonNav(
        botones[2],
        "🎾",
        "Partidos",
        "partidos"
    );

    configurarBotonNav(
        botones[3],
        "👥",
        "Equipos",
        "equipos"
    );

    configurarBotonNav(
        botones[4],
        "☰",
        "Más",
        "mas"
    );
}

function configurarBotonNav(
    boton,
    icono,
    texto,
    pantalla = "",
    href = ""
) {
    if (!boton) return;

    boton.classList.remove("oculto");

    const iconoElemento =
        boton.querySelector("span");

    const textoElemento =
        boton.querySelector("small");

    if (iconoElemento) {
        iconoElemento.textContent = icono;
    }

    if (textoElemento) {
        textoElemento.textContent = texto;
    }

    if (pantalla) {
        boton.dataset.pantalla = pantalla;
    } else {
        delete boton.dataset.pantalla;
    }

    if (href) {
        boton.dataset.href = href;
    } else {
        delete boton.dataset.href;
    }
}

function pintarPantallaInformacionPretorneo() {
    const contenido = obtenerContenidoDetalle();

    if (!contenido) return;

    const config = obtenerConfiguracion();

    const tipoCampeonato = String(
        config.tipo_campeonato ||
        config.sistema_primera_fase ||
        "Pendiente de confirmar"
    );

    const rondaInicial = String(
        config.ronda_inicial_eliminatorias ||
        "Pendiente de confirmar"
    );

    contenido.innerHTML = `
        <h2>📅 Campeonato</h2>

        <section class="resumenPartidos">
            <div class="estadoResumen">
                🎾 Información de la próxima edición
            </div>
        </section>

        <div class="listaOpcionesMas">
            ${pintarDatoPretorneo(
                "📅",
                "Fecha",
                formatearFechaCampeonato()
            )}

            ${pintarDatoPretorneo(
                "📍",
                "Lugar",
                obtenerLugarCampeonato()
            )}

            ${pintarDatoPretorneo(
                "🕒",
                "Horario",
                obtenerHorarioCampeonato() || "Pendiente de confirmar"
                )}

            ${pintarDatoPretorneo(
                "🏁",
                "Primera fase",
                tipoCampeonato
            )}

            ${pintarDatoPretorneo(
                "⚔️",
                "Eliminatorias",
                rondaInicial
            )}

           ${pintarDatoPretorneo(
    "🏖️",
    "Copa Palas Playa",
    textoSiNoPendiente(
        config.hay_copa_palas_playa
    )
)}
        </div>
    `;
}

function pintarDatoPretorneo(
    icono,
    titulo,
    valor
) {
    return `
        <div class="opcionMas datoPretorneo">
            <span>${icono}</span>

            <strong>
                ${escaparHTML(titulo)}
                <small>${escaparHTML(valor)}</small>
            </strong>

            <b></b>
        </div>
    `;
}

function pintarPantallaInscripciones() {
    const contenido = obtenerContenidoDetalle();

    if (!contenido) return;

    const abiertas = esEstadoInscripciones();
    const url = obtenerURLInscripcion();

    contenido.innerHTML = `
        <h2>✍️ Inscripciones</h2>

        <section class="
            resumenPartidos
            ${abiertas ? "" : "resumenInscripcionCerrada"}
        ">
            <div class="estadoResumen">
                ${
                    abiertas
                        ? "🟢 Inscripciones abiertas"
                        : "⏳ Inscripciones todavía cerradas"
                }
            </div>

            <p>
                ${
                    abiertas
                        ? "Completa el formulario para solicitar tu plaza en el campeonato."
                        : "Cuando se abra el plazo, podrás inscribirte directamente desde esta sección."
                }
            </p>
        </section>

        ${
            abiertas && url
                ? `
                    <a
                        class="btnVistaCompleta enlaceInscripcion"
                        href="${escaparAtributo(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Abrir formulario de inscripción →
                    </a>
                `
                : pintarTarjetaVacia(
                    abiertas
                        ? "Formulario pendiente"
                        : "Próximamente",
                    abiertas
                        ? "Las inscripciones están activadas, pero todavía no se ha indicado el enlace del formulario."
                        : "El formulario aparecerá aquí cuando el estado del torneo cambie a Inscripciones."
                )
        }
    `;
}

function pintarPantallaMasPretorneo() {
    const contenido = obtenerContenidoDetalle();

    if (!contenido) return;

    const config = obtenerConfiguracion();
    const opciones = [];

    if (esSi(config.mostrar_fotos)) {
        opciones.push({
            icono: "📷",
            texto: "Fotos",
            href: "fotos.html"
        });
    }

    if (esSi(config.mostrar_ranking_historico)) {
        opciones.push({
            icono: "📈",
            texto: "Ranking histórico",
            href: "ranking.html"
        });
    }

    if (esSi(config.mostrar_estadisticas)) {
        opciones.push({
            icono: "📊",
            texto: "Estadísticas",
            href: "estadisticas.html"
        });
    }

    contenido.innerHTML = `
        <h2>☰ Más</h2>

        ${
            opciones.length
                ? `
                    <div class="listaOpcionesMas">
                        ${opciones.map(opcion => `
                            <a
                                class="opcionMas"
                                href="${escaparAtributo(opcion.href)}"
                            >
                                <span>${opcion.icono}</span>

                                <strong>
                                    ${escaparHTML(opcion.texto)}
                                </strong>

                                <b>→</b>
                            </a>
                        `).join("")}
                    </div>
                `
                : pintarTarjetaVacia(
                    "Sin más secciones",
                    "No hay contenido adicional habilitado."
                )
        }
    `;
}

/* =========================================================
   PANTALLA COMPETICIÓN
========================================================= */

function pintarPantallaCompeticion() {
    const contenido = obtenerContenidoDetalle();
    if (!contenido) return;

    const fases = obtenerFasesCompeticionDisponibles();

    if (!fases.some(fase => fase.clave === estadoUI.faseCompeticion)) {
        estadoUI.faseCompeticion = obtenerFaseClasificacionPrincipal();
    }

    let html = `
        <h2>📊 Clasificación</h2>
        ${pintarSelectorFases(fases, estadoUI.faseCompeticion, "competicion")}
    `;

    const fase = estadoUI.faseCompeticion;

    if (fase === "liguilla") {
        html += pintarClasificacionLiguilla();
    } else if (fase === "grupos" || fase === "regrupos") {
        html += pintarClasificacionesPorGrupos(fase);
    } else if (fase === "cruces") {
        html += pintarContenidoCruces();
    } else if (fase === "palas") {
        html += pintarContenidoPalas();
    }

    contenido.innerHTML = html;
}

function pintarSelectorFases(fases, seleccionada, contexto) {
    if (fases.length <= 1) return "";

    return `
        <div class="selectorFases">
            ${fases.map(fase => `
                <button
                    type="button"
                    class="selectorBtn ${fase.clave === seleccionada ? "selectorActivo" : ""}"
                    data-selector-fase="${contexto}"
                    data-fase="${fase.clave}"
                >
                    ${fase.icono} ${escaparHTML(fase.nombre)}
                </button>
            `).join("")}
        </div>
    `;
}

function pintarClasificacionLiguilla() {
    const mostrarCoef = mostrarCoeficiente();
    const clasificacion = datos.clasificacion || [];

    return `
        <div class="modoOrden">
            <div>
                <span>🏆 Sistema de clasificación</span>
                <strong>${escaparHTML(textoModoOrden(datos.modo_orden))}</strong>
            </div>
            <button class="btnInfoOrden" id="btnInfoOrden" type="button">ℹ️</button>
        </div>

        <button class="btnVistaCompleta" id="btnVistaCompleta" type="button">
            📋 Ver clasificación completa
        </button>

        <div class="listaClasificacion separacionSuperior">
            ${clasificacion.map(equipo => pintarFilaClasificacionLiguilla(equipo, mostrarCoef)).join("")}
        </div>
    `;
}

function pintarFilaClasificacionLiguilla(equipo, mostrarCoef) {
    const movimiento = obtenerMovimiento(equipo);
    const posicion = Number(equipo.posicion_actual || 0);
    const medalla = posicion === 1
        ? "🥇"
        : posicion === 2
            ? "🥈"
            : posicion === 3
                ? "🥉"
                : `${posicion}.`;

    return `
        <article class="filaClasificacion" data-desplegable="true">
            <div class="lineaEquipo">
                <div class="equipoFila">${medalla} ${escaparHTML(equipo.equipo)}</div>
                <div class="${movimiento.clase} movimientoFila">${movimiento.texto}</div>
            </div>

            <div class="datosFila">
                🔢 ${numero(equipo.puntos_totales)} pts · 🎾 ${numero(equipo.pj)} PJ
                ${numero(equipo.descanso) > 0 ? ` · 💤 ${numero(equipo.descanso)}` : ""}
            </div>

            <div class="etiquetaEspecial">${obtenerEtiquetaLiguilla(equipo)}</div>
            ${pintarDetalleEstadisticas(normalizarClasificacion(equipo), mostrarCoef)}
        </article>
    `;
}

function pintarClasificacionesPorGrupos(fase) {
    const nombresGrupos = obtenerNombresGrupos(fase);

    if (!nombresGrupos.length) {
        const titulo = fase === "regrupos" ? "Segunda fase · ReGrupos" : "Primera fase · Grupos";
        const texto = fase === "regrupos"
            ? "Los ReGrupos todavía no han sido generados."
            : "Los equipos todavía no han sido asignados a sus grupos.";

        return `
            <div class="cabeceraSeccion">
                <span>${fase === "regrupos" ? "🔁" : "📊"}</span>
                <div>
                    <h3>${titulo}</h3>
                    <p>Pendiente</p>
                </div>
            </div>
            ${pintarTarjetaVacia("⏳ Pendiente de generar", texto)}
        `;
    }

    const seleccionado = nombresGrupos.includes(estadoUI.grupoCompeticion[fase])
        ? estadoUI.grupoCompeticion[fase]
        : nombresGrupos[0];

    estadoUI.grupoCompeticion[fase] = seleccionado;

    const filas = obtenerFilasGrupoParaMostrar(fase, seleccionado);
    const grupoIniciado = hayPartidosJugadosEnGrupo(fase, seleccionado);

    const titulo = fase === "regrupos"
        ? "Segunda fase · ReGrupos"
        : "Primera fase · Grupos";

    return `
        <div class="cabeceraSeccion">
            <span>${fase === "regrupos" ? "🔁" : "📊"}</span>
            <div>
                <h3>${titulo}</h3>
                <p>${filas.length} equipos en ${escaparHTML(nombreGrupoVisible(seleccionado))}</p>
            </div>
        </div>

        ${pintarSelectorGrupos(nombresGrupos, seleccionado, "competicion", fase, false)}

        ${grupoIniciado ? `
            <button class="btnVistaCompleta" id="btnVistaCompleta" type="button">
                📋 Ver tabla completa de ${escaparHTML(nombreGrupoVisible(seleccionado))}
            </button>
        ` : `
            <section class="resumenPartidos separacionSuperior">
                <div class="estadoResumen">👥 Equipos asignados</div>
                <p>La clasificación aparecerá cuando se juegue el primer partido del grupo.</p>
            </section>
        `}

        <div class="listaClasificacion separacionSuperior">
            ${filas.length
                ? (grupoIniciado
                    ? ordenarClasificacionGrupo(filas)
                        .map(fila => pintarFilaClasificacionGrupo(fila, fase, filas.length))
                        .join("")
                    : filas.map(pintarFilaEquipoGrupoSinClasificacion).join(""))
                : pintarTarjetaVacia("Equipos pendientes", "Todavía no hay equipos asignados a este grupo.")}
        </div>
    `;
}

function pintarSelectorGrupos(grupos, seleccionado, contexto, fase, incluirTodos) {
    const opciones = incluirTodos ? ["todos", ...grupos] : grupos;

    if (opciones.length <= 1) return "";

    return `
        <div class="selectorGrupos">
            ${opciones.map(grupo => `
                <button
                    type="button"
                    class="selectorGrupoBtn ${grupo === seleccionado ? "selectorGrupoActivo" : ""}"
                    data-selector-grupo="${contexto}"
                    data-fase="${fase}"
                    data-grupo="${escaparAtributo(grupo)}"
                >
                    ${grupo === "todos" ? "Todos" : escaparHTML(nombreGrupoVisible(grupo))}
                </button>
            `).join("")}
        </div>
    `;
}

function pintarFilaClasificacionGrupo(filaOriginal, fase, totalEquipos) {
    const fila = normalizarClasificacion(filaOriginal);
    const posicion = fila.posicion_actual;
    const medalla = posicion === 1
        ? "🥇"
        : posicion === 2
            ? "🥈"
            : posicion === 3
                ? "🥉"
                : `${posicion}.`;

    return `
        <article class="filaClasificacion" data-desplegable="true">
            <div class="lineaEquipo">
                <div class="equipoFila">${medalla} ${escaparHTML(fila.equipo)}</div>
                <div class="movimientoFila igual">${fila.puntos_totales} pts</div>
            </div>

            <div class="datosFila">
                🎾 ${fila.pj} PJ · ✅ ${fila.pg} PG · ❌ ${fila.pp} PP
            </div>

            <div class="etiquetaEspecial">
                ${obtenerEtiquetaGrupo(fila, fase, totalEquipos)}
            </div>

            ${pintarDetalleEstadisticas(fila, false)}
        </article>
    `;
}

function pintarDetalleEstadisticas(equipo, mostrarCoef) {
    return `
        <div class="toggleDetalles">▼ Ver estadísticas</div>

        <div class="detalleClasif oculto">
            <div class="grupoStats">
                <h5>Partidos</h5>
                <div><span>Ganados</span><strong>${equipo.pg}</strong></div>
                <div><span>Perdidos</span><strong>${equipo.pp}</strong></div>
            </div>

            ${mostrarCoef ? `
                <div class="grupoStats">
                    <h5>Coeficiente</h5>
                    <div><span>Coeficiente</span><strong>${equipo.coeficiente}</strong></div>
                </div>
            ` : ""}

            <div class="grupoStats">
                <h5>Sets</h5>
                <div><span>Ganados</span><strong>${equipo.sets_ganados}</strong></div>
                <div><span>Perdidos</span><strong>${equipo.sets_perdidos}</strong></div>
                <div><span>Diferencia</span><strong>${formatoDiff(equipo.sets_diff)}</strong></div>
            </div>

            <div class="grupoStats">
                <h5>Juegos</h5>
                <div><span>Ganados</span><strong>${equipo.puntos_ganados}</strong></div>
                <div><span>Perdidos</span><strong>${equipo.puntos_perdidos}</strong></div>
                <div><span>Diferencia</span><strong>${formatoDiff(equipo.puntos_diff)}</strong></div>
            </div>
        </div>
    `;
}

function pintarClasificacionCompletaActual() {
    const contenido = obtenerContenidoDetalle();
    if (!contenido) return;

    const fase = estadoUI.faseCompeticion;

    if (fase === "liguilla") {
        contenido.innerHTML = pintarTablaCompletaLiguilla();
        return;
    }

    if (fase === "grupos" || fase === "regrupos") {
        contenido.innerHTML = pintarTablaCompletaGrupo(fase);
    }
}

function pintarTablaCompletaLiguilla() {
    const mostrarCoef = mostrarCoeficiente();

    return `
        <h2>📋 Clasificación completa</h2>
        <div class="tablaScroll">
            <table class="tablaClasificacion">
                <thead>
                    <tr>
                        <th>MOV</th><th>POS</th><th>EQUIPO</th><th>PTOS</th>
                        ${mostrarCoef ? "<th>COEF</th>" : ""}
                        <th>PJ</th><th>PG</th><th>PP</th><th>DES</th>
                        <th>SG</th><th>SP</th><th>SD</th>
                        <th>JGan</th><th>JPer</th><th>JDif</th>
                    </tr>
                </thead>
                <tbody>
                    ${(datos.clasificacion || []).map(equipo => {
                        const mov = obtenerMovimiento(equipo);
                        return `
                            <tr>
                                <td><span class="${mov.clase} movTabla">${mov.texto}</span></td>
                                <td><strong>${numero(equipo.posicion_actual)}</strong></td>
                                <td class="equipoTabla">${escaparHTML(equipo.equipo)}</td>
                                <td>${numero(equipo.puntos_totales)}</td>
                                ${mostrarCoef ? `<td>${numero(equipo.coeficiente)}</td>` : ""}
                                <td>${numero(equipo.pj)}</td>
                                <td>${numero(equipo.pg)}</td>
                                <td>${numero(equipo.pp)}</td>
                                <td>${numero(equipo.descanso)}</td>
                                <td>${numero(equipo.sets_ganados)}</td>
                                <td>${numero(equipo.sets_perdidos)}</td>
                                <td>${formatoDiff(equipo.sets_diff)}</td>
                                <td>${numero(equipo.puntos_ganados)}</td>
                                <td>${numero(equipo.puntos_perdidos)}</td>
                                <td>${formatoDiff(equipo.puntos_diff)}</td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
        <button class="btnVistaCompleta" id="btnVistaResumida" type="button">
            ← Volver a vista resumida
        </button>
    `;
}

function pintarTablaCompletaGrupo(fase) {
    const grupo = estadoUI.grupoCompeticion[fase];
    const filas = ordenarClasificacionGrupo(
        obtenerClasificacionFase(fase).filter(fila => fila.grupo === grupo)
    ).map(normalizarClasificacion);

    return `
        <h2>📋 ${escaparHTML(nombreGrupoVisible(grupo))}</h2>
        <div class="tablaScroll">
            <table class="tablaClasificacion">
                <thead>
                    <tr>
                        <th>POS</th><th>EQUIPO</th><th>PTOS</th><th>PJ</th>
                        <th>PG</th><th>PP</th><th>SF</th><th>SC</th>
                        <th>SD</th><th>JF</th><th>JC</th><th>JD</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas.map(fila => `
                        <tr>
                            <td><strong>${fila.posicion_actual}</strong></td>
                            <td class="equipoTabla">${escaparHTML(fila.equipo)}</td>
                            <td>${fila.puntos_totales}</td>
                            <td>${fila.pj}</td><td>${fila.pg}</td><td>${fila.pp}</td>
                            <td>${fila.sets_ganados}</td><td>${fila.sets_perdidos}</td>
                            <td>${formatoDiff(fila.sets_diff)}</td>
                            <td>${fila.puntos_ganados}</td><td>${fila.puntos_perdidos}</td>
                            <td>${formatoDiff(fila.puntos_diff)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
        <button class="btnVistaCompleta" id="btnVistaResumida" type="button">
            ← Volver a vista resumida
        </button>
    `;
}

/* =========================================================
   PANTALLA PARTIDOS
========================================================= */

function pintarPantallaPartidos() {
    const contenido = obtenerContenidoDetalle();
    if (!contenido) return;

    const fases = obtenerFasesPartidosDisponibles();

    if (!fases.some(fase => fase.clave === estadoUI.fasePartidos)) {
        estadoUI.fasePartidos = obtenerFaseActualPartidos();
    }

    const fase = estadoUI.fasePartidos;

    let html = `
        <h2>🎾 Partidos</h2>
        ${pintarSelectorFases(fases, fase, "partidos")}
    `;

    if (fase === "liguilla") {
        html += pintarJornadasFase("liguilla", "todos");
    } else if (fase === "grupos" || fase === "regrupos") {
        const grupos = obtenerNombresGrupos(fase);
        const grupoSeleccionado = estadoUI.grupoPartidos[fase] || "todos";
        estadoUI.grupoPartidos[fase] = grupoSeleccionado;

        html += pintarSelectorGrupos(
            grupos,
            grupoSeleccionado,
            "partidos",
            fase,
            true
        );
        html += pintarJornadasFase(fase, grupoSeleccionado);
    } else if (fase === "cruces") {
        html += pintarContenidoCruces();
    } else if (fase === "palas") {
        html += pintarContenidoPalas();
    }

    contenido.innerHTML = html;
}

function pintarJornadasFase(fase, grupoSeleccionado) {
    const todosPartidos = obtenerPartidosFase(fase);
    const partidos = grupoSeleccionado === "todos"
        ? todosPartidos
        : todosPartidos.filter(partido => partido.grupo === grupoSeleccionado);

    if (!partidos.length) {
        return pintarTarjetaVacia(
            "⏳ Partidos pendientes",
            "Todavía no hay jornadas generadas para esta fase."
        );
    }

    const partidosValidos = quitarDescansos(partidos);
    const jornadaActual = obtenerJornadaActual(partidosValidos);
    const partidosJornadaActual = partidosValidos.filter(
        partido => Number(partido.jornada) === Number(jornadaActual)
    );
    const jugadosActual = partidosJornadaActual.filter(partidoFinalizado).length;
    const pendientesActual = partidosJornadaActual.filter(partidoPendiente).length;
    const porcentaje = partidosJornadaActual.length
        ? Math.round(jugadosActual / partidosJornadaActual.length * 100)
        : 0;

    const jornadas = [...new Set(partidos.map(partido => Number(partido.jornada)))]
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    return `
        <section class="resumenPartidos separacionSuperior">
            <div class="estadoResumen">
                ${pendientesActual === 0
                    ? `✅ Jornada ${jornadaActual} finalizada`
                    : `🟢 Jornada ${jornadaActual} en juego`}
            </div>
            <div class="barra">
                <div class="progreso" style="width:${porcentaje}%"></div>
            </div>
            <p>${jugadosActual} jugados · ${pendientesActual} pendientes · ${porcentaje}%</p>
        </section>

        <div class="listaJornadas">
            ${jornadas.map(jornada => {
                const partidosJornada = partidos.filter(
                    partido => Number(partido.jornada) === jornada
                );
                return pintarBloqueJornada(
                    jornada,
                    partidosJornada,
                    jornada === jornadaActual,
                    grupoSeleccionado === "todos" && (fase === "grupos" || fase === "regrupos")
                );
            }).join("")}
        </div>
    `;
}

function pintarBloqueJornada(jornada, partidos, abierta, separarPorGrupo) {
    const sinDescanso = quitarDescansos(partidos);
    const jugados = sinDescanso.filter(partidoFinalizado).length;
    const pendientes = sinDescanso.filter(partidoPendiente).length;
    const total = sinDescanso.length;

    let estado = "⏳ Próxima";
    let clase = "proxima";

    if (total > 0 && pendientes === 0) {
        estado = "✅ Finalizada";
        clase = "finalizada";
    } else if (abierta && pendientes > 0) {
        estado = "🟢 En juego";
        clase = "enJuego";
    }

    let tarjetas = "";

    if (separarPorGrupo) {
        tarjetas = [...agruparPor(partidos, partido => partido.grupo || "Sin grupo").entries()]
            .sort((a, b) => ordenarNombreGrupo(a[0], b[0]))
            .map(([grupo, partidosGrupo]) => `
                <div class="grupoPartidos">
                    <h4>${escaparHTML(nombreGrupoVisible(grupo))}</h4>
                    ${ordenarPartidos(partidosGrupo).map(pintarCardPartido).join("")}
                </div>
            `).join("");
    } else {
        tarjetas = ordenarPartidos(partidos).map(pintarCardPartido).join("");
    }

    return `
        <section class="bloqueJornada">
            <div class="cabeceraJornada ${clase}">
                <div>
                    <span class="chipJornada">${estado}</span>
                    <h3>Jornada ${jornada}</h3>
                    <p>${jugados}/${total} partidos</p>
                </div>
                <span class="flechaJornada">${abierta ? "▼" : "▶"}</span>
            </div>
            <div class="listaPartidos ${abierta ? "" : "oculto"}">
                ${tarjetas}
            </div>
        </section>
    `;
}

function pintarCardPartido(partido) {
    if (partidoEsDescanso(partido)) {
        const equipo = partido.local || partido.visitante || "";
        return `
            <article class="cardPartido descanso">
                <div class="estadoPartido">💤 Descanso</div>
                <div class="equipoPartido">${escaparHTML(equipo)}</div>
            </article>
        `;
    }

    const local = partido.local || "";
    const visitante = partido.visitante || "";
    const sets = obtenerSets(partido.resultado);
    const finalizado = partidoFinalizado(partido);
    const localGana = normalizar(partido.ganador) === normalizar(local);
    const visitanteGana = normalizar(partido.ganador) === normalizar(visitante);

    return `
        <article class="cardPartido marcador ${finalizado ? "jugado" : "pendiente"}">
            <div class="estadoPartido">
                ${finalizado ? "✅ Finalizado" : "⏳ Pendiente"}
            </div>
            ${pintarMetaPartido(partido)}
            <div class="marcadorHeader">
                <div></div><div>I</div><div>II</div><div>III</div>
            </div>
            ${pintarFilaMarcador(local, sets, "local", localGana)}
            ${pintarFilaMarcador(visitante, sets, "visitante", visitanteGana)}
        </article>
    `;
}

function pintarFilaMarcador(nombre, sets, lado, ganador) {
    return `
        <div class="filaMarcador ${ganador ? "ganadorFila" : ""}">
            <div class="nombreEquipoMarcador">
                ${dividirEquipo(nombre).map(jugador => `<strong>${escaparHTML(jugador)}</strong>`).join("")}
            </div>
            <div>${sets[0][lado]}</div>
            <div>${sets[1][lado]}</div>
            <div>${sets[2][lado]}</div>
        </div>
    `;
}

function pintarMetaPartido(partido) {
    const partes = [];

    if (partido.grupo) partes.push(nombreGrupoVisible(partido.grupo));
    if (partido.pista !== null && partido.pista !== undefined && partido.pista !== "") {
        partes.push(`Pista ${partido.pista}`);
    }
    if (partido.duracion_min !== null && partido.duracion_min !== undefined && partido.duracion_min !== "") {
        partes.push(`${partido.duracion_min} min`);
    }

    return partes.length
        ? `<div class="metaPartido">${escaparHTML(partes.join(" · "))}</div>`
        : "";
}

/* =========================================================
   PANTALLA EQUIPOS
========================================================= */

function pintarPantallaEquipos() {
    const contenido = obtenerContenidoDetalle();
    if (!contenido) return;

    const equipos = [...(datos.equipos || [])].sort(
        (a, b) => numero(a.orden) - numero(b.orden)
    );

    const grupos = esModoGrupos()
        ? [...new Set(equipos.map(equipo => equipo.grupo).filter(Boolean))]
            .sort(ordenarNombreGrupo)
        : [];

    if (!estadoUI.grupoEquipos) estadoUI.grupoEquipos = "todos";

    const filtrados = estadoUI.grupoEquipos === "todos"
        ? equipos
        : equipos.filter(equipo => equipo.grupo === estadoUI.grupoEquipos);

    contenido.innerHTML = `
        <h2>👥 Equipos</h2>

        <section class="resumenPartidos">
            <div class="estadoResumen">${equipos.length} equipos participantes</div>
            <p>${esModoGrupos() ? "Filtra por grupo para localizar un equipo." : "Listado de equipos participantes."}</p>
        </section>

        ${esModoGrupos()
            ? pintarSelectorGrupos(grupos, estadoUI.grupoEquipos, "equipos", "equipos", true)
            : ""}

        <div class="listaEquipos separacionSuperior">
            ${filtrados.map(pintarCardEquipo).join("") ||
                pintarTarjetaVacia("Sin equipos", "No hay equipos para este filtro.")}
        </div>
    `;
}

function pintarCardEquipo(equipo) {
    const ficha = obtenerFichaEquipo(equipo);
    const jugadores = dividirEquipo(equipo.equipo);
    const etiquetas = [];

    if (ficha.grupoInicial) etiquetas.push(ficha.grupoInicial);
    if (ficha.regrupo) etiquetas.push(ficha.regrupo);
    if (ficha.clasificacion?.pj > 0) {
        etiquetas.push(`${ficha.clasificacion.pj} PJ`);
        etiquetas.push(`${ficha.clasificacion.puntos_totales} pts`);
    }

    return `
        <article class="cardEquipo">
            <div class="cabeceraEquipo">
                <div class="iconoEquipo">👥</div>
                <div class="nombreEquipoFicha">
                    ${jugadores.map(jugador => `<strong>${escaparHTML(jugador)}</strong>`).join("")}
                </div>
                <span></span>
            </div>

            ${etiquetas.length ? `
                <div class="resumenEquipo">
                    ${etiquetas.map(etiqueta => `<span>${escaparHTML(etiqueta)}</span>`).join("")}
                </div>
            ` : ""}

            <div class="datosFila">
                🎾 Próximo partido: <strong>${escaparHTML(ficha.proximo?.rival || "Sin partido pendiente")}</strong>
                ${ficha.proximo?.detalle ? `<br>${escaparHTML(ficha.proximo.detalle)}` : ""}
            </div>
        </article>
    `;
}

function obtenerFichaEquipo(equipo) {
    const faseClasificacion = obtenerFaseClasificacionPrincipal();
    const grupoInicial = equipo.grupo ? nombreGrupoVisible(equipo.grupo) : "";

    const filaRegrupo = obtenerClasificacionFase("regrupos").find(
        fila => mismoEquipoPorIDsONombre(fila, equipo)
    ) || obtenerEquiposAsignadosFase("regrupos").find(
        fila => mismoEquipoPorIDsONombre(fila, equipo)
    );

    const regrupo = filaRegrupo?.grupo || "";

    let filaClasificacion = null;

    if (faseClasificacion === "regrupos") {
        filaClasificacion = obtenerClasificacionFase("regrupos").find(
            fila => mismoEquipoPorIDsONombre(fila, equipo)
        );
    } else if (faseClasificacion === "grupos") {
        filaClasificacion = obtenerClasificacionFase("grupos").find(
            fila => mismoEquipoPorIDsONombre(fila, equipo)
        );
    } else {
        filaClasificacion = (datos.clasificacion || []).find(
            fila => normalizar(fila.equipo) === normalizar(equipo.equipo)
        );
    }

    const clasificacion = filaClasificacion
        ? normalizarClasificacion(filaClasificacion)
        : null;

    return {
        grupoInicial,
        regrupo: regrupo ? nombreGrupoVisible(regrupo) : "",
        clasificacion,
        proximo: obtenerProximoPartidoEquipo(equipo.equipo, obtenerFaseActualCompeticion())
    };
}

function obtenerProximoPartidoEquipo(nombreEquipo, fasePreferida) {
    const ordenFases = [fasePreferida, "cruces", "regrupos", "grupos", "liguilla"]
        .filter((fase, indice, lista) => fase && lista.indexOf(fase) === indice);

    for (const fase of ordenFases) {
        const partido = obtenerPartidosFase(fase).find(item =>
            partidoPendiente(item) &&
            [item.local, item.visitante].some(
                nombre => normalizar(nombre) === normalizar(nombreEquipo)
            )
        );

        if (partido) {
            const rival = normalizar(partido.local) === normalizar(nombreEquipo)
                ? partido.visitante
                : partido.local;

            const partes = [];

            if (partido.grupo) {
                partes.push(nombreGrupoVisible(partido.grupo));
            } else if (fase === "cruces") {
                partes.push(partido.fase || "Eliminatorias");
            }

            if (partido.jornada) partes.push(`Jornada ${partido.jornada}`);
            if (partido.pista) partes.push(`Pista ${partido.pista}`);

            return {
                rival,
                detalle: partes.join(" · ")
            };
        }
    }

    return null;
}

/* =========================================================
   ELIMINATORIAS
========================================================= */

function pintarContenidoCruces() {
    const cruces = datos.cruces || [];

    if (!cruces.length) {
        return pintarTarjetaVacia(
            "⏳ Todavía no generadas",
            "Las eliminatorias aparecerán aquí cuando se creen desde Excel."
        );
    }

    const fases = [...new Set(cruces.map(partido => partido.fase))];
    const faseActual = obtenerFaseActualCruces(cruces);

    return `
        <div class="listaJornadas separacionSuperior">
            ${fases.map(fase => {
                const partidosFase = cruces.filter(partido => partido.fase === fase);
                const jugados = partidosFase.filter(partidoFinalizado).length;
                const pendientes = partidosFase.length - jugados;
                const abierta = fase === faseActual;

                return `
                    <section class="bloqueJornada">
                        <div class="cabeceraJornada ${pendientes === 0 ? "finalizada" : "enJuego"}">
                            <div>
                                <span class="chipJornada">
                                    ${pendientes === 0 ? "✅ Finalizada" : "🟢 En juego"}
                                </span>
                                <h3>${escaparHTML(fase)}</h3>
                                <p>${jugados}/${partidosFase.length} partidos</p>
                            </div>
                            <span class="flechaJornada">${abierta ? "▼" : "▶"}</span>
                        </div>
                        <div class="listaPartidos ${abierta ? "" : "oculto"}">
                            ${partidosFase.map(pintarCardPartido).join("")}
                        </div>
                    </section>
                `;
            }).join("")}
        </div>
    `;
}

function obtenerFaseActualCruces(cruces) {
    const fases = [...new Set(cruces.map(partido => partido.fase))];

    for (const fase of fases) {
        if (cruces.filter(partido => partido.fase === fase).some(partidoPendiente)) {
            return fase;
        }
    }

    return fases[fases.length - 1] || "";
}

/* =========================================================
   PALAS DE PLAYA
========================================================= */

function pintarContenidoPalas() {
    const rondas = datos.palas_playa || [];

    if (!rondas.length) {
        return pintarTarjetaVacia(
            "⏳ Todavía no iniciada",
            "La Copa Palas Playa aparecerá aquí cuando se genere desde Excel."
        );
    }

    const rondaActual = obtenerRondaActualPalas(rondas);

    return `
        <section class="resumenPartidos resumenPalas separacionSuperior">
            <div class="estadoResumen">🥄 El que pierde sigue jugando</div>
            <p>Ganar un partido significa salvarse del farolillo.</p>
        </section>

        <div class="listaJornadas">
            ${rondas.map(ronda => {
                const partidos = ronda.partidos || [];
                const jugados = partidos.filter(partidoFinalizado).length;
                const pendientes = partidos.length - jugados;
                const abierta = Number(ronda.ronda) === Number(rondaActual);

                return `
                    <section class="bloqueJornada">
                        <div class="cabeceraJornada ${pendientes === 0 ? "finalizada" : abierta ? "enJuego" : "proxima"}">
                            <div>
                                <span class="chipJornada">
                                    ${pendientes === 0 ? "✅ Finalizada" : abierta ? "🟢 En juego" : "⏳ Próxima"}
                                </span>
                                <h3>${escaparHTML(ronda.nombre || `Ronda ${ronda.ronda}`)}</h3>
                                <p>${jugados}/${partidos.length} partidos</p>
                                ${ronda.descansa ? `<p>💤 Descansa: <strong>${escaparHTML(ronda.descansa)}</strong></p>` : ""}
                            </div>
                            <span class="flechaJornada">${abierta ? "▼" : "▶"}</span>
                        </div>
                        <div class="listaPartidos ${abierta ? "" : "oculto"}">
                            ${partidos.map(pintarCardPalas).join("")}
                        </div>
                    </section>
                `;
            }).join("")}
        </div>
    `;
}

function obtenerRondaActualPalas(rondas) {
    const pendiente = rondas.find(ronda => (ronda.partidos || []).some(partidoPendiente));
    return pendiente?.ronda || rondas[rondas.length - 1]?.ronda || 1;
}

function pintarCardPalas(partido) {
    const local = partido.local || partido.equipo1 || partido.equipo_a || "";
    const visitante = partido.visitante || partido.equipo2 || partido.equipo_b || "";
    const sets = obtenerSets(partido.resultado);
    const finalizado = partidoFinalizado(partido);
    const localGana = normalizar(partido.ganador) === normalizar(local);
    const visitanteGana = normalizar(partido.ganador) === normalizar(visitante);
    const localPierde = finalizado && visitanteGana;
    const visitantePierde = finalizado && localGana;
    const salvado = localGana ? local : visitanteGana ? visitante : "";
    const sigue = localPierde ? local : visitantePierde ? visitante : "";

    return `
        <article class="cardPartido marcador pendientePalas">
            <div class="estadoPartido">${finalizado ? "✅ Finalizado" : "⏳ Pendiente"}</div>
            ${pintarMetaPartido(partido)}
            <div class="marcadorHeader">
                <div></div><div>I</div><div>II</div><div>III</div>
            </div>
            ${pintarFilaPalas(local, sets, "local", localPierde)}
            ${pintarFilaPalas(visitante, sets, "visitante", visitantePierde)}
            ${finalizado ? `
                <div class="infoPalas">
                    ${partido.es_final === true
                        ? `🥄 Farolillo rojo: <strong>${escaparHTML(sigue)}</strong>`
                        : `🛟 Se salva: <strong>${escaparHTML(salvado)}</strong>`}
                </div>
            ` : ""}
        </article>
    `;
}

function pintarFilaPalas(nombre, sets, lado, pierde) {
    return `
        <div class="filaMarcador ${pierde ? "perdedorPalas" : ""}">
            <div class="nombreEquipoMarcador">
                ${dividirEquipo(nombre).map(jugador => `<strong>${escaparHTML(jugador)}</strong>`).join("")}
            </div>
            <div>${sets[0][lado]}</div>
            <div>${sets[1][lado]}</div>
            <div>${sets[2][lado]}</div>
        </div>
    `;
}

/* =========================================================
   PANTALLA MÁS
========================================================= */

function pintarPantallaMas() {
    const contenido = obtenerContenidoDetalle();
    if (!contenido) return;

    if (esWebPrevia()) {
        pintarPantallaMasPretorneo();
        return;
    }

    const config = obtenerConfiguracion();
    const opciones = [];

    if ((datos.cruces || []).length) {
        opciones.push({ icono: "⚔️", texto: "Eliminatorias", pantalla: "competicion", fase: "cruces" });
    }

    if ((datos.palas_playa || []).length || config.hay_copa_palas_playa) {
        opciones.push({ icono: "🏖️", texto: "Copa Palas Playa", pantalla: "competicion", fase: "palas" });
    }

    if (esSi(config.mostrar_historia)) {
    opciones.push({
        icono: "📖",
        texto: "Historia",
        href: "historia.html"
    });
}

if (esSi(config.mostrar_campeones)) {
    opciones.push({
        icono: "🏆",
        texto: "Campeones",
        href: "campeones.html"
    });
}

    if (esSi(config.mostrar_normativa)) {
        opciones.push({ icono: "📜", texto: "Normativa", href: "normas.html" });
    }
    if (esSi(config.mostrar_fotos)) {
        opciones.push({ icono: "📷", texto: "Fotos", href: "fotos.html" });
    }
    if (esSi(config.mostrar_ranking_historico)) {
        opciones.push({ icono: "📈", texto: "Ranking histórico", href: "ranking.html" });
    }
    if (esSi(config.mostrar_estadisticas)) {
        opciones.push({ icono: "📊", texto: "Estadísticas", href: "estadisticas.html" });
    }

    contenido.innerHTML = `
        <h2>☰ Más</h2>
        <div class="listaOpcionesMas">
            ${opciones.map(opcion => opcion.href
                ? `<a class="opcionMas" href="${escaparAtributo(opcion.href)}">
                    <span>${opcion.icono}</span><strong>${escaparHTML(opcion.texto)}</strong><b>→</b>
                   </a>`
                : `<button class="opcionMas" type="button"
                        data-destino-pantalla="${opcion.pantalla}"
                        data-destino-fase="${opcion.fase}">
                    <span>${opcion.icono}</span><strong>${escaparHTML(opcion.texto)}</strong><b>→</b>
                   </button>`
            ).join("")}
        </div>
    `;
}

/* =========================================================
   ESTADO DE LA COMPETICIÓN
========================================================= */

function obtenerEstadoCompeticion() {
    const fase = obtenerFaseActualCompeticion();

    if (fase === "cruces") {
        return obtenerEstadoCruces();
    }

    if (fase === "palas") {
        return obtenerEstadoPalas();
    }

    const partidos = quitarDescansos(obtenerPartidosFase(fase));

    if (!partidos.length) {
        return {
            titulo: `⏳ ${nombreFase(fase)} pendiente`,
            texto: "Todavía no hay partidos generados",
            porcentaje: 0,
            claseBarra: "barraLiguilla",
            finalizado: false
        };
    }

    const pendientesTotales = partidos.filter(partidoPendiente).length;

    if (pendientesTotales === 0) {
        return {
            titulo: `✅ ${nombreFase(fase)} finalizada`,
            texto: `${partidos.length} de ${partidos.length} partidos · 100%`,
            porcentaje: 100,
            claseBarra: "barraLiguilla",
            finalizado: false
        };
    }

    const jornada = obtenerJornadaActual(partidos);
    const partidosJornada = partidos.filter(
        partido => Number(partido.jornada) === Number(jornada)
    );
    const jugados = partidosJornada.filter(partidoFinalizado).length;
    const porcentaje = partidosJornada.length
        ? Math.round(jugados / partidosJornada.length * 100)
        : 0;

    return {
        titulo: `🟢 ${nombreFase(fase)} · Jornada ${jornada}`,
        texto: `${jugados} de ${partidosJornada.length} partidos de la jornada · ${porcentaje}%`,
        porcentaje,
        claseBarra: "barraLiguilla",
        finalizado: false
    };
}

function obtenerEstadoCruces() {
    const cruces = datos.cruces || [];
    const finalizado = cruces.length > 0 && cruces.every(partidoFinalizado);

    if (finalizado) {
        const final = cruces.find(partido => normalizar(partido.fase) === "FINAL");
        return {
            titulo: "🏆 Campeonato finalizado",
            texto: final?.ganador
                ? `🥇 Campeones: ${final.ganador}`
                : "¡Tenemos campeones!",
            porcentaje: 100,
            claseBarra: "barraFinalizado",
            finalizado: true
        };
    }

    const fase = obtenerFaseActualCruces(cruces);
    const partidosFase = cruces.filter(partido => partido.fase === fase);
    const jugados = partidosFase.filter(partidoFinalizado).length;
    const porcentaje = partidosFase.length
        ? Math.round(jugados / partidosFase.length * 100)
        : 0;

    return {
        titulo: tituloFase(fase),
        texto: `${jugados} de ${partidosFase.length} partidos`,
        porcentaje,
        claseBarra: claseBarraFase(fase),
        finalizado: false
    };
}

function obtenerEstadoPalas() {
    const partidos = obtenerPartidosFase("palas");
    const jugados = partidos.filter(partidoFinalizado).length;
    const porcentaje = partidos.length ? Math.round(jugados / partidos.length * 100) : 0;

    return {
        titulo: "🏖️ Copa Palas Playa",
        texto: `${jugados} de ${partidos.length} partidos`,
        porcentaje,
        claseBarra: "barraLiguilla",
        finalizado: false
    };
}

/* =========================================================
   MODELO DE DATOS Y FASES
========================================================= */

function obtenerConfiguracion() {
    return datos?.configuracion || {};
}

function obtenerEstadoTorneo() {
    const config = obtenerConfiguracion();
    const valor = config.estado_torneo || config.estado || "En juego";

    return normalizar(valor)
        .replaceAll("_", " ")
        .replace(/\s+/g, " ");
}

function esEstadoPretorneo() {
    return obtenerEstadoTorneo() === "PRETORNEO";
}

function esEstadoInscripciones() {
    return obtenerEstadoTorneo().includes("INSCRIP");
}

function esWebPrevia() {
    return esEstadoPretorneo() || esEstadoInscripciones();
}

function obtenerLugarCampeonato() {
    const config = obtenerConfiguracion();

    return String(
        config.lugar_campeonato ||
        config.localidad ||
        config.lugar ||
        "Tui"
    ).trim();
}

function obtenerHorarioCampeonato() {
    const config = obtenerConfiguracion();

    return String(
        config.horario_campeonato ||
        config.horario ||
        ""
    ).trim();
}

function obtenerFechaHoraInicioCampeonato() {
    const fechaTexto = String(
        obtenerFechaCampeonato() || ""
    ).trim();

    const horarioTexto = String(
        obtenerHorarioCampeonato() || ""
    ).trim();

    let dia;
    let mes;
    let anio;

    let coincidencia = fechaTexto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (coincidencia) {
        anio = Number(coincidencia[1]);
        mes = Number(coincidencia[2]);
        dia = Number(coincidencia[3]);
    } else {
        coincidencia = fechaTexto.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/
        );

        if (coincidencia) {
            dia = Number(coincidencia[1]);
            mes = Number(coincidencia[2]);
            anio = Number(coincidencia[3]);
        }
    }

    if (!dia || !mes || !anio) {
        return null;
    }

    const coincidenciaHora = horarioTexto.match(
        /(\d{1,2})[:.](\d{2})/
    );

    const hora = coincidenciaHora
        ? Number(coincidenciaHora[1])
        : 0;

    const minutos = coincidenciaHora
        ? Number(coincidenciaHora[2])
        : 0;

    const fechaInicio = new Date(
        anio,
        mes - 1,
        dia,
        hora,
        minutos,
        0,
        0
    );

    return Number.isNaN(fechaInicio.getTime())
        ? null
        : fechaInicio;
}

function iniciarCuentaAtrasCampeonato() {
    detenerCuentaAtrasCampeonato();

    const contenedor =
        document.querySelector(".actualizacion");

    if (!contenedor) return;

    contenedor.classList.add("cuentaAtras");

    const actualizar = () => {
        const fechaInicio =
            obtenerFechaHoraInicioCampeonato();

        if (!fechaInicio) {
            contenedor.innerHTML = `
                <span class="cuentaAtrasMensaje">
                    📅 Fecha y horario pendientes de confirmar
                </span>
            `;
            return;
        }

        const diferencia =
            fechaInicio.getTime() - Date.now();

        if (diferencia <= 0) {
            contenedor.innerHTML = `
                <span class="cuentaAtrasMensaje">
                    🎾 El campeonato ya ha comenzado
                </span>
            `;
            return;
        }

        const totalMinutos = Math.floor(
            diferencia / 60000
        );

        const dias = Math.floor(
            totalMinutos / 1440
        );

        const horas = Math.floor(
            (totalMinutos % 1440) / 60
        );

        const minutos = totalMinutos % 60;

        contenedor.innerHTML = `
            <span class="cuentaAtrasTitulo">
                ⏳ Faltan para el inicio
            </span>

            <div class="cuentaAtrasValores">
                <div>
                    <strong>${dias}</strong>
                    <small>días</small>
                </div>

                <div>
                    <strong>${horas}</strong>
                    <small>horas</small>
                </div>

                <div>
                    <strong>${minutos}</strong>
                    <small>min</small>
                </div>
            </div>
        `;
    };

    actualizar();

    temporizadorCuentaAtras = setInterval(
        actualizar,
        30000
    );
}

function detenerCuentaAtrasCampeonato() {
    if (temporizadorCuentaAtras) {
        clearInterval(temporizadorCuentaAtras);
        temporizadorCuentaAtras = null;
    }
}

function restaurarBloqueActualizacionCompeticion() {
    const contenedor =
        document.querySelector(".actualizacion");

    if (!contenedor) return;

    contenedor.classList.remove("cuentaAtras");

    contenedor.innerHTML = `
        <span>🕒 Última actualización:</span>
        <strong id="ultimaActualizacion">--</strong>
    `;
}
function obtenerFechaCampeonato() {
    const config = obtenerConfiguracion();

    return config.fecha_campeonato || config.fecha || "";
}

function formatearFechaCampeonato() {
    const valor = String(obtenerFechaCampeonato() || "").trim();

    if (!valor) {
        return "Fecha pendiente de confirmar";
    }

    let fecha = null;
    let coincidencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (coincidencia) {
        fecha = new Date(
            Number(coincidencia[1]),
            Number(coincidencia[2]) - 1,
            Number(coincidencia[3])
        );
    } else {
        coincidencia = valor.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
        );

        if (coincidencia) {
            fecha = new Date(
                Number(coincidencia[3]),
                Number(coincidencia[2]) - 1,
                Number(coincidencia[1])
            );
        }
    }

    if (!fecha || Number.isNaN(fecha.getTime())) {
        return valor;
    }

    const texto = fecha.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function obtenerURLInscripcion() {
    const config = obtenerConfiguracion();

    return String(
        config.url_inscripcion ||
        config.url_inscripciones ||
        config.enlace_inscripcion ||
        config.formulario_inscripcion ||
        ""
    ).trim();
}

function esModoGrupos() {
    const config = obtenerConfiguracion();
    return normalizar(config.tipo_campeonato) === "GRUPOS" || Boolean(datos?.grupos);
}

function obtenerFasesCompeticionDisponibles() {
    const fases = [];
    const config = obtenerConfiguracion();

    if (esModoGrupos()) {
        fases.push({ clave: "grupos", nombre: "Grupos", icono: "📊" });

        if (config.hay_regrupos) {
            fases.push({ clave: "regrupos", nombre: "ReGrupos", icono: "🔁" });
        }
    } else {
        fases.push({ clave: "liguilla", nombre: "Clasificación", icono: "📊" });
    }

    if ((datos.cruces || []).length || debeMostrarCrucesPendientes()) {
        fases.push({ clave: "cruces", nombre: "Eliminatorias", icono: "⚔️" });
    }

    if ((datos.palas_playa || []).length) {
        fases.push({ clave: "palas", nombre: "Palas", icono: "🏖️" });
    }

    return fases;
}

function obtenerFasesPartidosDisponibles() {
    return obtenerFasesCompeticionDisponibles().filter(
        fase => obtenerPartidosFase(fase.clave).length > 0 || ["liguilla", "grupos"].includes(fase.clave)
    );
}

function obtenerFaseActualCompeticion() {
    const cruces = datos?.cruces || [];

    if (esModoGrupos()) {
        const partidosGrupos = quitarDescansos(obtenerPartidosFase("grupos"));
        const partidosRegrupos = quitarDescansos(obtenerPartidosFase("regrupos"));
        const hayRegrupos = partidosRegrupos.length > 0 ||
            obtenerClasificacionFase("regrupos").length > 0;

        const regruposEmpezados = partidosRegrupos.some(partidoFinalizado);

        if (partidosGrupos.some(partidoPendiente) && !regruposEmpezados) {
            return "grupos";
        }

        if (hayRegrupos && partidosRegrupos.some(partidoPendiente)) {
            return "regrupos";
        }

        if (cruces.length) {
            return "cruces";
        }

        if (hayRegrupos) {
            return "regrupos";
        }

        return "grupos";
    }

    const partidosLiguilla = quitarDescansos(obtenerPartidosFase("liguilla"));

    if (partidosLiguilla.some(partidoPendiente)) {
        return "liguilla";
    }

    if (cruces.length) {
        return "cruces";
    }

    return "liguilla";
}

function obtenerFaseActualPartidos() {
    const faseCompeticion = obtenerFaseActualCompeticion();
    if (obtenerPartidosFase(faseCompeticion).length) return faseCompeticion;

    if (esModoGrupos()) return "grupos";
    return "liguilla";
}

function obtenerClasificacionFase(fase) {
    if (fase === "liguilla") return datos?.clasificacion || [];
    if (fase === "grupos") return datos?.grupos?.clasificaciones || [];
    if (fase === "regrupos") return datos?.regrupos?.clasificaciones || [];
    return [];
}

function obtenerPartidosFase(fase) {
    if (fase === "liguilla") return datos?.partidos || [];
    if (fase === "grupos") return datos?.grupos?.partidos || [];
    if (fase === "regrupos") return datos?.regrupos?.partidos || [];
    if (fase === "cruces") return datos?.cruces || [];
    if (fase === "palas") {
        return (datos?.palas_playa || []).flatMap(ronda => ronda.partidos || []);
    }
    return [];
}

function obtenerNombresGrupos(fase) {
    const desdeClasificacion = obtenerClasificacionFase(fase).map(fila => fila.grupo);
    const desdePartidos = obtenerPartidosFase(fase).map(partido => partido.grupo);
    const desdeAsignaciones = obtenerEquiposAsignadosFase(fase).map(equipo => equipo.grupo);

    return [...new Set([
        ...desdeClasificacion,
        ...desdePartidos,
        ...desdeAsignaciones
    ].filter(Boolean))].sort(ordenarNombreGrupo);
}

function nombreFase(fase) {
    const nombres = {
        liguilla: "Liguilla",
        grupos: "Grupos",
        regrupos: "ReGrupos",
        cruces: "Eliminatorias",
        palas: "Copa Palas Playa"
    };
    return nombres[fase] || fase || "Competición";
}

/* =========================================================
   AUXILIARES DE CLASIFICACIÓN
========================================================= */

function normalizarClasificacion(fila) {
    return {
        ...fila,
        equipo: fila.equipo || "",
        posicion_actual: numero(fila.posicion ?? fila.posicion_actual),
        posicion_anterior: numero(fila.posicion_anterior ?? fila.posicion ?? fila.posicion_actual),
        puntos_totales: numero(fila.puntos ?? fila.puntos_totales),
        coeficiente: numero(fila.coeficiente),
        pj: numero(fila.pj),
        pg: numero(fila.pg),
        pp: numero(fila.pp),
        descanso: numero(fila.descanso),
        sets_ganados: numero(fila.sets_favor ?? fila.sets_ganados),
        sets_perdidos: numero(fila.sets_contra ?? fila.sets_perdidos),
        sets_diff: numero(fila.sets_diff),
        puntos_ganados: numero(fila.juegos_favor ?? fila.puntos_ganados),
        puntos_perdidos: numero(fila.juegos_contra ?? fila.puntos_perdidos),
        puntos_diff: numero(fila.juegos_diff ?? fila.puntos_diff)
    };
}

function ordenarClasificacionGrupo(filas) {
    return [...filas].sort((a, b) =>
        numero(a.posicion ?? a.posicion_actual) - numero(b.posicion ?? b.posicion_actual)
    );
}

function mostrarCoeficiente() {
    return !esModoGrupos() && datos.modo_orden === "Opción C";
}

function obtenerMovimiento(equipo) {
    const actual = numero(equipo.posicion_actual);
    const anterior = numero(equipo.posicion_anterior || actual);
    const diferencia = anterior - actual;

    if (diferencia > 0) return { texto: `▲ ${diferencia}`, clase: "sube" };
    if (diferencia < 0) return { texto: `▼ ${Math.abs(diferencia)}`, clase: "baja" };
    return { texto: "—", clase: "igual" };
}

function obtenerEtiquetaLiguilla(equipo) {
    const posicion = numero(equipo.posicion_actual);
    const total = (datos.clasificacion || []).length;

    if (posicion === 1) return "⭐ Líder";
    if (posicion === 2) return "🥈 Al acecho";
    if (posicion === 3) return "🥉 Podio";
    if (posicion >= 4 && posicion <= 8) return "⚔️ Playoff";
    if (posicion === total) return "🥄 Farolillo";
    return "🚣 A remar";
}

function obtenerEtiquetaGrupo(equipo, fase, totalEquipos) {
    if (!hayPartidosJugadosEnGrupo(fase, equipo.grupo)) {
        return "👥 Equipo asignado";
    }

    const config = obtenerConfiguracion();
    const posicion = numero(equipo.posicion_actual);

    if (posicion === 1) return "⭐ Líder del grupo";

    if (fase === "grupos" && config.hay_regrupos) {
        const pasan = numero(config.equipos_pasan_a_regrupos);
        if (pasan > 0 && posicion <= pasan) return "🔁 Pasa a ReGrupos";
    }

    if (fase === "regrupos" || !config.hay_regrupos) {
        const pasan = numero(config.equipos_pasan_a_cruces_por_grupo);
        if (pasan > 0 && posicion <= pasan) return "⚔️ Pasa a eliminatorias";
    }

    if (posicion === totalEquipos) return "🥄 Farolillo del grupo";
    return "🎾 En competición";
}

function textoModoOrden(modo) {
    if (modo === "Opción A") return "Rendimiento proporcional";
    if (modo === "Opción B") return "Constancia y participación";
    if (modo === "Opción C") return "Eficacia real";
    return modo || "Sistema no definido";
}

/* =========================================================
   INFORMACIÓN DEL SISTEMA DE CLASIFICACIÓN
========================================================= */

function mostrarInfoOrden() {
    const info = obtenerInfoOrden(datos.modo_orden);
    const overlay = document.createElement("div");

    overlay.className = "overlayInfo";
    overlay.id = "overlayInfoOrden";
    overlay.innerHTML = `
        <div class="globoInfo">
            <button id="cerrarInfoOrden" class="cerrarInfo" type="button">×</button>
            <h3>${escaparHTML(info.titulo)}</h3>
            <p>${info.descripcion}</p>
            <div class="ejemploInfo">${info.ejemplo}</div>
            <h4>Orden de criterios</h4>
            <ol>${info.criterios.map(criterio => `<li>${escaparHTML(criterio)}</li>`).join("")}</ol>
        </div>
    `;

    document.body.appendChild(overlay);
}

function cerrarInfoOrden() {
    document.getElementById("overlayInfoOrden")?.remove();
}

function obtenerInfoOrden(modo) {
    if (modo === "Opción A") {
        return {
            titulo: "Opción A · Rendimiento proporcional",
            descripcion: "Prioriza los puntos totales y usa el coeficiente para compensar descansos.",
            ejemplo: "A: 12 pts / 6 PJ = 2,00<br>B: 12 pts / 7 PJ = 1,71<br><strong>A va por delante.</strong>",
            criterios: [
                "Puntos totales", "Coeficiente", "Diferencia de sets", "Sets ganados",
                "Diferencia de juegos", "Juegos ganados", "Partidos jugados", "Sorteo"
            ]
        };
    }

    if (modo === "Opción B") {
        return {
            titulo: "Opción B · Constancia y participación",
            descripcion: "Premia a quien suma los mismos puntos jugando más partidos.",
            ejemplo: "A: 12 pts / 6 PJ<br>B: 12 pts / 7 PJ<br><strong>B va por delante.</strong>",
            criterios: [
                "Puntos totales", "Partidos jugados", "Diferencia de sets",
                "Sets ganados", "Diferencia de juegos", "Juegos ganados", "Sorteo"
            ]
        };
    }

    return {
        titulo: "Opción C · Eficacia real",
        descripcion: "Ordena principalmente por rendimiento por partido.",
        ejemplo: "A: 12 pts / 6 PJ = 2,00<br>B: 11 pts / 5 PJ = 2,20<br><strong>B va por delante.</strong>",
        criterios: [
            "Coeficiente", "Puntos totales", "Diferencia de sets", "Sets ganados",
            "Diferencia de juegos", "Juegos ganados", "Partidos jugados", "Sorteo"
        ]
    };
}

/* =========================================================
   AUXILIARES DE PARTIDOS
========================================================= */

function obtenerJornadaActual(partidos) {
    const jornadas = [...new Set(
        partidos.map(partido => Number(partido.jornada)).filter(Number.isFinite)
    )].sort((a, b) => a - b);

    for (const jornada of jornadas) {
        const partidosJornada = partidos.filter(
            partido => Number(partido.jornada) === jornada
        );
        if (partidosJornada.some(partidoPendiente)) return jornada;
    }

    return jornadas[jornadas.length - 1] || 1;
}

function partidoFinalizado(partido) {
    return ["JUGADO", "FINALIZADO"].includes(normalizar(partido?.estado));
}

function partidoEsDescanso(partido) {
    return normalizar(partido?.estado) === "DESCANSO" ||
        ["SI", "SÍ"].includes(normalizar(partido?.descanso));
}

function partidoPendiente(partido) {
    return !partidoEsDescanso(partido) && !partidoFinalizado(partido);
}

function quitarDescansos(partidos) {
    return (partidos || []).filter(partido => !partidoEsDescanso(partido));
}

function ordenarPartidos(partidos) {
    return [...(partidos || [])].sort((a, b) =>
        numero(a.orden ?? a.id) - numero(b.orden ?? b.id)
    );
}

function dividirEquipo(nombre) {
    return String(nombre || "")
        .split("/")
        .map(jugador => jugador.trim())
        .filter(Boolean);
}

function obtenerSets(resultado) {
    const sets = [
        { local: "-", visitante: "-" },
        { local: "-", visitante: "-" },
        { local: "-", visitante: "-" }
    ];

    if (!Array.isArray(resultado)) return sets;

    resultado.slice(0, 3).forEach((set, indice) => {
        const partes = String(set).split("-");
        sets[indice].local = partes[0] || "-";
        sets[indice].visitante = partes[1] || "-";
    });

    return sets;
}

/* =========================================================
   AUXILIARES GENERALES
========================================================= */

function obtenerContenidoDetalle() {
    return document.getElementById("contenidoDetalle");
}

function agruparPor(lista, obtenerClave) {
    const mapa = new Map();

    (lista || []).forEach(elemento => {
        const clave = obtenerClave(elemento) || "Sin grupo";
        if (!mapa.has(clave)) mapa.set(clave, []);
        mapa.get(clave).push(elemento);
    });

    return mapa;
}

function nombreGrupoVisible(grupo) {
    const texto = String(grupo || "").trim();
    if (!texto) return "Sin grupo";
    if (/^grupo/i.test(texto) || /^regrupo/i.test(texto)) return texto;
    return `Grupo ${texto}`;
}

function ordenarNombreGrupo(a, b) {
    return String(a).localeCompare(String(b), "es", {
        numeric: true,
        sensitivity: "base"
    });
}

function mismoEquipoPorIDsONombre(a, b) {
    const idsValidas = a.id_jug1 && a.id_jug2 && b.id_jug1 && b.id_jug2;
    if (idsValidas) {
        return a.id_jug1 === b.id_jug1 && a.id_jug2 === b.id_jug2;
    }
    return normalizar(a.equipo) === normalizar(b.equipo);
}

function tituloFase(fase) {
    const f = normalizar(fase).toLowerCase();
    if (f.includes("octavo")) return "🔵 Octavos de final";
    if (f.includes("cuarto")) return "🟠 Cuartos de final";
    if (f.includes("semi")) return "🟣 Semifinales";
    if (f.includes("final")) return "🟡 Gran Final";
    return `🟠 ${fase}`;
}

function tituloFaseSinIcono(fase) {
    const f = normalizar(fase).toLowerCase();
    if (f.includes("octavo")) return "Octavos de final";
    if (f.includes("cuarto")) return "Cuartos de final";
    if (f.includes("semi")) return "Semifinales";
    if (f.includes("final")) return "Gran Final";
    return fase || "Eliminatorias";
}

function claseBarraFase(fase) {
    const f = normalizar(fase).toLowerCase();
    if (f.includes("semi")) return "barraSemis";
    if (f.includes("final")) return "barraFinal";
    return "barraCuartos";
}

function formatoDiff(valor) {
    const n = numero(valor);
    return n > 0 ? `+${n}` : String(n);
}

function numero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

function normalizar(texto) {
    return String(texto || "").trim().toUpperCase();
}

function esSi(valor) {
    return ["SI", "SÍ", "TRUE", "1"].includes(normalizar(valor));
}

function textoSiNoPendiente(valor) {

    const texto = normalizar(valor);

    if (
        valor === true ||
        ["SI", "SÍ", "TRUE", "1"].includes(texto)
    ) {
        return "Sí";
    }

    if (
        valor === false ||
        ["NO", "FALSE", "0"].includes(texto)
    ) {
        return "No";
    }

    /*
       Incluye:
       "-"
       null
       undefined
       vacío
       "Pendiente"
    */

    return "Pendiente de confirmar";
}


function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escaparAtributo(valor) {
    return escaparHTML(valor);
}

function setHTML(id, html) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.innerHTML = html;
}

function setText(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
}

function pintarTarjetaVacia(titulo, texto) {
    return `
        <section class="tarjetaVacia">
            <h3>${escaparHTML(titulo)}</h3>
            <p>${escaparHTML(texto)}</p>
        </section>
    `;
}

function pintarVacioInline(texto) {
    return `<div class="equipoPodio"><span>⏳ ${escaparHTML(texto)}</span></div>`;
}

function pintarErrorCarga() {
    setText("estadoCabecera", "🔴 Error de carga");
    setText("textoProgreso", "No se pudo leer el estado del torneo");
    setHTML(
        "podio",
        pintarVacioInline("Comprueba la conexión y vuelve a abrir la página")
    );
}
