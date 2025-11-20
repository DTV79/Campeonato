async function cargarDatos() {
    const res = await fetch(DATA_URL);
    const data = await res.json();

    mostrarClasificacion(data.clasificacion);
    mostrarPartidos(data.partidos);
}

function mostrar(pagina) {
    document.querySelectorAll('.pagina').forEach(p => p.style.display = 'none');
    document.getElementById(pagina).style.display = 'block';
}

function mostrarClasificacion(lista) {
    const div = document.getElementById("clasificacion");
    div.innerHTML = "<h2>Clasificación</h2>";

    lista.forEach(eq => {
        div.innerHTML += `
            <div class="tarjeta">
                <h3>${eq.equipo}</h3>
                <p><strong>Puntos:</strong> ${eq.puntos_totales}</p>
                <p><strong>Partidos:</strong> ${eq.pj} jugados · ${eq.pg} ganados</p>
                <p><strong>Sets:</strong> ${eq.sets_ganados}-${eq.sets_perdidos}</p>
            </div>
        `;
    });
}

function mostrarPartidos(lista) {
    const div = document.getElementById("partidos");
    div.innerHTML = "<h2>Partidos</h2>";

    lista.forEach(p => {
        let sets = p.resultado.join(" | ");
        if (sets === "") sets = "—";

        div.innerHTML += `
            <div class="tarjeta">
                <h3>Jornada ${p.jornada}</h3>
                <p><strong>${p.local}</strong> vs <strong>${p.visitante}</strong></p>
                <p><strong>Resultado:</strong> ${sets}</p>
                <p><em>${p.estado}</em></p>
            </div>
        `;
    });
}

cargarDatos();

