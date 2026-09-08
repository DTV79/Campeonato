const JSON_URL_NAV =
    "https://dtv79.github.io/Campeonato/estado_torneo.json";
const SUPABASE_URL_NAV =
    "https://imznjbnpecvnoivywnoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY_NAV =
    "sb_publishable_E7p63Qia-9VAem_L1PBxnw_tcH-E7m2";

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

        let datos = await respuesta.json();
        datos = await cargarConfiguracionSupabaseNav(datos);
        const config = datos?.configuracion || {};

        if (esWebPreviaNav(config)) {
            configurarNavegacionPrevia(config);
        } else if (esWebFinalizadaNav(config)) {
            configurarNavegacionFinalizada();
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

async function cargarConfiguracionSupabaseNav(datosJSON) {
    const codigoRespaldo = String(
        datosJSON?.configuracion?.codigo_campeonato || ""
    ).trim();

    try {
        const respuestaActivo = await fetch(
            `${SUPABASE_URL_NAV}/rest/v1/rpc/web_campeonato_activo`,
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    apikey: SUPABASE_PUBLISHABLE_KEY_NAV,
                    "Content-Type": "application/json"
                },
                body: "{}"
            }
        );

        if (!respuestaActivo.ok) {
            throw new Error(`Supabase HTTP ${respuestaActivo.status}`);
        }

        const activo = await respuestaActivo.json();
        const codigo = String(
            activo?.codigo_campeonato || codigoRespaldo
        ).trim();

        if (!codigo) return datosJSON;

        const respuestaConfig = await fetch(
            `${SUPABASE_URL_NAV}/rest/v1/rpc/web_obtener_configuracion`,
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    apikey: SUPABASE_PUBLISHABLE_KEY_NAV,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ p_codigo: codigo })
            }
        );

        if (!respuestaConfig.ok) {
            throw new Error(`Supabase HTTP ${respuestaConfig.status}`);
        }

        const remoto = await respuestaConfig.json();

        return {
            ...datosJSON,
            configuracion: {
                ...(datosJSON?.configuracion || {}),
                ...(remoto && typeof remoto === "object" ? remoto : {}),
                codigo_campeonato: codigo
            }
        };
    } catch (error) {
        console.warn(
            "No se pudo cargar la configuración de navegación desde Supabase; se usa el respaldo.",
            error
        );
        return datosJSON;
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

function configurarNavegacionFinalizada() {
    const botones = obtenerBotonesNav();

    configurarEnlaceNav(botones[0], "🏠", "Inicio", "index.html", true, "inicio");
    configurarEnlaceNav(botones[1], "🎾", "Partidos", "index.html?pantalla=partidos");
    configurarEnlaceNav(botones[2], "📊", "Estadísticas", "estadisticas.html", true, "estadisticas");
    configurarEnlaceNav(botones[3], "🏆", "Ranking", "index.html?pantalla=ranking");
    configurarEnlaceNav(botones[4], "☰", "Más", "index.html?pantalla=mas", true, "mas");

    activarPaginaActual();
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
        config.estado ||
        config.estado_torneo ||
        ""
    );

    return (
        estado === "PRETORNEO" ||
        estado.includes("INSCRIP")
    );
}

function esWebFinalizadaNav(config) {
    return normalizarNav(
        config.estado || config.estado_torneo || ""
    ).includes("FINALIZ");
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
