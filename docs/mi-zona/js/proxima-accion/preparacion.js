import { fechaHora } from "../model.js?v=20261002-1450";

export function accionDePreparacion(preparacion = []) {
    for (const team of preparacion) {
        const equipo = team?.equipo || {};
        const contexto = team?.nombre || "Teams";

        if (
            team?.modo_designacion_capitanes === "eleccion_equipo" &&
            !equipo?.capitan_id &&
            !team?.mi_voto
        ) {
            return {
                tipo: "pendiente",
                icono: "★",
                contexto,
                titulo: "Vota al capitán de tu equipo",
                texto: "La elección de capitán está abierta y todavía no has emitido tu voto.",
                href: "#zona-preparacion",
                boton: "Votar capitán"
            };
        }

        if (
            team?.modo_inicio_teams === "capitanes" &&
            equipo?.es_capitan &&
            team?.plantillas_cerradas &&
            team?.reglas_revisadas
        ) {
            const estado =
                (team?.capitanes_listos || [])
                    .find(x => x?.equipo_id === equipo?.id);

            if (!estado?.listo) {
                return {
                    tipo: "pendiente",
                    icono: "⚔️",
                    contexto,
                    titulo: "Confirma que tu equipo está preparado",
                    texto: "Cuando los dos capitanes confirmen, se creará automáticamente el Partido 1.",
                    href: "#zona-preparacion",
                    boton: "Marcar preparado"
                };
            }
        }
    }

    return null;
}

export function informacionDePreparacion(preparacion = []) {
    const team = preparacion[0];
    if (!team) return null;

    if (
        team?.modo_inicio_teams === "programado" &&
        team?.inicio_programado_at
    ) {
        return {
            tipo: "cita",
            icono: "⏱️",
            contexto: team?.nombre || "Teams",
            titulo: "Inicio programado",
            texto: fechaHora(team.inicio_programado_at),
            nota: "No tienes ninguna acción pendiente.",
            href: "#zona-preparacion",
            boton: "Ver preparación"
        };
    }

    return {
        tipo: "espera",
        icono: "⚙️",
        contexto: team?.nombre || "Teams",
        titulo: "El Teams está en preparación",
        texto: "Ahora mismo no necesitas hacer nada.",
        href: "#zona-preparacion",
        boton: "Ver preparación"
    };
}
