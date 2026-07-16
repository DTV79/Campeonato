const JSON_URL_NAV =
    "https://dtv79.github.io/Campeonato/estado_torneo.json";

document.addEventListener(
    "DOMContentLoaded",
    iniciarNavegacionPretorneo
);

async function iniciarNavegacionPretorneo() {
    activarPaginaActual();

    try {
        const respuesta = await fetch(
            `${JSON_URL_NAV}?v=${Date.now()}`,
            { cache: "no-store" }
        );

        if (!respuesta.ok) return;

        const datos = await respuesta.json();
        const config = datos.configuracion || {};

        mostrarBotonContenido(
            "historia",
            esSiNav(config.mostrar_historia)
        );

        mostrarBotonContenido(
            "normativa",
            esSiNav(config.mostrar_normativa)
        );

        mostrarBotonContenido(
            "campeones",
            esSiNav(config.mostrar_campeones)
        );
    } catch (error) {
        console.error(
            "No se pudo cargar la navegación:",
            error
        );
    }
}

function mostrarBotonContenido(nombre, mostrar) {
    document
        .querySelector(
            `[data-contenido-web="${nombre}"]`
        )
        ?.classList.toggle("oculto", !mostrar);
}

function activarPaginaActual() {
    const archivo =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase() || "index.html";

    const mapa = {
        "historia.html": "historia",
        "normas.html": "normativa",
        "campeones.html": "campeones"
    };

    const actual = mapa[archivo];

    document
        .querySelectorAll(".bottomNav .navBtn")
        .forEach(boton => {
            boton.classList.toggle(
                "navActivo",
                boton.dataset.nav === actual
            );
        });
}

function esSiNav(valor) {
    return [
        "SI",
        "SÍ",
        "TRUE",
        "1"
    ].includes(
        String(valor || "")
            .trim()
            .toUpperCase()
    );
}
