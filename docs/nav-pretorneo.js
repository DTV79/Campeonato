const JSON_URL_NAV =
    "https://dtv79.github.io/Campeonato/estado_torneo.json";

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        iniciarNavegacionGeneral
    );
} else {
    iniciarNavegacionGeneral();
}


async function iniciarNavegacionGeneral() {
    try {
        const respuesta = await fetch(
            `${JSON_URL_NAV}?v=${Date.now()}`,
            {
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                `No se pudo cargar el JSON (${respuesta.status})`
            );
        }

        const datos = await respuesta.json();
        const config = datos?.configuracion || {};

        if (esWebPreviaNav(config)) {
            configurarNavegacionPrevia(config);
        } else {
            configurarNavegacionEnJuego(config);
        }

    } catch (error) {
        console.error(
            "No se pudo configurar la navegación:",
            error
        );

        /*
           Como respaldo mostramos la navegación
           de competición.
        */
        configurarNavegacionEnJuego({});
    }
}


function configurarNavegacionEnJuego(config) {
    const botones = obtenerBotonesNav();

    const modoGrupos =
        normalizarNav(config.tipo_campeonato) ===
        "GRUPOS";

    configurarEnlaceNav(
        botones[0],
        "🏠",
        "Inicio",
        "index.html"
    );

    configurarEnlaceNav(
        botones[1],
        "📊",
        modoGrupos
            ? "Grupos"
            : "Clasificación",
        "index.html?pantalla=competicion"
    );

    configurarEnlaceNav(
        botones[2],
        "🎾",
        "Partidos",
        "index.html?pantalla=partidos"
    );

    configurarEnlaceNav(
        botones[3],
        "👥",
        "Equipos",
        "index.html?pantalla=equipos"
    );

    configurarEnlaceNav(
        botones[4],
        "☰",
        "Más",
        "index.html?pantalla=mas"
    );

    /*
       Historia, Normativa, Campeones, etc.
       pertenecen al apartado Más.
    */
    botones.forEach(
        boton =>
            boton.classList.remove("navActivo")
    );

    botones[4]?.classList.add("navActivo");
}


function configurarNavegacionPrevia(config) {
    const botones = obtenerBotonesNav();

    configurarEnlaceNav(
        botones[0],
        "🏠",
        "Inicio",
        "index.html",
        true,
        "inicio"
    );

    configurarEnlaceNav(
        botones[1],
        "📖",
        "Historia",
        "historia.html",
        esSiNav(config.mostrar_historia),
        "historia"
    );

    configurarEnlaceNav(
        botones[2],
        "📜",
        "Normas",
        "normas.html",
        esSiNav(config.mostrar_normativa),
        "normativa"
    );

    configurarEnlaceNav(
        botones[3],
        "🏆",
        "Campeones",
        "campeones.html",
        esSiNav(config.mostrar_campeones),
        "campeones"
    );

    configurarEnlaceNav(
        botones[4],
        "☰",
        "Más",
        "index.html?pantalla=mas",
        true,
        "mas"
    );

    activarPaginaActual();
}


function configurarEnlaceNav(
    boton,
    icono,
    texto,
    href,
    visible = true,
    nombreNav = ""
) {
    if (!boton) return;

    boton.classList.toggle(
        "oculto",
        !visible
    );

    boton.classList.remove(
        "navActivo"
    );

    const elementoIcono =
        boton.querySelector("span");

    const elementoTexto =
        boton.querySelector("small");

    if (elementoIcono) {
        elementoIcono.textContent = icono;
    }

    if (elementoTexto) {
        elementoTexto.textContent = texto;
    }

    boton.href = href;

    if (nombreNav) {
        boton.dataset.nav = nombreNav;
    } else {
        delete boton.dataset.nav;
    }
}


function obtenerBotonesNav() {
    return [
        ...document.querySelectorAll(
            ".bottomNav .navBtn"
        )
    ];
}


function activarPaginaActual() {
    const archivo =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase() ||
        "index.html";

    const mapa = {
        "index.html": "inicio",
        "historia.html": "historia",
        "normas.html": "normativa",
        "campeones.html": "campeones",
        "fotos.html": "mas",
        "ranking.html": "mas",
        "estadisticas.html": "mas"
    };

    const actual =
        mapa[archivo] || "";

    document
        .querySelectorAll(
            ".bottomNav .navBtn"
        )
        .forEach(boton => {
            boton.classList.toggle(
                "navActivo",
                boton.dataset.nav === actual
            );
        });
}


function esWebPreviaNav(config) {
    const estado = normalizarNav(
        config.estado_torneo ||
        config.estado ||
        ""
    );

    return (
        estado === "PRETORNEO" ||
        estado.includes("INSCRIP")
    );
}


function normalizarNav(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .toUpperCase();
}


function esSiNav(valor) {
    return [
        "SI",
        "TRUE",
        "1"
    ].includes(
        normalizarNav(valor)
    );
}
