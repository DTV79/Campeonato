import { api } from "./api.js";
import { enlazarZona } from "./actions.js";
import { renderCargando, renderError, renderLogin, renderZona } from "./render.js";
import { borrarToken, guardarToken, obtenerToken } from "./session.js";

const app = document.getElementById("miZonaApp");

async function cargarLogin(mensaje = "") {
    renderCargando("Preparando acceso…");

    try {
        const jugadores = await api.jugadores();
        renderLogin(Array.isArray(jugadores) ? jugadores : [], mensaje);

        const form = app.querySelector('[data-form="login"]');
        form?.addEventListener("submit", async evento => {
            evento.preventDefault();

            const boton = form.querySelector('button[type="submit"]');
            const mensajeNodo = form.querySelector("[data-login-mensaje]");
            boton.disabled = true;
            if (mensajeNodo) {
                mensajeNodo.textContent = "Comprobando acceso…";
                mensajeNodo.classList.add("visible");
                mensajeNodo.classList.remove("error");
            }

            try {
                const respuesta = await api.login(
                    form.elements.jugador.value,
                    form.elements.pin.value
                );

                if (!respuesta?.token) {
                    throw new Error("No se pudo iniciar la sesión.");
                }

                guardarToken(respuesta.token);
                await cargarZona();
            } catch (error) {
                boton.disabled = false;
                if (mensajeNodo) {
                    mensajeNodo.textContent = error?.message || "No se pudo iniciar la sesión.";
                    mensajeNodo.classList.add("visible", "error");
                }
            }
        });
    } catch (error) {
        renderError(error?.message || "No se pudo cargar el acceso a Mi Zona.");
        enlazarZona({
            app,
            recargar: () => cargarLogin(),
            cerrarSesion: () => cargarLogin()
        });
    }
}

async function cerrarSesion(llamarServidor = true) {
    const token = obtenerToken();

    if (llamarServidor && token) {
        try {
            await api.logout(token);
        } catch {
            // Borramos igualmente la sesión local.
        }
    }

    borrarToken();
    await cargarLogin();
}

async function cargarZona() {
    const token = obtenerToken();

    if (!token) {
        await cargarLogin();
        return;
    }

    renderCargando();

    try {
        const datos = await api.zona(token);
        renderZona(datos || {});
        enlazarZona({
            app,
            recargar: cargarZona,
            cerrarSesion
        });
    } catch (error) {
        const mensaje = error?.message || "No se pudo cargar Mi Zona.";

        if (/sesión|sesion|caducada|token/i.test(mensaje)) {
            borrarToken();
            await cargarLogin("Tu sesión ha caducado. Vuelve a entrar.");
            return;
        }

        renderError(mensaje);
        enlazarZona({
            app,
            recargar: cargarZona,
            cerrarSesion
        });
    }
}

cargarZona();
