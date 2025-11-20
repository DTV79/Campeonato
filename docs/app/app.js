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

    let html = `
        <div class="tabla-container">
            <table>
                <thead>
                    <tr>
                        <th>POS</th>
                        <th>EQUIPO</th>
                        <th>PTOS</th>
                        <th>PJ</th>
                        <th>PG</th>
                        <th>PP</th>
                        <th>D</th>
                        <th>SG</th>
                        <th>SP</th>
                        <th>SD</th>
                        <th>PGan</th>
                        <th>PPer</th>
                        <th>PDif</th>
                    </tr>
                </thead>
                <tbody>
    `;

    lista.forEach((eq, index) => {
        html += `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td><strong>${eq.equipo}</strong></td>
                <td><strong>${eq.puntos_totales}</strong></td>
                <td>${eq.pj}</td>
                <td>${eq.pg}</td>
                <td>${eq.pp}</td>
                <td>${eq.descanso}</td>
                <td>${eq.sets_ganados}</td>
                <td>${eq.sets_perdidos}</td>
                <td>${eq.sets_diff}</td>
                <td>${eq.puntos_ganados}</td>
                <td>${eq.puntos_perdidos}</td>
                <td>${eq.puntos_diff}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    div.innerHTML += html;
}

function mostrarPartidos(lista) {
    const div = document.getElementById("partidos");
    div.innerHTML = "<h2>Partidos</h2>";
}

cargarDatos();
