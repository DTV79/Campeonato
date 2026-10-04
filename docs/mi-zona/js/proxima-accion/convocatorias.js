export function accionDeConvocatoria(convocatorias = []) {
    for (const convocatoria of convocatorias) {
        const respuesta =
            String(convocatoria?.respuesta || "");

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

        if (
            !respuesta ||
            (
                respuesta === "pendiente" &&
                convocatoria?.origen !== "web"
            )
        ) {
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
