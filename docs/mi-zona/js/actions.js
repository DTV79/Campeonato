import { crearManejadorClick } from "./actions/click.js";
import { crearManejadorSubmit } from "./actions/submit.js";

export function enlazarZona({ app, recargar, cerrarSesion }) {
    app.onclick = crearManejadorClick({ recargar, cerrarSesion });
    app.onsubmit = crearManejadorSubmit({ recargar, cerrarSesion });
}
