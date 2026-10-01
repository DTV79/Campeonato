import { RPC, SUPABASE_KEY, SUPABASE_URL } from "./config.js";

async function rpc(nombre, body = {}) {
    const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nombre}`, {
        method: "POST",
        headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!respuesta.ok) {
        let detalle = {};
        try {
            detalle = await respuesta.json();
        } catch {
            // La respuesta de error puede no ser JSON.
        }
        throw new Error(detalle?.message || "No se pudo completar la operación.");
    }

    if (respuesta.status === 204) return null;

    const texto = await respuesta.text();
    return texto ? JSON.parse(texto) : null;
}

export const api = {
    jugadores: () => rpc(RPC.jugadores),
    login: (jugador, pin) => rpc(RPC.login, {
        p_id_jugador: jugador,
        p_pin: pin
    }),
    logout: token => rpc(RPC.logout, { p_token: token }),
    zona: token => rpc(RPC.zona, { p_token: token }),
    disponibilidad: (token, teamId, jugadorId, disponible) =>
        rpc(RPC.disponibilidad, {
            p_token: token,
            p_team_id: teamId,
            p_id_jugador: jugadorId,
            p_disponible: disponible
        }),
    guardarAlineacion: (token, partidoId, jugador1, jugador2) =>
        rpc(RPC.alineacion, {
            p_token: token,
            p_partido_id: partidoId,
            p_jugador_1: jugador1,
            p_jugador_2: jugador2
        }),
    proponerHorario: (token, partidoId, fechaHora, pista) =>
        rpc(RPC.proponerHorario, {
            p_token: token,
            p_partido_id: partidoId,
            p_fecha_hora: fechaHora,
            p_pista: pista || null
        }),
    responderHorario: (token, propuestaId, disponible) =>
        rpc(RPC.responderHorario, {
            p_token: token,
            p_propuesta_id: propuestaId,
            p_disponible: disponible
        }),
    reprogramarHorario: (token, partidoId, fechaHora, pista) =>
        rpc(RPC.reprogramarHorario, {
            p_token: token,
            p_partido_id: partidoId,
            p_fecha_hora: fechaHora,
            p_pista: pista || null
        }),
    quitarHorario: (token, partidoId) =>
        rpc(RPC.quitarHorario, {
            p_token: token,
            p_partido_id: partidoId
        }),
    actualizarPista: (token, partidoId, pista) =>
        rpc(RPC.actualizarPista, {
            p_token: token,
            p_partido_id: partidoId,
            p_pista: pista || null
        }),
    guardarResultado: (token, datos) =>
        rpc(RPC.guardarResultado, {
            p_token: token,
            p_partido_id: datos.partidoId,
            p_sets: datos.sets,
            p_finalizacion: datos.finalizacion,
            p_ganador: datos.ganador || null,
            p_duracion: datos.duracion || null,
            p_pista: datos.pista || null,
            p_observaciones: datos.observaciones || null
        }),
    confirmarResultado: (token, partidoId) =>
        rpc(RPC.confirmarResultado, {
            p_token: token,
            p_partido_id: partidoId
        }),
    impugnarResultado: (token, partidoId, motivo) =>
        rpc(RPC.impugnarResultado, {
            p_token: token,
            p_partido_id: partidoId,
            p_motivo: motivo
        })
};
