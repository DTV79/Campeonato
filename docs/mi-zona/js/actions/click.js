import { api } from "../api.js?v=20261002-0835";
import { borrarToken, obtenerToken } from "../session.js?v=20261001-1945";


export function crearManejadorClick({ recargar, cerrarSesion }) {
    return async evento => {
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

}
