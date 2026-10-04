import {
    esCapitan,
    fechaHora,
    jugadorEsDeMiEquipo,
    puedePresentar
} from "../model.js?v=20261002-1450";

import {
    miEquipoAcepto,
    parejaTexto,
    partidoActual
} from "./utils.js?v=20261004-1035";

export function accionDeTeams(teams = []) {
    for (const team of teams.filter(t => t?.estado === "en_curso")) {
        const partido = partidoActual(team);
        if (!partido) continue;

        const href = "#zona-partido-" + partido.id;
        const contexto =
            (team?.nombre || "Teams") +
            " · Partido " +
            Number(partido?.numero || 0);
        const estado = String(partido?.estado || "");

        if (
            esCapitan(team) &&
            ["pendiente_alineaciones","alineaciones_cerradas"].includes(estado) &&
            puedePresentar(team, partido) &&
            (partido?.mi_alineacion || []).length < 2
        ) {
            return {
                tipo: "pendiente",
                icono: "👥",
                contexto,
                titulo: "Presenta la pareja de tu equipo",
                texto: "Te corresponde elegir los dos jugadores que disputarán este partido.",
                href,
                boton: "Presentar pareja"
            };
        }

        if (
            ["revelado","concertando"].includes(estado) &&
            partido?.yo_juego
        ) {
            const propuestas =
                (partido?.propuestas || [])
                    .filter(p => p?.estado === "propuesta");
            const miEquipoYaAcepto =
                propuestas.some(p => miEquipoAcepto(p, partido));
            const pendientes =
                propuestas.filter(p => !miEquipoAcepto(p, partido));

            if (pendientes.length && !miEquipoYaAcepto) {
                return {
                    tipo: "pendiente",
                    icono: "🗓️",
                    contexto,
                    titulo: "Responde a una propuesta de fecha",
                    texto: fechaHora(pendientes[0]?.fecha_hora)
                        ? "Hay una fecha propuesta para " +
                          fechaHora(pendientes[0].fecha_hora) +
                          ". Basta una aceptación de tu equipo."
                        : "Hay una propuesta pendiente de respuesta por parte de tu equipo.",
                    href,
                    boton: "Revisar fecha"
                };
            }

            if (!propuestas.length) {
                return {
                    tipo: "pendiente",
                    icono: "🗓️",
                    contexto,
                    titulo: "Propón una fecha para el partido",
                    texto: "Los cuatro jugadores del partido pueden proponer una fecha y hora.",
                    href,
                    boton: "Proponer fecha"
                };
            }
        }

        if (estado === "pendiente_resultado" && partido?.yo_juego) {
            return {
                tipo: "pendiente",
                icono: "🎾",
                contexto,
                titulo: "Introduce el resultado",
                texto: "El partido está pendiente de que uno de los cuatro jugadores registre el marcador.",
                href,
                boton: "Añadir resultado"
            };
        }

        if (estado === "programado" && partido?.yo_juego) {
            const fecha =
                partido?.fecha_hora
                    ? new Date(partido.fecha_hora)
                    : null;

            if (
                fecha &&
                !Number.isNaN(fecha.getTime()) &&
                fecha.getTime() <= Date.now()
            ) {
                return {
                    tipo: "pendiente",
                    icono: "🎾",
                    contexto,
                    titulo: "Introduce el resultado",
                    texto:
                        "El partido ya estaba programado para " +
                        fechaHora(partido.fecha_hora) +
                        ".",
                    href,
                    boton: "Añadir resultado"
                };
            }
        }

        if (
            estado === "pendiente_confirmacion" &&
            partido?.yo_juego
        ) {
            const introducidoPorMiEquipo =
                jugadorEsDeMiEquipo(
                    team,
                    partido?.resultado_introducido_por
                );

            if (!introducidoPorMiEquipo) {
                return {
                    tipo: "pendiente",
                    icono: "✅",
                    contexto,
                    titulo: "Confirma o impugna el resultado",
                    texto: "El equipo rival ha enviado el marcador. Revísalo antes de confirmarlo.",
                    href,
                    boton: "Revisar resultado"
                };
            }
        }
    }

    return null;
}

export function informacionDeTeams(teams = []) {
    for (const team of teams.filter(t => t?.estado === "en_curso")) {
        const partido = partidoActual(team);
        if (!partido) continue;

        const href = "#zona-partido-" + partido.id;
        const contexto =
            (team?.nombre || "Teams") +
            " · Partido " +
            Number(partido?.numero || 0);
        const estado = String(partido?.estado || "");

        if (estado === "programado" && partido?.yo_juego) {
            const propia =
                parejaTexto(partido?.mi_alineacion || []);
            const rival =
                parejaTexto(partido?.alineacion_rival || []);
            const duelo =
                propia && rival
                    ? propia + " vs " + rival
                    : "";

            return {
                tipo: "cita",
                icono: "🗓️",
                contexto,
                titulo:
                    fechaHora(partido?.fecha_hora) ||
                    "Partido programado",
                texto:
                    duelo ||
                    (
                        partido?.pista
                            ? "📍 " + partido.pista
                            : "No tienes ninguna acción pendiente ahora."
                    ),
                meta:
                    partido?.pista && duelo
                        ? ["📍 " + partido.pista]
                        : [],
                nota: "No tienes ninguna acción pendiente.",
                href,
                boton: "Ver partido"
            };
        }

        if (
            estado === "pendiente_confirmacion" &&
            partido?.yo_juego
        ) {
            const introducidoPorMiEquipo =
                jugadorEsDeMiEquipo(
                    team,
                    partido?.resultado_introducido_por
                );

            if (introducidoPorMiEquipo) {
                return {
                    tipo: "espera",
                    icono: "⏳",
                    contexto,
                    titulo: "Resultado enviado",
                    texto: "Está pendiente de confirmación por el equipo rival.",
                    nota: "No tienes ninguna acción pendiente.",
                    href,
                    boton: "Ver resultado"
                };
            }
        }

        if (
            estado === "incidencia" ||
            partido?.impugnado
        ) {
            return {
                tipo: "espera",
                icono: "⚠️",
                contexto,
                titulo: "Incidencia pendiente de Administración",
                texto: "El partido está detenido hasta que se resuelva la incidencia.",
                nota: "No tienes ninguna acción pendiente.",
                href,
                boton: "Ver partido"
            };
        }

        if (
            ["pendiente_alineaciones","alineaciones_cerradas"]
                .includes(estado)
        ) {
            return {
                tipo: "espera",
                icono: "👥",
                contexto,
                titulo: esCapitan(team)
                    ? "Esperando la siguiente presentación"
                    : "Los capitanes están preparando las parejas",
                texto: "El partido avanzará cuando corresponda presentar o publicar las dos parejas.",
                nota: "No tienes ninguna acción pendiente.",
                href,
                boton: "Ver partido"
            };
        }

        if (["revelado","concertando"].includes(estado)) {
            return {
                tipo: "espera",
                icono: "🗓️",
                contexto,
                titulo: partido?.yo_juego
                    ? "Tu equipo ya ha respondido"
                    : "Se está concertando el partido",
                texto: partido?.yo_juego
                    ? "Falta que el otro equipo complete el acuerdo de fecha."
                    : "Los jugadores del partido están acordando la fecha.",
                nota: "No tienes ninguna acción pendiente.",
                href,
                boton: "Ver partido"
            };
        }

        return {
            tipo: "ok",
            icono: "✓",
            contexto,
            titulo: "No tienes ninguna acción pendiente",
            texto: "El partido actual no requiere ninguna intervención tuya ahora.",
            href,
            boton: "Ver partido"
        };
    }

    const ultimo =
        teams.find(t => t?.estado === "finalizado");

    if (ultimo) {
        return {
            tipo: "ok",
            icono: "🏁",
            contexto: ultimo?.nombre || "Teams",
            titulo: "No tienes ninguna acción pendiente",
            texto: "Esta edición de Teams ha finalizado."
        };
    }

    return null;
}
