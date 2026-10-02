const COLORES_FALLBACK = {
    A: "#38bdf8",
    B: "#f97316"
};

export function colorSeguro(valor, lado = "A") {
    const color = String(valor || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(color) || /^#[0-9a-f]{3}$/i.test(color)) {
        return color;
    }
    return COLORES_FALLBACK[lado] || COLORES_FALLBACK.A;
}

export function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function equipoPorLado(detalle, lado) {
    return (detalle?.equipos || []).find(
        equipo => String(equipo?.lado || "").toUpperCase() === lado
    ) || null;
}

export function victoriasEquipo(detalle, equipoId) {
    return Number(detalle?.victorias?.[equipoId] || 0);
}

export function alineacionPorLado(partido, lado) {
    return (partido?.alineaciones || [])
        .filter(item => String(item?.lado || "").toUpperCase() === lado)
        .sort((a, b) => Number(a?.orden || 0) - Number(b?.orden || 0));
}

export function etiquetaEstadoGeneral(estado) {
    const mapa = {
        preparacion: "Convocatoria abierta",
        convocatoria: "Convocatoria abierta",
        draft: "Formando equipos",
        formacion: "Formando equipos",
        en_curso: "En juego",
        finalizado: "Finalizado"
    };
    return mapa[String(estado || "")] || "Teams";
}

export function etiquetaEstadoPartido(partido) {
    if (partido?.impugnado) return "Impugnado";

    const mapa = {
        pendiente_alineaciones: "Pendiente de parejas",
        alineaciones_listas: "Parejas preparadas",
        pendiente_programacion: "Pendiente de fecha",
        revelado: "Parejas publicadas",
        concertando: "Concertando fecha",
        programado: "Programado",
        pendiente_resultado: "Pendiente de resultado",
        pendiente_confirmacion: "Resultado provisional",
        incidencia: "Incidencia",
        suspendido: "Suspendido",
        finalizado: "Finalizado",
        anulado: "Anulado"
    };

    return mapa[String(partido?.estado || "")] || "Pendiente";
}

export function claseEstadoPartido(partido) {
    if (partido?.impugnado) return "estadoImpugnado";
    if (partido?.estado === "finalizado") return "estadoFinalizado";
    if (partido?.estado === "pendiente_confirmacion") return "estadoProvisional";
    if (partido?.estado === "programado") return "estadoProgramado";
    if (["incidencia", "suspendido"].includes(partido?.estado)) return "estadoIncidencia";
    return "estadoPendiente";
}

export function tipoResultado(partido) {
    const tieneSets = Array.isArray(partido?.sets) && partido.sets.length > 0;

    if (partido?.impugnado && tieneSets) {
        return "impugnado";
    }

    if (partido?.estado === "pendiente_confirmacion" && tieneSets) {
        return "provisional";
    }

    if (partido?.estado === "finalizado" && tieneSets) {
        return "definitivo";
    }

    if (tieneSets) {
        return "registrado";
    }

    return "sin_resultado";
}

export function ganadorTeams(detalle) {
    if (detalle?.estado !== "finalizado") return null;

    const equipoA = equipoPorLado(detalle, "A");
    const equipoB = equipoPorLado(detalle, "B");

    if (!equipoA || !equipoB) return null;

    const a = victoriasEquipo(detalle, equipoA.id);
    const b = victoriasEquipo(detalle, equipoB.id);

    if (a === b) return { empate: true };
    return a > b ? equipoA : equipoB;
}

export function formatearFechaSolo(valor) {
    const texto = String(valor || "").trim();
    if (!texto) return "";

    const [anio, mes, dia] = texto.split("-").map(Number);
    if (!anio || !mes || !dia) return texto;

    return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(anio, mes - 1, dia));
}

export function formatearFechaHora(valor) {
    if (!valor) return "";

    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";

    return new Intl.DateTimeFormat("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }).format(fecha);
}

export function resumenFinalizacion(valor) {
    const mapa = {
        normal: "",
        wo: "W.O.",
        retirada: "Retirada",
        suspendido: "Suspendido",
        no_finalizado: "No finalizado",
        anulado: "Anulado"
    };
    return mapa[String(valor || "")] ?? "";
}
