import {
    accionDeTeams,
    informacionDeTeams
} from "./proxima-accion/teams.js?v=20261004-1035";

import {
    accionDePreparacion,
    informacionDePreparacion
} from "./proxima-accion/preparacion.js?v=20261004-1035";

import {
    accionDeConvocatoria
} from "./proxima-accion/convocatorias.js?v=20261004-1035";

import {
    renderProximaAccion
} from "./proxima-accion/render.js?v=20261004-1035";

export function htmlProximaAccion(datos = {}) {
    const teams =
        Array.isArray(datos?.teams)
            ? datos.teams
            : [];
    const convocatorias =
        Array.isArray(datos?.convocatorias)
            ? datos.convocatorias
            : [];
    const preparacion =
        Array.isArray(datos?.preparacion)
            ? datos.preparacion
            : [];

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

    return renderProximaAccion(item);
}
