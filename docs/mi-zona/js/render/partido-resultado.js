import { equiposPorLado, esc } from "../model.js?v=20261002-1635";

export function htmlResultado(team, partido) {
    const equipos = equiposPorLado(team);
    const sets = partido?.sets || [];

    return `
        <div class="resultadoZona">
            <div class="resultadoFila">
                <strong>${esc(equipos.A?.nombre || "Equipo A")}</strong>
                ${[1,2,3].map(n => htmlPuntuacion(sets.find(s => Number(s.numero) === n), "A")).join("")}
            </div>
            <div class="resultadoFila">
                <strong>${esc(equipos.B?.nombre || "Equipo B")}</strong>
                ${[1,2,3].map(n => htmlPuntuacion(sets.find(s => Number(s.numero) === n), "B")).join("")}
            </div>
        </div>
    `;
}

function htmlPuntuacion(set, lado) {
    if (!set) return "<span>–</span>";
    const puntos = lado === "A" ? set.a : set.b;
    const tie = lado === "A" ? set.tiebreak_a : set.tiebreak_b;
    return `
        <span class="scoreSet">
            ${Number(puntos)}
            ${Number.isInteger(tie) ? `<sup>${tie}</sup>` : ""}
        </span>
    `;
}