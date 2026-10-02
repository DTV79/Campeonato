import { esc } from "../model.js?v=20261002-1530";

const app = document.getElementById("miZonaApp");

export function renderCargando(texto = "Cargando Mi Zona…") {
    app.innerHTML = `
        <section class="estadoPagina">
            <div class="spinner" aria-hidden="true"></div>
            <p>${esc(texto)}</p>
        </section>
    `;
}

export function renderError(mensaje, reintentar = true) {
    app.innerHTML = `
        <section class="estadoPagina estadoError">
            <strong>No se pudo completar la operación</strong>
            <p>${esc(mensaje || "Ha ocurrido un error.")}</p>
            ${reintentar ? '<button type="button" data-action="reintentar">Reintentar</button>' : ""}
        </section>
    `;
}

export function renderLogin(jugadores = [], mensaje = "") {
    const opcionesLogin = jugadores.map(j => `
        <option value="${esc(j.id)}">${esc(j.alias || j.nombre || j.nombre_oficial)}</option>
    `).join("");

    const opcionesAlta = jugadores.map(j => {
        const alias = j.alias || j.nombre || j.nombre_oficial;
        const nombre = j.nombre_oficial || "";
        const texto = nombre && nombre !== alias
            ? `${alias} — ${nombre}`
            : alias;

        return `
            <option value="${esc(j.id)}">${esc(texto)}</option>
        `;
    }).join("");

    app.innerHTML = `
        <section class="loginCard">
            <a class="volver" href="index.html">← Sprint Pádel</a>
            <div class="loginIcono">🔐</div>
            <p class="eyebrow">SPRINT PÁDEL</p>
            <h1>Mi Zona</h1>
            <p class="intro">
                Entra con tu PIN personal. Si es tu primera vez, solicita el acceso
                y el administrador te facilitará un código de verificación.
            </p>

            <form class="loginForm" data-form="login">
                <label>
                    <span>Jugador</span>
                    <select name="jugador" required>
                        <option value="">Selecciona tu nombre</option>
                        ${opcionesLogin}
                    </select>
                </label>

                <label>
                    <span>PIN personal</span>
                    <input
                        name="pin"
                        type="password"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        maxlength="8"
                        autocomplete="current-password"
                        placeholder="••••"
                        required
                    >
                </label>

                <p class="mensajeForm ${mensaje ? "visible" : ""}" data-login-mensaje>
                    ${esc(mensaje)}
                </p>

                <button class="btnPrimario" type="submit">Entrar a Mi Zona</button>
            </form>

            <details class="altaPanel">
                <summary>¿Es tu primera vez? Crear mi acceso</summary>

                <form class="loginForm altaForm" data-form="solicitar-alta">
                    <label>
                        <span>Jugador</span>
                        <select name="jugador" required>
                            <option value="">Selecciona tu nombre</option>
                            ${opcionesAlta}
                        </select>
                    </label>

                    <div class="dosCampos">
                        <label>
                            <span>Elige tu PIN</span>
                            <input
                                name="pin"
                                type="password"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="8"
                                placeholder="4–8 cifras"
                                required
                            >
                        </label>

                        <label>
                            <span>Repite tu PIN</span>
                            <input
                                name="pin2"
                                type="password"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="8"
                                placeholder="4–8 cifras"
                                required
                            >
                        </label>
                    </div>

                    <p class="mensajeForm" data-solicitud-mensaje></p>
                    <button class="btnPrimario" type="submit">Solicitar acceso</button>
                </form>

                <div class="altaCodigoPanel oculto" data-alta-codigo-panel>
                    <div class="altaCodigoEstado">
                        <span>✓ Solicitud enviada</span>
                        <strong data-alta-jugador></strong>
                        <p>
                            El administrador ya puede ver que estás solicitando el alta.
                            Cuando te facilite el código, introdúcelo aquí.
                        </p>
                    </div>

                    <form class="loginForm altaForm" data-form="completar-alta">
                        <input type="hidden" name="jugador">

                        <label>
                            <span>Código de acceso</span>
                            <input
                                name="codigo"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="6"
                                placeholder="6 cifras"
                                autocomplete="one-time-code"
                                required
                            >
                        </label>

                        <p class="mensajeForm" data-codigo-mensaje></p>
                        <button class="btnPrimario" type="submit">Activar Mi Zona</button>
                    </form>
                </div>

                <small class="notaLogin">
                    Tu PIN lo eliges tú. El administrador no puede verlo.
                </small>
            </details>

            <small class="notaLogin">
                ¿Has olvidado tu PIN? Pide al administrador que restablezca tu acceso.
            </small>
        </section>
    `;
}