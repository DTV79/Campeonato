import { api } from "../api.js?v=20261002-0835";
import { fechaIsoDesdeInput } from "../model.js?v=20261001-1945";
import { borrarToken, obtenerToken } from "../session.js?v=20261001-1945";

import { mensajeFormulario, ejecutar } from "./formulario.js";
import { leerSets } from "./sets.js";

export function crearManejadorSubmit({ recargar, cerrarSesion }) {

    return async evento => {
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
