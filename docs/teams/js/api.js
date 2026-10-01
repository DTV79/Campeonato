import { TEAMS_CONFIG } from "./config.js?v=20261001-1945";

async function rpc(nombre, payload = {}) {
    const controlador = new AbortController();
    const timeout = window.setTimeout(
        () => controlador.abort(),
        TEAMS_CONFIG.timeoutMs
    );

    try {
        const respuesta = await fetch(
            `${TEAMS_CONFIG.supabaseUrl}/rest/v1/rpc/${nombre}`,
            {
                method: "POST",
                cache: "no-store",
                signal: controlador.signal,
                headers: {
                    apikey: TEAMS_CONFIG.publishableKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        if (!respuesta.ok) {
            const detalle = await respuesta.text().catch(() => "");
            throw new Error(
                `Supabase HTTP ${respuesta.status}${detalle ? `: ${detalle}` : ""}`
            );
        }

        return await respuesta.json();
    } catch (error) {
        if (error?.name === "AbortError") {
            throw new Error("La carga de Teams ha tardado demasiado.");
        }
        throw error;
    } finally {
        window.clearTimeout(timeout);
    }
}

export async function cargarEdicionesTeams() {
    const datos = await rpc(TEAMS_CONFIG.rpcEdiciones);
    return Array.isArray(datos) ? datos : [];
}

export async function cargarDetalleTeams(teamId = null) {
    const datos = await rpc(
        TEAMS_CONFIG.rpcDetalle,
        { p_team_id: teamId || null }
    );

    if (!datos || typeof datos !== "object") {
        return null;
    }

    return datos;
}


export async function cargarConvocatoriaTeams(teamId = null) {
    const datos = await rpc(
        TEAMS_CONFIG.rpcConvocatoria,
        { p_team_id: teamId || null }
    );

    if (!datos || typeof datos !== "object") {
        return {
            team_id: null,
            metodo_formacion: null,
            asignacion_predeterminada: null,
            personas: []
        };
    }

    return {
        ...datos,
        personas: Array.isArray(datos.personas) ? datos.personas : []
    };
}
