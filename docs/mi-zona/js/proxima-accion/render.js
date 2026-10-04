import { esc } from "../model.js?v=20261002-1450";

export function renderProximaAccion(item) {
    const meta =
        Array.isArray(item?.meta)
            ? item.meta
            : [];

    return `
        <section class="proximaAccion proximaAccion--${esc(item?.tipo || "ok")}">
            <div class="proximaAccionEtiqueta">
                <span>TU PRÓXIMA ACCIÓN</span>
                <b>${esc(item?.tipo === "pendiente" ? "PENDIENTE" : "AL DÍA")}</b>
            </div>
            <div class="proximaAccionCuerpo">
                <span class="proximaAccionIcono" aria-hidden="true">${item?.icono || "✓"}</span>
                <div class="proximaAccionTexto">
                    <small>${esc(item?.contexto || "")}</small>
                    <h2>${esc(item?.titulo || "")}</h2>
                    <p>${esc(item?.texto || "")}</p>
                    ${meta.length
                        ? `<div class="proximaAccionMeta">${meta.map(x => `<span>${esc(x)}</span>`).join("")}</div>`
                        : ""
                    }
                    ${item?.nota
                        ? `<em>${esc(item.nota)}</em>`
                        : ""
                    }
                </div>
                ${item?.href
                    ? `<a class="proximaAccionBoton" href="${esc(item.href)}">${esc(item?.boton || "Ver detalle")}</a>`
                    : ""
                }
            </div>
        </section>
    `;
}
