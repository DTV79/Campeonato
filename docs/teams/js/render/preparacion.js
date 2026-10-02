import {
    alineacionPorLado,
    claseEstadoPartido,
    colorSeguro,
    equipoPorLado,
    escaparHtml,
    etiquetaEstadoGeneral,
    etiquetaEstadoPartido,
    formatearFechaHora,
    formatearFechaSolo,
    ganadorTeams,
    resumenFinalizacion,
    tipoResultado,
    victoriasEquipo
} from "../model.js?v=20261002-1545";

const caracteristicas = document.getElementById("teamsCaracteristicas");
const convocatoria = document.getElementById("teamsConvocatoria");

export function renderPreparacion(detalle) {
    renderCaracteristicas(detalle);
    renderConvocatoriaPublica(detalle);
}

function renderCaracteristicas(detalle) {
    if (!caracteristicas) return;

    const modalidad = {
        numero_fijo: `${Number(detalle?.numero_partidos || 0)} partidos`,
        mejor_de: `Mejor de ${Number(detalle?.numero_partidos || 0)} partidos`,
        mejor_de_jugar_todos: `Mejor de ${Number(detalle?.numero_partidos || 0)} · se juegan todos`,
        numero_fijo_desempate: `${Number(detalle?.numero_partidos || 0)} partidos + desempate`
    }[detalle?.modalidad] || `${Number(detalle?.numero_partidos || 0)} partidos`;

    const formacion = {
        manual: "Reparto manual después de la convocatoria",
        draft: "Draft de capitanes",
        sorteo: "Sorteo",
        predeterminado:
            detalle?.asignacion_predeterminada === "jugador"
                ? "Equipos predeterminados · el jugador elige su equipo"
                : "Equipos predeterminados · asignación previa del administrador"
    }[detalle?.metodo_formacion] || "Definida por la organización";

    const repeticionJugador = detalle?.repetir_jugadores === "maximo"
        ? `Máximo ${Number(detalle?.max_partidos_jugador || 0)} partidos por jugador`
        : detalle?.repetir_jugadores === "no"
            ? "Sin repetir jugadores"
            : "Se pueden repetir jugadores";

    const parejas = detalle?.repetir_pareja
        ? "Se puede repetir pareja"
        : "No se puede repetir pareja";

    const rotacion = detalle?.todos_antes_repetir
        ? "Todos deben jugar antes de repetir jugador"
        : "No es obligatorio rotar a todos antes de repetir";

    const sistemaParejas = {
        secreto: "Parejas secretas",
        alterno: "Presentación alterna de parejas",
        ganador_primero: "El ganador anterior presenta primero"
    }[detalle?.sistema_eleccion_parejas] || "Sistema de parejas definido por la organización";

    const segundaVe = detalle?.sistema_eleccion_parejas !== "secreto"
        ? (detalle?.segundo_ve_pareja
            ? "El segundo equipo ve la pareja rival antes de presentar"
            : "El segundo equipo no ve la pareja rival")
        : "";

    const computos = [
        detalle?.computa_estadisticas ? "estadísticas" : "",
        detalle?.computa_ranking ? "ranking" : "",
        detalle?.computa_isp ? "ISP" : ""
    ].filter(Boolean);

    const capitanes = {
        administrador: "Los elige el administrador",
        predefinidos: "Definidos de antemano",
        eleccion_equipo: "Los elige cada equipo",
        sorteo: "Sorteo entre los jugadores"
    }[detalle?.modo_designacion_capitanes] || "Los elige el administrador";

    const inicioTeams = {
        administrador: "Lo inicia el administrador",
        capitanes: "Se inicia cuando ambos capitanes estén preparados",
        programado: detalle?.inicio_programado_at
            ? `Programado · ${new Date(detalle.inicio_programado_at).toLocaleString("es-ES")}`
            : "Inicio programado"
    }[detalle?.modo_inicio_teams] || "Lo inicia el administrador";

    const items = [
        ["Formato", modalidad],
        ["Formación", formacion],
        ["Capitanes", capitanes],
        ["Inicio", inicioTeams],
        ["Plantillas", `${Number(detalle?.jugadores_por_equipo || 0)} jugadores por equipo${Number(detalle?.reservas_por_equipo || 0) ? ` + ${Number(detalle.reservas_por_equipo)} reserva(s)` : ""}`],
        ["Participación", repeticionJugador],
        ["Parejas", parejas],
        ["Rotación", rotacion],
        ["Elección de parejas", sistemaParejas],
        segundaVe ? ["Presentación", segundaVe] : null,
        ["Plazo para presentar", `${Number(detalle?.plazo_presentar_horas || 0)} horas`],
        ["Acordar partido", `${Number(detalle?.plazo_acordar_dias || 0)} días`],
        ["Jugar partido", `${Number(detalle?.plazo_jugar_dias || 0)} días desde el anterior/acuerdo`],
        ["Computa para", computos.length ? computos.join(" · ") : "No computa en históricos"]
    ].filter(Boolean);

    caracteristicas.innerHTML = items.map(([titulo, valor]) => `
        <div class="caracteristicaTeam">
            <small>${escaparHtml(titulo)}</small>
            <strong>${escaparHtml(valor)}</strong>
        </div>
    `).join("");
}

function renderConvocatoriaPublica(detalle) {
    if (!convocatoria) return;

    const personas = Array.isArray(detalle?.convocatoria)
        ? detalle.convocatoria
        : [];

    const predeterminado =
        detalle?.metodo_formacion === "predeterminado";

    const equipos = [...(detalle?.equipos || [])]
        .sort((a,b) => String(a?.lado || "").localeCompare(String(b?.lado || "")));

    const resumenEquipos = predeterminado
        ? `
            <div class="convocatoriaEquiposPublicos">
                ${equipos.map(equipo => {
                    const apuntados = personas.filter(
                        p => p?.estado === "elegible" && p?.equipo_id === equipo.id
                    ).length;

                    return `
                        <span>
                            <i style="background:${escaparHtml(colorSeguro(equipo?.color,equipo?.lado || "A"))}"></i>
                            <b>${escaparHtml(equipo?.nombre || ("Equipo " + (equipo?.lado || "")))}</b>
                            <strong>${apuntados}</strong>
                        </span>
                    `;
                }).join("")}
            </div>
          `
        : "";

    const grupos = [
        {
            estado: "elegible",
            titulo: "Me apunto",
            icono: "✅",
            clase: "convocatoriaSi"
        },
        {
            estado: "pendiente",
            titulo: "En duda",
            icono: "🤔",
            clase: "convocatoriaDuda"
        },
        {
            estado: "no_disponible",
            titulo: "No puedo",
            icono: "❌",
            clase: "convocatoriaNo"
        }
    ];

    convocatoria.innerHTML =
        resumenEquipos +
        grupos.map(grupo => {
            const lista = personas.filter(p => p?.estado === grupo.estado);

            return `
                <article class="convocatoriaGrupo ${grupo.clase}">
                    <div class="convocatoriaGrupoTitulo">
                        <span>${grupo.icono}</span>
                        <div>
                            <small>${escaparHtml(grupo.titulo)}</small>
                            <strong>${lista.length}</strong>
                        </div>
                    </div>

                    <div class="convocatoriaNombres">
                        ${lista.length
                            ? lista.map(p => `
                                <span class="convocatoriaNombreJugador">
                                    <b>${escaparHtml(p?.nombre || "Jugador")}</b>
                                    ${predeterminado && p?.equipo_nombre
                                        ? `<small>${escaparHtml(p.equipo_nombre)}</small>`
                                        : ""}
                                </span>
                              `).join("")
                            : '<em>Nadie todavía</em>'}
                    </div>
                </article>
            `;
        }).join("");
}