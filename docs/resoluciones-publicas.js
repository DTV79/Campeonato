/* Adaptación pública de W.O. y retiradas. */
(function activarResolucionesPublicas() {
    function normalizarResultadoResolucion(partido) {
        if (!partido || !Array.isArray(partido.resultado)) return partido;
        const detallado = partido.resultado.filter(
            set => set && typeof set === "object" && !Array.isArray(set)
        );
        if (!detallado.length) return partido;
        partido.resultado_detalle = detallado;
        partido.resultado = partido.resultado.map(set =>
            set && typeof set === "object" ? String(set.marcador || "") : set
        );
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

    function textoResolucion(partido) {
        const tipo = resolucionPartido(partido);
        if (tipo !== "WO" && tipo !== "RETIRADA") return "";
        const ganador = String(partido?.ganador_administrativo || partido?.ganador || "").trim();
        const motivo = String(partido?.motivo_resolucion || "").trim();
        const detalle = String(partido?.detalle_resolucion || "").trim();
        const principal = tipo === "WO"
            ? (ganador ? `${ganador} ganador por W.O.` : "Partido resuelto por W.O.")
            : (ganador ? `${ganador} ganador por retirada` : "Partido finalizado por retirada");
        return [principal, motivo, detalle].filter(Boolean).join(" · ");
    }

    function setsIncompletos(partido) {
        if (resolucionPartido(partido) !== "RETIRADA") return [];
        return (Array.isArray(partido?.resultado_detalle) ? partido.resultado_detalle : [])
            .filter(set => set?.finalizado === false)
            .map(set => Number(set.numero_set))
            .filter(Number.isFinite);
    }

    function avisoResolucion(partido) {
        const texto = textoResolucion(partido);
        if (!texto) return "";
        const incompletos = setsIncompletos(partido);
        const nota = incompletos.length
            ? `<small>Marcador conservado. Set ${incompletos.join(", ")} sin finalizar.</small>`
            : "";
        return `<div class="avisoResolucionPublica ${resolucionPartido(partido) === "WO" ? "esWO" : "esRetirada"}"><strong>${escaparHTML(texto)}</strong>${nota}</div>`;
    }

    function envolverTarjeta(nombreFuncion) {
        const original = window[nombreFuncion];
        if (typeof original !== "function") return;
        window[nombreFuncion] = function (partido) {
            /* Los datos pueden haber llegado antes de cargar este parche. */
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
    estilo.textContent = `.avisoResolucionPublica{margin:10px 12px 12px;padding:9px 11px;border-radius:10px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);font-size:.82rem;line-height:1.35}.avisoResolucionPublica.esWO{background:rgba(239,68,68,.10);border-color:rgba(239,68,68,.30)}.avisoResolucionPublica strong,.avisoResolucionPublica small{display:block}.avisoResolucionPublica small{margin-top:3px;opacity:.78}`;
    document.head.appendChild(estilo);
})();
