export function esc(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}

export function colorSeguro(color, lado = "A") {
    const valor = String(color || "").trim();
    if (/^#[0-9a-f]{3,8}$/i.test(valor)) return valor;
    return lado === "B" ? "#4ade80" : "#38bdf8";
}

export function fechaHora(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    return fecha.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

export function fechaInput(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return "";
    const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

export function fechaIsoDesdeInput(valor) {
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

export function estadoPartido(estado) {
    const etiquetas = {
        pendiente_alineaciones: "Pendiente de parejas",
        alineaciones_cerradas: "Parejas presentadas",
        revelado: "Concertar partido",
        concertando: "Concertando fecha",
        programado: "Programado",
        pendiente_resultado: "Pendiente de resultado",
        pendiente_confirmacion: "Pendiente de confirmación",
        finalizado: "Finalizado",
        incidencia: "Incidencia",
        suspendido: "Suspendido",
        anulado: "Anulado"
    };
    return etiquetas[estado] || String(estado || "Pendiente").replaceAll("_", " ");
}

export function claseEstado(estado) {
    if (estado === "finalizado") return "estadoOk";
    if (estado === "incidencia" || estado === "suspendido") return "estadoAviso";
    if (estado === "pendiente_confirmacion") return "estadoPendiente";
    if (estado === "programado") return "estadoProgramado";
    return "estadoNeutro";
}

export function parejaTexto(alineacion = []) {
    const nombres = alineacion.map(j => j?.nombre).filter(Boolean);
    return nombres.length ? nombres.join(" / ") : "Pendiente";
}

export function equiposPorLado(team) {
    const propio = team?.equipo || {};
    const rival = team?.rival || {};
    return {
        A: propio.lado === "A" ? propio : rival,
        B: propio.lado === "B" ? propio : rival
    };
}

export function alineacionPorLado(team, partido, lado) {
    if (team?.equipo?.lado === lado) return partido?.mi_alineacion || [];
    if (team?.rival?.lado === lado) return partido?.alineacion_rival || [];
    return [];
}

export function jugadorEsDeMiEquipo(team, jugadorId) {
    return (team?.companeros || []).some(j => j.id === jugadorId);
}

export function respuestaJugador(propuesta, jugadorId) {
    return (propuesta?.respuestas || []).find(r => r.id_jugador === jugadorId);
}

export function resultadoVisible(partido) {
    return ["pendiente_confirmacion", "finalizado", "incidencia"].includes(partido?.estado)
        && Array.isArray(partido?.sets)
        && partido.sets.length > 0;
}

export function esCapitan(team) {
    return Boolean(team?.equipo?.es_capitan);
}

export function puedePresentar(team, partido) {
    if (!esCapitan(team)) return false;
    if (!["pendiente_alineaciones", "alineaciones_cerradas"].includes(partido?.estado)) return false;

    if (team?.sistema_eleccion_parejas === "secreto") return true;

    const primero = partido?.presenta_primero_equipo_id;
    if (!primero || primero === team?.equipo?.id) return true;

    return Array.isArray(partido?.alineacion_rival) && partido.alineacion_rival.length === 2;
}

export function puedeGestionarHorario(partido) {
    return Boolean(partido?.yo_juego)
        && ["revelado", "concertando", "programado"].includes(partido?.estado);
}

export function puedeIntroducirResultado(partido) {
    return Boolean(partido?.yo_juego)
        && ["programado", "pendiente_resultado"].includes(partido?.estado);
}
