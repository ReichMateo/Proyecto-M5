import { describe, it, expect } from "vitest";
import {
    toUserMessage,
    ValidationError,
    GitHubAPIError,
    AuthenticationError,
    NetworkError,
} from "../src/errors/index.js";

describe("toUserMessage", () => {
    it("transforma un ValidationError en un mensaje claro", () => {
        const error = new ValidationError("El nombre debe tener al menos 3 caracteres");
        const message = toUserMessage(error);

        expect(message).toContain("no son válidos");
        expect(message).toContain("al menos 3 caracteres");
    });

    it("transforma un GitHubAPIError 404 en un mensaje de 'no encontrado'", () => {
        const error = new GitHubAPIError("Not Found", 404);
        const message = toUserMessage(error);

        expect(message).toBe(
            "El recurso solicitado no fue encontrado. Verificá el nombre e intentá de nuevo."
        );
    });

    it("transforma un GitHubAPIError 422 en un mensaje de conflicto", () => {
        const error = new GitHubAPIError("Unprocessable", 422);
        const message = toUserMessage(error);

        expect(message).toContain("ya existe");
    });

    it("transforma un AuthenticationError en un mensaje sobre el token", () => {
        const error = new AuthenticationError("Bad credentials");
        const message = toUserMessage(error);

        expect(message).toContain("token");
    });

    it("transforma un NetworkError en un mensaje de conexión", () => {
        const error = new NetworkError("ECONNREFUSED");
        const message = toUserMessage(error);

        expect(message).toContain("conexión");
    });

    it("devuelve un mensaje genérico para un error no anticipado", () => {
        const error = new Error("Algo totalmente inesperado");
        const message = toUserMessage(error);

        expect(message).toBe("Ocurrió un error inesperado. Intentá de nuevo.");
    });
});