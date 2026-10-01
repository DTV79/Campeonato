import { TOKEN_KEY } from "./config.js";

export function obtenerToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
}

export function guardarToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function borrarToken() {
    localStorage.removeItem(TOKEN_KEY);
}
