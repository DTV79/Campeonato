export function mensajeFormulario(form, texto, error = false) {
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

export async function ejecutar(form, tarea, recargar) {
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

