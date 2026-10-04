import { esc } from "./model.js?v=20261002-1530";
import { htmlProximaAccion } from "./proxima-accion.js?v=20261004-1045";
import { renderCargando, renderError, renderLogin } from "./render/core.js?v=20261002-1530";
import { htmlConvocatorias } from "./render/convocatorias.js?v=20261002-1530";
import { htmlPreparacionTeams } from "./render/preparacion.js?v=20261002-1530";
import { htmlTeam } from "./render/teams.js?v=20261002-1635";

const app = document.getElementById("miZonaApp");

export { renderCargando, renderError, renderLogin };

export function renderZona(datos) {
    const jugador = datos?.jugador || {};
    const teams = Array.isArray(datos?.teams) ? datos.teams : [];
    const convocatorias = Array.isArray(datos?.convocatorias) ? datos.convocatorias : [];
    const preparacion = Array.isArray(datos?.preparacion) ? datos.preparacion : [];
    const campeonatos = Array.isArray(datos?.campeonatos) ? datos.campeonatos : [];

    const teamDirecto = [...preparacion,...teams].find(team =>
        !["finalizado","cancelado"].includes(String(team?.estado || "").toLowerCase())
    );

    const accesosDirectos = [
        teamDirecto?.id
            ? {
                href: "teams.html?team=" + encodeURIComponent(teamDirecto.id),
                icono: "⚔️",
                texto: "Ver Teams"
              }
            : null,
        campeonatos[0]?.codigo
            ? {
                href: "index.html?portal=0&campeonato=" + encodeURIComponent(campeonatos[0].codigo),
                icono: "🏆",
                texto: "Ver campeonato"
              }
            : null
    ].filter(Boolean);

    app.innerHTML = `
        <section class="zonaHero">
            <div>
                <p class="eyebrow">MI ZONA</p>
                <h1>Hola, ${esc(jugador.nombre || "Jugador")}</h1>
                <p>Tus competiciones, partidos y acciones pendientes.</p>
            </div>
            <div class="zonaHeroAcciones">
                ${accesosDirectos.map(acceso => `
                    <a class="btnCompeticionDirecta" href="${esc(acceso.href)}">
                        ${acceso.icono} ${esc(acceso.texto)}
                    </a>
                `).join("")}
                <details class="seguridadZona">
                    <summary>🔐 Seguridad</summary>
                    <form class="formAccion" data-form="cambiar-pin">
                        <label>
                            <span>PIN actual</span>
                            <input
                                name="pinActual"
                                type="password"
                                inputmode="numeric"
                                pattern="[0-9]*"
                                maxlength="8"
                                required
                            >
                        </label>

                        <div class="dosCampos">
                            <label>
                                <span>Nuevo PIN</span>
                                <input
                                    name="pinNuevo"
                                    type="password"
                                    inputmode="numeric"
                                    pattern="[0-9]*"
                                    maxlength="8"
                                    required
                                >
                            </label>
                            <label>
                                <span>Repite el nuevo PIN</span>
                                <input
                                    name="pinNuevo2"
                                    type="password"
                                    inputmode="numeric"
                                    pattern="[0-9]*"
                                    maxlength="8"
                                    required
                                >
                            </label>
                        </div>

                        <button class="btnPrimario" type="submit">Cambiar PIN</button>
                        <p class="mensajeForm" data-form-mensaje></p>
                    </form>
                </details>
                <button class="btnSalir" type="button" data-action="salir">Salir</button>
            </div>
        </section>

        ${htmlProximaAccion({ jugador, teams, convocatorias, preparacion })}

        <section class="zonaContenido">
            ${convocatorias.length ? htmlConvocatorias(convocatorias) : ""}
            ${preparacion.length ? htmlPreparacionTeams(preparacion) : ""}
            ${teams.length
                ? teams.map(team => htmlTeam(team, jugador)).join("")
                : (convocatorias.length || preparacion.length)
                    ? ""
                    : '<div class="vacio">No tienes convocatorias ni ediciones de Teams activas.</div>'}
        </section>
    `;
}