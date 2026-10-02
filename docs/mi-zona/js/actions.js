import { api } from "./api.js?v=20261002-0835";
import { fechaIsoDesdeInput } from "./model.js?v=20261001-1945";
import { borrarToken, obtenerToken } from "./session.js?v=20261001-1945";

function mensajeFormulario(form, texto, error = false) {
    const nodo = form?.querySelector("[data-form-mensaje]");
    if (!nodo) return;
    nodo.textContent = texto || "";
    nodo.classList.toggle("visible", Boolean(texto));
    nodo.classList.toggle("error", error);
}

function bloquearFormulario(form, bloqueado) {
    form?.querySelectorAll("button,input,select,textarea").forEach(control => {
        control.disabled = bloqueado;
    });
}

async function ejecutar(form, tarea, recargar) {
    bloquearFormulario(form, true);
    mensajeFormulario(form, "Guardando…");

    try {
        await tarea();
        mensajeFormulario(form, "Guardado correctamente.");
        await recargar();
    } catch (error) {
        mensajeFormulario(form, error?.message || "No se pudo completar la operación.", true);
        bloquearFormulario(form, false);
    }
}

function leerSets(form) {
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

export function enlazarZona({ app, recargar, cerrarSesion }) {
    app.onclick = async evento => {
        const boton = evento.target.closest("[data-action]");
        if (!boton) return;

        const accion = boton.dataset.action;
        const token = obtenerToken();

        if (accion === "salir") {
            boton.disabled = true;
            await cerrarSesion();
            return;
        }

        if (accion === "reintentar") {
            await recargar();
            return;
        }

        if (accion === "mostrar-reprogramar") {
            const card = boton.closest(".accionPanel");
            const form = card?.querySelector('[data-form="reprogramar"]');
            form?.classList.toggle("oculto");
            return;
        }

        if (accion === "editar-pista") {
            const card = boton.closest(".accionPanel");
            const form = card?.querySelector('[data-form="pista"]');
            form?.classList.toggle("oculto");
            return;
        }

        if (!token) {
            borrarToken();
            await cerrarSesion(false);
            return;
        }

        try {
            if (accion === "votar-capitan") {
                boton.disabled = true;
                await api.votarCapitan(
                    token,
                    boton.dataset.teamId,
                    boton.dataset.candidatoId
                );
                await recargar();
                return;
            }

            if (accion === "capitan-listo") {
                boton.disabled = true;
                await api.capitanListo(
                    token,
                    boton.dataset.teamId,
                    boton.dataset.listo === "1"
                );
                await recargar();
                return;
            }

            if (accion === "convocatoria") {
                const contenedor = boton.closest(".convocatoriaCard");
                contenedor?.querySelectorAll('[data-action="convocatoria"]').forEach(b => {
                    b.disabled = true;
                });

                const equipoId =
                    contenedor?.querySelector("[data-convocatoria-equipo]")?.value || null;

                await api.responderConvocatoria(
                    token,
                    boton.dataset.teamId,
                    boton.dataset.estado,
                    equipoId
                );
                await recargar();
                return;
            }

            if (accion === "disponibilidad") {
                boton.disabled = true;
                await api.disponibilidad(
                    token,
                    boton.dataset.teamId,
                    boton.dataset.jugadorId,
                    boton.dataset.disponible !== "1"
                );
                await recargar();
                return;
            }

            if (accion === "responder-horario") {
                boton.disabled = true;
                await api.responderHorario(
                    token,
                    boton.dataset.propuestaId,
                    boton.dataset.disponible === "1"
                );
                await recargar();
                return;
            }

            if (accion === "confirmar-resultado") {
                boton.disabled = true;
                boton.textContent = "Confirmando…";
                await api.confirmarResultado(token, boton.dataset.partidoId);
                await recargar();
                return;
            }

            if (accion === "quitar-horario") {
                if (boton.dataset.confirmar !== "1") {
                    boton.dataset.confirmar = "1";
                    boton.textContent = "Pulsa otra vez para eliminar";
                    setTimeout(() => {
                        if (boton.isConnected) {
                            boton.dataset.confirmar = "0";
                            boton.textContent = "Eliminar fecha";
                        }
                    }, 5000);
                    return;
                }

                boton.disabled = true;
                await api.quitarHorario(token, boton.dataset.partidoId);
                await recargar();
            }
        } catch (error) {
            boton.disabled = false;
            boton.textContent = boton.dataset.textoOriginal || boton.textContent;
            const contenedor = boton.closest(".accionPanel,.confirmacionResultado,.miembroFila,.convocatoriaCard,.preparacionTeamCard");
            let aviso = contenedor?.querySelector(".errorAccion");
            if (!aviso && contenedor) {
                aviso = document.createElement("p");
                aviso.className = "errorAccion";
                contenedor.appendChild(aviso);
            }
            if (aviso) aviso.textContent = error?.message || "No se pudo completar la operación.";
        }
    };

    app.onsubmit = async evento => {
        const form = evento.target.closest("form[data-form]");
        if (!form) return;

        evento.preventDefault();
        const token = obtenerToken();
        if (!token) {
            borrarToken();
            await cerrarSesion(false);
            return;
        }

        const tipo = form.dataset.form;
        const partidoId = form.dataset.partidoId;

        if (tipo === "cambiar-pin") {
            const pinActual = form.elements.pinActual.value;
            const pinNuevo = form.elements.pinNuevo.value;
            const pinNuevo2 = form.elements.pinNuevo2.value;

            if (!/^[0-9]{4,8}$/.test(pinNuevo)) {
                mensajeFormulario(form, "El nuevo PIN debe tener entre 4 y 8 cifras.", true);
                return;
            }

            if (pinNuevo !== pinNuevo2) {
                mensajeFormulario(form, "Los dos nuevos PIN no coinciden.", true);
                return;
            }

            await ejecutar(form, () => api.cambiarPin(
                token,
                pinActual,
                pinNuevo
            ), async () => {
                form.reset();
            });
            return;
        }

        if (tipo === "alineacion") {
            await ejecutar(form, () => api.guardarAlineacion(
                token,
                partidoId,
                form.elements.jugador1.value,
                form.elements.jugador2.value
            ), recargar);
            return;
        }

        if (tipo === "horario") {
            const fecha = fechaIsoDesdeInput(form.elements.fecha.value);
            if (!fecha) {
                mensajeFormulario(form, "Indica una fecha y hora válidas.", true);
                return;
            }

            await ejecutar(form, () => api.proponerHorario(
                token,
                partidoId,
                fecha,
                form.elements.pista.value
            ), recargar);
            return;
        }

        if (tipo === "reprogramar") {
            const fecha = fechaIsoDesdeInput(form.elements.fecha.value);
            if (!fecha) {
                mensajeFormulario(form, "Indica una fecha y hora válidas.", true);
                return;
            }

            await ejecutar(form, () => api.reprogramarHorario(
                token,
                partidoId,
                fecha,
                form.elements.pista.value
            ), recargar);
            return;
        }

        if (tipo === "pista") {
            await ejecutar(form, () => api.actualizarPista(
                token,
                partidoId,
                form.elements.pista.value
            ), recargar);
            return;
        }

        if (tipo === "resultado") {
            let sets;
            try {
                sets = leerSets(form);
            } catch (error) {
                mensajeFormulario(form, error.message, true);
                return;
            }

            const finalizacion = form.elements.finalizacion.value;
            if (finalizacion === "normal" && sets.length < 2) {
                mensajeFormulario(form, "Introduce al menos los sets disputados.", true);
                return;
            }

            await ejecutar(form, () => api.guardarResultado(token, {
                partidoId,
                sets,
                finalizacion,
                ganador: form.elements.ganador.value || null,
                duracion: form.elements.duracion.value
                    ? Number(form.elements.duracion.value)
                    : null,
                pista: form.elements.pista.value,
                observaciones: form.elements.observaciones.value
            }), recargar);
            return;
        }

        if (tipo === "impugnar") {
            const motivo = form.elements.motivo.value.trim();
            if (!motivo) {
                mensajeFormulario(form, "Explica el motivo de la impugnación.", true);
                return;
            }

            await ejecutar(form, () => api.impugnarResultado(
                token,
                partidoId,
                motivo
            ), recargar);
        }
    };
}
