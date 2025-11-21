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

function mostrarClasificacion(lista, fechaActualizacion) {
    const div = document.getElementById("clasificacion");

    // Convertir fecha de ISO a dd/mm/aaaa hh:mm
    const fecha = new Date(fechaActualizacion);
    const fechaFormateada =
        ("0" + fecha.getDate()).slice(2) + "/" +
        ("0" + (fecha.getMonth() + 1)).slice(2) + "/" +
        fecha.getFullYear() + " " +
        ("0" + fecha.getHours()).slice(2) + ":" +
        ("0" + fecha.getMinutes()).slice(2);

    div.innerHTML = `
        <h2>Clasificación</h2>
        <p class="fecha-actualizacion"><em>Actualizado: ${fechaFormateada}</em></p>
    `;

    // Por ahora flechas estáticas
    lista.forEach((e) => e.mov = "→");

    let html = `
        <div class="tabla-container">
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>POS</th>
                        <th>EQUIPO</th>
                        <th>PTOS</th>
                        <th>PJ</th>
                        <th>PG</th>
                        <th>PP</th>
                        <th>Des</th>
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
                <td class="mov">${eq.mov}</td>
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

        <div class="leyenda">
            <strong>Leyenda:</strong><br>
            PTOS: Puntos Totales / 
            PJ: Partidos Jugados / 
            PG: Partidos Ganados /  
            PP: Partidos Perdidos /  
            Des: Descanso / 
            SG: Sets Ganados / 
            SP: Sets Perdidos / 
            SD: Diferencia de Sets / 
            PGan: Puntos Ganados / 
            PPer: Puntos Perdidos / 
            PDif: Diferencia de Puntos
        </div>
    `;

    div.innerHTML += html;
}


function mostrarPartidos(lista) {
    const div = document.getElementById("partidos");
    div.innerHTML = "<h2>Partidos</h2>";
}

cargarDatos();
