import {
    esc,
    esCapitan,
    fechaHora,
    jugadorEsDeMiEquipo,
    puedePresentar
} from "./model.js?v=20261002-1450";

function parejaTexto(lista = []) {
    return lista.map(j => j?.nombre).filter(Boolean).join(" / ");
}

function partidoActual(team) {
    return [...(team?.partidos || [])]
        .sort((a,b) => Number(a?.numero || 0) - Number(b?.numero || 0))
        .find(p => !["finalizado","anulado"].includes(String(p?.estado || ""))) || null;
}

function miEquipoAcepto(propuesta, partido) {
    const ids = new Set((partido?.mi_alineacion || []).map(j => j?.id).filter(Boolean));
    return (propuesta?.respuestas || []).some(r => r?.disponible === true && ids.has(r?.id_jugador));
}

function accionDeTeams(teams = []) {
    for (const team of teams.filter(t => t?.estado === "en_curso")) {
        const partido = partidoActual(team);
        if (!partido) continue;

        const href = "#zona-partido-" + partido.id;
        const contexto = (team?.nombre || "Teams") + " · Partido " + Number(partido?.numero || 0);
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

        if (["revelado","concertando"].includes(estado) && partido?.yo_juego) {
            const propuestas = (partido?.propuestas || []).filter(p => p?.estado === "propuesta");
            const pendientes = propuestas.filter(p => !miEquipoAcepto(p, partido));

            if (pendientes.length) {
                return {
                    tipo: "pendiente",
                    icono: "🗓️",
                    contexto,
                    titulo: "Responde a una propuesta de fecha",
                    texto: fechaHora(pendientes[0]?.fecha_hora)
                        ? "Hay una fecha propuesta para " + fechaHora(pendientes[0].fecha_hora) + ". Basta una aceptación de tu equipo."
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
            const fecha = partido?.fecha_hora ? new Date(partido.fecha_hora) : null;
            if (fecha && !Number.isNaN(fecha.getTime()) && fecha.getTime() <= Date.now()) {
                return {
                    tipo: "pendiente",
                    icono: "🎾",
                    contexto,
                    titulo: "Introduce el resultado",
                    texto: "El partido ya estaba programado para " + fechaHora(partido.fecha_hora) + ".",
                    href,
                    boton: "Añadir resultado"
                };
            }
        }

        if (estado === "pendiente_confirmacion" && partido?.yo_juego) {
            const introducidoPorMiEquipo = jugadorEsDeMiEquipo(team, partido?.resultado_introducido_por);
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

function accionDePreparacion(preparacion = []) {
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
            const estado = (team?.capitanes_listos || []).find(x => x?.equipo_id === equipo?.id);
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

function accionDeConvocatoria(convocatorias = []) {
    for (const convocatoria of convocatorias) {
        const respuesta = String(convocatoria?.respuesta || "");
        const necesitaEquipo =
            convocatoria?.metodo_formacion === "predeterminado" &&
            convocatoria?.asignacion_predeterminada === "jugador" &&
            respuesta === "elegible" &&
            !convocatoria?.equipo_preasignado?.id;

        if (necesitaEquipo) {
            return {
                tipo: "pendiente",
                icono: "👕",
                contexto: convocatoria?.nombre || "Teams",
                titulo: "Elige tu equipo",
                texto: "Te has apuntado, pero todavía falta indicar con qué equipo participas.",
                href: "#zona-convocatorias",
                boton: "Elegir equipo"
            };
        }

        if (!respuesta || respuesta === "pendiente") {
            return {
                tipo: "pendiente",
                icono: "📝",
                contexto: convocatoria?.nombre || "Teams",
                titulo: "Responde a la convocatoria",
                texto: "Indica si te apuntas, no puedes jugar o todavía no lo sabes.",
                href: "#zona-convocatorias",
                boton: "Responder ahora"
            };
        }
    }

    return null;
}

function informacionDeTeams(teams = []) {
    for (const team of teams.filter(t => t?.estado === "en_curso")) {
        const partido = partidoActual(team);
        if (!partido) continue;

        const href = "#zona-partido-" + partido.id;
        const contexto = (team?.nombre || "Teams") + " · Partido " + Number(partido?.numero || 0);
        const estado = String(partido?.estado || "");

        if (estado === "programado" && partido?.yo_juego) {
            const propia = parejaTexto(partido?.mi_alineacion || []);
            const rival = parejaTexto(partido?.alineacion_rival || []);
            const duelo = propia && rival ? propia + " vs " + rival : "";
            return {
                tipo: "cita",
                icono: "🗓️",
                contexto,
                titulo: fechaHora(partido?.fecha_hora) || "Partido programado",
                texto: duelo || (partido?.pista ? "📍 " + partido.pista : "No tienes ninguna acción pendiente ahora."),
                meta: partido?.pista && duelo ? ["📍 " + partido.pista] : [],
                nota: "No tienes ninguna acción pendiente.",
                href,
                boton: "Ver partido"
            };
        }

        if (estado === "pendiente_confirmacion" && partido?.yo_juego) {
            const introducidoPorMiEquipo = jugadorEsDeMiEquipo(team, partido?.resultado_introducido_por);
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

        if (estado === "incidencia" || partido?.impugnado) {
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

        if (["pendiente_alineaciones","alineaciones_cerradas"].includes(estado)) {
            return {
                tipo: "espera",
                icono: "👥",
                contexto,
                titulo: esCapitan(team) ? "Esperando la siguiente presentación" : "Los capitanes están preparando las parejas",
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
                titulo: partido?.yo_juego ? "Tu equipo ya ha respondido" : "Se está concertando el partido",
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

    const ultimo = teams.find(t => t?.estado === "finalizado");
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

function informacionDePreparacion(preparacion = []) {
    const team = preparacion[0];
    if (!team) return null;

    if (team?.modo_inicio_teams === "programado" && team?.inicio_programado_at) {
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

export function htmlProximaAccion(datos = {}) {
    const teams = Array.isArray(datos?.teams) ? datos.teams : [];
    const convocatorias = Array.isArray(datos?.convocatorias) ? datos.convocatorias : [];
    const preparacion = Array.isArray(datos?.preparacion) ? datos.preparacion : [];

    const item =
        accionDeTeams(teams) ||
        accionDePreparacion(preparacion) ||
        accionDeConvocatoria(convocatorias) ||
        informacionDeTeams(teams) ||
        informacionDePreparacion(preparacion) ||
        {
            tipo: "ok",
            icono: "✓",
            contexto: "Mi Zona",
            titulo: "No tienes ninguna acción pendiente",
            texto: "Cuando tengas algo que confirmar, presentar o responder aparecerá aquí."
        };

    const meta = Array.isArray(item.meta) ? item.meta : [];

    return `
        <section class="proximaAccion proximaAccion--${esc(item.tipo || "ok")}">
            <div class="proximaAccionEtiqueta">
                <span>TU PRÓXIMA ACCIÓN</span>
                <b>${esc(item.tipo === "pendiente" ? "PENDIENTE" : "AL DÍA")}</b>
            </div>
            <div class="proximaAccionCuerpo">
                <span class="proximaAccionIcono" aria-hidden="true">${item.icono || "✓"}</span>
                <div class="proximaAccionTexto">
                    <small>${esc(item.contexto || "")}</small>
                    <h2>${esc(item.titulo || "")}</h2>
                    <p>${esc(item.texto || "")}</p>
                    ${meta.length ? `<div class="proximaAccionMeta">${meta.map(x => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
                    ${item.nota ? `<em>${esc(item.nota)}</em>` : ""}
                </div>
                ${item.href ? `<a class="proximaAccionBoton" href="${esc(item.href)}">${esc(item.boton || "Ver detalle")}</a>` : ""}
            </div>
        </section>
    `;
}
