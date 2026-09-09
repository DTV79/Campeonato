/*
   Ajustes de presentación para los datos de estructura todavía no decididos.
   Se carga justo después de app.js, antes de que finalice la consulta inicial
   a Supabase, y sustituye únicamente la pantalla informativa del pretorneo.
*/

function valorPendientePretorneo(valor) {
    const texto = String(valor ?? "").trim();

    if (
        !texto ||
        texto === "-" ||
        texto === "—" ||
        normalizar(texto) === "PENDIENTE" ||
        normalizar(texto) === "PENDIENTE DE CONFIRMAR"
    ) {
        return "—";
    }

    return texto;
}

function textoSiNoPendiente(valor) {
    const texto = normalizar(valor);

    if (
        valor === true ||
        ["SI", "SÍ", "TRUE", "1"].includes(texto)
    ) {
        return "Sí";
    }

    if (
        valor === false ||
        ["NO", "FALSE", "0"].includes(texto)
    ) {
        return "No";
    }

    return "—";
}

function pintarPantallaInformacionPretorneo() {
    const contenido = obtenerContenidoDetalle();

    if (!contenido) return;

    const config = obtenerConfiguracion();

    const tieneTipoCampeonato =
        Object.prototype.hasOwnProperty.call(
            config,
            "tipo_campeonato"
        );

    const tipoCampeonato = tieneTipoCampeonato
        ? valorPendientePretorneo(
            config.tipo_campeonato
        )
        : valorPendientePretorneo(
            config.sistema_primera_fase
        );

    const rondaInicial =
        valorPendientePretorneo(
            config.ronda_inicial_eliminatorias
        );

    contenido.innerHTML = `
        <h2>📅 Campeonato</h2>

        <section class="resumenPartidos">
            <div class="estadoResumen">
                🎾 Información de la próxima edición
            </div>
        </section>

        ${pintarAvisoProximaEdicion(config)}

        <div class="listaOpcionesMas">
            ${pintarDatoPretorneo(
                "📅",
                "Fecha",
                formatearFechaCampeonato()
            )}

            ${pintarDatoPretorneo(
                "📍",
                "Lugar",
                obtenerLugarCampeonato()
            )}

            ${pintarDatoPretorneo(
                "🕒",
                "Horario",
                obtenerHorarioCampeonato() || "Pendiente de confirmar"
            )}

            ${pintarDatoPretorneo(
                "🏁",
                "Primera fase",
                tipoCampeonato
            )}

            ${pintarDatoPretorneo(
                "⚔️",
                "Eliminatorias",
                rondaInicial
            )}

            ${pintarDatoPretorneo(
                "🏖️",
                "Copa Palas Playa",
                textoSiNoPendiente(
                    config.hay_copa_palas_playa
                )
            )}
        </div>
    `;
}
