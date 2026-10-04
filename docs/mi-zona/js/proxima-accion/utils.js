export function parejaTexto(lista = []) {
    return lista.map(j => j?.nombre).filter(Boolean).join(" / ");
}

export function partidoActual(team) {
    return [...(team?.partidos || [])]
        .sort((a,b) => Number(a?.numero || 0) - Number(b?.numero || 0))
        .find(p => !["finalizado","anulado"].includes(String(p?.estado || ""))) || null;
}

export function miEquipoAcepto(propuesta, partido) {
    const ids = new Set(
        (partido?.mi_alineacion || [])
            .map(j => j?.id)
            .filter(Boolean)
    );

    return (propuesta?.respuestas || []).some(
        r => r?.disponible === true && ids.has(r?.id_jugador)
    );
}
