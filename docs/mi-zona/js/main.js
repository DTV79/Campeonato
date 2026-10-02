import { api } from "./api.js?v=20261002-1145";
import { enlazarZona } from "./actions.js?v=20261002-0835";
import { renderCargando, renderError, renderLogin, renderZona } from "./render.js?v=20261002-1635";
import { borrarToken, guardarToken, obtenerToken } from "./session.js?v=20261001-1945";

const app = document.getElementById("miZonaApp");

async function cargarLogin(mensaje = "") {
    renderCargando("Preparando acceso…");

    try {
        const jugadores = await api.jugadores();
        const lista = Array.isArray(jugadores) ? jugadores : [];
        renderLogin(lista, mensaje);

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

                if (respuesta?.error) throw new Error(respuesta.error);
                if (!respuesta?.token) throw new Error("No se pudo iniciar la sesión.");

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

        const formSolicitud = app.querySelector('[data-form="solicitar-alta"]');
        formSolicitud?.addEventListener("submit", async evento => {
            evento.preventDefault();

            const boton = formSolicitud.querySelector('button[type="submit"]');
            const mensajeNodo = formSolicitud.querySelector("[data-solicitud-mensaje]");
            const pin = formSolicitud.elements.pin.value.trim();
            const pin2 = formSolicitud.elements.pin2.value.trim();
            const jugadorId = formSolicitud.elements.jugador.value;

            if (!/^[0-9]{4,8}$/.test(pin)) {
                mensajeNodo.textContent = "El PIN debe tener entre 4 y 8 cifras.";
                mensajeNodo.classList.add("visible", "error");
                return;
            }

            if (pin !== pin2) {
                mensajeNodo.textContent = "Los dos PIN no coinciden.";
                mensajeNodo.classList.add("visible", "error");
                return;
            }

            boton.disabled = true;
            mensajeNodo.textContent = "Enviando solicitud…";
            mensajeNodo.classList.add("visible");
            mensajeNodo.classList.remove("error");

            try {
                const respuesta = await api.solicitarAlta(jugadorId, pin);

                if (respuesta?.error) throw new Error(respuesta.error);
                if (respuesta?.estado !== "pendiente") {
                    throw new Error("No se pudo registrar la solicitud.");
                }

                const panel = app.querySelector("[data-alta-codigo-panel]");
                const formCodigo = app.querySelector('[data-form="completar-alta"]');
                const jugadorNodo = app.querySelector("[data-alta-jugador]");
                const jugador = lista.find(item => item.id === jugadorId);
                const alias = jugador?.alias || jugador?.nombre || jugador?.nombre_oficial || "";
                const nombreOficial = jugador?.nombre_oficial || "";
                const textoJugador = nombreOficial && nombreOficial !== alias
                    ? `${alias} — ${nombreOficial}`
                    : alias;

                if (formCodigo) formCodigo.elements.jugador.value = jugadorId;
                if (jugadorNodo) jugadorNodo.textContent = textoJugador;
                panel?.classList.remove("oculto");
                formSolicitud.classList.add("oculto");

                mensajeNodo.textContent = "";
                mensajeNodo.classList.remove("visible", "error");
                panel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            } catch (error) {
                boton.disabled = false;
                mensajeNodo.textContent = error?.message || "No se pudo enviar la solicitud.";
                mensajeNodo.classList.add("visible", "error");
            }
        });

        const formCodigo = app.querySelector('[data-form="completar-alta"]');
        formCodigo?.addEventListener("submit", async evento => {
            evento.preventDefault();

            const boton = formCodigo.querySelector('button[type="submit"]');
            const mensajeNodo = formCodigo.querySelector("[data-codigo-mensaje]");
            const codigo = formCodigo.elements.codigo.value.trim();

            if (!/^[0-9]{6}$/.test(codigo)) {
                mensajeNodo.textContent = "El código de acceso debe tener 6 cifras.";
                mensajeNodo.classList.add("visible", "error");
                return;
            }

            boton.disabled = true;
            mensajeNodo.textContent = "Comprobando código…";
            mensajeNodo.classList.add("visible");
            mensajeNodo.classList.remove("error");

            try {
                const respuesta = await api.completarAlta(
                    formCodigo.elements.jugador.value,
                    codigo
                );

                if (respuesta?.error) throw new Error(respuesta.error);
                if (!respuesta?.token) throw new Error("No se pudo activar el acceso.");

                guardarToken(respuesta.token);
                await cargarZona();
            } catch (error) {
                boton.disabled = false;
                mensajeNodo.textContent = error?.message || "No se pudo activar el acceso.";
                mensajeNodo.classList.add("visible", "error");
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
        const [datos, convocatorias, preparacion, campeonatos] = await Promise.all([
            api.zona(token),
            api.convocatorias(token),
            api.preparacion(token),
            api.campeonatos(token)
        ]);

        renderZona({
            ...(datos || {}),
            convocatorias: Array.isArray(convocatorias) ? convocatorias : [],
            preparacion: Array.isArray(preparacion) ? preparacion : [],
            campeonatos: Array.isArray(campeonatos) ? campeonatos : []
        });
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
