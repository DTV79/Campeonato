export function leerSets(form) {
    const sets = [];

    for (let numero = 1; numero <= 3; numero += 1) {
        const a = form.elements[`a${numero}`]?.value?.trim() ?? "";
        const b = form.elements[`b${numero}`]?.value?.trim() ?? "";
        const ta = form.elements[`tba${numero}`]?.value?.trim() ?? "";
        const tb = form.elements[`tbb${numero}`]?.value?.trim() ?? "";

        if (!a && !b && !ta && !tb) continue;

        if (!a || !b) {
            throw new Error(`Completa los dos marcadores del set ${numero}.`);
        }

        sets.push({
            numero,
            a: Number(a),
            b: Number(b),
            tiebreak_a: ta === "" ? null : Number(ta),
            tiebreak_b: tb === "" ? null : Number(tb)
        });
    }

    return sets;
}

