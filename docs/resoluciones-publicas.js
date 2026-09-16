/* Adaptación pública de W.O. y retiradas. */
(function activarResolucionesPublicas() {
    function normalizarResultadoResolucion(partido) {
        if (!partido || !Array.isArray(partido.resultado)) return partido;
        const detallado = partido.resultado.filter(set => set && typeof set === "object" && !Array.isArray(set));
        if (!detallado.length) return partido;
        partido.resultado_detalle = detallado;
        partido.resultado = partido.resultado.map(set => set && typeof set === "object" ? String(set.marcador || "") : set);
        return partido;
    }

    if (typeof normalizarListaSupabase === "function") {
        const base = normalizarListaSupabase;
        normalizarListaSupabase = function (lista, codigoFase) {
            return base(lista, codigoFase).map(normalizarResultadoResolucion);
        };
    }

    function resolucionPartido(partido) {
        return String(partido?.tipo_resolucion || "NORMAL").trim().toUpperCase();
    }

    function marcadorSet(partido, numeroSet) {
        const set = (Array.isArray(partido?.resultado_detalle) ? partido.resultado_detalle : [])
            .find(item => Number(item?.numero_set) === Number(numeroSet));
        return String(set?.marcador || "").trim();
    }

    function setsIncompletos(partido) {
        if (resolucionPartido(partido) !== "RETIRADA") return [];
        return (Array.isArray(partido?.resultado_detalle) ? partido.resultado_detalle : [])
            .filter(set => set?.finalizado === false)
            .map(set => Number(set.numero_set))
            .filter(Number.isFinite);
    }

    function avisoResolucion(partido) {
        const tipo = resolucionPartido(partido);
        if (tipo !== "WO" && tipo !== "RETIRADA") return "";

        const ganador = String(partido?.ganador_administrativo || partido?.ganador || "").trim();
        const motivo = String(partido?.motivo_resolucion || "").trim();
        const detalle = String(partido?.detalle_resolucion || "").trim();
        const titulo = tipo === "WO" ? "⚠️ W.O. / NO COMPARECENCIA" : "⚠️ RETIRADA";
        const ganadorHtml = ganador ? `<strong>Ganador: ${escaparHTML(ganador)}</strong>` : "";
        const motivoHtml = motivo ? `<span>${escaparHTML(motivo)}</span>` : "";
        const detalleHtml = detalle ? `<span>${escaparHTML(detalle)}</span>` : "";

        let notaSet = "";
        const incompletos = setsIncompletos(partido);
        if (incompletos.length) {
            notaSet = incompletos.map(numero => {
                const marcador = marcadorSet(partido, numero);
                const ordinal = numero === 1 ? "1.er" : `${numero}.º`;
                return `<small>${ordinal} set interrumpido${marcador ? ` con ${escaparHTML(marcador)}` : ""}</small>`;
            }).join("");
        }

        return `<div class="avisoResolucionPublica ${tipo === "WO" ? "esWO" : "esRetirada"}"><b class="tituloResolucionPublica">${titulo}</b>${ganadorHtml}${motivoHtml}${detalleHtml}${notaSet}</div>`;
    }

    function envolverTarjeta(nombreFuncion) {
        const original = window[nombreFuncion];
        if (typeof original !== "function") return;
        window[nombreFuncion] = function (partido) {
            normalizarResultadoResolucion(partido);
            const html = original.apply(this, arguments);
            const aviso = avisoResolucion(partido);
            if (!aviso || typeof html !== "string") return html;
            const posicion = html.lastIndexOf("</article>");
            return posicion >= 0 ? `${html.slice(0, posicion)}${aviso}${html.slice(posicion)}` : `${html}${aviso}`;
        };
    }

    envolverTarjeta("pintarCardPartido");
    envolverTarjeta("pintarCardPalas");

    const estilo = document.createElement("style");
    estilo.textContent = `.avisoResolucionPublica{margin:10px 12px 12px;padding:10px 12px;border-radius:10px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);font-size:.82rem;line-height:1.35}.avisoResolucionPublica.esWO{background:rgba(239,68,68,.10);border-color:rgba(239,68,68,.30)}.avisoResolucionPublica .tituloResolucionPublica{display:block;margin-bottom:5px;font-size:.84rem}.avisoResolucionPublica strong,.avisoResolucionPublica span,.avisoResolucionPublica small{display:block}.avisoResolucionPublica strong{margin-bottom:2px}.avisoResolucionPublica small{margin-top:5px;opacity:.78;font-style:italic}`;
    document.head.appendChild(estilo);
})();
