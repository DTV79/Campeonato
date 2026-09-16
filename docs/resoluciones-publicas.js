/* Adaptación pública de W.O. y retiradas.
   Se carga justo después de app.js para conservar compatibilidad con el JSON histórico. */
(function activarResolucionesPublicas() {
    if (typeof normalizarListaSupabase === "function") {
        const normalizarListaBase = normalizarListaSupabase;
        normalizarListaSupabase = function (lista, codigoFase) {
            return normalizarListaBase(lista, codigoFase).map(partido => {
                if (!partido || !Array.isArray(partido.resultado)) return partido;

                const resultadoDetallado = partido.resultado.filter(
                    set => set && typeof set === "object" && !Array.isArray(set)
                );

                if (!resultadoDetallado.length) return partido;

                return {
                    ...partido,
                    resultado_detalle: resultadoDetallado,
                    resultado: partido.resultado.map(set =>
                        set && typeof set === "object"
                            ? String(set.marcador || "")
                            : set
                    )
                };
            });
        };
    }

    function resolucionPartido(partido) {
        return String(partido?.tipo_resolucion || "NORMAL")
            .trim()
            .toUpperCase();
    }

    function textoResolucion(partido) {
        const tipo = resolucionPartido(partido);
        if (tipo !== "WO" && tipo !== "RETIRADA") return "";

        const ganador = String(
            partido?.ganador_administrativo || partido?.ganador || ""
        ).trim();
        const motivo = String(partido?.motivo_resolucion || "").trim();
        const detalle = String(partido?.detalle_resolucion || "").trim();

        if (tipo === "WO") {
            return [
                ganador ? `${ganador} ganador por W.O.` : "Partido resuelto por W.O.",
                motivo,
                detalle
            ].filter(Boolean).join(" · ");
        }

        return [
            ganador ? `${ganador} ganador por retirada` : "Partido finalizado por retirada",
            motivo,
            detalle
        ].filter(Boolean).join(" · ");
    }

    function setsIncompletos(partido) {
        if (resolucionPartido(partido) !== "RETIRADA") return [];
        const detalle = Array.isArray(partido?.resultado_detalle)
            ? partido.resultado_detalle
            : [];

        return detalle
            .filter(set => set?.finalizado === false)
            .map(set => Number(set.numero_set))
            .filter(Number.isFinite);
    }

    function avisoResolucion(partido) {
        const texto = textoResolucion(partido);
        if (!texto) return "";

        const incompletos = setsIncompletos(partido);
        const notaSet = incompletos.length
            ? `<small>Marcador conservado. Set ${incompletos.join(", ")} sin finalizar.</small>`
            : "";

        return `
            <div class="avisoResolucionPublica ${resolucionPartido(partido) === "WO" ? "esWO" : "esRetirada"}">
                <strong>${escaparHTML(texto)}</strong>
                ${notaSet}
            </div>
        `;
    }

    function envolverTarjeta(nombreFuncion) {
        const original = window[nombreFuncion];
        if (typeof original !== "function") return;

        window[nombreFuncion] = function (partido) {
            const html = original.apply(this, arguments);
            const aviso = avisoResolucion(partido);
            if (!aviso || typeof html !== "string") return html;

            const posicion = html.lastIndexOf("</article>");
            return posicion >= 0
                ? `${html.slice(0, posicion)}${aviso}${html.slice(posicion)}`
                : `${html}${aviso}`;
        };
    }

    /* Las declaraciones function de app.js son propiedades globales en este script clásico. */
    envolverTarjeta("pintarCardPartido");
    envolverTarjeta("pintarCardPalas");

    const estilo = document.createElement("style");
    estilo.textContent = `
        .avisoResolucionPublica {
            margin: 10px 12px 12px;
            padding: 9px 11px;
            border-radius: 10px;
            background: rgba(245, 158, 11, .12);
            border: 1px solid rgba(245, 158, 11, .35);
            font-size: .82rem;
            line-height: 1.35;
        }
        .avisoResolucionPublica.esWO {
            background: rgba(239, 68, 68, .10);
            border-color: rgba(239, 68, 68, .30);
        }
        .avisoResolucionPublica strong,
        .avisoResolucionPublica small {
            display: block;
        }
        .avisoResolucionPublica small {
            margin-top: 3px;
            opacity: .78;
        }
    `;
    document.head.appendChild(estilo);
})();
