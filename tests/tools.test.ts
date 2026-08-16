import { describe, it, expect } from "vitest";
import { createRepositorySchema, listIssuesSchema } from "../src/schemas/index.js";

describe("createRepositorySchema", () => {
    it("acepta un input válido", () => {
        const result = createRepositorySchema.safeParse({
            name: "mi-repo-valido",
            isPrivate: true,
        });

        expect(result.success).toBe(true);
    });

    it("rechaza un nombre demasiado corto", () => {
        const result = createRepositorySchema.safeParse({
            name: "ab",
        });

        expect(result.success).toBe(false);
    });

    it("rechaza un nombre con caracteres inválidos", () => {
        const result = createRepositorySchema.safeParse({
            name: "repo con espacios!",
        });

        expect(result.success).toBe(false);
    });

    it("aplica el default de isPrivate cuando no se especifica", () => {
        const result = createRepositorySchema.safeParse({
            name: "mi-repo-valido",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.isPrivate).toBe(false);
        }
    });
});

describe("listIssuesSchema", () => {
    it("rechaza un state que no sea open, closed o all", () => {
        const result = listIssuesSchema.safeParse({
            owner: "alguien",
            repo: "algo",
            state: "pendiente",
        });

        expect(result.success).toBe(false);
    });

    it("aplica el default de state cuando no se especifica", () => {
        const result = listIssuesSchema.safeParse({
            owner: "alguien",
            repo: "algo",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.state).toBe("open");
        }
    });
});